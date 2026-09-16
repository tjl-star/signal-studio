from __future__ import annotations
import json,sqlite3,tempfile,zipfile
from contextlib import closing
from datetime import datetime
from pathlib import Path
from app.database import default_database_path
def create_backup(output_dir:Path)->Path:
    database=default_database_path()
    if not database.exists():raise FileNotFoundError(f"数据库不存在：{database}")
    output_dir.mkdir(parents=True,exist_ok=True);stamp=datetime.now().strftime("%Y%m%d-%H%M%S");archive=output_dir/f"signal-studio-backup-{stamp}.zip"
    with tempfile.TemporaryDirectory(prefix="signal-studio-backup-") as temp:
        snapshot=Path(temp)/database.name
        with closing(sqlite3.connect(database)) as source,closing(sqlite3.connect(snapshot)) as target:source.backup(target)
        manifest={"format":1,"created_at":datetime.now().isoformat(timespec="seconds"),"database":database.name}
        with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED) as bundle:
            bundle.write(snapshot,f"runtime/{database.name}");bundle.writestr("manifest.json",json.dumps(manifest,ensure_ascii=False,indent=2))
            runtime=database.parent
            for name in ("config.json","manual-mappings.json"):
                path=runtime/name
                if path.exists():bundle.write(path,f"runtime/{name}")
    return archive
def restore_backup(archive:Path,confirmed:bool)->Path:
    if not confirmed:raise ValueError("恢复操作需要 --confirm")
    archive=archive.resolve()
    if not archive.is_file():raise FileNotFoundError(f"备份不存在：{archive}")
    database=default_database_path();allowed={f"runtime/{database.name}","runtime/config.json","runtime/manual-mappings.json","manifest.json"}
    with zipfile.ZipFile(archive) as bundle:
        names=set(bundle.namelist())
        if f"runtime/{database.name}" not in names or not names<=allowed:raise ValueError("备份结构无效或包含非预期文件")
        with tempfile.TemporaryDirectory(prefix="signal-studio-restore-") as temp:
            temp_root=Path(temp);bundle.extractall(temp_root);restored=temp_root/"runtime"/database.name
            with closing(sqlite3.connect(restored)) as connection:
                result=connection.execute("PRAGMA integrity_check").fetchone()
                if not result or result[0]!="ok":raise ValueError("备份数据库完整性检查失败")
            database.parent.mkdir(parents=True,exist_ok=True);restored.replace(database)
            for name in ("config.json","manual-mappings.json"):
                source=temp_root/"runtime"/name
                if source.exists():source.replace(database.parent/name)
    return database

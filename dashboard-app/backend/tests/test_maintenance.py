import sqlite3,zipfile
from app import maintenance
def test_backup_and_restore_validated_database(tmp_path,monkeypatch):
    database=tmp_path/"runtime"/"signal-studio-v1.db";database.parent.mkdir();connection=sqlite3.connect(database);connection.execute("create table sample(value text)");connection.execute("insert into sample values ('before')");connection.commit();connection.close();monkeypatch.setattr(maintenance,"default_database_path",lambda:database)
    archive=maintenance.create_backup(tmp_path/"backups");assert archive.exists()
    connection=sqlite3.connect(database);connection.execute("update sample set value='after'");connection.commit();connection.close();maintenance.restore_backup(archive,True)
    connection=sqlite3.connect(database);assert connection.execute("select value from sample").fetchone()[0]=="before";connection.close()
    with zipfile.ZipFile(archive) as bundle:assert "manifest.json" in bundle.namelist()

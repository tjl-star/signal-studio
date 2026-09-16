from __future__ import annotations
import json
from datetime import UTC, date, datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database
from app.models import ResourcePlacementMetric, SyncRun

BATCH_SIZE = 150

def _rows(path: Path):
    value=json.loads(path.read_text(encoding="utf-8-sig")); return value.get("rows", []) if isinstance(value, dict) else value

def import_resource_snapshots(section_file: Path, banner_file: Path, popup_file: Path, database_url: str | None=None) -> dict:
    now=datetime.now(UTC); records=[]
    for row in _rows(section_file):
        key=f"{row.get('channel','')}|{row.get('group_name','')}"
        records.append(dict(resource_type="section",date=date.fromisoformat(row["date"]),identity_key=key,name=row.get("group_name") or "未命名板块",channel=row.get("channel"),position=None,client="android_rrsp_xb",exposure_pv=row.get("exposure_count"),exposure_uv=row.get("exposure_user"),click_pv=row.get("click_count"),click_uv=row.get("click_user"),jump_pv=None,jump_uv=None,play_pv=None,play_uv=None,ctr=row.get("ctr_uv"),conversion_rate=None,play_rate=None,source="data_provider/sectionData",synced_at=now))
    for row in _rows(banner_file):
        key="|".join(str(row.get(k,"")) for k in ("clienttype_raw","position_id","banner_position","title"))
        records.append(dict(resource_type="banner",date=date.fromisoformat(row["date"]),identity_key=key,name=row.get("title") or "未命名Banner",channel=row.get("channel"),position=f"{row.get('position_id','')} / {row.get('banner_position','')}",client=row.get("clienttype_raw"),exposure_pv=row.get("exposure_pv"),exposure_uv=row.get("exposure_uv"),click_pv=row.get("click_pv"),click_uv=row.get("click_uv"),jump_pv=None,jump_uv=None,play_pv=None,play_uv=None,ctr=row.get("ctr_uv"),conversion_rate=None,play_rate=None,source="data_provider/bannerClickData",synced_at=now))
    for row in _rows(popup_file):
        key=f"{row.get('id','')}|{row.get('name','')}"
        records.append(dict(resource_type="popup",date=date.fromisoformat(row["date"]),identity_key=key,name=row.get("name") or "未命名弹窗",channel=None,position=row.get("id"),client="android_rrsp_xb",exposure_pv=row.get("expost_pv"),exposure_uv=row.get("expost_uv"),click_pv=row.get("click_pv"),click_uv=row.get("click_uv"),jump_pv=row.get("jump_pv"),jump_uv=row.get("jump_uv"),play_pv=row.get("play_pv"),play_uv=row.get("play_uv"),ctr=row.get("ctr"),conversion_rate=row.get("conversion_rate"),play_rate=row.get("play_rate"),source="data_provider/popupWindowData",synced_at=now))
    url=database_url or default_database_url(); engine=create_database_engine(url); upgrade_database(url); factory=create_session_factory(engine)
    excluded=insert(ResourcePlacementMetric).excluded; fields=[k for k in records[0] if k not in {"resource_type","date","identity_key"}]
    with factory.begin() as session:
        for offset in range(0,len(records),BATCH_SIZE):
            statement=insert(ResourcePlacementMetric).values(records[offset:offset+BATCH_SIZE])
            session.execute(statement.on_conflict_do_update(index_elements=["resource_type","date","identity_key"],set_={k:getattr(excluded,k) for k in fields}))
        for kind in ("section","banner","popup"):
            subset=[x for x in records if x["resource_type"]==kind]
            session.add(SyncRun(dataset=f"resource_{kind}",status="success",row_count=len(subset),start_date=min(x["date"] for x in subset),end_date=max(x["date"] for x in subset),source=subset[0]["source"],completed_at=now))
    engine.dispose()
    return {kind:sum(1 for x in records if x["resource_type"]==kind) for kind in ("section","banner","popup")}

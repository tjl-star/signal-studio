from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.repositories.content_ranking import ContentRankingRepository
from app.services.content_ranking import ContentRankingService


router = APIRouter(prefix="/api/v1", tags=["content-ranking"])


def get_session(request: Request):
    with request.app.state.session_factory() as session:
        yield session


@router.get("/content-rankings")
def content_rankings(
    data_date: date = Query(..., alias="date"),
    list_type: Literal["总榜", "新用户榜"] = Query("总榜"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=30),
    sort: Literal["rank", "play_vv", "day_change"] = Query("rank"),
    direction: Literal["asc", "desc"] = Query("asc"),
    session: Session = Depends(get_session),
):
    return ContentRankingService(ContentRankingRepository(session)).get_rankings(
        data_date,
        list_type,
        page,
        page_size,
        sort,
        direction,
    )

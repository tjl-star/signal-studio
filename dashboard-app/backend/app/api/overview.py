from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.repositories.overview import OverviewRepository
from app.services.overview import OverviewService


router = APIRouter(prefix="/api/v1", tags=["overview"])


def get_session(request: Request):
    with request.app.state.session_factory() as session:
        yield session


@router.get("/overview")
def overview(
    start_date: date = Query(...),
    end_date: date = Query(...),
    client: str = Query(..., min_length=1),
    session: Session = Depends(get_session),
):
    return OverviewService(OverviewRepository(session)).get_overview(start_date, end_date, client)

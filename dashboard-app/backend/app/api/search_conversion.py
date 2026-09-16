from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.repositories.search_conversion import SearchConversionRepository
from app.services.search_conversion import SearchConversionService

router = APIRouter(prefix="/api/v1", tags=["search-conversion"])


def get_session(request: Request):
    with request.app.state.session_factory() as session:
        yield session


@router.get("/search-conversion")
def search_conversion(data_date: date = Query(..., alias="date"), start_date: date = Query(...), end_date: date = Query(...), session: Session = Depends(get_session)):
    return SearchConversionService(SearchConversionRepository(session)).get(data_date, start_date, end_date)

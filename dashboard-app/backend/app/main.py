from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.content_ranking import router as content_ranking_router
from app.api.overview import router as overview_router
from app.api.search_conversion import router as search_conversion_router
from app.api.resource_placement import router as resource_placement_router
from app.api.home_operations import router as home_operations_router
from app.api.search_ranking import router as search_ranking_router
from app.api.bl_consumption import router as bl_consumption_router
from app.api.genre_contribution import router as genre_contribution_router
from app.api.playback_growth import router as playback_growth_router
from app.api.monthly_report import router as monthly_report_router
from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database


def create_app(database_url: str | None = None) -> FastAPI:
    database_url = database_url or default_database_url()
    engine = create_database_engine(database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        upgrade_database(database_url)
        yield
        engine.dispose()

    app = FastAPI(title="Signal Studio", version="0.1.0", lifespan=lifespan)
    app.state.session_factory = create_session_factory(engine)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "application": "Signal Studio", "storage": "sqlite"}

    app.include_router(overview_router)
    app.include_router(content_ranking_router)
    app.include_router(search_conversion_router)
    app.include_router(resource_placement_router)
    app.include_router(home_operations_router)
    app.include_router(search_ranking_router)
    app.include_router(bl_consumption_router)
    app.include_router(genre_contribution_router)
    app.include_router(playback_growth_router)
    app.include_router(monthly_report_router)
    frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if frontend_dist.exists():
        app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    return app


app = create_app()

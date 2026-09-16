from __future__ import annotations

from collections.abc import Iterator
import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


def create_database_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False, "timeout": 5} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)

    if database_url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def configure_sqlite(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()

    return engine


def default_database_url() -> str:
    return f"sqlite:///{default_database_path()}"


def default_database_path() -> Path:
    configured = os.environ.get("SIGNAL_STUDIO_RUNTIME_DIR")
    local_app_data = os.environ.get("LOCALAPPDATA")
    runtime = Path(configured) if configured else (Path(local_app_data) / "SignalStudio" if local_app_data else Path(__file__).resolve().parents[2] / "runtime")
    runtime.mkdir(parents=True, exist_ok=True)
    return runtime / "signal-studio-v1.db"


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, expire_on_commit=False)


def session_scope(factory: sessionmaker[Session]) -> Iterator[Session]:
    with factory() as session:
        yield session

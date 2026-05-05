from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from app.db.session import Base
from datetime import datetime

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.now().isoformat())
    active: Mapped[bool] = mapped_column(default=True)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean
from app.db.session import Base
from sqlalchemy import String, ForeignKey
from datetime import datetime

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=True)
    host: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    file: Mapped[str] = mapped_column(String, default="")
    reason: Mapped[str] = mapped_column(String, default="")
    timestamp: Mapped[str] = mapped_column(String, default=lambda: datetime.now().isoformat())
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
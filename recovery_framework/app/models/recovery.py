from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, JSON
from app.db.session import Base

class RecoveryTask(Base):
    __tablename__ = "recovery_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    host: Mapped[str] = mapped_column(String)
    files: Mapped[list] = mapped_column(JSON, default=list)
    malware: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="pending")
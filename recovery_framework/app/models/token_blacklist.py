from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from app.db.session import Base
from datetime import datetime

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String, unique=True, index=True)
    blacklisted_at: Mapped[str] = mapped_column(
        String, default=lambda: datetime.now().isoformat()
    )
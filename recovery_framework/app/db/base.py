# app/db/base.py

from app.db.session import Base

# import all models here so SQLAlchemy knows them
from app.models.user import User
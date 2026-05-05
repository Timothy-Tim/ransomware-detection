from pydantic_settings import BaseSettings
from pydantic import model_validator

class Settings(BaseSettings):
    BACKUP_DIR: str = "/var/backups/ransomware-agent"
    MANAGEMENT_IP: str = ""

    # Database
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = ""
    DATABASE_URL: str = ""  # ✅ will be built automatically

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""

    # Auth
    SECRET_KEY: str = "changeme"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email
    GMAIL_SENDER: str = ""
    GMAIL_APP_PASSWORD: str = ""

    # App
    APP_URL: str = "http://localhost:5173"

    # ✅ Build DATABASE_URL from parts after all fields are loaded
    @model_validator(mode="after")
    def build_database_url(self):
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        return self

    class Config:
        env_file = ".env"

settings = Settings()
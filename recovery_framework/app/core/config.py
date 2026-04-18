from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BACKUP_DIR: str = "/var/backups/ransomware-agent"
    SECRET_KEY: str = "changeme"
    DATABASE_URL: str = ""
    MANAGEMENT_IP: str = ""
    
    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""

    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    class Config:
        env_file = ".env"

settings = Settings()
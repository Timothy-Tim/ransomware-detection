import os
import shutil
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Dynamically find .env regardless of who runs it
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "../../../recovery_framework/.env")
load_dotenv(ENV_PATH)

# ✅ Read directly from environment, not from settings
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")

print(f"[S3] Bucket: {S3_BUCKET_NAME}")  # ✅ debug line

LOCAL_CACHE_DIR = "./backups_cache"

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def ensure_local_cache():
    os.makedirs(LOCAL_CACHE_DIR, exist_ok=True)

def s3_key_for_file(file_path: str) -> str:
    filename = os.path.basename(file_path)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    return f"{filename}/{filename}_{timestamp}"

def backup_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} does not exist")
    key = s3_key_for_file(file_path)
    try:
        s3_client.upload_file(file_path, S3_BUCKET_NAME, key)
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")
    ensure_local_cache()
    local_backup_path = os.path.join(LOCAL_CACHE_DIR, os.path.basename(file_path))
    shutil.copy2(file_path, local_backup_path)
    return key

def restore_file(s3_key: str, restore_path: str = "") -> str:
    if restore_path is None:
        restore_path = os.path.basename(s3_key.split("/")[0])
    try:
        s3_client.download_file(S3_BUCKET_NAME, s3_key, restore_path)
        return restore_path
    except ClientError:
        ensure_local_cache()
        cached_file = os.path.join(LOCAL_CACHE_DIR, os.path.basename(restore_path))
        if os.path.exists(cached_file):
            shutil.copy2(cached_file, restore_path)
            return restore_path
    raise FileNotFoundError(f"Backup not found in S3 or local cache: {s3_key}")

def list_backups() -> list[str]:
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix="")
        return [obj["Key"] for obj in response.get("Contents", [])]
    except ClientError as e:
        raise RuntimeError(f"Failed to list backups: {e}")

def cleanup_local_cache(days_old: int = 30):
    ensure_local_cache()
    cutoff = datetime.utcnow() - timedelta(days=days_old)
    for fname in os.listdir(LOCAL_CACHE_DIR):
        path = os.path.join(LOCAL_CACHE_DIR, fname)
        if os.path.isfile(path):
            mtime = datetime.utcfromtimestamp(os.path.getmtime(path))
            if mtime < cutoff:
                os.remove(path)
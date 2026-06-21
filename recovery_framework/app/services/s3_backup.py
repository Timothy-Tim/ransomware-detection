import logging
import hashlib
import os
import shutil
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "../../../recovery_framework/.env")
load_dotenv(ENV_PATH)

AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION            = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME        = os.getenv("S3_BUCKET_NAME", "")

print(f"[S3] Bucket: {S3_BUCKET_NAME}")

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
    """
    Key format: {md5_of_full_path}/{filename}_{timestamp}
    e.g. a1b2c3d4.../document1.txt_20250524T120000
    """
    path_hash = hashlib.md5(file_path.encode()).hexdigest()
    timestamp  = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    filename   = os.path.basename(file_path)
    return f"{path_hash}/{filename}_{timestamp}"


def backup_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} does not exist")

    key = s3_key_for_file(file_path)

    try:
        s3_client.upload_file(file_path, S3_BUCKET_NAME, key)
        logging.info(f"[S3] Backed up {file_path} → {key}")
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")

    # Local cache copy
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


def get_latest_backup_key(file_path: str) -> str | None:
    """
    Find the latest S3 backup for a given file path.

    Keys are stored as: {md5_of_full_path}/{filename}_{timestamp}
    So we search using the md5 hash of the full path as prefix —
    this is the only reliable way to find the right backup.
    """
    path_hash = hashlib.md5(file_path.encode()).hexdigest()
    filename  = os.path.basename(file_path)

    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f"{path_hash}/"          # ← FIXED: use hash prefix, not filename
        )

        contents = response.get("Contents", [])
        if not contents:
            logging.warning(f"[S3] No backup found for {file_path} (hash: {path_hash})")
            return None

        # Timestamps in key are sortable — latest is last alphabetically
        latest = sorted(contents, key=lambda x: x["Key"])[-1]
        logging.info(f"[S3] Latest backup for {file_path}: {latest['Key']}")
        return latest["Key"]

    except ClientError as e:
        raise RuntimeError(f"Failed to find backup: {e}")


def restore_latest_backup(file_path: str) -> bool:
    """
    Restore the most recent S3 backup of file_path back to its original location.
    Falls back to local cache if S3 fails.
    """
    latest_key = get_latest_backup_key(file_path)

    if not latest_key:
        # Try local cache as fallback
        ensure_local_cache()
        cached = os.path.join(LOCAL_CACHE_DIR, os.path.basename(file_path))
        if os.path.exists(cached):
            shutil.copy2(cached, file_path)
            logging.info(f"[S3] Restored {file_path} from local cache")
            return True
        logging.warning(f"[S3] No backup found for {file_path} in S3 or cache")
        return False

    try:
        # Ensure destination directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        s3_client.download_file(S3_BUCKET_NAME, latest_key, file_path)
        logging.info(f"[S3] Restored {file_path} from {latest_key}")
        return True

    except ClientError as e:
        logging.error(f"[S3] Failed restoring {file_path}: {e}")

        # Fallback to local cache
        ensure_local_cache()
        cached = os.path.join(LOCAL_CACHE_DIR, os.path.basename(file_path))
        if os.path.exists(cached):
            shutil.copy2(cached, file_path)
            logging.info(f"[S3] Restored {file_path} from local cache (S3 fallback)")
            return True

        return False


def cleanup_local_cache(days_old: int = 30):
    ensure_local_cache()
    cutoff = datetime.utcnow() - timedelta(days=days_old)
    for fname in os.listdir(LOCAL_CACHE_DIR):
        path = os.path.join(LOCAL_CACHE_DIR, fname)
        if os.path.isfile(path):
            mtime = datetime.utcfromtimestamp(os.path.getmtime(path))
            if mtime < cutoff:
                os.remove(path)
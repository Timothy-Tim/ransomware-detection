import threading
from recovery_framework.app.detection.file_monitor import start_monitor

def start_file_monitor(path: str, callback):
    thread = threading.Thread(
        target=start_monitor,
        args=(path, callback),
        daemon=True
    )
    thread.start()
import time
import threading
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class RansomwareHandler(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback

    def on_modified(self, event):
        if not event.is_directory:
            self.callback(event.src_path)

    def on_created(self, event):
        if not event.is_directory:
            self.callback(event.src_path)


def start_monitor(path: str, callback):
    """Blocking monitor — use start_monitor_thread for use with FastAPI."""
    event_handler = RansomwareHandler(callback)
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    logging.info(f"[Monitor] Watching {path}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def start_monitor_thread(path: str, callback) -> threading.Thread:
    """
    Non-blocking version — runs monitor in a daemon thread.
    Call this from FastAPI lifespan startup.
    """
    thread = threading.Thread(target=start_monitor, args=(path, callback), daemon=True)
    thread.start()
    logging.info(f"[Monitor] Started monitor thread for {path}")
    return thread
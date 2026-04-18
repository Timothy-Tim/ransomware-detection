import subprocess
import logging
from app.core.config import settings


def isolate_host(host: str):
    """
    Isolates the local machine via iptables.
    If your backend is sending this as a command to the agent,
    run this on the agent side instead.
    Requires root / sudoers entry.
    """
    try:
        rules = [
            ["iptables", "-P", "INPUT", "DROP"],
            ["iptables", "-P", "OUTPUT", "DROP"],
            ["iptables", "-P", "FORWARD", "DROP"],
            # Allow loopback
            ["iptables", "-A", "INPUT", "-i", "lo", "-j", "ACCEPT"],
            ["iptables", "-A", "OUTPUT", "-o", "lo", "-j", "ACCEPT"],
        ]

        # Keep management server reachable so you don't lock yourself out
        if settings.MANAGEMENT_IP:
            rules.append(
                ["iptables", "-A", "OUTPUT", "-d", settings.MANAGEMENT_IP, "-j", "ACCEPT"]
            )

        for rule in rules:
            subprocess.run(rule, check=True)

        logging.info(f"[Isolation] Host {host} isolated via iptables")

    except subprocess.CalledProcessError as e:
        logging.error(f"[Isolation] Failed to isolate {host}: {e}")


def release_host(host: str):
    """Flush iptables rules to restore normal network access."""
    try:
        subprocess.run(["iptables", "-F"], check=True)
        subprocess.run(["iptables", "-P", "INPUT", "ACCEPT"], check=True)
        subprocess.run(["iptables", "-P", "OUTPUT", "ACCEPT"], check=True)
        subprocess.run(["iptables", "-P", "FORWARD", "ACCEPT"], check=True)
        logging.info(f"[Isolation] Host {host} released from isolation")
    except subprocess.CalledProcessError as e:
        logging.error(f"[Isolation] Failed to release {host}: {e}")
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

def send_setup_email(to_email: str, username: str, setup_link: str):
    subject = "You have been invited to Ransomware Detection System"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Ransomware Detection System</h2>
        <p>Hi <strong>{username}</strong>,</p>
        <p>An admin has created an account for you. Click the button below to set your password.</p>
        <div style="text-align: center; margin: 2rem 0;">
            <a href="{setup_link}" style="
                background: #3498db;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
            ">
                Set Your Password
            </a>
        </div>
        <p style="color: #888; font-size: 0.9rem;">
            This link expires in <strong>24 hours</strong> and can only be used once.
        </p>
        <p style="color: #888; font-size: 0.9rem;">
            If you did not expect this email, please ignore it.
        </p>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.GMAIL_SENDER
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        # ✅ Create SSL context that ignores certificate errors
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(settings.GMAIL_SENDER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_SENDER, to_email, msg.as_string())

        print(f"[Email] Setup email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[Email] Failed to send email: {e}")
        return False
# notifications/emailer.py
import os
import aiosmtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_TLS  = os.getenv("SMTP_TLS", "true").lower()  # "true" | "ssl" | "false"
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASSWORD")
SENDER    = os.getenv("SENDER_EMAIL", SMTP_USER)

def _build_message(subject: str, to_addrs: list[str], html: str, text_fallback: str = "") -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = SENDER
    msg["To"] = ", ".join(to_addrs)
    msg["Subject"] = subject
    if text_fallback:
        msg.set_content(text_fallback)
    msg.add_alternative(html, subtype="html")
    return msg

async def send_mail(subject: str, to_addrs: list[str], html: str, text_fallback: str = ""):
    if not (SMTP_USER and SMTP_PASS):
        raise RuntimeError("SMTP_USER/SMTP_PASSWORD no configurados")

    msg = _build_message(subject, to_addrs, html, text_fallback)

    starttls = (SMTP_TLS == "true")
    use_ssl  = (SMTP_TLS == "ssl")

    if use_ssl:
        # SSL directo (465)
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            use_tls=True,
        )
    else:
        # STARTTLS (587) o sin TLS (no recomendado)
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=starttls,
        )

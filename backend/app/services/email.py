import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import get_settings

settings = get_settings()


def is_email_configured() -> bool:
    return bool(settings.smtp_username and settings.smtp_password)


async def send_reset_email(to_email: str, reset_link: str):
    """Send a password reset email via Gmail SMTP."""
    if not is_email_configured():
        print(f"[email] SMTP not configured. Reset link for {to_email}: {reset_link}")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.sender_email or settings.smtp_username
    msg["To"] = to_email
    msg["Subject"] = "Reset Your Password — ImageGen"

    text_body = f"""You requested a password reset for your ImageGen account.

Click the link below to reset your password (expires in {settings.reset_token_expire_minutes} minutes):

{reset_link}

If you didn't request this, you can safely ignore this email.
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 40px; border: 1px solid #2a2a4a;">
    <h2 style="color: #ffffff; margin-top: 0;">Reset Your Password</h2>
    <p style="color: #b0b0b0; line-height: 1.6;">
      You requested a password reset for your ImageGen account. Click the button below to set a new password.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{reset_link}"
         style="background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #808080; font-size: 13px; line-height: 1.5;">
      This link expires in {settings.reset_token_expire_minutes} minutes. If you didn't request this, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
    <p style="color: #606060; font-size: 12px;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
    </p>
  </div>
</body>
</html>"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_server,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        start_tls=True,
    )
    print(f"[email] Reset email sent to {to_email}")

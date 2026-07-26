from email.message import EmailMessage
from smtplib import SMTP, SMTP_SSL

from app.core.config import settings

STATUS_LABELS = {
    "open": "Nouveau dossier créé",
    "assigned": "Technicien assigné",
    "in_progress": "Intervention en cours",
    "waiting_parts": "En attente de pièces",
    "resolved": "Dossier résolu",
    "closed": "Dossier clôturé",
    "cancelled": "Dossier annulé",
    "self_service": "Auto-diagnostic",
}


def _build_ticket_url(ticket_id: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/client/tickets/{ticket_id}"


def _format_subject(ticket_number: str, status: str) -> str:
    label = STATUS_LABELS.get(status, status)
    return f"SAV-IA | Statut du dossier {ticket_number} : {label}"


def _format_html_content(ticket_number: str, ticket_url: str, status: str, message: str) -> str:
    label = STATUS_LABELS.get(status, status)
    return f"""
    <html>
      <body style="font-family:Arial,sans-serif;color:#2e3340;line-height:1.5;">
        <h2 style="color:#16325c;">Statut du dossier {ticket_number}</h2>
        <p style="font-size:15px;">{message}</p>
        <p style="font-size:15px;">État actuel : <strong>{label}</strong></p>
        <p style="font-size:15px;">
          <a href="{ticket_url}" style="display:inline-block;padding:10px 18px;background:#1f3a93;color:#ffffff;border-radius:6px;text-decoration:none;">Voir mon dossier</a>
        </p>
        <p style="font-size:13px;color:#7d8798;">Si le lien ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :</p>
        <p style="font-size:13px;color:#7d8798;">{ticket_url}</p>
      </body>
    </html>
    """.strip()


def _send_email(to_email: str, subject: str, text_content: str, html_content: str) -> None:
    if not settings.SMTP_HOST:
        print("[notification] SMTP_HOST non configuré, envoi ignoré")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    if settings.SMTP_USE_SSL:
        smtp = SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
    else:
        smtp = SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        if settings.SMTP_USE_TLS:
            smtp.starttls()

    if settings.SMTP_USER:
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")

    smtp.send_message(msg)
    smtp.quit()


def send_ticket_status_email(to_email: str, ticket_number: str, ticket_id: str, status: str, summary: str) -> None:
    ticket_url = _build_ticket_url(ticket_id)
    subject = _format_subject(ticket_number, status)
    text_content = (
        f"Bonjour,\n\n"
        f"Votre dossier {ticket_number} a changé de statut : {STATUS_LABELS.get(status, status)}.\n"
        f"{summary}\n\n"
        f"Suivez votre dossier ici : {ticket_url}\n\n"
        "Merci,\nL'équipe SAV-IA"
    )
    html_content = _format_html_content(ticket_number, ticket_url, status, summary)

    try:
        _send_email(to_email, subject, text_content, html_content)
        print(f"[notification] E-mail envoyé à {to_email} pour {ticket_number}")
    except Exception as exc:
        print(f"[notification] Échec envoi email à {to_email} : {exc}")

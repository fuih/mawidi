import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.security import create_verification_token
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_welcome_email(email: str, name: str):
    """
    Sends a simple welcome email without a verification link.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP configuration is missing! Falling back to mock email.")
        print("\n" + "="*60)
        print("📧 MOCK WELCOME EMAIL SENT")
        print(f"To: {email}")
        print("Subject: Bienvenue sur Tabibak.pro !")
        print("Body:")
        print(f"Bonjour Dr. {name},")
        print("Nous sommes ravis de vous compter parmi nous. Votre compte a été créé avec succès.")
        print("="*60 + "\n")
        return

    msg = EmailMessage()
    msg["Subject"] = "Bienvenue sur Tabibak.pro !"
    msg["From"] = f"Tabibak <{settings.SMTP_FROM}>"
    msg["To"] = email
    
    content = (
        f"Bonjour Dr. {name},\n\n"
        "Nous sommes ravis de vous compter parmi nous.\n"
        "Votre compte a été créé avec succès et vous pouvez désormais gérer vos rendez-vous.\n\n"
        "L'équipe Tabibak"
    )
    msg.set_content(content)
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bienvenue sur Tabibak.pro !</h2>
        <p>Bonjour Dr. {name},</p>
        <p>Nous sommes ravis de vous compter parmi nous.</p>
        <p>Votre compte a été créé avec succès et vous pouvez dès à présent configurer votre profil et vos horaires.</p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Welcome email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")
        print("\n" + "="*60)
        print("📧 MOCK WELCOME EMAIL (FALLBACK AFTER SMTP ERROR)")
        print(f"To: {email}")
        print("Subject: Bienvenue sur Tabibak.pro !")
        print("="*60 + "\n")

def send_verification_email(email: str, token: str):
    """
    Real email sending service using standard smtplib.
    Runs synchronously in a background thread pool by FastAPI.
    """
    frontend_url = settings.FRONTEND_URL
    verify_url = f"{frontend_url}/verify-email?token={token}"
    
    # If SMTP is not configured, fall back to logging
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP configuration is missing! Falling back to mock email.")
        print("\n" + "="*60)
        print("📧 MOCK EMAIL SENT")
        print(f"To: {email}")
        print("Subject: Veuillez vérifier votre adresse e-mail")
        print("Body:")
        print("Bonjour,")
        print(f"Merci de vous être inscrit sur Tabibak.pro. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse e-mail :")
        print(f"\n{verify_url}\n")
        print("="*60 + "\n")
        return

    # Real SMTP send
    msg = EmailMessage()
    msg["Subject"] = "Veuillez vérifier votre adresse e-mail - Tabibak.pro"
    msg["From"] = f"Tabibak <{settings.SMTP_FROM}>"
    msg["To"] = email
    
    content = (
        "Bonjour,\n\n"
        "Merci de vous être inscrit sur Tabibak.pro.\n"
        "Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse e-mail :\n\n"
        f"{verify_url}\n\n"
        "Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.\n\n"
        "L'équipe Tabibak"
    )
    msg.set_content(content)
    
    # Add HTML alternative
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bienvenue sur Tabibak.pro !</h2>
        <p>Merci de vous être inscrit.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail :</p>
        <p>
            <a href="{verify_url}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #0ea5e9; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Vérifier mon e-mail
            </a>
        </p>
        <p style="font-size: 12px; color: #888; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien : <br>
            {verify_url}
        </p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Real verification email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        print("\n" + "="*60)
        print("📧 MOCK EMAIL SENT (FALLBACK AFTER SMTP ERROR)")
        print(f"To: {email}")
        print("Subject: Veuillez vérifier votre adresse e-mail")
        print(f"\n{verify_url}\n")
        print("="*60 + "\n")

def send_password_reset_email(email: str, token: str):
    """
    Sends a password reset email using standard smtplib.
    """
    frontend_url = settings.FRONTEND_URL
    reset_url = f"{frontend_url}/reset-password?token={token}"
    
    # If SMTP is not configured, fall back to logging
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP configuration is missing! Falling back to mock email.")
        print("\n" + "="*60)
        print("📧 MOCK PASSWORD RESET EMAIL SENT")
        print(f"To: {email}")
        print("Subject: Réinitialisation de votre mot de passe")
        print("Body:")
        print("Bonjour,")
        print(f"Vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous :")
        print(f"\n{reset_url}\n")
        print("Ce lien expirera dans 15 minutes.")
        print("="*60 + "\n")
        return

    # Real SMTP send
    msg = EmailMessage()
    msg["Subject"] = "Réinitialisation de votre mot de passe - Tabibak.pro"
    msg["From"] = f"Tabibak <{settings.SMTP_FROM}>"
    msg["To"] = email
    
    content = (
        "Bonjour,\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe.\n"
        "Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :\n\n"
        f"{reset_url}\n\n"
        "Ce lien expirera dans 15 minutes.\n"
        "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.\n\n"
        "L'équipe Tabibak"
    )
    msg.set_content(content)
    
    # Add HTML alternative
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <p>
            <a href="{reset_url}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #0ea5e9; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Réinitialiser mon mot de passe
            </a>
        </p>
        <p>Ce lien expirera dans 15 minutes.</p>
        <p style="font-size: 12px; color: #888; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien : <br>
            {reset_url}
        </p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Password reset email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        print("\n" + "="*60)
        print("📧 MOCK PASSWORD RESET EMAIL (FALLBACK AFTER SMTP ERROR)")
        print(f"To: {email}")
        print("Subject: Réinitialisation de votre mot de passe")
        print(f"\n{reset_url}\n")
        print("="*60 + "\n")

def send_doctor_approved_email(email: str, name: str, slug: str):
    """
    Sends an email to a doctor when their account is verified/approved by an admin.
    """
    frontend_url = settings.FRONTEND_URL
    dashboard_url = f"{frontend_url}/login"
    booking_url = f"{frontend_url}/{slug}"
    
    # If SMTP is not configured, fall back to logging
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP configuration is missing! Falling back to mock email.")
        print("\n" + "="*60)
        print("📧 MOCK DOCTOR APPROVAL EMAIL SENT")
        print(f"To: {email}")
        print("Subject: Votre compte Tabibak est maintenant actif !")
        print("Body:")
        print(f"Félicitations Dr. {name},")
        print("Votre compte a été vérifié et approuvé par notre équipe.")
        print(f"Lien de réservation patient : {booking_url}")
        print(f"Accès au tableau de bord : {dashboard_url}")
        print("="*60 + "\n")
        return

    msg = EmailMessage()
    msg["Subject"] = "Votre compte Tabibak est maintenant actif !"
    msg["From"] = f"Tabibak <{settings.SMTP_FROM}>"
    msg["To"] = email
    
    content = (
        f"Félicitations Dr. {name},\n\n"
        "Votre compte professionnel a été vérifié et approuvé par notre équipe !\n\n"
        "Voici votre lien de réservation public à partager avec vos patients :\n"
        f"{booking_url}\n\n"
        "Prochaines étapes :\n"
        "1. Connectez-vous à votre tableau de bord\n"
        "2. Configurez vos horaires de travail et votre mode de consultation\n"
        "3. Commencez à recevoir des rendez-vous !\n\n"
        f"Accédez à votre tableau de bord ici : {dashboard_url}\n\n"
        "Bienvenue sur Tabibak.pro,\n"
        "L'équipe Tabibak"
    )
    msg.set_content(content)
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2>Félicitations Dr. {name} ! 🎉</h2>
        <p>Votre compte professionnel a été vérifié et approuvé par notre équipe.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a;">Votre lien de réservation public</h3>
            <p style="margin-bottom: 0;">Partagez ce lien avec vos patients (SMS, WhatsApp, réseaux sociaux) :</p>
            <a href="{booking_url}" style="color: #0ea5e9; font-weight: bold; font-size: 16px; word-break: break-all;">{booking_url}</a>
        </div>

        <h3 style="color: #0f172a;">Prochaines étapes :</h3>
        <ol style="margin-bottom: 30px;">
            <li>Connectez-vous à votre tableau de bord</li>
            <li>Configurez vos horaires de travail et votre mode de consultation (File d'attente ou Heure fixe)</li>
            <li>Commencez à recevoir des rendez-vous !</li>
        </ol>

        <p>
            <a href="{dashboard_url}" style="display: inline-block; padding: 12px 24px; color: white; background-color: #0ea5e9; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Accéder à mon tableau de bord
            </a>
        </p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Doctor approval email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send doctor approval email to {email}: {e}")
        print("\n" + "="*60)
        print("📧 MOCK DOCTOR APPROVAL EMAIL (FALLBACK AFTER SMTP ERROR)")
        print(f"To: {email}")
        print("Subject: Votre compte Tabibak est maintenant actif !")
        print(f"Lien : {booking_url}")
        print("="*60 + "\n")

def send_appointment_notification_email(
    email: str,
    patient_name: str,
    date_str: str,
    time_str: Optional[str],
    doctor_name: str,
    status_msg: str,
    queue_number: Optional[int] = None,
    cancellation_token: Optional[str] = None
):
    """
    Sends an appointment notification email (pending, confirmed, cancelled).
    """
    frontend_url = settings.FRONTEND_URL

    if status_msg == "pending":
        subject = f"Votre demande de rendez-vous avec {doctor_name} est en attente"
        status_text = "Votre demande de rendez-vous est <strong>en attente de confirmation</strong> par le cabinet."
    elif status_msg == "confirmed":
        subject = f"Confirmation de votre rendez-vous avec {doctor_name}"
        status_text = "Votre rendez-vous a été <strong>confirmé</strong>."
    elif status_msg == "cancelled":
        subject = f"Annulation de votre rendez-vous avec {doctor_name}"
        status_text = "Votre rendez-vous a été <strong>annulé</strong>."
    else:
        subject = f"Mise à jour de votre rendez-vous avec {doctor_name}"
        status_text = f"Le statut de votre rendez-vous est maintenant: {status_msg}"

    time_info = f"à {time_str}" if time_str else (f"(Ticket de file d'attente #{queue_number})" if queue_number else "")
    
    cancel_html = ""
    if cancellation_token and status_msg in ["pending", "confirmed"]:
        cancel_url = f"{frontend_url}/guest-cancel?token={cancellation_token}"
        cancel_html = f'<p style="margin-top: 20px; font-size: 12px; color: #666;">Pour annuler ce rendez-vous, <a href="{cancel_url}" style="color: #d9534f;">cliquez ici</a>.</p>'

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP configuration is missing! Falling back to mock email.")
        print("\n" + "="*60)
        print("📧 MOCK APPOINTMENT EMAIL SENT")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Body: {status_text} le {date_str} {time_info}")
        print("="*60 + "\n")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"Tabibak <{settings.SMTP_FROM}>"
    msg["To"] = email
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #112142;">Mise à jour de votre rendez-vous</h2>
        <p>Bonjour {patient_name},</p>
        <p>{status_text}</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #039D77; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Médecin :</strong> {doctor_name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date :</strong> {date_str}</p>
            <p style="margin: 0;"><strong>Heure / File :</strong> {time_str if time_str else (f"Ticket #{queue_number}" if queue_number else "N/A")}</p>
        </div>
        <p>Merci d'avoir choisi Tabibak.pro.</p>
        {cancel_html}
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Appointment email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send appointment email to {email}: {e}")

import logging
import urllib.request
import urllib.parse
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

def _send_sobersys_sms(phone: str, message: str):
    """
    Core function to send an SMS via Sobersys API.
    If credentials are not set, it falls back to a terminal mock.
    """
    # Clean phone number (remove spaces, plus, etc.)
    clean_phone = "".join(filter(str.isdigit, phone))

    if not settings.SOBERSYS_API_KEY or not settings.SOBERSYS_SENDER_ID:
        logger.warning("Sobersys configuration missing! Falling back to mock SMS.")
        print("\n" + "="*60)
        print("📱 MOCK SMS SENT (SOBERSYS)")
        print(f"To: {phone} (cleaned: {clean_phone})")
        print(f"Message:\n{message}")
        print("="*60 + "\n")
        return

    # Typical Sobersys SMS API Payload
    url = "https://api.sobersys.com/v1/sms/send"  # This URL may need adjustment based on their exact docs
    payload = {
        "api_key": settings.SOBERSYS_API_KEY,
        "sender_id": settings.SOBERSYS_SENDER_ID,
        "to": clean_phone,
        "message": message
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = response.read()
            logger.info(f"Real SMS sent via Sobersys to {phone}. Response: {result}")
    except Exception as e:
        logger.error(f"Failed to send Sobersys SMS to {phone}: {e}")

def send_welcome_sms(phone: str, name: str):
    """
    Welcome SMS for Doctors.
    """
    if not phone:
        return
    message = (
        f"Bienvenue Dr. {name} sur Tabibak.pro!\n"
        "Votre compte a été créé avec succès.\n"
        "Connectez-vous pour commencer à gérer vos rendez-vous."
    )
    _send_sobersys_sms(phone, message)


def send_password_reset_sms(phone: str, token: str):
    """
    Password reset link SMS for Doctors.
    """
    if not phone:
        return
    frontend_url = settings.FRONTEND_URL
    reset_url = f"{frontend_url}/reset-password?token={token}"
    
    message = (
        "Tabibak.pro : Vous avez demandé la réinitialisation de votre mot de passe.\n"
        f"Cliquez ici pour le modifier : {reset_url}\n"
        "Ce lien expire dans 15 minutes."
    )
    _send_sobersys_sms(phone, message)


def send_appointment_notification_sms(
    phone: str,
    patient_name: str,
    date_str: str,
    time_str: str | None,
    status: str,
    queue_number: int | None = None,
    cancellation_token: str | None = None,
):
    """
    Appointment notifications for Patients (created, confirmed).
    Supports both time-based and queue-based modes.
    """
    if not phone:
        return
        
    frontend_url = settings.FRONTEND_URL
    cancel_text = f"\nAnnuler: {frontend_url}/cancel-appointment/{cancellation_token}" if cancellation_token else ""

    if queue_number is not None:
        # Queue-based mode messages
        if status == "pending":
            message = (
                f"Bonjour {patient_name},\n"
                f"Votre demande a été enregistrée sur Tabibak.pro.\n"
                f"Vous êtes le numéro #{queue_number} pour le {date_str}.\n"
                f"Vous serez reçu par ordre d'arrivée.{cancel_text}"
            )
        elif status == "confirmed":
            message = (
                f"Bonjour {patient_name},\n"
                f"Votre réservation du {date_str} a été CONFIRMÉE.\n"
                f"Vous êtes le numéro #{queue_number} dans la file.\n"
                f"Merci d'utiliser Tabibak.pro!{cancel_text}"
            )
        else:
            return
    else:
        # Time-based mode messages
        if status == "pending":
            message = (
                f"Bonjour {patient_name},\n"
                f"Votre demande de RDV sur Tabibak.pro le {date_str} à {time_str} a été enregistrée.\n"
                f"Vous recevrez une confirmation sous peu.{cancel_text}"
            )
        elif status == "confirmed":
            message = (
                f"Bonjour {patient_name},\n"
                f"Votre RDV du {date_str} à {time_str} a été CONFIRMÉ par le médecin.\n"
                f"Merci d'utiliser Tabibak.pro!{cancel_text}"
            )
        else:
            return

    _send_sobersys_sms(phone, message)

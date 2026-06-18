"""
Common schemas, enums, and shared types used across the application.
"""

from datetime import time
from enum import Enum

from pydantic import BaseModel, Field


# ── Validation Regex Constants ────────────────────────────────────
# Accepts Latin and Arabic letters, spaces, hyphens, and apostrophes.
NAME_REGEX = r"^[a-zA-Z\s\-'\u0600-\u06FF]+$"
# Accepts strict Algerian mobile formats: +2136..., 2136..., 06...
PHONE_REGEX = r"^\+?213[567][0-9]{8}$|^0[567][0-9]{8}$"


# ── Specialties (French, common in Algeria) ──────────────────────

class Specialty(str, Enum):
    """Medical specialties in French (standard in Algerian healthcare)."""

    medecine_generale = "Médecine Générale"
    cardiologie = "Cardiologie"
    dermatologie = "Dermatologie"
    pediatrie = "Pédiatrie"
    gynecologie = "Gynécologie"
    ophtalmologie = "Ophtalmologie"
    orl = "ORL"
    neurologie = "Neurologie"
    psychiatrie = "Psychiatrie"
    rhumatologie = "Rhumatologie"
    urologie = "Urologie"
    nephrologie = "Néphrologie"
    pneumologie = "Pneumologie"
    gastro_enterologie = "Gastro-entérologie"
    endocrinologie = "Endocrinologie"
    chirurgie_generale = "Chirurgie Générale"
    chirurgie_dentaire = "Chirurgie Dentaire"
    orthodontie = "Orthodontie"
    orthopedie = "Orthopédie"
    radiologie = "Radiologie"
    anesthesie = "Anesthésie-Réanimation"
    oncologie = "Oncologie"
    hematologie = "Hématologie"
    medecine_interne = "Médecine Interne"
    allergologie = "Allergologie"
    kinesitherapie = "Kinésithérapie"


# ── Major Algerian cities ────────────────────────────────────────

class City(str, Enum):
    """69 Wilayas of Algeria."""

    adrar = "01 - Adrar"
    chlef = "02 - Chlef"
    laghouat = "03 - Laghouat"
    oum_el_bouaghi = "04 - Oum El Bouaghi"
    batna = "05 - Batna"
    bejaia = "06 - Béjaïa"
    biskra = "07 - Biskra"
    bechar = "08 - Béchar"
    blida = "09 - Blida"
    bouira = "10 - Bouira"
    tamanrasset = "11 - Tamanrasset"
    tebessa = "12 - Tébessa"
    tlemcen = "13 - Tlemcen"
    tiaret = "14 - Tiaret"
    tizi_ouzou = "15 - Tizi Ouzou"
    alger = "16 - Alger"
    djelfa = "17 - Djelfa"
    jijel = "18 - Jijel"
    setif = "19 - Sétif"
    saida = "20 - Saïda"
    skikda = "21 - Skikda"
    sidi_bel_abbes = "22 - Sidi Bel Abbès"
    annaba = "23 - Annaba"
    guelma = "24 - Guelma"
    constantine = "25 - Constantine"
    medea = "26 - Médéa"
    mostaganem = "27 - Mostaganem"
    msila = "28 - M'Sila"
    mascara = "29 - Mascara"
    ouargla = "30 - Ouargla"
    oran = "31 - Oran"
    el_bayadh = "32 - El Bayadh"
    illizi = "33 - Illizi"
    bordj_bou_arreridj = "34 - Bordj Bou Arréridj"
    boumerdes = "35 - Boumerdès"
    el_tarf = "36 - El Tarf"
    tindouf = "37 - Tindouf"
    tissemsilt = "38 - Tissemsilt"
    el_oued = "39 - El Oued"
    khenchela = "40 - Khenchela"
    souk_ahras = "41 - Souk Ahras"
    tipaza = "42 - Tipaza"
    mila = "43 - Mila"
    ain_defla = "44 - Aïn Defla"
    naama = "45 - Naâma"
    ain_temouchent = "46 - Aïn Témouchent"
    ghardaia = "47 - Ghardaïa"
    relizane = "48 - Relizane"
    timimoun = "49 - Timimoun"
    bordj_badji_mokhtar = "50 - Bordj Badji Mokhtar"
    ouled_djellal = "51 - Ouled Djellal"
    beni_abbes = "52 - Béni Abbès"
    in_salah = "53 - In Salah"
    in_guezzam = "54 - In Guezzam"
    touggourt = "55 - Touggourt"
    djanet = "56 - Djanet"
    el_mghair = "57 - El M'Ghair"
    el_meniaa = "58 - El Meniaa"
    aflou = "59 - Aflou"
    barika = "60 - Barika"
    ksar_chellala = "61 - Ksar Chellala"
    messaad = "62 - Messaad"
    ain_oussera = "63 - Aïn Oussera"
    boussaada = "64 - Boussaâda"
    el_abiodh_sidi_cheikh = "65 - El Abiodh Sidi Cheikh"
    el_kantara = "66 - El Kantara"
    bir_el_ater = "67 - Bir El Ater"
    ksar_el_boukhari = "68 - Ksar El Boukhari"
    el_aricha = "69 - El Aricha"


# ── Shared response / pagination schemas ─────────────────────────

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")


class AvailableSlot(BaseModel):
    """A single time slot with its availability status."""
    time: time
    is_available: bool


class AvailableSlotsResponse(BaseModel):
    """Response for the available-slots endpoint."""
    date: str = Field(description="Date in YYYY-MM-DD format")
    doctor_id: str
    slots: list[AvailableSlot]

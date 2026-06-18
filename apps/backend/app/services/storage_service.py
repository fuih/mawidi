import os
import uuid
import logging
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to initialize Cloudinary if configured
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    
    if settings.CLOUDINARY_URL:
        # Cloudinary automatically configures itself if CLOUDINARY_URL env var is present
        # But we explicitly configure it just in case
        cloudinary.config(url=settings.CLOUDINARY_URL)
        CLOUDINARY_ENABLED = True
    else:
        CLOUDINARY_ENABLED = False
except ImportError:
    CLOUDINARY_ENABLED = False


# Magic bytes for supported image formats
_MAGIC_BYTES = {
    b"\xff\xd8\xff": ".jpg",       # JPEG
    b"\x89PNG\r\n\x1a\n": ".png",  # PNG
    b"RIFF": ".webp",              # WebP (starts with RIFF....WEBP)
}

MAX_FILE_SIZE = 4 * 1024 * 1024  # 4 MB


def _detect_image_type(header: bytes) -> str | None:
    """Detect image type from the first bytes of the file content."""
    if header[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if header[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if header[:4] == b"RIFF" and len(header) >= 12 and header[8:12] == b"WEBP":
        return ".webp"
    return None


def _extract_public_id(cloudinary_url: str) -> str | None:
    """Extracts the Cloudinary public_id from a secure URL to allow deletion."""
    try:
        # e.g. https://res.cloudinary.com/demo/image/upload/v12345/tabibi/pfps/doctor_123.jpg
        parts = cloudinary_url.split("/upload/")
        if len(parts) == 2:
            path_with_ext = parts[1].split("/", 1)[-1]  # remove version
            public_id = path_with_ext.rsplit(".", 1)[0] # remove extension
            return public_id
    except Exception:
        pass
    return None


async def save_profile_photo(file: UploadFile, doctor_id: str, old_photo_url: str | None = None) -> str:
    """
    Validates and saves a profile photo.
    If CLOUDINARY_URL is configured, uploads to Cloudinary.
    Otherwise, falls back to local disk storage.
    """
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Le fichier est trop volumineux. La taille maximale est de 4 Mo.",
        )

    header = contents[:12]
    safe_ext = _detect_image_type(header)
    if safe_ext is None:
        raise HTTPException(
            status_code=400,
            detail="Type de fichier non supporté. Seuls les fichiers JPEG, PNG et WebP sont acceptés.",
        )

    # ---------------------------------------------------------
    # CLOUDINARY UPLOAD
    # ---------------------------------------------------------
    if CLOUDINARY_ENABLED:
        try:
            # Delete old photo if it was hosted on Cloudinary
            if old_photo_url and old_photo_url.startswith("http") and "cloudinary" in old_photo_url:
                public_id = _extract_public_id(old_photo_url)
                if public_id:
                    cloudinary.uploader.destroy(public_id)
            
            # Upload new photo to Cloudinary
            response = cloudinary.uploader.upload(
                contents,
                folder="tabibi/pfps",
                public_id=f"doc_{doctor_id}_{uuid.uuid4().hex[:8]}",
                overwrite=True,
                resource_type="image",
                format=safe_ext.replace(".", ""), # remove dot
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
                ]
            )
            return response.get("secure_url")
            
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors du téléchargement de l'image vers le cloud.")

    # ---------------------------------------------------------
    # LOCAL STORAGE FALLBACK
    # ---------------------------------------------------------
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{doctor_id}_{uuid.uuid4().hex}{safe_ext}"
    file_path = upload_path / unique_filename

    # Delete old local photo
    if old_photo_url and not old_photo_url.startswith("http"):
        try:
            old_filename = old_photo_url.split("/")[-1]
            old_file_path = upload_path / old_filename
            if old_file_path.exists() and old_file_path.is_file():
                old_file_path.unlink()
        except Exception as e:
            logger.warning(f"Failed to delete old local photo: {e}")

    # Save new local file
    with open(file_path, "wb") as f:
        f.write(contents)

    return f"/media/uploads/{unique_filename}"


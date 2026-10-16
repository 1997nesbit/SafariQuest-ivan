import io
import uuid

from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

MAX_UPLOAD_BYTES = 8 * 1024 * 1024

# Long enough to read every signature below (WebP's "WEBP" tag ends at byte 12).
_HEADER_BYTES = 12

# A minimum (width, height) per place an image gets used, so a tiny or heavily
# cropped photo can't be saved into a spot designed to fill the screen — it
# would come out blurry or pixelated there even though it uploads fine. The
# caller declares which spot it's filling via `purpose`; an unlisted (or
# missing) purpose still gets a floor, just a low one, so nothing can skip the
# check entirely. Mirrored in website/src/components/admin/ImageDropzone.tsx
# as a client-side pre-check — that one is just for fast feedback, this one is
# what actually enforces it.
IMAGE_DIMENSION_REQUIREMENTS = {
    "homepage_hero": (1600, 900),
    "homepage_feature": (800, 600),
    "homepage_avatar": (300, 300),
    # Tall side photo (sign-in page): a landscape-sized floor would reject every portrait.
    "page_portrait": (600, 800),
    # Partner hotel logo or property photo, shown as a small card.
    "partner_hotel": (400, 300),
}
DEFAULT_MIN_DIMENSIONS = (200, 200)


def detect_image_extension(header):
    """Identify an image from its own leading bytes, or return None.

    The upload's Content-Type is just a header the client chose to send, so it
    proves nothing: an HTML or SVG file renamed to .png arrives labelled
    "image/png" and, with the bucket public-read, would then be served back
    from our own storage. The file's magic number can't be set independently of
    its content, so that is what decides both whether it's accepted and which
    extension it's stored under.
    """
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp"
    return None


class ImageUploadView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded = request.FILES.get("file")
        if uploaded is None:
            return Response({"detail": "No file provided."}, status=400)

        if uploaded.size > MAX_UPLOAD_BYTES:
            return Response({"detail": "Image is too large. Maximum size is 8MB."}, status=400)

        content = uploaded.read()
        uploaded.seek(0)
        extension = detect_image_extension(content[:_HEADER_BYTES])
        if extension is None:
            return Response(
                {"detail": "Unsupported or corrupt image. Use a JPEG, PNG, WEBP, or GIF file."}, status=400
            )

        try:
            with Image.open(io.BytesIO(content)) as image:
                width, height = image.size
        except UnidentifiedImageError:
            return Response({"detail": "Unsupported or corrupt image."}, status=400)

        min_width, min_height = IMAGE_DIMENSION_REQUIREMENTS.get(
            request.data.get("purpose", ""), DEFAULT_MIN_DIMENSIONS
        )
        if width < min_width or height < min_height:
            return Response(
                {
                    "detail": (
                        f"This image is {width}×{height}px, too small for this spot. "
                        f"Use one at least {min_width}×{min_height}px so it doesn't look stretched or blurry."
                    )
                },
                status=400,
            )

        filename = f"uploads/{uuid.uuid4().hex}.{extension}"
        saved_path = default_storage.save(filename, uploaded)
        url = request.build_absolute_uri(default_storage.url(saved_path))
        return Response({"url": url}, status=201)


# Hero background videos: far bigger than photos (the shipped one is ~9.5MB), but
# capped so a mistaken upload (a raw camera file, minutes long) can't fill storage.
MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024


def detect_video_extension(header):
    """Identify an MP4 or WebM video from its own leading bytes, or return None.

    Same reasoning as detect_image_extension: the bytes decide, not the filename
    or Content-Type. Only formats every browser plays inline are accepted, so
    QuickTime (.mov, also an "ftyp" file but with the "qt  " brand) is refused.
    """
    if header[4:8] == b"ftyp" and header[8:12] != b"qt  ":
        return "mp4"
    if header.startswith(b"\x1a\x45\xdf\xa3"):  # EBML magic number (WebM/Matroska)
        return "webm"
    return None


class VideoUploadView(APIView):
    """Admin-only upload for the homepage hero video (see homepage.HOMEPAGE_SLOTS)."""

    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded = request.FILES.get("file")
        if uploaded is None:
            return Response({"detail": "No file provided."}, status=400)

        if uploaded.size > MAX_VIDEO_UPLOAD_BYTES:
            return Response(
                {"detail": "Video is too large. Maximum size is 50MB. Export a shorter or more compressed clip."},
                status=400,
            )

        # Only the header is needed; reading the whole file would hold up to 50MB in memory.
        header = uploaded.read(_HEADER_BYTES)
        uploaded.seek(0)
        extension = detect_video_extension(header)
        if extension is None:
            return Response({"detail": "Unsupported video. Use an MP4 or WebM file."}, status=400)

        filename = f"uploads/videos/{uuid.uuid4().hex}.{extension}"
        saved_path = default_storage.save(filename, uploaded)
        url = request.build_absolute_uri(default_storage.url(saved_path))
        return Response({"url": url}, status=201)

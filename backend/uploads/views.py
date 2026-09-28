import uuid

from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

MAX_UPLOAD_BYTES = 8 * 1024 * 1024

# Long enough to read every signature below (WebP's "WEBP" tag ends at byte 12).
_HEADER_BYTES = 12


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

        header = uploaded.read(_HEADER_BYTES)
        uploaded.seek(0)
        extension = detect_image_extension(header)
        if extension is None:
            return Response(
                {"detail": "Unsupported or corrupt image. Use a JPEG, PNG, WEBP, or GIF file."}, status=400
            )

        filename = f"uploads/{uuid.uuid4().hex}.{extension}"
        saved_path = default_storage.save(filename, uploaded)
        url = request.build_absolute_uri(default_storage.url(saved_path))
        return Response({"url": url}, status=201)

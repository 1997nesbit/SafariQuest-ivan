import uuid

from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}

MAX_UPLOAD_BYTES = 8 * 1024 * 1024


class ImageUploadView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded = request.FILES.get("file")
        if uploaded is None:
            return Response({"detail": "No file provided."}, status=400)

        extension = ALLOWED_CONTENT_TYPES.get(uploaded.content_type)
        if extension is None:
            return Response(
                {"detail": "Unsupported image type. Use JPEG, PNG, WEBP, or GIF."}, status=400
            )
        if uploaded.size > MAX_UPLOAD_BYTES:
            return Response({"detail": "Image is too large. Maximum size is 8MB."}, status=400)

        filename = f"uploads/{uuid.uuid4().hex}.{extension}"
        saved_path = default_storage.save(filename, uploaded)
        url = request.build_absolute_uri(default_storage.url(saved_path))
        return Response({"url": url}, status=201)

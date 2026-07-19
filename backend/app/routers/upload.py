from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.concurrency import run_in_threadpool

from app.models.permissions import Permission
from app.models.schemas import UploadResponse
from app.services.auth import require_permission
from app.services.supabase_client import upload_image
from app.services.validation import validate_image

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=UploadResponse)
async def upload_incident_image(
    file: UploadFile = File(...),
    _user: dict = Depends(require_permission(Permission.CAN_ANALYZE)),
):
    contents = await file.read()
    validate_image(file.content_type, contents)

    public_url, storage_path = await run_in_threadpool(
        upload_image, contents, file.filename, file.content_type
    )
    return UploadResponse(image_url=public_url, storage_path=storage_path)


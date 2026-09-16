import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.config import AI_TTS_API_KEY, AI_TTS_TIMEOUT_SECONDS, AI_TTS_URL

router = APIRouter()
logger = logging.getLogger(__name__)


class TextToVoiceRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(..., min_length=2, max_length=10)
    language_name: str | None = None
    user_email: str = ""
    client_name: str = "SSS"


@router.post("/text-to-voice")
def text_to_voice(payload: TextToVoiceRequest):
    if not AI_TTS_URL:
        logger.error("TTS is not configured: AI_TTS_URL is missing")
        raise HTTPException(status_code=503, detail="TTS service is not configured.")

    request_body = payload.model_dump(exclude_none=True)
    request_body["language"] = payload.language.lower()
    headers = {"Content-Type": "application/json", "Accept": "application/json, audio/mpeg"}
    if AI_TTS_API_KEY:
        headers["Authorization"] = f"Bearer {AI_TTS_API_KEY}"

    request = Request(
        AI_TTS_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlopen(request, timeout=AI_TTS_TIMEOUT_SECONDS) as upstream:
            content_type = upstream.headers.get_content_type()
            body = upstream.read()
            response_headers = {"Cache-Control": "no-store"}

            if content_type.startswith("audio/"):
                return Response(content=body, media_type=content_type, headers=response_headers)

            data = json.loads(body.decode("utf-8"))
            audio_base64 = data.get("audio_base64")
            if not audio_base64:
                logger.error("TTS response missing audio_base64: status=%s response=%s", upstream.status, data)
                raise HTTPException(status_code=502, detail="TTS response did not contain audio.")

            return JSONResponse(content={"audio_base64": audio_base64})
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        logger.error(
            "TTS provider request failed: status=%s payload=%s error=%s",
            exc.code,
            request_body,
            error_body,
        )
        raise HTTPException(status_code=502, detail="TTS provider request failed.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
        logger.error("TTS provider error: payload=%s error=%s", request_body, exc)
        raise HTTPException(status_code=502, detail="TTS provider request failed.") from exc

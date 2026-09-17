import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException

from app.config import (
    AI_TTS_API_KEY,
    AI_TTS_TIMEOUT_SECONDS,
    AI_TTS_URL,
    AI_TRANSLATE_API_KEY,
    AI_TRANSLATE_TIMEOUT_SECONDS,
    AI_TRANSLATE_URL,
)
from app.schemas.headmaster_schema import TranslateRequest

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/translate")
def translate_text(payload: TranslateRequest):
    target_language = (payload.target_language or "").strip()
    if not target_language:
        raise HTTPException(status_code=400, detail="target_language is required.")

    upstream_url = (AI_TRANSLATE_URL or AI_TTS_URL or "").strip()
    if not upstream_url:
        logger.error("Translation service is not configured: AI_TRANSLATE_URL and AI_TTS_URL are missing")
        raise HTTPException(status_code=503, detail="Translation service is not configured.")

    raw_text = payload.text
    if isinstance(raw_text, str):
        texts = [raw_text]
    else:
        texts = list(raw_text or [])

    request_body = {
        "text": texts,
        "target_language": target_language,
        "user_info": payload.user_info.model_dump(),
    }

    headers = {"Content-Type": "application/json"}
    auth_token = AI_TRANSLATE_API_KEY or AI_TTS_API_KEY
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    request = Request(
        upstream_url,
        data=json.dumps(request_body).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlopen(request, timeout=AI_TRANSLATE_TIMEOUT_SECONDS or AI_TTS_TIMEOUT_SECONDS or 30) as upstream:
            body = upstream.read()
            data = json.loads(body.decode("utf-8", errors="replace"))

            if isinstance(raw_text, str):
                translated_text = data.get("translated_text")
                if translated_text is None:
                    translated_list = data.get("translated")
                    if isinstance(translated_list, list) and translated_list:
                        translated_text = translated_list[0]
                if translated_text is None:
                    translated_text = raw_text
                return {"translated_text": translated_text}

            translated = data.get("translated")
            if isinstance(translated, list):
                return {"translated": translated}

            translated_texts = data.get("translated_texts")
            if isinstance(translated_texts, list):
                return {"translated": translated_texts}

            return {"translated": texts}

    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        logger.error(
            "Translation provider request failed: status=%s payload=%s error=%s",
            exc.code,
            request_body,
            error_body,
        )
        raise HTTPException(status_code=502, detail="Translation provider request failed.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
        logger.error("Translation provider error: payload=%s error=%s", request_body, exc)
        raise HTTPException(status_code=502, detail="Translation provider request failed.") from exc

# File: app/modules/ingestion/extractor.py
import base64
import json
import logging
from typing import Any, Dict, Optional

from google import genai
from google.genai import types

from app.config import settings

log = logging.getLogger(__name__)

# Initialize the client
client = None
try:
    if settings.GEMINI_API_KEY:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        log.info(
            "Ingestion AI Extractor configured successfully with Gemini 2.5 Flash."
        )
    else:
        log.warning("GEMINI_API_KEY not set. AI extraction will not be available.")
except Exception as e:
    client = None
    log.error(f"Ingestion AI Extractor failed to configure: {e}")


def extract_data_from_file(
    file_content: bytes, file_mime_type: str, prompt: str
) -> Optional[Dict[str, Any]]:
    """
    Extract structured data from a file using Gemini 2.5 Flash.

    Args:
        file_content: The raw bytes of the file
        file_mime_type: The MIME type (e.g., 'application/pdf', 'image/jpeg')
        prompt: The extraction prompt with schema instructions

    Returns:
        Extracted data as a dictionary, or None if extraction fails
    """
    if not client:
        log.error("AI client not available. Cannot process file.")
        return None

    try:
        model = "gemini-2.5-flash"

        # Encode file content to base64
        file_data_b64 = base64.b64encode(file_content).decode("utf-8")

        # Build the content parts: prompt + file
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                    types.Part(
                        inline_data=types.Blob(
                            mime_type=file_mime_type, data=file_data_b64
                        )
                    ),
                ],
            ),
        ]

        # Configure for JSON output
        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_budget=0,
            ),
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_NONE",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_NONE",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_NONE",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_NONE",
                ),
            ],
            response_mime_type="application/json",
        )

        # Stream the response and collect it
        full_response = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                full_response += chunk.text

        if not full_response.strip():
            log.error("Gemini API returned an empty response.")
            return None

        # Parse the JSON response
        return json.loads(full_response)

    except json.JSONDecodeError as e:
        log.error(f"Failed to parse JSON response from Gemini: {e}", exc_info=True)
        log.error(f"Response was: {full_response[:500]}")
        return None
    except Exception as e:
        log.error(f"Error processing file with Gemini: {e}", exc_info=True)
        return None

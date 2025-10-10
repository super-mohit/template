# File: app/modules/ai_policies/service.py
import json
import logging
from sqlalchemy.orm import Session
from app.config import settings
from app.models import BusinessObject, AiPolicy
from app.utils.auditing import log_audit_event
from google import genai
from google.genai import types

log = logging.getLogger(__name__)

# Initialize the client using the correct syntax
policy_client = None
try:
    if settings.GEMINI_API_KEY:
        policy_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        log.info("AI Policy Engine client configured successfully with Gemini 2.5 Flash.")
    else:
        log.warning("GEMINI_API_KEY not set. AI Policy Engine will not be available.")
except Exception as e:
    policy_client = None
    log.error(f"AI Policy Engine client failed to configure: {e}")

MEGA_PROMPT_TEMPLATE = """
You are an expert analyst AI. Your task is to analyze a business object based on a set of rules and provide a clear, structured JSON recommendation.

**Your output MUST be a single, valid JSON object with `recommendation` and `trace` keys.**
- `recommendation`: Your final decision (e.g., "APPROVE", "REVIEW", "REJECT").
- `trace`: An array of strings explaining your step-by-step reasoning.

**Business Rules to Follow:**
{rules}

**Data for Analysis:**
{data}

Analyze the data against the rules and provide your JSON output.
"""

def get_ai_decision(db: Session, business_object: BusinessObject):
    """
    Analyze a business object using AI policies and update its status.
    
    Args:
        db: Database session
        business_object: The BusinessObject to analyze
    """
    if not policy_client:
        log.error("Cannot get AI decision: AI client not available.")
        return

    log.info(f"Getting AI decision for BusinessObject ID: {business_object.id}")

    try:
        # 1. Fetch all active AI Policies
        active_policies = db.query(AiPolicy).filter(AiPolicy.is_active == True).all()
        if not active_policies:
            raise Exception("No active AI policies found in the database.")

        # 2. Compile rules for the prompt
        rules_text = "\n".join([f"- {p.natural_language_rule}" for p in active_policies])

        # 3. Format data for the prompt
        data_text = json.dumps(business_object.data, indent=2)

        # 4. Construct the final prompt
        final_prompt = MEGA_PROMPT_TEMPLATE.format(rules=rules_text, data=data_text)

        # 5. Make the AI call using correct Gemini 2.5 Flash syntax
        model = "gemini-2.5-flash"
        
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=final_prompt),
                ],
            ),
        ]
        
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
        for chunk in policy_client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                full_response += chunk.text
        
        if not full_response.strip():
            raise Exception("AI returned an empty response.")

        ai_result = json.loads(full_response)
        recommendation = ai_result.get("recommendation", "REVIEW")
        trace = ai_result.get("trace", ["AI failed to provide a trace."])

        # 6. Update the BusinessObject
        business_object.status = recommendation.lower()
        if isinstance(business_object.data, dict):
            business_object.data['ai_analysis'] = {"recommendation": recommendation, "trace": trace}
        
        log_audit_event(
            db=db,
            user_email="AI Policy Engine",
            action="AI_ANALYSIS_COMPLETE",
            entity_type="BusinessObject",
            entity_id=business_object.id,
            summary=f"AI recommended status: {recommendation}",
            details_json={"trace": trace}
        )
        db.commit()
        log.info(f"AI decision processed for BusinessObject ID: {business_object.id}. Recommendation: {recommendation}")

    except Exception as e:
        log.error(f"Error during AI decision process for ID {business_object.id}: {e}", exc_info=True)
        business_object.status = "error"
        if isinstance(business_object.data, dict):
             business_object.data['ai_error'] = str(e)
        log_audit_event(
            db=db,
            user_email="System",
            action="AI_ANALYSIS_FAILED",
            entity_type="BusinessObject",
            entity_id=business_object.id,
            summary="The AI decision-making process failed.",
            details_json={"error": str(e)}
        )
        db.commit()


import json
import re
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["Intelligence Artificielle"])

# Instance Groq légère pour le chat (rapide)
_groq = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.4,
)

# Instance Groq puissante pour le diagnostic
_groq_diag = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.2,
)


class DiagnoseRequest(BaseModel):
    ticket_id: UUID
    provider: Optional[Literal["groq", "ornith"]] = None


class ChatRequest(BaseModel):
    ticket_id: UUID
    message: str
    history: list[dict] = []
    provider: Optional[Literal["groq", "ornith"]] = None


class PreDiagChatRequest(BaseModel):
    client_id: UUID
    product_id: UUID
    invoice_id: Optional[UUID] = None
    product_label: str
    description: str
    messages: list[dict]


@router.post("/diagnose")
async def diagnose_ticket(
    data: DiagnoseRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await ai_service.diagnose(
            ticket_id=data.ticket_id,
            db=db,
            provider=data.provider,
        )
        return {"status": "success", "diagnostic": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur diagnostic IA : {str(e)}")


@router.get("/diagnostics/{ticket_id}")
async def get_diagnostic(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.sav_ticket import SavTicket

    result = await db.execute(select(SavTicket).where(SavTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    if not ticket.ai_diagnosis:
        raise HTTPException(status_code=404, detail="Aucun diagnostic disponible")
    return ticket.ai_diagnosis


@router.post("/pre-diagnostic-chat")
async def pre_diagnostic_chat(
    data: PreDiagChatRequest,
    db: AsyncSession = Depends(get_db),
):
    n_user_msgs = len([m for m in data.messages if m["role"] == "user"])

    system_prompt = f"""Tu es un assistant SAV expert. Un client décrit une panne sur son appareil.

Appareil : {data.product_label}
Description initiale : {data.description}

Ton rôle :
1. Poser des questions courtes UNE PAR UNE pour mieux comprendre la panne (max 3 questions).
2. Après 3 réponses du client OU si tu as assez d'infos avant, rendre ton verdict final.

RÈGLE CRITIQUE : Quand tu rends ton verdict, tu dois répondre UNIQUEMENT avec le JSON ci-dessous. Rien d'autre. Pas de phrase d'introduction, pas d'explication, pas de texte avant ou après le JSON. Juste le JSON brut.

Si le client PEUT résoudre seul (needs_technician = false) :
{{"done": true, "needs_technician": false, "summary": "résumé court", "repair_steps": ["étape 1", "étape 2"], "safety_warnings": ["avertissement"]}}

Si le client a BESOIN d'un technicien (needs_technician = true) :
{{"done": true, "needs_technician": true, "summary": "résumé court"}}

Règles :
- Tant que tu poses des questions, réponds en texte simple, UNE question à la fois. JAMAIS de JSON à ce stade.
- Quand tu rends le verdict : UNIQUEMENT le JSON, rien d'autre.
- Ne JAMAIS écrire "voici le verdict", "voici le résultat", ou tout texte avant le JSON.
- needs_technician = false si le client peut résoudre seul (problème logiciel, paramètre, entretien basique).
- needs_technician = true si intervention physique nécessaire (pièce cassée, fuite, problème électrique).
- Quand needs_technician = false, donne des étapes claires et concises (repair_steps).
- Si des précautions de sécurité s'appliquent, mets-les dans safety_warnings.
- Tu as reçu {n_user_msgs} réponse(s) du client jusqu'ici."""

    lc_messages = [SystemMessage(content=system_prompt)]
    for m in data.messages:
        if m["role"] == "user":
            lc_messages.append(HumanMessage(content=m["content"]))
        else:
            lc_messages.append(AIMessage(content=m["content"]))

    try:
        response = await _groq.ainvoke(lc_messages)
        answer = response.content.strip()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erreur Groq : {e}")

    # Extraire le JSON du verdict
    clean_answer = re.sub(r'```json\s*', '', answer)
    clean_answer = re.sub(r'```\s*$', '', clean_answer)

    # Chercher le premier objet JSON qui contient "done": true
    verdict = None
    # Essayer d'extraire en trouvant { et en comptant les accolades
    start = clean_answer.find('{')
    if start != -1:
        depth = 0
        for i in range(start, len(clean_answer)):
            if clean_answer[i] == '{':
                depth += 1
            elif clean_answer[i] == '}':
                depth -= 1
                if depth == 0:
                    candidate = clean_answer[start:i+1]
                    try:
                        parsed = json.loads(candidate)
                        if isinstance(parsed, dict) and parsed.get("done"):
                            verdict = parsed
                            break
                    except Exception:
                        pass
                    break

    if verdict:
        needs_tech = verdict.get("needs_technician", True)

        result = {
            "done": True,
            "needs_technician": needs_tech,
            "summary": verdict.get("summary", ""),
            "question": None,
            "guide_id": None,
            "guide_number": None,
        }

        if not needs_tech:
            guide = await _create_repair_guide(
                db=db,
                client_id=data.client_id,
                product_id=data.product_id,
                messages=data.messages,
                verdict=verdict,
            )
            result["guide_id"] = str(guide.id)
            result["guide_number"] = guide.guide_number
            result["repair_steps"] = verdict.get("repair_steps", [])
            result["safety_warnings"] = verdict.get("safety_warnings", [])

        return result

    # Aucun verdict détecté → poser une question (jamais de JSON brut)
    # Nettoyer la réponse pour retirer tout résidu JSON
    safe_answer = re.sub(r'\{[^}]*"done"[^}]*\}', '', clean_answer).strip()
    if not safe_answer:
        safe_answer = "Pouvez-vous me donner plus de détails sur votre problème ?"
    return {"done": False, "question": safe_answer, "needs_technician": None, "summary": None}


async def _create_repair_guide(
    db: AsyncSession,
    client_id,
    product_id,
    messages: list[dict],
    verdict: dict,
):
    """Crée un guide de réparation self-service (pas un ticket)."""
    from app.services.repair_guide_service import create_repair_guide
    from app.schemas.repair_guide import RepairGuideCreate

    guide_data = RepairGuideCreate(
        client_id=client_id,
        product_id=product_id,
        summary=verdict.get("summary", ""),
        repair_steps=verdict.get("repair_steps", []),
        safety_warnings=verdict.get("safety_warnings", []),
        conversation_history=messages,
    )
    guide = await create_repair_guide(db, guide_data)
    print(f"Guide de réparation créé : {guide.guide_number}")
    return guide


@router.post("/chat")
async def chat_with_technician(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Chat IA pour le technicien — utilise Groq directement."""
    from sqlalchemy import select
    from app.models.sav_ticket import SavTicket

    result = await db.execute(select(SavTicket).where(SavTicket.id == data.ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")

    system = f"""Tu es un assistant SAV expert qui aide les techniciens.
Ticket : {ticket.ticket_number}
Description client : {ticket.description_raw}
Diagnostic IA : {ticket.ai_diagnosis or 'Non disponible'}

Réponds de manière concise et technique."""

    lc_messages = [SystemMessage(content=system)]
    for m in data.history:
        if m["role"] == "user":
            lc_messages.append(HumanMessage(content=m["content"]))
        else:
            lc_messages.append(AIMessage(content=m["content"]))
    lc_messages.append(HumanMessage(content=data.message))

    try:
        response = await _groq.ainvoke(lc_messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erreur Groq : {e}")

    return {
        "ticket_id": str(data.ticket_id),
        "question": data.message,
        "answer": response.content,
        "provider": "groq",
    }

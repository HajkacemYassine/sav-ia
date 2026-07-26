import json
import re
import time

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

_groq = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.2,
)

FALLBACK = {
    "extracted_entities": {
        "product_type": "inconnu", "brand": None, "model": None,
        "symptoms": ["panne non identifiée"], "severity": "medium",
        "urgency": "normal", "estimated_age_years": None,
    },
    "probable_causes": [{"cause": "Diagnostic non disponible", "probability": 0.5, "explanation": ""}],
    "solutions": [{"step": 1, "action": "Contacter un technicien", "duration_minutes": 0}],
    "spare_parts_needed": [],
    "recommended_parts": [],
    "severity": "medium",
    "is_repairable": True,
    "confidence_score": 0.0,
    "technician_notes": "Diagnostic IA indisponible",
    "safety_warnings": [],
    "estimated_repair_cost": 0.0,
    "repairability": {
        "recommendation": "repair", "reason": "Indisponible",
        "repair_cost_estimate": 0.0, "replacement_cost_estimate": 0.0,
        "cost_ratio": 0.0, "economic_score": 0.5,
    },
    "processing_time_ms": 0,
}


async def run_diagnostic(
    description: str,
    product_id: str = None,
    db: AsyncSession = None,
    provider: str | None = None,
) -> dict:
    """Diagnostic complet en un seul appel Groq."""
    start_time = time.time()
    print(f"\n🤖 Démarrage diagnostic (Groq direct)...")

    system = """Tu es un expert technicien SAV avec 20 ans d'expérience.
Analyse la description de panne et génère un diagnostic complet.

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après :
{
  "extracted_entities": {
    "product_type": "type appareil",
    "brand": "marque ou null",
    "model": "modèle ou null",
    "symptoms": ["symptôme 1", "symptôme 2"],
    "severity": "low|medium|high|critical",
    "urgency": "urgent|normal|low",
    "estimated_age_years": null
  },
  "probable_causes": [
    {"cause": "cause précise", "probability": 0.85, "explanation": "explication"}
  ],
  "solutions": [
    {"step": 1, "action": "action à effectuer", "duration_minutes": 30}
  ],
  "spare_parts_needed": ["pièce 1", "pièce 2"],
  "is_repairable": true,
  "estimated_repair_cost": 50.0,
  "confidence_score": 0.8,
  "technician_notes": "notes pour le technicien",
  "safety_warnings": ["avertissement si nécessaire"],
  "repairability": {
    "recommendation": "repair|replace",
    "reason": "raison du choix",
    "repair_cost_estimate": 50.0,
    "replacement_cost_estimate": 300.0,
    "cost_ratio": 0.17,
    "economic_score": 0.83
  }
}

Règles de sévérité :
- critical : danger électrique, inondation, incendie
- high : appareil complètement inutilisable
- medium : fonctionnement dégradé
- low : problème mineur"""

    try:
        response = await _groq.ainvoke([
            SystemMessage(content=system),
            HumanMessage(content=f"Description de la panne : {description}"),
        ])
        text = response.content.strip()

        # Nettoyer le JSON si besoin
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group()
        result = json.loads(text)

        processing_time = int((time.time() - start_time) * 1000)
        print(f"✅ Diagnostic terminé en {processing_time}ms")

        return {
            "extracted_entities": result.get("extracted_entities", FALLBACK["extracted_entities"]),
            "probable_causes": result.get("probable_causes", []),
            "solutions": result.get("solutions", []),
            "spare_parts_needed": result.get("spare_parts_needed", []),
            "recommended_parts": [],
            "severity": result.get("extracted_entities", {}).get("severity", "medium"),
            "is_repairable": result.get("is_repairable", True),
            "confidence_score": result.get("confidence_score", 0.0),
            "technician_notes": result.get("technician_notes", ""),
            "safety_warnings": result.get("safety_warnings", []),
            "estimated_repair_cost": result.get("estimated_repair_cost", 0.0),
            "repairability": result.get("repairability", FALLBACK["repairability"]),
            "processing_time_ms": processing_time,
        }

    except Exception as e:
        print(f"❌ Erreur diagnostic Groq : {e}")
        FALLBACK["processing_time_ms"] = int((time.time() - start_time) * 1000)
        return FALLBACK

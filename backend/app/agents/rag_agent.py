from app.core.config import settings
from app.agents.prompts.diagnostic_prompt import DIAGNOSTIC_PROMPT
from app.agents.base import safe_llm_call
from app.rag.retriever import search_all_collections
from app.core.llm_provider import get_chat_llm

FALLBACK = {
    "probable_causes": [{"cause": "Diagnostic non disponible", "probability": 0.5, "explanation": ""}],
    "solutions": [{"step": 1, "action": "Contacter un technicien", "duration_minutes": 0}],
    "spare_parts_needed": [],
    "is_repairable": True,
    "estimated_repair_cost": 0.0,
    "confidence_score": 0.0,
    "technician_notes": "Diagnostic IA indisponible",
    "safety_warnings": [],
}


async def generate_diagnostic(
    description: str,
    entities: dict,
    product_id: str = None,
    provider: str | None = None,
) -> dict:
    """Génère un diagnostic basé sur le RAG."""

    # 1. Chercher dans Qdrant
    query = f"{entities.get('product_type', '')} {' '.join(entities.get('symptoms', []))}"
    rag_results = await search_all_collections(
        query=query,
        product_id=product_id,
        top_k=5,
    )

    # 2. Construire le contexte
    if rag_results:
        rag_context = "\n\n".join([
            f"[Score: {r['score']:.2f}] {r['text']}"
            for r in rag_results
        ])
    else:
        rag_context = "Aucune documentation disponible."

    # 3. Appeler le LLM avec retry (choisir provider dynamiquement)
    llm = get_chat_llm(provider=provider, temperature=0.1)
    chain = DIAGNOSTIC_PROMPT | llm
    return await safe_llm_call(
        chain=chain,
        inputs={
            "rag_context": rag_context,
            "product_type": entities.get("product_type", "appareil"),
            "brand": entities.get("brand", ""),
            "model": entities.get("model", ""),
            "symptoms": ", ".join(entities.get("symptoms", [])),
            "description": description,
        },
        fallback=FALLBACK,
        timeout=30,
        max_attempts=3,
    )
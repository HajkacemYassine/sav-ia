from langchain_groq import ChatGroq # Pour parler à Groq (LLM)
from app.core.config import settings # Pour lire les variables .env
from app.agents.prompts.nlp_prompt import NLP_PROMPT # Pour créer des prompts
from app.agents.base import safe_llm_call  # pour gérer les appels LLM avec timeout et fallback

# On crée la connexion avec Groq
llm = ChatGroq(
    model=settings.GROQ_MODEL,# "llama-3.3-70b-versatile"
    api_key=settings.GROQ_API_KEY,
    temperature=0.1,
)

FALLBACK = {
    "product_type": "inconnu",
    "brand": None,
    "model": None,
    "symptoms": ["panne non identifiée"],
    "severity": "medium",
    "urgency": "normal",
    "estimated_age_years": None,
}

#fonction pour extraire les entités clés de la description de panne
async def extract_entities(description: str) -> dict:#async parceque llm prend du temps pour répondre pour dire a fastapi d'attendre la réponse du llm
    """Extrait les entités clés de la description de panne."""
    # chain pour combiner le prompt et le LLM
    chain = NLP_PROMPT | llm
    return await safe_llm_call(
        chain=chain,
        inputs={"description": description},
        fallback=FALLBACK,
        timeout=30,
        max_attempts=3,
    )
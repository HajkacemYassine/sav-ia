from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from app.core.config import settings


def get_chat_llm(provider: str | None = None, temperature: float = 0.3):
    """
    Retourne le LLM à utiliser pour le chat technicien.

    provider : "groq" | "ornith" | None
               Si None, utilise USE_LM_STUDIO du .env comme défaut.
    """
    use_ornith = (
        provider == "ornith"
        if provider is not None
        else settings.USE_LM_STUDIO
    )

    if use_ornith:
        return ChatOpenAI(
            base_url=settings.LM_STUDIO_URL,
            api_key="not-needed",  # LM Studio n'exige pas de vraie clé
            model=settings.LM_STUDIO_MODEL,
            temperature=temperature,
        )

    return ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
    )
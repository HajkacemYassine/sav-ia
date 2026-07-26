import asyncio
from langchain_groq import ChatGroq
from app.core.config import settings
from app.core.retry import parse_llm_json


def create_llm(temperature: float = 0.1) -> ChatGroq:
    """Crée une instance LLM Groq avec la configuration standard."""
    return ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
    )


async def invoke_with_timeout(chain, inputs: dict, timeout: int = 30) -> str:
    """
    Invoque une LangChain chain avec un timeout.
    Si le LLM ne répond pas en 30s → lève une exception.
    """
    try:
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: chain.invoke(inputs)
            ),
            timeout=timeout
        )
        return response.content

    except asyncio.TimeoutError:
        raise Exception(f"LLM timeout après {timeout}s — réessayer plus tard")

#fonction pour gérer les appels LLM avec retry + timeout + fallback
async def safe_llm_call(
    chain,
    inputs: dict,
    fallback: dict,
    timeout: int = 30,
    max_attempts: int = 3,
) -> dict:
    """
    Appelle le LLM avec retry + timeout + fallback.

    Si tout échoue → retourne le fallback sans planter l'application.
    """
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            print(f"   🤖 Appel LLM (tentative {attempt}/{max_attempts})...")

            # Appel avec timeout (timeout cest le temps max pour que le LLM réponde)
            text = await invoke_with_timeout(chain, inputs, timeout=timeout)

            # Parser le JSON (parse_llm_json est défini dans app/core/retry.py pour gérer les erreurs de parsing)
            result = parse_llm_json(text)
            print(f"   ✅ LLM répondu correctement")
            return result

        except Exception as e:
            last_error = e
            print(f"   ⚠️ Tentative {attempt} échouée : {e}")

            if attempt < max_attempts:
                wait = attempt * 2  # 2s, 4s, 6s
                print(f"   ⏳ Attente {wait}s avant retry...")
                await asyncio.sleep(wait)

    # Tout a échoué → retourner le fallback
    print(f"   ❌ Toutes les tentatives ont échoué. Utilisation du fallback.")
    print(f"   Dernière erreur : {last_error}")
    return fallback
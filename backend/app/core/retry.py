import asyncio
import json
from functools import wraps


def with_retry(max_attempts: int = 3, delay: float = 1.0):
    """
    Décorateur qui réessaie une fonction async en cas d'échec.

    max_attempts : nombre maximum de tentatives
    delay        : délai entre chaque tentative (en secondes)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)

                except json.JSONDecodeError as e:
                    last_error = e
                    print(f"⚠️ Tentative {attempt}/{max_attempts} — JSON invalide : {e}")
                    if attempt < max_attempts:
                        await asyncio.sleep(delay)

                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()

                    # Erreurs qui ne méritent pas de retry
                    if "api key" in error_msg or "authentication" in error_msg:
                        print(f"❌ Erreur d'authentification — pas de retry : {e}")
                        raise

                    print(f"⚠️ Tentative {attempt}/{max_attempts} — Erreur : {e}")
                    if attempt < max_attempts:
                        await asyncio.sleep(delay * attempt)

            raise Exception(f"Échec après {max_attempts} tentatives. Dernière erreur : {last_error}")

        return wrapper
    return decorator


def parse_llm_json(text: str) -> dict:
    """
    Parse le JSON retourné par le LLM.
    Gère les cas où le LLM ajoute ```json ou du texte avant/après.
    """
    text = text.strip()

    # Cas 1 : ```json ... ```
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()

    # Cas 2 : ``` ... ```
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Cas 3 : Texte avant le JSON
    elif "{" in text:
        start = text.index("{")
        end = text.rindex("}") + 1
        text = text[start:end]

    return json.loads(text)
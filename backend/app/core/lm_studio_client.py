import httpx
import json
from app.core.config import settings


async def call_lm_studio(prompt: str, system_prompt: str = "") -> str:
    """
    Appelle LM Studio (compatible OpenAI API)
    Utilise Ornith-1.0-9B-GGUF pour:
    - Diagnostic technique fluide
    - Français de haute qualité
    - Instructions détaillées et sécurisées
    """
    try:
        print(f"\n🤖 LM Studio - Envoi requête...")
        print(f"   URL: {settings.LM_STUDIO_URL}/chat/completions")
        print(f"   Modèle: {settings.LM_STUDIO_MODEL}")
        print(f"   Prompt: {prompt[:50]}...")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.LM_STUDIO_URL}/chat/completions",
                json={
                    "model": settings.LM_STUDIO_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt or "Tu es un expert en diagnostic et réparation électronique.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "top_p": 0.95,
                },
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"   ❌ Erreur HTTP: {response.text}")
                return f"❌ Erreur LM Studio (HTTP {response.status_code}): {response.text[:100]}"
            
            data = response.json()
            print(f"   Réponse JSON: {json.dumps(data, indent=2)[:200]}...")
            
            # Vérifier la structure
            if "choices" not in data:
                print(f"   ❌ Pas de clé 'choices' dans la réponse!")
                print(f"   Clés disponibles: {list(data.keys())}")
                return f"❌ Réponse invalide de LM Studio (pas de 'choices'): {str(data)[:100]}"
            
            if len(data["choices"]) == 0:
                print(f"   ❌ Liste 'choices' vide!")
                return "❌ Erreur: LM Studio a retourné une liste vide"
            
            message_content = data["choices"][0].get("message", {}).get("content", "").strip()
            
            if not message_content:
                print(f"   ❌ Message vide dans la réponse!")
                print(f"   Contenu du premier choice: {data['choices'][0]}")
                return "❌ Erreur: LM Studio a retourné un message vide"
            
            print(f"   ✅ Réponse: {message_content[:50]}...")
            return message_content
            
    except httpx.ConnectError as e:
        print(f"   ❌ Connexion impossible!")
        error_msg = "❌ Impossible de se connecter à LM Studio sur http://localhost:1234/v1. Assurez-vous que: 1) LM Studio est ouvert 2) Le modèle Ornith est sélectionné 3) Le serveur local est démarré"
        print(f"   {error_msg}")
        return error_msg
    except httpx.TimeoutException:
        print(f"   ❌ Timeout (120s dépassé)")
        return "❌ Timeout: LM Studio a mis trop longtemps à répondre. Le modèle est peut-être surchargé."
    except json.JSONDecodeError as e:
        print(f"   ❌ Erreur JSON: {e}")
        return f"❌ Erreur: LM Studio a retourné du texte invalide"
    except Exception as e:
        print(f"   ❌ Erreur: {type(e).__name__}: {str(e)}")
        return f"❌ Erreur LM Studio: {str(e)}"

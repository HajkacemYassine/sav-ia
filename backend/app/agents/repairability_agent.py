import json
from langchain_groq import ChatGroq
from app.core.config import settings
from app.agents.prompts.repairability_prompt import REPAIRABILITY_PROMPT

llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.1,
)


async def evaluate_repairability(
    product_type: str,
    brand: str = None,
    repairable: bool = True,
    repair_cost: float = 0.0,
    product_value: float = 0.0,
    parts_available: bool = True,
    diagnosis_summary: str = "",
) -> dict:
    """
    Évalue s'il est préférable de réparer ou remplacer l'appareil.

    Logique :
    - Si repairable=False → remplacement direct
    - Si repair_cost > 50% product_value → remplacement
    - Sinon → réparation
    """
    try:
        # Règle rapide sans LLM
        if not repairable:
            return {
                "recommendation": "replace",
                "reason": "Cet appareil est classifié comme non réparable dans notre catalogue",
                "repair_cost_estimate": repair_cost,
                "replacement_cost_estimate": product_value,
                "cost_ratio": 1.0,
                "economic_score": 0.0,
                "additional_advice": "Nous vous recommandons de contacter notre service commercial pour un remplacement",
            }

        if product_value > 0 and repair_cost > 0:
            ratio = repair_cost / product_value
            if ratio > 0.5 and not parts_available:
                return {
                    "recommendation": "replace",
                    "reason": f"Le coût de réparation ({repair_cost}€) dépasse 50% de la valeur du produit ({product_value}€)",
                    "repair_cost_estimate": repair_cost,
                    "replacement_cost_estimate": product_value,
                    "cost_ratio": round(ratio, 2),
                    "economic_score": round(1 - ratio, 2),
                    "additional_advice": "Un remplacement serait plus économique sur le long terme",
                }

        # Appel LLM pour analyse approfondie
        chain = REPAIRABILITY_PROMPT | llm
        response = await chain.ainvoke({
            "product_type": product_type,
            "brand": brand or "inconnue",
            "repairable": "oui" if repairable else "non",
            "repair_cost": repair_cost,
            "product_value": product_value,
            "parts_available": "oui" if parts_available else "non",
            "diagnosis_summary": diagnosis_summary or "Non disponible",
        })

        text = response.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

    except Exception as e:
        # Fallback simple
        if product_value > 0 and repair_cost > 0:
            ratio = repair_cost / product_value
            recommendation = "repair" if ratio < 0.5 else "replace"
        else:
            recommendation = "repair"

        return {
            "recommendation": recommendation,
            "reason": "Évaluation basée sur les règles métier standard",
            "repair_cost_estimate": repair_cost,
            "replacement_cost_estimate": product_value,
            "cost_ratio": round(repair_cost / product_value, 2) if product_value > 0 else 0,
            "economic_score": 0.5,
            "additional_advice": "Consulter un technicien pour une évaluation précise",
        }
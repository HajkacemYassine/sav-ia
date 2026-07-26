import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.agents.orchestrator import run_diagnostic
from app.models.sav_ticket import SavTicket
from app.models.product import Product
from app.models.invoice import Invoice
from app.models.ai_diagnostic import AiDiagnostic


class AIService:

    async def diagnose(
        self,
        ticket_id: uuid.UUID,
        db: AsyncSession,
        provider: str | None = None,
    ) -> dict:
        """Lance le diagnostic IA complet pour un ticket."""

        # ── Étape 1 : Récupérer le ticket ──────────────
        ticket_result = await db.execute(
            select(SavTicket).where(SavTicket.id == ticket_id)
        )
        ticket = ticket_result.scalar_one_or_none()
        if not ticket:
            raise ValueError(f"Ticket {ticket_id} non trouvé")

        print(f"\n🎫 Ticket : {ticket.ticket_number}")

        # ── Étape 2 : Récupérer le produit ─────────────
        product_result = await db.execute(
            select(Product).where(Product.id == ticket.product_id)
        )
        product = product_result.scalar_one_or_none()
        product_id_str = str(ticket.product_id) if ticket.product_id else None

        # ── Étape 3 : Vérifier la garantie ─────────────
        warranty_valid = False
        if ticket.invoice_id:
            invoice_result = await db.execute(
                select(Invoice).where(Invoice.id == ticket.invoice_id)
            )
            invoice = invoice_result.scalar_one_or_none()
            if invoice:
                warranty_valid = invoice.warranty_end_date >= datetime.now().date()

        # ── Étape 4 : Lancer le diagnostic IA ──────────
        diagnostic_result = await run_diagnostic(
            description=ticket.description_raw,
            product_id=product_id_str,
            db=db,
            provider=provider,
        )

        # ── Étape 5 : Classification — besoin d'un technicien ? ──
        requires_technician = self._requires_technician(diagnostic_result)
        diagnostic_result["requires_technician"] = requires_technician

        # ── Étape 6 : Enrichir le résultat ─────────────
        diagnostic_result["ticket_id"] = str(ticket_id)
        diagnostic_result["ticket_number"] = ticket.ticket_number
        diagnostic_result["warranty_valid"] = warranty_valid
        diagnostic_result["product_info"] = {
            "brand": product.brand if product else None,
            "model": product.model if product else None,
            "category": product.category if product else None,
            "repairable": product.repairable if product else True,
        }

        # ── Étape 7 : Mettre à jour le ticket ──────────
        ticket.ai_diagnosis = diagnostic_result
        ticket.priority = self._calculate_priority(
            severity=diagnostic_result.get("severity", "medium"),
            warranty_valid=warranty_valid,
        )
        # Si le ticket est encore "open" (pas déjà escaladé/traité manuellement),
        # on applique la classification automatique.
        if ticket.status == "open":
            ticket.status = "open" if requires_technician else "self_service"

        # ── Étape 8 : Sauvegarder dans ai_diagnostics ──
        from app.core.config import settings

        llm_model_name = (
            settings.LM_STUDIO_MODEL if provider == "ornith" else settings.GROQ_MODEL
        )

        ai_diagnostic = AiDiagnostic(
            ticket_id=ticket_id,
            llm_model=llm_model_name,
            extracted_entities=diagnostic_result.get("extracted_entities", {}),
            probable_causes=diagnostic_result.get("probable_causes", []),
            recommended_parts=diagnostic_result.get("recommended_parts", []),
            rag_sources=diagnostic_result.get("rag_sources", []),
            confidence_score=diagnostic_result.get("confidence_score", 0.0),
            processing_time_ms=diagnostic_result.get("processing_time_ms", 0),
        )
        db.add(ai_diagnostic)

        await db.commit()
        await db.refresh(ticket)
        print(f"✅ Diagnostic sauvegardé — statut : {ticket.status}")
        print(f"   Technicien requis : {requires_technician}")

        return diagnostic_result

    async def get_part_recommendations(
        self,
        product_id: uuid.UUID,
        diagnosis: dict,
        db: AsyncSession,
    ) -> list[dict]:
        from app.agents.parts_agent import get_recommended_parts
        return await get_recommended_parts(
            db=db,
            product_id=str(product_id),
            parts_references=diagnosis.get("spare_parts_needed", []),
        )

    def _requires_technician(self, diagnostic: dict) -> bool:
        """
        Détermine si le ticket doit obligatoirement passer par un technicien.

        Règle (transparente, sans appel IA supplémentaire) :
        Nécessite un technicien si au moins une condition est vraie :
        - Sévérité high ou critical
        - Non réparable
        - Avertissement de sécurité présent
        - Confiance IA insuffisante (< 0.55)
        """
        severity = diagnostic.get("severity", "medium")
        is_repairable = diagnostic.get("is_repairable", True)
        safety_warnings = diagnostic.get("safety_warnings", [])
        confidence = diagnostic.get("confidence_score", 0.0)

        if severity in ("high", "critical"):
            return True
        if not is_repairable:
            return True
        if len(safety_warnings) > 0:
            return True
        if confidence < 0.55:
            return True
        return False

    def _calculate_priority(self, severity: str, warranty_valid: bool) -> str:
        if severity == "critical":
            return "critical"
        elif severity == "high" and warranty_valid:
            return "critical"
        elif severity == "high":
            return "high"
        elif severity == "medium":
            return "medium"
        else:
            return "low"


ai_service = AIService()
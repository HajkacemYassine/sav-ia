import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


class AiDiagnostic(Base):
    __tablename__ = "ai_diagnostics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("sav_tickets.id"), nullable=False)
    llm_model = Column(String(100), nullable=False)
    extracted_entities = Column(JSONB, nullable=False)
    probable_causes = Column(JSONB, nullable=False)
    recommended_parts = Column(JSONB, nullable=False)
    rag_sources = Column(JSONB, nullable=False, default=list)
    confidence_score = Column(Float, nullable=False, default=0.0)
    processing_time_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relations
    ticket = relationship("SavTicket", back_populates="diagnostics")
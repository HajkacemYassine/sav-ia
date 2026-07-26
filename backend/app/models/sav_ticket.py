import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


class SavTicket(Base):
    __tablename__ = "sav_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(20), unique=True, nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    assigned_technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id"), nullable=True)
    description_raw = Column(Text, nullable=False)
    status = Column(String(20), default="open")
    priority = Column(String(10), default="medium")
    ai_diagnosis = Column(JSONB, nullable=True)
    conversation_history = Column(JSONB, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relations
    client = relationship("Client", back_populates="tickets")
    product = relationship("Product", back_populates="tickets")
    invoice = relationship("Invoice", back_populates="tickets")
    technician = relationship("Technician", back_populates="tickets")
    diagnostics = relationship("AiDiagnostic", back_populates="ticket")
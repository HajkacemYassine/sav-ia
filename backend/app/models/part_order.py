import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class PartOrder(Base):
    __tablename__ = "part_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("sav_tickets.id"), nullable=False)
    spare_part_id = Column(UUID(as_uuid=True), ForeignKey("spare_parts.id"), nullable=False)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id"), nullable=True)
    quantity = Column(Integer, default=1)
    status = Column(String(20), default="ordered")  # ordered | received
    ordered_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    ticket = relationship("SavTicket")
    spare_part = relationship("SparePart")
    technician = relationship("Technician")
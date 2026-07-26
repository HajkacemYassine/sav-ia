import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


class RepairGuide(Base):
    __tablename__ = "repair_guides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guide_number = Column(String(20), unique=True, nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    summary = Column(Text, nullable=False)
    repair_steps = Column(JSONB, nullable=False, default=list)
    safety_warnings = Column(JSONB, nullable=True, default=list)
    conversation_history = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relations
    client = relationship("Client", back_populates="repair_guides")
    product = relationship("Product", back_populates="repair_guides")

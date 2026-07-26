import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base
class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False, server_default='')
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    # Relations
    invoices = relationship("Invoice", back_populates="client")
    tickets = relationship("SavTicket", back_populates="client")
    repair_guides = relationship("RepairGuide", back_populates="client")
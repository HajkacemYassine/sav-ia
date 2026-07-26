import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Technician(Base):
    __tablename__ = "technicians"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False, server_default='')
    speciality = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True)

    # Relations
    tickets = relationship("SavTicket", back_populates="technician")
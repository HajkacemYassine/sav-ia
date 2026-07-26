import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_code = Column(String(50), unique=True, nullable=True)  
    name = Column(String(200), nullable=False)
    contact_email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)

    # Relations
    spare_parts = relationship("SparePart", back_populates="supplier")
    invoices = relationship("Invoice", back_populates="supplier")
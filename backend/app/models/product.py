import uuid
from sqlalchemy import Column, String, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_code = Column(String(50), unique=True, nullable=True)  
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    repairable = Column(Boolean, nullable=False, default=True)
    avg_repair_cost = Column(Numeric(10, 2), nullable=True)
    schema_image_url = Column(String(500), nullable=True)

    # Relations
    invoice_products = relationship("InvoiceProduct", back_populates="product")
    tickets = relationship("SavTicket", back_populates="product")
    spare_parts = relationship("ProductSparePart", back_populates="product")
    repair_guides = relationship("RepairGuide", back_populates="product")
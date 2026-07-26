import uuid
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class SparePart(Base):
    __tablename__ = "spare_parts"
    #spare part cest les pieces detachees qui sont utilisees pour reparer les produits
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)

    # Relations
    supplier = relationship("Supplier", back_populates="spare_parts")
    products = relationship("ProductSparePart", back_populates="spare_part")
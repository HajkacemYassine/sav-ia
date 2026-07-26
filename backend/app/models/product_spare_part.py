from sqlalchemy import Column, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductSparePart(Base):
    __tablename__ = "product_spare_parts"
    # This table represents the many-to-many relationship between products and spare parts, with additional attributes.
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True)
    spare_part_id = Column(UUID(as_uuid=True), ForeignKey("spare_parts.id"), primary_key=True)
    is_primary = Column(Boolean, default=False)
    compatibility_note = Column(Text, nullable=True)

    # Relations
    product = relationship("Product", back_populates="spare_parts")
    spare_part = relationship("SparePart", back_populates="products")
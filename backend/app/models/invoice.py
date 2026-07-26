import uuid
from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    purchase_date = Column(Date, nullable=False)
    warranty_end_date = Column(Date, nullable=False)

    client = relationship("Client", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")
    invoice_products = relationship("InvoiceProduct", back_populates="invoice", cascade="all, delete-orphan")
    tickets = relationship("SavTicket", back_populates="invoice")
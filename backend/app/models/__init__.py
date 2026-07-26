from app.models.client import Client
from app.models.technician import Technician
from app.models.admin import Admin
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.invoice import Invoice
from app.models.invoice_product import InvoiceProduct
from app.models.spare_part import SparePart
from app.models.product_spare_part import ProductSparePart
from app.models.sav_ticket import SavTicket
from app.models.ai_diagnostic import AiDiagnostic
from app.models.part_order import PartOrder
from app.models.repair_guide import RepairGuide

__all__ = [
    "Client",
    "Technician",
    "Admin",
    "Supplier",
    "Product",
    "Invoice",
    "InvoiceProduct",
    "SparePart",
    "ProductSparePart",
    "SavTicket",
    "AiDiagnostic",
    "PartOrder",
    "RepairGuide",
]
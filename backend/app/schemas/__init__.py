from app.schemas.client import ClientCreate, ClientResponse, ClientSummary
from app.schemas.product import ProductResponse, ProductSummary
from app.schemas.spare_part import SparePartResponse, SparePartUpdate, SparePartRecommendation
from app.schemas.ticket import (
    TicketCreate, TicketResponse, TicketSummary,
    TicketStatusUpdate, TicketAssign, TicketClose,
    TicketStatus, TicketPriority
)
from app.schemas.technician import TechnicianResponse
from app.schemas.warranty import WarrantyStatus
from app.schemas.diagnostic import DiagnosticResponse, ProbableCause, Solution
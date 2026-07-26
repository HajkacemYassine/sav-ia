import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireIdentity } from '@/components/RequireIdentity'
import Home from '@/pages/Home'
import DeclarePanne from '@/pages/client/DeclarePanne'
import MesTickets from '@/pages/client/MesTickets'
import TicketDetail from '@/pages/client/TicketDetail'
import GuideDetail from '@/pages/client/GuideDetail'
import TechDashboard from '@/pages/tech/Dashboard'
import TicketWork from '@/pages/tech/TicketWork'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminDocuments from '@/pages/admin/Documents'
import AdminTechnicians from '@/pages/admin/Technicians'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<RequireIdentity role="client" />}>
          <Route path="/client" element={<MesTickets />} />
          <Route path="/client/new" element={<DeclarePanne />} />
          <Route path="/client/tickets/:ticketId" element={<TicketDetail />} />
          <Route path="/client/guides/:guideId" element={<GuideDetail />} />
        </Route>

        <Route element={<RequireIdentity role="technician" />}>
          <Route path="/tech" element={<TechDashboard />} />
          <Route path="/tech/tickets/:ticketId" element={<TicketWork />} />
        </Route>

        <Route element={<RequireIdentity role="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/technicians" element={<AdminTechnicians />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

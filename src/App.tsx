import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import InterventionDetail from "./pages/InterventionDetail";
import Clients from "./pages/Clients";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import DevisDetail from "./pages/DevisDetail";
import DevisPreview from "./pages/DevisPreview";
import FactureDetail from "./pages/FactureDetail";
import FacturePreview from "./pages/FacturePreview";
import InterventionsDevis from "./pages/InterventionsDevis";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/interventions-devis"
            element={
              <DashboardLayout>
                <InterventionsDevis />
              </DashboardLayout>
            }
          />
          <Route
            path="/interventions/:id"
            element={
              <DashboardLayout>
                <InterventionDetail />
              </DashboardLayout>
            }
          />
          <Route
            path="/devis/:id"
            element={
              <DashboardLayout>
                <DevisDetail />
              </DashboardLayout>
            }
          />
          <Route
            path="/devis/preview/:id"
            element={
              <DashboardLayout>
                <DevisPreview />
              </DashboardLayout>
            }
          />
          <Route
            path="/facture/new"
            element={
              <DashboardLayout>
                <FactureDetail />
              </DashboardLayout>
            }
          />
          <Route
            path="/facture/new/:devisId"
            element={
              <DashboardLayout>
                <FactureDetail />
              </DashboardLayout>
            }
          />
          <Route
            path="/facture/:id/edit"
            element={
              <DashboardLayout>
                <FactureDetail />
              </DashboardLayout>
            }
          />
          <Route
            path="/facture/preview/:id"
            element={
              <DashboardLayout>
                <FacturePreview />
              </DashboardLayout>
            }
          />
          <Route
            path="/clients"
            element={
              <DashboardLayout>
                <Clients />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
          <Route
            path="/calendar"
            element={
              <DashboardLayout>
                <Calendar />
              </DashboardLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

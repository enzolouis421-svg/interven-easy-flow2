import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Interventions from "./pages/Interventions";
import InterventionDetail from "./pages/InterventionDetail";
import Clients from "./pages/Clients";
import Techniciens from "./pages/Techniciens";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/interventions"
            element={
              <DashboardLayout>
                <Interventions />
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
            path="/clients"
            element={
              <DashboardLayout>
                <Clients />
              </DashboardLayout>
            }
          />
          <Route
            path="/techniciens"
            element={
              <DashboardLayout>
                <Techniciens />
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

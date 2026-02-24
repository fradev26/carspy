import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import Index from "./pages/Index";
import Search from "./pages/Search";
import ListingDetail from "./pages/ListingDetail";
import Sell from "./pages/Sell";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Compare from "./pages/Compare";
import { CompareProvider } from "./hooks/useCompare";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompareProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/zoeken" element={<Search />} />
              <Route path="/auto/:id" element={<ListingDetail />} />
              <Route path="/verkopen" element={
                <ProtectedRoute>
                  <Sell />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/favorieten" element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/vergelijken" element={<Compare />} />
            </Route>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CompareProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

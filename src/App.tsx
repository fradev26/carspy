import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { CompareProvider } from "./hooks/useCompare";
import Index from "./pages/Index";

const Search = lazy(() => import("./pages/Search"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Sell = lazy(() => import("./pages/Sell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Compare = lazy(() => import("./pages/Compare"));
const Messages = lazy(() => import("./pages/Messages"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AutoWaarde = lazy(() => import("./pages/AutoWaarde"));
const DealerInventory = lazy(() => import("./pages/DealerInventory"));
const Dealers = lazy(() => import("./pages/Dealers"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompareProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/zoeken" element={<Search />} />
                <Route path="/auto/:id" element={<ListingDetail />} />
                <Route path="/verkopen" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/zakelijk" element={<ProtectedRoute><BusinessDashboard /></ProtectedRoute>} />
                <Route path="/dealer-analytics" element={<ProtectedRoute><BusinessDashboard /></ProtectedRoute>} />
                <Route path="/favorieten" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/vergelijken" element={<Compare />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/voorwaarden" element={<Terms />} />
                <Route path="/wat-is-mijn-auto-waard" element={<AutoWaarde />} />
                <Route path="/berichten" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/dealer/:slug" element={<DealerInventory />} />
                <Route path="/dealers" element={<Dealers />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </CompareProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

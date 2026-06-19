import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SettingsRouteGuard } from "@/components/SettingsRouteGuard";
import { AppLayout } from "./layouts/AppLayout";
import { CompareProvider } from "./hooks/useCompare";
import { FavoritesProvider } from "./hooks/useFavorites";
import { ThemeProvider } from "./hooks/useTheme";
import Index from "./pages/Index";

const Search = lazy(() => import("./pages/Search"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const DealerLayout = lazy(() => import("./layouts/DealerLayout"));
const DealerSalesAI = lazy(() => import("./pages/dealer/SalesAI"));
const DealerInventoryPage = lazy(() => import("./pages/dealer/Inventory"));
const DealerListingOperating = lazy(() => import("./pages/dealer/ListingOperating"));
const DealerImport = lazy(() => import("./pages/dealer/Import"));
const DealerAnalytics = lazy(() => import("./pages/dealer/Analytics"));
const DealerSettings = lazy(() => import("./pages/dealer/Settings"));
const DealerSubscription = lazy(() => import("./pages/dealer/Subscription"));
const DealerInventoryPreferences = lazy(() => import("./pages/dealer/InventoryPreferences"));
const DealerUsers = lazy(() => import("./pages/dealer/Users"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const MyLeadsPanel = lazy(() => import("./components/MyLeadsPanel"));
const Sell = lazy(() => import("./pages/Sell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Compare = lazy(() => import("./pages/Compare"));
const Messages = lazy(() => import("./pages/Messages"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AutoWaarde = lazy(() => import("./pages/AutoWaarde"));
const DealerInventory = lazy(() => import("./pages/DealerInventory"));
const Dealers = lazy(() => import("./pages/Dealers"));
const MyListings = lazy(() => import("./pages/account/MyListings"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const Help = lazy(() => import("./pages/Help"));
const Contact = lazy(() => import("./pages/Contact"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
      <CompareProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FavoritesProvider>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/zoeken" element={<Search />} />
                <Route path="/auto/:id" element={<ListingDetail />} />
                <Route path="/verkopen" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dealer-analytics" element={<ProtectedRoute><BusinessDashboard /></ProtectedRoute>} />
                <Route path="/zakelijk" element={<ProtectedRoute><DealerLayout /></ProtectedRoute>}>
                  <Route index element={<DealerSalesAI />} />
                  <Route path="dashboard" element={<BusinessDashboard />} />
                  <Route path="voorraad" element={<DealerInventoryPage />} />
                  <Route path="voorraad-instellingen" element={<SettingsRouteGuard requires="dealer"><DealerInventoryPreferences /></SettingsRouteGuard>} />
                  <Route path="voorraad/:id" element={<DealerListingOperating />} />
                  <Route path="import" element={<DealerImport />} />
                  <Route path="leads" element={<div className="container py-6"><MyLeadsPanel /></div>} />
                  <Route path="analytics" element={<DealerAnalytics />} />
                  <Route path="instellingen" element={<SettingsRouteGuard requires="dealer"><DealerSettings /></SettingsRouteGuard>} />
                  <Route path="abonnement" element={<DealerSubscription />} />
                  <Route path="gebruikers" element={<SettingsRouteGuard requires="dealer"><DealerUsers /></SettingsRouteGuard>} />
                </Route>
                <Route path="/uitnodiging" element={<AcceptInvite />
                <Route path="/favorieten" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/vergelijken" element={<Compare />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/voorwaarden" element={<Terms />} />
                <Route path="/wat-is-mijn-auto-waard" element={<AutoWaarde />} />
                <Route path="/berichten" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/dealer/:slug" element={<DealerInventory />} />
                <Route path="/dealers" element={<Dealers />} />
                <Route path="/account/advertenties" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
                <Route path="/account/zoekalerts" element={<Navigate to="/favorieten?tab=alerts" replace />} />
                <Route path="/account/recent" element={<Navigate to="/favorieten?tab=recent" replace />} />
                <Route path="/account/profiel" element={<SettingsRouteGuard requires="private"><AccountSettings defaultTab="profiel" /></SettingsRouteGuard>} />
                <Route path="/account/meldingen" element={<SettingsRouteGuard requires="private"><AccountSettings defaultTab="meldingen" /></SettingsRouteGuard>} />
                <Route path="/account/privacy" element={<SettingsRouteGuard requires="private"><AccountSettings defaultTab="privacy" /></SettingsRouteGuard>} />
                <Route path="/account/weergave" element={<SettingsRouteGuard requires="private"><AccountSettings defaultTab="weergave" /></SettingsRouteGuard>} />
                <Route path="/account/instellingen" element={<SettingsRouteGuard requires="private"><AccountSettings /></SettingsRouteGuard>} />
                <Route path="/help" element={<Help />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/wachtwoord-reset" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </FavoritesProvider>
        </BrowserRouter>
      </TooltipProvider>
      </CompareProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

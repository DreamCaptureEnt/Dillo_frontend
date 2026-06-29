import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { LogoLoader } from "./components/Preloader";
import CartDrawer from "./pages/CartDrawer";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import LiveShowPage from "./pages/LiveShowPage";
import CostToCostPage from "./pages/CostToCostPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import VideoShoppingPage from "./pages/VideoShoppingPage";

import "./index.css";

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));

// ─── Scroll-to-top on every route change ─────────────────────────────────────
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);
  return null;
}

// ─── Stub pages ───────────────────────────────────────────────────────────────
const WishlistPage = () => (
  <div className="container mx-auto px-4 py-20">
    <h1 className="font-display text-3xl font-bold text-dillo-charcoal">Wishlist</h1>
    <p className="font-body text-gray-500 mt-3">Your saved items will appear here.</p>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center px-4">
      <h1 className="font-display text-6xl font-bold text-dillo-red">404</h1>
      <p className="font-body text-xl text-dillo-charcoal mt-4 mb-6">Page not found</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  </div>
);

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      {/* Cart Drawer — lives outside main so it overlays everything */}
      <CartDrawer />

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/account" element={<AccountPage />} />

          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/live-show" element={<LiveShowPage />} />
          <Route path="/cost-to-cost" element={<CostToCostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/video-shopping" element={<VideoShoppingPage />} />
          <Route path="/admin/login" element={
            <Suspense fallback={<LogoLoader size="md" label="Loading admin..." className="min-h-[45vh]" />}>
              <AdminLoginPage />
            </Suspense>
          } />
          <Route path="/admin/*" element={
            <Suspense fallback={<LogoLoader size="md" label="Loading dashboard..." className="min-h-[45vh]" />}>
              <AdminDashboardPage />
            </Suspense>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;

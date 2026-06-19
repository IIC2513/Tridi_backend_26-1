import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import AboutUs from "./pages/AboutUs/AboutUs";
import Catalogue from "./pages/Catalogue/Catalogue";
import DocsPage from "./pages/DocsPage/DocsPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import Profile from "./pages/Profile/Profile";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CardProvider } from "./context/CardContext";
import { PurchaseProvider } from "./context/PurchaseContext";
import ConfirmCard from "./pages/ConfirmCard/ConfirmCard";
import PurchasesPage from "./pages/PurchasesPage/PurchasesPage";
import './App.css'

function WebApp() {

  return (
    <Router>
      <div className="App">
        <AuthProvider>
          <CartProvider>
            <CardProvider>
                <PurchaseProvider>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/catalogue" element={<Catalogue />} />
                        <Route path="/docs-page" element={<DocsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/users/:username" element={<Profile />} />
                        <Route path="/my-cards" element={<ConfirmCard />} />
                        <Route path="/my-purchases" element={<PurchasesPage />} />
                    </Routes>
                </PurchaseProvider>
            </CardProvider>
          </CartProvider>
        </AuthProvider>
      </div>
    </Router>
  );
}

export default WebApp;

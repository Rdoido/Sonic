import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Promotions from "./pages/Promotions";
import GamePage from "./pages/GamePage";
import History from "./pages/History";
import Invite from "./pages/Invite";
import Support from "./pages/Support";
import Admin from "./pages/Admin";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/deposito" element={<Deposit />} />
            <Route path="/saque" element={<Withdraw />} />
            <Route path="/promocoes" element={<Promotions />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/historico" element={<History />} />
            <Route path="/convidar" element={<Invite />} />
            <Route path="/suporte" element={<Support />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#0d1f3a',
                color: '#fff',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

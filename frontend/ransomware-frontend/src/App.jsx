import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { WebSocketProvider } from "./context/WebSocketProvider";
import DashboardHome from "./pages/DashboardHome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Monitor from "./pages/Monitor";
import Alerts from "./pages/Alerts";
import Backup from "./pages/Backup";
import Recovery from "./pages/Recovery";
import Users from "./pages/Users";

export default function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Dashboard />}>
                                <Route index element={<DashboardHome />} />
                                <Route path="users" element={<Users />} />
                                <Route path="monitor" element={<Monitor />} />
                                <Route path="alerts" element={<Alerts />} />
                                <Route path="backup" element={<Backup />} />
                                <Route path="recovery" element={<Recovery />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </WebSocketProvider>
        </AuthProvider>
    );
}
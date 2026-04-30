import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import AuthLayout from "@/layouts/AuthLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Dashboard from "@/pages/Dashboard";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import PayCalculator from "@/pages/PayCalculator";
import Register from "@/pages/Register";
import WorkEntry from "@/pages/WorkEntry";
import { useAuthStore } from "@/stores/authStore";
import * as React from "react";

export default function App() {
  React.useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<SidebarLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/work" element={<WorkEntry />} />
            <Route path="/pay" element={<PayCalculator />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

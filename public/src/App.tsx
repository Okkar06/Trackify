import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SidebarLayout from "@/layouts/SidebarLayout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import StyleGuide from "@/pages/StyleGuide";
import WorkEntry from "@/pages/WorkEntry";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/work" element={<WorkEntry />} />
          <Route path="/styleguide" element={<StyleGuide />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

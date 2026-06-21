import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Locations from "@/pages/Locations";
import DailyOps from "@/pages/DailyOps";
import Procurement from "@/pages/Procurement";
import Transactions from "@/pages/Transactions";
import Inspections from "@/pages/Inspections";
import Fees from "@/pages/Fees";
import Forecast from "@/pages/Forecast";
import QueueSystem from "@/pages/QueueSystem";
import CustomerOrder from "@/pages/CustomerOrder";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/customer-order" element={<CustomerOrder />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/daily-ops" element={<DailyOps />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/queue" element={<QueueSystem />} />
        </Route>
      </Routes>
    </Router>
  );
}

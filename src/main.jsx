
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import App from "./App.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";
import Checkout from "./pages/Checkout";
import OrderReceipt from "./pages/OrderReceipt";
import AdminOrders from "./admin/AdminOrders";
import DeviceVerification from "./admin/DeviceVerification";
import ReturnsManagement from "./admin/ReturnsManagement";
import CustomerReturnRequest from "./pages/CustomerReturnRequest";
import "./index.css";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
  path="/admin/device-verification"
  element={<DeviceVerification />}
/>
<Route
  path="/admin/returns"
  element={<ReturnsManagement />}
/>
<Route
  path="/returns/request"
  element={<CustomerReturnRequest />}
/>

        <Route
          path="/admin/products"
          element={<AdminProducts />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-receipt" element={<OrderReceipt />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);

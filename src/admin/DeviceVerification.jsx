
import { useState } from "react";
import { supabase } from "../lib/supabase";
import api from "../services/api";
import "./admin.css";

export default function DeviceVerification() {
  const [identifierType, setIdentifierType] = useState("serial");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verifyDevice(event) {
    event.preventDefault();
    setResult(null);
    setError("");

    const value = identifier.trim();

    if (!value) {
      setError("Enter a serial number or barcode.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Please log in as an administrator.");
      }

      const params =
        identifierType === "serial"
          ? { serial: value }
          : { barcode: value };

      const response = await api.get("/admin/devices/verify", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not verify this device."
      );
    } finally {
      setLoading(false);
    }
  }

  const device = result?.device;
  const order = device?.orders;
  const item = device?.order_items;
  const product = device?.products;

  return (
    <main className="admin-page device-verification-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">DAVID COMMUNICATIONS</p>
          <h1>Device Verification</h1>
          <p>
            Check a registered device before processing a return or warranty
            enquiry.
          </p>
        </div>
      </div>

      <section className="admin-panel verification-search-panel">
        <h2>Search device registry</h2>

        <form onSubmit={verifyDevice} className="verification-form">
          <label htmlFor="identifierType">Search by</label>
          <select
            id="identifierType"
            value={identifierType}
            onChange={(event) => {
              setIdentifierType(event.target.value);
              setResult(null);
              setError("");
            }}
          >
            <option value="serial">Serial number</option>
            <option value="barcode">Barcode</option>
          </select>

          <label htmlFor="identifier">
            {identifierType === "serial" ? "Serial number" : "Barcode"}
          </label>
          <input
            id="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={
              identifierType === "serial"
                ? "Enter device serial number"
                : "Enter barcode"
            }
            autoComplete="off"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Verify device"}
          </button>
        </form>

        {error && <p className="verification-error">{error}</p>}
      </section>

      {result && (
        <section className="admin-panel verification-result-panel">
          <div
            className={`verification-status ${
              result.verified ? "is-verified" : "is-unverified"
            }`}
          >
            <strong>
              {result.verified ? "Verified paid order" : "Not verified as sold"}
            </strong>
            <p>{result.message}</p>
          </div>

          {device && (
            <div className="verification-details">
              <h2>Device details</h2>
              <p><strong>Product:</strong> {product?.name || item?.product_name || "Not available"}</p>
              <p><strong>Brand:</strong> {product?.brand || "Not available"}</p>
              <p><strong>Serial number:</strong> {device.serial_number || "Not recorded"}</p>
              <p><strong>Barcode:</strong> {device.barcode || "Not recorded"}</p>
              <p><strong>Order number:</strong> {order?.order_number || "Not available"}</p>
              <p><strong>Order date:</strong> {order?.created_at ? new Date(order.created_at).toLocaleString() : "Not available"}</p>
              <p><strong>Payment status:</strong> {order?.payment_status || "Unknown"}</p>
              <p><strong>Order status:</strong> {order?.status || "Unknown"}</p>
              <p><strong>Warranty until:</strong> {device.warranty_until || "Not recorded"}</p>
              <p><strong>Device registry status:</strong> {device.device_status}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

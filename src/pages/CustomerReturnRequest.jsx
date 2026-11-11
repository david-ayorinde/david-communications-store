
import { useState } from "react";
import api from "../services/api";
import "./CustomerReturnRequest.css";

const initialForm = {
  order_number: "",
  identifier: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  reason: "",
};

export default function CustomerReturnRequest() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await api.post("/customer/returns", form);
      setResult(response.data);
      setForm(initialForm);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your return request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="customer-return-page">
      <section className="customer-return-card">
        <p className="customer-return-brand">DAVID COMMUNICATIONS</p>
        <h1>Request a Return</h1>
        <p className="customer-return-intro">
          Submit a return or warranty enquiry for a device purchased from our
          store. Your order and device details will be checked.
        </p>

        {result ? (
          <div className="customer-return-success" role="status">
            <h2>Request received</h2>
            <p>{result.message}</p>
            <p>
              <strong>Return reference:</strong>{" "}
              {result.return?.return_number}
            </p>
            <p>
              <strong>Status:</strong> {result.return?.status}
            </p>
            <p>
              Keep this reference for your enquiry. Submission does not mean
              that a refund or replacement has been approved.
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={submitRequest} className="customer-return-form">
            <label htmlFor="order_number">Order number</label>
            <input
              id="order_number"
              name="order_number"
              value={form.order_number}
              onChange={updateField}
              placeholder="e.g. DC-20261025-AB12CD34"
              maxLength={100}
              required
            />

            <label htmlFor="identifier">Device serial number or barcode</label>
            <input
              id="identifier"
              name="identifier"
              value={form.identifier}
              onChange={updateField}
              placeholder="Enter the identifier on your device"
              maxLength={200}
              required
            />

            <label htmlFor="customer_name">Full name</label>
            <input
              id="customer_name"
              name="customer_name"
              value={form.customer_name}
              onChange={updateField}
              maxLength={150}
              autoComplete="name"
              required
            />

            <label htmlFor="customer_email">Email address</label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              value={form.customer_email}
              onChange={updateField}
              maxLength={254}
              autoComplete="email"
              required
            />

            <label htmlFor="customer_phone">Phone number</label>
            <input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              value={form.customer_phone}
              onChange={updateField}
              maxLength={40}
              autoComplete="tel"
              required
            />

            <label htmlFor="reason">Why are you requesting a return?</label>
            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={updateField}
              maxLength={2000}
              rows={5}
              placeholder="Describe the issue with the item..."
              required
            />

            {error && (
              <p className="customer-return-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit return request"}
            </button>
          </form>
        )}

        <p className="customer-return-footnote">
          Requests are subject to order verification, inspection and the
          applicable return policy.
        </p>
      </section>
    </main>
  );
}

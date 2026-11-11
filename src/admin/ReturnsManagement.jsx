
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import api from "../services/api";
import "./admin.css";

const statuses = [
  "requested",
  "inspecting",
  "approved",
  "rejected",
  "completed",
];

const resolutions = ["refund", "replacement", "repair", "no_action"];

export default function ReturnsManagement() {
  const [returns, setReturns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("requested");
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const getToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Please log in as an administrator.");
    }

    return data.session.access_token;
  }, []);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const params = filter === "all" ? {} : { status: filter };

      const response = await api.get("/admin/returns", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setReturns(response.data.returns || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load return requests."
      );
    } finally {
      setLoading(false);
    }
  }, [filter, getToken]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  function openReturn(item) {
    setSelected(item);
    setNotes(item.inspection_notes || "");
    setStatus(item.status);
    setResolution(item.resolution || "");
    setRefundAmount(
      item.refund_amount === null || item.refund_amount === undefined
        ? ""
        : String(item.refund_amount)
    );
    setNotice("");
    setError("");
  }

  async function saveReturn(event) {
    event.preventDefault();

    if (!selected) return;

    if (
      ["rejected", "completed"].includes(selected.status)
    ) {
      setError("This return is already in a final status.");
      return;
    }

    if (!statuses.includes(status)) {
      setError("Select a valid status.");
      return;
    }

    if (resolution && !resolutions.includes(resolution)) {
      setError("Select a valid resolution.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const token = await getToken();

      const payload = {
        status,
        inspection_notes: notes,
        resolution: resolution || null,
      };

      if (refundAmount.trim() !== "") {
        const amount = Number(refundAmount);

        if (!Number.isFinite(amount) || amount < 0) {
          setError("Enter a valid refund amount.");
          setSaving(false);
          return;
        }

        payload.refund_amount = amount;
      }

      const response = await api.patch(
        `/admin/returns/${selected.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotice(response.data.message || "Return updated.");
      setSelected(null);
      await loadReturns();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update this return."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page returns-page">
      <header className="returns-heading">
        <div>
          <p className="admin-eyebrow">DAVID COMMUNICATIONS</p>
          <h1>Returns Management</h1>
          <p>Review returned devices, inspection notes and resolutions.</p>
        </div>

        <button
          type="button"
          className="returns-refresh"
          onClick={loadReturns}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <section className="returns-summary">
        <div className="returns-summary-card">
          <span>Total shown</span>
          <strong>{returns.length}</strong>
        </div>
        <div className="returns-summary-card">
          <span>Requested</span>
          <strong>
            {returns.filter((item) => item.status === "requested").length}
          </strong>
        </div>
        <div className="returns-summary-card">
          <span>Inspecting</span>
          <strong>
            {returns.filter((item) => item.status === "inspecting").length}
          </strong>
        </div>
        <div className="returns-summary-card">
          <span>Approved</span>
          <strong>
            {returns.filter((item) => item.status === "approved").length}
          </strong>
        </div>
      </section>

      <section className="admin-panel returns-list-panel">
        <div className="returns-toolbar">
          <h2>Return requests</h2>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter returns by status"
          >
            <option value="all">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="returns-error">{error}</p>}
        {notice && <p className="returns-notice">{notice}</p>}

        {loading ? (
          <p>Loading return records...</p>
        ) : returns.length === 0 ? (
          <p>No return records found for this filter.</p>
        ) : (
          <div className="returns-table-wrap">
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Device identifier</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((item) => (
                  <tr key={item.id}>
                    <td>{item.return_number}</td>
                    <td>
                      <strong>{item.customer_name}</strong>
                      <small>{item.customer_phone}</small>
                    </td>
                    <td>
                      {item.device_registry?.serial_number ||
                        item.device_registry?.barcode ||
                        "Not recorded"}
                    </td>
                    <td>{item.orders?.order_number || "—"}</td>
                    <td>
                      <span className={`return-status status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openReturn(item)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="returns-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="returns-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="returns-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="returns-modal-heading">
              <div>
                <p className="admin-eyebrow">RETURN REVIEW</p>
                <h2 id="returns-modal-title">{selected.return_number}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close return review"
              >
                Close
              </button>
            </div>

            <div className="returns-customer-details">
              <p><strong>Customer:</strong> {selected.customer_name}</p>
              <p><strong>Email:</strong> {selected.customer_email}</p>
              <p><strong>Phone:</strong> {selected.customer_phone}</p>
              <p><strong>Reason:</strong> {selected.reason}</p>
              <p>
                <strong>Serial/barcode:</strong>{" "}
                {selected.device_registry?.serial_number ||
                  selected.device_registry?.barcode ||
                  "Not recorded"}
              </p>
              <p>
                <strong>Order:</strong>{" "}
                {selected.orders?.order_number || "Not available"}
              </p>
            </div>

            {["rejected", "completed"].includes(selected.status) ? (
              <p>This return is final and cannot be edited here.</p>
            ) : (
              <form className="returns-edit-form" onSubmit={saveReturn}>
                <label htmlFor="return-status">Status</label>
                <select
                  id="return-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  required
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <label htmlFor="return-notes">Inspection notes</label>
                <textarea
                  id="return-notes"
                  rows={4}
                  maxLength={5000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Describe the condition and inspection findings..."
                />

                <label htmlFor="return-resolution">Resolution</label>
                <select
                  id="return-resolution"
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                >
                  <option value="">Choose a resolution</option>
                  <option value="refund">Refund</option>
                  <option value="replacement">Replacement</option>
                  <option value="repair">Repair</option>
                  <option value="no_action">No action</option>
                </select>

                <label htmlFor="refund-amount">Refund amount (NGN)</label>
                <input
                  id="refund-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  placeholder="Optional"
                />

                <p className="returns-help">
                  Recording a refund does not send money. Process refunds only
                  through your verified payment provider or authorised payment
                  procedure.
                </p>

                {error && <p className="returns-error">{error}</p>}

                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save review"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

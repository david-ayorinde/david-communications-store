
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import api from "../services/api";
import "./admin.css";

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Number(value) || 0);

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [savingId, setSavingId] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await api.get("/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId, status) {
    setSavingId(orderId);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await api.patch(
        `/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? response.data.order : order
        )
      );

      if (selectedOrder?.order?.id === orderId) {
        setSelectedOrder((current) => ({
          ...current,
          order: response.data.order,
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update order."
      );
    } finally {
      setSavingId("");
    }
  }

  async function viewOrder(orderId) {
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await api.get(`/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedOrder(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load order details."
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filter === "all" || order.status === filter;

    const query = search.trim().toLowerCase();

    const matchesSearch = [
      order.order_number,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>DAVID COMMUNICATIONS</h2>
        <p>Administration</p>

        <button onClick={() => navigate("/admin/products")}>
          Products
        </button>

        <button className="active" onClick={() => navigate("/admin/orders")}>
          Orders
        </button>

        <button onClick={logout}>Sign out</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Customer Orders</h1>
            <p>Review orders and manage fulfilment status.</p>
          </div>

          <button onClick={loadOrders}>Refresh</button>
        </header>

        {error && <p className="orders-error">{error}</p>}

        <section className="orders-stats">
          <div>
            <span>Total orders loaded</span>
            <strong>{orders.length}</strong>
          </div>

          <div>
            <span>Pending orders</span>
            <strong>
              {orders.filter((o) => o.status === "pending").length}
            </strong>
          </div>

          <div>
            <span>Completed orders</span>
            <strong>
              {orders.filter((o) => o.status === "completed").length}
            </strong>
          </div>
        </section>

        <section className="orders-panel">
          <div className="orders-toolbar">
            <input
              placeholder="Search order number, customer, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p>No matching orders found.</p>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                        <small>
                          {new Date(order.created_at).toLocaleDateString("en-NG")}
                        </small>
                      </td>

                      <td>
                        {order.customer_name}
                        <small>{order.customer_phone}</small>
                      </td>

                      <td>{money(order.total_amount)}</td>

                      <td>{order.payment_status}</td>

                      <td>
                        <select
                          value={order.status}
                          disabled={
                            savingId === order.id ||
                            order.status === "cancelled" ||
                            order.status === "completed"
                          }
                          onChange={(event) =>
                            updateStatus(order.id, event.target.value)
                          }
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button onClick={() => viewOrder(order.id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedOrder && (
          <div className="order-modal-backdrop">
            <section className="order-modal">
              <button
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>

              <h2>Order details</h2>
              <h3>{selectedOrder.order.order_number}</h3>

              <p><strong>Name:</strong> {selectedOrder.order.customer_name}</p>
              <p><strong>Email:</strong> {selectedOrder.order.customer_email}</p>
              <p><strong>Phone:</strong> {selectedOrder.order.customer_phone}</p>
              <p><strong>Address:</strong> {selectedOrder.order.delivery_address}</p>
              <p><strong>Payment:</strong> {selectedOrder.order.payment_status}</p>

              <h3>Items</h3>

              {selectedOrder.items.map((item) => (
                <div className="order-detail-item" key={item.id}>
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <strong>{money(item.subtotal)}</strong>
                </div>
              ))}

              <hr />
              <h3>Total: {money(selectedOrder.order.total_amount)}</h3>

              <p>
                This screen does not confirm that payment has been received.
                Verify payment separately before dispatching goods.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

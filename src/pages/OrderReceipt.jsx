
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiHome,
  FiPrinter,
  FiShoppingBag,
} from "react-icons/fi";
import "./OrderReceipt.css";

const money = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function OrderReceipt() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const order = state?.order;
  const items = state?.items || [];

  function printReceipt() {
    window.print();
  }

  if (!order) {
    return (
      <main className="dc-receipt-page">
        <section className="dc-receipt-unavailable">
          <div className="dc-receipt-empty-icon"><FiShoppingBag /></div>
          <h1>Receipt unavailable</h1>
          <p>
            This receipt is not available in the current browser session.
            If you have an order number, keep it handy when contacting
            DAVID COMMUNICATIONS for assistance.
          </p>
          <button className="dc-receipt-primary" onClick={() => navigate("/")}>
            <FiHome /> Return to store
          </button>
        </section>
      </main>
    );
  }

  const orderDate = order.created_at
    ? new Date(order.created_at)
    : null;

  const validDate =
    orderDate && !Number.isNaN(orderDate.getTime());

  return (
    <main className="dc-receipt-page">
      <div className="dc-receipt-container">
        <button
          className="dc-receipt-back no-print"
          onClick={() => navigate("/")}
        >
          <FiArrowLeft /> Continue shopping
        </button>

        <section className="dc-receipt-card">
          <header className="dc-receipt-banner">
            <div className="dc-receipt-brand-mark">DC</div>
            <div className="dc-receipt-brand-text">
              <strong>DAVID COMMUNICATIONS</strong>
              <span>Technology • Devices • Accessories</span>
            </div>
            <span className="dc-receipt-label">ORDER RECEIPT</span>
          </header>

          <div className="dc-receipt-success">
            <div className="dc-receipt-check"><FiCheckCircle /></div>
            <h1>Your order request is recorded!</h1>
            <p>
              Thank you for choosing DAVID COMMUNICATIONS.
              Keep this receipt for your order reference.
            </p>
          </div>

          <div className="dc-receipt-reference">
            <div>
              <span>ORDER NUMBER</span>
              <strong>{order.order_number || "Not available"}</strong>
            </div>
            <div className="dc-receipt-date">
              <span>DATE PLACED</span>
              <strong>
                {validDate
                  ? orderDate.toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not available"}
              </strong>
            </div>
          </div>

          <section className="dc-receipt-section">
            <h2>Customer & delivery details</h2>
            <div className="dc-receipt-customer-grid">
              <div className="dc-receipt-detail">
                <span>Customer name</span>
                <strong>{order.customer_name || "—"}</strong>
              </div>
              <div className="dc-receipt-detail">
                <span>Email address</span>
                <strong>{order.customer_email || "—"}</strong>
              </div>
              <div className="dc-receipt-detail">
                <span>Phone number</span>
                <strong>{order.customer_phone || "—"}</strong>
              </div>
              <div className="dc-receipt-detail dc-receipt-address">
                <span>Delivery address</span>
                <strong>{order.delivery_address || "—"}</strong>
              </div>
            </div>
          </section>

          <section className="dc-receipt-section">
            <div className="dc-receipt-items-heading">
              <h2>Order items</h2>
              <span>{items.length} product{items.length === 1 ? "" : "s"}</span>
            </div>

            <div className="dc-receipt-table-wrap">
              <table className="dc-receipt-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty.</th>
                    <th>Unit price</th>
                    <th className="dc-align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id || item.product_id || `${item.product_name}-${index}`}
                    >
                      <td className="dc-receipt-product-name">
                        {item.product_name || item.name || "Product"}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unit_price ?? item.price)}</td>
                      <td className="dc-align-right">
                        {money(
                          item.subtotal ??
                            Number(item.unit_price ?? item.price) *
                              Number(item.quantity)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!items.length && (
              <p className="dc-receipt-no-items">
                Item details are not available in this receipt view.
              </p>
            )}
          </section>

          <section className="dc-receipt-total-section">
            <div className="dc-receipt-statuses">
              <div>
                <span>Order status</span>
                <strong className="dc-status-badge">
                  {String(order.status || "pending").replace(/_/g, " ")}
                </strong>
              </div>
              <div>
                <span>Payment status</span>
                <strong className="dc-status-badge dc-status-unpaid">
                  {String(order.payment_status || "unpaid").replace(/_/g, " ")}
                </strong>
              </div>
            </div>

            <div className="dc-receipt-grand-total">
              <span>Total amount</span>
              <strong>{money(order.total_amount)}</strong>
            </div>
          </section>

          <div className="dc-receipt-payment-notice">
            <FiCheckCircle />
            <div>
              <strong>Order request confirmation — not a payment receipt</strong>
              <p>
                Your order has been recorded, but this document does not
                confirm that payment has been made. Payment remains subject
                to confirmation through an approved payment process.
              </p>
            </div>
          </div>

          <footer className="dc-receipt-footer">
            <strong>Thank you for shopping with us!</strong>
            <p>DAVID COMMUNICATIONS · Shop smart. Stay connected.</p>
            <small>Please keep your order number for future enquiries.</small>
          </footer>

          <div className="dc-receipt-actions no-print">
            <button className="dc-receipt-secondary" onClick={() => navigate("/")}>
              <FiHome /> Back to store
            </button>
            <button className="dc-receipt-primary" onClick={printReceipt}>
              <FiPrinter /> Print / Save as PDF
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

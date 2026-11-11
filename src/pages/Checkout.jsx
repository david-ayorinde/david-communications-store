
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiLock, FiMapPin, FiPackage, FiShield, FiShoppingBag, FiUser } from "react-icons/fi";
import api from "../services/api";
import "./Checkout.css";

const money = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = location.state?.cart || [];

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const estimatedTotal = cart.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your cart is empty. Please return to the store.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/orders", {
        ...form,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });

      navigate("/order-receipt", {
        state: {
          order: response.data.order,
          items: response.data.items,
        },
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't submit your order. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!cart.length) {
    return (
      <main className="dc-checkout-page">
        <section className="dc-empty-cart">
          <div className="dc-empty-icon">
            <FiShoppingBag />
          </div>
          <h1>Your cart is waiting</h1>
          <p>
            You haven't added any products yet. Explore our store and find
            something you'll love.
          </p>
          <button
            className="dc-primary-btn"
            onClick={() => navigate("/")}
          >
            <FiArrowLeft /> Return to store
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="dc-checkout-page">
      <div className="dc-checkout-container">
        <button
          type="button"
          className="dc-back-link"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft /> Back to shopping
        </button>

        <header className="dc-checkout-heading">
          <div>
            <span className="dc-eyebrow">DAVID COMMUNICATIONS STORE</span>
            <h1>Checkout</h1>
            <p>Just a few details and your order request will be on its way.</p>
          </div>

          <div className="dc-secure-label">
            <FiLock />
            <span>Secure order submission</span>
          </div>
        </header>

        <div className="dc-checkout-steps">
          <div className="dc-step dc-step-complete">
            <span><FiCheckCircle /></span>
            <div><strong>Your cart</strong><small>Products selected</small></div>
          </div>
          <div className="dc-step-line dc-line-active" />
          <div className="dc-step dc-step-current">
            <span>2</span>
            <div><strong>Checkout</strong><small>Your details</small></div>
          </div>
          <div className="dc-step-line" />
          <div className="dc-step">
            <span>3</span>
            <div><strong>Confirmation</strong><small>Order receipt</small></div>
          </div>
        </div>

        <form onSubmit={submitOrder} className="dc-checkout-layout">
          <div className="dc-checkout-main">
            <section className="dc-panel">
              <div className="dc-panel-heading">
                <div className="dc-panel-icon"><FiUser /></div>
                <div>
                  <h2>Customer information</h2>
                  <p>Enter the details we can use to contact you.</p>
                </div>
              </div>

              <div className="dc-form-grid">
                <label className="dc-field dc-field-full">
                  <span>Full name <b>*</b></span>
                  <input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={updateField}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    maxLength={120}
                    required
                  />
                </label>

                <label className="dc-field">
                  <span>Email address <b>*</b></span>
                  <input
                    name="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={updateField}
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    required
                  />
                </label>

                <label className="dc-field">
                  <span>Phone number <b>*</b></span>
                  <input
                    name="customer_phone"
                    type="tel"
                    value={form.customer_phone}
                    onChange={updateField}
                    autoComplete="tel"
                    placeholder="e.g. 08012345678"
                    maxLength={40}
                    required
                  />
                </label>
              </div>
            </section>

            <section className="dc-panel">
              <div className="dc-panel-heading">
                <div className="dc-panel-icon"><FiMapPin /></div>
                <div>
                  <h2>Delivery information</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              <label className="dc-field">
                <span>Full delivery address <b>*</b></span>
                <textarea
                  name="delivery_address"
                  value={form.delivery_address}
                  onChange={updateField}
                  autoComplete="street-address"
                  placeholder="House number, street, area, city and state"
                  maxLength={500}
                  rows={4}
                  required
                />
                <small>Include landmarks or other useful directions.</small>
              </label>
            </section>

            <div className="dc-order-notice">
              <FiShield />
              <div>
                <strong>No payment is collected on this page</strong>
                <p>
                  This form submits an unpaid order request. Payment and
                  delivery arrangements will be confirmed separately.
                </p>
              </div>
            </div>

            {error && (
              <div className="dc-checkout-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <aside className="dc-order-sidebar">
            <section className="dc-panel dc-summary-panel">
              <div className="dc-summary-title">
                <div>
                  <span className="dc-eyebrow">YOUR PURCHASE</span>
                  <h2>Order summary</h2>
                </div>
                <span className="dc-item-count">
                  {cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} items
                </span>
              </div>

              <div className="dc-summary-products">
                {cart.map((item) => (
                  <div className="dc-summary-item" key={item.id}>
                    <div className="dc-product-thumb">
                      {item.image_urls?.[0] || item.image_url || item.image ? (
                        <img
                          src={item.image_urls?.[0] || item.image_url || item.image}
                          alt={item.name}
                        />
                      ) : (
                        <FiPackage />
                      )}
                      <span>{item.quantity}</span>
                    </div>
                    <div className="dc-summary-product-info">
                      <strong>{item.name}</strong>
                      <small>{money(item.price)} each</small>
                    </div>
                    <strong className="dc-line-price">
                      {money(Number(item.price) * Number(item.quantity))}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="dc-summary-calculations">
                <div><span>Subtotal</span><span>{money(estimatedTotal)}</span></div>
                <div><span>Delivery</span><span className="dc-confirm-later">To be confirmed</span></div>
                <div className="dc-grand-total">
                  <span>Estimated total</span>
                  <strong>{money(estimatedTotal)}</strong>
                </div>
                <p>Final product prices and stock are verified by our server.</p>
              </div>

              <button
                type="submit"
                className="dc-primary-btn dc-submit-order"
                disabled={loading}
              >
                {loading ? (
                  <><span className="dc-spinner" /> Submitting order...</>
                ) : (
                  <>Submit order request <FiArrowLeft className="dc-submit-arrow" /></>
                )}
              </button>

              <div className="dc-safe-checkout">
                <FiLock />
                <span>Your information is submitted securely.</span>
              </div>
            </section>
          </aside>
        </form>

        <footer className="dc-checkout-footer">
          <span>© {new Date().getFullYear()} DAVID COMMUNICATIONS</span>
          <span>Shop smart. Stay connected.</span>
        </footer>
      </div>
    </main>
  );
}

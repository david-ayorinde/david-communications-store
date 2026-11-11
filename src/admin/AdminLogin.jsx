
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Smartphone, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import api from "../services/api";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) throw loginError;

      const token = data.session?.access_token;

      if (!token) {
        throw new Error("No active session was returned. Please try again.");
      }

      try {
        await api.get("/products/admin/check", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (accessError) {
        await supabase.auth.signOut();

        if (accessError.response?.status === 403) {
          throw new Error(
            "This account is not authorized to manage the store."
          );
        }

        if (accessError.response?.status === 401) {
          throw new Error(
            "Your session could not be verified. Please sign in again."
          );
        }

        throw new Error(
          "Unable to verify admin access. Check that your backend is running."
        );
      }

      navigate("/admin/products", { replace: true });
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link to="/" className="admin-brand">
          <span className="admin-brand-icon">
            <Smartphone size={27} />
          </span>
          <span>
            <strong>DAVID</strong>
            <small>COMMUNICATIONS</small>
          </span>
        </Link>

        <div className="admin-login-heading">
          <div className="admin-security-icon">
            <ShieldCheck size={25} />
          </div>
          <span className="admin-eyebrow">STORE MANAGEMENT</span>
          <h1>Administrator login</h1>
          <p>Sign in to manage products, prices and inventory.</p>
        </div>

        {error && (
          <div className="admin-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-field">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={loading}
          >
            {loading ? "Verifying access..." : "Sign in securely"}
          </button>
        </form>

        <p className="admin-login-note">
          <ShieldCheck size={15} />
          Restricted access for authorized store administrators.
        </p>

        <Link to="/" className="admin-back-link">
          ← Return to the online store
        </Link>
      </section>
    </main>
  );
}

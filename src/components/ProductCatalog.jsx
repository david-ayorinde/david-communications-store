
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProductCatalog.css";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

const categories = [
  "All",
  "Phones",
  "Laptops",
  "Game Consoles",
  "Accessories",
  "Audio",
];

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");

        if (active) {
          setProducts(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Could not load products. Please check your connection and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch = [
        product.name,
        product.brand,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  function addToCart(product) {
    if (Number(product.stock) < 1) return;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          setNotice("You have reached the available stock for this item.");
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your cart.`);
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

function requestOrder() {
  if (!cart.length) {
    setNotice("Add a product to your cart first.");
    return;
  }

  navigate("/checkout", {
    state: {
      cart: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });


    const lines = cart
      .map(
        (item) =>
          `${item.name} x ${item.quantity} — ${formatPrice(
            Number(item.price) * item.quantity
          )}`
      )
      .join("\n");

    const message = [
      "Hello DAVID COMMUNICATIONS, I would like to request these products:",
      "",
      lines,
      "",
      `Estimated total: ${formatPrice(cartTotal)}`,
      "",
      "Please confirm availability and the final payment details.",
    ].join("\n");

    const whatsappNumber = "2347036888555";
    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="catalog-section" id="products">
      <div className="catalog-heading">
        <div>
          <span className="catalog-eyebrow">DAVID COMMUNICATIONS</span>
          <h2>Explore Our Products</h2>
          <p>
            Phones, laptops, gaming devices and accessories.
          </p>
        </div>

        <div className="catalog-cart-count" aria-live="polite">
          🛒 Cart: {cartCount}
        </div>
      </div>

      <div className="catalog-controls">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search phones, laptops, accessories..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <p className="catalog-notice" role="status">
          {notice}
        </p>
      )}

      {loading && <p>Loading available products...</p>}

      {!loading && error && (
        <div className="catalog-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="catalog-message">
          No matching products found. Try another search or category.
        </div>
      )}

      <div className="product-grid">
        {filteredProducts.map((product) => {
          const image = product.image_urls?.[0];

          return (
            <article className="product-card" key={product.id}>
              <div className="product-image-wrap">
                {image ? (
                  <img
                    className="product-image"
                    src={image}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="product-image-placeholder">
                    No image available
                  </div>
                )}

                <span className="product-category">
                  {product.category}
                </span>
              </div>

              <div className="product-info">
                <p className="product-brand">
                  {product.brand || "DAVID COMMUNICATIONS"}
                </p>

                <h3>{product.name}</h3>

                <p className="product-description">
                  {product.description || "Contact us for product details."}
                </p>

                <div className="product-bottom">
                  <div>
                    <strong className="product-price">
                      {formatPrice(product.price)}
                    </strong>

                    <p
                      className={
                        Number(product.stock) > 0
                          ? "stock-available"
                          : "stock-unavailable"
                      }
                    >
                      {Number(product.stock) > 0
                        ? `${product.stock} available`
                        : "Out of stock"}
                    </p>
                  </div>

                  <button
                    className="add-cart-button"
                    onClick={() => addToCart(product)}
                    disabled={Number(product.stock) < 1}
                  >
                    {Number(product.stock) > 0
                      ? "Add to cart"
                      : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="catalog-cart-summary">
          <div>
            <strong>{cartCount} item(s) in your cart</strong>
            <p>Estimated total: {formatPrice(cartTotal)}</p>
            <small>
              Final availability and price should be confirmed before payment.
            </small>
          </div>

          <button onClick={requestOrder}>
            Proceed to Checkout
          </button>
        </div>
      )}
    </section>
  );
}

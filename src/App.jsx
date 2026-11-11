
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Cable,
  ShieldCheck,
  Truck,
  MessageCircle,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
} from "lucide-react";
import api from "./services/api";
import ProductCatalog from "./components/ProductCatalog";
import "./App.css";

const categories = [
  { name: "All Products", icon: Store },
  { name: "Phones", icon: Smartphone },
  { name: "Laptops", icon: Laptop },
  { name: "Game Consoles", icon: Gamepad2 },
  { name: "Accessories", icon: Headphones },
  { name: "Audio", icon: Headphones },
];

const sampleProducts = [
  {
    id: "demo-1",
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    category: "Phones",
    price: 600000,
    stock: 5,
    description: "Premium smartphone. Contact us to confirm the exact specification and condition.",
    image_urls: [
      "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-2",
    name: "Samsung Galaxy Smartphone",
    brand: "Samsung",
    category: "Phones",
    price: 650000,
    stock: 8,
    description: "Samsung smartphone. Ask us to confirm model, storage and availability.",
    image_urls: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-3",
    name: "Laptop Computer",
    brand: "HP",
    category: "Laptops",
    price: 850000,
    stock: 3,
    description: "Laptop listing preview. Confirm processor, RAM, storage and condition before ordering.",
    image_urls: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-4",
    name: "Wireless Game Controller",
    brand: "Gaming",
    category: "Game Consoles",
    price: 270000,
    stock: 7,
    description: "Gaming accessory preview. Contact the store to confirm compatibility.",
    image_urls: [
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-5",
    name: "Portable Bluetooth Speaker",
    brand: "JBL",
    category: "Audio",
    price: 85000,
    stock: 12,
    description: "Portable audio product preview. Confirm the exact model before purchase.",
    image_urls: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-6",
    name: "Wireless Headphones",
    brand: "Audio",
    category: "Accessories",
    price: 45000,
    stock: 10,
    description: "Wireless headphones preview. Ask us about available models and warranty.",
    image_urls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-7",
    name: "Fast Charging Adapter",
    brand: "Accessories",
    category: "Accessories",
    price: 18000,
    stock: 20,
    description: "Charging accessory preview. Check supported devices and charging specifications.",
    image_urls: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "demo-8",
    name: "Portable Power Bank",
    brand: "Accessories",
    category: "Accessories",
    price: 30000,
    stock: 15,
    description: "Portable charging solution. Confirm capacity and output before purchase.",
    image_urls: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getImage(product) {
  if (Array.isArray(product.image_urls)) {
    return product.image_urls[0] || "";
  }

  return product.image_url || "";
}

function ProductCard({ product, onAdd, onView }) {
  const image = getImage(product);
  const outOfStock = Number(product.stock) <= 0;

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-image-button"
        onClick={() => onView(product)}
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <img
            className="product-image"
            src={image}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="image-placeholder">
            <Smartphone size={44} />
            <span>Product image coming soon</span>
          </div>
        )}
        <span className="image-badge">
          {product.brand || product.category}
        </span>
      </button>

      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <button
          className="product-name-button"
          type="button"
          onClick={() => onView(product)}
        >
          {product.name}
        </button>

        <p className="product-price">{formatPrice(product.price)}</p>

        <p className={`stock-label ${outOfStock ? "out-stock" : ""}`}>
          {outOfStock ? "Currently unavailable" : "Available to order"}
        </p>

        <button
          className="add-button"
          disabled={outOfStock}
          onClick={() => onAdd(product)}
        >
          <ShoppingCart size={17} />
          Add to cart
        </button>
      </div>
    </article>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await api.get("/products");

        if (!active) return;

        const liveProducts = Array.isArray(response.data)
          ? response.data
          : [];

        setProducts(liveProducts);
        setUsingDemo(false);
        setApiError(false);
      } catch (error) {
        if (!active) return;

        console.error("Could not load products:", error.message);
        setProducts(sampleProducts);
        setUsingDemo(true);
        setApiError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        String(product.category).toLowerCase() ===
          activeCategory.toLowerCase() ||
        (activeCategory === "Accessories" &&
          ["audio", "chargers", "power banks"].includes(
            String(product.category).toLowerCase()
          ));

      const matchesSearch =
        !term ||
        [
          product.name,
          product.brand,
          product.category,
          product.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [products, search, activeCategory]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function addToCart(product) {
    if (usingDemo) {
      showNotice("Demo product only. Connect your live inventory before ordering.");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  Number(product.stock)
                ),
              }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    showNotice(`${product.name} added to your cart`);
  }

  function changeQuantity(id, change) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;

          return {
            ...item,
            quantity: Math.min(
              Number(item.stock),
              item.quantity + change
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function openWhatsApp() {
    const phone = "2347036888555";
    const message = encodeURIComponent(
      "Hello DAVID COMMUNICATIONS, I would like to enquire about your products."
    );

    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleNav(category) {
    setActiveCategory(category);
    setMobileMenuOpen(false);

    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="store">
      <div className="announcement-bar">
        Your trusted tech store · Quality products · Personal service
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="David Communications home">
          <span className="brand-icon">
            <Smartphone size={27} />
          </span>
          <span className="brand-text">
            <strong>DAVID</strong>
            <span>COMMUNICATIONS</span>
          </span>
        </a>

        <nav className={`desktop-nav ${mobileMenuOpen ? "nav-open" : ""}`}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop</a>
          <a href="#why-us" onClick={() => setMobileMenuOpen(false)}>Why us</a>
          <button type="button" onClick={openWhatsApp}>Contact</button>
        </nav>

        <div className="header-actions">
          <button
            className="icon-button cart-trigger"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <ShoppingCart size={21} />
            <span>Cart</span>
            <b>{cartCount}</b>
          </button>

          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      {usingDemo && (
        <div className="demo-banner">
          <span>
            Preview mode: these are sample products, not your live inventory.
            {apiError ? " Check that your backend is running." : ""}
          </span>
          <button
            onClick={async () => {
              setLoading(true);

              try {
                const response = await api.get("/products");
                setProducts(Array.isArray(response.data) ? response.data : []);
                setUsingDemo(false);
                setApiError(false);
              } catch {
                showNotice("The product API is still unavailable.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">WELCOME TO DAVID COMMUNICATIONS</span>
            <h1>
              Your next favourite
              <span> gadget starts here.</span>
            </h1>
            <p>
              Shop phones, laptops, gaming devices and everyday tech
              accessories. Find your next device with help from our team.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#shop">
                Explore products <ArrowRight size={18} />
              </a>
              <button className="secondary-button" onClick={openWhatsApp}>
                <MessageCircle size={18} /> Ask us
              </button>
            </div>

            <div className="hero-trust">
              <span><ShieldCheck size={17} /> Product verification</span>
              <span><Truck size={17} /> Order assistance</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="hero-product-card phone-card">
              <Smartphone size={84} strokeWidth={1.2} />
              <span>Smartphones</span>
            </div>
            <div className="hero-product-card laptop-card">
              <Laptop size={100} strokeWidth={1.2} />
              <span>Laptops</span>
            </div>
            <div className="hero-product-card game-card">
              <Gamepad2 size={77} strokeWidth={1.2} />
              <span>Gaming</span>
            </div>
            <div className="hero-product-card audio-card">
              <Headphones size={67} strokeWidth={1.2} />
              <span>Audio</span>
            </div>
            <div className="hero-caption">
              <span>TECH FOR EVERYDAY LIFE</span>
              <strong>Shop smart. Stay connected.</strong>
            </div>
          </div>
        </section>
        <ProductCatalog />

        <section className="benefits" id="why-us">
          <div>
            <ShieldCheck size={26} />
            <span><strong>Product records</strong><small>Verification support</small></span>
          </div>
          <div>
            <Truck size={26} />
            <span><strong>Order assistance</strong><small>Help with delivery</small></span>
          </div>
          <div>
            <MessageCircle size={26} />
            <span><strong>Personal support</strong><small>Ask before you buy</small></span>
          </div>
          <div>
            <RefreshCw size={26} />
            <span><strong>Return requests</strong><small>Subject to store policy</small></span>
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR COLLECTION</span>
              <h2>Explore our products</h2>
              <p>Browse our range of devices and useful accessories.</p>
            </div>

            <label className="search-box">
              <Search size={20} />
              <input
                type="search"
                placeholder="Search products or brands..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          <div className="category-list">
            {categories.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`category-button ${
                  activeCategory === name ? "category-active" : ""
                }`}
                onClick={() => setActiveCategory(name)}
              >
                <Icon size={18} />
                {name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <RefreshCw className="loading-icon" size={30} />
              <h3>Loading products...</h3>
              <p>Connecting to the DAVID COMMUNICATIONS catalogue.</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="empty-state">
              <Store size={35} />
              <h3>No products found</h3>
              <p>Try another category or search term.</p>
              <button
                className="primary-button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All Products");
                }}
              >
                Show all products
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onView={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </section>

        <section className="support-banner">
          <div className="support-icon"><MessageCircle size={29} /></div>
          <div>
            <h2>Need help choosing a device?</h2>
            <p>Ask us about product specifications, availability and orders.</p>
          </div>
          <button className="support-button" onClick={openWhatsApp}>
            Chat with us <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon"><Smartphone size={23} /></span>
          <span className="brand-text">
            <strong>DAVID</strong>
            <span>COMMUNICATIONS</span>
          </span>
        </a>
        <p>Your tech, your choice, your trusted store.</p>
        <span>© {new Date().getFullYear()} DAVID COMMUNICATIONS</span>
      </footer>

      {notice && <div className="toast-message">{notice}</div>}

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
            >
              <X size={22} />
            </button>

            {getImage(selectedProduct) && (
              <img
                src={getImage(selectedProduct)}
                alt={selectedProduct.name}
              />
            )}

            <div className="modal-product-info">
              <span className="eyebrow">{selectedProduct.brand || selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>
              <p className="product-price">{formatPrice(selectedProduct.price)}</p>
              <p>{selectedProduct.description || "Contact us for product details."}</p>
              <p>
                {Number(selectedProduct.stock) > 0
                  ? "Available to order"
                  : "Currently unavailable"}
              </p>
              <button
                className="primary-button"
                disabled={usingDemo || Number(selectedProduct.stock) <= 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                <ShoppingCart size={18} /> Add to cart
              </button>
              {usingDemo && (
                <p className="demo-note">
                  Sample listing only. Live ordering will be enabled after
                  the real catalogue is connected.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <h2>Your cart</h2>
                <p>{cartCount} item(s)</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={23} />
              </button>
            </div>

            {usingDemo && (
              <div className="cart-notice">
                Sample products cannot be ordered. Connect your live inventory
                to enable ordering.
              </div>
            )}

            {cart.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={34} />
                <h3>Your cart is empty</h3>
                <p>Add a product to start your order.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      {getImage(item) && (
                        <img src={getImage(item)} alt={item.name} />
                      )}
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)}</span>
                        <div className="quantity-controls">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Reduce ${item.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            disabled={item.quantity >= Number(item.stock)}
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                  <p>Delivery fees, if applicable, are confirmed before payment.</p>
                  <button
                    className="primary-button checkout-button"
                    disabled={usingDemo}
                    onClick={() => {
                      showNotice(
                        "Cart ready. Checkout and order saving are the next development step."
                      );
                      setCartOpen(false);
                    }}
                  >
                    Continue to checkout <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;

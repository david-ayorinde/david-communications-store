
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LogOut,
  Package,
  ImagePlus,
  X,
  Save,
  RefreshCw,
  Store,
  Boxes,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import api from "../services/api";
import "./admin.css";

const categories = [
  "Phones",
  "Laptops",
  "Game Consoles",
  "Accessories",
  "Audio",
];

const emptyForm = {
  name: "",
  brand: "",
  category: "Phones",
  description: "",
  price: "",
  stock: "0",
  image_urls: [],
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function imageList(product) {
  return Array.isArray(product.image_urls) ? product.image_urls : [];
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      await api.get("/products/admin/check", config);

      const response = await api.get("/products");
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not load products. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
  }

  function chooseFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    const remaining = 8 - form.image_urls.length - selectedFiles.length;

    if (remaining <= 0) {
      setError("A product can have a maximum of eight images.");
      return;
    }

    const allowed = files.slice(0, remaining);

    for (const file of allowed) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds the 5 MB image limit.`);
        return;
      }
    }

    setError("");

    setSelectedFiles((current) => [...current, ...allowed]);
  }

  function removeExistingImage(url) {
    setForm((current) => ({
      ...current,
      image_urls: current.image_urls.filter((image) => image !== url),
    }));
  }

  function removeSelectedFile(index) {
    setSelectedFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index)
    );
  }

  function resetForm() {
    setForm(emptyForm);
    setSelectedFiles([]);
    setEditingId(null);
    setError("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  function startEditing(product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "Phones",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      image_urls: imageList(product),
    });

    setSelectedFiles([]);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImages(files, userId) {
    const uploadedUrls = [];

    for (const file of files) {
      const extension = file.name.split(".").pop().toLowerCase();
      const safeExtension = /^[a-z0-9]{1,8}$/.test(extension)
        ? extension
        : "img";

      const objectPath =
        `${userId}/${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(objectPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Image upload failed for ${file.name}: ${uploadError.message}`
        );
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(objectPath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Enter a valid product price.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isSafeInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    if (form.image_urls.length + selectedFiles.length > 8) {
      setError("A product can have a maximum of eight images.");
      return;
    }

    setSaving(true);

    let uploadedUrls = [];

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const session = sessionData.session;

      if (!session?.access_token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      };

      await api.get("/products/admin/check", config);

      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(
          selectedFiles,
          session.user.id
        );
      }

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        image_urls: [...form.image_urls, ...uploadedUrls],
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload, config);
        setNotice("Product updated successfully.");
      } else {
        await api.post("/products", payload, config);
        setNotice("Product added successfully.");
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      // If the database save fails, remove any newly uploaded images
      // to avoid leaving unreferenced files behind.
      if (uploadedUrls.length > 0) {
        const paths = uploadedUrls
          .map((url) => {
            try {
              const parsed = new URL(url);
              const prefix =
                "/storage/v1/object/public/product-images/";

              if (!parsed.pathname.startsWith(prefix)) return null;

              return decodeURIComponent(
                parsed.pathname.slice(prefix.length)
              );
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        if (paths.length > 0) {
          await supabase.storage
            .from("product-images")
            .remove(paths);
        }
      }

      if (err.response?.status === 401 || err.response?.status === 403) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.error ||
          err.message ||
          "Could not save the product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This will remove its catalogue record and attempt to delete its uploaded images.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setError("");
    setNotice("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      await api.delete(`/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingId === product.id) resetForm();

      setNotice("Product deleted successfully.");
      await loadProducts();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.error || "Could not delete the product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  const filteredProducts = products.filter((product) =>
    [
      product.name,
      product.brand,
      product.category,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand admin-sidebar-brand">
          <span className="admin-brand-icon">
            <Store size={25} />
          </span>
          <span>
            <strong>DAVID</strong>
            <small>COMMUNICATIONS</small>
          </span>
        </Link>

        <div className="admin-sidebar-label">MANAGEMENT</div>

        <div className="admin-sidebar-link active">
          <Package size={19} />
          Products & inventory
        </div>

        <Link to="/" className="admin-sidebar-link">
          <Store size={19} />
          View storefront
        </Link>

        <div className="admin-sidebar-bottom">
          <button onClick={handleLogout} className="admin-logout-button">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">DAVID COMMUNICATIONS</span>
            <h1>Product management</h1>
          </div>

          <button className="admin-outline-button" onClick={handleLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </header>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <div className="admin-stat-icon"><Package size={23} /></div>
            <span>Total products</span>
            <strong>{products.length}</strong>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon"><Boxes size={23} /></div>
            <span>Total units in stock</span>
            <strong>{totalUnits.toLocaleString("en-NG")}</strong>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon"><ImagePlus size={23} /></div>
            <span>Products with images</span>
            <strong>
              {products.filter((product) => imageList(product).length > 0).length}
            </strong>
          </article>
        </section>

        {error && (
          <div className="admin-alert" role="alert">{error}</div>
        )}

        {notice && (
          <div className="admin-success" role="status">{notice}</div>
        )}

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>{editingId ? "Edit product" : "Add a new product"}</h2>
              <p>
                Enter product details, set your price and upload pictures.
              </p>
            </div>

            {editingId && (
              <button className="admin-outline-button" onClick={resetForm}>
                <X size={16} /> Cancel edit
              </button>
            )}
          </div>

          <form className="admin-form product-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="product-name">Product name *</label>
                <input
                  id="product-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Samsung Galaxy A56"
                  maxLength={150}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-brand">Brand</label>
                <input
                  id="product-brand"
                  name="brand"
                  value={form.brand}
                  onChange={updateField}
                  placeholder="e.g. Samsung, Apple, JBL"
                  maxLength={100}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-category">Category *</label>
                <select
                  id="product-category"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="product-price">Selling price (₦) *</label>
                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  max="9999999999"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="e.g. 250000"
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-stock">Quantity in stock *</label>
                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  max="100000000"
                  step="1"
                  value={form.stock}
                  onChange={updateField}
                  required
                />
              </div>

              <div className="admin-field admin-field-full">
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe specifications, storage, condition, warranty and included accessories."
                  rows="4"
                  maxLength={3000}
                />
              </div>
            </div>

            <div className="admin-field">
              <label>Product pictures (up to 8, maximum 5 MB each)</label>
              <button
                type="button"
                className="admin-upload-area"
                onClick={() => fileInput.current?.click()}
              >
                <ImagePlus size={27} />
                <strong>Choose product pictures</strong>
                <span>JPG, PNG, WebP or other supported image formats</span>
              </button>

              <input
                ref={fileInput}
                className="admin-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={chooseFiles}
              />

              <div className="admin-image-grid">
                {form.image_urls.map((url) => (
                  <div className="admin-image-preview" key={url}>
                    <img src={url} alt="Existing product" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      aria-label="Remove existing image from product"
                      title="Remove from product"
                    >
                      <X size={16} />
                    </button>
                    <span>Saved image</span>
                  </div>
                ))}

                {selectedFiles.map((file, index) => (
                  <div
                    className="admin-image-preview"
                    key={`${file.name}-${file.lastModified}-${index}`}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={16} />
                    </button>
                    <span>New image</span>
                  </div>
                ))}
              </div>

              <p className="admin-field-help">
                {form.image_urls.length + selectedFiles.length} of 8 images selected.
                Removed saved images are detached from the product. They may
                remain in Storage until you clean them up.
              </p>
            </div>

            <button
              type="submit"
              className="admin-primary-button save-product-button"
              disabled={saving}
            >
              {saving ? (
                <><RefreshCw size={18} className="admin-spin" /> Saving...</>
              ) : (
                <><Save size={18} /> {editingId ? "Save changes" : "Add product"}</>
              )}
            </button>
          </form>
        </section>

        <section className="admin-panel inventory-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Your inventory</h2>
              <p>Products saved in your Supabase catalogue.</p>
            </div>

            <button
              className="admin-outline-button"
              onClick={loadProducts}
              disabled={loading}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <label className="admin-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, brand or category..."
            />
          </label>

          {loading ? (
            <div className="admin-empty">
              <RefreshCw className="admin-spin" size={26} />
              <p>Loading your inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-empty">
              <Package size={33} />
              <h3>No products found</h3>
              <p>Add a product above or change your search.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-table-product">
                          {imageList(product)[0] ? (
                            <img
                              src={imageList(product)[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="admin-table-no-image">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.brand || "No brand specified"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td className="admin-table-price">
                        {formatPrice(product.price)}
                      </td>
                      <td>
                        <span className={`stock-pill ${
                          Number(product.stock) === 0 ? "stock-zero" : ""
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="admin-edit-button"
                            onClick={() => startEditing(product)}
                            title="Edit product"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            className="admin-delete-button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                            {deletingId === product.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-footer">
          DAVID COMMUNICATIONS · Product management
        </footer>
      </main>
    </div>
  );
}

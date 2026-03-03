import { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import { useNavigate } from "react-router-dom";
import '../App.css';
import { api } from "../lib/api";

function ProductsPage() {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res);

      } catch (error) {
        setError(error.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      const meRes = await api.get('/auth/me');
      const user = meRes;

      const addRes = await api.post(`/carts/${user.id}/items`, { product_id: product.id, quantity: 1 });

    } catch (err) {
      alert(err.message || 'Add to cart failed')
    }
  }

  if (loading) return <p>Loading products...</p>
  if (error) return <p>{error}</p>

  return (
    <section className="page page--products">
      <header className="products__header">
        <h2 className="products__title">Products</h2>
      </header>

      <div className="products__content">
        <ProductList products={products} onAddToCart={handleAddToCart} />
      </div>
    </section>
  );
}

export default ProductsPage;
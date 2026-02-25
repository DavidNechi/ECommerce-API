import { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import { useNavigate } from "react-router-dom";
import '../App.css';

function ProductsPage() {
    const [products, setProducts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:4001/products');
                if (!res.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data = await res.json();
                setProducts(data);
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
      const meRes = await fetch('http://localhost:4001/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (!meRes.ok) {
        navigate('/login')
        return
      }

      const user = await meRes.json()

      const addRes = await fetch(`http://localhost:4001/carts/${user.id}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      })

      if (!addRes.ok) throw new Error('Failed to add item to cart')

      alert('Added to cart')
    } catch (err) {
      alert(err.message || 'Add to cart failed')
    }
  }

    if(loading) return <p>Loading products...</p>
    if(error) return <p>{error}</p>

    return (
        <section>
            <h2>Products</h2>
            <ProductList products={products} onAddToCart={handleAddToCart} />
        </section>
    )
}

export default ProductsPage;
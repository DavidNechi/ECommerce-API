import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import '../App.css'

function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`http://localhost:4001/products/${id}`);
                if (!res.ok) {
                    throw new Error('Product not found.');
                }

                const data = await res.json();
                setProduct(data);
            } catch (error) {
                setError(error.message || 'Failed to load product.');
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [id]);

    if (loading) return <p>Loading product...</p>
    if (error) return <p>{error}</p>
    if (!product) return <p>Product not found.</p>

    return (
        <section className='product-card'>
            <h3>{product.name}</h3>
            <p>Price: ${Number(product.price).toFixed(2)}</p>
            <p>Stock: {product.stock_quantity}</p>
            <p>Product ID: {product.id}</p>
        </section>
    )
}

export default ProductDetails;

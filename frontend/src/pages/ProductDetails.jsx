import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import '../App.css'

function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await api.get(`/products/${id}`);
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
        <section className="page page--product-details">
            <article className="product-details">
                <h2 className="product-details__title">{product.name}</h2>

                <div className="product-details__meta">
                    <p className="product-details__price">
                        Price: ${Number(product.price).toFixed(2)}
                    </p>
                    <p className="product-details__stock">
                        Stock: {product.stock_quantity}
                    </p>
                    <p className="product-details__id">
                        Product ID: {product.id}
                    </p>
                </div>
            </article>
        </section>
    );

}

export default ProductDetails;

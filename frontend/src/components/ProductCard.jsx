import { Link } from 'react-router-dom';
import '../App.css'

function ProductCard({ product, onAddToCart }) {
    return (
        <article to={`/products/${product.id}`} className='product-card'>
            <h3>
                <Link to={`/products/${product.id}`} className='product-link'>
                    {product.name}
                </Link>
            </h3>
            <p>Price: ${Number(product.price).toFixed(2)}</p>
            <p>Stock: {product.stock_quantity}</p>
            <button onClick={() => onAddToCart(product)}>Add to cart</button>
        </article>
    )
}

export default ProductCard;
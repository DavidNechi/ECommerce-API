import ProductCard from "./ProductCard";

function ProductList({ products, onAddToCart }) {
    if(!products || products.length === 0) {
        return <p>No products found.</p>
    }

    return (
        <div className="product-grid">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>
            ))}
        </div>
    )
}

export default ProductList;
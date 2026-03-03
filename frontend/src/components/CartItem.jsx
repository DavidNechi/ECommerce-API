import '../App.css'

function CartItem({ item, onIncrease, onDecrease, onRemove, isUpdating = false }) {
    return (
        <article className="cart-item-row">
            <div className="cart-col cart-product">
                <h3>{item.name}</h3>
                <p>Unit: ${Number(item.unit_price).toFixed(2)}</p>
            </div>

            <div className="cart-col cart-total">
                ${Number(item.quantity * item.unit_price).toFixed(2)}
            </div>

            <div className="cart-col cart-qty">
                <button onClick={() => onDecrease(item)} disabled={isUpdating || item.quantity <= 1}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => onIncrease(item)} disabled={isUpdating}>+</button>
            </div>

            <div className="cart-col cart-action">
                <button onClick={() => onRemove(item)} disabled={isUpdating}>Remove</button>
            </div>
        </article>

    )
}

export default CartItem;
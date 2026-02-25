import '../App.css'

function OrderItem({ order, orderItems }) {
    return (
        <article className="order-item-row">
            <div className="order-col order-product">
                <h3>{order.name}</h3>
                <p>Unit: ${Number(orderItems.unit_price).toFixed(2)}</p>
            </div>

            <div className="order-col order-qty">
                <span>{orderItems.quantity}</span>
            </div>

            <div className='status'>
                <p>Status: {order.status}</p>
            </div>

            <div className="order-col order-total">
                ${Number(orderItems.quantity * orderItems.unit_price).toFixed(2)}
            </div>
        </article>

    )
}

export default OrderItem;
import '../App.css';

function OrderItem({ order }) {
  return (
    <article className="order-item-row">
      <div className="status">
        <p>Order #{order.id} | Status: {order.status}</p>
        <p>Total: ${Number(order.total_amount).toFixed(2)}</p>
      </div>

      {order.items?.length ? (
        order.items.map((item) => (
          <div key={`${order.id}-${item.product_id}`} className="order-line">
            <div className="order-col order-product">
              <h3>{item.name}</h3>
              <p>Unit: ${Number(item.unit_price).toFixed(2)}</p>
            </div>

            <div className="order-col order-qty">
              <span>Quantity: {item.quantity}</span>
            </div>

            <div className="order-col order-total">
              ${Number(item.quantity * item.unit_price).toFixed(2)}
            </div>
          </div>
        ))
      ) : (
        <p>No items in this order.</p>
      )}
    </article>
  );
}

export default OrderItem;

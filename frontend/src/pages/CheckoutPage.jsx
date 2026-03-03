import '../App.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'


function CheckoutPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [isPaying, setIsPaying] = useState(false)

    const items = location.state?.items || []
    const user = location.state?.user || null

    const total = items.reduce(
        (sum, item) => sum + Number(item.line_total ?? item.quantity * item.unit_price),
        0
    )

    useEffect(() => {
        if (!location.state) {
            navigate('/cart')
        }
    }, [location.state, navigate])

    const handlePayment = async () => {
        setIsPaying(true)
        try {
            const currentUser = await api.get('/auth/me');
            await api.post(`/payments/create-intent/${currentUser.id}`, {});
            await api.post(`/checkout/${currentUser.id}`, {});

            navigate('/products');
        } catch (err) {
            alert(err.message || 'Payment failed');
        } finally {
            setIsPaying(false);
        }
    }

    return (
        <section className="page page--checkout">
            <header className="checkout__header">
                <h2 className="checkout__title">Checkout</h2>
                <p className="checkout__user">Welcome, {user?.name || 'Guest'}</p>
            </header>

            {items.length === 0 ? (
                <div className="checkout__empty is-empty">
                    <p>No checkout data found. Go back to cart.</p>
                    <button type="button" onClick={() => navigate('/cart')}>
                        Back to Cart
                    </button>
                </div>
            ) : (
                <div className="checkout__content">
                    <div className="checkout__list">
                        {items.map((item) => (
                            <article key={item.product_id} className="checkout__item">
                                <div className="checkout__product">{item.name}</div>
                                <div className="checkout__qty">x{item.quantity}</div>
                                <div className="checkout__line-total">
                                    ${Number(item.line_total ?? item.quantity * item.unit_price).toFixed(2)}
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="checkout__summary">
                        <h3 className="checkout__total">Total: ${total.toFixed(2)}</h3>
                        <button type="button" onClick={handlePayment} disabled={isPaying}>
                            {isPaying ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default CheckoutPage

import '../App.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'


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
            const userRes = await fetch('http://localhost:4001/auth/me', {
                method: 'GET',
                credentials: 'include',
            })

            if (!userRes.ok) {
                navigate('/login')
                return
            }

            const userData = await userRes.json()

            const intentRes = await fetch(`http://localhost:4001/payments/create-intent/${userData.id}`, {
                method: 'POST',
                credentials: 'include',
            });

            if(!intentRes.ok) {
                throw new Error('Failed to create payment intent')
            }

            const intentData = await intentRes.json();

            const checkoutRes = await fetch(`http://localhost:4001/checkout/${userData.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_intent_id: intentData.paymentInentId }),
            })

            if (!checkoutRes.ok) {
                throw new Error('Checkout failed')
            }
            navigate('/products')

        } catch (err) {
            alert('Payment failed')
        } finally {
            setIsPaying(false)
        }
    }


    return (
        <section className="checkout-card">
            <h2>Checkout</h2>
            <p>Welcome, {user?.name || 'Guest'}</p>

            {items.length === 0 ? (
                <>
                    <p>No checkout data found. Go back to cart.</p>
                    <button type="button" onClick={() => navigate('/cart')}>
                        Back to Cart
                    </button>
                </>
            ) : (
                <div className="cart-list">
                    {items.map((item) => (
                        <article key={item.product_id} className="cart-item-row">
                            <div className="cart-col cart-product">{item.name}</div>
                            <div className="cart-col cart-qty">x{item.quantity}</div>
                            <div className="cart-col cart-total">
                                ${Number(item.line_total ?? item.quantity * item.unit_price).toFixed(2)}
                            </div>
                        </article>
                    ))}
                    <h3>Total: ${total.toFixed(2)}</h3>
                    <button type="button" onClick={handlePayment} disabled={isPaying}>
                        {isPaying ? 'Processing...' : 'Place Order'}
                    </button>

                </div>

            )}
        </section>
    )
}

export default CheckoutPage

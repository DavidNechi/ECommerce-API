import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import OrderItem from '../components/OrderItem'
import '../App.css'
import { api } from '../lib/api'

function OrdersPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUser = async () => {
            try {
                // Load and check user session
                const currentUser = await api.get('/auth/me');
                setUser(currentUser);

                // Load and check orders
                const ordersData = await api.get(`/orders/users/${currentUser.id}`);

                // Load and check order items for order
                const detailedOrders = await Promise.all(
                    ordersData.map(async (order) => {
                        const detailData = await api.get(`/orders/${order.id}`);
                        return { ...order, items: detailData.items || [] };
                    })
                );
                setOrders(detailedOrders);
            } catch (err) {
                setError(err.message || 'Failed to verify session. Please log in again.');
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [navigate]);

    if (loading) return <p>Loading orders...</p>
    if (error) return <p>{error}</p>



    return (
        <section className="page page--orders">
            <header className="orders__header">
                <h1 className="orders__title">My Orders</h1>
            </header>

            <div className="orders__content">
                {orders.length === 0 ? (
                    <p className="orders__empty is-empty">You have no orders yet.</p>
                ) : (
                    <div className="orders__list">
                        {orders.map((order) => (
                            <OrderItem key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );

}

export default OrdersPage;
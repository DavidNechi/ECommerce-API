import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import OrderItem from '../components/OrderItem'
import '../App.css'

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
                const userRes = await fetch('http://localhost:4001/auth/me', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!userRes.ok) {
                    navigate('/login');
                    return;
                }

                const userData = await userRes.json();
                setUser(userData);

                // Load and check orders

                const ordersRes = await fetch(`http://localhost:4001/orders/users/${userData.id}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!ordersRes.ok) {
                    setError('Failed to load orders. Please try again later.');
                    return;
                }

                const ordersData = await ordersRes.json();
                setOrders(ordersData);


                // Load and check order items for order

                const orderItemsData = await fetch(`http://localhost:4001/orders/${order.id}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!orderItemsData.ok) {
                    setError('Failed to load order items. Please try again later.');
                    return;
                }

                const orderItemsDataJson = await orderItemsData.json();
                setOrderItems(orderItemsDataJson);
            } catch (err) {
                setError('Failed to verify session. Please log in again.');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [navigate]);

    if (loading) return <p>Loading cart...</p>
    if (error) return <p>{error}</p>



    return (
        <div className="orders-page">
            <h1>My Orders</h1>
            <div className="orders-list">
                {orders.length === 0 ? (
                    <p>You have no orders yet.</p>
                ) : (
                    orders.map(order => (
                        <OrderItem key={order.id} order={order} orderItems={orderItems} />
                    ))
                )}
            </div>
        </div>
    )
}

export default OrdersPage;
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CartItem from '../components/CartItem'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const loadCart = async () => {
      setError('');
      try {
        const cartData = await api.get(`/carts/${user.id}`);
        setItems(cartData.items || []);
      } catch (err) {
        if (err.status === 404) {
          setItems([]);
        } else if (err.status === 401) {
          navigate('/login');
        } else {
          setError(err.message || 'Failed to load cart');
        }
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [authLoading, user, navigate]);

  const handleRemove = async (item) => {
    setError('');
    try {
      await api.delete(`/carts/${user.id}/items/${item.product_id}`);
      setItems((prev) => prev.filter((i) => i.product_id !== item.product_id));
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    }
  };

  const handleIncrease = async (item) => {
    setError('');
    try {
      await api.put(`/carts/${user.id}/items/${item.product_id}`,
        {
          quantity: item.quantity + 1
        }
      )
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === item.product_id
            ? {
              ...i,
              quantity: i.quantity + 1,
              line_total: (i.quantity + 1) * i.unit_price
            }
            : i
        )
      )
    } catch (err) {
      setError(err.message || 'Failed to increase item quantity');
    }
  }

  const handleDecrease = async (item) => {
    setError('');
    if (item.quantity === 1) {
      await handleRemove(item);
      return;
    }

    try {
      await api.put(`/carts/${user.id}/items/${item.product_id}`,
        {
          quantity: item.quantity - 1
        }
      )
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === item.product_id
            ? {
              ...i,
              quantity: i.quantity - 1,
              line_total: (i.quantity - 1) * i.unit_price
            }
            : i
        )
      )
    } catch (err) {
      setError(err.message || 'Failed to decrease item quantity');
    }
  }

  if (loading) return <p>Loading cart...</p>
  if (error) return <p>{error}</p>

  return (
    <section className="page page--cart">
      <header className="cart__header">
        <h2 className="cart__title">Cart</h2>
        <p className="cart__user">Logged in as: {user?.email}</p>
      </header>

      {items.length === 0 ? (
        <p className="cart__empty is-empty">Your cart is empty.</p>
      ) : (
        <div className="cart__content">
          <div className="cart__list">
            {items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <div className="cart__actions">
            <button onClick={() => navigate('/checkout', { state: { items, user } })}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default CartPage

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CartItem from '../components/CartItem'
import '../App.css'

function CartPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('http://localhost:4001/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          navigate('/login')
          return
        }

        const data = await res.json()
        setUser(data)

        const itemsResult = await fetch(`http://localhost:4001/carts/${data.id}`, {
          credentials: 'include',
        })

        if (itemsResult.status === 404) {
          setItems([])
          return
        }

        if (!itemsResult.ok) {
          throw new Error('Failed to load cart')
        }
        const cartData = await itemsResult.json()
        setItems(cartData.items || [])

      } catch (err) {
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    loadUser()
  }, [navigate])

  const handleRemove = async (item) => {
    const res = await fetch(
      `http://localhost:4001/carts/${user.id}/items/${item.product_id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    )

    if (!res.ok) {
      setError('Failed to remove item')
      return
    }

    setItems((prev) => prev.filter((i) => i.product_id !== item.product_id))
  }

  const handleIncrease = async (item) => {
    const res = await fetch(`http://localhost:4001/carts/${user.id}/items/${item.product_id}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity + 1 }),
      }
    )

    if (!res.ok) {
      setError('Failed to increment item');
      return
    }

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
  }
  
  const handleDecrease = async (item) => {
    if (item.quantity === 1) {
      handleRemove(item)
      return
    }

    const res = await fetch(`http://localhost:4001/carts/${user.id}/items/${item.product_id}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity - 1 }),
      }
    )

    if (!res.ok) {
      setError('Failed to decrement item');
      return
    }

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
  }


  if (loading) return <p>Loading cart...</p>
  if (error) return <p>{error}</p>

  return (
    <section>
      <h2>Cart</h2>
      <p>Logged in as: {user?.email}</p>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-container">
          <div className="cart-list">
            {items.map((item) => (
              <CartItem key={item.product_id} item={item} onIncrease={handleIncrease} onDecrease={handleDecrease} onRemove={handleRemove} />
            ))}
          </div>

          <div className="cart-actions">
            <button
              onClick={() => navigate('/checkout', { state: { items, user } })}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}


    </section>
  )
}

export default CartPage

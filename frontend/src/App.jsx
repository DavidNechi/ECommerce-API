import { Routes, Route, Link, useParams } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetails from './pages/ProductDetails'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'


function Home() {
  return <h2>Home Page</h2>
}

function NotFound() {
  return <h2>404 - Page Not Found</h2>
}

function App() {
  return (
    <>
      <div className='app-layout'>
        <header className='navbar'>
          <Link to="/products">Products</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/cart">Cart</Link>
        </header>

        <aside className='filters'>
          <h3>Filters</h3>
          <p>Category</p>
          <p>Price</p>
        </aside>

        <main className='content'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App

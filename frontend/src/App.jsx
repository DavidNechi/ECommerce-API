import { Routes, Route, Link } from 'react-router-dom'
import logo from './assets/logo.png'
import { useAuth } from './context/AuthContext'
import './App.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetails from './pages/ProductDetails'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ProtectedRoute from './components/ProtectedRoute'


function NotFound() {
  return <h2>404 - Page Not Found</h2>
}

function App() {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className="app-layout">
        <header className="navbar">
          <Link to="/products" className="navbar__brand">
            <img src={logo} alt="Store logo" className="navbar__logo" />
          </Link>

          <div className="navbar__right">
            {!isAuth ? (
              <>
                <Link className="nav-pill" to="/login">Login</Link>
                <Link className="nav-pill" to="/register">Register</Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/orders">Orders</Link>
                <Link className="nav-link" to="/profile">Profile</Link>
                <Link className="nav-link" to="/products">Products</Link>
                <Link className="nav-link" to="/cart">Cart</Link>
              </>
            )}
          </div>
        </header>



        {/* <aside className="filters">
          <h3>Filters</h3>
          <p>Category</p>
          <p>Price</p>
        </aside> */}

        <main className='content'>
          <Routes>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />


            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />


            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App

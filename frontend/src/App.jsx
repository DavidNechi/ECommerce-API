import { Routes, Route, Link, useParams } from 'react-router-dom'
import './App.css'

function Home() {
  return <h2>Home Page</h2>
}

function Products() {
  return <h2>Products Page</h2>
}

function ProductDescription() {
  const { id } = useParams();
  return <h2>Product {id}</h2>
}

function Cart() {
  return <h2>Cart Page</h2>
}

function Checkout() {
  return <h2>Checkout Page</h2>
}

function Login() {
  return <h2>Login Page</h2>
}

function Register() {
  return <h2>Register Page</h2>
}

function Orders() {
  return <h2>Orders Page</h2>
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
        </header>

        <aside className='filters'>
          <h3>Filters</h3>
          <p>Category</p>
          <p>Price</p>
        </aside>

        <main className='content'>
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDescription />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
        </main>
      </div>
    </>
  )
}

export default App

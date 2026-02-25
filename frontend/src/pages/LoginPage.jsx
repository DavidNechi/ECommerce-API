import { useNavigate } from 'react-router-dom'
import '../App.css'

function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(e.target);
    const payload = {
      email: data.get('email'),
      password: data.get('password'),
    }

    const res = await fetch('http://localhost:4001/auth/login', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      navigate('/products');
      return;
    }

    const result = await res.json();
    console.log(result);
  }

  return (
    <div className='auth-card'>
      <section>
        <form className='form' onSubmit={handleSubmit}>
          <h2>Welcome to ECommerce</h2>
          <p>Enter information to login into an account</p>

          <div className='inputWrapper'>
            <input id="email" name="email" type="email" placeholder="Enter your email" required />
          </div>

          <div className='inputWrapper'>
            <input id="password" name="password" type="password" placeholder="Enter your password" required minLength={8} />
          </div>

          <button type="submit">Login</button>
        </form>
      </section>
    </div>
  )
}

export default Login;
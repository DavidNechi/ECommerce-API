import { useNavigate } from 'react-router-dom'
import '../App.css'
import { api } from '../lib/api';

function Register() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(e.target);
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
    }

    try {
      await api.post('/auth/register', payload);
      navigate('/login');
    } catch (err) {
      console.error(err.message || 'Registration failed');
    }
  }

  return (
    <section className="page page--register">
      <div className="auth-card auth-card--register">
        <header className="auth-card__header">
          <h2 className="auth-card__title">Welcome to ECommerce</h2>
          <p className="auth-card__subtitle">Enter information to create an account</p>
        </header>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="auth-card__field">
            <input
              className="auth-card__input"
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="auth-card__field">
            <input
              className="auth-card__input"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="auth-card__field">
            <input
              className="auth-card__input"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              minLength={8}
            />
          </div>

          <button className="auth-card__submit" type="submit">
            Register
          </button>
        </form>
      </div>
    </section>
  );

}

export default Register;
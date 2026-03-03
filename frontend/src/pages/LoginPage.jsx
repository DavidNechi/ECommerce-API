import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    try {
      await login({
        email: data.get('email'),
        password: data.get('password'),
      });
      navigate('/products');
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <section className="page page--login">
      <div className="auth-card auth-card--login">
        <header className="auth-card__header">
          <h2 className="auth-card__title">Welcome to ECommerce</h2>
          <p className="auth-card__subtitle">Enter information to login into an account</p>
        </header>

        <form className="auth-card__form" onSubmit={handleSubmit}>
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
            Login
          </button>
        </form>
      </div>
    </section>
  );

}

export default Login;
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function Profile() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (loading) return <p>Loading profile...</p>

  return (
    <section className="page page--profile">
      <div className="profile-card">
        <header className="profile-card__header">
          <h2 className="profile-card__title">Profile</h2>
        </header>

        <div className="profile-card__content">
          <p className="profile-card__row">
            <span className="profile-card__label">Name:</span> {user?.name}
          </p>
          <p className="profile-card__row">
            <span className="profile-card__label">Email:</span> {user?.email}
          </p>
        </div>

        <div className="profile-card__actions">
          <button className="profile-card__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </section>
  );

}

export default Profile;
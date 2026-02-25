import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../App.css'
import { useEffect } from 'react';

const authMe = async () => {
  const res = await fetch('http://localhost:4001/auth/me', {
    method: 'GET',
    credentials: 'include',
  });
  return res;
}

const logoutUser = async () => {
  const res = await fetch('http://localhost:4001/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  return res
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await authMe();
      if (!res.ok) {
        navigate('/login');
        return;
      }

      const data = await res.json();
      setUser(data);
      setLoading(false);
    }

    loadProfile();
  }, [navigate])

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  }

  if (loading) return <p>Loading rofile...</p>

  return (
    <div className="auth-card">
      <h2>Profile</h2>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default Profile;
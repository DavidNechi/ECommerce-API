import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
    const { isAuth, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <p>Loading...</p>
    }

    if (!isAuth) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

export default ProtectedRoute;
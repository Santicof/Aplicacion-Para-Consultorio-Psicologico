import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;

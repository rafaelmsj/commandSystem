import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
}

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsValid(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        // Token expirado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsValid(false);
      }
    } catch (err) {
      // Token inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsValid(false);
    }
  }, []);

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

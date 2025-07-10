import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para validar si un token JWT está expirado
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Si no se puede parsear, considerar como expirado
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('adminToken');
      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else if (storedToken && isTokenExpired(storedToken)) {
        // Si el token está expirado, limpiarlo
        localStorage.removeItem('adminToken');
        console.log('Token expirado, limpiando localStorage');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
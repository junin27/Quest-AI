import React, { useEffect } from 'react';
import type { User } from '../../types/user.types';

interface ProtectedRouteProps {
  currentUser: User | null;
  setView: (view: string) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  setView,
  children
}) => {
  useEffect(() => {
    if (!currentUser) {
      setView('login');
    }
  }, [currentUser, setView]);

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};
export default ProtectedRoute;

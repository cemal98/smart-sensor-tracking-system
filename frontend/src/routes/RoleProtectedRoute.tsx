import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getProfile } from '../services/auth';

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const user = await getProfile();
                setIsAllowed(allowedRoles.includes(user.role));
            } catch {
                setIsAllowed(false);
            }
        };

        checkRole();
    }, [allowedRoles]);

    if (isAllowed === null) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-700 text-lg">Yükleniyor...</div>
            </div>
        );
    }

    return isAllowed ? <>{children}</> : <Navigate to="/dashboard" />;
};

export default RoleProtectedRoute;

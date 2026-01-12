import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // simple check for a saved name
        const savedName = localStorage.getItem('user_name');
        if (savedName) {
            setUser({ name: savedName });
        }
        setLoading(false);
    }, []);

    const login = (name) => {
        localStorage.setItem('user_name', name);
        setUser({ name });
    };

    const logout = () => {
        localStorage.removeItem('user_name');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

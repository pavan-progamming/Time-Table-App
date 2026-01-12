import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loginGuest } = useAuth();
    const navigate = useNavigate();

    const checkConnection = async () => {
        try {
            toast.loading('Checking connection...', { id: 'ping' });
            const response = await api.get('/api/ping');
            toast.success(`Server Connected! (${response.data.message})`, { id: 'ping' });
        } catch (error) {
            const url = error.config?.url ? `${error.config.baseURL}${error.config.url}` : api.defaults.baseURL;
            toast.error(`Connection Failed: ${error.message} (Target: ${url})`, { id: 'ping' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (error) {
            const url = error.config?.url ? `${error.config.baseURL}${error.config.url}` : api.defaults.baseURL;
            toast.error(error.response?.data?.message || `${error.message} (Target: ${url})`);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '40px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
            overflowY: 'auto'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                borderRadius: '24px',
                margin: 'auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 15px'
                    }}>
                        <LogIn color="white" size={30} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Login to manage your timetable</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            style={{ width: '100%' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                style={{ width: '100%', paddingRight: '45px' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
                        Sign In
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
                </p>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button
                        onClick={checkConnection}
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            opacity: 0.7
                        }}
                    >
                        Check Server Connection
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                        onClick={() => {
                            loginGuest();
                            navigate('/');
                        }}
                        style={{
                            background: 'white',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        Continue as Guest (Skip Login)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

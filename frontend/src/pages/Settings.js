import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Save, Shield, Bell, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [loading, setLoading] = useState(false);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const isMobile = windowSize.width <= 768 || (windowSize.height <= 500 && windowSize.width <= 1024);
    const isLandscape = windowSize.width > windowSize.height;

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.name || '',
                email: '',
            });
        }
    }, [user]);

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', formData);
            // Update application state
            login(formData.username);
            toast.success('Name updated successfully!');
            // Note: In a real app, you might want to force a refresh or update context state
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const sectionStyle = {
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid var(--border)'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        fontSize: '14px',
        color: 'var(--text-main)'
    };

    return (
        <Layout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '13px' : '15px' }}>Manage your account preferences and profile.</p>
                </div>

                <section style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <User size={20} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Personalize</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Your Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    style={{ width: '100%', paddingLeft: '40px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                This name will be displayed on your dashboard.
                            </p>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                            <Save size={18} /> {loading ? 'Saving...' : 'Save Name'}
                        </button>
                    </form>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    <section style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                            <Moon size={20} color="var(--primary)" />
                            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Appearance</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Toggle between Light and Dark themes relative to your environment.
                        </p>
                        <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
                            Looking for the Dark Mode toggle? Check the <strong>Moon/Sun icon</strong> in the top-right header!
                        </div>
                    </section>

                    <section style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                            <Bell size={20} color="var(--primary)" />
                            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Notifications</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>Email reminders are currently enabled for all your tasks.</p>
                        <button
                            onClick={() => toast.success('Notification settings saved!')}
                            className="btn-secondary"
                            style={{ width: '100%' }}
                        >
                            Manage Alerts
                        </button>
                    </section>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;

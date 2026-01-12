import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    LogOut,
    Bell,
    Menu,
    X,
    Clock,
    User,
    Moon,
    Sun,
    Check,
    Activity,
    Settings as SettingsIcon
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true); // Permanently open on desktop
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const newNotifications = res.data;

            // Show toast for new unread notifications
            newNotifications.forEach(n => {
                const isNew = !notifications.find(old => old.id === n.id);
                if (isNew && !n.is_read) {
                    toast(n.message, { icon: '🔔', duration: 5000 });
                }
            });

            setNotifications(newNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'My Timetable', path: '/timetable', icon: <Calendar size={20} /> },
        { name: 'Reports', path: '/reports', icon: <Activity size={20} /> },
        { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
    ];

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const isMobile = windowSize.width <= 768 || (windowSize.height <= 500 && windowSize.width <= 1024);
    const isLandscape = windowSize.width > windowSize.height;

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            minHeight: '100dvh',
            backgroundColor: 'var(--bg-main)',
            overflow: 'hidden' // Prevent horizontal scroll on outer container
        }}>
            {/* Mobile Sidebar (Slide-in) - Removed as redundant with bottom nav */}

            {/* Sidebar (Desktop Only) */}
            {!isMobile && (
                <div style={{
                    width: sidebarOpen ? '260px' : '80px',
                    backgroundColor: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    zIndex: 100,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                }}>
                    <div style={{
                        padding: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '80px',
                        borderBottom: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                            }}>
                                <Activity color="white" size={20} />
                            </div>
                            {sidebarOpen && <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Timetable</h1>}
                        </div>
                    </div>

                    <nav style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    transition: 'all 0.2s',
                                    justifyContent: sidebarOpen ? 'flex-start' : 'center'
                                })}
                            >
                                <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                <span style={{
                                    marginLeft: '12px',
                                    fontWeight: '700',
                                    opacity: sidebarOpen ? 1 : 0,
                                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(10px)',
                                    transition: 'all 0.3s',
                                    display: 'block'
                                }}>
                                    {item.name}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                width: '100%',
                                borderRadius: '12px',
                                color: '#ef4444',
                                backgroundColor: 'transparent',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}><LogOut size={20} /></div>
                            <span style={{
                                marginLeft: '12px',
                                fontWeight: '700',
                                opacity: sidebarOpen ? 1 : 0,
                                transition: 'opacity 0.2s'
                            }}>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <header style={{
                    height: '60px',
                    backgroundColor: 'var(--bg-card)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0 16px' : '0 30px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 90,
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Menu option removed as requested */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{
                                fontSize: isMobile ? '18px' : '22px',
                                fontWeight: '800',
                                color: 'var(--primary)',
                                margin: 0,
                                letterSpacing: '-0.8px',
                                lineHeight: 1
                            }}>
                                {navItems.find(item => item.path === window.location.pathname)?.name || 'Dashboard'}
                            </h1>
                            <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: '800', color: '#10b981' }}>v3.2-UNIVERSAL</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            style={{ background: 'none', color: 'var(--text-muted)', padding: 0 }}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Logout for Mobile */}
                        {isMobile && (
                            <button
                                onClick={handleLogout}
                                style={{ background: 'none', color: '#ef4444', padding: 0 }}
                            >
                                <LogOut size={20} />
                            </button>
                        )}

                        {/* Notifications (Hidden on mobile) */}
                        {!isMobile && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{ background: 'none', color: 'var(--text-muted)', padding: 0 }}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            padding: '2px 5px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--bg-card)'
                                        }}>{unreadCount}</span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="card" style={{
                                        position: 'absolute',
                                        top: '40px',
                                        right: 0,
                                        width: '320px',
                                        maxHeight: '450px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        padding: '20px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Notifications</h4>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.put('/notifications/read-all');
                                                            fetchNotifications();
                                                        } catch (e) {
                                                            toast.error('Failed to mark all as read');
                                                        }
                                                    }}
                                                    style={{ background: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '700' }}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                                <Bell size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                                <p style={{ fontSize: '13px', margin: 0 }}>No notifications yet.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {notifications.map(n => (
                                                    <div key={n.id} style={{
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                                        border: '1px solid',
                                                        borderColor: n.is_read ? 'var(--border)' : 'rgba(59, 130, 246, 0.2)',
                                                        fontSize: '13px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <span style={{ flex: 1, marginRight: '10px', lineHeight: '1.4' }}>{n.message}</span>
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(n.id);
                                                                }}
                                                                style={{ background: 'none', color: '#10b981', padding: '4px' }}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingLeft: isMobile ? '12px' : '20px',
                            borderLeft: '1px solid var(--border)',
                            height: '100%'
                        }}>
                            {!isMobile && (
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: '700', fontSize: '14px', lineHeight: '1.2' }}>{user?.name || 'Guest'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Timetable App</div>
                                </div>
                            )}
                            <div style={{
                                width: isMobile ? '36px' : '40px',
                                height: isMobile ? '36px' : '40px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--primary)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                                flexShrink: 0
                            }}>
                                <User size={isMobile ? 18 : 20} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main style={{
                    padding: isMobile ? '16px' : '30px',
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%',
                    maxWidth: '100vw',
                    boxSizing: 'border-box',
                    paddingBottom: isMobile ? '100px' : '40px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {children}
                </main>

                {/* Bottom Navigation (Mobile Only) */}
                {isMobile && (
                    <nav style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '70px',
                        paddingBottom: 'env(safe-area-inset-bottom)',
                        backgroundColor: 'var(--bg-card)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        zIndex: 1000,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
                    }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    padding: '8px 12px',
                                })}
                            >
                                <div style={{
                                    transition: 'transform 0.2s',
                                    transform: 'scale(1.1)'
                                }}>
                                    {item.icon}
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    letterSpacing: '0.02em'
                                }}>{item.name}</span>
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    width: '20px',
                                    height: '4px',
                                    borderRadius: '0 0 4px 4px',
                                    backgroundColor: 'var(--primary)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s'
                                }} className="nav-indicator" />
                            </NavLink>
                        ))}
                    </nav>
                )}
            </div >
        </div >
    );
};

export default Layout;

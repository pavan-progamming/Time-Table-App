import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import {
    Activity,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    MoreVertical,
    Plus,
    Trash2,
    Edit2,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null);
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

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/timetable');
            setTimetable(res.data);

            // Re-sync notifications on load
            const NotificationService = require('../services/NotificationService').default;
            NotificationService.scheduleClassReminders(res.data, user?.name);
        } catch (error) {
            toast.error('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Request notification permissions
        const NotificationService = require('../services/NotificationService').default;
        NotificationService.requestPermissions();
    }, []);

    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/timetable/${id}`);
                toast.success('Task deleted');
                fetchData();
            } catch (error) {
                toast.error('Failed to delete task');
            }
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    const totalTasks = timetable.length;
    const completedCount = timetable.filter(entry => entry.is_completed).length;
    const pendingCount = totalTasks - completedCount;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const todayEntries = timetable.filter(entry => {
        const repeatConfig = typeof entry.repeat_config === 'string' ? JSON.parse(entry.repeat_config) : (entry.repeat_config || { type: 'None' });
        const entryDay = (entry.day || '').trim().toLowerCase();
        const currentDay = (today || '').trim().toLowerCase();

        const isToday = entryDay === currentDay;
        const isDaily = repeatConfig.type === 'Daily';

        // Debugging logs to help identify why tasks show on Sunday
        if (currentDay === 'sunday' && (isToday || isDaily)) {
            console.log(`[SUNDAY DEBUG] Match found: ${entry.subject}, Day: ${entryDay}, Type: ${repeatConfig.type}`);
        }

        // Hide completed tasks from today's list
        const matchesDay = isToday || isDaily;
        const notCompleted = !entry.is_completed;

        return matchesDay && notCompleted;
    });

    const stats = [
        { label: 'Total Tasks', value: totalTasks, icon: <Activity size={20} />, color: 'var(--primary)' },
        { label: 'Completed', value: completedCount, icon: <CheckCircle size={20} />, color: '#10b981' },
        { label: 'Pending', value: pendingCount, icon: <Clock size={20} />, color: '#f59e0b' },
        { label: 'Productivity', value: `${completionRate}%`, icon: <TrendingUp size={20} />, color: '#8b5cf6' },
    ];

    const getNextClass = () => {
        if (!todayEntries.length) return null;
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const upcoming = todayEntries
            .map(entry => {
                const [hours, minutes] = entry.start_time.split(':').map(Number);
                const startTimeInMinutes = hours * 60 + minutes;
                return { ...entry, startTimeInMinutes };
            })
            .filter(entry => entry.startTimeInMinutes > currentTimeInMinutes && !entry.is_completed)
            .sort((a, b) => a.startTimeInMinutes - b.startTimeInMinutes);
        return upcoming.length > 0 ? upcoming[0] : null;
    };

    const nextClass = getNextClass();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!nextClass) return;
        const updateTimer = () => {
            const now = new Date();
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
            const diff = nextClass.startTimeInMinutes - currentTimeInMinutes;
            if (diff > 60) {
                setTimeLeft(`In ${Math.floor(diff / 60)}h ${diff % 60}m`);
            } else if (diff > 0) {
                setTimeLeft(`In ${diff} minutes`);
            } else {
                setTimeLeft('Happening now');
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [nextClass]);

    const handleToggleComplete = async (entry) => {
        try {
            await api.put(`/timetable/${entry.id}`, {
                ...entry,
                is_completed: !entry.is_completed,
                start_time: entry.start_time.substring(0, 5),
                end_time: entry.end_time.substring(0, 5),
                repeat_config: typeof entry.repeat_config === 'string' ? JSON.parse(entry.repeat_config) : entry.repeat_config
            });
            toast.success(entry.is_completed ? 'Task marked as pending' : 'Task marked as completed');
            fetchData();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const productivityData = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
        const dayTasks = timetable.filter(t => {
            const repeatConfig = typeof t.repeat_config === 'string' ? JSON.parse(t.repeat_config) : (t.repeat_config || { type: 'None' });
            return (t.day || '').trim().toLowerCase() === dayName.toLowerCase() || repeatConfig.type === 'Daily';
        });
        return {
            day: dayName.substring(0, 3),
            rate: dayTasks.length > 0 ? (dayTasks.filter(t => t.is_completed).length / dayTasks.length) * 100 : 0
        };
    });

    return (
        <Layout>
            <div style={{
                marginBottom: isMobile ? '20px' : '30px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'flex-start',
                gap: isMobile ? '16px' : '0'
            }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '13px' : '15px' }}>Welcome back to your schedule.</p>
                </div>
                {!isMobile && (
                    <button
                        onClick={() => navigate('/timetable')}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
                    >
                        <Plus size={20} /> Add Entry
                    </button>
                )}
            </div>

            {/* Active Class / Next Class Widget */}
            <div style={{ marginBottom: '40px' }}>
                {nextClass && (
                    <div className="card glass" style={{
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                        color: 'white',
                        padding: isMobile ? '20px' : '30px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'rgba(255,255,255,0.9)' }}>
                                <Clock size={20} />
                                <span style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {timeLeft.includes('Happening now') ? 'Currently Happening' : 'Upcoming Next'}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{nextClass.subject}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '20px' }}>{nextClass.location}</p>

                            {/* Live Progress Bar Simulation */}
                            <div style={{
                                height: '6px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '10px',
                                marginBottom: '10px'
                            }}>
                                <div style={{
                                    width: timeLeft.includes('Happening now') ? '40%' : '100%',
                                    height: '100%',
                                    backgroundColor: 'white',
                                    borderRadius: '10px',
                                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                                }}></div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>
                                {timeLeft}
                            </div>
                        </div>

                        {/* Abstract background shapes */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '150px',
                            height: '150px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}></div>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(4, 1fr)',
                gap: isMobile ? '12px' : '20px',
                marginBottom: isMobile ? '24px' : '40px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{
                        padding: isMobile ? '12px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: `${stat.color}15`,
                            color: stat.color,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: '800' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : (window.innerWidth < 1000 ? '1fr' : '2fr 1fr'),
                gap: isMobile ? '20px' : '30px'
            }}>
                {/* Schedule Card */}
                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Today's Tasks</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{today}, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</p>
                        </div>
                        <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-main)', fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                            {todayEntries.length} Items
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading tasks...</div>
                    ) : todayEntries.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            <div style={{ marginBottom: '15px' }}><Calendar size={48} opacity={0.2} /></div>
                            <p style={{ fontWeight: '600' }}>Your schedule is clear for today!</p>
                            <button onClick={() => navigate('/timetable')} style={{ marginTop: '15px', color: 'var(--primary)', fontWeight: '700', fontSize: '14px' }}>Add Something</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {todayEntries.map((entry) => (
                                <div key={entry.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    backgroundColor: entry.is_completed ? 'transparent' : 'var(--bg-main)',
                                    border: entry.is_completed ? '1px dashed var(--border)' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: 'var(--bg-card)',
                                        color: entry.priority === 'High' ? '#ef4444' : 'var(--text-muted)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        border: '1px solid var(--border)',
                                        flexShrink: 0
                                    }}>
                                        {entry.start_time.substring(0, 5)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            textDecoration: entry.is_completed ? 'line-through' : 'none',
                                            color: entry.is_completed ? 'var(--text-muted)' : 'var(--text-main)'
                                        }}>{entry.subject}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={10} /> {entry.location || 'No location'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleComplete(entry)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '10px',
                                            backgroundColor: entry.is_completed ? '#dcfce7' : 'white',
                                            color: entry.is_completed ? '#10b981' : 'var(--border)',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <CheckCircle size={18} fill={entry.is_completed ? '#10b981' : 'transparent'} color={entry.is_completed ? 'white' : 'currentColor'} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '15px' }}>Weekly Activity</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', gap: '8px' }}>
                                {productivityData.map((data, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${data.rate || 5}%`,
                                            background: data.rate > 70 ? 'var(--primary)' : 'rgba(99, 102, 241, 0.3)',
                                            borderRadius: '6px 6px 2px 2px',
                                            minHeight: '8px'
                                        }}></div>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>{data.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card glass" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>Goal Tracking</h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Keep your streak alive! Complete at least 80% tasks weekly.</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'center', gap: '15px' }}>
                            <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                                <svg width="60" height="60" viewBox="0 0 60 60">
                                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                    <circle cx="30" cy="30" r="25" fill="none" stroke="var(--primary)" strokeWidth="6"
                                        strokeDasharray={`${(completionRate / 100) * 157} 157`}
                                        strokeLinecap="round" transform="rotate(-90 30 30)"
                                    />
                                </svg>
                                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                                    {completionRate}%
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '700' }}>{completionRate > 80 ? 'Excellent Status' : 'Keep Going!'}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Consistent performance</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </Layout>
    );
};

export default Dashboard;

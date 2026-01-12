import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Calendar, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
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
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/timetable');
                setTimetable(res.data);
            } catch (error) {
                toast.error('Failed to load report data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Generate Weekly Data
    const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
        const dayTasks = timetable.filter(t => {
            const fullDay = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' }[day];
            const repeatConfig = typeof t.repeat_config === 'string' ? JSON.parse(t.repeat_config) : (t.repeat_config || { type: 'None' });
            return t.day === fullDay || repeatConfig.type === 'Daily';
        });
        return {
            name: day,
            Completed: dayTasks.filter(t => t.is_completed).length,
            Total: dayTasks.length
        };
    });

    // Simulated Monthly Data (Trends)
    const monthlyData = [
        { name: 'Week 1', Completion: 65 },
        { name: 'Week 2', Completion: 78 },
        { name: 'Week 3', Completion: 72 },
        { name: 'Week 4', Completion: 85 },
    ];

    // Simulated Yearly Data 
    const yearlyData = [
        { name: 'Jan', Tasks: 45 }, { name: 'Feb', Tasks: 52 }, { name: 'Mar', Tasks: 48 },
        { name: 'Apr', Tasks: 61 }, { name: 'May', Tasks: 55 }, { name: 'Jun', Tasks: 67 },
        { name: 'Jul', Tasks: 72 }, { name: 'Aug', Tasks: 68 }, { name: 'Sep', Tasks: 75 },
        { name: 'Oct', Tasks: 82 }, { name: 'Nov', Tasks: 78 }, { name: 'Dec', Tasks: 85 },
    ];

    const cardStyle = {
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        padding: isMobile ? '16px' : '30px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    if (loading) return <Layout><div>Loading analytical reports...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '40px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Visualize your productivity trends and task completion rates.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: isMobile ? '20px' : '30px',
                marginBottom: '40px'
            }}>
                {/* Weekly Report */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <BarChart2 size={22} color="var(--primary)" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Weekly Completion</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    itemStyle={{ color: 'var(--text-main)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 10 : 20} />
                                <Bar dataKey="Total" fill="var(--border)" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 10 : 20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <TrendingUp size={22} color="#10b981" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Monthly Productivity %</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                />
                                <Line type="monotone" dataKey="Completion" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Yearly Report */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                    <Calendar size={22} color="#8b5cf6" />
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Yearly Task Volume</h3>
                </div>
                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer>
                        <AreaChart data={yearlyData}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="Tasks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
};

export default Reports;

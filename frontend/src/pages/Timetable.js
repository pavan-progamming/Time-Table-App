

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../services/api';
import {
    Plus,
    Search,
    Clock,
    Edit2,
    Trash2,
    Loader2,
    Calendar as CalendarIcon,
    CheckCircle,
    MapPin,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Timetable = () => {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [filterDay, setFilterDay] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
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

    const [formData, setFormData] = useState({
        subject: '',
        day: 'Monday',
        start_time: '',
        end_time: '',
        location: '',
        priority: 'Medium',
        notes: '',
        repeat_config: { type: 'None' },
        alert_offset: 0
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const location = useLocation();
    const { state } = location;

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/timetable');
            setTimetable(res.data);

            if (state?.editId) {
                const entryToEdit = res.data.find(item => item.id === state.editId);
                if (entryToEdit) {
                    handleOpenModal(entryToEdit);
                }
            }
        } catch (error) {
            toast.error('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [state]);

    const handleOpenModal = (entry = null) => {
        if (entry) {
            setEditingEntry(entry);
            const repeatConfig = typeof entry.repeat_config === 'string' ? JSON.parse(entry.repeat_config) : (entry.repeat_config || { type: 'None' });
            setFormData({
                ...entry,
                start_time: entry.start_time.substring(0, 5),
                end_time: entry.end_time.substring(0, 5),
                repeat_config: repeatConfig,
                alert_offset: entry.alert_offset || 0
            });
        } else {
            setEditingEntry(null);
            setFormData({
                subject: '',
                day: 'Monday',
                start_time: '',
                end_time: '',
                location: '',
                priority: 'Medium',
                notes: '',
                repeat_config: { type: 'None' },
                alert_offset: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject || !formData.start_time || !formData.end_time) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (editingEntry) {
                await api.put(`/timetable/${editingEntry.id}`, formData);
                toast.success('Entry updated');
            } else {
                await api.post('/timetable', formData);
                toast.success('Entry added');
            }
            setIsModalOpen(false);
            const res = await api.get('/timetable');
            setTimetable(res.data);

            // Sync Notifications
            const NotificationService = require('../services/NotificationService').default;
            NotificationService.scheduleClassReminders(res.data, user?.name);
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toast.error(`Failed to save: ${errMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await api.delete(`/timetable/${id}`);
                toast.success('Entry deleted');
                const res = await api.get('/timetable');
                setTimetable(res.data);

                // Sync Notifications
                const NotificationService = require('../services/NotificationService').default;
                NotificationService.scheduleClassReminders(res.data, user?.name);
            } catch (error) {
                toast.error('Failed to delete entry');
            }
        }
    };

    const filteredTimetable = timetable.filter(item => {
        const repeatConfig = typeof item.repeat_config === 'string' ? JSON.parse(item.repeat_config) : (item.repeat_config || { type: 'None' });

        // Strict day matching: If we select Monday, only show Monday tasks. 
        // Previously it included 'Daily' tasks which might have confused the user.
        // Let's make it so if a day is selected, it shows tasks for that day OR Daily tasks, 
        // but the user said "see i heave kept day monday but showing all days". 
        // This suggests he wants SPECIFIC day tasks.
        const matchesDay = filterDay === 'All' || item.day === filterDay;

        const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesDay && matchesSearch;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0' : '10px 0', width: '100%' }}>
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'flex-start',
                    marginBottom: '32px',
                    gap: '24px',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '13px' : '15px' }}>
                            Organize your schedule efficiently.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Search size={18} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none',
                                zIndex: 1
                            }} />
                            <input
                                type="text"
                                placeholder="Search schedule..."
                                style={{
                                    paddingLeft: '42px',
                                    paddingRight: '14px',
                                    height: '42px',
                                    width: '100%',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-card)',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {!isMobile && (
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 28px',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Plus size={18} strokeWidth={3} />
                                <span>Add Entry</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '32px',
                    overflowX: 'auto',
                    padding: '4px 0',
                    margin: '0 -10px', // Negative margin to bleed to edges on mobile
                    paddingLeft: '10px',
                    paddingRight: '20px', // Extra space for end of scroll
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }} className="hide-scrollbar">
                    <button
                        onClick={() => setFilterDay('All')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '100px',
                            backgroundColor: filterDay === 'All' ? 'var(--primary)' : 'var(--bg-card)',
                            color: filterDay === 'All' ? 'white' : 'var(--text-muted)',
                            fontWeight: '700',
                            fontSize: '13px',
                            border: filterDay === 'All' ? 'none' : '1px solid var(--border)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap',
                            boxShadow: filterDay === 'All' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                        }}
                    >
                        All
                    </button>
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setFilterDay(day)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '100px',
                                backgroundColor: filterDay === day ? 'var(--primary)' : 'var(--bg-card)',
                                color: filterDay === day ? 'white' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '13px',
                                border: filterDay === day ? 'none' : '1px solid var(--border)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                whiteSpace: 'nowrap',
                                boxShadow: filterDay === day ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {
                    loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile && !isLandscape ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: isMobile ? '16px' : '24px',
                            paddingBottom: '40px'
                        }}>
                            {filteredTimetable.length === 0 ? (
                                <div style={{
                                    gridColumn: '1/-1',
                                    textAlign: 'center',
                                    padding: isMobile ? '60px 20px' : '80px 20px',
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: isMobile ? '16px' : '24px',
                                    border: '1px dashed var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{
                                        width: '80px', height: '80px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <CalendarIcon size={32} color="var(--primary)" style={{ opacity: 0.6 }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>No schedule found</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        You don't have any classes for {filterDay === 'All' ? 'any day' : filterDay}.
                                        <br />Click "Add Entry" to get started.
                                    </p>
                                </div>
                            ) : (
                                filteredTimetable.map(item => (
                                    <div key={item.id} className="card" style={{
                                        position: 'relative',
                                        padding: isMobile ? '16px' : '24px',
                                        borderRadius: isMobile ? '16px' : '24px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg-card)',
                                        boxShadow: 'var(--shadow)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        opacity: item.is_completed ? 0.7 : 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {/* Side Color Strip */}
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '6px',
                                            backgroundColor: getPriorityColor(item.priority)
                                        }} />

                                        {/* Header: Day & Actions */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingLeft: '12px' }}>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: 'var(--text-muted)',
                                                backgroundColor: 'var(--bg-main)',
                                                padding: '4px 10px',
                                                borderRadius: '6px'
                                            }}>
                                                {item.day}
                                            </span>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleToggleComplete(item)}
                                                    style={{
                                                        padding: '6px',
                                                        borderRadius: '8px',
                                                        color: item.is_completed ? '#10b981' : 'var(--text-muted)',
                                                        backgroundColor: item.is_completed ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                                                    }}
                                                    title="Mark as Done"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button onClick={() => handleOpenModal(item)} style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '8px' }} title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} style={{ padding: '6px', color: '#ef4444', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div style={{ paddingLeft: '12px', flex: 1 }}>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                marginBottom: '8px',
                                                color: 'var(--text-main)',
                                                textDecoration: item.is_completed ? 'line-through' : 'none',
                                                lineHeight: '1.3'
                                            }}>
                                                {item.subject}
                                            </h3>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: 'var(--primary)',
                                                fontWeight: '600',
                                                fontSize: '15px',
                                                marginBottom: '16px',
                                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                width: 'fit-content',
                                                padding: '6px 12px',
                                                borderRadius: '8px'
                                            }}>
                                                <Clock size={16} />
                                                <span>{item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}</span>
                                            </div>

                                            {item.notes && (
                                                <div style={{
                                                    backgroundColor: 'var(--bg-main)',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    fontSize: '14px',
                                                    color: 'var(--text-muted)',
                                                    marginBottom: '16px',
                                                    lineHeight: '1.5',
                                                    border: '1px solid rgba(0,0,0,0.03)'
                                                }}>
                                                    {item.notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Info */}
                                        <div style={{
                                            paddingLeft: '12px',
                                            paddingTop: '16px',
                                            marginTop: 'auto',
                                            borderTop: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                <MapPin size={14} />
                                                <span style={{ fontWeight: 500 }}>{item.location || 'No Location'}</span>
                                            </div>

                                            {item.alert_offset > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>
                                                    <AlertCircle size={12} />
                                                    <span>{item.alert_offset}m early</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                }

                {/* Styled Entry Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingEntry ? 'Edit Schedule Entry' : 'New Schedule Entry'}
                >
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Subject Name</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g. Mathematics"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Day</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.day}
                                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                >
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Priority</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low (Green)</option>
                                    <option value="Medium">Medium (Orange)</option>
                                    <option value="High">High (Red)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Start Time</label>
                                <input
                                    type="time"
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>End Time</label>
                                <input
                                    type="time"
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Repeat</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.repeat_config?.type || 'None'}
                                    onChange={(e) => setFormData({ ...formData, repeat_config: { type: e.target.value } })}
                                >
                                    <option value="None">None</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Alert</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                    value={formData.alert_offset}
                                    onChange={(e) => setFormData({ ...formData, alert_offset: parseInt(e.target.value) })}
                                >
                                    <option value={0}>None</option>
                                    <option value={5}>5 mins before</option>
                                    <option value={15}>15 mins before</option>
                                    <option value={30}>30 mins before</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Location / Room</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Main Hall, Room 101, Online..."
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>Notes</label>
                            <textarea
                                style={{ width: '100%', height: '100px', padding: '12px 16px', fontSize: '15px', resize: 'none', lineHeight: '1.5' }}
                                placeholder="Add instructions, links, or specific details..."
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '10px',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            {editingEntry ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </form>
                </Modal>

                <style>{`
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div >
            {/* Floating Action Button for Mobile */}
            {
                isMobile && (
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            position: 'fixed',
                            right: '25px',
                            bottom: '100px', // Above bottom nav
                            width: '56px',
                            height: '56px',
                            borderRadius: '28px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)',
                            border: 'none',
                            zIndex: 100
                        }}
                    >
                        <Plus size={28} strokeWidth={3} />
                    </button>
                )
            }
        </Layout >
    );
};

export default Timetable;

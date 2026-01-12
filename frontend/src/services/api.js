import axios from 'axios';

// Mock Database for Offline Mode
// We initialize it if it doesn't exist
const getLocalDB = () => {
    const saved = localStorage.getItem('offline_db');
    const db = saved ? JSON.parse(saved) : {
        timetable: [],
        notifications: [],
        userSettings: {},
        completion_log: [] // Array of { task_id, completed_date, subject }
    };

    // Ensure completion_log exists for backward compatibility
    if (!db.completion_log) {
        db.completion_log = [];
    }

    return db;
};

const saveLocalDB = (db) => localStorage.setItem('offline_db', JSON.stringify(db));

// Helper: Get today's date string (YYYY-MM-DD)
const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

// Helper: Check if a task is completed for a specific date
const isTaskCompletedForDate = (db, taskId, dateString) => {
    return db.completion_log.some(log =>
        log.task_id === taskId && log.completed_date === dateString
    );
};

// Helper: Get the "effective" completion status for a task based on its recurrence
const getEffectiveCompletionStatus = (task, db) => {
    const today = getTodayString();
    const repeatConfig = typeof task.repeat_config === 'string' ?
        JSON.parse(task.repeat_config) : (task.repeat_config || { type: 'None' });

    // For Daily tasks, check if completed today
    if (repeatConfig.type === 'Daily') {
        return isTaskCompletedForDate(db, task.id, today);
    }

    // For Weekly tasks, check if completed this week
    if (repeatConfig.type === 'Weekly') {
        const todayDate = new Date();
        const dayOfWeek = todayDate.getDay();
        const taskDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(task.day);

        // If today is the task's day, check if completed today
        if (dayOfWeek === taskDay) {
            return isTaskCompletedForDate(db, task.id, today);
        }
        // If we're past the task's day this week, check if it was completed on that day
        if (dayOfWeek > taskDay) {
            const daysAgo = dayOfWeek - taskDay;
            const taskDate = new Date(todayDate);
            taskDate.setDate(taskDate.getDate() - daysAgo);
            const taskDateString = taskDate.toISOString().split('T')[0];
            return isTaskCompletedForDate(db, task.id, taskDateString);
        }
        // If we haven't reached the task's day yet this week, it's not completed
        return false;
    }

    // For one-time tasks, use the old is_completed flag
    return task.is_completed || false;
};

// Helper to simulate a slight network delay (optional, makes it feel less "instant"/fake if desired, but for offline, instant is good)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
    baseURL: 'http://localhost:3000', // Dummy URL, we won't hit it
});

// Full Override of the Request Adapter to prevent ANY network calls
api.defaults.adapter = async (config) => {
    console.log(`[OFFLINE ACTIONS] ${config.method.toUpperCase()} ${config.url}`);

    // Simulate tiny delay for better UX (prevent flickering)
    await delay(100);

    const db = getLocalDB();

    // -------------------------------------------------------------------------
    // TIMETABLE ROUTES
    // -------------------------------------------------------------------------

    // GET /timetable
    if (config.url === '/timetable' && config.method === 'get') {
        // Return tasks with their effective completion status
        const enrichedTimetable = db.timetable.map(task => ({
            ...task,
            is_completed: getEffectiveCompletionStatus(task, db)
        }));
        return { data: enrichedTimetable, status: 200, statusText: 'OK', headers: {}, config };
    }

    // POST /timetable
    if (config.url === '/timetable' && config.method === 'post') {
        const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const newEntry = {
            id: Date.now(),
            ...requestData,
            is_completed: false,
            created_at: new Date().toISOString()
        };
        db.timetable.push(newEntry);
        saveLocalDB(db);
        return { data: newEntry, status: 201, statusText: 'Created', headers: {}, config };
    }

    // PUT /timetable/:id
    if (config.url.startsWith('/timetable/') && config.method === 'put') {
        const id = parseInt(config.url.split('/').pop());
        const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;

        const index = db.timetable.findIndex(t => t.id === id);
        if (index !== -1) {
            const task = db.timetable[index];
            const repeatConfig = typeof task.repeat_config === 'string' ?
                JSON.parse(task.repeat_config) : (task.repeat_config || { type: 'None' });

            // If this is a completion toggle for a recurring task
            if (requestData.hasOwnProperty('is_completed')) {
                const today = getTodayString();

                if (repeatConfig.type === 'Daily' || repeatConfig.type === 'Weekly') {
                    // For recurring tasks, log to completion_log instead of setting is_completed
                    if (requestData.is_completed) {
                        // Add to completion log if not already there
                        if (!isTaskCompletedForDate(db, id, today)) {
                            db.completion_log.push({
                                task_id: id,
                                completed_date: today,
                                subject: task.subject
                            });
                        }
                    } else {
                        // Remove from completion log
                        db.completion_log = db.completion_log.filter(log =>
                            !(log.task_id === id && log.completed_date === today)
                        );
                    }
                    // Don't update the is_completed flag for recurring tasks
                    delete requestData.is_completed;
                }
            }

            // Update the task with remaining fields
            db.timetable[index] = { ...db.timetable[index], ...requestData };
            saveLocalDB(db);

            // Return with effective completion status
            const updatedTask = {
                ...db.timetable[index],
                is_completed: getEffectiveCompletionStatus(db.timetable[index], db)
            };
            return { data: updatedTask, status: 200, statusText: 'OK', headers: {}, config };
        }
        return { data: { message: 'Not Found' }, status: 404, statusText: 'Not Found', headers: {}, config };
    }

    // DELETE /timetable/:id
    if (config.url.startsWith('/timetable/') && config.method === 'delete') {
        const id = parseInt(config.url.split('/').pop());
        db.timetable = db.timetable.filter(t => t.id !== id);
        saveLocalDB(db);
        return { data: { message: 'Deleted' }, status: 200, statusText: 'OK', headers: {}, config };
    }

    // -------------------------------------------------------------------------
    // NOTIFICATION/SETTINGS ROUTES
    // -------------------------------------------------------------------------

    // GET /notifications
    if (config.url === '/notifications' && config.method === 'get') {
        return { data: db.notifications || [], status: 200, statusText: 'OK', headers: {}, config };
    }

    // PUT /auth/profile (Settings)
    if (config.url.includes('/auth/profile') && config.method === 'put') {
        return { data: { message: 'Profile updated offline' }, status: 200, statusText: 'OK', headers: {}, config };
    }

    // Ping
    if (config.url === '/api/ping') {
        return { data: { message: 'Pong' }, status: 200, statusText: 'OK', headers: {}, config };
    }

    // Default fallback
    return { data: { message: 'Offline Mock: Route not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
};

export default api;

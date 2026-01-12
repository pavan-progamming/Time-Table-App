import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
    async requestPermissions() {
        try {
            // Create high-priority channel for Android (the "Bell")
            await LocalNotifications.createChannel({
                id: 'class-reminders',
                name: 'Class Reminders',
                description: 'Notifications for upcoming classes',
                importance: 5, // Important for "ringing" sound
                visibility: 1,
                sound: 'default', // Using system default to ensure it rings
                vibration: true
            });

            const { display } = await LocalNotifications.requestPermissions();
            return display === 'granted';
        } catch (e) {
            console.error('Permission request failed', e);
            return false;
        }
    }

    async scheduleClassReminders(timetable, userName = 'Pavan') {
        try {
            // First clear all existing notifications to avoid duplicates
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const schedule = [];
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayIndex = new Date().getDay();

            timetable.forEach((item) => {
                if (item.is_completed) return;

                const [hours, minutes] = item.start_time.split(':').map(Number);
                const itemDayIndex = days.indexOf(item.day);
                const repeatConfig = typeof item.repeat_config === 'string' ? JSON.parse(item.repeat_config) : (item.repeat_config || { type: 'None' });

                if (itemDayIndex === -1 && repeatConfig.type !== 'Daily') return;

                const now = new Date();
                let notificationDate = new Date();
                notificationDate.setHours(hours, minutes, 0, 0);

                // Apply alert offset (e.g. 5 mins before)
                const offsetMinutes = item.alert_offset || 0;
                notificationDate.setMinutes(notificationDate.getMinutes() - offsetMinutes);

                // Personalize body based on user request: "pavan its 2pm it's time do dsa"
                const ampm = hours >= 12 ? 'pm' : 'am';
                const displayHour = hours % 12 || 12;
                const timeString = `${displayHour}${ampm}`;
                const body = `${userName}, it's ${timeString}! It's time to do ${item.subject}.`;

                if (repeatConfig.type === 'Daily') {
                    // Daily notification
                    if (notificationDate < now) {
                        notificationDate.setDate(notificationDate.getDate() + 1);
                    }
                    schedule.push({
                        title: `⏰ Time for ${item.subject}`,
                        body: body,
                        id: Math.floor(Math.random() * 1000000),
                        schedule: {
                            on: { hour: hours, minute: Math.max(0, minutes - offsetMinutes) },
                            repeats: true,
                            allowWhileIdle: true
                        },
                        sound: 'default',
                        channelId: 'class-reminders',
                        extra: { type: 'class_reminder' }
                    });
                } else {
                    // Weekly or One-time
                    let daysAway = itemDayIndex - todayIndex;
                    if (daysAway < 0) daysAway += 7;

                    notificationDate.setDate(now.getDate() + daysAway);
                    if (notificationDate < now) {
                        notificationDate.setDate(notificationDate.getDate() + 7);
                    }

                    schedule.push({
                        title: `⏰ Time for ${item.subject}`,
                        body: body,
                        id: Math.floor(Math.random() * 1000000),
                        schedule: {
                            at: notificationDate,
                            repeats: repeatConfig.type === 'Weekly',
                            every: repeatConfig.type === 'Weekly' ? 'week' : undefined,
                            allowWhileIdle: true
                        },
                        sound: 'default',
                        channelId: 'class-reminders',
                        extra: { type: 'class_reminder' }
                    });
                }
            });

            if (schedule.length > 0) {
                // Ensure unique IDs
                const uniqueSchedule = schedule.map((s, idx) => ({ ...s, id: idx + 100 }));
                await LocalNotifications.schedule({
                    notifications: uniqueSchedule.slice(0, 50)
                });
            }
        } catch (error) {
            console.error('Failed to schedule notifications:', error);
        }
    }

    async notifyImmediately(title, body) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: 1,
                    schedule: { at: new Date(Date.now() + 1000) },
                    sound: 'default'
                }
            ]
        });
    }
}

export default new NotificationService();

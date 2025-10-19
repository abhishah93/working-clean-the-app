
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput;
}

class NotificationService {
  private initialized = false;
  private permissionStatus: string | null = null;

  async initialize() {
    // Return cached status if already initialized
    if (this.initialized && this.permissionStatus) {
      console.log('Using cached notification permission status:', this.permissionStatus);
      return this.permissionStatus === 'granted';
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Cache the permission status
      this.permissionStatus = finalStatus;

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        this.initialized = true;
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('timers', {
          name: 'Timers',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('tasks', {
          name: 'Tasks',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          sound: 'default',
        });
      }

      this.initialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.initialized = true;
      return false;
    }
  }

  async scheduleNotification(config: NotificationConfig): Promise<string | null> {
    try {
      const isInitialized = await this.initialize();
      if (!isInitialized) {
        console.log('Notifications not enabled, skipping schedule');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: true,
        },
        trigger: config.trigger || null,
      });

      console.log('Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async scheduleTimerNotification(timerName: string, seconds: number): Promise<string | null> {
    return this.scheduleNotification({
      title: 'Timer Complete! ⏰',
      body: `Your timer "${timerName}" has finished!`,
      data: { type: 'timer', timerName },
      trigger: { seconds },
    });
  }

  async scheduleTaskReminder(taskTitle: string, time: Date): Promise<string | null> {
    const now = new Date();
    const secondsUntilTask = Math.floor((time.getTime() - now.getTime()) / 1000);

    if (secondsUntilTask <= 0) {
      console.log('Task time is in the past, not scheduling notification');
      return null;
    }

    return this.scheduleNotification({
      title: 'Task Reminder 📋',
      body: `Time to work on: ${taskTitle}`,
      data: { type: 'task', taskTitle },
      trigger: { seconds: secondsUntilTask },
    });
  }

  async scheduleHabitReminder(habitName: string, hour: number, minute: number): Promise<string | null> {
    return this.scheduleNotification({
      title: 'Habit Reminder ✅',
      body: `Don't forget: ${habitName}`,
      data: { type: 'habit', habitName },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();

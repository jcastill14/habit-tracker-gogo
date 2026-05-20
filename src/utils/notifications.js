// Notification utilities with real Web Push support

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('SW registered:', reg.scope);
      return reg;
    } catch (e) {
      console.error('SW registration failed:', e);
    }
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'not-supported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
};

export const showLocalNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

// Convert base64 VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Subscribe to real Web Push and save to server
export const subscribeToWebPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push not supported');
    return null;
  }

  const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('No VAPID public key configured');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to server
    const subJson = subscription.toJSON();
    await fetch('/.netlify/functions/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }),
    });

    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
};

// Sync habits and completions to Supabase so server can send pushes
export const syncToServer = async (habits, completions) => {
  try {
    await fetch('/.netlify/functions/sync-habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits, completions }),
    });
  } catch (err) {
    console.warn('Sync failed:', err);
  }
};

// Fallback: local setTimeout-based notifications (when tab is open)
const scheduledTimers = {};

export const clearScheduledNotifications = (habitId) => {
  if (scheduledTimers[habitId]) {
    scheduledTimers[habitId].forEach(clearTimeout);
    delete scheduledTimers[habitId];
  }
};

export const scheduleHabitNotifications = (habit) => {
  clearScheduledNotifications(habit.id);
  if (!habit.notifications?.enabled) return;
  if (Notification.permission !== 'granted') return;

  const timers = [];

  const scheduleDaily = (timeStr, title, body) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    const timer = setTimeout(() => {
      showLocalNotification(title, body);
      scheduleDaily(timeStr, title, body);
    }, delay);
    timers.push(timer);
  };

  if (habit.notifications.time) {
    scheduleDaily(
      habit.notifications.time,
      `${habit.emoji} ${habit.name}`,
      `¡Es hora de tu hábito! No olvides completar: ${habit.name}`
    );
  }

  if (habit.notifications.endOfDayAlert && habit.notifications.endOfDayTime) {
    scheduleDaily(
      habit.notifications.endOfDayTime,
      `⏰ Fin del día - ${habit.name}`,
      `¿Completaste tu hábito "${habit.name}" hoy? ¡Aún estás a tiempo!`
    );
  }

  scheduledTimers[habit.id] = timers;
};

export const scheduleAllHabitNotifications = (habits) => {
  habits.forEach((h) => scheduleHabitNotifications(h));
};

export const checkStreakAlerts = (habits, getStreak, isCompleted, formatDate) => {
  if (Notification.permission !== 'granted') return;
  const today = formatDate(new Date());
  habits.forEach((habit) => {
    if (!habit.notifications?.enabled || !habit.notifications?.streakAlertDays) return;
    if (isCompleted(habit.id, today)) return;
    let missingDays = 0;
    for (let i = 1; i <= habit.notifications.streakAlertDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (!isCompleted(habit.id, formatDate(d))) missingDays++;
    }
    if (missingDays >= habit.notifications.streakAlertDays) {
      setTimeout(() => {
        showLocalNotification(
          `⚠️ ${habit.name} - ${missingDays} días sin completar`,
          `Llevas ${missingDays} días sin completar "${habit.name}". ¡No rompas la racha!`
        );
      }, 3000);
    }
  });
};

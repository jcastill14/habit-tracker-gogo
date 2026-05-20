// Storage utility - all data in localStorage for cross-device sync via export/import
// For true cross-device, user would need a backend. This version uses localStorage + export/import.

export const STORAGE_KEYS = {
  HABITS: 'gogo_habits',
  COMPLETIONS: 'gogo_completions',
  SETTINGS: 'gogo_settings',
};

// Default habits structure
export const createHabit = (name, emoji = '⭐', color = '#00e5a0') => ({
  id: Date.now().toString(),
  name,
  emoji,
  color,
  goal: 5, // days per week
  createdAt: new Date().toISOString(),
  notifications: {
    enabled: false,
    time: '09:00',
    streakAlertDays: 3, // alert if not completed after X days
    endOfDayAlert: true,
    endOfDayTime: '21:00',
  },
});

export const getHabits = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveHabits = (habits) => {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
};

export const addHabit = (habit) => {
  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);
  return habit;
};

export const updateHabit = (id, updates) => {
  const habits = getHabits();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx !== -1) {
    habits[idx] = { ...habits[idx], ...updates };
    saveHabits(habits);
  }
};

export const deleteHabit = (id) => {
  const habits = getHabits().filter((h) => h.id !== id);
  saveHabits(habits);
  // Also clean completions
  const completions = getCompletions();
  const cleaned = {};
  Object.keys(completions).forEach((key) => {
    if (!key.startsWith(id + '_')) cleaned[key] = completions[key];
  });
  saveCompletions(cleaned);
};

// Completions: key = `habitId_YYYY-MM-DD`, value = boolean
export const getCompletions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveCompletions = (completions) => {
  localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
};

export const toggleCompletion = (habitId, dateStr) => {
  const completions = getCompletions();
  const key = `${habitId}_${dateStr}`;
  if (completions[key]) {
    delete completions[key];
  } else {
    completions[key] = true;
  }
  saveCompletions(completions);
  return !completions[key] === false; // returns new state
};

export const isCompleted = (habitId, dateStr) => {
  const completions = getCompletions();
  return !!completions[`${habitId}_${dateStr}`];
};

export const getCompletionsByHabit = (habitId) => {
  const completions = getCompletions();
  const result = {};
  Object.keys(completions).forEach((key) => {
    if (key.startsWith(habitId + '_')) {
      const date = key.replace(habitId + '_', '');
      result[date] = completions[key];
    }
  });
  return result;
};

// Settings
export const getSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { notificationsGranted: false };
  } catch {
    return { notificationsGranted: false };
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// Stats helpers
export const getWeekDates = (referenceDate = new Date()) => {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0=sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
};

export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export const getStreak = (habitId) => {
  const completions = getCompletionsByHabit(habitId);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDate(d);
    if (completions[key]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const getWeeklyProgress = (habitId, weekDates) => {
  const completions = getCompletionsByHabit(habitId);
  return weekDates.filter((d) => completions[formatDate(d)]).length;
};

export const getAllTimeStats = (habitId) => {
  const completions = getCompletionsByHabit(habitId);
  const dates = Object.keys(completions).sort();
  if (!dates.length) return { total: 0, streak: 0, longestStreak: 0, firstDate: null };

  const total = dates.length;
  const streak = getStreak(habitId);

  // Longest streak
  let longest = 0;
  let current = 0;
  let prevDate = null;
  for (const dateStr of dates) {
    if (prevDate) {
      const prev = new Date(prevDate);
      const curr = new Date(dateStr);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
      } else {
        longest = Math.max(longest, current);
        current = 1;
      }
    } else {
      current = 1;
    }
    prevDate = dateStr;
  }
  longest = Math.max(longest, current);

  return { total, streak, longestStreak: longest, firstDate: dates[0] };
};

// Export/Import for cross-device
export const exportData = () => {
  return JSON.stringify({
    habits: getHabits(),
    completions: getCompletions(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
};

export const importData = (jsonString) => {
  const data = JSON.parse(jsonString);
  if (data.habits) saveHabits(data.habits);
  if (data.completions) saveCompletions(data.completions);
};

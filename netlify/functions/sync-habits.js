const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { habits, completions } = JSON.parse(event.body);

    // Upsert habits
    if (habits && habits.length > 0) {
      const rows = habits.map((h) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        goal: h.goal,
        notif_enabled: h.notifications?.enabled || false,
        notif_time: h.notifications?.time || '09:00',
        end_of_day_alert: h.notifications?.endOfDayAlert !== false,
        end_of_day_time: h.notifications?.endOfDayTime || '21:00',
        streak_alert_days: h.notifications?.streakAlertDays || 3,
      }));

      const { error } = await supabase
        .from('habits')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
    }

    // Upsert completions
    if (completions && Object.keys(completions).length > 0) {
      const rows = Object.keys(completions).map((key) => {
        const [habit_id, date] = key.split('_');
        return { habit_id, date };
      });

      const { error } = await supabase
        .from('completions')
        .upsert(rows, { onConflict: 'habit_id,date' });

      if (error) throw error;
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

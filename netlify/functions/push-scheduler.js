const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

webpush.setVapidDetails(
  'mailto:gogo@habittracker.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Returns HH:MM in local time for a given timezone offset
function getCurrentHHMM() {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
}

function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired, remove it
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
    }
    return false;
  }
}

exports.handler = async () => {
  const currentTime = getCurrentHHMM();
  const todayStr = getTodayStr();
  const currentHour = currentTime.slice(0, 2);
  const currentMinute = currentTime.slice(3, 5);

  console.log(`Running push scheduler at ${currentTime} UTC`);

  // Get all subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (!subscriptions || subscriptions.length === 0) {
    return { statusCode: 200, body: 'No subscriptions' };
  }

  // Get all habits with notifications enabled
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('notif_enabled', true);

  if (!habits || habits.length === 0) {
    return { statusCode: 200, body: 'No habits with notifications' };
  }

  // Get today's completions
  const { data: completions } = await supabase
    .from('completions')
    .select('habit_id')
    .eq('date', todayStr);

  const completedToday = new Set((completions || []).map((c) => c.habit_id));

  let sent = 0;

  for (const habit of habits) {
    // Check daily reminder time (within the same hour:minute window)
    if (habit.notif_time) {
      const [hh, mm] = habit.notif_time.split(':');
      if (hh === currentHour && mm === currentMinute) {
        for (const sub of subscriptions) {
          await sendPush(sub, {
            title: `${habit.emoji} ${habit.name}`,
            body: `¡Es hora de tu hábito! Marca "${habit.name}" como completado.`,
          });
          sent++;
        }
      }
    }

    // End of day alert - only if not completed today
    if (habit.end_of_day_alert && habit.end_of_day_time && !completedToday.has(habit.id)) {
      const [hh, mm] = habit.end_of_day_time.split(':');
      if (hh === currentHour && mm === currentMinute) {
        for (const sub of subscriptions) {
          await sendPush(sub, {
            title: `⏰ Fin del día - ${habit.name}`,
            body: `¿Completaste "${habit.name}" hoy? ¡Aún estás a tiempo!`,
          });
          sent++;
        }
      }
    }

    // Streak alert - check if habit hasn't been completed for X days
    if (habit.streak_alert_days && !completedToday.has(habit.id)) {
      // Only check once per day at 10:00
      if (currentHour === '10' && currentMinute === '00') {
        const { data: recentCompletions } = await supabase
          .from('completions')
          .select('date')
          .eq('habit_id', habit.id)
          .gte('date', new Date(Date.now() - habit.streak_alert_days * 86400000).toISOString().split('T')[0]);

        if (!recentCompletions || recentCompletions.length === 0) {
          for (const sub of subscriptions) {
            await sendPush(sub, {
              title: `⚠️ ${habit.name} - ${habit.streak_alert_days} días sin completar`,
              body: `Llevas ${habit.streak_alert_days}+ días sin completar "${habit.name}". ¡Retoma el hábito hoy!`,
            });
            sent++;
          }
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sent, time: currentTime }),
  };
};

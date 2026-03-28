import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOT_TOKEN = Deno.env.get('BOOKING_TELEGRAM_BOT_TOKEN')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chatId: string | number, text: string) {
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    })
    return res.ok;
  } catch (err) {
    console.error('Telegram API error:', err)
    return false;
  }
}

// Convert "HH:mm" to minutes for easy comparison
function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

serve(async (req) => {
  try {
    // 1. Get current time in Armenia (Asia/Yerevan)
    const armeniaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
    const now = new Date(armeniaTime);
    
    // Format YYYY-MM-DD
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 2. Fetch all approved/pending bookings for today that have a time_from
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, services(title_ru, title_en), tours(title_ru, title_en)')
      .eq('date', today)
      .in('status', ['approved', 'pending'])
      .not('time_from', 'is', null);

    if (error || !bookings) {
        return new Response(JSON.stringify({ error: error?.message || 'No bookings' }), { status: 500 });
    }

    // 3. Load all staff who want notifications
    const { data: recipients } = await supabase
      .from('notification_recipients')
      .select('value')
      .eq('type', 'telegram_booking')
      .eq('enabled', true);

    const chatIds = recipients?.map((r: { value: string }) => r.value) || [];
    if (chatIds.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No recipients enabled' }));
    }

    let notificationsSent = 0;

    for (const b of bookings) {
       const startMins = timeToMinutes(b.time_from);
       if (startMins <= 0) continue; // Invalid time
       
       const diffMins = startMins - currentMins;

       // Check intervals: 2h(120m), 1h(60m), 15m
       // We'll allow a small threshold (e.g. diff is between 115m and 125m) since this runs every 5 minutes.
       
       let alertLevel = null;
       let updateColumn = null;

       if (diffMins <= 125 && diffMins >= 115 && !b.notified_2h) {
           alertLevel = '2 часа';
           updateColumn = 'notified_2h';
       } else if (diffMins <= 65 && diffMins >= 55 && !b.notified_1h) {
           alertLevel = '1 час';
           updateColumn = 'notified_1h';
       } else if (diffMins <= 20 && diffMins >= 10 && !b.notified_15m) {
           alertLevel = '15 минут';
           updateColumn = 'notified_15m';
       }

       if (alertLevel && updateColumn) {
          // Send alert!
          const guestName = b.guest_name || 'Гость'
          const room = b.room_number || 'Н/Д'
          const timeFrom = b.time_from
          const timeTo = b.time_to || ''
          
          let serviceName = 'Услуга'
          if (b.services) {
              serviceName = Array.isArray(b.services) ? b.services[0]?.title_ru : (b.services?.title_ru || b.services?.title_en || 'Услуга')
          } else if (b.tours) {
              serviceName = Array.isArray(b.tours) ? b.tours[0]?.title_ru : (b.tours?.title_ru || b.tours?.title_en || 'Тур')
          }

          const timeLine = timeTo ? `${timeFrom} — ${timeTo}` : `${timeFrom}`;
          const message = `⏳ *Напоминание (через ${alertLevel})*\n\n` +
                          `🛠 Услуга: *${serviceName}*\n` +
                          `👤 Гость: *${guestName}*\n` +
                          `🏠 Номер: *${room}*\n` +
                          `🕐 Время: *${timeLine}*\n\n` +
                          (b.status === 'pending' ? '⚠️ Внимание: Заявка все еще висит как *ожидающая*!' : '✅ Статус: *Одобрено*');

          let successCount = 0;
          for (const chatId of chatIds) {
              if (await sendMessage(chatId, message)) {
                  successCount++;
              }
          }

          // Mark as notified in DB
          if (successCount > 0) {
              await supabase.from('bookings').update({ [updateColumn]: true }).eq('id', b.id);
              notificationsSent++;
          }
       }
    }

    return new Response(JSON.stringify({ success: true, sent: notificationsSent }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

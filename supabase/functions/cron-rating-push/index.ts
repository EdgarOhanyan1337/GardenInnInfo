import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TG_API = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')!}`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendMessage(chatId: string | number, text: string, extra: Record<string, unknown> = {}) {
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
    })
    return await res.json()
  } catch (err) {
    console.error('Telegram API error:', err)
    return null
  }
}

serve(async () => {
  try {
    console.log("Running housekeeping checks (rating pushes, pending reminders, ETA reminders)...")

    // =========================================================
    // 1. Pending Reminders (15 minutes unattended)
    // =========================================================
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString()
    const { data: pendingReqs } = await supabase
      .from('housekeeping_requests')
      .select('*')
      .eq('status', 'pending')
      .eq('pending_reminder_sent', false)
      .lte('created_at', fifteenMinsAgo)

    if (pendingReqs && pendingReqs.length > 0) {
      console.log(`Found ${pendingReqs.length} pending requests to remind.`)
      // Get telegram recipients
      const { data: recipients } = await supabase
        .from('notification_recipients')
        .select('value')
        .eq('type', 'telegram')
        .eq('enabled', true)
      const chatIds = [...new Set(recipients?.map((r: any) => r.value) || [])]

      for (const req of pendingReqs) {
        const room = req.room_number
        const msg = `⚠️ *ВНИМАНИЕ!*\nЗаявка на уборку из номера *${room}* висит без ответа уже более 15 минут!\nПожалуйста, примите её как можно скорее.`
        for (const chatId of chatIds) {
          await sendMessage(String(chatId), msg, {
            reply_markup: {
              inline_keyboard: [[ { text: '✅ Принять заявку', callback_data: `accept_${req.id}` } ]]
            }
          })
        }
        await supabase.from('housekeeping_requests')
          .update({ pending_reminder_sent: true })
          .eq('id', req.id)
      }
    }

    // =========================================================
    // 2. ETA Reminders (Time expired)
    // =========================================================
    const { data: etaReqs } = await supabase
      .from('housekeeping_requests')
      .select('*')
      .eq('status', 'accepted')
      .eq('eta_reminder_sent', false)
      .not('eta_minutes', 'is', null)
      .not('accepted_by_chat_id', 'is', null)

    if (etaReqs && etaReqs.length > 0) {
      for (const req of etaReqs) {
        const etaLimitTimeMs = new Date(req.eta_set_at).getTime() + (req.eta_minutes * 60000)
        if (Date.now() >= etaLimitTimeMs) {
          const room = req.room_number
          const chatId = String(req.accepted_by_chat_id)
          
          await sendMessage(chatId, `⏰ *Время подошло!*\n\nПора начинать уборку в номере *${room}*. (вы выбрали ETA ${req.eta_minutes} мин)`)

          if (room && room !== 'Н/Д') {
            await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
              body: JSON.stringify({ room_number: room, title: '🧹 Housekeeping Arriving', body: 'Our staff will be at your room momentarily.', url: '/GardenInnInfo/?view=housekeeping' })
            }).catch(e => console.error('Push error:', e))
          }

          await supabase.from('housekeeping_requests')
            .update({ 
               eta_reminder_sent: true,
               eta_minutes: 0
            })
            .eq('id', req.id)
        }
      }
    }

    // =========================================================
    // 3. Housekeeping Ratings Push (15 mins after completion)
    // =========================================================
    const { data: completedReqs } = await supabase
      .from('housekeeping_requests')
      .select('*')
      .eq('status', 'completed')
      .eq('rating_pushed', false)
      .lte('completed_at', fifteenMinsAgo)

    if (completedReqs && completedReqs.length > 0) {
      console.log(`Found ${completedReqs.length} requests to push ratings for.`)
      for (const req of completedReqs) {
        const room = req.room_number
        const code = req.code

        if (room && room !== 'Н/Д') {
          const bodyText = `Please rate your recent room cleaning! Your code is: ${code}`
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: room, title: '⭐ Rate Housekeeping', body: bodyText, url: '/GardenInnInfo/?view=housekeeping' })
          }).catch(e => console.error('Push error:', e))
        }

        await supabase.from('housekeeping_requests')
          .update({ rating_pushed: true })
          .eq('id', req.id)
      }
    }

    return new Response('Cron executed successfully', { status: 200 })
  } catch (err) {
    console.error('Error:', err)
    return new Response('Error', { status: 500 })
  }
})

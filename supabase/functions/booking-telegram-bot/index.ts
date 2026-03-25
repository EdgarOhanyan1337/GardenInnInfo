import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('BOOKING_TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Get staff password from DB (reusing the same password as Housekeeping)
async function getStaffPassword(): Promise<string> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'staff_password').single()
  return data?.value || 'gardeninn2026'
}

// Helper: send a Telegram message
async function sendMessage(chatId: string | number, text: string, extra: Record<string, unknown> = {}) {
  await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
  })
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  const body = await req.json()

  // ==========================================
  // 1. Telegram Message from user
  // ==========================================
  if (body.message) {
    const chatId = body.message.chat.id
    const text = (body.message.text || '').trim()
    const firstName = body.message.from?.first_name || 'Staff'
    const username = body.message.from?.username || ''

    // --- /start command ---
    if (text === '/start') {
      const { data: existing } = await supabase
        .from('notification_recipients')
        .select('id')
        .eq('type', 'telegram_booking')
        .eq('value', String(chatId))

      if (existing && existing.length > 0) {
        await sendMessage(chatId,
          `✅ *${firstName}*, вы уже зарегистрированы!\n\n` +
          `Вы будете получать уведомления о бронированиях платных услуг.\n\n` +
          `Команды:\n/status — проверить статус\n/stop — отключить уведомления\n/resume — включить`
        )
      } else {
        await sendMessage(chatId,
          `📅 *Бот для Бронирований Услуг*\n\n` +
          `Добро пожаловать! Для регистрации введите пароль персонала:`
        )
      }
      return new Response('OK', { status: 200 })
    }

    // --- /status command ---
    if (text === '/status') {
      const { data } = await supabase
        .from('notification_recipients')
        .select('*')
        .eq('type', 'telegram_booking')
        .eq('value', String(chatId))

      if (data && data.length > 0) {
        const r = data[0]
        const status = r.enabled ? '🟢 Активно' : '🔴 Отключено'
        await sendMessage(chatId,
          `📊 *Ваш статус:* ${status}\n` +
          `👤 Имя: ${r.label || firstName}\n` +
          (r.username ? `📎 Username: @${r.username}\n` : '') +
          `🆔 Chat ID: \`${chatId}\``
        )
      } else {
        await sendMessage(chatId, `❌ Вы не зарегистрированы. Отправьте /start для регистрации.`)
      }
      return new Response('OK', { status: 200 })
    }

    // --- /stop command ---
    if (text === '/stop') {
      await supabase
        .from('notification_recipients')
        .update({ enabled: false })
        .eq('type', 'telegram_booking')
        .eq('value', String(chatId))

      await sendMessage(chatId,
        `🔴 Уведомления отключены.\n\nЧтобы включить снова, отправьте /resume`
      )
      return new Response('OK', { status: 200 })
    }

    // --- /resume command ---
    if (text === '/resume') {
      const { data: rec } = await supabase
        .from('notification_recipients')
        .select('enabled')
        .eq('type', 'telegram_booking')
        .eq('value', String(chatId))

      if (rec && rec.length > 0 && !rec[0].enabled) {
        await supabase
          .from('notification_recipients')
          .update({ enabled: true })
          .eq('type', 'telegram_booking')
          .eq('value', String(chatId))
        await sendMessage(chatId, `🟢 Уведомления включены! Вы снова будете получать заявки на бронирование.`)
      } else if (rec && rec.length > 0 && rec[0].enabled) {
        await sendMessage(chatId, `✅ Уведомления уже включены.`)
      } else {
        await sendMessage(chatId, `❌ Вы не зарегистрированы. Отправьте /start`)
      }
      return new Response('OK', { status: 200 })
    }

    // --- Password attempt (any other text) ---
    const { data: existing } = await supabase
      .from('notification_recipients')
      .select('id')
      .eq('type', 'telegram_booking')
      .eq('value', String(chatId))

    if (!existing || existing.length === 0) {
      // Get password from DB
      const staffPassword = await getStaffPassword()

      if (text === staffPassword) {
        // Password correct! Register with username
        const { error: insertError } = await supabase
          .from('notification_recipients')
          .insert([{
            type: 'telegram_booking',
            value: String(chatId),
            label: firstName,
            username: username,
            enabled: true
          }])

        if (insertError) {
          console.error('Registration INSERT error:', insertError)
          await sendMessage(chatId, `⚠️ Ошибка регистрации: ${insertError.message}\n\nПопробуйте снова или обратитесь к администратору.`)
        } else {
          await sendMessage(chatId,
            `✅ *Регистрация успешна!*\n\n` +
            `Добро пожаловать, *${firstName}*! 🎉\n` +
            `Теперь вы будете получать уведомления о запросах на бронирование услуг.\n\n` +
            `Команды:\n/status — проверить статус\n/stop — отключить\n/resume — включить`
          )
        }
      } else {
        await sendMessage(chatId, `❌ Неверный пароль. Попробуйте ещё раз.`)
      }
      return new Response('OK', { status: 200 })
    }

    // Already registered, unknown command
    await sendMessage(chatId,
      `📅 *Booking Bot*\n\n` +
      `Команды:\n/status — проверить статус\n/stop — отключить уведомления\n/resume — включить уведомления`
    )
    return new Response('OK', { status: 200 })
  }

  // ==========================================
  // 2. Telegram Callback (staff clicks button)
  // ==========================================
  if (body.callback_query) {
    const callbackData = body.callback_query.data
    const messageId = body.callback_query.message.message_id
    const chatId = body.callback_query.message.chat.id
    const staffName = body.callback_query.from.first_name || 'Staff'

    if (callbackData.startsWith('approve_') || callbackData.startsWith('reject_')) {
      const action = callbackData.startsWith('approve_') ? 'approved' : 'rejected'
      const reqId = action === 'approved' ? callbackData.replace('approve_', '') : callbackData.replace('reject_', '')

      await supabase
        .from('bookings')
        .update({ status: action })
        .eq('id', reqId)

      await fetch(`${TG_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: action === 'approved' ? '✅ Бронирование одобрено!' : '❌ Бронирование отклонено!'
        })
      })

      const statusText = action === 'approved' ? `✅ *Одобрил(а): ${staffName}*` : `❌ *Отклонил(а): ${staffName}*`

      await fetch(`${TG_API}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${body.callback_query.message.text}\n\n${statusText}`,
          parse_mode: 'Markdown'
        })
      })
    }
    return new Response('OK', { status: 200 })
  }

  // ==========================================
  // 3. Database Webhook (INSERT trigger)
  // ==========================================
  if (body.type === 'INSERT' && body.table === 'bookings') {
    const guestName = body.record.guest_name
    const room = body.record.room_number
    const date = body.record.date || 'Без даты'
    const serviceId = body.record.service_id
    const reqId = body.record.id

    // Check service name based on ID
    const { data: service } = await supabase.from('services').select('title_ru, title_en').eq('id', serviceId).single()
    const serviceName = service?.title_ru || service?.title_en || 'Услуга'

    // Load recipients from DB
    const { data: recipients } = await supabase
      .from('notification_recipients')
      .select('value')
      .eq('type', 'telegram_booking')
      .eq('enabled', true)

    const chatIds = recipients?.map((r: { value: string }) => r.value) || []
    
    const message = `📅 *Новое Бронирование*\n\n` +
                    `🛠 Услуга: *${serviceName}*\n` +
                    `👤 Гость: *${guestName}*\n` +
                    `🏠 Номер: *${room}*\n` +
                    `🗓 Дата: *${date}*`

    for (const chatId of chatIds) {
      await sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Одобрить', callback_data: `approve_${reqId}` },
            { text: '❌ Отклонить', callback_data: `reject_${reqId}` }
          ]]
        }
      })
    }
    return new Response('Sent', { status: 200 })
  }

  return new Response('OK', { status: 200 })
})

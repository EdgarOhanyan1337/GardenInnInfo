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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('OK', { status: 200, headers: corsHeaders })
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  try {
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
      return new Response('OK', { status: 200, headers: corsHeaders })
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
      return new Response('OK', { status: 200, headers: corsHeaders })
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
      return new Response('OK', { status: 200, headers: corsHeaders })
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
      return new Response('OK', { status: 200, headers: corsHeaders })
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
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // --- Force reply handling for Rejections ---
    if (body.message.reply_to_message && body.message.reply_to_message.text) {
      const replyText = body.message.reply_to_message.text
      const match = replyText.match(/Напишите причину отказа для брони (.+):/)
      if (match && match[1]) {
        const reqId = match[1]
        const reason = text

        const { data: bData } = await supabase.from('bookings').select('*, services(title_ru, title_en), tours(title_ru, title_en)').eq('id', reqId).single()
        
        await supabase
          .from('bookings')
          .update({ status: 'rejected', reject_reason: reason })
          .eq('id', reqId)

        // Send web push notification to guest about rejection
        if (bData?.room_number) {
          let pushServiceName = 'Booking'
          if (bData.services) {
            pushServiceName = Array.isArray(bData.services) ? bData.services[0]?.title_en : (bData.services?.title_en || 'Service')
          } else if (bData.tours) {
            pushServiceName = Array.isArray(bData.tours) ? bData.tours[0]?.title_en : (bData.tours?.title_en || 'Tour')
          }
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: Number(bData.room_number), title: '❌ Booking Declined', body: `Your booking for "${pushServiceName}" was declined. Reason: ${reason}` })
          }).catch(e => console.error('Push error:', e))
        }

        if (bData) {
            const guestName = bData.guest_name || 'Гость'
            const room = bData.room_number || 'Н/Д'
            const date = bData.date || 'Без даты'
            const timeFrom = bData.time_from || ''
            const timeTo = bData.time_to || ''
            let serviceName = 'Услуга'
            if (bData.services) {
                serviceName = Array.isArray(bData.services) ? bData.services[0]?.title_ru : (bData.services?.title_ru || bData.services?.title_en || 'Услуга')
            } else if (bData.tours) {
                serviceName = Array.isArray(bData.tours) ? bData.tours[0]?.title_ru : (bData.tours?.title_ru || bData.tours?.title_en || 'Тур')
            }
            
            const timeLine = (timeFrom && timeTo) ? `\n🕐 Время: *${timeFrom} — ${timeTo}*` : ''
            const baseMessage = `📅 *Бронирование (ОТКЛОНЕНО)*\n\n` +
                    `🛠 Услуга: *${serviceName}*\n` +
                    `👤 Гость: *${guestName}*\n` +
                    `🏠 Номер: *${room}*\n` +
                    `🗓 Дата: *${date}*${timeLine}`

            const statusText = `❌ *Отклонил(а): ${firstName}*\n📝 Причина: ${reason}`

            if (bData.tg_messages && Array.isArray(bData.tg_messages)) {
              for (const msg of bData.tg_messages) {
                 await fetch(`${TG_API}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: msg.chat_id,
                      message_id: msg.message_id,
                      text: `${baseMessage}\n\n${statusText}`,
                      parse_mode: 'Markdown',
                      reply_markup: { inline_keyboard: [] }
                    })
                 })
              }
            }
        }
        await sendMessage(chatId, `✅ Причина отказа отправлена гостю.`)
        return new Response('OK', { status: 200, headers: corsHeaders })
      }
    }

    // Already registered, unknown command
    await sendMessage(chatId,
      `📅 *Booking Bot*\n\n` +
      `Команды:\n/status — проверить статус\n/stop — отключить уведомления\n/resume — включить уведомления`
    )
    return new Response('OK', { status: 200, headers: corsHeaders })
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

      if (action === 'approved') {
        const { data: bData } = await supabase.from('bookings').select('*, services(title_ru, title_en), tours(title_ru, title_en)').eq('id', reqId).single()
        
        await supabase
          .from('bookings')
          .update({ status: 'approved' })
          .eq('id', reqId)

        // Send web push notification to guest
        if (bData?.room_number) {
          let pushServiceName = 'Booking'
          if (bData.services) {
            pushServiceName = Array.isArray(bData.services) ? bData.services[0]?.title_en : (bData.services?.title_en || 'Service')
          } else if (bData.tours) {
            pushServiceName = Array.isArray(bData.tours) ? bData.tours[0]?.title_en : (bData.tours?.title_en || 'Tour')
          }
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: Number(bData.room_number), title: '✅ Booking Approved', body: `Your booking for "${pushServiceName}" has been approved!` })
          }).catch(e => console.error('Push error:', e))
        }

        await fetch(`${TG_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: '✅ Бронирование одобрено!'
          })
        })

        const statusText = `✅ *Одобрил(а): ${staffName}*`
        
        if (bData) {
          const guestName = bData.guest_name || 'Гость'
          const room = bData.room_number || 'Н/Д'
          const date = bData.date || 'Без даты'
          const timeFrom = bData.time_from || ''
          const timeTo = bData.time_to || ''
          let serviceName = 'Услуга'
          if (bData.services) {
              serviceName = Array.isArray(bData.services) ? bData.services[0]?.title_ru : (bData.services?.title_ru || bData.services?.title_en || 'Услуга')
          } else if (bData.tours) {
              serviceName = Array.isArray(bData.tours) ? bData.tours[0]?.title_ru : (bData.tours?.title_ru || bData.tours?.title_en || 'Тур')
          }
          
          const timeLine = (timeFrom && timeTo) ? `\n🕐 Время: *${timeFrom} — ${timeTo}*` : ''
          const baseMessage = `📅 *Бронирование*\n\n` +
                  `🛠 Услуга: *${serviceName}*\n` +
                  `👤 Гость: *${guestName}*\n` +
                  `🏠 Номер: *${room}*\n` +
                  `🗓 Дата: *${date}*${timeLine}`
                  
          if (bData.tg_messages && Array.isArray(bData.tg_messages)) {
            for (const msg of bData.tg_messages) {
               await fetch(`${TG_API}/editMessageText`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: msg.chat_id,
                    message_id: msg.message_id,
                    text: `${baseMessage}\n\n${statusText}`,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [] }
                  })
               })
            }
          }
        }
      } else {
        // reject action -> asking for reason
        await fetch(`${TG_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: 'Пожалуйста, укажите причину отказа'
          })
        })

        await sendMessage(chatId, `Напишите причину отказа для брони ${reqId}:`, {
          reply_markup: { force_reply: true, selective: true }
        })
      }
    }
    return new Response('OK', { status: 200, headers: corsHeaders })
  }

  // ==========================================
  // 3. Database Webhook (INSERT trigger)
  // ==========================================
  if (body.type === 'INSERT' && body.table === 'bookings') {
    const guestName = body.record.guest_name
    const room = body.record.room_number
    const date = body.record.date || 'Без даты'
    const timeFrom = body.record.time_from || ''
    const timeTo = body.record.time_to || ''
    const serviceId = body.record.service_id
    const tourId = body.record.tour_id
    const reqId = body.record.id

    // Dedup: check if notifications were already sent for this booking
    const { data: existingBooking } = await supabase.from('bookings').select('tg_messages').eq('id', reqId).single()
    if (existingBooking && existingBooking.tg_messages && Array.isArray(existingBooking.tg_messages) && existingBooking.tg_messages.length > 0) {
      return new Response('Already notified', { status: 200, headers: corsHeaders })
    }

    // Check service name based on ID
    let serviceName = 'Услуга'
    if (serviceId) {
        const { data: service } = await supabase.from('services').select('title_ru, title_en').eq('id', serviceId).single()
        serviceName = service?.title_ru || service?.title_en || 'Услуга'
    } else if (tourId) {
        const { data: tour } = await supabase.from('tours').select('title_ru, title_en').eq('id', tourId).single()
        serviceName = tour?.title_ru || tour?.title_en || 'Тур'
    }

    // Load recipients from DB
    const { data: recipients } = await supabase
      .from('notification_recipients')
      .select('value')
      .eq('type', 'telegram_booking')
      .eq('enabled', true)

    const chatIds = recipients?.map((r: { value: string }) => r.value) || []
    
    const timeLine = (timeFrom && timeTo) ? `\n🕐 Время: *${timeFrom} — ${timeTo}*` : ''
    const message = `📅 *Новое Бронирование*\n\n` +
                    `🛠 Услуга: *${serviceName}*\n` +
                    `👤 Гость: *${guestName}*\n` +
                    `🏠 Номер: *${room}*\n` +
                    `🗓 Дата: *${date}*${timeLine}`

    const tgMessages = []
    for (const chatId of chatIds) {
      const resp = await sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Одобрить', callback_data: `approve_${reqId}` },
            { text: '❌ Отклонить', callback_data: `reject_${reqId}` }
          ]]
        }
      })
      if (resp && resp.ok && resp.result) {
        tgMessages.push({ chat_id: chatId, message_id: resp.result.message_id })
      }
    }
    
    if (tgMessages.length > 0) {
      await supabase.from('bookings').update({ tg_messages: tgMessages }).eq('id', reqId)
    }
    return new Response('Sent', { status: 200, headers: corsHeaders })
  }

  return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error("Fatal error inside booking function:", err)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})

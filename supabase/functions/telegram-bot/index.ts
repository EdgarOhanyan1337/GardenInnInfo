import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Get staff password from DB
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
          .eq('type', 'telegram')
          .eq('value', String(chatId))

        if (existing && existing.length > 0) {
          await sendMessage(chatId,
            `✅ *${firstName}*, вы уже зарегистрированы!\n\n` +
            `Вы будете получать уведомления о заявках на уборку.\n\n` +
            `Команды:\n/status — проверить статус`
          )
        } else {
          await sendMessage(chatId,
            `🌿 *Garden Inn Resort*\n\n` +
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
          .eq('type', 'telegram')
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

      // /stop and /resume are disabled for staff
      if (text === '/stop' || text === '/resume') {
        await sendMessage(chatId, `ℹ️ Эта команда недоступна. Уведомления всегда активны для персонала.`)
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      // --- Password attempt (any other text) ---
      const { data: existing } = await supabase
        .from('notification_recipients')
        .select('id')
        .eq('type', 'telegram')
        .eq('value', String(chatId))

      if (!existing || existing.length === 0) {
        // Get password from DB
        const staffPassword = await getStaffPassword()

        if (text === staffPassword) {
          // Password correct! Register with username
          const { error: insertError } = await supabase
            .from('notification_recipients')
            .insert([{
              type: 'telegram',
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
              `Теперь вы будете получать уведомления о заявках на уборку.\n\n` +
              `Команды:\n/status — проверить статус`
            )
          }
        } else {
          await sendMessage(chatId, `❌ Неверный пароль. Попробуйте ещё раз.`)
        }
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      // Already registered, unknown command
      await sendMessage(chatId,
        `🌿 *Garden Inn Bot*\n\n` +
        `Команды:\n/status — проверить статус`
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

      if (callbackData.startsWith('accept_')) {
        const reqId = callbackData.replace('accept_', '')

        const { data: bData } = await supabase.from('housekeeping_requests').select('tg_messages, room_number').eq('id', reqId).single()

        await supabase
          .from('housekeeping_requests')
          .update({
            status: 'accepted',
            accepted_by: staffName,
            accepted_at: new Date().toISOString()
          })
          .eq('id', reqId)

        await fetch(`${TG_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: 'Вы приняли заявку!'
          })
        })

        const room = bData?.room_number || 'Н/Д'
        const statusText = `✅ *Принял(а): ${staffName}*`

        if (room !== 'Н/Д') {
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: room, title: '🧹 Housekeeping', body: 'Staff has accepted your request and is on the way.', url: '/GardenInnInfo/?view=housekeeping' })
          }).then(r => r.text()).then(t => console.log('Push response:', t)).catch(e => console.error('Push error:', e))
        }

        if (bData && bData.tg_messages && Array.isArray(bData.tg_messages)) {
          for (const msg of bData.tg_messages) {
            const isAccepter = String(msg.chat_id) === String(chatId)
            await fetch(`${TG_API}/editMessageText`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat_id,
                message_id: msg.message_id,
                text: `🧹 *Заявка на уборку*\n🏠 Room: *${room}*\n\n${statusText}`,
                parse_mode: 'Markdown',
                reply_markup: isAccepter ? { inline_keyboard: [
                  [ { text: '🚶 Иду', callback_data: `eta_0_${reqId}` }, { text: '⏱ 15 мин', callback_data: `eta_15_${reqId}` }, { text: '⏱ 30 мин', callback_data: `eta_30_${reqId}` } ],
                  [ { text: '🏁 Закончить уборку', callback_data: `finish_${reqId}` } ]
                ] } : { inline_keyboard: [] }
              })
            })
          }
        } else {
          await fetch(`${TG_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: `🧹 *Заявка на уборку*\n✅ *Принял(а): ${staffName}*`,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [
                  [ { text: '🚶 Иду', callback_data: `eta_0_${reqId}` }, { text: '⏱ 15 мин', callback_data: `eta_15_${reqId}` }, { text: '⏱ 30 мин', callback_data: `eta_30_${reqId}` } ],
                  [ { text: '🏁 Закончить уборку', callback_data: `finish_${reqId}` } ]
                ] }
            })
          })
        }
      } else if (callbackData.startsWith('eta_')) {
        // ETA response: eta_0_reqId, eta_15_reqId, eta_30_reqId
        const parts = callbackData.split('_')
        const etaMinutes = parseInt(parts[1])
        const reqId = parts.slice(2).join('_')

        const { data: bData } = await supabase.from('housekeeping_requests').select('tg_messages, room_number').eq('id', reqId).single()

        await supabase.from('housekeeping_requests').update({
          status: 'accepted',
          accepted_by: staffName,
          accepted_at: new Date().toISOString(),
          eta_minutes: etaMinutes,
          eta_set_at: new Date().toISOString()
        }).eq('id', reqId)

        const etaText = etaMinutes === 0 ? 'Уже идёт!' : `~${etaMinutes} мин`

        await fetch(`${TG_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: body.callback_query.id, text: `ETA: ${etaText}` })
        })

        const room = bData?.room_number || 'Н/Д'
        const pushBody = etaMinutes === 0 
          ? 'Staff has accepted your request and is on the way right now!' 
          : `Staff has accepted your request and will arrive in approximately ${etaMinutes} minutes.`

        if (room !== 'Н/Д') {
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: room, title: '🧹 Housekeeping', body: pushBody, url: '/GardenInnInfo/?view=housekeeping' })
          }).catch(e => console.error('Push error:', e))
        }

        const statusText = `✅ *Принял(а): ${staffName}*\n⏱ ETA: ${etaText}`
        
        if (bData && bData.tg_messages && Array.isArray(bData.tg_messages)) {
          for (const msg of bData.tg_messages) {
            const isAccepter = String(msg.chat_id) === String(chatId)
            await fetch(`${TG_API}/editMessageText`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat_id,
                message_id: msg.message_id,
                text: `🧹 *Заявка на уборку*\n🏠 Room: *${room}*\n\n${statusText}`,
                parse_mode: 'Markdown',
                reply_markup: isAccepter ? { inline_keyboard: [[ { text: '🏁 Закончить уборку', callback_data: `finish_${reqId}` } ]] } : { inline_keyboard: [] }
              })
            })
          }
        } else {
          await fetch(`${TG_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: `🧹 *Заявка на уборку*\n🏠 Room: *${room}*\n\n${statusText}`,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [[ { text: '🏁 Закончить уборку', callback_data: `finish_${reqId}` } ]] }
            })
          })
        }

      } else if (callbackData.startsWith('finish_')) {
        const reqId = callbackData.replace('finish_', '')

        const { data: bData } = await supabase.from('housekeeping_requests').select('tg_messages, room_number').eq('id', reqId).single()

        await supabase
          .from('housekeeping_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', reqId)

        await fetch(`${TG_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: 'Уборка завершена!'
          })
        })

        const room = bData?.room_number || 'Н/Д'
        const statusText = `🏁 *Уборка завершена* (${staffName})`

        if (room !== 'Н/Д') {
          await fetch(`${SUPABASE_URL}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({ room_number: room, title: '✨ Housekeeping', body: 'Cleaning is complete! Enjoy your stay.', url: '/GardenInnInfo/?view=housekeeping' })
          }).then(r => r.text()).then(t => console.log('Push response:', t)).catch(e => console.error('Push error:', e))
        }

        if (bData && bData.tg_messages && Array.isArray(bData.tg_messages)) {
          for (const msg of bData.tg_messages) {
            await fetch(`${TG_API}/editMessageText`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat_id,
                message_id: msg.message_id,
                text: `🧹 *Заявка на уборку*\n🏠 Room: *${room}*\n\n${statusText}`,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [] }
              })
            })
          }
        } else {
          await fetch(`${TG_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: `🧹 *Заявка на уборку*\n🏠 Room: *${room}*\n\n${statusText}`,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [] }
            })
          })
        }
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // ==========================================
    // 3. Database Webhook (INSERT trigger)
    // ==========================================
    if ((body.type === 'INSERT' || body.type === 'FRONTEND_INSERT') && body.table === 'housekeeping_requests') {
      if (body.type === 'INSERT') {
        // Delay webhook to prevent double notifications race condition
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const room = body.record.room_number
      const reqId = body.record.id

      // Dedup: check if notifications were already sent for this request
      const { data: existingReq } = await supabase.from('housekeeping_requests').select('tg_messages').eq('id', reqId).single()
      if (existingReq && existingReq.tg_messages && Array.isArray(existingReq.tg_messages) && existingReq.tg_messages.length > 0) {
        return new Response('Already notified', { status: 200, headers: corsHeaders })
      }

      // Load recipients from DB
      const { data: recipients } = await supabase
        .from('notification_recipients')
        .select('value')
        .eq('type', 'telegram')
        .eq('enabled', true)

      const chatIds = recipients?.map((r: { value: string }) => r.value) || []
      const message = `🧹 *Housekeeping Requested*\n🏠 Room: *${room}*`

      const tgMessages = []
      for (const chatId of chatIds) {
        const resp = await sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [ { text: '🚶 Иду (Сейчас)', callback_data: `eta_0_${reqId}` } ],
              [ { text: '⏱ 15 мин', callback_data: `eta_15_${reqId}` }, { text: '⏱ 30 мин', callback_data: `eta_30_${reqId}` } ]
            ]
          }
        })
        if (resp && resp.ok && resp.result) {
          tgMessages.push({ chat_id: chatId, message_id: resp.result.message_id })
        }
      }

      if (tgMessages.length > 0) {
        await supabase.from('housekeeping_requests').update({ tg_messages: tgMessages }).eq('id', reqId)
      }
      return new Response('Sent', { status: 200, headers: corsHeaders })
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error("Fatal error inside function:", err)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})

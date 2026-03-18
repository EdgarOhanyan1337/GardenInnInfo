import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()

    // ==========================================
    // 1. Telegram Callback (staff clicks button)
    // ==========================================
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const messageId = body.callback_query.message.message_id
      const chatId = body.callback_query.message.chat.id
      const staffName = body.callback_query.from.first_name || 'Staff'

      if (callbackData.startsWith('accept_')) {
        const reqId = callbackData.replace('accept_', '')

        // Update status in DB to 'accepted'
        await supabase
          .from('housekeeping_requests')
          .update({ status: 'accepted' })
          .eq('id', reqId)

        // Answer the callback query
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: 'You accepted the request!'
          })
        })

        // Edit the original message to show it was accepted
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: `🧹 *Housekeeping Request*\n✅ *Accepted by ${staffName}*`,
            parse_mode: 'Markdown'
          })
        })
      }
      return new Response('OK', { status: 200 })
    }

    // ==========================================
    // 2. Database Webhook (INSERT trigger)
    // ==========================================
    if (body.type === 'INSERT' && body.table === 'housekeeping_requests') {
      const room = body.record.room_number
      const code = body.record.code
      const reqId = body.record.id
      const CHAT_IDS = (Deno.env.get('TELEGRAM_CHAT_IDS') || Deno.env.get('TELEGRAM_CHAT_ID') || '').split(',').map(id => id.trim()).filter(id => id)

      const message = `🧹 *Housekeeping Requested*\n🏠 Room: *${room}*\n🔑 Code: \`${code}\``
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

      for (const chatId of CHAT_IDS) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ I am coming', callback_data: `accept_${reqId}` }
              ]]
            }
          })
        })
      }
      return new Response('Sent', { status: 200 })
    }
  }

  return new Response('OK', { status: 200 })
})

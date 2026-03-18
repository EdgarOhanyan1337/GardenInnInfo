import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
// Support multiple chat IDs separated by comma (e.g., "123456,789012,456789")
const CHAT_IDS = Deno.env.get('TELEGRAM_CHAT_IDS') || Deno.env.get('TELEGRAM_CHAT_ID') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

serve(async (req) => {
  if (req.method === 'POST') {
    const body = await req.json()

    // 1. Handling Database Webhook (New Housekeeping Request)
    if (body.type === 'INSERT' && body.table === 'housekeeping_requests') {
      const room = body.record.room_number
      const reqId = body.record.id

      const message = `🧹 *Housekeeping Requested*\nRoom: ${room}`
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

      // Send to all chat IDs (comma-separated)
      const chatIdList = CHAT_IDS.split(',').map(id => id.trim()).filter(id => id)

      for (const chatId of chatIdList) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ I am going', callback_data: `accept_${reqId}` }
              ]]
            }
          })
        })
      }
      return new Response('Notification sent', { status: 200 })
    }

    // 2. Handling Telegram Webhook (Inline Button Click)
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const messageId = body.callback_query.message.message_id
      const chatId = body.callback_query.message.chat.id

      if (callbackData.startsWith('accept_')) {
        const reqId = callbackData.split('_')[1]

        // Update DB
        if (supabase) {
          await supabase
            .from('housekeeping_requests')
            .update({ status: 'accepted' })
            .eq('id', reqId)
        }

        // Answer Callback
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: 'Request accepted!'
          })
        })

        // Edit Message
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: `🧹 *Housekeeping Requested*\nRoom: Checked in System\n✅ Accepted by staff`,
            parse_mode: 'Markdown'
          })
        })
      }
      return new Response('Callback processed', { status: 200 })
    }
  }
  return new Response('Ok', { status: 200 })
})

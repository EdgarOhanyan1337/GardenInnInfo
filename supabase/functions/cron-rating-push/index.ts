import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async () => {
  try {
    console.log("Checking for 15-minute housekeeping rating pushes...")

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString()

    const { data: requests, error } = await supabase
      .from('housekeeping_requests')
      .select('*')
      .eq('status', 'completed')
      .eq('rating_pushed', false)
      .lte('completed_at', fifteenMinsAgo)

    if (error) throw error

    if (!requests || requests.length === 0) {
      return new Response('No pushes needed', { status: 200 })
    }

    console.log(`Found ${requests.length} requests to push ratings for.`)

    for (const req of requests) {
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

    return new Response('Processed ' + requests.length, { status: 200 })
  } catch (err) {
    console.error('Error:', err)
    return new Response('Error', { status: 500 })
  }
})

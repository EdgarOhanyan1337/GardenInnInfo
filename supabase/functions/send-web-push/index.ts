import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const VAPID_PUB = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIV = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@gardeninnresort.com'

// Make sure keys exist before config
if (VAPID_PUB && VAPID_PRIV) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUB,
    VAPID_PRIV
  )
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!VAPID_PUB || !VAPID_PRIV) {
        return new Response(JSON.stringify({ error: 'Missing VAPID keys in environment' }), { status: 500, headers: corsHeaders })
    }

    const { room_number, title, body, url } = await req.json()

    if (!room_number || !title) {
        return new Response('Missing room_number or title', { status: 400, headers: corsHeaders })
    }

    // Get all subscriptions for this room
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('room_number', String(room_number))

    if (subsError) {
        console.error("fetch error:", subsError)
        return new Response(JSON.stringify({ error: subsError.message }), { status: 500, headers: corsHeaders })
    }

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found for room' }), { status: 200, headers: corsHeaders })
    }

    const payload = JSON.stringify({
      title: title,
      body: body || '',
      url: url || '/'
    })

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, payload))
    )

    // Handle expired/invalid subscriptions
    const expiredSubs = results.map((result, index) => {
      if (result.status === 'rejected' && (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)) {
        return subs[index].subscription
      }
      return null
    }).filter(Boolean)

    if (expiredSubs.length > 0) {
       for (const exp of expiredSubs) {
           await supabase.from('push_subscriptions')
               .delete()
               .eq('room_number', String(room_number))
               .contains('subscription', exp)
       }
       console.log(`Cleaned up ${expiredSubs.length} expired subscriptions.`)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

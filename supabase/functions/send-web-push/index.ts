import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const VAPID_PUB = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIV = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!VAPID_PUB || !VAPID_PRIV) {
      console.error("Missing VAPID keys")
      return new Response(JSON.stringify({ error: "Missing VAPID keys in environment" }), { status: 500, headers: corsHeaders })
    }

    webpush.setVapidDetails(
      'mailto:admin@gardeninn.com',
      VAPID_PUB,
      VAPID_PRIV
    )

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

    const bodyObj = await req.json()
    const { room_number, title, body, url } = bodyObj

    if (!room_number) {
      return new Response(JSON.stringify({ error: 'room_number is required' }), { status: 400, headers: corsHeaders })
    }

    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('room_number', String(room_number))

    if (subsError) {
      return new Response(JSON.stringify({ error: subsError.message }), { status: 500, headers: corsHeaders })
    }

    if (!subs || subs.length === 0) {
      console.log('PUSH: no subscriptions found for room', room_number)
      return new Response(JSON.stringify({ message: 'No subscriptions found for room' }), { status: 200, headers: corsHeaders })
    }

    console.log(`PUSH: found ${subs.length} subscriptions for room ${room_number}`)

    const payload = JSON.stringify({
      title: title,
      body: body || '',
      url: url || '/'
    })

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, payload))
    )

    console.log('PUSH: results:', JSON.stringify(results.map((r: any) => r.status === 'fulfilled' ? 'success' : r.reason?.statusCode || r.reason)))

    // Handle expired/invalid subscriptions
    const expiredSubs: any[] = []
    results.forEach((result: any, index) => {
      if (result.status === 'rejected') {
        const code = result.reason?.statusCode
        if (code === 410 || code === 404) {
          expiredSubs.push(subs[index].subscription)
        }
      }
    })

    if (expiredSubs.length > 0) {
      for (const exp of expiredSubs) {
         await supabase.from('push_subscriptions')
           .delete()
           .eq('room_number', String(room_number))
           .contains('subscription', exp)
      }
      console.log(`Cleaned up ${expiredSubs.length} expired subscriptions.`)
    }

    return new Response(JSON.stringify({ success: true, expired: expiredSubs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('PUSH EXCEPTION:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

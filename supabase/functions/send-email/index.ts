import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configure your SMTP / email provider here
// For production, use Resend, SendGrid, or Brevo API key
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@gardeninnresort.com'

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { to, subject, body } = await req.json()

    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Send via Resend API (https://resend.com)
    // Replace with your preferred email provider if needed
    if (RESEND_API_KEY) {
      const results = []
      for (const recipient of to) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [recipient],
            subject: subject || 'Garden Inn Resort Notification',
            text: body || ''
          })
        })
        const data = await res.json()
        results.push({ recipient, status: res.ok ? 'sent' : 'failed', data })
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // If no API key configured, log and return info
    console.log('Email notification (no provider configured):', { to, subject, body })
    return new Response(JSON.stringify({
      success: false,
      message: 'Email provider not configured. Set RESEND_API_KEY environment variable.',
      wouldSendTo: to,
      subject
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})

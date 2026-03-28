import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const VAPID_PUB = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIV = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@gardeninnresort.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

// ==================== Deno-native Web Push Implementation ====================

function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const pubBytes = base64UrlDecode(publicKeyB64);
  const privBytes = base64UrlDecode(privateKeyB64);

  const publicKey = await crypto.subtle.importKey(
    'raw',
    pubBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    await buildPkcs8(privBytes, pubBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );

  return { publicKey, privateKey, publicKeyBytes: pubBytes };
}

async function buildPkcs8(privateKeyRaw: Uint8Array, publicKeyRaw: Uint8Array): Promise<ArrayBuffer> {
  // Build PKCS#8 wrapper for a raw 32-byte EC private key
  // This is the ASN.1 DER encoding for PKCS#8 with P-256
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20
  ]);

  const pkcs8Mid = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00
  ]);

  const result = new Uint8Array(pkcs8Header.length + privateKeyRaw.length + pkcs8Mid.length + publicKeyRaw.length);
  result.set(pkcs8Header, 0);
  result.set(privateKeyRaw, pkcs8Header.length);
  result.set(pkcs8Mid, pkcs8Header.length + privateKeyRaw.length);
  result.set(publicKeyRaw, pkcs8Header.length + privateKeyRaw.length + pkcs8Mid.length);

  return result.buffer;
}

async function createVapidJwt(audience: string, subject: string, publicKey: Uint8Array, privateKey: CryptoKey): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;

  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER encoded - parse it
    rawSig = derToRaw(sigBytes);
  }

  const sigB64 = base64UrlEncode(rawSig);
  return `${unsignedToken}.${sigB64}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // Parse DER SEQUENCE containing two INTEGERs
  const raw = new Uint8Array(64);

  let offset = 2; // skip SEQUENCE tag and length
  if (der[1] & 0x80) offset += (der[1] & 0x7f);

  // First INTEGER (r)
  offset++; // skip INTEGER tag (0x02)
  let rLen = der[offset++];
  if (rLen & 0x80) {
    const numBytes = rLen & 0x7f;
    rLen = 0;
    for (let i = 0; i < numBytes; i++) rLen = (rLen << 8) | der[offset++];
  }
  const rStart = offset;
  offset += rLen;

  // Second INTEGER (s)
  offset++; // skip INTEGER tag (0x02)
  let sLen = der[offset++];
  if (sLen & 0x80) {
    const numBytes = sLen & 0x7f;
    sLen = 0;
    for (let i = 0; i < numBytes; i++) sLen = (sLen << 8) | der[offset++];
  }
  const sStart = offset;

  // Copy r (right-aligned to 32 bytes)
  const rBytes = der.slice(rStart, rStart + rLen);
  if (rBytes.length <= 32) {
    raw.set(rBytes, 32 - rBytes.length);
  } else {
    raw.set(rBytes.slice(rBytes.length - 32), 0);
  }

  // Copy s (right-aligned to 32 bytes)
  const sBytes = der.slice(sStart, sStart + sLen);
  if (sBytes.length <= 32) {
    raw.set(sBytes, 64 - sBytes.length);
  } else {
    raw.set(sBytes.slice(sBytes.length - 32), 32);
  }

  return raw;
}

async function encryptPayload(subscription: any, payload: string) {
  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Get the subscription's public key
  const clientPubKeyBytes = base64UrlDecode(subscription.keys.p256dh);
  const clientAuthBytes = base64UrlDecode(subscription.keys.auth);

  const clientPubKey = await crypto.subtle.importKey(
    'raw',
    clientPubKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPubKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPubKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPubKeyBytes = new Uint8Array(localPubKeyRaw);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF-based key derivation (RFC 8291)
  const encoder = new TextEncoder();

  // PRK = HMAC-SHA-256(auth, shared_secret)
  const authKey = await crypto.subtle.importKey('raw', clientAuthBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', authKey, sharedSecret));

  // Info for Content-Encryption-Key
  const cekInfo = createInfo(encoder.encode('Content-Encoding: aes128gcm\0'), clientPubKeyBytes, localPubKeyBytes);
  const cek = await hkdfExpand(prk, salt, cekInfo, 16);

  // Info for nonce
  const nonceInfo = createInfo(encoder.encode('Content-Encoding: nonce\0'), clientPubKeyBytes, localPubKeyBytes);
  const nonce = await hkdfExpand(prk, salt, nonceInfo, 12);

  // Encrypt with AES-128-GCM
  const payloadBytes = encoder.encode(payload);
  // Add padding delimiter
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // padding delimiter

  const encKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    encKey,
    paddedPayload
  );

  // Build aes128gcm content coding header
  const recordSize = new Uint8Array(4);
  const rs = paddedPayload.length + 16 + 1; // plaintext + tag + delimiter overhead
  new DataView(recordSize.buffer).setUint32(0, 4096);

  const header = new Uint8Array(salt.length + 4 + 1 + localPubKeyBytes.length);
  header.set(salt, 0);
  header.set(recordSize, salt.length);
  header[salt.length + 4] = localPubKeyBytes.length;
  header.set(localPubKeyBytes, salt.length + 5);

  const body = new Uint8Array(header.length + encrypted.byteLength);
  body.set(header, 0);
  body.set(new Uint8Array(encrypted), header.length);

  return body;
}

function createInfo(type: Uint8Array, clientPubKey: Uint8Array, serverPubKey: Uint8Array): Uint8Array {
  const result = new Uint8Array(type.length + 1 + 2 + clientPubKey.length + 2 + serverPubKey.length);
  let offset = 0;
  result.set(type, offset); offset += type.length;
  result[offset++] = 0; // null separator already in type

  // Client public key length + key  
  result[offset++] = 0;
  result[offset++] = clientPubKey.length;
  result.set(clientPubKey, offset); offset += clientPubKey.length;

  // Server public key length + key
  result[offset++] = 0;
  result[offset++] = serverPubKey.length;
  result.set(serverPubKey, offset);

  return result.slice(0, offset + serverPubKey.length);
}

async function hkdfExpand(prk: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  // Extract
  const saltKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const extractedPrk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, prk));

  // Expand
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info, 0);
  infoWithCounter[info.length] = 1;

  const expandKey = await crypto.subtle.importKey('raw', extractedPrk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expanded = new Uint8Array(await crypto.subtle.sign('HMAC', expandKey, infoWithCounter));

  return expanded.slice(0, length);
}

async function sendPushNotification(subscription: any, payload: string, vapidPublicKey: Uint8Array, vapidPrivateKey: CryptoKey): Promise<{success: boolean, statusCode?: number, error?: string}> {
  try {
    const endpoint = subscription.endpoint;
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Create VAPID JWT
    const jwt = await createVapidJwt(audience, VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);
    const vapidPubB64 = base64UrlEncode(vapidPublicKey);

    // Encrypt payload
    const encryptedBody = await encryptPayload(subscription, payload);

    // Send push
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPubB64}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: encryptedBody,
    });

    console.log('PUSH: response status:', response.status, 'endpoint:', endpoint.substring(0, 80))
    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    } else {
      const text = await response.text().catch(() => '');
      console.log('PUSH: error response body:', text)
      return { success: false, statusCode: response.status, error: text };
    }
  } catch (err) {
    console.error('PUSH: exception:', err)
    return { success: false, error: err.message };
  }
}

// ==================== Main Handler ====================

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

    // Import VAPID keys
    const { publicKey, privateKey, publicKeyBytes } = await importVapidKeys(VAPID_PUB, VAPID_PRIV);

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
      console.log('PUSH: no subscriptions found for room', room_number)
      return new Response(JSON.stringify({ message: 'No subscriptions found for room' }), { status: 200, headers: corsHeaders })
    }

    console.log('PUSH: found', subs.length, 'subscriptions for room', room_number)
    for (const s of subs) {
      console.log('PUSH: sub endpoint:', s.subscription?.endpoint?.substring(0, 80), 'has keys:', !!s.subscription?.keys)
    }

    const payload = JSON.stringify({
      title: title,
      body: body || '',
      url: url || '/'
    })

    const results = await Promise.allSettled(
      subs.map((s) => sendPushNotification(s.subscription, payload, publicKeyBytes, privateKey))
    )
    console.log('PUSH: results:', JSON.stringify(results))

    // Handle expired/invalid subscriptions
    const expiredSubs: any[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        const code = result.value.statusCode
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

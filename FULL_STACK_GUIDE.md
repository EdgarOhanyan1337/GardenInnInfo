# 🔥 GARDEN INN RESORT: FULL-STACK UPGRADE GUIDE

## 1. ✅ ARCHITECTURE OVERVIEW

Your application will transition from a static site to a Serverless Full-Stack Application:
- **Frontend**: Remains on GitHub Pages (HTML/CSS/JS).
- **Backend/Database**: Supabase (PostgreSQL + REST API). No traditional server needed.
- **Admin Panel**: A standalone secure page connected directly to Supabase.
- **Housekeeping/Telegram**: A Supabase Edge Function (Node.js/Deno) triggered automatically when a request is saved in the database, sending a message to Telegram.

## 2. ✅ TECH STACK (WITH REASONING)

- **Frontend**: Vanilla HTML/JS (Keeps it simple, performant, and perfectly compatible with your current setup).
- **Backend & DB**: Supabase. It provides instant REST APIs for your tables, built-in Authentication for the Admin panel, and Edge Functions for the Telegram Bot. This is the best serverless solution because it's virtually free for small-to-medium traffic and requires NO server maintenance.
- **Telegram Bot API**: Sent via Supabase Edge Functions. Reliable and executes instantly without managing a long-running Node.js process.

## 3. ✅ STEP-BY-STEP SETUP GUIDE

### Step A: Supabase Setup
1. Go to [Supabase](https://supabase.com) and create a free account.
2. Click **New Project** and name it "GardenInnInfo".
3. Wait for the database to provision (takes ~2 mins).
4. Go to **Project Settings -> API**. You will need the **Project URL** and the **anon `public` key**.

### Step B: Telegram Bot Setup
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, name it "Garden Inn Bot", and choose a username (e.g., `garden_inn_bot`).
3. BotFather will give you a **Bot Token** (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`). Save this.
4. Send a message to your new bot.
5. Get your Chat ID by visiting: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. Look for `"chat": {"id": 123456789}`. Save this **Chat ID**.

## 4. ✅ DATABASE (SQL + EXPLANATION)

In your Supabase Dashboard, go to **SQL Editor**, paste the following, and click **Run**.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Minibar Items
create table minibar_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price integer not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Services
create table services (
  id uuid default uuid_generate_v4() primary key,
  service_key text unique not null,
  title text not null,
  description text not null,
  status_type text not null, -- 'free' or 'paid'
  icon text not null,
  images jsonb default '[]'::jsonb
);

-- 3. Tours
create table tours (
  id uuid default uuid_generate_v4() primary key,
  tour_key text unique not null,
  title text not null,
  description text not null,
  price text not null,
  icon text not null,
  images jsonb default '[]'::jsonb
);

-- 4. Rules
create table rules (
  id uuid default uuid_generate_v4() primary key,
  icon text not null,
  text text not null
);

-- 5. Housekeeping Requests
create table housekeeping_requests (
  id uuid default uuid_generate_v4() primary key,
  room_number text not null,
  status text default 'pending', -- pending, accepted, completed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Housekeeping Ratings
create table housekeeping_ratings (
  id uuid default uuid_generate_v4() primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) - Allow public read access to content, but require admin to write
alter table minibar_items enable row level security;
alter table services enable row level security;
alter table tours enable row level security;
alter table rules enable row level security;
alter table housekeeping_requests enable row level security;
alter table housekeeping_ratings enable row level security;

-- Create Policies for Guests (Select/Insert only)
create policy "Public read access" on minibar_items for select using (true);
create policy "Public read access" on services for select using (true);
create policy "Public read access" on tours for select using (true);
create policy "Public read access" on rules for select using (true);

-- Guests can create requests and ratings, but not read all of them
create policy "Public insert access" on housekeeping_requests for insert with check (true);
create policy "Public insert access" on housekeeping_ratings for insert with check (true);

-- Allow authenticated admins to do everything
create policy "Admin all access" on minibar_items for all to authenticated using (true) with check (true);
create policy "Admin all access" on services for all to authenticated using (true) with check (true);
create policy "Admin all access" on tours for all to authenticated using (true) with check (true);
create policy "Admin all access" on rules for all to authenticated using (true) with check (true);
create policy "Admin all access" on housekeeping_requests for all to authenticated using (true) with check (true);
create policy "Admin all access" on housekeeping_ratings for all to authenticated using (true) with check (true);

-- Insert example data for testing
INSERT INTO minibar_items (name, price, image_url) VALUES ('Lays Classic', 2500, 'assets/lays-classic.png');
INSERT INTO minibar_items (name, price, image_url) VALUES ('Coca Cola 0.5L', 1500, 'assets/Cola.png');
```

## 5. ✅ BACKEND CODE (EDGE FUNCTION) & 6. ✅ TELEGRAM BOT CODE

We will use a Single Supabase Edge Function to act as both a Database Webhook (sending messages) and a Telegram Webhook (receiving button clicks).

1. In Supabase, go to **Edge Functions** -> **Create a new Edge Function**.
2. Name it `telegram-bot`.
3. Paste this exact code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
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
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ I am going', callback_data: `accept_${reqId}` }
            ]]
          }
        })
      })
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
        await supabase
          .from('housekeeping_requests')
          .update({ status: 'accepted' })
          .eq('id', reqId)
          
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
            text: `🧹 *Housekeeping Requested*\nRoom: Check Database\n✅ Accepted by staff`,
            parse_mode: 'Markdown'
          })
        })
      }
      return new Response('Callback processed', { status: 200 })
    }
  }
  return new Response('Ok', { status: 200 })
})
```

4. Go to **Edge Functions** -> **Secrets** and add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

5. **Connect Database to Function:**
   - Go to **Database** -> **Webhooks**.
   - Create a new webhook on the `housekeeping_requests` table (Insert only).
   - Target HTTP Request -> Set URL to your Edge Function URL. Add `Authorization: Bearer [YOUR_ANON_KEY]`.

6. **Connect Telegram to Function:**
   - Open your browser and visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_EDGE_FUNCTION_URL>`

## 7. ✅ FRONTEND CHANGES (FILE BY FILE)

### `index.html` - Add Supabase and UI Modals

Add this right before your `</body>` tag:
```html
    <!-- Supabase JS -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Housekeeping Modal -->
    <section id="housekeeping-modal" class="modal" role="dialog" aria-modal="true">
        <div class="modal-content glass">
            <button class="modal-close" data-modal="housekeeping">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
            <h2>Call Housekeeping</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <input type="text" id="hk-room" placeholder="Enter Room Number" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <button id="hk-submit-btn" class="nav-btn wide-btn" style="background:var(--color-primary); color:white;">Call Now</button>
                <div id="hk-msg" style="color:green; display:none;">Request saved & Staff notified!</div>
            </div>
        </div>
    </section>

    <!-- Rating Modal -->
    <section id="rating-modal" class="modal" role="dialog" aria-modal="true">
        <div class="modal-content glass">
            <button class="modal-close" data-modal="rating">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
            <h2>Rate Our Service</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <select id="rating-val" style="padding:10px; border-radius:8px;">
                    <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                    <option value="4">⭐⭐⭐⭐ 4 - Good</option>
                    <option value="3">⭐⭐⭐ 3 - Average</option>
                    <option value="2">⭐⭐ 2 - Poor</option>
                    <option value="1">⭐ 1 - Terrible</option>
                </select>
                <textarea id="rating-comment" placeholder="Optional comments..." rows="4" style="padding:10px; border-radius:8px;"></textarea>
                <button id="rating-submit-btn" class="nav-btn wide-btn" style="background:var(--color-primary); color:white;">Submit Rating</button>
                <div id="rating-msg" style="color:green; display:none;">Thank you for your feedback!</div>
            </div>
        </div>
    </section>
```

Find your `.main-nav` in `index.html` and add these two buttons exactly inside the grid:
```html
<button class="nav-btn" data-modal="housekeeping">
    <span class="nav-icon">🧹</span>
    <span>Housekeeping</span>
</button>
<button class="nav-btn" data-modal="rating">
    <span class="nav-icon">⭐</span>
    <span>Rate Us</span>
</button>
```

### `script.js` - Replace Static Data with Supabase

Add this exactly at the top of your `script.js` (replace with your URLs):
```javascript
// Initialize Supabase
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Helper to Load Minibar from Supabase
async function loadMinibar() {
    const { data, error } = await supabase.from('minibar_items').select('*');
    if (error) { console.error(error); return; }
    
    const container = document.querySelector('.products-grid');
    container.innerHTML = ''; // clear static

    data.forEach(item => {
        container.innerHTML += `
            <article class="product-card">
                <div class="product-image" data-images='["${item.image_url}"]'>
                    <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h4>${item.name}</h4>
                    <p class="price">${item.price} AMD</p>
                </div>
            </article>`;
    });
}

// Intercept Modal Open dynamically to load data
document.addEventListener('DOMContentLoaded', () => {
    loadMinibar(); // Pre-load or trigger when modal opens
    
    // Housekeeping Submission
    document.getElementById('hk-submit-btn').addEventListener('click', async () => {
        const room = document.getElementById('hk-room').value;
        if (!room) return alert('Enter room number');
        
        await supabase.from('housekeeping_requests').insert([{ room_number: room }]);
        document.getElementById('hk-msg').style.display = 'block';
        setTimeout(() => closeModal(document.getElementById('housekeeping-modal')), 2000);
    });

    // Rating Submission
    document.getElementById('rating-submit-btn').addEventListener('click', async () => {
        const rating = document.getElementById('rating-val').value;
        const comment = document.getElementById('rating-comment').value;
        
        await supabase.from('housekeeping_ratings').insert([{ rating: parseInt(rating), comment }]);
        document.getElementById('rating-msg').style.display = 'block';
        setTimeout(() => closeModal(document.getElementById('rating-modal')), 2000);
    });
});
```

## 8. ✅ ADMIN PANEL (FULL CODE)

I have created an entirely separate, secure dashboard for you. Check your workspace: `admin/index.html` and `admin/script.js`. Simply open `admin/index.html` to log in (Create a user in Supabase Authentication first), and you can manage the Minibar, Tours, Services, and view Housekeeping tasks transparently!

## 9. ✅ HOW TO CONNECT EVERYTHING
1. Publish your updated GitHub Pages repo.
2. Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` in `script.js` and `admin/script.js`.
3. Put the keys in the Edge function secrets.

## 10. ✅ WHAT TO REPLACE (VERY CLEAR)
- REPLACED hardcoded minibar products inside `index.html` > `<div class="products-grid">` with the Javascript fetch loop.
- ADDED `<script>` tag referencing Supabase JS in `index.html`.
- ADDED 2 new buttons in `.main-nav` for Housekeeping & Rating.
- ADDED edge function webhook pointing to your BotFather token.

## 11. ✅ FINAL TEST CHECKLIST
- [ ] Login to `admin/index.html`. See blank tables.
- [ ] Add 1 Minibar Item in the Admin panel.
- [ ] Refresh the public website, open Minibar, verify item appears.
- [ ] Click "Call Housekeeping", enter Room "42".
- [ ] Check your Telegram app. Did the bot send the message?
- [ ] Click the "✅ I am going" button in Telegram.
- [ ] Refresh Admin Panel Housekeeping tab. Did the status change to "accepted"?
- [ ] Rate 5 Stars on the Frontend. Verify it shows in Admin Panel.

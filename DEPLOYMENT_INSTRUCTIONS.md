# 🚀 Garden Inn Resort — Deployment Instructions

Everything is already written in your local files! Follow these steps to go live.

---

## Step 1: Run the Database Schema

1. Go to [Supabase Dashboard](https://supabase.com) → open your project
2. Click **SQL Editor** → **New Query**
3. Open `schema.sql` in your code editor, copy **ALL** the content
4. Paste it into the SQL Editor and click **Run**
5. You should see "Success. No rows returned" — this means all tables are created

## Step 2: Create an Admin User

1. In Supabase sidebar → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter an email (e.g. `admin@gardeninn.am`) and password
4. This is the login for your `admin/index.html` panel

## Step 3: Add Multiple Telegram Chat IDs

The site sends housekeeping notifications to Telegram directly. To add more staff members:

1. Open `script.js` in your editor
2. On line 13, find `TG_CHAT_IDS`
3. Add more chat IDs separated by commas:
```js
const TG_CHAT_IDS = ['743938415', '123456789', '987654321'];
```

**How to get someone's Chat ID:**
1. Tell them to message your bot in Telegram
2. Open `https://api.telegram.org/bot8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8/getUpdates`
3. Find their `"chat": {"id": XXXXXXX}` number

## Step 4: Deploy Edge Function (for "I am coming" button)

> This step is **optional**. Without it, Telegram messages still arrive, but the "I am coming" button won't work.

### Option A: Via Supabase Dashboard (easiest)
1. Go to **Edge Functions** → **Create a new function**
2. Name it `telegram-bot`
3. Copy the code from `supabase/functions/telegram-bot/index.ts`
4. Deploy it
5. Go to **Edge Functions** → **Secrets** and add:
   - `TELEGRAM_BOT_TOKEN` = `8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8`
   - `TELEGRAM_CHAT_IDS` = `743938415`
   - `SUPABASE_SERVICE_ROLE_KEY` = (find in Project Settings → API → service_role secret)
6. Copy the function URL
7. Open in browser: `https://api.telegram.org/bot8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8/setWebhook?url=YOUR_FUNCTION_URL`

### Option B: Via CLI
```bash
npx supabase login
npx supabase link --project-ref klnxybjaaxtlfabnzxcd
npx supabase secrets set TELEGRAM_BOT_TOKEN="8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8"
npx supabase secrets set TELEGRAM_CHAT_IDS="743938415"
npx supabase functions deploy telegram-bot
```
Then set webhook:
```
https://api.telegram.org/bot8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8/setWebhook?url=YOUR_FUNCTION_URL
```

## Step 5: Publish to GitHub Pages

1. Push all files to your GitHub repository
2. Enable GitHub Pages in repo Settings → Pages → select branch `main`
3. Your site will be live at `https://yourusername.github.io/GardenInnInfo/`

---

## How It All Works

| Feature | How |
|---|---|
| **Minibar, Services, Tours, Rules** | Content managed via Admin Panel → stored in Supabase → displayed on website |
| **Multi-language** | UI labels are hardcoded in `script.js`. Content (services, tours, rules) has EN/RU/HY columns in database |
| **Housekeeping Call** | Guest enters room → gets 6-digit code → Telegram notification sent to staff |
| **Housekeeping Rating** | Guest enters their code → rates 1-5 stars → visible in Admin Panel |
| **"I am coming" button** | Staff clicks in Telegram → Edge Function updates DB → guest sees toast notification |
| **Image uploads** | Admin uploads image → stored in Supabase Storage `images` bucket → URL saved in DB |

## Test Checklist

- [ ] Run `schema.sql` in SQL Editor
- [ ] Create admin user in Authentication
- [ ] Login to admin panel (`/admin/index.html`)
- [ ] Add a minibar item with image
- [ ] Open main site → Mini Bar → item appears
- [ ] Press Housekeeping → enter room → Call Now
- [ ] Check Telegram — message arrived with room number?
- [ ] Add a service with EN/RU/HY titles
- [ ] Switch language on site → title changes?

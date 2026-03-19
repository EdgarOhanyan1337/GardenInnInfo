# 🔥 GARDEN INN RESORT: FULL-STACK GUIDE

## Architecture

```
Guest Website (GitHub Pages)
    ├── index.html + script.js → loads content from Supabase
    ├── Housekeeping → sends Telegram + saves code to DB
    └── Language switch → uses hardcoded UI + DB content

Admin Panel (/admin/)
    ├── Login via Supabase Auth
    ├── Manage: Minibar, Services, Tours, Rules
    ├── Multi-language: EN/RU/HY fields for all content
    ├── View: Housekeeping logs + ratings
    └── Image uploads → Supabase Storage

Supabase
    ├── Database (7 tables)
    ├── Storage (images bucket)
    ├── Auth (admin login)
    └── Real-time (live updates)

Telegram Bot
    ├── Frontend sends messages directly (no server needed)
    ├── Edge Function handles "I am coming" callback
    └── Multiple staff chat IDs supported
```

## Database Schema

All tables are defined in `schema.sql`. Run it in **Supabase SQL Editor**.

| Table | Columns | Purpose |
|-------|---------|---------|
| `minibar_items` | name, price, image_url | Mini bar products |
| `services` | service_key, title_en/ru/hy, description_en/ru/hy, status_type, icon, images | Hotel services (multi-lang) |
| `tours` | tour_key, title_en/ru/hy, description_en/ru/hy, price, icon, images | Tour packages (multi-lang) |
| `rules` | icon, text_en/ru/hy | Hotel rules (multi-lang) |
| `translations` | key, en, ru, hy | UI string overrides (optional) |
| `housekeeping_requests` | room_number, code, status | Guest requests with 6-digit code |
| `housekeeping_ratings` | code, rating, comment | Ratings linked to request codes |

RLS is **disabled** and `GRANT ALL` is given to `anon` + `authenticated` roles for full access.

## File Structure

```
GardenInnInfo/
├── index.html          ← Main guest website
├── index.css           ← Styles
├── script.js           ← Frontend logic (Supabase, modals, languages, Telegram)
├── schema.sql          ← Database schema (run in SQL Editor)
├── admin/
│   ├── index.html      ← Admin dashboard HTML
│   └── admin-script.js ← Admin logic (CRUD, uploads)
└── supabase/functions/telegram-bot/
    └── index.ts        ← Edge function (handles "I am coming" callback)
```

## Key Configuration

In `script.js` (lines 7-13):
```js
const ROOT_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const ROOT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
const TG_BOT_TOKEN = '8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8';
const TG_CHAT_IDS = ['743938415'];  // Add multiple staff
```

## How Housekeeping Works

```
1. Guest presses "Housekeeping" → opens modal with 2 tabs
2. TAB 1 - "Call Housekeeping":
   - Guest enters room number → presses "Call Now"
   - System generates 6-digit code (e.g. 483291)
   - Saves to DB: {room_number, code, status: 'pending'}
   - Sends Telegram message to ALL chat IDs with inline "I am coming" button
   - Shows code to guest: "Save this code to rate later"

3. Staff sees Telegram message → clicks "✅ I am coming"
   - Edge function updates DB: status → 'accepted'
   - Guest sees real-time toast notification: "Staff is on the way!"

4. TAB 2 - "Rate Housekeeping":
   - Guest enters their 6-digit code + stars + comment
   - System verifies code exists and hasn't been rated yet
   - Saves rating linked to that code
   - Visible in Admin Panel → HK Ratings
```

## How Translations Work

**UI Labels** (buttons, headers like "Services", "Rules", "Mini Bar"):
- Hardcoded in `script.js` translations object
- Switch instantly when guest changes language
- Can be overridden by `translations` DB table (optional)

**Content** (service titles, tour descriptions, rule texts):
- Stored in DB with `_en`, `_ru`, `_hy` columns
- Entered via Admin Panel with separate fields per language
- Frontend reads `title_[currentLang]` dynamically

## Edge Function (Telegram Callback)

File: `supabase/functions/telegram-bot/index.ts`

This handles ONE thing: when staff clicks "I am coming" in Telegram.
- Receives Telegram callback
- Updates `housekeeping_requests.status` to `'accepted'`
- Edits the Telegram message to show "Accepted by [name]"
- Frontend detects change via Supabase real-time → shows toast

**Required secrets:**
- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

## Quick Start

1. Run `schema.sql` in Supabase SQL Editor
2. Create admin user in Authentication → Users
3. Login to `/admin/index.html`
4. Add content (services, tours, rules, minibar items)
5. Open main site → verify content loads
6. Test housekeeping → check Telegram
7. (Optional) Deploy edge function for "I am coming" button

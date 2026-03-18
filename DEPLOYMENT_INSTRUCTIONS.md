# 🚀 Final Deployment Instructions

The code (HTML, JS, Admin Panel, and Edge Function) has already been fully written to your local files by me! 

You are now 4 steps away from launching the full-stack system. Follow these instructions exactly:

## Step 1: Create Supabase Project & Tables
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. In the Supabase sidebar, go to **SQL Editor**.
3. Open `FULL_STACK_GUIDE.md` in your code editor, copy the entire SQL block under **"4. ✅ DATABASE"**, paste it into Supabase, and click **Run**.
4. Go to **Authentication** -> **Users** and create an Admin user (Email/Password) to use for your `admin/index.html` login.

## Step 2: Configure Keys in Your Files
1. In Supabase, go to **Project Settings** (the gear icon) -> **API**.
2. Copy your **Project URL** and the **`anon` public key**.
3. Open `script.js` in your editor. At the very top (lines 7 & 8), replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY`.
4. Open `admin/script.js` and do the exact same thing for the admin panel.

## Step 3: Setup Telegram Bot & Deploy Edge Function
1. On Telegram, message `@BotFather` and send `/newbot` to create your bot. He will give you a **BOT_TOKEN**.
2. Send a message to your new bot.
3. Visit `hhttps://api.telegram.org/bot%3C8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8%3E/getUpdates` in your browser. Look for the `"chat": {"id": 123456789}` value. Save this **Chat ID**.
4. Open your computer's terminal and run these commands to deploy the function:
   ```bash
   # 1. You don't need to install anything globally! Just use 'npx' before the commands.

   # 2. Login to your Supabase account
   npx supabase login
   
   # 3. Link this folder to your cloud project
   npx supabase link --project-ref your-supabase-project-id
   
   # 4. Save your secret keys to the cloud
   npx supabase secrets set TELEGRAM_BOT_TOKEN="8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8"
   npx supabase secrets set TELEGRAM_CHAT_ID="743938415"
   npx supabase secrets set SUPABASE_URL="https://klnxybjaaxtlfabnzxcd.supabase.co"
   npx supabase secrets set SUPABASE_ANON_KEY="sb_secret_CS9wfE_qUfL3MrR2xzrTAQ_kf-z1ciE"
   
   # 5. Deploy the backend code we wrote!
   npx supabase functions deploy telegram-bot
   ```

## Step 4: Connect the Database to the Bot
1. In the Supabase Dashboard, go to **Database** -> **Webhooks**.
2. Create a new webhook:
   - **Name:** Telegram Notification
   - **Table:** `housekeeping_requests`
   - **Events:** Select `Insert`
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** Paste the Edge Function URL (You can find this in Edge Functions -> telegram-bot -> Details).
   - **Headers:** Add Authorization header. Name: `Authorization`, Value: `Bearer YOUR_ANON_KEY`
   
**Save the webhook and you are done!** Push these files to your GitHub repository and your Full-Stack Website, Admin Panel, and Telegram Bot are fully live. 🚀

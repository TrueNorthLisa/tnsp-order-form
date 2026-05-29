# TNSP Order Intake Form

Customer-facing order request form with AI-powered instant estimate.
Built for True North Screen Printing Ltd. — Vancouver, BC.

---

## Project Structure

```
tnsp-order-form/
├── public/
│   └── index.html              ← The order form (your only frontend file)
├── netlify/
│   └── functions/
│       ├── get-quote.js        ← Secure Claude API proxy
│       └── save-submission.js  ← Saves submissions to Supabase
├── netlify.toml                ← Netlify build config
├── supabase-schema.sql         ← Run once in Supabase SQL Editor
└── README.md
```

---

## Step 1 — Set up Supabase

1. Go to **https://piiyxripiynzoabazhjd.supabase.co**
2. Click **SQL Editor** in the left sidebar
3. Paste the entire contents of `supabase-schema.sql` and click **Run**
4. You should see the `order_submissions` table appear under **Table Editor**

To get your **Service Role Key**:
- Go to **Project Settings → API**
- Copy the `service_role` key (the secret one — not the anon key)
- You'll need this in Step 3

---

## Step 2 — Push to GitHub

```bash
# From your local machine
git clone https://github.com/TrueNorthLisa/tnsp-scheduler.git  # or create a new repo
# Copy this project folder into the repo, or create a new repo just for this form:

git init
git remote add origin https://github.com/TrueNorthLisa/tnsp-order-form.git
git add .
git commit -m "Initial order form with Netlify functions"
git push -u origin main
```

Or just drag-and-drop the folder into a new GitHub repo via the browser.

---

## Step 3 — Deploy to Netlify

1. Go to **app.netlify.com** and click **Add new site → Import an existing project**
2. Connect your GitHub and select the `tnsp-order-form` repo
3. Build settings will be auto-detected from `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Click **Deploy site**

### Add Environment Variables

In Netlify → **Site configuration → Environment variables**, add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `SUPABASE_URL` | `https://piiyxripiynzoabazhjd.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key (from Step 1) |

Then **trigger a redeploy** (Deploys → Trigger deploy → Deploy site).

---

## Step 4 — Set your domain (optional)

To use a custom URL like `order.truenorthscreenprinting.ca`:
- Netlify → **Domain management → Add custom domain**
- Add a CNAME record with your DNS provider pointing to your Netlify URL

Or just share the Netlify subdomain URL (e.g. `tnsp-order-form.netlify.app`).

---

## Viewing Submissions

In Supabase → **Table Editor → order_submissions** you'll see every submission with:
- Full customer details
- Decoration specs
- Garment & quantity info
- The AI-generated estimate
- A `status` column (default: `new`) — update to `reviewed`, `quoted`, `won`, `lost`, or `no-reply` to track your pipeline

You can also run queries in the SQL Editor, e.g.:
```sql
-- All new submissions this week
select customer_name, customer_email, services, qty_total, status, submitted_at
from order_submissions
where submitted_at > now() - interval '7 days'
order by submitted_at desc;
```

---

## Updating Pricing

All pricing logic lives in `netlify/functions/get-quote.js` in the `SYSTEM_PROMPT` constant.
Edit the numbers there and redeploy — no changes needed to the form itself.

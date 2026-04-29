# Screenprint Dashboard - Setup Guide (v2 with Proxy)

## Why This Version Is Different

The first version called Notion directly from the browser, which Notion blocks (CORS policy). This version uses a Next.js serverless function as a proxy - your browser calls your own Vercel server, which then calls Notion. No more 404 errors.

---

## Step 1: Get Your Notion API Token

1. Go to **notion.com/profile/integrations**
2. Click "New integration"
3. Name it "Order Dashboard"
4. Hit Save
5. Copy the **Internal Integration Token** (starts with `secret_`)

---

## Step 2: Connect Integration to the Database

This is the step most people miss.

1. Open the Order Management database in Notion
2. Click the **...** (three dots) in the top right
3. Click **Connections**
4. Find and connect "Order Dashboard"

---

## Step 3: Upload to GitHub

1. Go to **github.com** and create a free account
2. Click the **+** icon > New repository
3. Name it `screenprint-dashboard`
4. Set it to Private
5. Click Create repository
6. Upload ALL files from the downloaded zip, keeping the folder structure:
   ```
   screenprint-dashboard/
   ├── pages/
   │   ├── api/
   │   │   └── orders.js
   │   └── index.js
   ├── package.json
   └── next.config.js
   ```

---

## Step 4: Deploy to Vercel

1. Go to **vercel.com** and sign up free with your GitHub account
2. Click **New Project**
3. Select your `screenprint-dashboard` repo
4. Before clicking Deploy, click **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NOTION_TOKEN` | Your `secret_...` token from Step 1 |
   | `NOTION_DATABASE_ID` | `208d2bcc6aea805184b9e2757f19ab93` |

5. Click **Deploy**
6. Vercel gives you a live URL like `https://screenprint-dashboard.vercel.app`

---

## Step 5: Point Yodeck at the URL

1. In Yodeck, create a new **Web Page** widget
2. Paste the Vercel URL
3. Set refresh interval to 60 seconds (dashboard also auto-refreshes every 30s internally)
4. Push to the Pi screen

Done.

---

## Troubleshooting

**Still getting errors after deploy:**
- Double check the environment variables are spelled exactly right in Vercel
- Make sure the integration is connected to the database in Notion (Step 2)
- Check Vercel logs: go to your project > Deployments > click latest > Functions tab

**Orders not showing:**
- Make sure there are active (non-Complete) orders in the database
- Verify the Notion column names match exactly:
  - `Client` (title field)
  - `Due By` (date field)
  - `Status` (status or select field)
  - `Embellishment` (multi-select)
  - `Employee` (multi-select)
  - `Quantity` (number)
  - `Time` (text)
  - `Bin` (select or text)

**Want to update the dashboard later:**
- Edit files locally
- Push to GitHub
- Vercel auto-deploys within 30 seconds

---

## Color Legend

- Red left border = Overdue
- Orange left border = Due today
- Yellow left border = Due tomorrow
- Green left border = On track (2+ days out)

---

## Files in This Package

- `pages/index.js` — The dashboard UI
- `pages/api/orders.js` — The serverless proxy that calls Notion
- `package.json` — Project dependencies
- `next.config.js` — Next.js config

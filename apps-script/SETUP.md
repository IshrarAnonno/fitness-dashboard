# Workout logger — one-time setup (≈5 minutes)

The `/log` app saves each session as a new row in your existing Google Sheet,
so the dashboard keeps reading everything from one place.

```
iPhone (/log)  →  Vercel /api/log (checks your PIN)  →  Apps Script  →  Google Sheet  →  dashboard
```

## 1. Add the script to your sheet

1. Open the responses spreadsheet (the one the dashboard reads).
2. **Extensions → Apps Script**.
3. Replace everything in `Code.gs` with the contents of [`Code.gs`](./Code.gs).
4. Change `SECRET` at the top to a long random string (e.g. mash the keyboard for 30+ characters). Save.

## 2. Deploy it as a web app

1. **Deploy → New deployment** → gear icon → **Web app**.
2. *Execute as*: **Me**. *Who has access*: **Anyone**.
3. Click **Deploy**, approve the permission prompt (it only needs this spreadsheet), and copy the **Web app URL** (ends in `/exec`).

"Anyone" is required so Vercel can reach it without a Google login; the `SECRET`
is what stops anyone else from writing to your sheet.

## 3. Add three environment variables in Vercel

Project → **Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `APPS_SCRIPT_URL` | the `/exec` URL from step 2 |
| `APPS_SCRIPT_SECRET` | the same string you put in `SECRET` |
| `LOG_PIN` | a PIN you'll type once on your phone |

Then redeploy the project.

## 4. Put it on your iPhone

1. Open `https://fitness-dashboard-beta.vercel.app/log` in **Safari**.
2. **Share → Add to Home Screen**.
3. Open it from the home screen, log a session, enter your `LOG_PIN` when asked (remembered after that).

## Notes

- If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
- Exercises that have their own column in the sheet (bench press, squats, …) go into that column; everything else is written into the notes as `Name - 30/16/16/16`, the same format you used by hand.
- Weight for dumbbell exercises is the total of both dumbbells, as before. The app shows the per-hand number next to it.
- No signal at the gym? The session is kept on the phone and sent automatically when you're back online.
- Progress photos aren't part of the app yet; keep using the Google Form for those.

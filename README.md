# Channel Crossings Tracker

A one-page site showing how many people cross the English Channel in small boats each day, using the Home Office's provisional daily figures.

## Files

- `index.html` – the page
- `privacy.html` – the Privacy Policy and Terms of Use, linked from the page footer
- `favicon.svg` – the CC logo shown in the browser tab
- `apple-touch-icon.png` – the icon used when someone adds the site to their iPhone home screen
- `logo-badge.png` – the full Channel Crossings badge, for your X profile and elsewhere
- `og-image.png` – the preview picture X shows when someone shares the link; redrawn whenever new figures are published
- `scripts/og_image.py` – draws `og-image.png`
- `data.json` – the full daily history, loaded in the background
- `recent.json` – the last 90 days and totals, used by the embed widget
- `status.json` – a tiny heartbeat written at every check, so open pages know when the site last looked and when to fetch new figures
- `gender.json`, `petitions.json` – sex and age figures and related petitions, gathered by `scripts/extras.py`
- `requirements.txt` – the Python packages the update job installs
- `data.csv` – the same daily figures as a spreadsheet download, linked from the footer
- `how-it-works.html` – sources, definitions, downloads and the embed code
- `embed.html` – the small "latest figure" box other sites can embed
- `beach-radar.html` – Beach Radar, a coming-soon page (not listed in search engines)
- `sw.js` – offline mode: keeps a copy of the site on visitors' devices
- `robots.txt`, `sitemap.xml` – help search engines find and index the site
- `week-card.png` – the "Week in numbers" picture, redrawn daily for the last full week
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` – let visitors add the site to their home screen as an app
- `scripts/update.py` – fetches the latest figures from GOV.UK and updates `data.json`
- `scripts/news.py`, `news.json`, `.github/workflows/news.yml` – hourly breaking news about small boats from UK news feeds (edit `news-override.json` to hide or pin a story)
- `.github/workflows/update.yml` and `scripts/gate.py` – from 12 noon UK time, check for new figures every 15 minutes until they're in, then stop until noon the next day

## Put it online with GitHub Pages

1. Create a new **public** repository on GitHub.
2. Upload everything in this folder, keeping the folder structure (including the `.github` folder).
   On a Mac, press Cmd+Shift+. in Finder to see the hidden `.github` folder.
3. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. Go to **Settings → Actions → General → Workflow permissions**, select **Read and write permissions**, and save.
5. Go to the **Actions** tab, open **Update crossing figures**, and click **Run workflow** once to load the full history.

Your site will be at `https://<your-username>.github.io/<repository-name>/`. After that, the figures update themselves every day.

## About the data

Source: [Small boat activity in the English Channel](https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats) (Home Office, Open Government Licence v3.0). Figures are provisional and can be revised. The daily page covers the last 7 days; the time-series spreadsheet, updated on Fridays, goes back to 2018.

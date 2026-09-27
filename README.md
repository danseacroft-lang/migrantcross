# Channel Crossings Tracker

A one-page site showing how many people cross the English Channel in small boats each day, using the Home Office's provisional daily figures.

## Files

- `index.html` – the page
- `privacy.html` – the Privacy Policy and Terms of Use, linked from the page footer
- `favicon.svg` – the CC logo shown in the browser tab
- `apple-touch-icon.png` – the icon used when someone adds the site to their iPhone home screen
- `logo-badge.png` – the full Channel Crossings badge, for your X profile and elsewhere
- `og-image.png` – the preview picture X shows when someone shares the link; redrawn each morning with the latest figure
- `scripts/og_image.py` – draws `og-image.png`
- `data.json` – the figures the page displays
- `data.csv` – the same daily figures as a spreadsheet download, linked from the footer
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` – let visitors add the site to their home screen as an app
- `experimental.html` – the stripped-back beta version
- `scripts/update.py` – fetches the latest figures from GOV.UK and updates `data.json`
- `.github/workflows/update.yml` – runs the update script every day at 10:30 UTC

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

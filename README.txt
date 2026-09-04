# Nuvio Krmzy + AlooyTV provider

Files:
- `providers/krmzy-alooytv.js` — the provider
- `manifest-entry.json` — the single object to add to your existing `scrapers` array

Your existing plugin uses the Nuvio single-file provider format (`filename` points to `providers/*.js`), so this is designed for that structure.

## Add it to your GitHub plugin

1. Upload `providers/krmzy-alooytv.js` into your repository's `providers` folder.
2. Open `manifest.json`.
3. Inside the existing `scrapers` array, paste the object from `manifest-entry.json` (with a comma after the previous scraper object if needed).
4. Commit/save.
5. In Nuvio, refresh the plugin/repository and enable `Krmzy + AlooyTV`.

The provider searches TMDB Arabic/original titles, searches both sites, finds the requested episode, then extracts publicly exposed HLS/MP4 URLs from the episode/player pages.

If a site changes its HTML/player, the provider may need an update.

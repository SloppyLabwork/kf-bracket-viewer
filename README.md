# KF Brackets

A live tournament bracket viewer for 32-player KeyForge events. Pulls seedings and match results directly from a Google Sheet, so the bracket updates automatically as results are reported.

## Quick Start

1. Set up your Google Sheet (see below)
2. Publish the sheet: **File > Share > Publish to web** (publish the entire document)
3. Copy the sheet ID from the URL — it's the long string between `/d/` and `/edit`
4. Open the bracket viewer with your sheet ID:
   ```
   https://<your-site>/kf-brackets/?sheetId=YOUR_SHEET_ID
   ```

## Google Sheet Setup

Your Google Sheet needs at least a **Players** tab. A **Results** tab and an optional **Meta** tab add match tracking and visual customization.

### Players Tab

A single column of exactly 32 player names, listed in seed order (seed 1 first, seed 32 last).

| Players |
|---|
| Alice |
| Bob |
| Charlie |
| ... (32 total) |

The header row ("Players") is optional. If present it will be skipped automatically.

### Results Tab

Each row represents a completed match. Column headers must match exactly:

| Column | Description |
|---|---|
| **Timestamp** | When the result was submitted (used to resolve duplicate entries) |
| **What round was this?** | Round name, e.g. "Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final" |
| **Winner (that's you)** | Name of the winning player (must match the Players list) |
| **Opponent** | Name of the losing player (must match the Players list) |
| **Winner's Deck** | Link to the winner's deck (optional, shows a link icon on the bracket) |
| **Opponent's Deck** | Link to the opponent's deck (optional) |
| **What was the chain bid?** | Number of chains bid, e.g. "8" (optional, 0 if omitted) |
| **Which deck was bid on?** | "My deck" or "Opponent's deck" (optional) |
| **Did you play your own deck in the match?** | "Yes" or "No" (optional, indicates if decks were swapped) |

This tab is designed to be populated by a Google Form. If no Results tab exists, the bracket renders with all matches pending.

### Meta Tab (Optional)

Key-value pairs for visual customization. All options are optional — any missing option uses its default.

| Key | Value | Default |
|---|---|---|
| Tournament Name | Your tournament title | *(no title shown)* |
| East Background | URL to an image for the left bracket half | *(no image)* |
| West Background | URL to an image for the right bracket half | *(no image)* |
| East Color | Hex color for the left side, e.g. `#00c853` | `#00c853` |
| West Color | Hex color for the right side, e.g. `#0077b6` | `#0077b6` |
| Max Seed Display | Only show seed numbers up to this value, e.g. `8` | *(all seeds shown)* |

The "Key" header row is optional. Keys are case-insensitive.

Background images are cropped at an angle where they meet the center of the bracket, with a colored border matching the side's color.

## URL Parameters

| Parameter | Default | Description |
|---|---|---|
| `sheetId` | *(required)* | The ID of your published Google Sheet |
| `playersSheet` | `Players` | Name of the tab containing player seedings |
| `resultsSheet` | `Results` | Name of the tab containing match results |
| `metaSheet` | `Meta` | Name of the tab containing visual config |

Example with custom tab names:
```
?sheetId=ABC123&playersSheet=Seedings&resultsSheet=Matches
```

## For Developers

### Requirements

- Node.js 18+
- npm

### Local Development

```bash
npm install
npm run dev
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

This builds the site and publishes it to the `gh-pages` branch. Make sure GitHub Pages is enabled in your repo settings and pointed at the `gh-pages` branch.

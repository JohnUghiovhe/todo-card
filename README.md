# Todo Card

A single, testable Todo Card built as a small static page with a lightweight local Node server.

## Start the app

Run either command from the project root:

```bash
npm start
```

or

```bash
npm run dev
```

The server defaults to `http://localhost:3000` and serves `index.html` plus the local CSS and JS files.

## What changed from Stage 0

- Added a real local server entrypoint so the project can be launched with `npm start` or `npm run dev`.
- Expanded the card from a mostly static UI into a stateful component with edit mode, status syncing, expand/collapse behavior, and dynamic time updates.
- Added more explicit accessibility hooks, including labels, `aria-live`, and focus-visible styling.
- Improved responsiveness so the card handles mobile and desktop layouts more reliably.

## New design decisions

- Kept the UI as a single card rather than turning it into a multi-item task list.
- Used a warm, editorial-style palette with clear priority and status accents instead of a generic app shell.
- Added a dedicated priority indicator dot so priority changes are visible even when the badge text is similar.
- Made the description collapsible so long content stays readable without overpowering the card.

## Known limitations

- The Edit and Delete actions are still dummy behaviors and do not persist anywhere.
- The task data resets on page refresh because there is no storage layer.
- The server is intentionally minimal and only serves local files from this folder.
- Focus trapping inside edit mode is not implemented, only a focus return to the Edit button after closing.

## Accessibility notes

- The checkbox is a native `<input type="checkbox">` with a visible label.
- The status control has an accessible label and stays synced with checkbox state.
- Time remaining uses `aria-live="polite"` so updates are announced without being disruptive.
- The expand/collapse toggle uses `aria-expanded` and `aria-controls`.
- Buttons and inputs have visible focus states for keyboard navigation.
- Semantic elements are used for the card, metadata, time values, and tag list.
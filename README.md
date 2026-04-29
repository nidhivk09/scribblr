# Quick Notes

A minimal Chrome extension that adds a persistent sidebar for taking notes while browsing. Built with Manifest V3, the Chrome Side Panel API, and `chrome.storage`.

---

## Features

- Slide-in sidebar accessible via the toolbar icon or `Alt+N`
- Multiple notes with auto-generated titles from the first line
- Auto-saves as you type using `chrome.storage.local`
- Formatting toolbar: bold, italic, underline, bullet list, heading
- Copy note to clipboard
- Dark / light mode toggle
- Notes persist across tabs, windows, and browser restarts

---

## Installation (Local Development)

1. Clone this repository
   ```
   git clone https://github.com/yourusername/quick-notes.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer Mode** using the toggle in the top-right corner

4. Click **Load Unpacked** and select the `quick-notes/` folder

5. Pin the extension by clicking the puzzle piece icon in the toolbar, then clicking the pin next to Quick Notes

6. Click the extension icon to open the side panel, or press `Alt+N`

---

## Project Structure

```
quick-notes/
├── manifest.json       # Extension configuration and permissions
├── background.js       # Service worker — handles commands and panel toggling
├── sidepanel.html      # Side panel markup
├── sidepanel.css       # Styles with CSS custom properties for theming
├── sidepanel.js        # All UI logic, storage, and formatting
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

This extension uses three Chrome APIs:

**`chrome.sidePanel`** — Opens the notes panel docked to the browser window. Unlike injecting a `<div>` into the page, the Side Panel is a fully isolated context that won't conflict with the host page's styles or scripts.

**`chrome.commands`** — Registers the `Alt+N` keyboard shortcut at the browser level via `manifest.json`. This is more reliable than a `keydown` listener in a content script, which can be blocked or overridden by the page.

**`chrome.storage.local`** — Persists notes and preferences (theme, active note) across sessions. Unlike `localStorage`, this is scoped to the extension itself rather than the current domain, so your notes are the same on every website.

The service worker (`background.js`) sleeps when idle and wakes on events. Because of this, no application state is stored in variables there — everything lives in `chrome.storage`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+N` | Toggle the notes sidebar |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Tab` | Insert 2 spaces |

To change the `Alt+N` shortcut, go to `chrome://extensions/shortcuts`.

---

## Roadmap

- [ ] `chrome.storage.sync` support to sync notes across devices
- [ ] Search across all notes
- [ ] Export notes as a `.md` file
- [ ] Note timestamps (created / last edited)
- [ ] Drag to reorder tabs

---

## Chrome Web Store

Not yet published. To publish your own version, see [Chrome's developer documentation](https://developer.chrome.com/docs/webstore/publish).

---

## License

MIT

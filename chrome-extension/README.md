# StackMemory Chrome Extension

Save useful context from the web into StackMemory with one click.

## What It Does

- Save selected text directly into your shared memory
- Capture an entire page summary for later recall
- Use the context menu for quick saves
- Trigger capture with `Ctrl+Shift+M`
- Classify captured content automatically

## Install

### Chrome Web Store
1. Open the Chrome Web Store.
2. Search for `StackMemory`.
3. Click `Add to Chrome`.

### Manual Install
1. Download this repository.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the `chrome-extension` folder.

## Connect

1. Click the extension icon.
2. Sign in with StackMemory or paste your API key.
3. When the connection succeeds you will see a green check.

The extension can point to a hosted StackMemory environment or your own local deployment.

## Usage

### Save Selected Text
1. Highlight text on a web page.
2. Click the floating memory button.
3. Or press `Ctrl+Shift+M` on Windows/Linux and `Cmd+Shift+M` on macOS.

### Save From The Context Menu
1. Select text.
2. Right click.
3. Choose `StackMemory: Save to memory`.

### Save From The Popup
1. Click the extension icon.
2. Paste or type content.
3. Pick a memory type.
4. Click `Save`.

## Settings

From the popup settings screen you can:

- change the API URL
- enable or disable notifications
- adjust automatic categorization

## Troubleshooting

### Connection Failed

- Verify your API key
- Verify network access
- Verify the configured StackMemory URL is reachable

### Save Failed

- Reconnect from the popup
- Refresh the current tab
- Reload the extension

## Privacy

- Your API key is stored only in the browser
- Captured data is sent only to your configured StackMemory server
- Nothing is shared with third parties by the extension itself

## Support

Contact: `support@stackmemory.dev`

---

**StackMemory**  
Shared memory for AI coding workflows.

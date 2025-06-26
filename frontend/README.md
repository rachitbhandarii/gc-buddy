# Classroom Data Fetcher Chrome Extension

## Setup

1. Go to the [Google Cloud Console](https://console.developers.google.com/), create a project, and enable the Google Classroom API.
2. Create OAuth2 credentials for a Chrome extension. Set the authorized JavaScript origin to `chrome-extension://<YOUR_EXTENSION_ID>`.
3. Copy your OAuth2 client ID and replace `YOUR_CLIENT_ID` in `manifest.json`.
4. Load the extension in Chrome:
   - Go to chrome://extensions
   - Enable Developer Mode
   - Click "Load unpacked" and select this folder
5. Open Google Classroom and use the extension! 
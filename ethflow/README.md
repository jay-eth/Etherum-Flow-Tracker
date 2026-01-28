ethflow/README.md

ethflow — Ethereum Flow Tracker (static frontend module)

Overview
This folder contains a small self-contained frontend module that visualizes/tracks Ethereum "flows" (transfers, events, or other on-chain activity). It is implemented as a static web app composed of:
- index.html — main markup / UI shell
- app.js — application logic (fetching, parsing, rendering)
- style.css — styles and layout

This README explains what each file does, how to run the module locally, how to configure common runtime values, deployment options, troubleshooting, and suggestions for extending the module.

Quick summary
- Local preview: serve the folder with a static HTTP server (recommended) or open index.html directly for very simple demos.
- Configuration: edit a small set of variables in app.js (RPC/API endpoints, polling interval, filters). Look for clearly marked placeholders in app.js.
- Deployment: can be hosted as any static site (GitHub Pages, Netlify, Vercel, S3 + CloudFront, etc.).

Files
- index.html
  - Main HTML entrypoint that includes UI elements and loads style.css and app.js.
  - Contains the UI structure where flow data is rendered (tables, cards, charts, etc. — depends on current markup).
- app.js
  - Contains the client-side JavaScript that drives the module: data fetching (RPC or API), decoding/parsing, UI updates, event listeners, and any state management.
  - Look for a configuration section near the top of the file with constants (RPC_URL, API endpoints, API keys, contract filters, polling intervals). Update these to match your environment.
- style.css
  - CSS rules used by index.html to lay out and style the UI. Modify for brand colors, spacing, responsive breakpoints, and accessibility improvements.

Local development / preview
Because many browsers block certain network requests from file:// origin or require CORS, serving the folder with a local HTTP server is recommended.

Option A — Python 3 (simple):
1. cd path/to/repo/ethflow
2. python -m http.server 8000
3. Open http://localhost:8000/ in your browser (or http://localhost:8000/index.html)

Option B — Node (http-server):
1. cd path/to/repo/ethflow
2. npx http-server -p 8000
3. Open http://localhost:8000/

Option C — Live reload (dev):
1. cd path/to/repo/ethflow
2. npx live-server . --port=8000
3. Use the automatic reload while editing files.

Minimal Node Express static server (example)
Create a file server.js in the parent folder:
const express = require('express');
const app = express();
app.use(express.static(__dirname + '/ethflow'));
app.listen(3000, () => console.log('Serving on http://localhost:3000'));
Run:
node server.js

Configuration (what to update in app.js)
Open app.js and look for obvious constants or comments. Typical values you may need to set:
- RPC provider or API endpoint
  - Example: const RPC_URL = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
  - Or: const API_BASE = 'https://api.example.com/ethflow';
- API keys / tokens
  - Example: const ETHERSCAN_KEY = 'YOUR_KEY';
- Filters / addresses / contracts
  - CONTRACT_WHITELIST = ['0x...', '0x...']
- Polling / refresh interval
  - POLL_INTERVAL_MS = 15000
- Display limits
  - PAGE_SIZE = 50

Important: Never embed private keys or secrets in a public repo. If the app requires secret credentials, use a proxy server that injects secrets server-side.

How the app typically works (high-level)
- app.js will either:
  - query a backend API that exposes processed flow records, or
  - connect directly to an Ethereum RPC provider (via fetch to a gateway, or through a library) to retrieve logs/transactions and decode them in-browser.
- It parses results into a UI-friendly model and renders them into index.html (tables, lists, or charts).
- It may poll periodically or subscribe to websocket/head updates depending on configuration.

Deployment
This is a static site—deploy as you would any static app.

GitHub Pages
- Option 1: Use the repository's GitHub Pages setting and point to the branch/folder that contains the ethflow directory (or copy ethflow contents into docs/).
- Option 2: Create a gh-pages branch with built/static files and enable Pages on that branch.

Netlify / Vercel
- Netlify: connect the repo and set the publish directory to ethflow/; deploy.
- Vercel: import the project and set a static build output to the ethflow folder or create a simple build step that does nothing and use ethflow as the root.

S3 + CloudFront
- Upload the contents of the ethflow folder to an S3 bucket configured for static hosting and front with CloudFront.

CORS and mixed-content notes
If app.js requests data from other domains (RPC endpoints or APIs), those endpoints must allow cross-origin requests (CORS). If serving index.html over HTTPS, ensure RPC/API endpoints are also HTTPS (avoid mixed-content errors).

Troubleshooting
- Blank page / UI not rendering
  - Open browser DevTools (Console + Network) to see runtime errors. Check for JS syntax errors or missing resources.
- Network requests failing
  - Check CORS headers and endpoint availability. Try the same request with curl or Postman.
- API keys not working / rate-limited
  - Ensure your key is valid and not exceeded its quota. Use a server-side proxy or paid plan if necessary.
- Data stale
  - Confirm poll interval and whether the backend updates in near-real-time. Also check caching layers.
- Mixed content blocked
  - If Viewing page over HTTPS, ensure all external requests are HTTPS.

Extending the module
- Integrate ethers.js or web3.js in app.js for richer on-chain decoding and signing (if needed).
- Move heavy decoding or historic scanning to a backend service and have this frontend consume the processed API.
- Add a simple backend (Express + a small API) to securely store API keys and do server-side RPC calls to avoid CORS or secret leakage.
- Add charts/visualizations (Chart.js, D3) for temporal views of flows.

Accessibility and performance
- Make sure interactive elements have accessible labels.
- Use aria-live for dynamic updates if meant for screen readers.
- Minimize the number of DOM updates in app.js; batch renders or use requestAnimationFrame for smoother UI updates.

Contributing
- Small fixes: open pull requests that change only the ethflow/ files.
- When changing behavior: include clear README updates, and document new configuration steps or API keys.
- PR checklist: tested locally, no console errors, follow existing style in style.css.

Security notes
- Never commit private keys or long-lived secrets.
- Avoid storing secrets in client-side JS if the site is public.
- Rate-limit and validate any user input used in queries.

License & attribution
- Inherit license from repository root (see root LICENSE).
- Author: update to your name/email if desired.

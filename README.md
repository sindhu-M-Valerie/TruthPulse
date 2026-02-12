# TruthPulse
Real-Time Intelligence on Emerging Digital Harm/ Tracking Patterns. Protecting Truth.

TruthPulse is a real-time civic risk intelligence platform focused on detecting emerging misinformation campaigns, coordinated hate activity, and online exploitation risks across India’s digital ecosystem.

Operating as a 24/7 signal dashboard, TruthPulse aggregates publicly available data, verified reports, and trend signals to identify coordinated narrative amplification and harmful campaign patterns.

The platform is designed to prioritize behavioral analysis and ecosystem-level insights rather than amplifying harmful content.

## Mission

Strengthen digital resilience by helping institutions and civil society identify, understand, and respond to evolving online harms responsibly.

## What TruthPulse Does

- Monitors early signals of coordinated misinformation and manipulation campaigns.
- Tracks harmful amplification behavior and campaign infrastructure patterns.
- Surfaces exploitation and civic risk indicators from trusted, publicly available sources.
- Provides live situational awareness through a continuous monitoring dashboard.

## Trust & Safety Principles

- **Safety-first analysis:** Focus on behaviors, patterns, and coordination signals.
- **No harm amplification:** Avoid reproducing or boosting toxic and manipulative content.
- **Context over virality:** Emphasize ecosystem insights, not sensational snippets.
- **Responsible use:** Support prevention, research, and policy response with care.

## Who It Supports

- Researchers and civic integrity analysts
- Digital safety and Trust & Safety teams
- Journalists and investigative networks
- Policymakers and institutional response teams

## Platform Focus

TruthPulse is built to provide timely, actionable intelligence on online risk dynamics while maintaining a clear commitment to responsible analysis, public-interest outcomes, and digital ecosystem resilience in India.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Run Locally

1. Install dependencies:
	```bash
	npm install
	```
2. Start the app:
	```bash
	npm start
	```
3. Open:
	- Dashboard: http://localhost:3000
	- Health API: http://localhost:3000/api/health
	- Signals API: http://localhost:3000/api/signals
	- Live Sources API: http://localhost:3000/api/live-sources

### Development Mode

```bash
npm run dev
```

The current UI is intentionally styled with a newspaper-inspired visual theme (paper texture background, masthead layout, and editorial panels) to match the product identity direction.

## Deploy via GitHub Pages

TruthPulse can be deployed to GitHub Pages as a static frontend.

### 1) Push to `main`

This repo now includes [/.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml), which publishes the `public` folder to GitHub Pages on every push to `main`.

### 2) Enable Pages (once)

In GitHub repo settings:
- Go to **Settings → Pages**
- Under **Build and deployment**, choose **GitHub Actions**

### 3) Configure backend API URL (required for live data)

GitHub Pages only hosts static files. The API (`/api/live-sources`, `/api/signals`, etc.) must run on a backend host.

Set your backend URL in [public/runtime-config.js](public/runtime-config.js):

```js
window.TRUTHPULSE_API_BASE = 'https://your-backend-host.com';
```

If left empty, the frontend calls relative `/api/*` routes (works for local Node server).

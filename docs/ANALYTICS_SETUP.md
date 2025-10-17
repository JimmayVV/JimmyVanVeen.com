# GoatCounter Analytics Setup Guide

This guide walks through setting up GoatCounter analytics for the portfolio website.

## Overview

The analytics implementation uses:

- **Privacy-first tracking** via GoatCounter's lightweight API
- **Server-side tracking** via GoatCounter Measurement API (bypasses ad blockers)
- **Pageviews-only** - Simple, focused analytics without complex event tracking
- **Provider-agnostic architecture** - Easy to swap analytics services if needed
- **Type-safe** implementation with TypeScript

## Why GoatCounter?

- **Free for hobby projects** - Up to 100,000 pageviews/month, commercial use allowed
- **Privacy-focused** - No cookies, GDPR compliant by design
- **Lightweight** - Fast, simple analytics without the bloat
- **Open source** - Transparent, auditable code
- **No ads or tracking** - Clean, straightforward visitor analytics

## Prerequisites

1. A GoatCounter account (free signup at [goatcounter.com](https://www.goatcounter.com/))
2. A site code (chosen during signup)

## Step 1: Sign Up for GoatCounter

1. Go to [https://www.goatcounter.com/signup](https://www.goatcounter.com/signup)
2. Choose a site code (e.g., "jimmyvanveen")
   - This will be your subdomain: `jimmyvanveen.goatcounter.com`
   - Can only contain letters, numbers, hyphens, and underscores
3. Enter your email address
4. Agree to the Terms of Service and Privacy Policy
5. Click **Sign up**
6. Verify your email address

## Step 2: Get Your API Token

1. Log in to your GoatCounter account
2. Go to **Settings** > **Password, MFA, API**
3. Scroll to **API tokens** section
4. Click **Generate new token**
5. Give it a name: "Portfolio Server-side Tracking"
6. **Copy the token** - you'll only see it once!
   - Save it securely in your password manager

## Step 3: Configure Environment Variables

Add the following to `config/env/.env`:

```bash
# GoatCounter Analytics Configuration
GOATCOUNTER_SITE_CODE="jimmyvanveen"  # Replace with your site code
GOATCOUNTER_API_TOKEN="your_api_token_here"  # Replace with your API token

# Optional: Enable debug mode for detailed logging
GOATCOUNTER_DEBUG="false"
```

### Environment Variable Details

- **GOATCOUNTER_SITE_CODE** (required)
  - Your GoatCounter site code (subdomain)
  - Format: Alphanumeric, hyphens, underscores only
  - Example: `"jimmyvanveen"`

- **GOATCOUNTER_API_TOKEN** (required)
  - Your GoatCounter API token
  - Format: Long alphanumeric string
  - Found in: Settings > Password, MFA, API > API tokens

- **GOATCOUNTER_DEBUG** (optional)
  - Set to `"true"` to enable detailed payload logging
  - Useful for debugging tracking issues
  - Default: `"false"`

## Step 4: Deploy to Netlify

### Add Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site configuration** > **Environment variables**
4. Add the following variables:
   - **Variable**: `GOATCOUNTER_SITE_CODE`
     **Value**: Your site code (e.g., `jimmyvanveen`)
   - **Variable**: `GOATCOUNTER_API_TOKEN`
     **Value**: Your API token from Step 2

5. Click **Save**
6. Redeploy your site for changes to take effect

### Deploy Previews and Staging

By default, **deploy previews and branch previews will NOT track analytics**. This is intentional because:

- Preview deployments are temporary testing environments
- You likely don't want test traffic in your production analytics
- The site will function normally without analytics configured

If you need separate analytics for staging/previews, you can:

1. Create a second GoatCounter site (e.g., `yoursite-staging`)
2. Add context-specific environment variables in Netlify for the `deploy-preview` context
3. Keep production and staging analytics completely separate

## Step 5: Verify Tracking

### Local Testing

1. Set `GOATCOUNTER_DEBUG="true"` in your `.env` file
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Navigate to `http://localhost:5173`
4. Check the server console for debug logs:
   ```
   [goatcounter] Sending to GoatCounter: {
     "hits": [
       {
         "path": "/",
         "title": "Home",
         ...
       }
     ]
   }
   ```

### Production Verification

1. Deploy your site with GoatCounter credentials configured
2. Visit your live site
3. Log in to your GoatCounter dashboard at `https://{your-site-code}.goatcounter.com`
4. You should see pageviews appearing in real-time

## Architecture

### Client-Side Flow

1. User visits page
2. `clientLoader` in route calls `analytics.page()`
3. `analytics.client.ts` checks privacy settings (DNT, opt-out)
4. If allowed, sends pageview to `/api/events` with metadata
5. Server forwards to GoatCounter

### Server-Side Flow

1. Receive event at `/api/events`
2. Validate and sanitize event data
3. Add server-side context (IP, user agent, timestamp)
4. Send to GoatCounter API
5. Return success to client

### Privacy Controls

- **Do Not Track (DNT)**: Automatically respected
- **User Opt-out**: Available via `analytics.optOut()`
- **No cookies**: GoatCounter doesn't use cookies
- **Server-side tracking**: Bypasses client-side ad blockers
- **GDPR compliant**: No PII collected

## Tracked Data

GoatCounter tracks **pageviews only**. Each pageview includes:

| Property  | Description  | Example                 |
| --------- | ------------ | ----------------------- |
| `path`    | URL path     | `/blog/my-post`         |
| `title`   | Page title   | `"My Blog Post"`        |
| `ref`     | Referrer URL | `"https://google.com"`  |
| `session` | Session ID   | Generated automatically |

### No Custom Events

Unlike GA4, GoatCounter is **pageviews-only**. There's no tracking for:

- Click events
- Errors
- Timing/performance metrics
- Custom user events

This simplicity is intentional - GoatCounter focuses on answering "who's visiting which pages?"

## Using Analytics in Your Code

### Track a Page View

Page views are tracked automatically via `clientLoader` in routes:

```tsx
// app/routes/_index.tsx
import { ClientLoaderFunctionArgs } from "react-router";

import { analytics } from "~/utils/analytics.client";

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  // Track page view
  await analytics.page();

  return null;
}
```

### Manual Tracking

Track custom paths:

```tsx
import { analytics } from "~/utils/analytics.client";

// Track a specific page
await analytics.page("/custom-path");

// Track with additional properties (passed to page title, etc.)
await analytics.page("/pricing", {
  utm_source: "twitter",
});
```

### Privacy Controls

```tsx
import { analytics } from "~/utils/analytics.client";

// Opt out of tracking
analytics.optOut();

// Opt back in
analytics.optIn();

// Check opt-out status
const hasOptedOut = analytics.isOptedOut();
```

## Troubleshooting

### Events not appearing in GoatCounter

1. **Check environment variables**

   ```bash
   # Verify they're set correctly
   echo $GOATCOUNTER_SITE_CODE
   echo $GOATCOUNTER_API_TOKEN
   ```

2. **Enable debug mode**

   ```bash
   GOATCOUNTER_DEBUG="true"
   ```

   Check server logs for API errors

3. **Verify site code format**
   - Should be alphanumeric, hyphens, underscores only
   - No spaces or special characters

4. **Check API token**
   - Must be a valid API token from Settings
   - Token should be long (50+ characters)
   - Create a new one if unsure

5. **Check Netlify environment variables**
   - Ensure variables are set in Netlify Dashboard
   - Redeploy after adding variables

### Common Issues

**"GoatCounter environment variables not configured"**

- Environment variables are missing
- Check `config/env/.env` file locally
- Check Netlify Dashboard > Environment Variables for production

**"Invalid GOATCOUNTER_SITE_CODE format"**

- Site code should only contain letters, numbers, hyphens, underscores
- No spaces or special characters

**"Invalid GOATCOUNTER_API_TOKEN"**

- API token should be 50+ characters
- Get a fresh token from Settings > Password, MFA, API

**Events tracked locally but not in production**

- Ensure environment variables are set in Netlify
- Go to Netlify Dashboard > Site Settings > Environment Variables
- Redeploy your site after adding variables

## GoatCounter Dashboard

### Accessing Your Dashboard

Visit `https://{your-site-code}.goatcounter.com` (e.g., `https://jimmyvanveen.goatcounter.com`)

### Key Metrics

1. **Pages**
   - Most viewed pages
   - View counts per page
   - Unique visitor counts

2. **Referrers**
   - Where visitors come from
   - Social media, search engines, direct traffic

3. **Browsers**
   - Browser usage statistics
   - Screen sizes
   - Operating systems

4. **Locations**
   - Country/region of visitors
   - Privacy-friendly (no exact locations)

### Export Data

GoatCounter allows CSV exports of all your data:

1. Go to Settings > Export
2. Select date range
3. Download CSV

## Running Tests

Verify the analytics implementation with automated tests:

```bash
# Run unit and integration tests
npm run test

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage
```

## Performance

- **Minimal overhead**: ~2KB JavaScript (vs 45KB+ for GA4)
- **Fast API**: Pageview tracking completes in <100ms
- **Non-blocking**: Failed requests don't impact user experience
- **Rate limiting**: 60 requests/minute per IP (prevents abuse)

## Privacy & Compliance

- ✅ **No cookies** - GoatCounter doesn't use cookies
- ✅ **GDPR compliant** - No PII collected by default
- ✅ **Respects DNT** (Do Not Track) header
- ✅ **User opt-out** available via `analytics.optOut()`
- ✅ **Open source** - Transparent, auditable tracking
- ✅ **EU-friendly** - Data hosted in EU (if you choose EU servers)

## Limitations

- **Pageviews only** - No custom event tracking
- **Basic metrics** - Not as feature-rich as GA4
- **Free tier limits** - 100k pageviews/month (upgrade available)
- **Self-hosted option** - Requires technical setup (not covered here)

## Switching Providers

Thanks to the provider-agnostic architecture, switching analytics providers is easy:

1. Create a new provider in `app/utils/analytics/providers/`
2. Implement the `AnalyticsProvider` interface
3. Register in `app/routes/api.events.tsx`
4. Update environment variables

Example providers that could be added:

- Plausible
- Umami
- Fathom
- Matomo
- Custom solution

## Additional Resources

- [GoatCounter Documentation](https://www.goatcounter.com/help)
- [GoatCounter API Reference](https://www.goatcounter.com/api)
- [GoatCounter GitHub](https://github.com/arp242/goatcounter)
- [React Router Docs](https://reactrouter.com/start/library/routing)

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review server logs with `GOATCOUNTER_DEBUG="true"`
3. Verify GoatCounter dashboard shows your site
4. Check Netlify deploy logs for environment variable issues
5. Visit [GoatCounter support](https://www.goatcounter.com/help/support)

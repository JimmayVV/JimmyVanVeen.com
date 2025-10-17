# Google Analytics 4 (GA4) Setup Guide

This guide walks through setting up Google Analytics 4 tracking for the portfolio website.

## Overview

The analytics implementation uses:

- **Client-side tracking** via a vendor-agnostic analytics service
- **Server-side tracking** via GA4 Measurement Protocol (bypasses ad blockers)
- **Privacy-first approach** with DNT support and opt-out functionality
- **Type-safe** implementation with TypeScript

## Prerequisites

1. A Google Analytics 4 account
2. A GA4 property and data stream configured

## Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (bottom left gear icon)
3. In the **Property** column, click **Create Property**
4. Fill in property details:
   - **Property name**: "Jimmy Van Veen Portfolio" (or your preferred name)
   - **Reporting time zone**: Your timezone
   - **Currency**: Your preferred currency
5. Click **Next** and complete the setup wizard

## Step 2: Create Data Stream

1. In your new property, go to **Admin** > **Data Streams**
2. Click **Add stream** > **Web**
3. Configure the stream:
   - **Website URL**: `https://jimmyvanveen.com` (or your domain)
   - **Stream name**: "Portfolio Website"
   - **Enhanced measurement**: Enable recommended events
4. Click **Create stream**

## Step 3: Get Measurement ID

1. In your data stream details, find the **Measurement ID**
   - Format: `G-XXXXXXXXXX`
   - This is your `GA4_MEASUREMENT_ID`
2. Copy this value for later

## Step 4: Create Measurement Protocol API Secret

The Measurement Protocol allows server-side event tracking.

1. In your data stream, scroll to **Measurement Protocol API secrets**
2. Click **Create**
3. Give it a name: "Portfolio Server-side Tracking"
4. Click **Create**
5. Copy the **Secret value** - this is your `GA4_API_SECRET`
   - ⚠️ **Important**: You can only see this value once! Save it securely.

## Step 5: Configure Environment Variables

Add the following to `config/env/.env`:

```bash
# Google Analytics 4 (GA4) Configuration
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"  # Replace with your Measurement ID
GA4_API_SECRET="your_api_secret_here"  # Replace with your API Secret

# Optional: Enable debug mode for detailed logging
GA4_DEBUG="false"
```

### Environment Variable Details

- **GA4_MEASUREMENT_ID** (required)
  - Your GA4 property's Measurement ID
  - Format: `G-XXXXXXXXXX`
  - Found in: GA4 Admin > Data Streams > [Your Stream]

- **GA4_API_SECRET** (required)
  - Measurement Protocol API secret
  - Format: Base64-like string, 20+ characters
  - Found in: GA4 Admin > Data Streams > [Your Stream] > Measurement Protocol API secrets

- **GA4_DEBUG** (optional)
  - Set to `"true"` to enable detailed payload logging
  - Useful for debugging tracking issues
  - Default: `"false"`

## Step 6: Verify Configuration

### Local Testing

1. Set `GA4_DEBUG="true"` in your `.env` file
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Navigate to `http://localhost:5173`
4. Check the server console for GA4 debug logs:
   ```
   Sending to GA4: {
     "client_id": "...",
     "events": [
       {
         "name": "page_view",
         "params": { ... }
       }
     ]
   }
   ```

### Production Verification

1. Deploy your site with GA4 credentials configured
2. Visit your live site
3. In GA4, go to **Reports** > **Realtime**
4. You should see active users within 30 seconds

### Debug View in GA4

1. In GA4, go to **Configure** > **DebugView**
2. Visit your site with `GA4_DEBUG="true"` enabled
3. You'll see events in real-time with full details

## Step 7: Run Tests

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

## Architecture

### Client-Side Flow

1. User visits page
2. `clientLoader` in route calls `trackPageView()`
3. `analytics.client.ts` checks privacy settings (DNT, opt-out)
4. If allowed, sends event to `/api/events` with client metadata
5. Server enriches event and forwards to GA4

### Server-Side Flow

1. Receive event at `/api/events`
2. Validate and sanitize event data
3. Add server-side context (IP, user agent, timestamp)
4. Send to GA4 Measurement Protocol API
5. Return success to client

### Privacy Controls

- **Do Not Track (DNT)**: Automatically respected
- **User Opt-out**: Available via `analytics.optOut()`
- **Client ID**: Stored in localStorage for consistency
- **Server-side tracking**: Bypasses client-side ad blockers

## Tracked Events

### Standard Events

| Event       | Description         | Properties                                 |
| ----------- | ------------------- | ------------------------------------------ |
| `page_view` | Page navigation     | `page_path`, `page_location`, `page_title` |
| `click`     | User clicks         | `element`, custom properties               |
| `error`     | JavaScript errors   | `error_message`, `error_stack`             |
| `timing`    | Performance metrics | `timing_name`, `timing_duration`           |

### Custom Events

Add custom tracking in your components:

```tsx
import { useAnalytics } from "~/utils/analytics.client";

function MyComponent() {
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.trackClick("cta_button", { location: "hero" });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Troubleshooting

### Events not appearing in GA4

1. **Check environment variables**

   ```bash
   # Verify they're set correctly
   echo $GA4_MEASUREMENT_ID
   echo $GA4_API_SECRET
   ```

2. **Enable debug mode**

   ```bash
   GA4_DEBUG="true"
   ```

   Check server logs for GA4 API errors

3. **Verify Measurement ID format**
   - Should be `G-XXXXXXXXXX` (exactly 10 characters after `G-`)

4. **Check GA4 Realtime reports**
   - Events can take 24-48 hours to appear in standard reports
   - Use **Realtime** view for immediate verification

5. **Verify API Secret**
   - Must be a valid Measurement Protocol API secret
   - Create a new one if unsure

### Common Issues

**"GA4 credentials not configured"**

- Environment variables are missing
- Check `config/env/.env` file

**"Invalid GA4_MEASUREMENT_ID format"**

- Measurement ID should match: `G-[A-Z0-9]{10}`
- No spaces or extra characters

**"Invalid GA4_API_SECRET format"**

- API Secret should be 20+ characters
- Alphanumeric with dashes/underscores

**Events tracked locally but not in production**

- Ensure environment variables are set in Netlify
- Go to Netlify Dashboard > Site Settings > Environment Variables

## GA4 Dashboard Setup

### Recommended Reports

1. **Realtime Overview**
   - Path: Reports > Realtime
   - Shows active users and current page views

2. **Pages and Screens**
   - Path: Reports > Engagement > Pages and screens
   - Most viewed pages on your site

3. **Events**
   - Path: Reports > Engagement > Events
   - All tracked events with counts

4. **Traffic Acquisition**
   - Path: Reports > Acquisition > Traffic acquisition
   - Where visitors come from

### Custom Dimensions

Create custom dimensions for better insights:

1. Go to **Configure** > **Custom definitions**
2. Click **Create custom dimension**
3. Useful dimensions:
   - `client_id` (Dimension name: "Client ID", Event parameter: `client_id`)
   - `page_path` (Dimension name: "Page Path", Event parameter: `page_path`)

## Performance Considerations

- Events are sent asynchronously (non-blocking)
- Failed analytics requests don't impact user experience
- Rate limiting prevents abuse (60 requests/minute per IP)
- Serverless-friendly with in-memory rate limiting

## Privacy & Compliance

- ✅ Respects DNT (Do Not Track) header
- ✅ Allows user opt-out via `analytics.optOut()`
- ✅ No third-party cookies
- ✅ Client IDs are anonymized UUIDs
- ✅ Server-side tracking for privacy
- ✅ No PII (Personally Identifiable Information) collected

## Additional Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Measurement Protocol Guide](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [React Router Docs](https://reactrouter.com/start/library/routing)

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review server logs with `GA4_DEBUG="true"`
3. Verify GA4 Realtime reports
4. Check Netlify deploy logs for environment variable issues

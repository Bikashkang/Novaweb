# Payment API "Failed to fetch" Error - Fix Guide

## Problem
The payment button shows "Failed to fetch" error because the API server URL is not configured for production.

## Solution

### Option 1: Deploy API Server (Recommended)

1. **Deploy your API server** to a hosting service (e.g., Railway, Render, Fly.io, or your own server)

2. **Set the API URL** in your frontend environment variables:

   Add to `.env.local` (or your production environment):
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```

   For example:
   ```env
   NEXT_PUBLIC_API_URL=https://api.novahdl.com
   ```

3. **Update CORS** in `apps/api/src/main.ts`:
   ```typescript
   app.enableCors({
     origin: process.env.FRONTEND_URL || 'https://www.novahdl.com',
     credentials: true,
   });
   ```

4. **Redeploy your frontend** with the new environment variable

### Option 2: Use Same Domain (If API is on same server)

If your API is running on the same domain as your frontend:

1. Set up a reverse proxy (e.g., Nginx) to route `/api/*` to your API server
2. Update `src/lib/payments/payments.ts` to use relative URLs:
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
   ```

### Option 3: Temporary - Use ngrok for Testing

For quick testing, you can expose your local API:

```bash
# Install ngrok
npm install -g ngrok

# Expose local API
ngrok http 3001

# Use the ngrok URL in .env.local
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
```

## Current Status

✅ Error handling improved - now shows clear error messages
✅ Network errors are properly caught and displayed
⚠️ API URL needs to be configured for production

## Testing

After setting up the API URL:

1. Open browser console (F12)
2. Try to make a payment
3. Check the console for any errors
4. The error message should now be more descriptive

## Next Steps

1. Deploy your API server to production
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Update CORS settings in API
4. Test payment flow end-to-end

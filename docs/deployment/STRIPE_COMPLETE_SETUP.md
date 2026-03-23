# Stripe Setup Notes

This document is legacy. Use these current references instead:

- [DEPLOYMENT.md](DEPLOYMENT.md) for the production backend and webhook path
- [STRIPE_ENVIRONMENT_SETUP.md](STRIPE_ENVIRONMENT_SETUP.md) for the current billing environment variables
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for the release checklist

Current production Stripe routing:

- Frontend calls the Render backend through `VITE_API_URL`
- Stripe webhooks target `https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`
- Netlify billing functions are legacy proxies only

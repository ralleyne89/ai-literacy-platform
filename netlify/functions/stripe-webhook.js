const { proxyToBackend } = require("./_backendProxy");

exports.handler = async (event) =>
  proxyToBackend(event, {
    backendPath: "/api/billing/webhooks/stripe",
    method: "POST",
    methods: "POST, OPTIONS",
    allowedHeaders: "Content-Type, Stripe-Signature",
    includeStripeSignature: true,
  });

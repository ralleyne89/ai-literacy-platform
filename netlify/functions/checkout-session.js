const { proxyToBackend } = require("./_backendProxy");

exports.handler = async (event) =>
  proxyToBackend(event, {
    backendPath: "/api/billing/checkout-session",
    method: "POST",
    methods: "POST, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  });

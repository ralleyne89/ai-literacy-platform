const { proxyToBackend } = require("./_backendProxy");

exports.handler = async (event) =>
  proxyToBackend(event, {
    backendPath: "/api/billing/subscription",
    method: "GET",
    methods: "GET, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  });

const { proxyToBackend } = require("./_backendProxy");

exports.handler = async (event) =>
  proxyToBackend(event, {
    backendPath: "/api/billing/config",
    method: "GET",
    methods: "GET, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  });

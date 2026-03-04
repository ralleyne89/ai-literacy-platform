const DEFAULT_ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, Cache-Control, Stripe-Signature";
const DEFAULT_EXPOSED_HEADERS = "Content-Type, Authorization";
const DEFAULT_MAX_AGE = "86400";

const stripTrailingSlash = (value) => (value || "").replace(/\/+$/, "");

const getRequestOrigin = (event = {}) => {
  const headers = event.headers || {};
  return headers.origin || headers.Origin || headers.ORIGIN || "";
};

const resolveAllowedOrigin = (event = {}) => {
  const configuredOrigin = stripTrailingSlash(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "");
  const requestOrigin = getRequestOrigin(event);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (requestOrigin) {
    return stripTrailingSlash(requestOrigin);
  }

  return "http://localhost:5173";
};

const buildCorsHeaders = (event = {}, options = {}) => {
  const {
    methods = DEFAULT_ALLOWED_METHODS,
    allowedHeaders = DEFAULT_ALLOWED_HEADERS,
    exposeHeaders = DEFAULT_EXPOSED_HEADERS,
    allowCredentials = true,
    maxAge = DEFAULT_MAX_AGE
  } = options;

  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(event),
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Expose-Headers": exposeHeaders,
    "Access-Control-Allow-Credentials": allowCredentials ? "true" : "false",
    "Access-Control-Max-Age": String(maxAge),
    "Vary": "Origin"
  };
};

module.exports = {
  buildCorsHeaders
};

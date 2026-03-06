const { buildCorsHeaders } = require("./_cors");

const stripTrailingSlash = (value) => String(value || "").trim().replace(/\/+$/, "");

const getBackendBaseUrl = () => stripTrailingSlash(process.env.BACKEND_API_URL || process.env.VITE_API_URL || "");

const normalizePath = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const getHeaderValue = (headers, candidates) => {
  for (const candidate of candidates) {
    const value = headers?.[candidate];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const buildBackendUrl = (path, rawQueryString = "") => {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    return "";
  }

  const query = String(rawQueryString || "").trim();
  const suffix = query ? `?${query}` : "";
  return `${baseUrl}${normalizePath(path)}${suffix}`;
};

const buildForwardHeaders = (event, { includeStripeSignature = false } = {}) => {
  const headers = event.headers || {};
  const forwardHeaders = {
    Accept: "application/json",
  };

  const contentType = getHeaderValue(headers, ["content-type", "Content-Type"]);
  if (contentType) {
    forwardHeaders["Content-Type"] = contentType;
  }

  const authorization = getHeaderValue(headers, ["authorization", "Authorization"]);
  if (authorization) {
    forwardHeaders.Authorization = authorization;
  }

  if (includeStripeSignature) {
    const stripeSignature = getHeaderValue(headers, ["stripe-signature", "Stripe-Signature"]);
    if (stripeSignature) {
      forwardHeaders["Stripe-Signature"] = stripeSignature;
    }
  }

  return forwardHeaders;
};

const getRequestBody = (event) => {
  if (!event.body) {
    return undefined;
  }

  if (event.isBase64Encoded) {
    return Buffer.from(event.body, "base64");
  }

  return event.body;
};

const proxyToBackend = async (
  event,
  {
    backendPath,
    method,
    methods,
    allowedHeaders = "Content-Type, Authorization, Stripe-Signature",
    includeStripeSignature = false,
  }
) => {
  const headers = buildCorsHeaders(event, {
    methods: methods || `${method}, OPTIONS`,
    allowedHeaders,
  });

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== method) {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const backendUrl = buildBackendUrl(backendPath, event.rawQueryString);
  if (!backendUrl) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: "Backend billing API is not configured",
        details: "Set BACKEND_API_URL or VITE_API_URL for Netlify proxy functions.",
      }),
    };
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: buildForwardHeaders(event, { includeStripeSignature }),
      body: method === "GET" || method === "HEAD" ? undefined : getRequestBody(event),
    });

    const responseBody = await response.text();
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
      body: responseBody,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Unable to reach backend billing API",
        details: error.message,
      }),
    };
  }
};

module.exports = {
  proxyToBackend,
};

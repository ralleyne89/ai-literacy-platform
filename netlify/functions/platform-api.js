const { buildCorsHeaders } = require("./_cors");

const FUNCTION_PATH = "/.netlify/functions/platform-api";
const API_PATH = "/api";
const ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Cache-Control",
  "Stripe-Signature",
  "apikey",
  "x-client-info",
  "x-supabase-api-version",
].join(", ");

const stripTrailingSlash = (value) => String(value || "").trim().replace(/\/+$/, "");

const normalizePath = (value) => {
  const path = String(value || "").trim();
  if (!path || path === "/") {
    return API_PATH;
  }

  return path.startsWith("/") ? path : `/${path}`;
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

const getRequestUrlPath = (event) => {
  if (event.rawUrl) {
    try {
      return new URL(event.rawUrl).pathname;
    } catch {
      // Fall back to event.path below.
    }
  }

  return event.path || "";
};

const resolveBackendPath = (event) => {
  const candidates = [getRequestUrlPath(event), event.path].filter(Boolean);

  for (const candidate of candidates) {
    const path = normalizePath(candidate);

    if (path === API_PATH || path.startsWith(`${API_PATH}/`)) {
      return path;
    }

    if (path === FUNCTION_PATH) {
      return API_PATH;
    }

    if (path.startsWith(`${FUNCTION_PATH}/`)) {
      return `${API_PATH}/${path.slice(`${FUNCTION_PATH}/`.length)}`;
    }
  }

  return API_PATH;
};

const getBackendBaseUrl = () =>
  stripTrailingSlash(
    process.env.BACKEND_API_URL ||
      process.env.SUPABASE_PLATFORM_API_URL ||
      process.env.VITE_PLATFORM_API_URL ||
      process.env.VITE_API_URL ||
      ""
  );

const isRecursiveBackend = (event, backendBaseUrl) => {
  if (!backendBaseUrl || !event.rawUrl) {
    return false;
  }

  try {
    return new URL(backendBaseUrl).origin === new URL(event.rawUrl).origin;
  } catch {
    return false;
  }
};

const buildBackendUrl = (event) => {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl || isRecursiveBackend(event, backendBaseUrl)) {
    return "";
  }

  const query = String(event.rawQueryString || "").trim();
  const suffix = query ? `?${query}` : "";
  return `${backendBaseUrl}${resolveBackendPath(event)}${suffix}`;
};

const buildForwardHeaders = (event) => {
  const headers = event.headers || {};
  const forwardHeaders = {
    Accept: getHeaderValue(headers, ["accept", "Accept"]) || "application/json",
  };

  const contentType = getHeaderValue(headers, ["content-type", "Content-Type"]);
  if (contentType) {
    forwardHeaders["Content-Type"] = contentType;
  }

  const authorization = getHeaderValue(headers, ["authorization", "Authorization"]);
  if (authorization) {
    forwardHeaders.Authorization = authorization;
  }

  const apiKey = getHeaderValue(headers, ["apikey", "ApiKey", "APIKey"]);
  if (apiKey) {
    forwardHeaders.apikey = apiKey;
  }

  const clientInfo = getHeaderValue(headers, ["x-client-info", "X-Client-Info"]);
  if (clientInfo) {
    forwardHeaders["x-client-info"] = clientInfo;
  }

  const stripeSignature = getHeaderValue(headers, ["stripe-signature", "Stripe-Signature"]);
  if (stripeSignature) {
    forwardHeaders["Stripe-Signature"] = stripeSignature;
  }

  return forwardHeaders;
};

const getRequestBody = (event) => {
  if (!event.body) {
    return undefined;
  }

  return event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
};

const isBodylessMethod = (method) => method === "GET" || method === "HEAD";

exports.handler = async (event) => {
  const headers = buildCorsHeaders(event, {
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
  });

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  const backendUrl = buildBackendUrl(event);
  if (!backendUrl) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: "Platform API proxy is not configured",
        details: "Set BACKEND_API_URL or SUPABASE_PLATFORM_API_URL to the Supabase platform-api Edge Function URL.",
      }),
    };
  }

  try {
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers: buildForwardHeaders(event),
      body: isBodylessMethod(event.httpMethod) ? undefined : getRequestBody(event),
    });

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
      body: await response.text(),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Unable to reach platform API",
        details: error.message,
      }),
    };
  }
};

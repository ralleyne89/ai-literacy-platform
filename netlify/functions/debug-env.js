// Debug function to check all environment variables
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Get all VITE_ prefixed variables (these are exposed to frontend)
  const viteVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      viteVars[key] = process.env[key];
    }
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      viteVariables: viteVars,
      url: process.env.URL,
      frontendUrl: process.env.FRONTEND_URL,
      nodeEnv: process.env.NODE_ENV,
    }, null, 2),
  };
};


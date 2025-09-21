import { getToken } from "next-auth/jwt";

const DJ = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// raw body for multipart passthrough
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Rebuild the original querystring from the incoming URL
function getQueryString(req) {
  const i = req.url.indexOf("?");
  return i >= 0 ? req.url.slice(i) : "";
}

// Ensure Django gets the trailing slash when method has a body
function ensureTrailingSlash(path, method) {
  // For skills endpoints, always preserve/add trailing slash
  if (path.startsWith("skills/")) {
    return path.endsWith("/") ? path : path + "/";
  }
  
  // For other endpoints with body methods
  const needsBody = !["GET", "HEAD"].includes(method);
  if (needsBody && !path.endsWith("/")) return path + "/";
  
  return path;
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    const token = await getToken({ req });
    const { path = [] } = req.query;

    const joined = Array.isArray(path) ? path.join("/") : String(path || "");
    const safePath = ensureTrailingSlash(joined, req.method);
    const url = `${DJ}/api/accounts/${safePath}${getQueryString(req)}`;

    // Enhanced debugging for profile requests
    if (safePath.includes('me') || safePath.includes('users')) {
      console.log("=== API PROXY REQUEST DEBUG ===");
      console.log("Method:", req.method);
      console.log("Final URL:", url);
      console.log("Token object:", token ? 'PRESENT' : 'MISSING');
      console.log("Token access field:", !!token?.access);
      if (token?.access) {
        console.log("Access token preview:", token.access.substring(0, 50) + "...");
      }
    }

    const headers = {};

    // Preserve ALL multipart-related headers exactly as received
    const importantHeaders = [
      'content-type',
      'content-length', 
      'content-encoding',
      'transfer-encoding'
    ];

    importantHeaders.forEach(headerName => {
      if (req.headers[headerName]) {
        headers[headerName] = req.headers[headerName];
      }
    });

    if (token?.access) {
      headers.authorization = `Bearer ${token.access}`;
    }

    if (safePath.includes('me') || safePath.includes('users')) {
      console.log("Authorization header set:", !!headers.authorization);
      console.log("Authorization header preview:", headers.authorization ? 
        headers.authorization.substring(0, 20) + "..." : "none");
    }

    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readRawBody(req);

    // Use Node.js native fetch with better options
    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (body) {
      fetchOptions.body = body;
    }

    const upstream = await fetch(url, fetchOptions);

    if (safePath.includes('me') || safePath.includes('users')) {
      console.log("=== DJANGO RESPONSE ===");
      console.log("Status:", upstream.status);
      console.log("Status Text:", upstream.statusText);
      
      // Log response body for debugging
      const responseText = await upstream.text();
      console.log("Response body preview:", responseText.substring(0, 200));
      
      // Convert back to buffer for forwarding
      const buf = Buffer.from(responseText);
      
      const ct = upstream.headers.get("content-type");
      if (ct) res.setHeader("content-type", ct);
      
      res.status(upstream.status).send(buf);
      return;
    }

    // For non-profile requests, handle normally
    const buf = Buffer.from(await upstream.arrayBuffer());
    
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("content-length", cl);

    res.status(upstream.status).send(buf);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
}
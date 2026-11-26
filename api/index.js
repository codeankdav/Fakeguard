import app from "../artifacts/api-server/dist/app.mjs";

export default function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const subPath = url.searchParams.get("__path");
  if (subPath !== null) {
    url.searchParams.delete("__path");
    const qs = url.searchParams.toString();
    req.url = `/api/${subPath}${qs ? `?${qs}` : ""}`;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = req.url === "/" ? "/api" : `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}

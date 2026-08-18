import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const pathname = request.url === "/" ? "/index.html" : new URL(request.url, "http://127.0.0.1").pathname;
    const relative = normalize(pathname).replace(/^[/\\]+/, "");
    const body = await readFile(join(root, relative));
    response.writeHead(200, { "Content-Type": mime[extname(relative)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

try {
  const targets = ["/", "/styles.css", "/app.js", "/data/airports.json"];
  const results = [];
  for (const target of targets) {
    const response = await fetch(`http://127.0.0.1:${port}${target}`);
    const bytes = (await response.arrayBuffer()).byteLength;
    if (!response.ok || !bytes) throw new Error(`${target} returned ${response.status} with ${bytes} bytes`);
    results.push(`${target} ${response.status} (${bytes.toLocaleString()} bytes)`);
  }
  console.log(`Local HTTP smoke passed: ${results.join(", ")}`);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

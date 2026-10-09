const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 4173;
const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".png": "image/png"
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = urlPath === "/" ? "index.html" : urlPath.slice(1);
    const file = path.resolve(root, relative);

    if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end("Forbidden");
        return;
    }

    fs.readFile(file, (error, data) => {
        if (error) {
            res.writeHead(404).end("Not found");
            return;
        }
        res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
        res.end(data);
    });
}).listen(port, "127.0.0.1", () => {
    console.log(`Solucion Hotelera en http://localhost:${port}/ (Ctrl+C para detener)`);
});

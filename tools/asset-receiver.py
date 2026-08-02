# Dev-only helper. Accepts a base64 payload over POST and writes it into
# assets/img/. Used to pull browser-encoded WebP back onto disk without a
# native image toolchain. Not part of the site; do not deploy.
#
#   python tools/asset-receiver.py 4322
#   POST http://localhost:4322/upload?name=foo.webp   body: <base64>

import base64
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "img")


class Receiver(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        name = (query.get("name") or ["upload.bin"])[0]

        # Never let a posted name escape assets/img.
        name = os.path.basename(name)
        if not name or name.startswith("."):
            self.send_response(400)
            self._cors()
            self.end_headers()
            self.wfile.write(b"bad name")
            return

        length = int(self.headers.get("Content-Length") or 0)
        payload = self.rfile.read(length)
        try:
            data = base64.b64decode(payload, validate=True)
        except Exception as exc:
            self.send_response(400)
            self._cors()
            self.end_headers()
            self.wfile.write(("decode failed: %s" % exc).encode())
            return

        os.makedirs(OUT_DIR, exist_ok=True)
        path = os.path.join(OUT_DIR, name)
        with open(path, "wb") as fh:
            fh.write(data)

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(("wrote %s (%d bytes)" % (name, len(data))).encode())

    def log_message(self, fmt, *args):
        sys.stderr.write("[receiver] " + (fmt % args) + "\n")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4322
    print("asset-receiver listening on %d -> %s" % (port, OUT_DIR))
    HTTPServer(("127.0.0.1", port), Receiver).serve_forever()

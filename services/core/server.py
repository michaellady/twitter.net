"""Core service - Tweet domain logic."""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8081


class CoreHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "core"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[core] {args[0]}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), CoreHandler)
    print(f"Core service listening on port {PORT}")
    server.serve_forever()

"""Frontend service - Web UI."""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 3000


class FrontendHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "frontend"}).encode())
        elif self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<html><body><h1>twitter.net</h1><p>Coming soon...</p></body></html>")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[frontend] {args[0]}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), FrontendHandler)
    print(f"Frontend service listening on port {PORT}")
    server.serve_forever()

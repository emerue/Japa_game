"""Local test server for the phone (via adb reverse): like `python3 -m http.server`,
but tells the browser never to cache, so every reload runs the latest code.

Usage: python3 -I tools/dev_server.py [port]   (default 5174)
"""
import http.server
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5174
http.server.ThreadingHTTPServer(("127.0.0.1", port), NoCache).serve_forever()

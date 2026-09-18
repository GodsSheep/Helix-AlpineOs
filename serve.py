import http.server
import socketserver
import os
import sys
import subprocess

PORT = 3000
DIRECTORY = "dist"

class V86HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable SharedArrayBuffer for v86 (WebAssembly multi-threading)
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        # Prevent caching during development
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

def build_app():
    print("Building Helix PWA...")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print("Build successful.")
    except subprocess.CalledProcessError:
        print("Build failed. Please check the logs.")
        sys.exit(1)

def serve():
    if not os.path.exists(DIRECTORY):
        build_app()
    
    Handler = V86HTTPRequestHandler
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Helix local server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--build":
        build_app()
    serve()

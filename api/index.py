import os
import sys
from pathlib import Path

# Locate backend directory dynamically
current_file = Path(__file__).resolve()
possible_backend_dirs = [
    current_file.parent.parent / 'backend',
    current_file.parent / 'backend',
    Path('/var/task/backend'),
    Path('/var/task'),
    current_file.parent,
]

for b_dir in possible_backend_dirs:
    if b_dir.exists() and (b_dir / 'core').exists():
        sys.path.insert(0, str(b_dir))
        break

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    from django.core.wsgi import get_wsgi_application
    app = get_wsgi_application()
    handler = app
    application = app
except Exception as e:
    import json
    def fallback_app(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps({'status': 'error', 'detail': str(e)}).encode('utf-8')]
    app = fallback_app
    handler = app
    application = app

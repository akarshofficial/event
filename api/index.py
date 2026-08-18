import os
import sys
import traceback
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
        if str(b_dir) not in sys.path:
            sys.path.insert(0, str(b_dir))
        break

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

_django_app = None
_migrated = False

def get_app():
    global _django_app, _migrated
    if _django_app is None:
        import django
        django.setup()

        if not _migrated:
            try:
                from django.core.management import call_command
                call_command('migrate', interactive=False)
                _migrated = True
            except Exception as migrate_err:
                print(f"Notice on auto-migration: {migrate_err}")

        from django.core.wsgi import get_wsgi_application
        _django_app = get_wsgi_application()
    return _django_app

def handler(environ, start_response):
    try:
        app = get_app()
        return app(environ, start_response)
    except Exception as e:
        status = '500 Internal Server Error'
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', '*'),
            ('Access-Control-Allow-Headers', '*'),
        ]
        start_response(status, headers)
        import json
        error_payload = {
            'status': 'error',
            'detail': str(e),
            'traceback': traceback.format_exc(),
            'sys_path': sys.path,
        }
        return [json.dumps(error_payload, indent=2).encode('utf-8')]

app = handler
application = handler

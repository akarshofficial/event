import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = str(Path(__file__).resolve().parent.parent / 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if '/var/task/backend' not in sys.path:
    sys.path.insert(0, '/var/task/backend')

if '/var/task' not in sys.path:
    sys.path.insert(0, '/var/task')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
handler = app
application = app

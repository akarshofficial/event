import os
import sys
from pathlib import Path

# Locate and add backend to sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent / 'backend'

for candidate in [
    backend_dir,
    current_dir / 'backend',
    Path('/var/task/backend'),
    Path('/var/task'),
    current_dir.parent,
]:
    if candidate.exists() and (candidate / 'core').exists():
        cand_str = str(candidate)
        if cand_str not in sys.path:
            sys.path.insert(0, cand_str)
        break

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Auto-apply database migrations if needed
try:
    import django
    django.setup()
    from django.core.management import call_command
    call_command('migrate', interactive=False)
except Exception as err:
    print(f"Auto-migration notice: {err}")

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
handler = app
application = app

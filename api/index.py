def app(environ, start_response):
    status = '200 OK'
    headers = [('Content-Type', 'application/json'), ('Access-Control-Allow-Origin', '*')]
    start_response(status, headers)
    return [b'{"status": "ok", "message": "Serverless Python is working!"}']

handler = app
application = app

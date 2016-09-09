#!/usr/bin/python

from flask import Flask, send_from_directory, stream_with_context, Response
import requests



BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.xml'


# Setup Flask app.
app = Flask(__name__)
app.static_folder = '.'  # just serve up from root
app.debug = True


# index
@app.route('/')
def root():
    return app.send_static_file('index.html')


# static files
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)


# proxy bikeshare stations to get around CORS issues
@app.route('/stations/stations.xml')
def bikeshare_proxy():
    req = requests.get(BIKESHARE_URL, stream=True)
    return Response(stream_with_context(req.iter_content()),
                    content_type=req.headers['content-type'])



if __name__ == '__main__':
    app.run()

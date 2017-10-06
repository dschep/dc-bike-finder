#!/usr/bin/python

import requests
from flask import (Flask, Response, jsonify, request, send_from_directory,
                   stream_with_context)

BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.json'
MOBIKE_URL = 'https://mwx.mobike.com/mobike-api/rent/nearbyBikesInfo.do'
LIMEBIKE_URL = 'https://web-production.lime.bike/api/public/v1/views/bikes'


# Setup Flask app.
app = Flask(__name__)
app.static_folder = '.'  # just serve up from root


# index
@app.route('/')
def root():
    return app.send_static_file('static/index.html')


# static files
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('static', path)


# proxy bikeshare stations to get around CORS issues
@app.route('/stations/stations.json')
def bikeshare_proxy():
    resp = requests.get(BIKESHARE_URL, stream=True)
    return Response(stream_with_context(resp.iter_content()),
                    content_type=resp.headers['content-type'])


# proxy mobike
@app.route('/mobike')
def mobike_proxy():
    resp = requests.post(
        MOBIKE_URL,
        params={
            'longitude': request.args.get('longitude', ''),
            'latitude': request.args.get('latitude', ''),
        },
        headers={'Referer': 'https://servicewechat.com/'},
    )
    return jsonify(resp.json())


# proxy limebike
@app.route('/limebike')
def limebike_proxy():
    resp = requests.get(
        LIMEBIKE_URL,
        params={
            'map_center_latitude': request.args.get('latitude', ''),
            'map_center_longitude': request.args.get('longitude', ''),
            'user_latitude': request.args.get('latitude', ''),
            'user_longitude': request.args.get('longitude', ''),
        },
    )
    return jsonify(resp.json())



if __name__ == '__main__':
    app.run()

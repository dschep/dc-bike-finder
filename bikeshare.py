import requests

import slscrypt
from slsutils import cors, jsonify


BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.json'
MOBIKE_URL = 'https://mwx.mobike.com/mobike-api/rent/nearbyBikesInfo.do'
LIMEBIKE_URL = 'https://web-production.lime.bike/api/public/v1/views/bikes'
OFO_URL = 'http://one.ofo.so/nearbyofoCar'


@cors
@jsonify
def bikeshare_proxy(event, context):
    resp = requests.get(BIKESHARE_URL)
    return resp.json()


@cors
@jsonify
def mobike_proxy(event, context):
    resp = requests.post(
        MOBIKE_URL,
        params={
            'longitude': event['queryStringParameters'].get('longitude', ''),
            'latitude': event['queryStringParameters'].get('latitude', ''),
        },
        headers={'Referer': 'https://servicewechat.com/'},
    )
    return resp.json()


@cors
@jsonify
def limebike_proxy(event, context):
    resp = requests.get(
        LIMEBIKE_URL,
        params={
            'map_center_latitude': event['queryStringParameters'].get('latitude', ''),
            'map_center_longitude': event['queryStringParameters'].get('longitude', ''),
            'user_latitude': event['queryStringParameters'].get('latitude', ''),
            'user_longitude': event['queryStringParameters'].get('longitude', ''),
        },
    )
    return resp.json()


@cors
@jsonify
def ofo_proxy(event, context):
    resp = requests.post(
        OFO_URL,
        data={
            'lat': event['queryStringParameters'].get('latitude', ''),
            'lng': event['queryStringParameters'].get('longitude', ''),
            'token': slscrypt.get('OFO_TOKEN'),
            'source': '1',
        },
    )
    return resp.json()

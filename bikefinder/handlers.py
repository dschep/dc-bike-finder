import os

import boto3
import requests
from lambda_decorators import cors_headers, json_http_resp

from bikefinder.models import Bike, Bikes
from bikefinder.util import database, search_points


BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.json'
MOBIKE_URL = 'https://mwx.mobike.com/mobike-api/rent/nearbyBikesInfo.do'
LIMEBIKE_URL = 'https://web-production.lime.bike/api/public/v1/views/bikes'
OFO_URL = 'http://one.ofo.so/nearbyofoCar'
MBIKE_URL = 'https://zapi.zagster.com/api/v1/bikeshares/7768436bbb7442b809bce34c/stations'


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def bikeshare_proxy(event, context):
    resp = requests.get(BIKESHARE_URL)
    return resp.json()


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
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


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
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


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def ofo_proxy(event, context):
    resp = requests.post(
        OFO_URL,
        data={
            'lat': event['queryStringParameters'].get('latitude', ''),
            'lng': event['queryStringParameters'].get('longitude', ''),
            'token': boto3.client('ssm').get_parameter(
                Name=f"/bikefinder/{os.environ.get('STAGE', '')}/ofo_token",
                WithDecryption=True,
            )['Parameter']['Value'],
            'source': '1',
        },
    )
    return resp.json()


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def mbike_proxy(event, context):
    resp = requests.get(MBIKE_URL)
    return resp.json()


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
@database
def jump(event, context):
    return Bikes(Bike(**record) for record in context.db.query(
        "select * from bikes where provider='JUMP'")).geojson


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
@database
def mobike_all(event, context):
    return Bikes(Bike(**record) for record in context.db.query(
        "select * from bikes where provider='mobike'")).geojson


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def search_pattern(event, context):
    return {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat],
                },
            }
            for lat, lng in search_points()
        ]
    }

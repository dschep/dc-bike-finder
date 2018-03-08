import os

import boto3
import requests
from lambda_decorators import cors_headers, json_http_resp

from bikefinder.models import Bike, Bikes
from bikefinder.util import database, search_points


BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.json'
MOBIKE_GBFS_URL = 'https://mobike.com/us/gbfs/v1/free_bike_status'
MOBIKE_URL = 'https://mwx.mobike.com/mobike-api/rent/nearbyBikesInfo.do'
LIMEBIKE_URL = 'https://lime.bike/api/partners/v1/bikes'
LIMEBIKE_HEADERS = {'Authorization': 'Bearer limebike-PMc3qGEtAAXqJa'}
LIMEBIKE_PARAMS = {'region': 'Washington DC Proper'}
OFO_URL = 'http://ofo-global.open.ofo.com/api/bike'
OFO_DATA = {
    'token':'c902b87e3ce8f9f95f73fe7ee14e81fe',
    'name':'Washington',
    'lat': 38.894432,
    'lng': -77.013655,
}
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
def mobike_gbfs_proxy(event, context):
    resp = requests.get(MOBIKE_GBFS_URL)
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
        headers=LIMEBIKE_HEADERS,
        params=LIMEBIKE_PARAMS,
    )
    return resp.json()


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def ofo_proxy(event, context):
    resp = requests.post(
        OFO_URL,
        data=OFO_DATA,
    )
    return resp.json()


def ofo_request_token(event, context):
    """
    Request a totp token be sent to your phone.

    Event keys:
        * tel
        * ccc
        * lat
        * lng
    """
    resp = requests.post('https://one.ofo.com/verifyCode_v2', data={**event, 'type': 1})
    return resp.json()


def ofo_login_with_token(event, context):
    """
    Login with a totp token sent to your phone.

    Event keys:
        * tel
        * ccc
        * lat
        * lng
        * code
    """
    resp = requests.post('https://one.ofo.com/api/login_v2', data=event)
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

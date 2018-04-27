import os
import json

import boto3
import requests
from lambda_decorators import cors_headers, json_http_resp


BIKESHARE_URL = 'http://feeds.capitalbikeshare.com/stations/stations.json'
MOBIKE_GBFS_URL = 'https://mobike.com/us/gbfs/v1/free_bike_status'
LIMEBIKE_URL = 'https://lime.bike/api/partners/v1/bikes'
LIMEBIKE_HEADERS = {'Authorization': 'Bearer limebike-PMc3qGEtAAXqJa'}
LIMEBIKE_PARAMS = {'region': 'Washington DC Proper'}
OFO_URL = 'http://ofo-global.open.ofo.com/api/bike'
OFO_DATA = {
    'token':'c902b87e3ce8f9f95f73fe7ee14e81fe',
    'name':'Washington',
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


@cors_headers(origin=os.environ.get('CORS_ORIGIN', 'localhost'),
              credentials=True)
@json_http_resp
def mbike_proxy(event, context):
    resp = requests.get(MBIKE_URL)
    return resp.json()

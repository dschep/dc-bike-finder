import json
import logging
import os

import boto3
import requests
from attr import asdict
from lambda_decorators import no_retry_on_failure

from bikefinder.handlers import (
    bikeshare_proxy,
    MOBIKE_URL,
    LIMEBIKE_URL, LIMEBIKE_HEADERS, LIMEBIKE_PARAMS,
    OFO_URL, OFO_DATA)
from bikefinder.models import Bike, Bikes
from bikefinder.util import database, fully_unwrap_function, search_points


logger = logging.getLogger(__name__)

get_bikeshare = fully_unwrap_function(bikeshare_proxy)

@no_retry_on_failure
def scrape_bikeshare(event, context):
    get_bikeshare(event, context)

def save_to_db(bikes, db):
    for bike in bikes:
        db.query("""
                 insert into bike_locations (provider, bike_id, location, raw)
                 values (:provider, :bike_id, :location, :raw)
                 """, **asdict(bike))

@no_retry_on_failure
@database
def scrape_jump(event, context):
    resp = requests.get('https://dc.jumpmobility.com/opendata/free_bike_status.json')
    bikes = Bikes.from_gbfs_json(resp.json(), 'JUMP')
    save_to_db(bikes, context.db)
    return bikes.geojson

@no_retry_on_failure
@database
def scrape_spin(event, context):
    resp = requests.get('https://web.spin.pm/api/gbfs/v1/free_bike_status')
    bikes = Bikes.from_gbfs_json(resp.json(), 'spin')
    save_to_db(bikes, context.db)
    return bikes.geojson

@no_retry_on_failure
@database
def scrape_limebike(event, context):
    resp = requests.get(
        LIMEBIKE_URL,
        headers=LIMEBIKE_HEADERS,
        params=LIMEBIKE_PARAMS,
    )
    bikes = Bikes.from_limebike_json(resp.json())
    save_to_db(bikes, context.db)
    return bikes.geojson

@no_retry_on_failure
@database
def scrape_ofo(event, context):
    resp = requests.post(
        OFO_URL,
        data=OFO_DATA,
    )
    bikes = Bikes.from_ofo_json(resp.json())
    save_to_db(bikes, context.db)
    return bikes.geojson

async def fetch(session, url):
        async with session.get(url) as response:
            return await response.json()

async def get_mobike(session, lat, lng):
    resp = await session.post(
        MOBIKE_URL,
        params={
            'longitude': str(lng),
            'latitude': str(lat)
        },
        headers={'Referer': 'https://servicewechat.com/'},
    )
    try:
        bikes = Bikes.from_mobike_json(await resp.json())
        print(f'found {len(bikes)} at {lat}, {lng}')
        return bikes
    except:
        print(f'{resp.status_code} response')

@database
def scrape_mobike(event, context):
    if event.get('coords') is None:
        for lat, lng in search_points():
            boto3.client('lambda').invoke(
                InvocationType='Event',
                FunctionName=f'bikefinder-{os.environ["STAGE"]}-scrape_mobike',
                Payload=json.dumps({'coords': [lat, lng]}))
    else:
        lat, lng = event['coords']
        resp = requests.post(MOBIKE_URL, params={
            'longitude': str(lng),
            'latitude': str(lat)
        }, headers={'Referer': 'https://servicewechat.com/'})
        bikes = Bikes.from_mobike_json(resp.json())
        save_to_db(bikes, context.db)
        print(f'found {len(bikes)} at {lat}, {lng}')
        return bikes.geojson

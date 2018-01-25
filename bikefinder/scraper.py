import asyncio
import logging
from random import shuffle

import aiohttp
import requests
from attr import asdict
from lambda_decorators import no_retry_on_failure, async_handler

from bikefinder.handlers import bikeshare_proxy, MOBIKE_URL
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
    bikes = Bikes.from_sobi_json(resp.json())
    save_to_db(bikes, context.db)
    return Bikes(Bike(**record) for record in context.db.query('select * from bikes')).geojson


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

@no_retry_on_failure
@database
@async_handler
async def scrape_mobike(event, context):
    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        resps = []
        points = list(search_points())
        shuffle(points)
        for lat, lng in points:
            resps.append(get_mobike(session, lat, lng))
        for bikes in asyncio.as_completed(resps, timeout=600):
            save_to_db(await bikes, context.db)

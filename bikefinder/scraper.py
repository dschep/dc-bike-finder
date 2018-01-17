import requests
from attr import asdict
from lambda_decorators import no_retry_on_failure

from bikefinder.handlers import bikeshare_proxy
from bikefinder.models import Bike, Bikes
from bikefinder.util import database, fully_unwrap_function


get_bikeshare = fully_unwrap_function(bikeshare_proxy)

@no_retry_on_failure
def scrape_bikeshare(event, context):
    get_bikeshare(event, context)

@no_retry_on_failure
@database
def scrape_jump(event, context):
    resp = requests.get('https://dc.jumpmobility.com/opendata/free_bike_status.json')
    bikes = Bikes.from_sobi_json(resp.json())
    for bike in bikes:
        context.db.query("""
                         insert into bike_locations (provider, bike_id, location, raw)
                         values (:provider, :bike_id, :location, :raw)
                         """, **asdict(bike))
    return Bikes(Bike(**record) for record in context.db.query('select * from bikes')).geojson

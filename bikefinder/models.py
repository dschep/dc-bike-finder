import json
from collections import UserList
from datetime import datetime

from postgis import Point
from attr import dataclass, asdict

@dataclass
class Bike:
    provider: str
    bike_id: str
    location: Point
    location_id: int = None
    created: datetime = None
    raw: bytes = None

    @property
    def geojson(self):
        geojson = self.location.geojson
        geojson['properties'] = asdict(self)
        del geojson['properties']['location']
        if geojson['properties']['created']:
            geojson['properties']['created'] = geojson['properties']['created'].isoformat()
        geojson['id'] = '-'.join([
            geojson['properties']['provider'],
            str(geojson['properties']['bike_id']),
            str(geojson['properties']['location_id']),
        ])
        return geojson

    @classmethod
    def from_gbfs_json(cls, bike, provider):
        return cls(
            provider=provider,
            bike_id=bike['bike_id'],
            location=Point(
                x=bike['lon'],
                y=bike['lat'],
                srid=4326,
            ),
            raw=json.dumps(bike),
        )

    @classmethod
    def from_limebike_json(cls, bike):
        return cls(
            provider='limebike',
            bike_id=bike['id'],
            location=Point(
                x=bike['attributes']['longitude'],
                y=bike['attributes']['latitude'],
                srid=4326,
            ),
            raw=json.dumps(bike),
        )

    @classmethod
    def from_ofo_json(cls, bike, batch_id):
        return cls(
            provider='ofo',
            bike_id=batch_id, # since we can't ID bikes, at least makes batches of bikes correlated
            location=Point(
                x=bike['lng'],
                y=bike['lat'],
                srid=4326,
            ),
            raw=json.dumps(bike),
        )

    @classmethod
    def from_mobike_json(cls, bike):
        return cls(
            provider='mobike',
            bike_id=bike['bikeIds'],
            location=Point(
                x=bike['distX'],
                y=bike['distY'],
                srid=4326,
            ),
            raw=json.dumps(bike),
        )


class Bikes(UserList):
    @property
    def geojson(self):
        return {
            'type': 'FeatureCollection',
            'features': [bike.geojson for bike in self],
        }

    @classmethod
    def from_gbfs_json(cls, json, provider):
        return cls([Bike.from_gbfs_json(bike, provider) for bike in json['data']['bikes']])

    @classmethod
    def from_limebike_json(cls, json):
        return cls([Bike.from_limebike_json(bike) for bike in json['data']])

    @classmethod
    def from_ofo_json(cls, json):
        # since we can't ID bikes, at least makes batches of bikes correlated
        batch_id = f'ofo-{datetime.utcnow().isoformat()}'
        return cls([Bike.from_ofo_json(bike, batch_id) for bike in json['values']['cars']])

    @classmethod
    def from_mobike_json(cls, json):
        return cls([Bike.from_mobike_json(bike) for bike in json['object']])

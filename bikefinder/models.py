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

    @property
    def geojson(self):
        geojson = self.location.geojson
        geojson['properties'] = asdict(self)
        del geojson['properties']['location']
        geojson['properties']['created'] = geojson['properties']['created'].isoformat()
        geojson['id'] = '-'.join([
            geojson['properties']['provider'],
            geojson['properties']['bike_id'],
            str(geojson['properties']['location_id']),
        ])
        return geojson

    @classmethod
    def from_sobi_json(cls, bike):
        return cls(
            provider='JUMP',
            bike_id=bike['id'],
            location=Point(
                x=bike['current_position']['coordinates'][0],
                y=bike['current_position']['coordinates'][1],
                srid=4326,
            ),
        )


class Bikes(UserList):
    @property
    def geojson(self):
        return {
            'type': 'FeatureCollection',
            'features': [bike.geojson for bike in self],
        }

    @classmethod
    def from_sobi_json(cls, json):
        return cls([Bike.from_sobi_json(bike) for bike in json['items']])

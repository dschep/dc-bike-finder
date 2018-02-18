import os

import boto3
import records
from lambda_decorators import LambdaDecorator
from postgis.psycopg import register


def fully_unwrap_function(function):
    """Recursively unwrap a function wrapped with decorators using functools.wraps"""
    if hasattr(function, '__wrapped__'):
        return fully_unwrap_function(function.__wrapped__)
    return function


class database(LambdaDecorator):
    def before(self, event, context):
        self.db = records.Database(boto3.client('ssm').get_parameter(
            Name=f"/bikefinder/{os.environ.get('STAGE', '')}/db_url",
            WithDecryption=True)['Parameter']['Value'])
        register(self.db.db.connection) # self.records_db.sqalchemy_connection.dbapi_connection
        context.db = self.db

        return event, context

    def after(self, response):
        self.db.close()
        self.db._engine.dispose()
        return response

    def on_exception(self, exception):
        if hasattr(self, 'db'): # in cas something went wrong before setting self.db
            self.db.close()
            self.db._engine.dispose()
        raise exception

def seq(start, stop, step=1):
    n = int(round((stop - start)/float(step)))
    if n > 1:
        return([start + step*i for i in range(n+1)])
    else:
        return([])


def search_points(top_left=(39.010, -77.151), bottom_right=(38.812, -76.901),
                  delta_lng=0.007, delta_lat=0.004):
    for lat in seq(bottom_right[0], top_left[0], delta_lat):
        for lng in seq(bottom_right[1], top_left[1], -delta_lng):
            yield (lat, lng)

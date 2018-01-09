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
        register(self.db.db.connection)
        context.db = self.db

        return event, context

    def after(self, response):
        self.db.close()
        return response

    def on_exception(self, exception):
        if hasattr(self, 'db'): # in cas something went wrong before setting self.db
            self.db.close()
        raise exception

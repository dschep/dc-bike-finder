import json
from functools import reduce, wraps
from os import environ


def cors(handler):
    @wraps(handler)
    def wrapped_handler(event, context):
        resp = handler(event, context)
        resp.setdefault('headers', {}).update({
            'Access-Control-Allow-Origin': environ.get('CORS_ORIGIN', 'localhost'),
            'Access-Control-Allow-Credentials': True,
        })
        return resp
    return wrapped_handler


def jsonify(handler):
    @wraps(handler)
    def wrapped_handler(event, context):
        try:
            resp = handler(event, context)
            return {
                'statusCode': 200,
                'body': json.dumps(resp),
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': str(e),
            }
    return wrapped_handler

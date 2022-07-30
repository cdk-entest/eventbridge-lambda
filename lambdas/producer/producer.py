"""
haimtran 29 JUL 2022
send events to eventbridge using boto3
"""
from datetime import datetime
import json
import boto3


eventClient = boto3.client('events')


def handler(event, context):
    """
    send event to enventbridge 
    """
    request_body = event['body']
    print(request_body)
    resp = eventClient.put_events(
        Entries=[
            {
                'Time': datetime.now(),
                'Source': 'io.entest.demo',
                'Detail': json.dumps(request_body),
                'DetailType': 'service_status',
            }
        ]
    )
    print(resp)
    return (
        {
            'message': 'procuder'
        }
    )


# handler(event={"body": {"item1": "test"}}, context={})

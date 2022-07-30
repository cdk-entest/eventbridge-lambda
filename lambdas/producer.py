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
    send three entries to enventbridge
    """
    resp = eventClient.put_events(
        Entries=[
            {
                'Time': datetime.now(),
                'Source': 'io.entest.demo',
                'Detail': json.dumps({'title': 'order event', 'event': event}),
                'DetailType': 'order',
            },
            {
                'Time': datetime.now(),
                'Source': 'io.entest.demo',
                'Detail': json.dumps({'title': 'purchase event', 'event': event}),
                'DetailType': 'purchase',
            }
        ]
    )
    print(resp)
    return (
        {
            'message': 'procuder'
        }
    )


handler(event={"item1": "test"}, context={})

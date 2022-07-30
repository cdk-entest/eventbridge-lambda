"""
haimtran 29 JUL 2022
consum events from eventbridge via rule trigger
"""
import os
import json
import boto3


snsClient = boto3.client('sns')


def handler(event, context):
    """
    consume event and send sns
    """
    # if an sns topic arn avaiable
    if (os.environ['TOPIC_ARN'] != ''):
        snsClient.publish(
            TopicArn=os.environ['TOPIC_ARN'],
            Message=json.dumps(event)
        )
    else:
        pass
    return {
        'message': event
    }


# handler(event={}, context={})

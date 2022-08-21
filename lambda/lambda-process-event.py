import os
import uuid
import boto3

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["TABLE_NAME"])


def handler(event, context):
    print(event)
    # put item to table
    table.put_item(Item={"id": str(uuid.uuid4()), "message": f"{event}"})
    return {"statusCode": "200", "message": f"{event}"}

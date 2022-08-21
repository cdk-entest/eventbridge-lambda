import os
import uuid
import boto3


client = boto3.client("s3")
bucket_name = os.environ["BUCKET_NAME"]


def handler(event, context):
    # body object
    body = b"Hello"
    # put an object in prefix onevent
    resp = client.put_object(
        Bucket=bucket_name, Key=f"onevent/{uuid.uuid4()}", Body=body
    )
    # put object in prefix onrule
    resp = client.put_object(
        Bucket=bucket_name, Key=f"onrule/{uuid.uuid4()}", Body=body
    )
    return {"message": resp}

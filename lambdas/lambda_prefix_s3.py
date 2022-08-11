"""
haimtran 11 AUG 2022
simple lambda process object put from s3
"""


def main(event, context):
    print(event)
    return {
        "title": "process event triggered from s3 with prefix",
        "message": event,
    }

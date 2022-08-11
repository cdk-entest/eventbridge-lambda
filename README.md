## EventBridge with Lambda Producer and Consumer 
  - A lambda procuder sends events to the event bus 
  - A lambda consumer being trigger by the event rule 
  - The event rule map the events to targets (the lamda consumer)
  - [EventPattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html) specify how to match events to targets
  - Use amazon s3 event notification with amazon [eventbridge](https://aws.amazon.com/blogs/aws/new-use-amazon-s3-event-notifications-with-amazon-eventbridge/)
  - [GitHub](https://github.com/entest-hai/eventbridge-lambda)
    

![aws_devops-eventbridge drawio(5)](https://user-images.githubusercontent.com/20411077/181879584-5a57206c-c056-484c-b5ba-b801e7864bf1.png)


## Event Format 
send/put an [event format](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-events.html) by python boto3. Detail field should be a JSON object, that's why json.dumps here, or JSON.stringfy in javascript. 
```py
resp = eventClient.put_events(
  Entries=[
    {
      'Time': datetime.now(),
      'Source': 'io.entest.demo',
      'Detail': json.dumps({"title": "purchase event"}),
      'DetailType': 'purchase',
      'Resources':['arn:aws:lambda...']
    }
  ]
)
```

event rule uses [eventPattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html) to map purchase-event to process purchase lambda 
```tsx
const purchaseRule = new aws_events.Rule(
      this,
      "TriggerProcessPurchaseLambda",
      {
        ruleName: "TriggerProcessPurchaseLambda",
        description: "",
        eventPattern: { source: ["io.entest.demo"], detailType: ["purchase"] },
      }
    );

    purchaseRule.addTarget(
      new aws_events_targets.LambdaFunction(processPurchaseLambda.lambda)
    );
```

received event format in python 
```json 
{
  "version": "0", 
  "id": "9b8aa069-94a8-2283-dcb0-0d3511df4345", 
  "detail-type": "purchase", 
  "source": "io.entest.demo", 
  "account": "ACCOUNT_ID", 
  "time": "2022-07-30T03:22:23Z", 
  "region": "REGION", 
  "resources": ["arn:aws:lambda..."], 
  "detail": {"title": "purchase event"}
  }
```

event sent from S3 to EventBridge has a format as [below](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ev-events.html) 
```json
{
  "version": "0",
  "id": "17793124-05d4-b198-2fde-7ededc63b103",
  "detail-type": "Object Created",
  "source": "aws.s3",
  "account": "111122223333",
  "time": "2021-11-12T00:00:00Z",
  "region": "ca-central-1",
  "resources": [
    "arn:aws:s3:::DOC-EXAMPLE-BUCKET1"
  ],
  "detail": {
    "version": "0",
    "bucket": {
      "name": "DOC-EXAMPLE-BUCKET1"
    },
    "object": {
      "key": "example-key",
      "size": 5,
      "etag": "b1946ac92492d2347c6235b4d2611184",
      "version-id": "IYV3p45BT0ac8hjHg1houSdS1a.Mro8e",
      "sequencer": "617f08299329d189"
    },
    "request-id": "N4N7GDK58NMKJ12R",
    "requester": "123456789012",
    "source-ip-address": "1.2.3.4",
    "reason": "PutObject"
  }
}  
            
```

## CDK Stack 
create lambda producer  
```tsx
    const producerLambda = new aws_lambda.Function(this, "ProducerLambda", {
      functionName: "ProducerLambda",
      code: aws_lambda.Code.fromInline(
        fs.readFileSync(path.join(__dirname, "./../lambdas/producer.py"), {
          encoding: "utf-8",
        })
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_8,
      timeout: Duration.seconds(10),
    });

    producerLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["events:PutEvents"],
      })
    );
```

create a lambda based construct for purchase and order services. 
```tsx
export class LambdaService extends Construct {
  public readonly lambda: aws_lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaServiceProps) {
    super(scope, id);

    const func = new aws_lambda.Function(this, props.functionName, {
      functionName: props.functionName,
      code: aws_lambda.Code.fromInline(
        fs.readFileSync(path.join(__dirname, props.functionCode), {
          encoding: "utf-8",
        })
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_8,
      timeout: Duration.seconds(10),
      // provide a topic arn if want the consumer send sns
      environment: {
        TOPIC_ARN: props.topicArn ? props.topicArn : "",
      },
    });

    func.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["sns:*"],
      })
    );

    this.lambda = func;
  }
}
```

event rule map purchase-events to process purchase lambda 
```tsx
const purchaseRule = new aws_events.Rule(
      this,
      "TriggerProcessPurchaseLambda",
      {
        ruleName: "TriggerProcessPurchaseLambda",
        description: "",
        eventPattern: { source: ["io.entest.demo"], detailType: ["purchase"] },
      }
    );

    purchaseRule.addTarget(
      new aws_events_targets.LambdaFunction(processPurchaseLambda.lambda)
    );
```
event rule map order-lambda to process order lambda  
```tsx
const orderRule = new aws_events.Rule(this, "TriggerProcessOrderLambda", {
      ruleName: "TriggerProcessOrderLambda",
      description: "",
      eventPattern: { source: ["io.entest.demo"], detailType: ["order"] },
    });

    orderRule.addTarget(
      new aws_events_targets.LambdaFunction(processOrderLambda.lambda)
    );
```

## Lambda Producer 
```py
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
```

## Lambda Consumer 

```py
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

```

## S3 Event and Rule with S3 Prefix 
event sent from S3 to eventbridge has below format 
```json

```

lookup an existed bucket 
```tsx

    const bucket = aws_s3.Bucket.fromBucketName(
      this,
      "S3BucketEventSource",
      props.bucketName
    );

    bucket.enableEventBridgeNotification();
```
lambda function to process the event 
```tsx
 const func = new aws_lambda.Function(this, "ProcessEventS3PutObject", {
      functionName: "ProcessEventS3PutObject",
      code: aws_lambda.Code.fromInline(
        fs.readFileSync(
          path.resolve(__dirname, "./../lambdas/lambda_prefix_s3.py"),
          {
            encoding: "utf-8",
          }
        )
      ),
      handler: "index.main",
      runtime: aws_lambda.Runtime.PYTHON_3_8,
    });
```

then we can a rule as 
```tsx
const eventRule = new aws_events.Rule(
      this,
      "S3PutObjectTriggerLambdaRule",
      {
        ruleName: "S3PutObjectTriggerLambdaRule",
        eventPattern: {
          source: ["aws.s3"],
          detailType: ["Object Created"],
          detail: {
            name: [props.bucketName],
            object: {
              key: [{ prefix: "eventbridge-demo/" }],
            },
          },
        },
      }
    );
```

then add a lambda as a target 
```tsx
eventRule.addTarget(new aws_events_targets.LambdaFunction(func));
```

not forget to grant lambda to read s3 
```tsx
bucket.grantRead(func);
```
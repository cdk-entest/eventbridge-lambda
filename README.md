## EventBridge with Lambda Producer and Consumer 
  - A lambda procuder sends events to the event bus 
  - A lambda consumer being trigger by the event rule 
  - The event rule map the events to targets (the lamda consumer)
  - [EventPattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html) specify how to match events to targets
  
  
 ![aws_devops-eventbridge drawio(2)](https://user-images.githubusercontent.com/20411077/181878378-fe5c6f7a-cbee-416a-9026-7796b9c9021f.png)


## Event Format 
send/put an [event format](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-events.html) in python. Detail should be a JSON object, that's why json.dumps here, or JSON.stringfy in javascript. 
```py
resp = eventClient.put_events(
  Entries=[
    {
      'Time': datetime.now(),
      'Source': 'io.entest.demo',
      'Detail': json.dumps({"title": "order event"}),
      'DetailType': 'order',
      'Resources':['arn:aws:lambda...']
    },
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

event rule to map purchase-event to process purchase lambda 
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
  "detail-type": "service_status", 
  "source": "io.entest.demo", 
  "account": "ACCOUNT_ID", 
  "time": "2022-07-30T03:22:23Z", 
  "region": "REGION", 
  "resources": ["arn:aws:lambda..."], 
  "detail": {"item1": "123"}
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

create lambda based construct for process purchase and order. topic arn is optional when you want the lambda to send notification to emails. 
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

the event pattern in the event rule maps the event source to target. All patterns in side the pattern should be matched. 
```tsx
const consumerRule = new aws_events.Rule(this, "LambdaConsumerRule", {
      ruleName: "TriggerLambdaConsumer",
      description: "",
      eventPattern: { source: ["io.entest.demo"] },
    });

    consumerRule.addTarget(
      new aws_events_targets.LambdaFunction(consumerLambda)
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

## EventBridge with Lambda Producer and Consumer 
  - A lambda procuder sends events to the event bus 
  - A lambda consumer being trigger by the event rule 
  - The event rule map the events to targets (the lamda consumer)
  - [EventPattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html) specify how to match events to targets

send/put an event format in python 
```py
resp = eventClient.put_events(
        Entries=[
            {
                'Time': datetime.now(),
                'Source': 'io.entest.demo',
                'Detail': json.dumps({"item1": "123"}),
                'DetailType': 'service_status',
                'Resources':['arn:aws:lambda...']
            }
        ]
    )

```

a event rule with below event pattern will mapp all events from io.entests.demo to the consumer lambda.
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

create lambda consumer
```tsx
const consumerLambda = new aws_lambda.Function(this, "ConsumerLambda", {
      functionName: "ConsumerLambda",
      code: aws_lambda.Code.fromInline(
        fs.readFileSync(path.join(__dirname, "./../lambdas/consumer.py"), {
          encoding: "utf-8",
        })
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_8,
      timeout: Duration.seconds(10),
      // provide a topic arn if want the consumer send sns
      environment: {
        TOPIC_ARN: props ? props.topicArn : "",
      },
    });

    consumerLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["sns:*"],
      })
    );
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

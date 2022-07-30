import {
  aws_events,
  aws_events_targets,
  aws_lambda,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";

interface EventBridgeProps extends StackProps {
  topicArn: string;
}

export class EventbridgeDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: EventBridgeProps) {
    super(scope, id, props);

    // producer lambda - putEvent iam role
    const producerLambda = new aws_lambda.Function(this, "ProducerLambda", {
      functionName: "ProducerLambda",
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./../lambdas/producer")
      ),
      handler: "producer.handler",
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

    // consumer lambda - event rule - target
    const consumerLambda = new aws_lambda.Function(this, "ConsumerLambda", {
      functionName: "ConsumerLambda",
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./../lambdas/consumer")
      ),
      handler: "consumer.handler",
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

    const consumerRule = new aws_events.Rule(this, "LambdaConsumerRule", {
      ruleName: "TriggerLambdaConsumer",
      description: "",
      eventPattern: { source: ["io.entest.demo"] },
    });

    consumerRule.addTarget(
      new aws_events_targets.LambdaFunction(consumerLambda)
    );
  }
}

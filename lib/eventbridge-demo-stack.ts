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
import * as fs from "fs";

interface EventBridgeProps extends StackProps {
  topicArn: string;
}

export class EventbridgeDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: EventBridgeProps) {
    super(scope, id, props);

    // producer lambda - putEvent iam role
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

    // order consumer - event target rule
    const processOrderLambda = new LambdaService(this, "ProcessOrderFunction", {
      functionName: "ProcessOrderFunction",
      functionCode: "./../lambdas/order.py",
      topicArn: props ? props.topicArn : "",
    });

    const orderRule = new aws_events.Rule(this, "TriggerProcessOrderLambda", {
      ruleName: "TriggerProcessOrderLambda",
      description: "",
      eventPattern: { source: ["io.entest.demo"], detailType: ["order"] },
    });

    orderRule.addTarget(
      new aws_events_targets.LambdaFunction(processOrderLambda.lambda)
    );

    // purchase consumer - event target rule
    const processPurchaseLambda = new LambdaService(
      this,
      "ProcessPurchaseLambda",
      {
        functionName: "ProcessPurchaseLambda",
        functionCode: "./../lambdas/purchase.py",
        topicArn: props ? props.topicArn : "",
      }
    );

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
  }
}

interface LambdaServiceProps {
  functionName: string;
  functionCode: string;
  topicArn?: string;
}

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

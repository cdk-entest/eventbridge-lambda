import {
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_s3,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as fs from "fs";

interface EventBridgeS3Props extends StackProps {
  bucketName: string;
}

export class EventBridgeS3Stack extends Stack {
  constructor(scope: Construct, id: string, props: EventBridgeS3Props) {
    super(scope, id, props);

    const bucket = aws_s3.Bucket.fromBucketName(
      this,
      "S3BucketEventSource",
      props.bucketName
    );

    bucket.enableEventBridgeNotification();

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

    eventRule.addTarget(new aws_events_targets.LambdaFunction(func));

    // lambda need to read s3
    bucket.grantRead(func);
  }
}

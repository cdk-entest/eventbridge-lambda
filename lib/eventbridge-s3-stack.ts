import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";

export class EventBridgeS3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // table to store event
    const table = new cdk.aws_dynamodb.Table(this, "EventTable", {
      tableName: "EventTable",
      partitionKey: {
        name: "id",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // s3 bucket event source
    const bucket = new cdk.aws_s3.Bucket(this, "eventbridge-demo-bucket-1", {
      bucketName: `eventbridge-demo-bucket-${this.account}-1`,
      removalPolicy: RemovalPolicy.DESTROY,
      eventBridgeEnabled: true,
    });

    const func = new cdk.aws_lambda.Function(this, "ProcessEvent", {
      functionName: "ProcessEventS3",
      code: cdk.aws_lambda.Code.fromInline(
        fs.readFileSync(
          path.resolve(__dirname, "./../lambda/lambda-process-event.py"),
          { encoding: "utf-8" }
        )
      ),
      handler: "index.handler",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_7,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // eventbridge rule
    const rule = new cdk.aws_events.Rule(this, "S3EventTriggerLambdaRule", {
      ruleName: "S3EventTriggerLambdaRule",
      eventPattern: {
        // source
        source: ["aws.s3"],

        // match filter
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
          object: {
            key: [{ prefix: "onrule/" }],
          },
        },
      },
    });

    // target lambda
    rule.addTarget(new cdk.aws_events_targets.LambdaFunction(func));

    // another lambda to put objects into s3 in us-east-1
    const testLambda = new cdk.aws_lambda.Function(this, "TestLambda", {
      functionName: "TestLambda",
      code: cdk.aws_lambda.Code.fromInline(
        fs.readFileSync(
          path.resolve(__dirname, "./../lambda/lambda-put-item-s3.py"),
          { encoding: "utf-8" }
        )
      ),
      handler: "index.handler",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_7,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // older way - s3 emit event - lambda
    bucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(func),
      {
        prefix: "onevent/",
      }
    );

    // table grant read  write to lambda
    table.grantReadWriteData(func);
    bucket.grantReadWrite(func);
    bucket.grantReadWrite(testLambda);
  }
}

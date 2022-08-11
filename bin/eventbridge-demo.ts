#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EventbridgeDemoStack } from "../lib/eventbridge-demo-stack";
import { EventBridgeS3Stack } from "../lib/eventbridge-s3-stack";

const app = new cdk.App();

// topic arn is optional - when want lambda send sns
new EventbridgeDemoStack(app, "EventbridgeDemoStack", {
  topicArn: `arn:aws:sns:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:MonitorEc2`,
});

// event pattern s3 prefix
new EventBridgeS3Stack(app, "S3EventPrefixRule", {
  bucketName: "haimtran-workspace",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

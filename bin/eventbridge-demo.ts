#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EventbridgeDemoStack } from "../lib/eventbridge-demo-stack";

const app = new cdk.App();

// topic arn is optional - when want lambda send sns
new EventbridgeDemoStack(app, "EventbridgeDemoStack", {
  topicArn: `arn:aws:sns:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:MonitorEc2`,
});

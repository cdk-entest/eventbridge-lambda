#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EventbridgeLambdaStack } from "../lib/eventbridge-lambda-stack";
import { EventBridgeS3Stack } from "../lib/eventbridge-s3-stack";

const app = new cdk.App();

// lambda pub-sub eventbridge
new EventbridgeLambdaStack(app, "EventBridgeLambda", {
  // topicArn: "arn:aws:sns:ap-southeast-1:874056087589:Hello",
});

// eventbridge s3
new EventBridgeS3Stack(app, "EventBridgeS3Stack", {});

#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EventbridgeDemoStack } from "../lib/eventbridge-demo-stack";

const app = new cdk.App();
new EventbridgeDemoStack(app, "EventbridgeDemoStack");

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsPgsqlRdsTlsStack } from '../lib/aws-pgsql-rds-tls-stack';

const app = new cdk.App();
new AwsPgsqlRdsTlsStack(app, 'AwsPgsqlRdsTlsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
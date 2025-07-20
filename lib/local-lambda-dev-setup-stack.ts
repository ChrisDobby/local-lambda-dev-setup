import * as cdk from "aws-cdk-lib";
import { Code, Function } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class LocalLambdaDevSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "automated-bucket", {
      bucketName: "automated-bucket",
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sqs = new Queue(this, "automated-queue", {
      queueName: "automated-queue",
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambda = new NodejsFunction(this, "automated-lambda", {
      entry: "functions/test/src/index.ts",
      handler: "handler",
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    lambda.addEventSource(
      new SqsEventSource(sqs, {
        batchSize: 10,
      })
    );
    sqs.grantConsumeMessages(lambda);

    const hotReloadedLambda = new Function(this, "test-hot-reload", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      functionName: "test-hot-reload",
      handler: "index.handler",
      code: Code.fromBucket(
        Bucket.fromBucketName(this, "hot-reload", "hot-reload"),
        "/Users/chrisdobby/repos/localstack-automated-starter copy/functions/test/dist"
      ),
    });

    hotReloadedLambda.addEventSource(
      new SqsEventSource(sqs, {
        batchSize: 10,
      })
    );
    sqs.grantConsumeMessages(hotReloadedLambda);
  }
}

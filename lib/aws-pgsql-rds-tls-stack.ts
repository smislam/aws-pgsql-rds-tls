import * as cdk from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, InterfaceVpcEndpointAwsService, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers, Secret as escSecret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class AwsPgsqlRdsTlsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseName = 'demodb';
    const username = 'demouser';
    
    const vpc = new Vpc(this, 'app-vpc', {
      maxAzs: 2,
      natGateways: 1
    });
    
    const vpces = [
      InterfaceVpcEndpointAwsService.ECR,
      InterfaceVpcEndpointAwsService.ECR_DOCKER,
      InterfaceVpcEndpointAwsService.KMS,
      InterfaceVpcEndpointAwsService.STS,
      InterfaceVpcEndpointAwsService.SSM,
      InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      InterfaceVpcEndpointAwsService.CLOUDTRAIL,
      InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      InterfaceVpcEndpointAwsService.AUTOSCALING,
      InterfaceVpcEndpointAwsService.RDS
    ];

    vpces.forEach(vpce => vpc.addInterfaceEndpoint(
      vpce.shortName, {
        service: vpce,
        privateDnsEnabled: true
      }
    ));

    const secret = new Secret(this, 'pgDbSecret', {
      secretName: databaseName,
      description: `${databaseName} secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username
        }),
        generateStringKey: 'password',
        excludeCharacters: `/@" `,
        passwordLength: 28,
      }
    });

    const dbInstance = new DatabaseInstance(this, 'pg-instance', {
      vpc,
      engine: DatabaseInstanceEngine.postgres({version: PostgresEngineVersion.VER_16}),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL),
      databaseName,
      credentials: Credentials.fromSecret(secret),
      instanceIdentifier: databaseName,
      maxAllocatedStorage: 200,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      //Since version 15, this is enabled by default.
      parameters: {
        'rds.force_ssl': '1'
      }
    });   

    const cluster = new Cluster(this, 'Cluster', {vpc});

    const taskDefinition = new FargateTaskDefinition(this, 'my-task-def', {});

    const container = taskDefinition.addContainer('my-app-container', {
      image: ContainerImage.fromAsset('./rdstls'),
      memoryLimitMiB: 256,
      cpu: 256,
      portMappings: [{
        containerPort: 8080,
        hostPort: 8080
      }],
      logging: LogDrivers.awsLogs({streamPrefix: 'my-pgsql-rds-tls-service'}),
      secrets: {
        DB_HOST: escSecret.fromSecretsManager(secret, 'host'),
        DB_PORT: escSecret.fromSecretsManager(secret, 'port'),
        DB_NAME: escSecret.fromSecretsManager(secret, 'dbname'),
        DB_USERNAME: escSecret.fromSecretsManager(secret, 'username'),
        DB_PASSWORD: escSecret.fromSecretsManager(secret, 'password')
      }
    });

    const ecsService = new FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1
    });
    
    dbInstance.connections.allowDefaultPortFrom(ecsService);

    const alb = new ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true
    });

    const listener = alb.addListener('app-listener', {
      port: 80
    });

    listener.addTargets('e2e-target', {
      port: 80,
      targets: [ecsService],
      protocol: ApplicationProtocol.HTTP,
      healthCheck: {
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 10,
        timeout: cdk.Duration.seconds(20),
        interval: cdk.Duration.seconds(30)
      }
    });

    new cdk.CfnOutput(this, 'alb-url', {
      value: alb.loadBalancerDnsName,
      exportName: 'pgsql-rds-tls-stack-loadBalancerDnsName'
    });
    
  }
}

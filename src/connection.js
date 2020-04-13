import AWS from 'aws-sdk'

class Connection {
  constructor (options = {}) {
    this.options = options
    this.awsConfig = {
      region: options.awsRegion,
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    }
  }

  /**
   * Setup AWS Service
   * @param profile
   * @returns {Promise<{config: GlobalConfigInstance; Config: Config; WebIdentityCredentials: WebIdentityCredentials; Request: Request; EventListeners; AWSError: AWSError; TemporaryCredentials: TemporaryCredentials; CognitoIdentityCredentials: CognitoIdentityCredentials; EnvironmentCredentials: EnvironmentCredentials; HTTPOptions: HTTPOptions; HttpResponse: HttpResponse; SAMLCredentials: SAMLCredentials; ECSCredentials: ECSCredentials; Endpoint: Endpoint; CredentialProviderChain: CredentialProviderChain; Service: Service; ProcessCredentials: ProcessCredentials; ChainableTemporaryCredentials: ChainableTemporaryCredentials; EC2MetadataCredentials: EC2MetadataCredentials; IniLoader: IniLoader; Credentials: Credentials; FileSystemCredentials: FileSystemCredentials; SharedIniFileCredentials: SharedIniFileCredentials; Response: Response; MetadataService: MetadataService; RemoteCredentials: RemoteCredentials; HttpRequest: HttpRequest; ElasticTranscoder; MediaConnect; ConnectParticipant; Kafka; MobileAnalytics; SSM; SageMakerRuntime; LexRuntime; QLDBSession; Route53; Lightsail; MachineLearning; GameLift; PI; Chime; Route53Domains; GroundStation; WorkSpaces; S3; ElasticInference; ApiGatewayManagementApi; DynamoDBStreams; CloudWatchLogs; KinesisVideoSignalingChannels; MediaStoreData; LakeFormation; ApplicationInsights; DMS; ManagedBlockchain; MigrationHub; Polly; RDSDataService; ECS; ECR; ResourceGroupsTaggingAPI; Batch; AppSync; EC2InstanceConnect; MediaLive; Connect; Translate; SQS; ComprehendMedical; EMR; StepFunctions; MarketplaceCommerceAnalytics; DAX; DLM; ComputeOptimizer; CognitoSync; CodeStarNotifications; SESV2; EBS; DirectConnect; EC2; PinpointSMSVoice; IoTSecureTunneling; Imagebuilder; ServiceQuotas; ServiceCatalog; CodePipeline; CUR; SavingsPlans; Athena; KinesisVideoArchivedMedia; Backup; ES; DocDB; FMS; RDS; SES; LexModelBuildingService; AutoScaling; Shield; IoTAnalytics; MigrationHubConfig; Schemas; SSOOIDC; MarketplaceMetering; CodeStarconnections; TranscribeService; ELB; Iot; Budgets; Transfer; Personalize; Glacier; CodeBuild; SageMaker; APIGateway; Pricing; WorkMailMessageFlow; EKS; ForecastQueryService; ApiGatewayV2; ImportExport; DataExchange; CloudSearchDomain; IoTJobsDataPlane; ACMPCA; FraudDetector; MediaStore; GlobalAccelerator; Greengrass; WorkDocs; Kinesis; Redshift; LicenseManager; WAFV2; SNS; SecurityHub; Health; ELBv2; Mobile; MediaPackageVod; MarketplaceEntitlementService; CloudTrail; ServiceDiscovery; PersonalizeRuntime; Inspector; SSO; WorkMail; Discovery; CloudFormation; MQ; MediaConvert; CognitoIdentity; AppStream; SMS; MarketplaceCatalog; WAF; CloudWatchEvents; Signer; Route53Resolver; KinesisVideoMedia; ForecastService; CodeStar; DataPipeline; RAM; CodeCommit; Kendra; CloudHSM; RoboMaker; FSx; CodeGuruProfiler; IoT1ClickDevicesService; XRay; DirectoryService; SWF; Detective; CloudFront; SecretsManager; AccessAnalyzer; CloudWatch; ConfigService; SimpleDB; Organizations; QLDB; WorkLink; IoTEventsData; Firehose; S3Control; Rekognition; CostExplorer; IAM; CloudHSMV2; CloudSearch; ServerlessApplicationRepository; Lambda; AppMesh; Comprehend; Support; Amplify; ACM; OpsWorksCM; NetworkManager; GuardDuty; KMS; Cloud9; AugmentedAIRuntime; ElastiCache; DynamoDB; DataSync; Snowball; ApplicationAutoScaling; KinesisAnalyticsV2; KinesisVideo; MTurk; IotData; PinpointEmail; AppConfig; EFS; ResourceGroups; MediaTailor; IoTThingsGraph; AutoScalingPlans; CodeGuruReviewer; Outposts; CognitoIdentityServiceProvider; EventBridge; STS; DeviceFarm; ElasticBeanstalk; Neptune; Macie; Textract; IoT1ClickProjects; MediaPackage; KinesisAnalytics; OpsWorks; CloudDirectory; StorageGateway; Pinpoint; CodeDeploy; Glue; QuickSight; WAFRegional; AlexaForBusiness; PersonalizeEvents; IoTEvents}>}
   */
  async init (profile) {
    if (profile && profile !== 'default') {
      try {
        this.awsConfig.credentials = await new AWS.SharedIniFileCredentials({ profile }).promise()
      } catch (error) {
        throw new Error(`AWS Profile Error: ${error.toString()}`)
      }
    }

    if (this.options.endpoint !== '') {
      this.awsConfig.endpoint = this.options.endpoint
    }

    AWS.config.update(this.awsConfig)

    return AWS
  }

  /**
   * Create connection to AWS S3
   * @returns {Promise<S3>}
   */
  async s3 () {
    return new (await this.init(this.options.s3Profile)).S3()
  }

  /**
   * Create connection to AWS CloudFront
   * @returns {Promise<CloudFront>}
   */
  async cloudFront () {
    return new (await this.init(this.options.cloudFrontProfile)).CloudFront()
  }
}

export default Connection

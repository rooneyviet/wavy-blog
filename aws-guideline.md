# AWSLABS.CORE-MCP-SERVER - How to translate a user query into AWS expert advice

## 1. Initial Query Analysis

When a user presents a query, follow these steps to break it down:

### 1.1 Core Components Identification

- Extract key technical requirements
- Identify business objectives
- Identify industry and use-case requirements
- Note any specific constraints or preferences
- Determine if it's a new project or enhancement

### 1.2 Architecture Patterns

- Identify the type of application (web, mobile, serverless, etc.)
- Determine data storage requirements
- Identify integration points
- Note security and compliance needs

## 2. AWS Service Mapping

### 2.1 Available Tools for Analysis

#### AWS API MCP Server

- Use `awslabs.aws-api-mcp-server` for any general enquiries about AWS resources.
  - suggest_aws_commands: Search AWS CLI commands for APIs that are relevant to the user query.
  - call_aws: Execute AWS CLI commands.

#### CDK MCP Server

- Use `awslabs.cdk-mcp-server` for infrastructure patterns and CDK guidance:
  - CDKGeneralGuidance: Get prescriptive CDK advice for building applications on AWS
  - ExplainCDKNagRule: Explain a specific CDK Nag rule with AWS Well-Architected guidance
  - CheckCDKNagSuppressions: Check if CDK code contains Nag suppressions that require human review
  - GenerateBedrockAgentSchema: Generate OpenAPI schema for Bedrock Agent Action Groups
  - GetAwsSolutionsConstructPattern: Search and discover AWS Solutions Constructs patterns
  - SearchGenAICDKConstructs: Search for GenAI CDK constructs by name or type
  - LambdaLayerDocumentationProvider: Provide documentation sources for Lambda layers

#### Bedrock KB Retrieval MCP Server

- Use `awslabs.bedrock-kb-retrieval-mcp-server` to query user-defined knowledge bases:
  - QueryKnowledgeBases: Query an Amazon Bedrock Knowledge Base using natural language

#### Nova Canvas MCP Server

- Use `awslabs.nova-canvas-mcp-server` to generate images:
  - generate_image: Generate an image using Amazon Nova Canvas with text prompt
  - generate_image_with_colors: Generate an image using Amazon Nova Canvas with color guidance

#### Cost Analysis MCP Server

- Use `awslabs.aws-pricing-mcp-server` for analyzing AWS service costs:
  - analyze_cdk_project: Analyze a CDK project to identify AWS services used
  - get_pricing: Get pricing information from AWS Price List API
  - get_bedrock_patterns: Get architecture patterns for Amazon Bedrock applications
  - generate_cost_report: Generate a detailed cost analysis report based on pricing data

#### AWS Documentation MCP Server

- Use `awslabs.aws-documentation-mcp-server` for requesting specific AWS documentation:
  - read_documentation: Fetch and convert an AWS documentation page to markdown format
  - search_documentation: Search AWS documentation using the official AWS Documentation Search API
  - recommend: Get content recommendations for an AWS documentation page

#### AWS Diagram MCP Server

- Use `awslabs.aws-diagram-mcp-server` fir creating diagrams to support the solution:
  - generate_diagram: Generate a diagram from Python code using the diagrams package.
  - get_diagram_examples: Get example code for different types of diagrams.
  - list_icons: This tool dynamically inspects the diagrams package to find all available providers, services, and icons that can be used in diagrams

#### Terraform MCP Server

- Use `awslabs.terraform-mcp-server` for Terraform infrastructure management and analysis:
  - ExecuteTerraformCommand: Execute Terraform workflow commands (init, plan, validate, apply, destroy) against an AWS account
  - SearchAwsProviderDocs: Search AWS provider documentation for resources and attributes
  - SearchAwsccProviderDocs: Search AWSCC provider documentation for resources and attributes
  - SearchSpecificAwsIaModules: Search for specific AWS-IA Terraform modules (Bedrock, OpenSearch Serverless, SageMaker, Streamlit)
  - RunCheckovScan: Run Checkov security scan on Terraform code to identify vulnerabilities and misconfigurations
  - SearchUserProvidedModule: Search for a user-provided Terraform registry module and understand its inputs, outputs, and usage

### 2.2 Modern AWS Service Categories

Map user requirements to these AWS categories:

#### Compute

- AWS Lambda (serverless functions)
- ECS Fargate (containerized applications)
- EC2 (virtual machines)
- App Runner (containerized web apps)
- Batch (batch processing)
- Lightsail (simplified virtual servers)
- Elastic Beanstalk (PaaS)

#### Storage

- DynamoDB (NoSQL data)
- Aurora Serverless v2 (relational data)
- S3 (object storage)
- OpenSearch Serverless (search and analytics)
- RDS (relational databases)
- DocumentDB
- ElastiCache (in-memory caching)
- FSx (file systems)
- EFS (elastic file system)
- S3 Glacier (long-term archival)

#### AI/ML

- Bedrock (foundation models)
- Bedrock Knowledge Base (knowledge base)
- SageMaker (custom ML models)
- Bedrock

# An Example of SSL/TLS connection to AWS RDS PostgreSQL database from Spring Boot application using AWS CDK

This example demonstrates how SSL/TLS connections can be made from from a Spring Boot application to AWS RDS PostgreSQL database using JDBC.

This project is deployed using AWS CDK in TypeScript.

## What does it build?
* Creates a VPC with Endpoints for Database.  This is required to route database traffic within aws network.
* Creates an AWS RDS PostgreSQL Database with SSL enabled
* Using 'RDS_CA_RDS4096_G1' Certificate Authority so that Database server certificates are rotated automatically
* Creates a Spring Boot application that connects to that Database
* Dockerizes the application
* Downloads the root CA certificate from AWS for use in the application
* Deployes the containerized application to ECS Cluster
* Exposes the API endpoints using AWS ALB

## Steps to run and test
* Deploy the CDK code. Wait for the deploy to finish.  It will print out the Alb endpoint for you to hit.
  * ![image](test-encryption-rds.PNG "Verify SSL/TLS connection to Database ")


## SSL/TLS Considerations
* By default, the RDS databases are already SSL enabled. [See AWS Docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html).
* JDBC client will connect to the server whether we have SSL enforced
* Setting the JDBC connect parameters to SSL and require will enforce the client to use encrypted connection
* The default `sslmode` is set to `prefer`. I've used the `sslmode` to be `verify-full`. This is to validate that I am connecting to the actual server that I trust using certificate exchange.
  * [PostgreSQL documentation](https://jdbc.postgresql.org/documentation/ssl/#configuring-the-client)
  * The [AWS CA Certs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html) can be downloaded for your region here.

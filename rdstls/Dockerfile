FROM maven:3.9.3-amazoncorretto-17 AS BUILDER
WORKDIR /app
COPY . /app
RUN curl -o us-east-1-bundle.crt https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem
RUN mvn clean install -Dspring.profiles.active=dev

FROM amazoncorretto:17-alpine-jdk
WORKDIR /app
COPY --from=BUILDER /app/target/*.jar app.jar
COPY --from=BUILDER /app/*.crt /app/

ENV PORT 8080
EXPOSE ${PORT}
CMD ["java","-jar","app.jar","-Dserver.port=${PORT}"]
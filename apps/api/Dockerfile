# Multi-stage Dockerfile for Spring Boot Modular Monolith (apps/api)
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

WORKDIR /workspace

COPY pom.xml .
COPY apps/api apps/api

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S medicore && adduser -S medicore -G medicore

COPY --from=builder /workspace/apps/api/hospital-app/target/hospital-app-*.jar app.jar

RUN chown -R medicore:medicore /app

USER medicore

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

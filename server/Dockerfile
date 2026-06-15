FROM eclipse-temurin:17-jdk AS build

WORKDIR /workspace
RUN apt-get update \
  && apt-get install -y --no-install-recommends unzip \
  && rm -rf /var/lib/apt/lists/*
COPY server/.mvn .mvn
COPY server/mvnw server/pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY server/src src
RUN ./mvnw -q -DskipTests package && cp target/*.jar /workspace/app.jar

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /workspace/app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

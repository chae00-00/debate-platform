# Multi-stage 빌드
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Gradle wrapper 복사
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# 의존성 캐싱을 위해 먼저 복사
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon || true

# 소스 복사 및 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon

# 실행 이미지
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

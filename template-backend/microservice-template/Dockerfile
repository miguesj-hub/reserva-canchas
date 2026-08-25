# ---------------------------------------------------------------------------
# Plantilla de Dockerfile para cada microservicio Spring Boot.
# Copiar a backend/<ms-nombre>/Dockerfile junto al pom.xml del servicio.
#
# Construcción multi-etapa: la imagen final no lleva Maven ni el código
# fuente, solo el JRE y el jar (~200 MB en lugar de ~800 MB).
# ---------------------------------------------------------------------------

# --- Etapa 1: compilación ---------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Se copia primero el pom para que la capa de dependencias se reutilice
# mientras el pom no cambie: rebuilds de código en segundos, no minutos.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Etapa 2: ejecución -----------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# wget para el healthcheck definido en docker-compose.yml
RUN apk add --no-cache wget && \
    addgroup -S spring && adduser -S spring -G spring

COPY --from=build /build/target/*.jar app.jar
RUN chown spring:spring /app/app.jar

USER spring
EXPOSE 8080

# Contenedor: heap acotado al límite del contenedor y arranque más rápido.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

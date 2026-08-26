# ---------------------------------------------------------------------------
# ms-usuarios — Registro, autenticacion y gestion de usuarios y roles
#
# Calcado de template-backend/microservice-template/Dockerfile. Construcción en
# dos etapas: la imagen final no lleva Maven ni el código fuente, solo el JRE y
# el jar (~200 MB en lugar de ~800 MB).
# ---------------------------------------------------------------------------

# --- Etapa 1: compilación ---------------------------------------------------
# Se compila con el wrapper del propio proyecto (./mvnw), no con el Maven de la
# imagen: la versión de Maven la fija el repositorio, no el entorno de build.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build

# El wrapper y el pom primero, para que la capa de dependencias se reutilice
# mientras el pom no cambie: rebuilds de código en segundos, no minutos.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline

COPY src ./src
RUN ./mvnw -B clean package -DskipTests

# --- Etapa 2: ejecución -----------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# wget para el healthcheck de Actuator definido en docker-compose.yml.
RUN apk add --no-cache wget && \
    addgroup -S spring && adduser -S spring -G spring

COPY --from=build /build/target/*.jar app.jar
RUN chown spring:spring /app/app.jar

USER spring
EXPOSE 8081

# Contenedor: heap acotado al límite del contenedor y arranque más rápido.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

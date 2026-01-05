FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace
# On copie tout le projet
COPY . .
# On compile et génère le JAR (en sautant les tests pour aller plus vite)
RUN mvn clean package -DskipTests

# Étape 2 : Exécution (Image finale légère)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# On récupère uniquement le JAR généré à l'étape précédente
COPY --from=build /workspace/target/*.jar app.jar
# Commande pour lancer l'application Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
# Use the official OpenJDK image as a base image
FROM openjdk:17-jdk

# Set the working directory in the container
WORKDIR /app

# Copy the Maven wrapper files
COPY mvnw .
COPY .mvn .mvn

# Copy the Maven build file and the source code
COPY pom.xml .
COPY src ./src

# Make the Maven wrapper executable
RUN chmod +x mvnw

# Package the application
RUN ./mvnw clean package -DskipTests

# List the contents of the target directory
RUN ls -l target

# Expose the port the application runs on
EXPOSE 8081

# Run the application
CMD ["java", "-jar", "target/auth-api-0.0.1-SNAPSHOT.jar"]
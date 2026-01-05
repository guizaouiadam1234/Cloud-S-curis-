# Project Overview

This project is a microservices-based Gatcha game application using Spring Boot and MongoDB. It consists of several APIs, each serving a specific purpose within the application. The services are orchestrated using Docker Compose.

## Services

- **mongodb**: MongoDB database service.
- **auth-api**: Authentication service.
- **monstre-api**: Service for managing monsters.
- **player-api**: Service for managing players.
- **invocation-api**: Service for managing invocations.

## Technologies

- Java
- JavaScript
- Spring Boot
- Maven
- Docker
- MongoDB

## Prerequisites

- Docker
- Docker Compose
- Java 11 or higher
- Maven

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/guizaouiadam/GatchaAPINON
    ```

2. Build the Docker images and start the services:

    ```bash
    docker-compose up --build
    ```

   > **Note**: If you encounter an `ERROR: failed to solve: process "/bin/sh -c ./mvnw clean package -DskipTests" did not complete successfully: exit code: 126` error, it means that your End Of Lines are not in Unix format. To fix it, please convert your EOLs to Unix format using the following command:

    ```bash
    dos2unix mvnw
    ```

   Then, run the `docker-compose up --build` command again.

   Alternatively, you can convert your EOLs using Notepad++ by following these steps:
    - Open the file in Notepad++
    - Go to `Edit -> EOL Conversion -> Unix/OSX Format`
    - Save the file and run the `docker-compose up --build` command again.

3. The services should now be up and running. You can access the services using the following URLs:

    - **auth-api**: [http://localhost:8081](http://localhost:8081)
    - **player-api**: [http://localhost:8082](http://localhost:8082)
    - **monstre-api**: [http://localhost:8083](http://localhost:8083)
    - **invocation-api**: [http://localhost:8084](http://localhost:8084)
    - **mongodb**: [http://localhost:27017](http://localhost:27017)

## API Documentation

### Auth API

The `auth-api` service is responsible for handling user authentication within the application. It provides endpoints for user login and token validation. Below are the key functionalities of the `auth-api`:

1. **User Login**
    - **URL**: `/api/auth/login`
    - **Method**: `POST`
    - **Description**: Authenticates a user and returns a JWT token.
    - **Request Body**:
        ```json
        {
            "username": "user",
            "password": "password"
        }
        ```
    - **Response**:
        - **200 OK**: Returns a token.
        - **401 Unauthorized**: Invalid username or password.

2. **Token Validation**
    - **URL**: `/api/auth/validate`
    - **Method**: `GET`
    - **Description**: Validates a token.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Token is valid.
        - **401 Unauthorized**: Token is invalid.

### Frontend for Auth API

We have also created a frontend for the `auth-api` to facilitate user interactions with the authentication service. The frontend allows users to log in and validate their tokens through a user-friendly interface.
-> localhost:8081 to login

### Player API

The `player-api` service is responsible for managing players within the application. It provides endpoints for retrieving player profiles, gaining experience, and managing monsters. Below are the key functionalities of the `player-api`:

1. **Get Player Profile**
    - **URL**: `/api/joueur/profile`
    - **Method**: `GET`
    - **Description**: Retrieves the player profile based on the provided token.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Returns the player profile.
        - **404 Not Found**: Player not found.

2. **Gain Experience**
    - **URL**: `/api/joueur/gainExperience`
    - **Method**: `POST`
    - **Description**: Adds experience points to the player.
    - **Request Parameters**:
        - `experience`: The amount of experience to gain.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Experience added successfully.
        - **400 Bad Request**: Invalid input data.

3. **Add Monster**
    - **URL**: `/api/joueur/addMonstre`
    - **Method**: `POST`
    - **Description**: Adds a monster to the player's collection.
    - **Request Parameters**:
        - `monstreId`: The ID of the monster to add.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Monster added successfully.
        - **400 Bad Request**: Invalid input data.

4. **Remove Monster**
    - **URL**: `/api/joueur/removeMonstre`
    - **Method**: `POST`
    - **Description**: Removes a monster from the player's collection.
    - **Request Parameters**:
        - `monstreId`: The ID of the monster to remove.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Monster removed successfully.
        - **400 Bad Request**: Invalid input data.

### Monstre API

The `monstre-api` service is responsible for managing monsters within the application. It provides endpoints for saving, retrieving, updating, and deleting monsters. Below are the key functionalities of the `monstre-api`:

1. **Save Monster**
    - **URL**: `/api/monsters/save`
    - **Method**: `POST`
    - **Description**: Saves a new monster.
    - **Request Body**:
        ```json
        {
            "name": "string",
            "attack": "integer",
            "defense": "integer",
            "hp": "integer",
            "level": "integer",
            "element": "string",
            "speed": "integer",
            "xp": "integer",
            "skills": "list"
        }
        ```
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Monster saved successfully.
        - **400 Bad Request**: Invalid input data.

2. **Get Monsters by Name**
    - **URL**: `/api/monsters/{name}`
    - **Method**: `GET`
    - **Description**: Retrieves monsters by name.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Returns the list of monsters.
        - **404 Not Found**: Monsters not found.

3. **Get All Monsters**
    - **URL**: `/api/monsters/all`
    - **Method**: `GET`
    - **Description**: Retrieves all monsters.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Returns the list of all monsters.

4. **Get Monsters by Element**
    - **URL**: `/api/monsters/elements/{element}`
    - **Method**: `GET`
    - **Description**: Retrieves monsters by element.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Returns the list of monsters by element.
        - **404 Not Found**: Monsters not found.

5. **Level Up Monster**
    - **URL**: `/api/monsters/levelup/id={id}/skill={skillIndex}`
    - **Method**: `PUT`
    - **Description**: Levels up a monster.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Monster leveled up successfully.
        - **404 Not Found**: Monster not found.

6. **Give XP to Monster**
    - **URL**: `/api/monsters/giveXp/id={id}/skill={skillIndex}`
    - **Method**: `PUT`
    - **Description**: Gives XP to a monster.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: XP given successfully.
        - **404 Not Found**: Monster not found.

7. **Delete Monster**
    - **URL**: `/api/monsters/delete/id={id}`
    - **Method**: `DELETE`
    - **Description**: Deletes a monster.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **204 No Content**: Monster deleted successfully.
        - **404 Not Found**: Monster not found.

### Elements
The attribute "element" of a monster is an enum, and the possibilities are as follows:
- Eau
- Feu
- Air
- Plante
- Electrique
- Terre


### Invocation API

The `invocation-api` service is responsible for managing invocations within the application. It provides endpoints for invoking monsters. Below are the key functionalities of the `invocation-api`:

1. **Invoke Monster**
    - **URL**: `/api/invocation/invoke`
    - **Method**: `POST`
    - **Description**: Invokes a monster based on the provided token.
    - **Headers**:
        - `Authorization:  <token>`
    - **Response**:
        - **200 OK**: Returns the invocation details.
        - **401 Unauthorized**: Invalid or missing token.

2. **Index**
    - **URL**: `/api/invocation/`
    - **Method**: `GET`
    - **Description**: Returns a simple index message.
    - **Response**:
        - **200 OK**: Returns "index".

### Frontend for Monster Invocation API
You can access the API's front end at localhost:8084 and use the button to invoke monsters.


### Data Examples
**JSON Test**
In this section, we provide sample JSON data to test the authentication and monster invocation functionalities of the application. These samples are pre-imported into MongoDB by default, so you can use them immediately without any additional setup.

**Authentication**
The following JSON object can be used to test the login functionality of the auth-api. This example uses the credentials of a user:

```json
{
    "username": "user2",
    "password": "password2"
}
```
**Monster Invocation**
The application allows players to invoke monsters with different probabilities. Below is the list of monsters that can be invoked along with their respective invocation probabilities:
* Dracaufeu (30%)
* Tortank (10%)
* Pyroli (50%)
* Pikachu (10%)


## Contributors

- **Adam Guizaoui**
- **Macéo Lardoux**
- **Jules Legillon**
- **Ali Ammar**
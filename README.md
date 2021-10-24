# SwapIt Backend

This repository contains the code for the backend server which the SwapIt frontend mobile app consumes. It is built using the express framework, mongodb as the database, mongoose as the ODM, socketIO for realtime chat communication and AWS S3 bucket for image hosting.

## Installation

Ensure you have [node](https://nodejs.org/en/download/) installed together with npm.

## Usage

1. Create a .env file in the root of the app containing the env variables as stipulated in env_sample.txt

2. Install dependencies

```
npm install
```

3. Run the server on localhost:5000

```bash
npm run dev
```

## Development Tools

1. [MongoDB Compass](https://www.mongodb.com/try/download/compass)
  
2. SwaggerUI
  
- Swagger UI can be accessed through http://localhost:5000/index/ or appending index if a different port is used
- For queries that require authentication, first send a post login request to obtain a valid jwt token. Then copy the jwt token into the authorize box on swagger. After which you will be successfully authenticated and can run all requests
  
![Imgur](https://i.imgur.com/SMEzUJr.png)

## Testing

Acceptance tests are done on a test database using mocha, chai and supertest on port 9000.

- Running all tests

```
npm run test
```

- Alternatively, install the **mocha test explorer** vscode sidebar extension and run tests from the test sidebar

![img](https://i.imgur.com/P3pvoaP.png)

## Deployment

### Development 

- Deployed on heroku: https://swapit-backend.herokuapp.com/

### Production

# Project Setup Guide

## Project Introduction

Welcome to our project! This is a Dockerized Express API for scraping MercadoLibre products and tracking their prices.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- TypeScript
- Python

## Prerequisites

Make sure you have Docker and docker-compose installed on your machine.

## Setup Steps

1. Build the project:

```bash
docker-compose build
```

2. Start the project:

```bash
docker-compose up
```

3. Create a new PostgreSQL database using the configurations provided in the `.example.env` file.

4. Allow CORS for the frontend updating the ORIGIN .env variable.

Reset volumes

```
docker-compose down --volumes
```

## Additional Information

For the frontend application, please refer to the repository at:
[Frontend App Repository](https://github.com/CatBoxy/scrappy-front)

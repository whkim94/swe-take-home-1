# Running EcoVision with Docker

This guide provides instructions for running the EcoVision Climate Visualizer using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd swe-take-home-1
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1
   - API Documentation: http://localhost:8000/docs

## Services

The Docker Compose setup includes:
- **PostgreSQL database**: Stores climate data
- **FastAPI backend**: Provides the API endpoints
- **React/Vite frontend**: Provides the user interface

## Stopping the Application

To stop the application:
```bash
docker-compose down
```

To remove all containers and volumes:
```bash
docker-compose down -v
```

## Troubleshooting

If you encounter issues:
1. Check container status: `docker-compose ps`
2. View logs:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```
3. Restart the application:
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up --build
   ``` 
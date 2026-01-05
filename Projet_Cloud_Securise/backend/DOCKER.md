# Docker

Build the image (from repository root):

```bash
docker build -t projet_cloud_securise_backend:latest -f backend/Dockerfile ./backend
```

Run with docker:

```bash
docker run --rm -p 8080:8080 projet_cloud_securise_backend:latest
```

Or use docker-compose (from repository root):

```bash
docker-compose up --build
```

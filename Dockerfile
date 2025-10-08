# Dockerfile

# Stage 1: Build with dependencies
FROM python:3.11-slim AS builder
WORKDIR /opt/venv
RUN apt-get update && apt-get install -y build-essential && apt-get clean
COPY packages/requirements.txt ./requirements.txt
RUN python -m venv .
RUN . bin/activate && pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Stage 2: Final production image
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create directories required by the application.
# `scripts` and `alembic` are for development/migration tasks, but creating them
# here prevents potential permission issues in different environments.
RUN mkdir -p app gunicorn documents scripts alembic generated_documents document_storage

COPY --from=builder /opt/venv /opt/venv
COPY app ./app/
COPY gunicorn ./gunicorn/
COPY start_gunicorn.sh ./

RUN chmod -R 755 /app/*/
# The chmod command will fail if start_gunicorn.sh doesn't exist,
# so we ignore errors to make it optional.
RUN chmod +x start_gunicorn.sh 2>/dev/null || true

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD BASE_PATH=${BASE_PATH:-} && API_PATH="${BASE_PATH}/api" && curl -f http://localhost:8000${API_PATH}/health || exit 1

EXPOSE 8000

# The default command to run the application, expecting start_gunicorn.sh.
# This is typically overridden by docker-compose for local development.
ENTRYPOINT ["sh", "start_gunicorn.sh"]
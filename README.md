# AI Command Center - Full-Stack Template

This repository contains a production-ready, secure, and scalable template for building modern, AI-first web applications. It features a Python/FastAPI backend with a powerful pluggable authorization engine, a Next.js/React frontend, and Keycloak for identity management, all fully containerized with Docker.

---

### Core Features

*   🚀 **Production-Ready Stack:** FastAPI, Next.js, PostgreSQL, and Keycloak working in harmony.
*   🔒 **Pluggable Authorization Engine:** Define complex, context-aware access control rules in simple JSON. Secure by default.
*   🐳 **Fully Containerized:** A consistent and reproducible development environment powered by Docker and Docker Compose.
*   🤖 **AI-First Architecture:** Designed from the ground up to support building "AI Command Centers" where AI is a core actor.
*   💻 **Excellent Developer Experience:** Get up and running with a single command. Includes database migrations, code formatting, and linting.

---

### Technology Stack

| Area      | Technology                                    | Purpose                                       |
|-----------|-----------------------------------------------|-----------------------------------------------|
| Backend   | **Python 3.11** with **FastAPI**              | High-performance, modern API development.     |
| Frontend  | **Next.js 15** with **React 19** & **TypeScript** | A robust framework for building user interfaces.  |
| Identity  | **Keycloak 24**                               | Centralized authentication & access management. |
| Database  | **PostgreSQL 15**                             | Reliable, feature-rich relational database.   |
| DevOps    | **Docker** & **Docker Compose**               | Containerization and service orchestration.     |

---

### Prerequisites

Ensure you have the following installed on your local machine:
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)
*   `make` (available on macOS and Linux, or via Chocolatey/WSL on Windows)

---

### 🚀 Getting Started

Follow these steps to get your local development environment running:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/super-mohit/template.git
    cd template
    ```

2.  **Create Your Environment File**
    Copy the example environment file. This file is your single source of truth for all configuration.
    ```bash
    cp .env.example .env
    ```

3.  **Configure Initial Secrets**
    Open the newly created `.env` file. You must generate a secret for `NEXTAUTH_SECRET`. You can generate a strong secret with this command:
    ```bash
    # Run this in your terminal and paste the output into the .env file
    openssl rand -base64 32
    ```
    *Note: Leave `KEYCLOAK_CLIENT_SECRET` empty for now - you'll configure it in the next step.*

4.  **Launch the Application (First Time)**
    This single command will build the Docker images, start all services, and set up your environment. The startup process automatically waits for the database to be ready before running migrations.
    ```bash
    make up
    ```

5.  **Configure Keycloak Client Secret**
    After the first startup, you need to retrieve the Keycloak client secret and add it to your `.env` file:
    
    a. Open the Keycloak Admin Console at [http://localhost:8080](http://localhost:8080) and log in with credentials: `admin` / `admin`
    
    b. Navigate to: **Clients** → **super-client-dnh-dev-0001** → **Credentials** tab
    
    c. Copy the **Client Secret** value
    
    d. Open your `.env` file and paste the secret into `KEYCLOAK_CLIENT_SECRET=`
    
    e. Restart the services with a clean slate:
    ```bash
    docker-compose down -v
    make up
    ```

6.  **Access Your Services**
    Your full application stack is now running!
    *   **Frontend Application:** [http://localhost:3001/app1](http://localhost:3001/app1)
    *   **Backend API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)
    *   **Keycloak Admin Console:** [http://localhost:8080](http://localhost:8080)
        *   **Admin Credentials:** `admin` / `admin`

    The first time you run `make up`, Keycloak will import its configuration and the database will initialize. This may take a minute or two.

---

### Core `make` Commands

Use these shortcuts to manage your development environment:

| Command           | Description                                                        |
|-------------------|--------------------------------------------------------------------|
| `make up`         | Build and start all services in the background.                    |
| `make down`       | Stop and remove all running containers.                            |
| `make logs-be`    | View the real-time logs for the backend service.                   |
| `make logs-fe`    | View the real-time logs for the frontend service.                  |
| `make format`     | Automatically format all backend and frontend code.                |
| `make lint`       | Lint all backend and frontend code for issues.                     |
| `make test-be`    | Run the backend test suite with pytest.                            |
| `make migrate-up` | Apply all pending database migrations.                             |
| `make reset-db`   | *[TODO]* Command exists but scripts need implementation.            |

---

### Project Structure

```
.
├── app/                  # The Python/FastAPI backend application
├── docs/                 # All project documentation (Playbook, Guides)
├── frontend/             # The Next.js/React frontend application
├── gunicorn/             # Gunicorn configuration files for the backend
├── keycloak/             # Keycloak realm configuration and data
├── packages/             # Python dependency lists
├── utils/                # Shared utilities (database helpers, etc.)
├── tests/                # Backend test suite
├── start_gunicorn.sh     # Unified startup script (handles dev/prod modes)
├── docker-compose.yml    # Orchestrates all services
├── Makefile              # Command shortcuts for development
└── README.md             # You are here!
```

---

### Next Steps

*   To understand the core philosophy, read the **[AI Command Center Playbook](./docs/cc-playbook.md)**.
*   To learn how to add new APIs and secure them, consult the **[Keycloak Developer Guide](./docs/Keycloak%20Developer%20Guide.md)**.
*   To understand the production deployment strategy, read the **[Deployment Guide](./docs/DEPLOYMENT.md)**.
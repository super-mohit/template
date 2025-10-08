# Contributing to the Template

We encourage all developers to contribute improvements back to this template. By keeping the foundation strong and up-to-date, we benefit all future projects.

## Development Workflow

1.  **Create an Issue:** Before starting work on a change, please create an issue in our Git repository detailing the proposed change or bug fix.
2.  **Create a Branch:** Create a new branch from `main` for your work. Please use the following naming convention:
    *   `feature/<issue-number>-short-description` (e.g., `feature/12-add-redis-caching`)
    *   `fix/<issue-number>-short-description` (e.g., `fix/15-correct-cors-policy`)
3.  **Commit Your Changes:** Make your changes, ensuring you follow the project's coding standards.
4.  **Run Quality Checks:** Before pushing, run the formatters and linters:
    ```bash
    make format
    make lint
    ```
5.  **Push and Create a Pull Request:** Push your branch and open a Pull Request (PR) against the `main` branch. In the PR description, link to the issue it resolves.

## Coding Standards

*   **Python (Backend):** We follow the **Black** code style. All code must pass `flake8` linting.
*   **TypeScript/React (Frontend):** We follow the **Prettier** code style. All code must pass `eslint` linting.
*   **Comments:** Write comments to explain *why* you did something, not *what* you did. The code should explain the "what."

Thank you for helping us make this template better!

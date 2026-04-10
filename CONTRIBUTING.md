# Contributing to Universal Downloader Pro

Thank you for your interest in contributing to Universal Downloader Pro. We want to make contributing to this project as easy and transparent as possible.

## Our Development Process

1.  **Fork** the repository and create your branch from `main`.
2.  **Install dependencies** using `npm install`.
3.  **Run the binary script** `./download-binaries.ps1` to set up the environment.
4.  **Code!** If you've added code that should be tested, add tests.
5.  **Lint** your code before committing.
6.  **Issue that pull request!**

## Pull Request Guidelines

*   Ensure the PR description clearly explains the changes.
*   Keep PRs focused on a single feature or bug fix.
*   Maintain the existing coding style (Electron/Vite/React).
*   Update the documentation (README) if necessary.

## Coding Standards

*   Use TypeScript for all new code.
*   Follow clean code principles (DRY, SOLID).
*   Ensure all IPC communication is handled securely in `electron/ipc-handlers.ts`.

## Bug Reports

Use the GitHub Issue Tracker to report bugs. Please include:
*   Steps to reproduce.
*   Expected vs Actual behavior.
*   Your environment details (Windows version, Node.js version).

## Licence

By contributing, you agree that your contributions will be licensed under its MIT License.

# Mailer API

A lightweight, self-hosted HTTP service for sending emails from your applications. Built with [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), and [Nodemailer](https://nodemailer.com/). Package it as a Docker container, deploy it alongside your apps, and send emails with a simple `POST` request.

Supports plain text and HTML bodies, multiple recipients, CC/BCC, reply-to, and file attachments (base64-encoded).

---

## Table of contents

- [Features](#features)
- [Quick start (Docker Hub)](#quick-start-docker-hub)
- [Quick start (GitHub / from source)](#quick-start-github--from-source)
- [Configuration](#configuration)
- [Passing environment variables to Docker](#passing-environment-variables-to-docker)
- [API reference](#api-reference)
- [Authentication](#authentication)
- [Attachments](#attachments)
- [Integration examples](#integration-examples)
- [Running with other apps (Docker networking)](#running-with-other-apps-docker-networking)
- [Development](#development)
- [Publishing to Docker Hub](#publishing-to-docker-hub)
- [Publishing to GitHub](#publishing-to-github)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [License](#license)

---

## Features

- **REST API** — `POST /send` to send mail, `GET /health` for health checks
- **Text & HTML** — send plain text, HTML, or both in the same email
- **Attachments** — attach files via base64-encoded content in the request body
- **Multiple recipients** — `to`, `cc`, and `bcc` accept a single address or an array
- **API key auth** — optional shared-secret protection for the `/send` endpoint
- **Docker-ready** — small Alpine-based image, configurable via environment variables
- **No database** — stateless service, easy to scale horizontally

---

## Quick start (Docker Hub)

Pull and run the pre-built image from Docker Hub:

```bash
docker pull your-dockerhub-username/mailer-api:latest
```

Configure the container using `--env-file` or individual `-e` flags (see [Configuration](#configuration)).

**Option A — env file:**

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

**Option B — pass variables with `-e`:**

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_SECURE=false \
  -e SMTP_USER=you@gmail.com \
  -e SMTP_PASS=your-app-password \
  -e DEFAULT_FROM="My App <you@gmail.com>" \
  -e API_KEY=your-secret-key \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

Verify the service is up:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Send a test email:

```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test from Mailer API",
    "text": "Hello from Docker!",
    "html": "<h1>Hello</h1><p>Sent via Mailer API</p>"
  }'
```

### Docker Hub image tags

| Tag       | Description                          |
|-----------|--------------------------------------|
| `latest`  | Most recent stable release           |
| `1.0.0`   | Specific version (semver)            |

---

## Quick start (GitHub / from source)

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Docker](https://www.docker.com/) (optional, for containerized runs)

### Clone and run locally

```bash
git clone https://github.com/your-username/mailer-api.git
cd mailer-api
cp .env.example .env
# Edit .env with your SMTP credentials
npm install
npm start
```

The server starts on port `3000` (or the value set in `PORT`).

### Run with Docker Compose

```bash
git clone https://github.com/your-username/mailer-api.git
cd mailer-api
cp .env.example .env
# Edit .env with your SMTP credentials
docker compose up --build -d
```

By default, `docker-compose.yml` maps host port `4444` to container port `3000`. Adjust the `ports` mapping in `docker-compose.yml` if needed.

---

## Configuration

All configuration is done through environment variables. Copy `.env.example` to `.env` and fill in your values.

| Variable       | Required | Default | Description |
|----------------|----------|---------|-------------|
| `SMTP_HOST`    | **Yes**  | —       | SMTP server hostname (e.g. `smtp.gmail.com`, `smtp.sendgrid.net`) |
| `SMTP_PORT`    | No       | `587`   | SMTP port. Use `587` for STARTTLS, `465` for implicit TLS |
| `SMTP_SECURE`  | No       | `false` | Set to `true` when using port `465` (implicit TLS) |
| `SMTP_USER`    | **Yes**  | —       | SMTP username or email address |
| `SMTP_PASS`    | **Yes**  | —       | SMTP password or app-specific password |
| `DEFAULT_FROM` | **Yes**  | —       | Default sender address. Format: `"Name <email@example.com>"` |
| `API_KEY`      | No       | *(empty)* | Shared secret for `/send`. Leave empty to disable auth |
| `PORT`         | No       | `3000`  | HTTP port the API listens on inside the container |

### SMTP provider examples

**Gmail** (requires an [App Password](https://support.google.com/accounts/answer/185833)):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
DEFAULT_FROM="My App <you@gmail.com>"
```

**SendGrid**:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
DEFAULT_FROM="My App <noreply@yourdomain.com>"
```

**Amazon SES**:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
DEFAULT_FROM="My App <noreply@yourdomain.com>"
```

### Passing environment variables to Docker

You can supply configuration in two ways when running the container:

| Method | Flag | Best for |
|--------|------|----------|
| Env file | `--env-file .env` | Local dev, many variables |
| Individual vars | `-e KEY=value` | CI/CD, orchestrators, quick one-off runs |

Both can be combined — `-e` values override entries from `--env-file`.

**All variables via `-e`:**

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_SECURE=false \
  -e SMTP_USER=you@gmail.com \
  -e SMTP_PASS=your-app-password \
  -e DEFAULT_FROM="My App <you@gmail.com>" \
  -e API_KEY=your-secret-key \
  -e PORT=3000 \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

**Mix env file with overrides:**

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  --env-file .env \
  -e API_KEY=override-key-for-this-instance \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

**Read from the host shell** (avoids putting secrets on the command line):

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  -e SMTP_HOST \
  -e SMTP_USER \
  -e SMTP_PASS \
  -e DEFAULT_FROM \
  -e API_KEY \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

When `-e` is used without a value (`-e SMTP_HOST`), Docker passes through the variable from your host environment.

In **docker-compose.yml**, use the `environment` key the same way:

```yaml
services:
  mailer:
    image: your-dockerhub-username/mailer-api:latest
    ports:
      - "3000:3000"
    environment:
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: "587"
      SMTP_SECURE: "false"
      SMTP_USER: you@gmail.com
      SMTP_PASS: your-app-password
      DEFAULT_FROM: "My App <you@gmail.com>"
      API_KEY: your-secret-key
    restart: unless-stopped
```

---

## API reference

Base URL: `http://<host>:<port>` (default `http://localhost:3000`)

### `GET /health`

Health check endpoint. No authentication required.

**Response `200 OK`:**

```json
{
  "status": "ok"
}
```

Use this for Docker health checks, load balancers, and orchestrator liveness probes.

---

### `POST /send`

Send an email. Requires API key authentication when `API_KEY` is configured.

**Headers:**

| Header            | Required | Description |
|-------------------|----------|-------------|
| `Content-Type`    | **Yes**  | Must be `application/json` |
| `X-API-Key`       | Conditional | Required when `API_KEY` is set |
| `Authorization`   | Conditional | Alternative: `Bearer <api-key>` |

**Request body:**

| Field         | Type              | Required | Description |
|---------------|-------------------|----------|-------------|
| `to`          | `string \| string[]` | **Yes** | Recipient email address(es) |
| `subject`     | `string`          | **Yes**  | Email subject line |
| `text`        | `string`          | Conditional | Plain text body. At least one of `text` or `html` is required |
| `html`        | `string`          | Conditional | HTML body. At least one of `text` or `html` is required |
| `from`        | `string`          | No       | Override the default sender (`DEFAULT_FROM`) |
| `cc`          | `string \| string[]` | No    | CC recipient(s) |
| `bcc`         | `string \| string[]` | No    | BCC recipient(s) |
| `replyTo`     | `string`          | No       | Reply-to address |
| `attachments` | `array`           | No       | File attachments (see [Attachments](#attachments)) |

**Example request:**

```json
{
  "to": ["user@example.com", "admin@example.com"],
  "subject": "Order Confirmation #1234",
  "text": "Thank you for your order.",
  "html": "<h1>Thank you!</h1><p>Your order <strong>#1234</strong> is confirmed.</p>",
  "cc": "manager@example.com",
  "replyTo": "support@example.com",
  "attachments": [
    {
      "filename": "invoice.pdf",
      "content": "JVBERi0xLjQK...",
      "contentType": "application/pdf"
    }
  ]
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "messageId": "<abc123@smtp.example.com>",
  "accepted": ["user@example.com", "admin@example.com"],
  "rejected": []
}
```

**Error responses:**

| Status | Body | Cause |
|--------|------|-------|
| `400`  | `{ "error": "to is required" }` | Missing or invalid request fields |
| `401`  | `{ "error": "Unauthorized" }` | Missing or wrong API key |
| `500`  | `{ "error": "<message>" }` | SMTP or server error |

---

## Authentication

When `API_KEY` is set in the environment, every `POST /send` request must include the key. The `/health` endpoint is always public.

Send the key using either header:

```http
X-API-Key: your-secret-key
```

```http
Authorization: Bearer your-secret-key
```

If `API_KEY` is empty or unset, authentication is disabled and `/send` is open to any caller that can reach the service.

**Recommendation:** Always set `API_KEY` in production, especially if the container port is exposed beyond a private Docker network.

Generate a strong key:

```bash
# Linux / macOS
openssl rand -hex 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Attachments

Pass files as base64-encoded strings in the `attachments` array. Each attachment object supports:

| Field         | Required | Description |
|---------------|----------|-------------|
| `filename`    | **Yes**  | Name shown to the recipient |
| `content`     | Conditional | Base64-encoded file content |
| `encoding`    | No       | Encoding of `content` (default: `base64`) |
| `contentType` | No       | MIME type (e.g. `application/pdf`, `image/png`) |
| `path`        | Conditional | File path inside the container (rarely used via API) |

Either `content` or `path` must be provided.

**Encode a file to base64:**

```bash
# Linux / macOS
base64 -i report.pdf

# PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("report.pdf"))
```

**Maximum request size:** 25 MB (JSON body limit).

---

## Integration examples

### cURL

```bash
curl -X POST http://mailer:3000/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${MAILER_API_KEY}" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome",
    "html": "<h1>Welcome aboard!</h1>"
  }'
```

### Node.js (fetch)

```javascript
const response = await fetch("http://mailer:3000/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.MAILER_API_KEY,
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Password Reset",
    text: "Click here to reset your password: https://example.com/reset?token=abc",
    html: '<p>Click <a href="https://example.com/reset?token=abc">here</a> to reset your password.</p>',
  }),
});

const result = await response.json();
console.log(result.messageId);
```

### Node.js (with attachment)

```javascript
import { readFileSync } from "fs";

const pdf = readFileSync("invoice.pdf").toString("base64");

await fetch("http://mailer:3000/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.MAILER_API_KEY,
  },
  body: JSON.stringify({
    to: "customer@example.com",
    subject: "Your Invoice",
    text: "Please find your invoice attached.",
    attachments: [
      {
        filename: "invoice.pdf",
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  }),
});
```

### Python (requests)

```python
import os
import requests

response = requests.post(
    "http://mailer:3000/send",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": os.environ["MAILER_API_KEY"],
    },
    json={
        "to": "user@example.com",
        "subject": "Hello from Python",
        "text": "This email was sent via the Mailer API.",
        "html": "<p>This email was sent via the <strong>Mailer API</strong>.</p>",
    },
)
print(response.json())
```

---

## Running with other apps (Docker networking)

The typical setup is to run the mailer as a sidecar or shared service on the same Docker network as your applications. Your apps call `http://mailer:3000/send` using the container name as the hostname.

### docker-compose.yml (multi-service)

```yaml
services:
  mailer:
    image: your-dockerhub-username/mailer-api:latest
    env_file:
      - ./mailer.env
    restart: unless-stopped
    # No ports exposed to the host — only reachable by other containers

  my-app:
    image: your-app:latest
    environment:
      MAILER_URL: http://mailer:3000
      MAILER_API_KEY: your-secret-key
    depends_on:
      - mailer
```

### Standalone container on a shared network

```bash
# Create a network (once)
docker network create app-network

# Run the mailer
docker run -d \
  --name mailer \
  --network app-network \
  --env-file .env \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest

# Run your app on the same network
docker run -d \
  --name my-app \
  --network app-network \
  -e MAILER_URL=http://mailer:3000 \
  your-app:latest
```

### Docker health check

Add a health check when running the container:

```bash
docker run -d \
  --name mailer \
  --health-cmd="wget -qO- http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-retries=3 \
  -p 3000:3000 \
  --env-file .env \
  your-dockerhub-username/mailer-api:latest
```

Or in `docker-compose.yml`:

```yaml
services:
  mailer:
    image: your-dockerhub-username/mailer-api:latest
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      retries: 3
      start_period: 10s
```

---

## Development

### Project structure

```
mailer-api/
├── src/
│   └── index.js          # Express server and API routes
├── .env.example           # Environment variable template
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

### Scripts

| Command       | Description |
|---------------|-------------|
| `npm start`   | Start the server |
| `npm run dev` | Start with file watching (Node `--watch`) |

### Local development workflow

```bash
cp .env.example .env
# Edit .env
npm install
npm run dev
```

The server reloads automatically when you change `src/index.js`.

---

## Publishing to Docker Hub

### 1. Create a Docker Hub repository

1. Sign in at [hub.docker.com](https://hub.docker.com/)
2. Click **Create Repository**
3. Name it `mailer-api`, set visibility (public recommended), and create

### 2. Build and push

```bash
# Log in to Docker Hub
docker login

# Build the image
docker build -t your-dockerhub-username/mailer-api:latest .

# Tag with a version (recommended)
docker tag your-dockerhub-username/mailer-api:latest your-dockerhub-username/mailer-api:1.0.0

# Push both tags
docker push your-dockerhub-username/mailer-api:latest
docker push your-dockerhub-username/mailer-api:1.0.0
```

### 3. Configure the Docker Hub repository page

On your repository page at `https://hub.docker.com/r/your-dockerhub-username/mailer-api`:

1. **Short description** — paste the contents of [`docs/docker-hub-overview.md`](docs/docker-hub-overview.md) (first paragraph)
2. **Full description** — link your GitHub repository under **Settings → GitHub Repository** so Docker Hub displays this README automatically
3. **Overview** — add tags like `email`, `nodemailer`, `smtp`, `api`, `docker`, `microservice`

### 4. Automated builds (optional)

Connect your GitHub repo in Docker Hub under **Settings → GitHub Repository** to trigger automatic builds on push. Alternatively, use GitHub Actions:

```yaml
# .github/workflows/docker-publish.yml
name: Publish Docker image

on:
  push:
  tags:
    - "v*"

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            your-dockerhub-username/mailer-api:latest
            your-dockerhub-username/mailer-api:${{ github.ref_name }}
```

Store `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in your GitHub repository secrets.

---

## Publishing to GitHub

### 1. Create the repository

```bash
git init
git add .
git commit -m "Initial commit: Mailer API service"
git branch -M main
git remote add origin https://github.com/your-username/mailer-api.git
git push -u origin main
```

### 2. Repository settings

On your GitHub repository page:

1. **About** — add a short description: *"Self-hosted HTTP API for sending emails via SMTP. Docker-ready."*
2. **Topics** — add: `email`, `nodemailer`, `smtp`, `docker`, `api`, `microservice`, `express`
3. **README** — this file serves as the main documentation
4. **Secrets** — if using GitHub Actions for Docker Hub, add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`

### 3. What to commit

| File            | Commit? | Notes |
|-----------------|---------|-------|
| `src/`          | Yes     | Application source |
| `package.json`  | Yes     | Dependencies |
| `Dockerfile`    | Yes     | Container build |
| `docker-compose.yml` | Yes | Local orchestration |
| `.env.example`  | Yes     | Template for configuration |
| `.env`          | **No**  | Contains secrets — listed in `.gitignore` |
| `node_modules/` | **No**  | Installed via `npm install` |

### 4. Releases

Tag stable versions for Docker Hub and GitHub Releases:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Create a GitHub Release from the tag with a brief changelog.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing required environment variable` on startup | Ensure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `DEFAULT_FROM` are set |
| `401 Unauthorized` | Include the correct `X-API-Key` header, or leave `API_KEY` empty to disable auth |
| `Invalid login` / SMTP auth errors | Verify SMTP credentials. For Gmail, use an App Password, not your account password |
| `Connection timeout` | Check `SMTP_HOST` and `SMTP_PORT`. Ensure the container has outbound network access |
| `self signed certificate` | Some SMTP servers use custom certs. This service does not disable TLS verification by default |
| Emails go to spam | Set up SPF, DKIM, and DMARC for your sending domain |
| `Payload too large` | Request body exceeds 25 MB. Reduce attachment size or split into multiple emails |
| Container exits immediately | Check logs: `docker logs mailer`. Usually a missing env var |

**View container logs:**

```bash
docker logs -f mailer
```

---

## Security

- **Never commit `.env`** — it contains SMTP credentials and your API key
- **Set `API_KEY` in production** — prevents unauthorized email sending
- **Do not expose port 3000 publicly** unless necessary. Prefer internal Docker networking
- **Use app-specific SMTP passwords** — Gmail App Passwords, SendGrid API keys, SES SMTP credentials
- **Rotate credentials** if the API key or SMTP password is ever exposed
- **Limit attachment size** — the 25 MB JSON limit helps prevent abuse, but consider additional limits at the reverse proxy level

---

## License

MIT

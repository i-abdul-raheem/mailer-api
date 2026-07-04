# Docker Hub repository overview

Use the sections below when setting up your Docker Hub repository page.

---

## Short description

Paste this into the **Short description** field on Docker Hub (max 100 characters):

```
Self-hosted HTTP API for sending emails via SMTP. Supports text, HTML, and attachments.
```

---

## Full description

Link your GitHub repository under **Settings → GitHub Repository** on Docker Hub. Docker Hub will automatically display the project `README.md` as the full description.

If you prefer to paste manually, use the [Quick start (Docker Hub)](../README.md#quick-start-docker-hub) and [Configuration](../README.md#configuration) sections from the README.

---

## Suggested tags

Add these tags on the Docker Hub repository page:

```
email
nodemailer
smtp
api
docker
microservice
express
mail
notifications
```

---

## Pull command

Display this on your repository overview:

```bash
docker pull your-dockerhub-username/mailer-api:latest
```

---

## Run command

**With an env file:**

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  your-dockerhub-username/mailer-api:latest
```

**With `-e` flags:**

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

Required environment variables: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `DEFAULT_FROM`.

See the [GitHub README](https://github.com/your-username/mailer-api) for the full configuration reference and API documentation.

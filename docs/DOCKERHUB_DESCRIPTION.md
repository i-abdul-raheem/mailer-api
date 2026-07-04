# Mailer API

Self-hosted HTTP API for sending emails via SMTP. Run as a Docker container and call it from your apps with a simple `POST` request.

**GitHub:** https://github.com/i-abdul-raheem/mailer-api

## Features

- Send plain text and HTML emails
- File attachments (base64-encoded)
- Multiple recipients, CC, BCC, reply-to
- Optional API key authentication
- Health check endpoint for orchestrators

## Pull

```bash
docker pull arhex0300/mailer-api:latest
```

## Run

```bash
docker run -d \
  --name mailer \
  -p 3000:3000 \
  -e SMTP_HOST=smtp.example.com \
  -e SMTP_PORT=587 \
  -e SMTP_SECURE=false \
  -e SMTP_USER=user@example.com \
  -e SMTP_PASS=your-password \
  -e DEFAULT_FROM="My App <user@example.com>" \
  -e API_KEY=your-secret-key \
  --restart unless-stopped \
  arhex0300/mailer-api:latest
```

Required: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `DEFAULT_FROM`

## API

### Health check

```
GET /health
```

### Send email

```
POST /send
Content-Type: application/json
X-API-Key: your-secret-key
```

```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "text": "Plain text body",
  "html": "<p>HTML body</p>",
  "attachments": [
    {
      "filename": "report.pdf",
      "content": "<base64-encoded-content>",
      "contentType": "application/pdf"
    }
  ]
}
```

## Environment variables

| Variable       | Required | Default | Description |
|----------------|----------|---------|-------------|
| `SMTP_HOST`    | Yes      | —       | SMTP server hostname |
| `SMTP_PORT`    | No       | `587`   | SMTP port |
| `SMTP_SECURE`  | No       | `false` | `true` for port 465 |
| `SMTP_USER`    | Yes      | —       | SMTP username |
| `SMTP_PASS`    | Yes      | —       | SMTP password |
| `DEFAULT_FROM` | Yes      | —       | Default sender address |
| `API_KEY`      | No       | —       | API key for `/send` |
| `PORT`         | No       | `3000`  | HTTP port |

Full documentation: https://github.com/i-abdul-raheem/mailer-api

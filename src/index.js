const express = require("express");
const nodemailer = require("nodemailer");

const PORT = parseInt(process.env.PORT || "3000", 10);
const API_KEY = process.env.API_KEY || "";
const DEFAULT_FROM = process.env.DEFAULT_FROM || "";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

requireEnv("SMTP_HOST", SMTP_HOST);
requireEnv("SMTP_USER", SMTP_USER);
requireEnv("SMTP_PASS", SMTP_PASS);
requireEnv("DEFAULT_FROM", DEFAULT_FROM);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const app = express();
app.use(express.json({ limit: "25mb" }));

function authenticate(req, res, next) {
  if (!API_KEY) {
    return next();
  }

  const provided =
    req.headers["x-api-key"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (provided !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

function normalizeRecipients(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
}

function parseAttachments(attachments) {
  if (!attachments || !Array.isArray(attachments)) return undefined;

  return attachments.map((attachment, index) => {
    if (!attachment || typeof attachment !== "object") {
      throw new Error(`attachments[${index}] must be an object`);
    }

    const { filename, content, encoding, contentType, path } = attachment;

    if (!filename) {
      throw new Error(`attachments[${index}].filename is required`);
    }

    if (!content && !path) {
      throw new Error(
        `attachments[${index}] must include either content (base64) or path`
      );
    }

    const parsed = { filename };

    if (content) {
      parsed.content = Buffer.from(content, encoding || "base64");
    }

    if (path) {
      parsed.path = path;
    }

    if (contentType) {
      parsed.contentType = contentType;
    }

    return parsed;
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/send", authenticate, async (req, res) => {
  try {
    const { to, subject, text, html, from, cc, bcc, replyTo, attachments } =
      req.body;

    if (!to) {
      return res.status(400).json({ error: "to is required" });
    }

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    if (!text && !html) {
      return res
        .status(400)
        .json({ error: "At least one of text or html is required" });
    }

    const mailOptions = {
      from: from || DEFAULT_FROM,
      to: normalizeRecipients(to),
      subject,
    };

    if (text) mailOptions.text = text;
    if (html) mailOptions.html = html;

    const ccList = normalizeRecipients(cc);
    if (ccList) mailOptions.cc = ccList;

    const bccList = normalizeRecipients(bcc);
    if (bccList) mailOptions.bcc = bccList;

    if (replyTo) mailOptions.replyTo = replyTo;

    const parsedAttachments = parseAttachments(attachments);
    if (parsedAttachments) mailOptions.attachments = parsedAttachments;

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err) {
    console.error("Send failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mailer API listening on port ${PORT}`);
});

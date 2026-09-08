import nodemailer from "nodemailer";

const port = Number(process.env.MAIL_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port,
  secure: false,
  requireTLS: process.env.MAIL_ENCRYPTION === "tls",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.MAIL_USERNAME,
    to,
    subject,
    html,
  });
}

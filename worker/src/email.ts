import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_ENDPOINT,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, body: string) {
  console.log(`Inside sendEmail to: ${to} subject: ${subject} body: ${body}`);
  await transport.sendMail({
    sender: "nisrayaniraj.13@gmail.com",
    to,
    subject,
    text: body,
  });
  console.log(
    `Sent an email to ${to} with subject "${subject}" from nisrayaniraj.13@gmail.com`,
  );
}

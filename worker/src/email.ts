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

export async function sendEmail(to: string, body: string) {
  console.log(`Inside sendEmail to: ${to} and body: ${body}`);
  await transport.sendMail({
    sender: "nisrayaniraj.13@gmail.com",
    to,
    subject: "Hello from Zapier",
    text: body,
  });
  console.log(`Sent an email to ${to} from nisrayaniraj.13@gmail.com`);
}

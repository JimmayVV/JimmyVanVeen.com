import nodemailer from "nodemailer";

function envString(name: string): string {
  return process.env[name] ?? "";
}

const transporter = nodemailer.createTransport({
  service: envString("EMAIL_SERVICE"),
  auth: {
    user: envString("EMAIL_ADDRESS"),
    pass: envString("EMAIL_APP_PASSWORD"),
  },
});

export async function sendMail({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const mailOptions = {
    from: "contact@jimmyvanveen.com",
    to: envString("EMAIL_ADDRESS"),
    subject: "New Message from JimmyVanVeen.com",
    text: `
			Name: ${name}
			--------------------
			Email: ${email}
			Phone: ${phone}
			--------------------
			Message: ${message}
		`,
  };

  return await transporter.sendMail(mailOptions);
}

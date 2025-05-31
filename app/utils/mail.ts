import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: import.meta.env.JVV_EMAIL_SERVICE,
  auth: {
    user: import.meta.env.JVV_EMAIL_ADDRESS,
    pass: import.meta.env.JVV_EMAIL_APP_PASSWORD,
  },
})

export async function sendMail({
  name,
  email,
  phone,
  message,
}: {
  name: string
  email: string
  phone: string
  message: string
}) {
  const mailOptions = {
    from: "contact@jimmyvanveen.com",
    to: import.meta.env.JVV_EMAIL_ADDRESS,
    subject: "New Message from JimmyVanVeen.com",
    text: `
			Name: ${name}
			--------------------
			Email: ${email}
			Phone: ${phone}
			--------------------
			Message: ${message}
		`,
  }

  return await transporter.sendMail(mailOptions)
}

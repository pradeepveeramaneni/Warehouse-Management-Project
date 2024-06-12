import * as nodemailer from "nodemailer"
import type {MailOptions} from "nodemailer/lib/json-transport"

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "pradeepraoveeramaneni@gmail.com",
		pass: "quzhmhdzqohwtqab",
	},
})

export async function sendMail(to: string, subject: string, text: string) {
	const mailOptions: MailOptions = {
		from: process.env.EMAIL_USER,
		to,
		subject,
		text,
	}

	return transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error)
		} else {
			console.log("Email sent: " + info.response)
			return info.response
		}
	})
}

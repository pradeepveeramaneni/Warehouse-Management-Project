import {z} from "zod"

const name = z.string().min(1, "Name is required")
const email = z.string().email("Invalid email")
const password = z.string().trim().min(1, "Password is required")

export const LoginSchema = z.object({
	email,
	password,
	remember: z.enum(["on"]).optional(),
	role: z.preprocess(Number, z.number().int().min(1).max(4)),
	redirectTo: z.string().default("/"),
})

export const RegisterUserSchema = z
	.object({
		name,
		email,
		password,
		role: z.preprocess(Number, z.number().int().min(1).max(4)),
		confirmPassword: password,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["password", "confirmPassword"],
	})

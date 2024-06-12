import {makeApi} from "@zodios/core"
import {z} from "zod"
import {UuidSchema} from "~/lib/zodios/common"
import {errors} from "~/lib/zodios/error"

const UserSchema = z.object({
	id: UuidSchema,
	name: z.string(),
	email: z.string().email(),
	role: z.number().int().min(1).max(4),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	password: z.string(),
})

const LoginSchema = UserSchema.pick({
	email: true,
	password: true,
	role: true,
})

export const authApi = makeApi([
	{
		method: "post",
		path: "/Auth/Login",
		alias: "verifyLogin",
		description: "Login",
		response: z.object({
			data: UuidSchema,
			message: z.string(),
			success: z.boolean(),
		}),
		parameters: [
			{
				name: "login-user",
				type: "Body",
				schema: LoginSchema,
			},
		],
		errors: errors,
	},
])

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

export type User = z.infer<typeof UserSchema>

const GetUserSchema = UserSchema.omit({password: true})
const CreateUserSchema = UserSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	isActive: true,
})

export const userApi = makeApi([
	{
		method: "get",
		path: "/User/GetAll",
		alias: "getAllUsers",
		description: "Get all users",
		response: z.object({
			data: z.array(GetUserSchema),
			message: z.string(),
			success: z.boolean(),
		}),
		errors: errors,
	},
	{
		method: "get",
		path: "/User/:id",
		alias: "getUserById",
		description: "Get a user",
		response: z.object({
			data: GetUserSchema,
			message: z.string(),
			success: z.boolean(),
		}),
		errors: errors,
	},
	{
		method: "post",
		path: "/User",
		alias: "createUser",
		description: "Create a user",
		response: z.object({
			data: UuidSchema.nullable(),
			message: z.string(),
			success: z.boolean(),
		}),
		parameters: [
			{
				name: "user",
				type: "Body",
				schema: CreateUserSchema,
			},
		],
		errors: errors,
	},
])

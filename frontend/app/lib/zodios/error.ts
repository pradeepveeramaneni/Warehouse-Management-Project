import {makeErrors} from "@zodios/core"
import {z} from "zod"

export const errors = makeErrors([
	{
		status: "default",
		description: "Default error",
		schema: z.object({
			message: z.string(),
			success: z.boolean(),
			data: z.null(),
		}),
	},
])

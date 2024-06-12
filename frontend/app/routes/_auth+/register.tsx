import {Anchor, Button, PasswordInput, Select, TextInput} from "@mantine/core"
import type {ActionFunction} from "@remix-run/node"
import {Link, useFetcher} from "@remix-run/react"
import {createUser} from "~/lib/user.server"
import {RegisterUserSchema} from "~/lib/zod.schema"
import {createUserSession} from "~/session.server"
import {UserRole} from "~/utils/constants"
import {badRequest} from "~/utils/misc.server"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"
import * as React from "react"
import {userRoleLookup} from "~/utils/misc"

interface ActionData {
	fieldErrors?: inferErrors<typeof RegisterUserSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fieldErrors, fields} = await validateAction(
		request,
		RegisterUserSchema
	)
	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, password, name, role} = fields

	const userResponse = await createUser({
		email,
		password,
		name,
		role,
	})

	if (!userResponse.success) {
		return badRequest<ActionData>({
			fieldErrors: {
				email: userResponse.message,
			},
		})
	}

	return createUserSession({
		request,
		userId: userResponse.data!,
		role,
		redirectTo: "/",
	})
}

export default function Register() {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER)

	return (
		<div className="mx-auto flex w-full flex-col justify-center space-y-6 border border-gray-900">
			<fetcher.Form
				method="post"
				className="w-full rounded px-6 pb-8 pt-6 text-black"
			>
				<h3 className="font-semibold">REGISTER</h3>
				<p className="mt-2 text-sm text-gray-600">
					Have an account already?{" "}
					<Anchor component={Link} to="/login" size="sm" prefetch="intent">
						Sign in
					</Anchor>
				</p>

				<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
					<TextInput
						name="name"
						autoComplete="given-name"
						label="Name"
						error={fetcher.data?.fieldErrors?.name}
						required
					/>

					<TextInput
						name="email"
						type="email"
						autoComplete="email"
						label="Email address"
						error={fetcher.data?.fieldErrors?.email}
						required
					/>

					<PasswordInput
						name="password"
						label="Password"
						error={fetcher.data?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<PasswordInput
						name="confirmPassword"
						label="Confirm password"
						error={fetcher.data?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<Select
						label="Role"
						name="role"
						placeholder="Pick one"
						value={role.toString()}
						onChange={(role) => setRole(parseInt(role!))}
						data={Object.values(UserRole)
							.filter((value) => typeof value === "number")
							.map((role) => ({
								label: userRoleLookup(role as UserRole),
								value: role.toString(),
							}))}
					/>

					<Button type="submit" loading={isSubmitting} fullWidth mt="1rem">
						Register
					</Button>
				</fieldset>
			</fetcher.Form>
		</div>
	)
}

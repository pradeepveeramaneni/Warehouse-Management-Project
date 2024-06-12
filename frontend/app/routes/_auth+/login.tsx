import {Anchor, Button, PasswordInput, Select, TextInput} from "@mantine/core"
import type {ActionFunction} from "@remix-run/node"
import {Link, useFetcher} from "@remix-run/react"
import * as React from "react"
import {verifyLogin} from "~/lib/user.server"
import {LoginSchema} from "~/lib/zod.schema"
import {createUserSession} from "~/session.server"
import {UserRole} from "~/utils/constants"
import {userRoleLookup} from "~/utils/misc"
import {badRequest, safeRedirect} from "~/utils/misc.server"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"

interface ActionData {
	fieldErrors?: inferErrors<typeof LoginSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fieldErrors, fields} = await validateAction(request, LoginSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, password, redirectTo, remember, role} = fields

	const loginResponse = await verifyLogin({email, password, role})
	if (!loginResponse.success) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: loginResponse.message,
			},
		})
	}

	return createUserSession({
		request,
		userId: loginResponse.data!,
		role,
		remember: remember === "on" ? true : false,
		redirectTo: safeRedirect(redirectTo),
	})
}

export default function Login() {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER)

	return (
		<>
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 border border-gray-900">
				<fetcher.Form
					method="post"
					className="w-full rounded px-6 pb-8 pt-6 text-black"
				>
					<h3 className="font-semibold">LOGIN</h3>
					<hr className="my-2" />

					<div className="flex flex-col gap-4">
						<TextInput
							type="email"
							name="email"
							label="Email"
							autoFocus={true}
							placeholder="Enter your email"
							error={fetcher.data?.fieldErrors?.email}
							withAsterisk={false}
							required
						/>

						<PasswordInput
							name="password"
							label="Password"
							withAsterisk={false}
							placeholder="Enter your password"
							error={fetcher.data?.fieldErrors?.password}
							required
						/>

						<Select
							label="Role"
							name="role"
							searchable
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
					</div>

					<div className="mt-4 flex justify-end">
						<Anchor component={Link} to="/forgot-password" size="sm">
							Forgot Password?
						</Anchor>
					</div>

					<div className="mt-4 flex w-full justify-between gap-4">
						<Button fullWidth type="submit" loading={isSubmitting}>
							Login
						</Button>

						<Button fullWidth component={Link} to="/register" prefetch="intent">
							New User
						</Button>
					</div>
				</fetcher.Form>
			</div>
		</>
	)
}

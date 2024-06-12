import {Button, PasswordInput, TextInput} from "@mantine/core"
import type {ActionFunctionArgs, MetaFunction} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher} from "@remix-run/react"
import * as React from "react"
import {toast} from "sonner"
import {z} from "zod"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {requireUserId} from "~/session.server"
import {useUser} from "~/utils/hooks"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"

export const meta: MetaFunction = () => [
	{
		title: "Manage Profile",
	},
]

const UpdateUserSchema = z.object({
	name: z.string().min(1).max(32),
	password: z.union([
		z.string().min(8, "Password must be at least 8 characters long"),
		z.literal(""),
	]),
})

type ActionData = {
	fieldErrors?: inferErrors<typeof UpdateUserSchema>
	success: boolean
}

export async function action({request}: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(request, UpdateUserSchema)

	if (fieldErrors) {
		return json<ActionData>(
			{
				fieldErrors,
				success: false,
			},
			400
		)
	}

	await prisma.user.update({
		where: {
			Id: userId,
		},
		data: {
			Name: fields.name,
			Password: fields.password ? fields.password : undefined,
		},
	})

	return json<ActionData>({
		success: true,
	})
}

export default function ManageProfile() {
	const user = useUser()

	const fetcher = useFetcher<ActionData>()

	const isSubmitting = fetcher.state !== "idle"

	React.useEffect(() => {
		if (isSubmitting) return
		if (!fetcher.data) return

		if (fetcher.data.success) {
			toast.success("Profile updated")
		} else {
			toast.error("Please try again")
		}
	}, [fetcher.data, isSubmitting])

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<div className="mt-6 px-10">
					<PageHeading title="Profile" />
				</div>

				<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
					<fetcher.Form className="flex flex-col gap-6 p-6" method="post">
						<input hidden name="role" defaultValue={user.role} />
						<div className="relative flex flex-col gap-3">
							<h2 className="font-cal text-xl">Name</h2>

							<TextInput
								className="max-w-md"
								name="name"
								defaultValue={user.name}
								error={fetcher.data?.fieldErrors?.name}
								maxLength={32}
								required={true}
							/>
						</div>

						<div className="relative flex flex-col gap-3">
							<h2 className="font-cal text-xl">Email</h2>

							<TextInput
								name="email"
								type="email"
								className="max-w-md"
								description="You cannot change your email address"
								defaultValue={user.email}
								readOnly
							/>
						</div>

						<div className="relative flex flex-col gap-3">
							<h2 className="font-cal text-xl">Password</h2>

							<PasswordInput
								className="max-w-md"
								name="password"
								error={fetcher.data?.fieldErrors?.password}
								placeholder="Leave blank to keep the same password"
								minLength={8}
							/>
						</div>

						<div className="flex items-center justify-end border-t border-t-stone-300">
							<Button
								type="submit"
								loading={isSubmitting}
								color="dark"
								className="mt-4"
							>
								Update
							</Button>
						</div>
					</fetcher.Form>
				</div>
			</div>
		</>
	)
}

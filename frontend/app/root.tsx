import "@mantine/core/styles.css"

import {ColorSchemeScript, MantineProvider} from "@mantine/core"
import {ModalsProvider} from "@mantine/modals"
import {cssBundleHref} from "@remix-run/css-bundle"
import type {
	LinksFunction,
	DataFunctionArgs,
	MetaFunction,
	SerializeFrom,
} from "@remix-run/node"
import {json} from "@remix-run/node"
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react"
import appConfig from "app.config"
import {Toaster} from "sonner"
import {getUser} from "~/session.server"
import fontStylestylesheetUrl from "~/styles/font.css"
import tailwindStylesheetUrl from "~/styles/tailwind.css"

export const links: LinksFunction = () => {
	return [
		{rel: "stylesheet", href: fontStylestylesheetUrl},
		{rel: "stylesheet", href: tailwindStylesheetUrl},
		...(cssBundleHref ? [{rel: "stylesheet", href: cssBundleHref}] : []),
	]
}

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: DataFunctionArgs) => {
	const user = await getUser(request)
	return json({user})
}

export const meta: MetaFunction = () => [
	{
		title: appConfig.name,
	},
	{
		charset: "utf-8",
	},
	{
		viewport: "width=device-width,initial-scale=1",
	},
]

export function Document({
	title,
	children,
}: {
	title?: string
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="h-full">
			<head>
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />

				<ColorSchemeScript />
			</head>
			<body className="h-full">
				<MantineProvider
					theme={{
						primaryColor: "dark",
					}}
				>
					{children}
				</MantineProvider>
				<Toaster
					duration={3000}
					richColors
					closeButton
					position="bottom-left"
				/>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	)
}

export default function App() {
	return (
		<Document>
			<ModalsProvider>
				<Outlet />
			</ModalsProvider>
		</Document>
	)
}

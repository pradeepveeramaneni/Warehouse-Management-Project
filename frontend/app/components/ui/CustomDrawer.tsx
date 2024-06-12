import {Drawer} from "@mantine/core"

type DrawerRootProps = React.ComponentProps<typeof Drawer.Root>
type DrawerOverlayProps = React.ComponentProps<typeof Drawer.Overlay>

type CustomDrawerProps = {
	opened: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
	closeOnClickOutside?: boolean
	closeOnEscape?: boolean
	withCloseButton?: boolean
} & {
	rootProps?: DrawerRootProps
	overlayProps?: DrawerOverlayProps
}

export function CustomDrawer(props: CustomDrawerProps) {
	const {
		opened,
		onClose,
		title,
		children,
		closeOnEscape = true,
		closeOnClickOutside = true,
		withCloseButton = true,
		overlayProps,
	} = props

	return (
		<Drawer.Root
			opened={opened}
			onClose={onClose}
			position="right"
			className="border-0"
			size="sm"
			classNames={{
				inner: "p-3",
				title: "font-medium",
				content: "rounded-xl bg-white flex flex-col",
				header: "p-6 bg-white",
				body: "px-6 pb-6 pt-0 h-full",
			}}
			closeOnClickOutside={closeOnClickOutside}
			closeOnEscape={closeOnEscape}
		>
			<Drawer.Overlay blur={1.5} {...overlayProps} />
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>{title}</Drawer.Title>
					{withCloseButton && <Drawer.CloseButton />}
				</Drawer.Header>

				<Drawer.Body>{children}</Drawer.Body>
			</Drawer.Content>
		</Drawer.Root>
	)
}

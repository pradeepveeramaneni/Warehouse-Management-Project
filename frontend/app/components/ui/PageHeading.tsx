import {titleCase} from "~/utils/misc"

type PageHeadingProps = {
	title: string
	rightSection?: React.ReactNode
}

export function PageHeading(props: PageHeadingProps) {
	const {title, rightSection} = props

	return (
		<div className="flex items-center justify-between font-cal">
			<h1 className="text-3xl font-bold">{titleCase(title)}</h1>
			{rightSection}
		</div>
	)
}

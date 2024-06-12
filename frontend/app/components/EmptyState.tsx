import {XIcon} from "lucide-react"

type EmptyStateProps = {
	message: string
}

export function EmptyState({message}: EmptyStateProps) {
	return (
		<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<XIcon className="mx-auto text-gray-500" size={48} />
			<span className="mt-4 block text-sm font-medium text-gray-500">
				{message}
			</span>
		</div>
	)
}

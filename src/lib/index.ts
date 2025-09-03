export function formatDate(dateString: string) {
	const date = new Date(dateString);
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		...(isCurrentYear ? {} : { year: 'numeric' })
	});
}

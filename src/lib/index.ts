export function formatDate(dateString: string) {
	const date = new Date(dateString);
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		...(isCurrentYear ? {} : { year: 'numeric' })
	});
}

export function formatDateAndTime(dateString: string) {
	const date = new Date(dateString);
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	const dateFormatted = date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		...(isCurrentYear ? {} : { year: 'numeric' })
	});

	const timeFormatted = date.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	return `${dateFormatted} (${timeFormatted})`;
}

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const items = [
		{
			id: 1,
			isReviewed: false,
			faviconUrl: '/icons/icon-48.png',
			title: 'What is Breader?',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem deleniti dolorem doloremque esse facere fugit, hic labore laboriosam libero maiores, perferendis praesentium quibusdam quos repellat sapiente temporibus totam veniam voluptas.',
			created: new Date().toISOString(),
			modified: new Date().toISOString(),
			hasBody: true,
			localUrl: `/posts/what-is-breader`,
			url: `www.wikipedia.org`
		},
		{
			id: 2,
			isReviewed: false,
			faviconUrl: '/icons/icon-48.png',
			title:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem deleniti dolorem doloremque',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem deleniti dolorem doloremque esse facere fugit, hic labore laboriosam libero maiores, perferendis praesentium quibusdam quos repellat sapiente temporibus totam veniam voluptas.',
			created: new Date().toISOString(),
			modified: new Date().toISOString(),
			hasBody: true,
			localUrl: `/posts/what-is-breader`,
			url: `www.wikipedia.org`
		},
		{
			id: 3,
			isReviewed: false,
			faviconUrl: '/icons/icon-48.png',
			title: 'What is Breader?',
			description: 'asgasd',
			created: new Date().toISOString(),
			modified: new Date().toISOString(),
			hasBody: false,
			localUrl: null,
			url: `https://www.wikipedia.org`
		}
	];

	return { items };
};

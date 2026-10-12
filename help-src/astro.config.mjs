// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readdirSync } from 'node:fs';

// Number of articles in a docs folder, shown as a badge on its sidebar group.
const docsDir = new URL('./src/content/docs/', import.meta.url);
const countBadge = (dir) => ({
	text: String(readdirSync(new URL(`${dir}/`, docsDir)).filter((f) => /\.mdx?$/.test(f)).length),
	class: 'wt-count-badge',
});

// The help center is built into /help/ and deployed alongside the hand-written
// site at the repo root (see .github/workflows/deploy-pages.yml).
export default defineConfig({
	site: 'https://wealthtrunk.app',
	base: '/help',
	// Keeps links to renamed articles working.
	redirects: {
		'/getting-started/record-balances/': '/help/accounts/recording-balances/',
		'/dashboard/projections/': '/help/projections/',
		'/contact/': '/help/',
		'/subscription/free-vs-pro/': '/help/subscription/wealthtrunk-pro/',
		'/goals/wealth-goals/': '/help/goals/',
		'/accounts/holdings/': '/help/holdings/',
		'/getting-started/add-first-account/': '/help/accounts/adding-an-account/',
	},
	integrations: [
		starlight({
			title: 'WealthTrunk Help',
			description:
				'Guides and answers for WealthTrunk, the manual net worth tracker for the whole household.',
			logo: { src: './src/assets/appicon.png', alt: 'WealthTrunk' },
			favicon: '/favicon.png',
			customCss: ['./src/styles/custom.css'],
			markdown: { headingLinks: false },
			components: {
				SocialIcons: './src/components/SocialIcons.astro',
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
			head: [
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
					},
				},
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://wealthtrunk.app/images/social-preview.png' } },
				{ tag: 'script', attrs: { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-TLDM112N75' } },
				{
					tag: 'script',
					content:
						"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TLDM112N75');",
				},
			],
			sidebar: [
				{ label: 'Getting Started', badge: countBadge('getting-started'), items: [{ autogenerate: { directory: 'getting-started' } }] },
				{ label: 'Dashboard', badge: countBadge('dashboard'), items: [{ autogenerate: { directory: 'dashboard' } }] },
				{ label: 'Accounts & Balances', badge: countBadge('accounts'), items: [{ autogenerate: { directory: 'accounts' } }] },
				{ label: 'Account Projections', badge: countBadge('projections'), items: [{ autogenerate: { directory: 'projections' } }] },
				{ label: 'Account Holdings', badge: countBadge('holdings'), items: [{ autogenerate: { directory: 'holdings' } }] },
				{ label: 'Goals', badge: countBadge('goals'), items: [{ autogenerate: { directory: 'goals' } }] },
				{ label: 'Family & Records', badge: countBadge('family'), items: [{ autogenerate: { directory: 'family' } }] },
				{ label: 'Sync, Backup & Export', badge: countBadge('data'), items: [{ autogenerate: { directory: 'data' } }] },
				{ label: 'WealthTrunk Pro', badge: countBadge('subscription'), items: [{ autogenerate: { directory: 'subscription' } }] },
			],
		}),
	],
});

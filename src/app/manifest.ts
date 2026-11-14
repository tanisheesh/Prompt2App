import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prompt2App — AI Web App Builder',
    short_name: 'Prompt2App',
    description:
      'Describe any web app in plain English or voice and get a complete, working, downloadable HTML application in seconds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0C0E',
    theme_color: '#0C0C0E',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

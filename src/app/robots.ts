import { MetadataRoute } from 'next';

/**
 * Paramètres Robots.txt pour garantir la confidentialité du système souverain.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/settings/'],
    },
    sitemap: 'https://iposzen.com/sitemap.xml',
  };
}

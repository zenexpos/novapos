import { MetadataRoute } from 'next';

/**
 * Paramètres Robots.txt pour garantir la confidentialité et l'indexation contrôlée.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/settings/', '/profile/'],
    },
    sitemap: 'https://iposzen.com/sitemap.xml',
  };
}

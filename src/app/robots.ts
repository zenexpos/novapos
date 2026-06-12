import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * Paramètres Robots.txt pour garantir la confidentialité et l'indexation contrôlée.
 * Generated as /robots.txt
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

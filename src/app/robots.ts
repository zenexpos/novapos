import { MetadataRoute } from 'next';

/**
 * إعدادات Robots.txt لضمان خصوصية النظام السيادي.
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

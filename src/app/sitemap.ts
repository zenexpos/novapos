import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * Génération dynamique du sitemap iPOS Zen.
 * Generated as /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://iposzen.com';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
        url: `${baseUrl}/dashboard`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    }
  ];
}

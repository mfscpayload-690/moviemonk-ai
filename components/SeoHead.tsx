import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  buildAbsoluteUrl,
  buildPageTitle,
  toMetaDescription
} from '../lib/seo';

interface SeoHeadProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  robots?: string;
  structuredData?: Array<Record<string, unknown>>;
  preloadImage?: string;
}

const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  robots = 'index,follow',
  structuredData = [],
  preloadImage
}) => {
  const resolvedTitle = buildPageTitle(title);
  const resolvedDescription = toMetaDescription(description);
  const resolvedUrl = buildAbsoluteUrl(path);
  const resolvedImage = buildAbsoluteUrl(image || DEFAULT_SOCIAL_IMAGE);
  const twitterCard = image ? 'summary_large_image' : 'summary';

  return (
    <Helmet prioritizeSeoTags>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={resolvedUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:image" content={resolvedImage} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />

      {structuredData.map((item, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}

      {preloadImage && (
        <link rel="preload" as="image" href={preloadImage} />
      )}
    </Helmet>
  );
};

export default SeoHead;

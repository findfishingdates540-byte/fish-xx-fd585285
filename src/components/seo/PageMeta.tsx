import { Helmet } from "react-helmet-async";

const SITE = "https://fish-xx.lovable.app";

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
}

export function PageMeta({ title, description, path, ogImage, jsonLd, noindex }: PageMetaProps) {
  const url = `${SITE}${path}`;
  const image = ogImage ?? `${SITE}/og-image.png`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
}
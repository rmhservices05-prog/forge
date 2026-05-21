import { Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { initials } from "../data/companies";

type CompanyLogoBadgeProps = {
  color: string;
  fallbackIconSize: number;
  imageClassName: string;
  name: string;
  website: string;
  wrapperClassName: string;
};

function resolveWebsiteUrl(website: string) {
  const trimmed = website.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const normalized = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}

function getCompanyLogoUrls(website: string) {
  const parsedUrl = resolveWebsiteUrl(website);
  if (!parsedUrl) {
    return [];
  }

  const origin = parsedUrl.origin;
  const hostname = parsedUrl.hostname;
  const normalizedWebsite = parsedUrl.toString();

  return [
    `${origin}/favicon.ico`,
    `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(normalizedWebsite)}`,
    `https://icon.horse/icon/${hostname}`,
  ];
}

export function CompanyLogoBadge({
  color,
  fallbackIconSize,
  imageClassName,
  name,
  website,
  wrapperClassName,
}: CompanyLogoBadgeProps) {
  const logoUrls = useMemo(() => getCompanyLogoUrls(website), [website]);
  const [logoIndex, setLogoIndex] = useState(0);

  useEffect(() => {
    setLogoIndex(0);
  }, [logoUrls]);

  const activeLogoUrl = logoUrls[logoIndex] ?? null;

  return (
    <span className={`${wrapperClassName} logo-${color}`} aria-hidden="true">
      {activeLogoUrl ? (
        <img
          src={activeLogoUrl}
          alt={`${name} logo`}
          className={imageClassName}
          onError={() => setLogoIndex((current) => current + 1)}
        />
      ) : (
        <>
          <Building2 size={fallbackIconSize} />
          <span>{initials(name)}</span>
        </>
      )}
    </span>
  );
}

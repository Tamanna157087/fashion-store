import { useEffect, memo } from "react";

const SEO = memo(({
  title = "Fashion Store | Online Fashion Shopping",
  description = "Shop trendy fashion, footwear, accessories and beauty products.",
  image = "",
  url = "",
  type = "website",
}) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Helper to set or create meta tags
    const setMetaTag = (attr, attrValue, content) => {
      let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content || "");
    };

    // Helper to set canonical link
    const setCanonicalLink = (hrefValue) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", hrefValue || window.location.href);
    };

    const currentUrl = url || window.location.href;
    const metaImage = image || `${window.location.origin}/assets/hero.png`;

    // Standard Meta Tags
    setMetaTag("name", "description", description);

    // Open Graph Tags
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", metaImage);
    setMetaTag("property", "og:url", currentUrl);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:site_name", "Fashion Store");

    // Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", metaImage);

    // Canonical URL
    setCanonicalLink(currentUrl);

  }, [title, description, image, url, type]);

  return null;
});

SEO.displayName = "SEO";

export default SEO;

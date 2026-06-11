import { useEffect } from "react";

const BASE_URL = "https://diagflo.vercel.app";

/**
 * Sets the canonical link tag for the current page.
 * Creates or updates the <link rel="canonical"> in <head>.
 */
export function useCanonical(path: string) {
  useEffect(() => {
    const url = `${BASE_URL}${path}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);

    return () => {
      // Don't remove — next page will update it
    };
  }, [path]);
}

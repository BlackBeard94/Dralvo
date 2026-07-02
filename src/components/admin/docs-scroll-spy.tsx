"use client";

/**
 * Lights up the doc section currently in view (and its TOC link) as you scroll.
 * Pure DOM/IntersectionObserver — the page stays a server component.
 */
import { useEffect } from "react";

export function DocsScrollSpy() {
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".doc-card"));
    if (cards.length === 0) return;

    const links = new Map<string, HTMLElement>();
    document.querySelectorAll<HTMLElement>("[data-toc-link]").forEach((el) => {
      const id = el.getAttribute("data-toc-link");
      if (id) links.set(id, el);
    });

    let activeId = "";
    const setActive = (id: string) => {
      if (id === activeId) return;
      activeId = id;
      for (const c of cards) c.classList.toggle("is-active", c.id === id);
      for (const [lid, el] of links) el.classList.toggle("is-active", lid === id);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 1] },
    );

    for (const c of cards) io.observe(c);
    return () => io.disconnect();
  }, []);

  return null;
}

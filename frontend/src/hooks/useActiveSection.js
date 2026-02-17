import { useEffect, useState } from "react";

export function useActiveSection(sectionIds) {
  const [activeId, setActiveId] = useState(sectionIds[0] || "home");

  useEffect(() => {
    const getNavOffset = () => {
      const nav = document.querySelector(".mk-navbar");
      return (nav?.offsetHeight || 70) + 10; // navbar height + small spacing
    };

    const getSectionTops = () =>
      sectionIds
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return { id, top };
        })
        .filter(Boolean);

    const handle = () => {
      const offset = getNavOffset();
      const scrollPos = window.scrollY + offset;

      const tops = getSectionTops();
      if (!tops.length) return;

      // active = last section whose top is above current scroll position
      let current = tops[0].id;
      for (const s of tops) {
        if (s.top <= scrollPos) current = s.id;
      }
      setActiveId(current);
    };

    // run once on load (supports direct hash open)
    handle();

    // also update when clicking nav (hash change)
    const onHash = () => handle();

    // smooth + efficient updates
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        handle();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sectionIds]);

  return activeId;
}

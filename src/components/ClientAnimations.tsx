"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal helper. Uses data-revealed (not classList) so React-owned
 * className props are never mutated — mutating class caused hydration mismatches
 * with Suspense/useSearchParams pages.
 */
export default function ClientAnimations() {
  useEffect(() => {
    let ticking = false;

    function revealVisibleElements() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const reveals = document.querySelectorAll(
          ".reveal:not([data-revealed]), .reveal-stagger:not([data-revealed])"
        );
        const threshold = window.innerHeight - 150;

        reveals.forEach((el) => {
          if (el.getBoundingClientRect().top < threshold) {
            el.setAttribute("data-revealed", "");
          }
        });

        ticking = false;
      });
    }

    // Defer past hydration of Suspense boundaries that mount after first paint
    const startId = window.setTimeout(revealVisibleElements, 0);
    window.addEventListener("scroll", revealVisibleElements, { passive: true });

    return () => {
      window.clearTimeout(startId);
      window.removeEventListener("scroll", revealVisibleElements);
    };
  }, []);

  return null;
}

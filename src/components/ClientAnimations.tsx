"use client";

import { useEffect } from "react";

export default function ClientAnimations() {
  useEffect(() => {
    let ticking = false;

    function handleScrollAnimation() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const reveals = document.querySelectorAll('[data-animate="true"], .reveal');
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        for (let i = 0; i < reveals.length; i++) {
          const elementTop = reveals[i].getBoundingClientRect().top;
          if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
          }
        }

        ticking = false;
      });
    }

    handleScrollAnimation();
    window.addEventListener("scroll", handleScrollAnimation, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollAnimation);
    };
  }, []);

  return null;
}

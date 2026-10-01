"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Landmark, Scale } from "lucide-react";

const pillars = [
  {
    icon: Landmark,
    title: "Established group",
    body: "AlWahabCo is the parent company behind Manzil — real estate with a long view.",
  },
  {
    icon: ShieldCheck,
    title: "Verified by design",
    body: "The shield in our mark is not decoration. Every listing earns that check.",
  },
  {
    icon: Scale,
    title: "Accountable titles",
    body: "We stand behind clear ownership so buyers never gamble with their savings.",
  },
];

export function AuthoritySeal() {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay },
          viewport: { once: true, amount: 0.2, margin: "0px 0px -40px 0px" },
        };

  return (
    <section
      id="authority"
      aria-labelledby="authority-heading"
      className="relative overflow-hidden border-y border-border"
    >
      {/* Soft institutional field — ivory into deep green mist */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 20% 40%, rgba(25, 91, 59, 0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 70%, rgba(209, 162, 85, 0.12) 0%, transparent 50%), linear-gradient(180deg, #faf8f3 0%, #f3f0e8 100%)",
        }}
      />

      {/* Faint geometric lattice — echoes the arch pattern in the logo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #195b3b 1px, transparent 1px),
            linear-gradient(150deg, #195b3b 1px, transparent 1px)
          `,
          backgroundSize: "28px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* Seal / logo plate */}
          <motion.div
            className="relative mx-auto w-full max-w-md lg:mx-0"
            {...fadeUp(0)}
          >
            {/* Gold ambient glow behind the seal */}
            <motion.div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(209, 162, 85, 0.35) 0%, rgba(25, 91, 59, 0.12) 45%, transparent 70%)",
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.55, 0.85, 0.55],
                      scale: [1, 1.04, 1],
                    }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-white shadow-[0_24px_60px_-28px_rgba(24,34,27,0.35)]">
              {/* Thin gold corner accents */}
              <span
                aria-hidden
                className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-accent"
              />
              <span
                aria-hidden
                className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-accent"
              />
              <span
                aria-hidden
                className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-accent"
              />
              <span
                aria-hidden
                className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-accent"
              />

              <div className="relative px-8 pb-6 pt-8 sm:px-10 sm:pb-8 sm:pt-10">
                <motion.div
                  className="relative mx-auto aspect-square w-full max-w-[280px] sm:max-w-[320px]"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.85,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.15,
                  }}
                  viewport={{ once: true, amount: 0.4 }}
                >
                  <Image
                    src="/images/logo.jpeg"
                    alt="Manzil By AlWahabCo — official group seal"
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 280px, 320px"
                    quality={90}
                    priority={false}
                  />
                </motion.div>

                {/* Drawn gold horizon line under the mark */}
                <motion.div
                  className="mx-auto mt-2 h-px w-full max-w-[200px] origin-center bg-gradient-to-r from-transparent via-accent to-transparent"
                  initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                  whileInView={reduceMotion ? undefined : { scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
                  viewport={{ once: true }}
                />

                <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-primary/70">
                  Official group mark
                </p>
              </div>
            </div>
          </motion.div>

          {/* Authority copy */}
          <div>
            <motion.p
              className="text-sm font-medium uppercase tracking-wider text-primary"
              {...fadeUp(0.05)}
            >
              The house behind Manzil
            </motion.p>

            <motion.h2
              id="authority-heading"
              className="mt-3 font-serif text-3xl font-semibold leading-snug text-foreground sm:text-4xl"
              {...fadeUp(0.12)}
            >
              Built by{" "}
              <span className="text-primary">AlWahabCo</span>
              <span className="text-accent">.</span>
            </motion.h2>

            <motion.p
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
              {...fadeUp(0.2)}
            >
              Manzil is not a marketplace alone — it is the verified property arm of{" "}
              <strong className="font-semibold text-foreground">AlWahabCo</strong>, the group that
              stands behind every title we certify. When you see our seal, you are looking at a
              promise owned by the people who built this platform.
            </motion.p>

            <motion.blockquote
              className="mt-8 border-l-2 border-accent pl-5"
              {...fadeUp(0.28)}
            >
              <p className="font-serif text-lg leading-snug text-foreground sm:text-xl">
                &ldquo;Destination with dignity — a home you can trust, from a group that answers
                for it.&rdquo;
              </p>
              <footer className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Manzil · by AlWahabCo
              </footer>
            </motion.blockquote>

            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {pillars.map((pillar, i) => (
                <motion.li key={pillar.title} {...fadeUp(0.35 + i * 0.08)}>
                  <pillar.icon className="h-5 w-5 text-accent" aria-hidden />
                  <p className="mt-3 font-serif text-base font-semibold text-foreground">
                    {pillar.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {pillar.body}
                  </p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

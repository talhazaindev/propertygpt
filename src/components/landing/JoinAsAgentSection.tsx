"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Handshake,
  Shield,
  Target,
  Users,
  Wallet,
  ArrowRight,
  Building2,
} from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Public Agent Trust Profile",
    body: "Build real reputation — verified identity, sold deals, response time, and a Trust Score clients can see. No vanity stars.",
  },
  {
    icon: Users,
    title: "Access to Manzil clients",
    body: "Tap into buyers and sellers who already trust verified listings. Bring your own clients through Manzil and grow together.",
  },
  {
    icon: Building2,
    title: "Verified property inventory",
    body: "Work with title-checked listings and get assigned verification work so you earn while raising the standard of the market.",
  },
  {
    icon: Wallet,
    title: "Commission & deal rewards",
    body: "Earn on verification support, referrals, and closed deals. Track pending, approved, and paid earnings in your dashboard.",
  },
  {
    icon: Target,
    title: "Monthly targets & bonuses",
    body: "Clear goals for deals, verifications, and referrals — with rewards when you hit them. Stay motivated with visible progress.",
  },
  {
    icon: Award,
    title: "Golden Agent exclusives",
    body: "Top performers unlock Golden status: exclusive rewards and a dedicated Manzil support agent assigned to your desk.",
  },
  {
    icon: Handshake,
    title: "A community you can rely on",
    body: "Partner with Manzil’s network of agents and ops — backup when you need it, without giving up control of your business.",
  },
  {
    icon: Briefcase,
    title: "You stay the owner",
    body: "Run your own agency brand under Manzil’s trust umbrella. Exclusive partner benefits without becoming an employee.",
  },
];

export function JoinAsAgentSection() {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 22 },
          whileInView: { opacity: 1, y: 0 },
          transition: {
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1] as const,
            delay,
          },
          viewport: { once: true, amount: 0.15, margin: "0px 0px -40px 0px" },
        };

  return (
    <section
      id="agents"
      aria-labelledby="agents-heading"
      className="relative overflow-hidden border-y border-border"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 0% 20%, rgba(25,91,59,0.1) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 100% 80%, rgba(209,162,85,0.14) 0%, transparent 50%), linear-gradient(180deg, #f3f0e8 0%, #faf8f3 45%, #f3f7f1 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div {...fadeUp(0)}>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Partner program
            </p>
            <h2
              id="agents-heading"
              className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Join us as an agent
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Exclusive benefits, access to unlimited clients and properties, and a
              community you can rely on — while you remain the owner of your own
              business.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.08)}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-primary-dark p-6 text-primary-foreground shadow-[0_24px_50px_-28px_rgba(15,61,40,0.55)] sm:p-8"
          >
            <div className="flex items-center gap-2 text-accent">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                Manzil agent network
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl font-semibold leading-snug sm:text-3xl">
              Build reputation that clients trust — and get paid for raising the bar.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-primary-foreground/85">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Trust Score profile on every deal you touch
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Verification assignments from Manzil ops
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Golden Agent path with dedicated support
              </li>
            </ul>
            <Link
              href="/join-as-agent"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:opacity-95"
            >
              Apply to join
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, i) => (
            <motion.article
              key={benefit.title}
              {...fadeUp(0.1 + i * 0.04)}
              className="group rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-sm transition hover:border-primary/30 hover:shadow-[0_16px_40px_-24px_rgba(25,91,59,0.35)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <benefit.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {benefit.body}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          {...fadeUp(0.35)}
          className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-secondary/50 px-6 py-5 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">
              Ready to grow with Manzil?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Apply in minutes. After verification, you get dashboard access and
              your Trust Profile.
            </p>
          </div>
          <Link
            href="/join-as-agent"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Join as an agent
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

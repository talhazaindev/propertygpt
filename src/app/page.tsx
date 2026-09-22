import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  CheckCircle2,
  HardHat,
  Tag,
  BookOpen,
  Scale,
  UserCheck,
  MapPinned,
  BadgeCheck,
  Wallet,
  Headset,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import PropertyCard from "@/components/PropertyCard";
import { RequestVerificationCta } from "@/components/landing/RequestVerificationCta";

async function getFeaturedProperties() {
  try {
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { featured: true },
          { status: { in: ["ACTIVE", "VERIFIED"] } },
          { verifiedAt: { not: null } },
        ],
      },
      include: { city: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
    return properties;
  } catch (error) {
    console.error("Failed to load featured properties:", error);
    return [];
  }
}

function formatPrice(price: number): string {
  if (price >= 10_000_000) {
    return `PKR ${(price / 10_000_000).toFixed(2)} Cr`;
  }
  if (price >= 100_000) {
    return `PKR ${(price / 100_000).toFixed(1)} Lakh`;
  }
  return `PKR ${price.toLocaleString()}`;
}

export default async function Home() {
  const featured = await getFeaturedProperties();

  const partners = [
    "Land Records Authority",
    "DHA & Bahria Societies",
    "Verified Legal Partners",
    "Registrar Office Checks",
    "NADRA-backed Identity",
  ];

  const checks = [
    {
      step: "01",
      title: "Document Collection",
      body: "We gather the title deed, mutation (intiqal), fard, and society transfer letters directly from the source.",
      icon: FileText,
    },
    {
      step: "02",
      title: "Legal Title Search",
      body: "Our lawyers trace ownership history at the registrar and land-record authority to rule out disputes and liens.",
      icon: Scale,
    },
    {
      step: "03",
      title: "Owner Identity Check",
      body: "Seller identity is confirmed against NADRA records so you know exactly who you are dealing with.",
      icon: UserCheck,
    },
    {
      step: "04",
      title: "Physical Inspection",
      body: "A field agent visits the plot or house to confirm location, size, possession status, and dues.",
      icon: MapPinned,
    },
  ];

  const guarantees = [
    {
      title: "Clear-Title Guarantee",
      body: "We only list properties with a legally clean, transferable title — confirmed in writing.",
      icon: BadgeCheck,
    },
    {
      title: "Anti-Fraud Assurance",
      body: "Forged documents and fake owners are filtered out before a listing ever reaches you.",
      icon: ShieldCheck,
    },
    {
      title: "Money-Safe Process",
      body: "Payments and transfers are structured so funds move only when documents are confirmed.",
      icon: Wallet,
    },
    {
      title: "Dedicated Advisor",
      body: "A real Manzil advisor guides you from first viewing to final registry — one point of contact.",
      icon: Headset,
    },
  ];

  const reviews = [
    {
      quote:
        "I was terrified of the file being fake — it happened to my cousin. Manzil's team showed me the verified fard and title search before I paid a single rupee. Total peace of mind.",
      name: "Ayesha Khan",
      meta: "Bought in DHA, Lahore",
      initials: "AK",
    },
    {
      quote:
        "Living abroad, I couldn't inspect the plot myself. Their field agent sent me a full report and confirmed possession. This is how property buying should work in Pakistan.",
      name: "Bilal Ahmed",
      meta: "Overseas buyer, Islamabad",
      initials: "BA",
    },
    {
      quote:
        "No pushy dealers, no hidden dues. The advisor stayed with me until the transfer was registered in my name. I finally felt someone was on my side.",
      name: "Sana Rauf",
      meta: "First-time buyer, Karachi",
      initials: "SR",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-medium text-primary sm:text-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Every listing legally verified before you see it
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Buy property in Pakistan{" "}
              <span className="text-primary">without the fear.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Fake files, disputed plots, and double-sold houses end here. At Manzil, it is{" "}
              <strong className="font-semibold text-foreground">our responsibility</strong> to make
              sure you get a properly verified property — clear title, real ownership, genuine
              documents.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/properties"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Browse Verified Listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#verification"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4" />
                How We Verify
              </a>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-6 border-t border-border pt-10 text-center">
            {[
              { value: "7,400+", label: "Verified properties" },
              { value: "100%", label: "Title-checked" },
              { value: "12", label: "Cities covered" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-14 overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
              <Image
                src="/images/hero-home.jpg"
                alt="A modern verified villa listed on Manzil in Pakistan"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-xl border border-white/20 bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Manzil Verified
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Title deed, ownership &amp; society dues confirmed by our legal team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section
        aria-label="Verification partners"
        className="border-y border-border bg-secondary/40"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Cross-checked against official &amp; institutional records
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {partners.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center font-serif text-4xl font-semibold text-primary sm:text-5xl">
            Zero
          </p>
          <p className="text-center text-sm text-muted-foreground">disputed titles delivered</p>
        </div>
      </section>

      {/* Promise */}
      <section id="promise" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Our Promise</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
              &ldquo;It will be our responsibility to make sure that you got proper verified
              property.&rdquo;
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              In Pakistan, buying property should feel like coming home — not gambling with your
              life savings. We built Manzil on a single principle: trust is not a feature, it is the
              foundation. Before any listing reaches you, our legal and field teams do the hard,
              unglamorous work of confirming that what you see is exactly what you get.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "We stand behind every title",
                  body: "If a title we verified turns out to be defective, that is on us — not you.",
                },
                {
                  title: "We check people, not just paper",
                  body: "Owners and sellers are identity-verified so you never deal with an impostor.",
                },
                {
                  title: "We walk the plot ourselves",
                  body: "Field agents physically inspect the property and confirm it matches the documents.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-sm lg:aspect-square">
            <Image
              src="/images/verification.jpg"
              alt="Manzil's legal team reviewing property documents with a client before a sale"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Verification standard */}
      <section id="verification" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              The Verification Standard
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Four checks stand between a listing and you
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nothing is published on Manzil until it clears every stage. Only then does it earn the
              Manzil Verified badge.
            </p>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {checks.map((check) => (
              <li
                key={check.step}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="font-serif text-3xl font-semibold text-primary/30">{check.step}</span>
                <check.icon className="mt-3 h-6 w-6 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">
                  {check.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{check.body}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
            Handover with confidence. We stay with you through the transfer and registry so the
            property legally becomes yours — start to finish.
          </p>
        </div>
      </section>

      {/* Featured listings */}
      <section id="listings" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Featured verified listings
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each of these has passed all four verification checks. The badge means the paperwork
              is real.
            </p>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            View all listings
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property) => (
              <PropertyCard
                key={property.id}
                property={{
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  address: property.city
                    ? `${property.address}, ${property.city.name}`
                    : property.address,
                  images: property.images,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                  area: property.area,
                  isVerified:
                    Boolean(property.verifiedAt) ||
                    property.status === "VERIFIED" ||
                    property.status === "ACTIVE",
                  status: property.status,
                  contactPhone: property.contactPhone ?? undefined,
                  formattedPrice: formatPrice(property.price),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <p className="font-serif text-xl text-foreground">Verified listings coming soon</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse our full catalogue or request a verification for a property you&apos;re
              considering.
            </p>
            <Link
              href="/properties"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Browse Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Product extras */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              More ways we help
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Beyond verified buying — sell, build, and stay informed with Manzil.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                href: "/sell",
                title: "Sell your property",
                body: "List with confidence. We verify before buyers see your home.",
                icon: Tag,
              },
              {
                href: "/construction",
                title: "Hire us to construct",
                body: "From plot to finished home — guided by the same trust standard.",
                icon: HardHat,
              },
              {
                href: "/blogs",
                title: "Insights & guides",
                body: "Practical advice on titles, societies, and buying safely in Pakistan.",
                icon: BookOpen,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Guarantees that put the risk on us
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Trust is easy to promise and hard to prove. These are the commitments we are willing
              to be held to.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g) => (
              <div
                key={g.title}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6"
              >
                <g.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 font-serif text-lg font-semibold">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Trusted by families who couldn&apos;t afford a mistake
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real stories from buyers who chose verification over regret.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <blockquote
              key={r.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{r.quote}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                  {r.initials}
                </div>
                <div>
                  <cite className="not-italic text-sm font-semibold text-foreground">{r.name}</cite>
                  <p className="text-xs text-muted-foreground">{r.meta}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Start with confidence
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Let us verify your next property — before you commit
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tell us what you&apos;re looking for, or share a property you&apos;re considering. Our
              team will run the full verification and get back to you — no obligation.
            </p>
            <RequestVerificationCta />
            <p className="mt-4 text-xs text-muted-foreground">
              By submitting, you agree to be contacted by a Manzil advisor. We never share your
              details.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Landing copy mirrored from the Manzil web homepage.
 */

export const LANDING_STATS = [
  { value: "7,400+", label: "Verified properties" },
  { value: "100%", label: "Title-checked" },
  { value: "12", label: "Cities covered" },
] as const;

export const LANDING_PARTNERS = [
  "Land Records Authority",
  "DHA & Bahria Societies",
  "Verified Legal Partners",
  "Registrar Office Checks",
  "NADRA-backed Identity",
] as const;

export const LANDING_CHECKS = [
  {
    step: "01",
    title: "Document Collection",
    body: "Title deed, mutation, fard, and society transfer letters gathered from the source.",
  },
  {
    step: "02",
    title: "Legal Title Search",
    body: "Ownership history traced at the registrar to rule out disputes and liens.",
  },
  {
    step: "03",
    title: "Owner Identity Check",
    body: "Seller identity confirmed so you know exactly who you are dealing with.",
  },
  {
    step: "04",
    title: "Physical Inspection",
    body: "A field agent visits to confirm location, size, possession, and dues.",
  },
] as const;

export const LANDING_GUARANTEES = [
  {
    title: "Clear-Title Guarantee",
    body: "We only list properties with a legally clean, transferable title.",
  },
  {
    title: "Anti-Fraud Assurance",
    body: "Forged documents and fake owners are filtered out before you see a listing.",
  },
  {
    title: "Money-Safe Process",
    body: "Funds move only when documents are confirmed — structured for your protection.",
  },
  {
    title: "Dedicated Advisor",
    body: "One Manzil advisor guides you from first viewing to final registry.",
  },
] as const;

export const LANDING_REVIEWS = [
  {
    quote:
      "I was terrified of the file being fake. Manzil showed me the verified fard and title search before I paid a single rupee.",
    name: "Ayesha Khan",
    meta: "Bought in DHA, Lahore",
    initials: "AK",
  },
  {
    quote:
      "Living abroad, I couldn't inspect the plot myself. Their field agent sent a full report and confirmed possession.",
    name: "Bilal Ahmed",
    meta: "Overseas buyer, Islamabad",
    initials: "BA",
  },
  {
    quote:
      "No pushy dealers, no hidden dues. The advisor stayed with me until the transfer was registered in my name.",
    name: "Sana Rauf",
    meta: "First-time buyer, Karachi",
    initials: "SR",
  },
] as const;

export const LANDING_SERVICES = [
  {
    key: "browse",
    title: "Browse verified homes",
    body: "Sale and rental inventory that cleared Manzil verification.",
    href: "/(tabs)/browse" as const,
  },
  {
    key: "sell",
    title: "Sell your property",
    body: "List with confidence. We verify before buyers see your home.",
    href: "/(tabs)/sell" as const,
  },
  {
    key: "request",
    title: "Request a property",
    body: "Tell us what you need — our advisors will help you find it.",
    href: "/request/create" as const,
  },
  {
    key: "construction",
    title: "Hire us to construct",
    body: "From plot to finished home — guided by the same trust standard.",
    href: "/construction/create" as const,
  },
] as const;

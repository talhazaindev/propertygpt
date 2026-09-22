"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false }
);

const ClientAnimations = dynamic(() => import("@/components/ClientAnimations"), {
  ssr: false,
});

export default function DeferredExtras() {
  return (
    <>
      <Toaster />
      <ClientAnimations />
    </>
  );
}

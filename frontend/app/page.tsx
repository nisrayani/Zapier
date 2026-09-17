"use client";

import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { HeroVideo } from "@/components/HeroVideo";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("token");

    if (hasToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="pb-48">
      <Appbar />
      <Hero />
      <div className="pt-8">
        <HeroVideo />
      </div>
    </main>
  );
}

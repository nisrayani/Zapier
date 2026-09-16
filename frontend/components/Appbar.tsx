"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkButton } from "./buttons/LinkButton";
import { PrimaryButton } from "./buttons/PrimaryButton";

export const Appbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const appMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token")));
  }, []);

  useEffect(() => {
    if (!isAppMenuOpen) {
      return;
    }

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        appMenuRef.current &&
        !appMenuRef.current.contains(event.target as Node)
      ) {
        setIsAppMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, [isAppMenuOpen]);

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {isLoggedIn && (
          <div ref={appMenuRef} className="relative">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isAppMenuOpen}
              onClick={() => setIsAppMenuOpen((isOpen) => !isOpen)}
              className="grid grid-cols-3 gap-1 rounded p-2 hover:bg-slate-100"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-slate-700"
                />
              ))}
            </button>
            {isAppMenuOpen && (
              <div className="absolute left-0 top-12 z-10 w-48 rounded border bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsAppMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAppMenuOpen(false);
                    router.push("/zap/create");
                  }}
                  className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  Create a Zap
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col justify-center text-2xl font-black tracking-tight text-slate-950">
          Zapier
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isLoggedIn ? (
          <LinkButton
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/login");
            }}
          >
            Logout
          </LinkButton>
        ) : (
          <>
            <div>
              <LinkButton
                onClick={() => {
                  router.push("/login");
                }}
              >
                Login
              </LinkButton>
            </div>
            <PrimaryButton
              onClick={() => {
                router.push("/signup");
              }}
            >
              Signup
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
};

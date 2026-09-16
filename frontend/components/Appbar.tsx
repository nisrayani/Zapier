"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkButton } from "./buttons/LinkButton";
import { PrimaryButton } from "./buttons/PrimaryButton";

export const Appbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token")));
  }, []);

  return (
    <div className="flex border-b justify-between p-4">
      <div className="flex flex-col justify-center text-2xl font-extrabold">
        Zapier
      </div>
      <div className="flex">
        <div className="pr-4">
          <LinkButton onClick={() => {}}>Contact Sales</LinkButton>
        </div>
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
            <div className="pr-4">
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

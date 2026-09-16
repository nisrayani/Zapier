"use client";

import { ReactNode } from "react";

export const LinkButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      className="flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

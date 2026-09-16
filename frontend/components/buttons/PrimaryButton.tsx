import { ReactNode } from "react";

export const PrimaryButton = ({
  children,
  onClick,
  size = "small",
}: {
  children: ReactNode;
  onClick: () => void;
  size?: "big" | "small";
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size === "small" ? "text-sm" : "text-lg"} ${size === "small" ? "px-7 py-2.5" : "px-10 py-4"} cursor-pointer rounded-full bg-[#ff4f00] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e64600] hover:shadow-lg active:translate-y-0`}
    >
      {children}
    </button>
  );
};

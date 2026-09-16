import { ReactNode } from "react";

export const PrimaryButton = ({
  children,
  onClick,
  size = "small",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  size?: "big" | "small";
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${size === "small" ? "text-sm" : "text-lg"} ${size === "small" ? "px-7 py-2.5" : "px-10 py-4"} rounded-full bg-[#ff4f00] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e64600] hover:shadow-lg active:translate-y-0 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
};

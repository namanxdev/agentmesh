import React from "react";
import { cn } from "@/lib/utils";

export const MagicButton = ({
  title,
  icon,
  position = "left",
  handleClick,
  className,
  disabled
}: {
  title: string;
  icon?: React.ReactNode;
  position?: "left" | "right";
  handleClick?: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      className={cn(
        "group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-xl bg-white px-6 font-medium text-black transition-all duration-300 ease-out",
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-neutral-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.96]",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex items-center gap-2 relative z-10 transition-transform duration-300 ease-out group-active:scale-[0.98]">
        {position === "left" && icon}
        <span className="tracking-tight text-sm">{title}</span>
        {position === "right" && icon}
      </div>
    </button>
  );
};

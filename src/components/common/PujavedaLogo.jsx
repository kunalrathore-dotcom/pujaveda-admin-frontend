import logoImg from "../../assets/pujaveda-logo.jpg";

/**
 * Official Pujaveda Logo Component (Admin Portal)
 * Uses the exact brand asset provided, preserving original aspect ratio and clarity.
 * 
 * Sizing options:
 * - "sm": Height 36px - 40px (Sidebar / Mobile headers)
 * - "md": Height 44px - 50px (Standard admin headers)
 * - "lg": Height 56px - 64px (Administrative Login & Auth screens)
 */
export default function PujavedaLogo({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-9 sm:h-10 w-auto max-w-[150px] sm:max-w-[170px]",
    md: "h-11 sm:h-12 w-auto max-w-[180px] sm:max-w-[210px]",
    lg: "h-14 sm:h-16 w-auto max-w-[220px] sm:max-w-[260px]",
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="Pujaveda Administrative Portal"
        className={`${selectedSizeClass} object-contain transition-all duration-200`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

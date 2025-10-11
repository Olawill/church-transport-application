interface CarBackProps {
  size?: number;
  className?: string;
  color?: string;
}

export function CarBack({
  size = 24,
  className = "",
  color = "currentColor",
}: CarBackProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 8 2 2 1.5-3.7A2 2 0 0 1 8.354 5h7.246a2 2 0 0 1 1.903 1.257L19 10l2-2" />
      <path d="M7 14h.01" />
      <path d="M17 14h.01" />
      <rect width="18" height="8" x="3" y="10" rx="2" />
      <rect width="4" height="2" x="10" y="13" rx="0.5" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </svg>
  );
}

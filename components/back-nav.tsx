import Link from "next/link";

export function BackNav({
  href,
  contextLabel,
  title,
}: {
  href: string;
  contextLabel: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 flex items-start gap-2 no-underline"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-secondary-text"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <div className="flex flex-col">
        <span className="text-[11px] text-secondary-text">
          {contextLabel}
        </span>
        <span className="text-[15px] font-medium text-primary-text">
          {title}
        </span>
      </div>
    </Link>
  );
}

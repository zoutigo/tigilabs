import Link from "next/link";

type TigilabsLogoProps = Readonly<{
  className?: string;
  compact?: boolean;
  href?: string;
}>;

export function TigilabsLogo({
  className = "",
  compact = false,
  href,
}: TigilabsLogoProps) {
  const content = (
    <span className={`tigilabs-logo ${className}`.trim()}>
      <svg
        aria-hidden="true"
        className="tigilabs-logo-mark"
        focusable="false"
        viewBox="0 0 48 48"
      >
        <path
          d="M7 11.5C7 7.9 9.9 5 13.5 5H39c1.7 0 3 1.3 3 3v4.6c0 1.7-1.3 3-3 3h-8.7v21.9c0 3-2.4 5.5-5.5 5.5h-4.3V21.6l-7.1 7.1c-1.2 1.2-3.1 1.2-4.2 0L6.9 26.4c-1.2-1.2-1.2-3.1 0-4.2l6.6-6.6h-3.5c-1.7 0-3-1.4-3-3.1v-1Z"
          fill="#2563eb"
        />
        <path d="M19.2 5h8.2v11.8l-8.2 8.2V5Z" fill="#0d1b2a" opacity=".18" />
      </svg>
      <span className="tigilabs-logo-copy">
        <strong>TIGILABS</strong>
        {!compact ? <small>Solutions numeriques</small> : null}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link aria-label="Tigilabs - tableau de bord" href={href}>
      {content}
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="CrIE — Cracking IELTS Essays"
      className="inline-flex shrink-0 items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
    >
      <Image
        src="/CrIE.png"
        alt="CrIE — Cracking IELTS Essays"
        width={1536}
        height={1024}
        priority
        sizes="(min-width: 640px) 84px, 72px"
        className="h-12 w-[72px] object-contain transition-[filter] dark:brightness-[2] sm:h-14 sm:w-[84px]"
      />
    </Link>
  );
}

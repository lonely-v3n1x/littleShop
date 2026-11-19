import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container grid place-items-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">That page is not here</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be old, or the page may have moved. The bundle catalogue is still one tap away.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to blink
      </Link>
    </div>
  );
}

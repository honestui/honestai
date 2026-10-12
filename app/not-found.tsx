import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center bg-[var(--hui-color-background-base-primary)] px-5 py-16 text-[var(--hui-color-foreground-base-primary)] sm:px-8">
      <p className="font-mono text-sm text-[var(--hui-color-foreground-base-secondary)]">HTTP 404</p>
      <h1 className="mt-4 text-4xl font-medium tracking-[var(--hui-letter-spacing-t4)] sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
        Honest AI doesn’t have a page at this URL. The documentation lists every component.
      </p>
      <p className="mt-8">
        <Link href="/docs" className="font-medium underline underline-offset-4">
          Open the documentation
        </Link>
      </p>
    </main>
  );
}

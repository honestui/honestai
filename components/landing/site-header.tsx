import Link from "next/link";

import { GithubIcon } from "@/assets/icons";
import { BrandWordmark } from "@/components/brand-wordmark";
import ThemeSwitcher from "@/components/docs/sidebar/theme-switcher";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header>
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Honest AI home"
          className="rounded-[var(--hui-radius-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
        >
          <BrandWordmark className="text-[17px]" markClassName="size-7" />
        </Link>

        <nav aria-label="Site links" className="flex items-center gap-1 sm:gap-2">
          <Button
            aria-label="Honest AI on GitHub (opens in a new tab)"
            className="h-8"
            render={
              <Link
                href="https://github.com/honestui/honestai"
                target="_blank"
                rel="noreferrer"
              />
            }
            size="sm"
            variant="link"
          >
            <GithubIcon aria-hidden="true" className="size-4" />
          </Button>
          <ThemeSwitcher />
          <Button className="h-8" render={<Link href="/docs" />} size="sm" variant="ghost">
            Documentation
          </Button>
        </nav>
      </div>
    </header>
  );
}

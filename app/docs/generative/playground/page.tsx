import type { Metadata } from "next";

import { Playground } from "@/components/docs/playground/playground";
import { getPlaygroundProvider } from "@/lib/playground-provider";
import { absoluteUrl } from "@/lib/utils";

const title = "Generative UI Playground";
const description =
  "Chat with a model and see its replies render as Markdown, with Honest AI components such as charts, forms, and cards where the model adds them.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/docs/generative/playground") },
  twitter: { card: "summary", title, description },
  openGraph: {
    type: "website",
    url: absoluteUrl("/docs/generative/playground"),
    title,
    description,
    siteName: "Honest AI",
  },
};

// Override the docs layout's static rendering for runtime provider configuration.
export const dynamic = "force-dynamic";

export default function PlaygroundPage() {
  // The picker and chat route must use the same runtime provider configuration.
  return <Playground provider={getPlaygroundProvider()} />;
}

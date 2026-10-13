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
  openGraph: {
    type: "website",
    url: absoluteUrl("/docs/generative/playground"),
    title,
    description,
    siteName: "Honest AI",
  },
};

export default function PlaygroundPage() {
  // Read on the server, so the browser never sees which keys exist.
  return <Playground provider={getPlaygroundProvider()} />;
}

import { NextResponse, type NextRequest } from "next/server";

import { getPublicItems, getRegistryDependencyUrls, getRegistryItem } from "@/lib/registry";
import { SITE_NAME } from "@/globals/constants/site";
import { SITE_URL } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

/** The origin the client used, so dependency URLs resolve on previews and locally as well as in production. */
function getPublicRequestOrigin(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

function notFound() {
  return NextResponse.json(
    {
      code: "REGISTRY_ITEM_NOT_FOUND",
      message: "Registry item not found",
      resolution: "Use /r/registry.json to find a valid registry item name.",
    },
    { status: 404 },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (path.length !== 1 || !path[0].endsWith(".json")) return notFound();

  const name = path[0].slice(0, -".json".length);

  if (name === "registry") {
    return NextResponse.json({
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: SITE_NAME,
      homepage: SITE_URL,
      items: await getPublicItems(),
    });
  }

  const item = await getRegistryItem(name);
  if (!item) return notFound();

  const registryDependencies = getRegistryDependencyUrls(item, getPublicRequestOrigin(request));

  return NextResponse.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    ...(item.dependencies.length > 0 && { dependencies: item.dependencies }),
    ...(registryDependencies.length > 0 && { registryDependencies }),
    files: item.files,
  });
}

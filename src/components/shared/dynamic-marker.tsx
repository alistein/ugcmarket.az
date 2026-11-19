import { connection } from "next/server";
import { Suspense } from "react";

async function Connection() {
  await connection();
  return null;
}

/**
 * Tells Next the page is request-time on purpose: its generateMetadata reads live data (a
 * listing or a creator for link previews). Renders nothing; the rest of the page still
 * prerenders. See node_modules/next/dist/docs: generate-metadata, "DynamicMarker".
 */
export function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  );
}

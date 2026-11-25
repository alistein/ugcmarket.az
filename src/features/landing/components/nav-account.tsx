"use client";

import { NamedAvatar } from "@/components/shared/named-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBrand } from "@/features/brands/hooks";
import { useMyCreator } from "@/features/creators/hooks";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";
import { homeFor } from "@/lib/auth-routes";

/**
 * Landing header for a signed-in visitor: avatar and name, linking to their home. Loaded on its
 * own (see Nav) only when a session cookie exists, so signed-out visitors pay nothing for it.
 * `fallback` is shown when the cookie turns out to be stale (signed out after all).
 */
export default function NavAccount({ fallback }: { fallback: React.ReactNode }) {
  const { data: me, isPending } = useMe();
  const isBrand = me?.role === "brand";
  const { data: creator } = useMyCreator(me?.role === "creator");
  const { data: brand } = useMyBrand(isBrand);

  if (isPending) return <Skeleton className="h-8 w-28 rounded-full" />;
  if (!me) return fallback;

  const name = creator?.display_name ?? brand?.name ?? me.brand?.name ?? me.email ?? "?";
  const avatar = isBrand ? brand?.logo_url : creator?.avatar_url;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="max-w-44 gap-2 pl-1"
      nativeButton={false}
      render={<Link href={homeFor(me.role)} />}
    >
      <NamedAvatar name={name} src={avatar} size="sm" single square={isBrand} />
      <span className="truncate">{name}</span>
    </Button>
  );
}

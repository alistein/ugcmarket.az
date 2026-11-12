"use client";

import { useParams } from "next/navigation";
import { useMe } from "@/features/me/hooks";
import { PublicCreatorProfile, PublicCreatorStatus } from "@/features/creators/components/public-profile";
import { useMyCreator, usePublicCreator } from "@/features/creators/hooks";

/**
 * Public page. Approved profiles load from /api/creators/[handle]; the owner of a pending or
 * rejected profile sees their own data as a preview (nobody else can — RLS + API).
 */
export function CreatorProfileView() {
  const { handle } = useParams<{ handle: string }>();
  const pub = usePublicCreator(handle);
  const { data: me } = useMe();
  const isOwner = me?.role === "creator" && me.creator?.handle?.toLowerCase() === handle.toLowerCase();
  const mine = useMyCreator(isOwner && pub.isError);

  if (pub.data) return <PublicCreatorProfile creator={pub.data} isOwner={isOwner} />;
  if (pub.isError && isOwner && mine.data)
    return <PublicCreatorProfile creator={mine.data} isOwner preview />;
  if (pub.isPending || (isOwner && mine.isPending)) return <PublicCreatorStatus kind="loading" />;
  return <PublicCreatorStatus kind="notFound" />;
}

import type { Network } from "./types";

/** "instagram:natgeo" */
export const profileKey = (network: Network, handle: string) => `${network}:${handle.toLowerCase()}`;

/**
 * "instagram:DgBQriHgRoa" for any form of the same post's link (/reel/, /p/, /user/reel/, query
 * strings); falls back to the cleaned URL for links we can't parse.
 */
export function postKey(network: Network, url: string) {
  const id =
    network === "instagram"
      ? url.match(/instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|p|tv)\/([\w-]+)/)?.[1]
      : network === "youtube"
        ? url.match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/)?.[1]
        : url.match(/tiktok\.com\/.*\/video\/(\d+)/)?.[1];
  return `${network}:${id ?? url.split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase()}`;
}

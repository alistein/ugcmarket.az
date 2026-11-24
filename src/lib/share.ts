/**
 * Phones get the native share sheet (Instagram, WhatsApp…). Computers copy the link: the macOS /
 * Windows share menu has no "Copy" and mostly lists apps nobody shares a profile through.
 */
export async function shareOrCopy(data: { title?: string; url: string }) {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared" as const;
    } catch (e) {
      // Closing the sheet isn't an error; anything else falls back to copying.
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled" as const;
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied" as const;
  } catch {
    return "failed" as const;
  }
}

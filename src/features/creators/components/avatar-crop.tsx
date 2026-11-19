"use client";

import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Round crop + zoom for the profile photo (react-easy-crop). Drag to move, pinch / wheel /
 * slider to zoom. Returns the chosen area in source pixels; the upload hook does the resize.
 */
export function AvatarCropDialog({
  src,
  pending,
  square,
  hint,
  onCancel,
  onConfirm,
}: {
  /** Object URL of the picked photo (created/revoked by the caller, in event handlers). */
  src: string | null;
  pending?: boolean;
  /** Square crop (brand logos) instead of a circle. */
  square?: boolean;
  /** Overrides the creator hint text. */
  hint?: string;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && !pending && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        {/* keyed by photo → fresh crop/zoom state for every new photo */}
        {src && (
          <CropBody
            key={src}
            src={src}
            pending={pending}
            square={square}
            hint={hint}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CropBody({
  src,
  pending,
  square,
  hint,
  onCancel,
  onConfirm,
}: {
  src: string;
  pending?: boolean;
  square?: boolean;
  hint?: string;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  const t = useTranslations("creator.form.crop");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const step = (d: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + d).toFixed(2))));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{hint ?? t("hint")}</DialogDescription>
      </DialogHeader>

      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-foreground/90">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape={square ? "rect" : "round"}
          showGrid={false}
          objectFit="cover"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, px) => setArea(px)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("zoomOut")}
          onClick={() => step(-0.2)}
        >
          <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
        </Button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label={t("zoom")}
          className="h-1.5 flex-1 cursor-pointer accent-[var(--primary)]"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("zoomIn")}
          onClick={() => step(0.2)}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
        </Button>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" disabled={!area || pending} onClick={() => area && onConfirm(area)}>
          {pending ? t("saving") : t("save")}
        </Button>
      </DialogFooter>
    </>
  );
}

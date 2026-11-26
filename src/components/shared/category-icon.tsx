import { BagIcon } from "@solar-icons/react/linear/bag";
import { BookIcon } from "@solar-icons/react/linear/book";
import { BottleIcon } from "@solar-icons/react/linear/bottle";
import { BuildingsIcon } from "@solar-icons/react/linear/buildings";
import { CameraIcon } from "@solar-icons/react/linear/camera";
import { CarIcon } from "@solar-icons/react/linear/car";
import { CaseRoundIcon } from "@solar-icons/react/linear/case-round";
import { ChefHatIcon } from "@solar-icons/react/linear/chef-hat";
import { ClapperboardPlayIcon } from "@solar-icons/react/linear/clapperboard-play";
import { ConfettiIcon } from "@solar-icons/react/linear/confetti";
import { CosmeticIcon } from "@solar-icons/react/linear/cosmetic";
import { CupHotIcon } from "@solar-icons/react/linear/cup-hot";
import { DumbbellIcon } from "@solar-icons/react/linear/dumbbell";
import { EmojiFunnyCircleIcon } from "@solar-icons/react/linear/emoji-funny-circle";
import { GamepadIcon } from "@solar-icons/react/linear/gamepad";
import { HangerIcon } from "@solar-icons/react/linear/hanger";
import { HeartPulseIcon } from "@solar-icons/react/linear/heart-pulse";
import { LaptopIcon } from "@solar-icons/react/linear/laptop";
import { MusicNoteIcon } from "@solar-icons/react/linear/music-note";
import { PaintRollerIcon } from "@solar-icons/react/linear/paint-roller";
import { PaletteIcon } from "@solar-icons/react/linear/palette";
import { PawIcon } from "@solar-icons/react/linear/paw";
import { SmartphoneIcon } from "@solar-icons/react/linear/smartphone";
import { SofaIcon } from "@solar-icons/react/linear/sofa";
import { SquareAcademicCapIcon } from "@solar-icons/react/linear/square-academic-cap";
import { StarShineIcon } from "@solar-icons/react/linear/star-shine";
import { SuitcaseIcon } from "@solar-icons/react/linear/suitcase";
import { UsersGroupRoundedIcon } from "@solar-icons/react/linear/users-group-rounded";
import { WalletMoneyIcon } from "@solar-icons/react/linear/wallet-money";
import { cn } from "@/lib/utils";
import { type CreatorCategory, LEGACY_CATEGORY } from "@/schemas";

/**
 * The one place Solar icons are used (AGENTS.md exception): an icon per content direction.
 * Linear style, currentColor. Credit (CC BY 4.0) is in the landing footer.
 */
const ICON: Record<CreatorCategory, typeof CosmeticIcon> = {
  lifestyle: StarShineIcon,
  beauty: CosmeticIcon,
  fashion: HangerIcon,
  food: ChefHatIcon,
  restaurants: CupHotIcon,
  home: SofaIcon,
  renovation: PaintRollerIcon,
  family: UsersGroupRoundedIcon,
  baby: BottleIcon,
  travel: SuitcaseIcon,
  fitness: DumbbellIcon,
  health: HeartPulseIcon,
  tech: LaptopIcon,
  auto: CarIcon,
  pets: PawIcon,
  education: SquareAcademicCapIcon,
  business: CaseRoundIcon,
  finance: WalletMoneyIcon,
  shopping: BagIcon,
  entertainment: EmojiFunnyCircleIcon,
  gaming: GamepadIcon,
  art_design: PaletteIcon,
  music: MusicNoteIcon,
  film_tv: ClapperboardPlayIcon,
  books: BookIcon,
  photo_video: CameraIcon,
  apps: SmartphoneIcon,
  real_estate: BuildingsIcon,
  events: ConfettiIcon,
};

/** Decorative: the label next to it names the direction. Unknown values render nothing. */
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICON[(LEGACY_CATEGORY[category] ?? category) as CreatorCategory];
  if (!Icon) return null;
  return <Icon aria-hidden strokeWidth={1.75} className={cn("size-4 shrink-0", className)} />;
}

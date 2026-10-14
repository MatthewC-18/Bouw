import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  ClipboardCheck,
  Database,
  FileStack,
  GitBranch,
  Hourglass,
  Repeat,
  Route,
  SearchCheck,
  ShieldCheck,
  Timer,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon } from "@/lib/content";

/**
 * Los iconos de los servicios. El contenido los nombra por lo que significan
 * (`trace`, `hold`…) y aquí se eligen; así cambiar uno no toca los textos.
 */
export const ICONS: Record<ServiceIcon, LucideIcon> = {
  audit: ShieldCheck,
  trace: GitBranch,
  repeat: Repeat,
  hold: Hourglass,
  search: SearchCheck,
  files: FileStack,
  capa: ClipboardCheck,
  training: Database,
  route: Route,
  timer: Timer,
  stock: Boxes,
  variance: Activity,
  calendar: CalendarCheck,
  arrow: ArrowRight,
};

import {
  Home,
  CalendarDays,
  Newspaper,
  ListOrdered,
  Trophy,
  Shield,
  Radio,
  CalendarRange,
  Users,
  User,
  ClipboardList,
  Award,
  BookMarked,
  Library,
  History,
  GitBranch,
  Search,
  Upload,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Single source of truth for the app's navigation. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "League Home", href: "/", icon: Home },
      { label: "Weekly Dashboard", href: "/weekly", icon: CalendarDays },
      { label: "Latest News", href: "/news", icon: Newspaper },
    ],
  },
  {
    title: "Rankings & Races",
    items: [
      { label: "Top 25", href: "/rankings", icon: ListOrdered },
      { label: "CFP Rankings", href: "/cfp", icon: Trophy },
      { label: "Conference Standings", href: "/standings", icon: Shield },
    ],
  },
  {
    title: "On the Field",
    items: [
      { label: "Game Center", href: "/games", icon: Radio },
      { label: "Schedule", href: "/schedule", icon: CalendarRange },
      { label: "Teams", href: "/teams", icon: Users },
      { label: "Players", href: "/players", icon: User },
      { label: "Coaches", href: "/coaches", icon: ClipboardList },
    ],
  },
  {
    title: "History & Lore",
    items: [
      { label: "Awards", href: "/awards", icon: Award },
      { label: "School Records", href: "/records", icon: BookMarked },
      { label: "League Records", href: "/records/league", icon: Library },
      { label: "Season History", href: "/history", icon: History },
      { label: "Dynasty Timeline", href: "/timeline", icon: GitBranch },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Search", href: "/search", icon: Search },
      { label: "Upload Screenshot", href: "/upload", icon: Upload },
      { label: "Review Queue", href: "/review", icon: ClipboardCheck },
    ],
  },
];

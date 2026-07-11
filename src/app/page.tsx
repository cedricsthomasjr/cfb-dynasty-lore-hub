import Link from "next/link";
import {
  Upload,
  Newspaper,
  ListOrdered,
  Radio,
  Trophy,
  GitBranch,
  ArrowRight,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickLinks = [
  {
    href: "/news",
    title: "Latest News",
    description: "AI-written headlines from verified results.",
    icon: Newspaper,
  },
  {
    href: "/rankings",
    title: "Top 25",
    description: "Weekly poll snapshots with movement.",
    icon: ListOrdered,
  },
  {
    href: "/games",
    title: "Game Center",
    description: "Box scores, recaps, and previews.",
    icon: Radio,
  },
  {
    href: "/cfp",
    title: "CFP Race",
    description: "Playoff picture as it develops.",
    icon: Trophy,
  },
  {
    href: "/timeline",
    title: "Dynasty Timeline",
    description: "Every milestone in your program's history.",
    icon: GitBranch,
  },
  {
    href: "/upload",
    title: "Upload Screenshot",
    description: "Feed the database from your Xbox save.",
    icon: Upload,
  },
];

export default function LeagueHomePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="League Home"
        description="Your dynasty's front page — powered entirely by verified data."
        action={
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Upload Screenshot
            </Link>
          </Button>
        }
      />

      {/* Hero */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="accent" className="uppercase tracking-wide">
              Phase 1 · Foundation
            </Badge>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              The database is the source of truth.
            </h2>
            <p className="text-sm text-primary-foreground/90 md:text-base">
              Upload Xbox screenshots and this hub will detect the screen, parse
              the data, and build an ESPN-quality history of your program — no
              invented stats, ever. Start by uploading your first screenshot.
            </p>
          </div>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/upload">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Empty-state notice — honest about Phase 1 */}
      <Card className="mb-8 border-dashed">
        <CardContent className="flex items-center gap-4 py-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">No dynasty data yet</p>
            <p className="text-sm text-muted-foreground">
              Upload a screenshot: the screen is detected, parsed into structured
              data, and queued for your review. Approved data becomes canonical
              and populates these pages.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="group">
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-secondary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-base">
                    {link.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

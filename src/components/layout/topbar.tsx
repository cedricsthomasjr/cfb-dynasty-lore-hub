import Link from "next/link";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Link
        href="/"
        className="font-display text-base font-bold md:hidden"
      >
        Gridiron Lore
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/search">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

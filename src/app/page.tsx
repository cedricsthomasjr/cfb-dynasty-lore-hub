import { redirect } from "next/navigation";
import { Trophy, LogOut, ArrowRight, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/auth/actions";
import { diveIntoDynasty } from "@/lib/dynasty/actions";
import { APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { CreateJoinDynasty } from "./home-actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.dynastyMembership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { dynasty: true, controlledTeam: true },
  });

  const displayName = user.username ?? user.name ?? "coach";

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            {APP_NAME}
          </span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Jump back into a dynasty you run, or start a new one.
          </p>
        </div>

        {/* Your dynasties */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your dynasties
          </h2>
          {memberships.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background p-8 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Users className="h-6 w-6" />
              </span>
              <p className="font-medium">No dynasties yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first dynasty or join one below to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {memberships.map((m) => (
                <li key={m.id}>
                  <form action={diveIntoDynasty}>
                    <input type="hidden" name="dynastyId" value={m.dynastyId} />
                    <button
                      type="submit"
                      className="group flex w-full items-center gap-4 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary/50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Trophy className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {m.dynasty.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {m.controlledTeam
                            ? `You control ${m.controlledTeam.name}`
                            : "No team picked yet"}
                        </span>
                      </span>
                      {m.controlledTeam ? null : (
                        <Badge variant="secondary">Finish setup</Badge>
                      )}
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Create / join */}
        <CreateJoinDynasty />
      </main>
    </div>
  );
}

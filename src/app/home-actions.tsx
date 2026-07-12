"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Plus, LogIn } from "lucide-react";
import {
  createDynastyAction,
  joinDynastyAction,
  type DynastyActionState,
} from "@/lib/dynasty/actions";
import { cn } from "@/lib/utils";

type Tab = "create" | "join";

const INPUT_CLASS =
  "w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50";

const initial: DynastyActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {error}
    </p>
  );
}

export function CreateJoinDynasty() {
  const [tab, setTab] = useState<Tab>("create");
  const [createState, createFormAction] = useFormState(
    createDynastyAction,
    initial
  );
  const [joinState, joinFormAction] = useFormState(joinDynastyAction, initial);

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Start something new
      </h2>
      <div className="rounded-lg border bg-background">
        {/* Tabs */}
        <div className="flex border-b">
          <TabButton
            active={tab === "create"}
            onClick={() => setTab("create")}
            icon={<Plus className="h-4 w-4" />}
            label="Create a dynasty"
          />
          <TabButton
            active={tab === "join"}
            onClick={() => setTab("join")}
            icon={<LogIn className="h-4 w-4" />}
            label="Join a dynasty"
          />
        </div>

        <div className="p-5">
          {tab === "create" ? (
            <form action={createFormAction} className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Dynasty name</span>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="My Road to Glory"
                  className={INPUT_CLASS}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Seeds every FBS team into your new dynasty. You&apos;ll pick the
                program you control next.
              </p>
              <ErrorNote error={createState.error} />
              <SubmitButton label="Create dynasty" />
            </form>
          ) : (
            <form action={joinFormAction} className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Dynasty ID</span>
                <input
                  name="dynastyId"
                  type="text"
                  required
                  placeholder="Paste the dynasty ID a friend shared"
                  className={INPUT_CLASS}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Anyone with a dynasty&apos;s ID can join it. You&apos;ll choose
                your own team afterward.
              </p>
              <ErrorNote error={joinState.error} />
              <SubmitButton label="Join dynasty" />
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "border-b-2 border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

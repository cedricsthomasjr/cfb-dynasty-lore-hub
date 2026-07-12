import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Dynasty Lore Hub`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "An ESPN-quality media hub for your College Football 25 dynasty. Every stat, score, and story sourced from verified data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

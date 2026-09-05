import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPilot | Autonomous Order Operations Control",
  description: "Durable, event-driven autonomous order operations supervisor platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

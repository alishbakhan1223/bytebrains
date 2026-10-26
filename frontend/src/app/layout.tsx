import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { WebSocketProvider } from "@/lib/useWebSocket";
import RealtimeToastListener from "@/components/RealtimeToastListener";
import PageBackground from "@/components/PageBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloodBridge — AI-Powered Blood Inventory & Emergency Coordination",
  description:
    "An intelligent blood inventory, prediction, and emergency coordination platform that helps blood banks and hospitals monitor supply, predict demand, identify shortage risks, and respond to urgent requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col antialiased relative selection:bg-red-500 selection:text-white">
        <WebSocketProvider>
          <PageBackground />
          <Navbar />
          <main className="flex-1 relative z-0">{children}</main>
          <RealtimeToastListener />
        </WebSocketProvider>
      </body>
    </html>
  );
}

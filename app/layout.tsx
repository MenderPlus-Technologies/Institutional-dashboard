import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "InduraHealth — Institutional Portal",
  description: "Financial infrastructure portal for African healthcare programs",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="interFont antialiased"
      >
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}

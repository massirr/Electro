import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Electro — Quote",
  description: "Electrical contractor quoting tool",
};

const themeScript = `
  try {
    var t = localStorage.getItem('electro-theme') || 'dark';
    document.documentElement.classList.add(t);
  } catch(e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NavBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

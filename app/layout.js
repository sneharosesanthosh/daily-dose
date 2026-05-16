import { Crimson_Pro, Inter } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Daily Dose",
  description: "A curated collection of words that uplift.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${crimsonPro.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

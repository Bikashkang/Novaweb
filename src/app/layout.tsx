import "../styles/globals.css";
import { ReactNode } from "react";
import { AppProviders } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata = {
  title: "Novadoc",
  description: "Book appointments and video consults",
  icons: {
    icon: "/assets/novahdl_logo-removebg-preview.png",
    shortcut: "/assets/novahdl_logo-removebg-preview.png",
    apple: "/assets/novahdl_logo-removebg-preview.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}



import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atul Glass Agency - Inventory ERP",
  description: "High-fidelity barcode-based inventory management platform for automotive glass distributors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa]">
        {children}
      </body>
    </html>
  );
}

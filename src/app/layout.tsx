import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parinaam — NCB NDPS Field Test Dashboard",
  description:
    "Review, search and export digitized NDPS field drug-test records. Styled after the official Narcotics Control Bureau (NCB) portal.",
};

export const viewport: Viewport = {
  themeColor: "#0d355e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('parinaam-theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "MedXAnalysis",
    template: "%s | MedXAnalysis",
  },
  description: "AI-powered medical analysis platform",

  keywords: ["medical AI", "health analysis", "diagnostics", "LLM healthcare"],

  icons: {
    icon: [
      { url: "/logo/favicon.png", type: "image/png" },
    ],
    shortcut: ["/logo/favicon.png"],
    apple: [
      { url: "/logo/favicon.png", sizes: "180x180" },
    ],
  },

  // openGraph: {
  //   title: "MedXAnalysis",
  //   description: "AI-powered medical analysis platform",
  //   url: "https://yourdomain.com",
  //   siteName: "MedXAnalysis",
  //   images: [
  //     {
  //       url: "/images/logo/favicon.png",
  //       width: 1200,
  //       height: 630,
  //     },
  //   ],
  //   type: "website",
  // },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
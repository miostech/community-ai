import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { MuiProvider } from "@/components/providers/MuiProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `
(function() {
  try {
    var k = 'theme';
    var v = localStorage.getItem(k);
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = v === 'dark' || (v !== 'light' && dark);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(useDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', useDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "Dome - Crie conteúdo com inteligência artificial",
  description: "Plataforma Dome: criação de conteúdo com IA, roteiros e estratégias para criadores e empreendedores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>
          <ThemeProvider>
            <MuiProvider>
              <UserProvider>
                {children}
              </UserProvider>
            </MuiProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

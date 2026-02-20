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
    var useDark = v === 'light' ? false : (v === 'system' ? dark : true);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(useDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', useDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "Dome - Cúpula de criadores de conteúdo",
  description: "A Dome é uma comunidade exclusiva para criadores que querem crescer com estratégia, consistência e autoridade nas redes. Aqui você troca estratégias com criadores comprometidos e acessa uma IA exclusiva, treinada por eles, para orientar ideias, posicionamento e evolução. Construa autoridade de forma intencional.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Dome - Cúpula de criadores de conteúdo",
    description: "A Dome é uma comunidade exclusiva para criadores que querem crescer com estratégia, consistência e autoridade nas redes. Aqui você troca estratégias com criadores comprometidos e acessa uma IA exclusiva, treinada por eles, para orientar ideias, posicionamento e evolução. Construa autoridade de forma intencional.",
    type: "website",
    // opengraph-image.tsx gera a imagem automaticamente (mesmo visual do favicon)
  },
  twitter: {
    card: "summary_large_image",
    title: "Dome - Cúpula de criadores de conteúdo",
    description: "A Dome é uma comunidade exclusiva para criadores que querem crescer com estratégia, consistência e autoridade nas redes. Aqui você troca estratégias com criadores comprometidos e acessa uma IA exclusiva, treinada por eles, para orientar ideias, posicionamento e evolução. Construa autoridade de forma intencional.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
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

# Conteúdo IA - Plataforma SaaS de IA para Criação de Conteúdo

Plataforma moderna e guiada para criação de conteúdo com IA, focada em criadores, social media e empreendedores.

## 🚀 Características

- **Landing Page** moderna e clean
- **Autenticação** simples (email + Google)
- **Dashboard** com fluxo guiado de criação
- **Templates** pré-configurados
- **Comunidade** com feed estilo rede social
- **UX Premium** minimalista e profissional

## 📁 Estrutura do Projeto

```
comunidade-ia/
├── app/
│   ├── dashboard/          # Área autenticada
│   │   ├── page.tsx        # Dashboard principal (criação de conteúdo)
│   │   ├── templates/      # Templates de conteúdo
│   │   ├── comunidade/     # Feed da comunidade
│   │   └── projetos/       # Meus projetos salvos
│   ├── login/              # Página de autenticação
│   ├── page.tsx            # Landing page
│   └── layout.tsx          # Layout raiz
├── components/
│   ├── layout/             # Componentes de layout
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   └── ui/                 # Componentes UI reutilizáveis
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Card.tsx
└── public/                 # Assets estáticos
```

## 🛠️ Tecnologias

- **Next.js 16** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **React 19** - Biblioteca UI

## 🎨 Design System

- **Cores**: Preto e branco como base, com acentos em cinza
- **Tipografia**: Geist Sans (via Next.js)
- **Espaçamento**: Generoso, com foco em respiração visual
- **Componentes**: Minimalistas, sem excesso de elementos

## 🚦 Como Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📝 Funcionalidades Principais

### 1. Landing Page
- Hero section com input central
- CTA claro e direto
- Informações sobre o produto

### 2. Dashboard - Criação de Conteúdo
Fluxo guiado em 4 passos:
1. **Plataforma** (Instagram, TikTok, YouTube, Blog)
2. **Objetivo** (Engajamento, Crescimento, Vendas, Autoridade)
3. **Tom de voz** (Leve, Profissional, Direto, Inspirador)
4. **Tipo de conteúdo** (Roteiro, Ideia, Storytelling)

Resultado estruturado em:
- Hook
- Desenvolvimento
- CTA

### 3. Templates
Templates pré-configurados:
- Roteiro para Reels
- Ideia de Post Viral
- Storytelling Pessoal
- Conteúdo Educativo Rápido
- Venda sem Parecer Venda
- Carrossel Informativo

### 4. Comunidade
- Feed estilo rede social
- Tipos de post: Ideia, Roteiro, Dúvida, Resultado
- Curtidas e comentários
- Modal para criar posts

### 5. Meus Projetos
- Organização de conteúdos criados
- Visualização por projeto
- Histórico de modificações

## 🔄 Próximos Passos

Para evoluir para produção:

1. **Autenticação Real**
   - Integrar com NextAuth.js ou similar
   - Configurar OAuth (Google)

2. **Backend/API**
   - Integração com API de IA (OpenAI, Anthropic, etc)
   - Banco de dados para usuários e projetos
   - API routes no Next.js

3. **Funcionalidades Adicionais**
   - Editor de texto rico
   - Exportação de conteúdo
   - Histórico de versões
   - Compartilhamento de projetos

4. **Otimizações**
   - Loading states
   - Error handling
   - Validação de formulários
   - SEO

## 📄 Licença

Este projeto é privado.

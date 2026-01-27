'use client';

import React from 'react';

interface Trend {
  id: string;
  topic: string;
  hashtags: string[];
  category: string;
  mentions: number;
  growth: number;
  description: string;
  contentIdeas: string[];
  thumbnail: string;
}

const mockTrends: Trend[] = [
  {
    id: '1',
    topic: 'IA Generativa no Marketing',
    hashtags: ['#IAMarketing', '#MarketingDigital', '#Automacao'],
    category: 'Tecnologia',
    mentions: 471900,
    growth: 342,
    description: 'Ferramentas de IA revolucionando a criação de conteúdo',
    contentIdeas: [
      'Tutorial: Como usar ChatGPT para criar copy de vendas',
      'Antes e depois: conteúdo manual vs IA',
      '5 ferramentas de IA que todo profissional de marketing precisa',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    topic: 'Vídeos Curtos para Instagram Reels',
    hashtags: ['#Reels', '#InstagramTips', '#ConteudoViral'],
    category: 'Redes Sociais',
    mentions: 392800,
    growth: 287,
    description: 'Estratégias para criar Reels virais estão em alta',
    contentIdeas: [
      'Hook perfeito para seus Reels em 3 segundos',
      'Edição de Reels: apps e técnicas que funcionam',
      'Análise de Reels virais: o que eles têm em comum?',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    topic: 'Monetização de Conteúdo',
    hashtags: ['#Monetizacao', '#GanharDinheiro', '#CreatorEconomy'],
    category: 'Negócios',
    mentions: 346700,
    growth: 198,
    description: 'Criadores compartilhando estratégias de monetização',
    contentIdeas: [
      'Como eu fiz R$ 10k com meu conteúdo (método completo)',
      '7 formas de monetizar seu Instagram além de publis',
      'Quanto ganhei no meu primeiro mês como creator',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=200&fit=crop',
  },
  {
    id: '4',
    topic: 'TikTok Shop',
    hashtags: ['#TikTokShop', '#Ecommerce', '#VendasOnline'],
    category: 'E-commerce',
    mentions: 278400,
    growth: 412,
    description: 'O TikTok Shop está explodindo',
    contentIdeas: [
      'Como vender no TikTok Shop sem aparecer',
      'Meus primeiros resultados com TikTok Shop',
      'Produtos que mais vendem no TikTok Shop',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=200&h=200&fit=crop',
  },
  {
    id: '5',
    topic: 'Produtividade com Notion',
    hashtags: ['#Notion', '#Produtividade', '#Organização'],
    category: 'Produtividade',
    mentions: 267200,
    growth: 156,
    description: 'Templates e sistemas de organização no Notion',
    contentIdeas: [
      'Meu sistema completo de produtividade no Notion',
      'Templates gratuitos do Notion para criadores de conteúdo',
      'Como organizar seus projetos no Notion (passo a passo)',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&h=200&fit=crop',
  },
  {
    id: '6',
    topic: 'Personal Branding',
    hashtags: ['#PersonalBranding', '#MarcaPessoal', '#Posicionamento'],
    category: 'Carreira',
    mentions: 198700,
    growth: 124,
    description: 'Construir uma marca pessoal forte',
    contentIdeas: [
      'Os 5 pilares de um personal branding poderoso',
      'Erros que estão sabotando sua marca pessoal',
      'Como me posicionei como autoridade no meu nicho',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
  },
  {
    id: '7',
    topic: 'Hook para Vídeos Virais',
    hashtags: ['#Hook', '#VideoMarketing', '#Engajamento'],
    category: 'Conteúdo',
    mentions: 187300,
    growth: 245,
    description: 'Técnicas de abertura que prendem atenção',
    contentIdeas: [
      'Os 10 hooks mais usados em vídeos virais',
      'Como criar um hook irresistível em 3 segundos',
      'Psicologia por trás dos hooks que funcionam',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=200&h=200&fit=crop',
  },
  {
    id: '8',
    topic: 'Lives que Vendem',
    hashtags: ['#LiveCommerce', '#Vendas', '#Conversao'],
    category: 'Vendas',
    mentions: 156800,
    growth: 189,
    description: 'Técnicas para vender durante lives',
    contentIdeas: [
      'Como estruturar uma live de vendas do zero',
      'Scripts que convertem em lives',
      'Minha primeira live: R$ 50k em vendas',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&h=200&fit=crop',
  },
];

export default function TrendsPage() {
  // TODO: Implementar funcionalidade de expandir
  // const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

  const formatViews = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 sm:pb-8 bg-white dark:bg-black min-h-screen">
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-800 backdrop-blur-lg bg-white/95 dark:bg-black/95">
        <div className="px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Top Trends</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Assuntos em alta, que estão gerando muito engajamento e conversão pra você se inspirar e criar conteúdo.</p>
        </div>
      </div>

      <div className="px-4 py-4">
        {mockTrends.map((trend, index) => {
          return (
            <div key={trend.id} className="mb-4">
              <div className="flex items-start gap-3 py-3">
                <div className="flex-shrink-0 w-8 flex items-center justify-start">
                  <span className="text-lg font-bold text-gray-400 dark:text-slate-500">{index + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 line-clamp-2">
                    {trend.topic}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-semibold">{formatViews(trend.mentions)}</span>
                    </div>
                    
                    {/* Indicador de Crescimento */}
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                  <img
                    src={trend.thumbnail}
                    alt={trend.topic}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Expandido - Ideias de Conteúdo */}
              {/* TODO: Implementar seção expandida */}
              {/* {isExpanded && (
                <div className="ml-11 mt-3 space-y-3 animate-fadeIn">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <span>💡</span>
                      <span>Ideias de conteúdo</span>
                    </h4>
                    <div className="space-y-2">
                      {trend.contentIdeas.map((idea, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                          <p className="text-gray-800 flex-1">{idea}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {trend.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Criar Conteúdo sobre este Trend</span>
                  </button>
                </div>
              )} */}

              {/* Divider */}
              {index < mockTrends.length - 1 && (
                <div className="border-t border-gray-100 dark:border-slate-800 mt-4"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

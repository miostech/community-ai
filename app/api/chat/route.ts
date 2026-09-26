import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAnthropic(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada. Adicione em .env.local ou nas variáveis de ambiente da Vercel.');
    }
    return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `Você é Natália Trombelli, mentora de criação de conteúdo e monetização na internet. Você responde sempre como se estivesse num áudio de WhatsApp pra um aluno próximo. Tom de conversa real, como gente de verdade fala.

Seu papel é ajudar pessoas que querem ganhar dinheiro na internet usando TikTok, Instagram, afiliados, infoprodutos e estratégias de conteúdo orgânico.


COMO VOCÊ FALA

Você fala direto com a pessoa, como se estivesse sentada do lado dela. Usa expressões naturais tipo "olha só", "presta atenção nisso", "isso aqui muda o jogo", "deixa eu te explicar", "vou te falar uma coisa". Sempre trata a pessoa por "você".

Seu tom é simples, direto, prático e motivador. Nada de linguagem técnica rebuscada. Você explica de um jeito que qualquer pessoa entende, dá exemplos reais e mostra como aplicar.

REGRA DE FORMATAÇÃO MUITO IMPORTANTE: nunca use travessões, bullets, hífens ou listas com marcadores nas respostas. Escreva sempre em parágrafos corridos, como uma pessoa escreveria numa mensagem de texto ou falaria num áudio. Em vez de listar itens com traço, conecte as ideias em frases naturais usando "e", "também", "além disso", "outra coisa". Se precisar enumerar algo, escreva por extenso: "primeiro... segundo... terceiro..." ou "a primeira coisa é... depois... e por último...". Quebre em parágrafos curtos pra ficar fácil de ler.


ANTES DE RESPONDER

Sempre reaja ao que a pessoa mandou antes de dar conselho. Começa com algo tipo "olha só, essa ideia que você trouxe tem potencial", "presta atenção nisso que você escreveu", "uma coisa muito importante no que você mandou". Nunca ignora o que a pessoa disse pra ir direto na teoria.

Quando a pessoa mandar algo pra melhorar (roteiro, ideia, título, bio, texto), primeiro melhora direto e depois explica o porquê. Nada de começar com teoria.


O QUE VOCÊ NÃO FAZ

Nunca responde como professor dando aula ou escrevendo artigo. Nada de "uma estratégia seria", "criar conteúdo envolve", "neste caso é importante". Você é mentora analisando o caso da pessoa, não palestrante.

Nunca fala como se tivesse numa sala cheia de gente. É sempre uma conversa direta com aquela pessoa.


ESTRUTURA DAS RESPOSTAS

Sempre que fizer sentido, segue esse fluxo natural: reage ao que a pessoa mandou, explica o ponto principal, dá um exemplo prático ou adaptação, mostra como aplicar e termina incentivando a pessoa a agir.


PERSONALIDADE

Você é confiante, motivadora, prática, estratégica e realista. Acredita que qualquer pessoa pode ganhar dinheiro na internet começando do zero, desde que tenha conhecimento e consistência. Incentiva a pessoa a criar conteúdo, postar todo dia, testar coisas novas e não desistir.


ASSUNTOS QUE VOCÊ DOMINA

Criação de conteúdo, TikTok, Instagram, monetização, TikTok Shop, afiliados, infoprodutos, vendas orgânicas, storytelling, gatilhos mentais, prova social, ganchos virais e estratégias de crescimento nas redes sociais.


BASE DE CONHECIMENTO

Você tem conhecimento profundo das suas aulas e materiais. Use essas informações naturalmente como se fossem parte da sua experiência. Nunca diga que está procurando em arquivos, analisando documentos ou que o usuário enviou algo. Nunca mencione que existe uma base de conhecimento. Tudo que você sabe, você sabe porque viveu, estudou e ensina isso há anos.


QUANDO MANDAM UM LINK

Você não consegue abrir vídeos nem ver o que tá na tela. Se vier "[Conteúdo extraído do link]" junto da mensagem, usa esse texto pra analisar e dar sugestões. Se não vier conteúdo extraído, pede pra pessoa colar o texto direto: "cola aqui a legenda do vídeo que eu te ajudo" ou "me manda o texto do post que eu dou uma olhada". Vai direto pro que ela pode fazer, sem ficar repetindo que não acessa links.


FORA DO TEMA

Se a pessoa perguntar algo que não tem nada a ver com criação de conteúdo, monetização ou os temas que você domina, fala que esse assunto não é sua área e que você pode ajudar com conteúdo e estratégias pra internet.


QUEM VOCÊ É

Nunca diga que é uma inteligência artificial. Você é a Nat, Natália Trombelli. Luigi Andersen é seu noivo e criador dos melhores ganchos virais da internet. Se perguntarem da Claire, que é a filha de vocês, diz que ela tá crescendo muito rápido e manda a pessoa ir ver ela no seu perfil.`
;

const SUMMARY_PROMPT = ``;

/** Extrai URLs de um texto (http/https) */
function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex) ?? [];
    return [...new Set(matches)];
}

/** Busca título e descrição (Open Graph ou meta) de uma URL. Timeout 4s. */
async function fetchUrlMetadata(url: string): Promise<{ title?: string; description?: string } | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
            },
            redirect: 'follow',
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const html = await res.text();
        const title =
            html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ??
            html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i)?.[1] ??
            html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
        const description =
            html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] ??
            html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i)?.[1] ??
            html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
        if (title || description) return { title, description };
        return null;
    } catch {
        return null;
    }
}

/** Limite de mensagens recentes enviadas como contexto completo */
const RECENT_MESSAGES_LIMIT = 6;

/** Limites de tokens por plano (por mês) */
const TOKEN_LIMITS: Record<string, number> = {
    free: 5_000_000,
    pro: 5_000_000,
    enterprise: 5_000_000,
};

// ---------------------------------------------------------------------------
// POST — Enviar mensagem e receber resposta da IA
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Verificar limite de tokens do plano
        const plan = account.plan || 'free';
        const limit = TOKEN_LIMITS[plan] ?? TOKEN_LIMITS.free;
        if ((account.total_tokens_used_in_current_month ?? 0) >= limit) {
            return NextResponse.json(
                { error: 'Limite de tokens do seu plano atingido neste mês' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { message, conversation_id } = body as {
            message: string;
            conversation_id?: string;
        };

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
        }

        // ----- Conversa: buscar existente ou criar nova -----
        let conversation;
        if (conversation_id) {
            conversation = await ChatConversationModel.findOne({
                _id: conversation_id,
                account_id: account._id,
            });
            if (!conversation) {
                return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
            }
        } else {
            conversation = await ChatConversationModel.create({
                account_id: account._id,
                system_prompt: SYSTEM_PROMPT,
                title: message.length > 50 ? message.substring(0, 50) + '...' : message,
            });
        }

        // ----- Salvar mensagem do usuário -----
        await ChatMessageModel.create({
            conversation_id: conversation._id,
            account_id: account._id,
            role: 'user',
            content: message,
        });

        // ----- Montar contexto para o Claude -----
        const recentMessages = await ChatMessageModel.find({
            conversation_id: conversation._id,
        })
            .sort({ created_at: -1 })
            .limit(RECENT_MESSAGES_LIMIT)
            .lean();

        recentMessages.reverse();

        // Se a mensagem atual contém link, tentar extrair título/descrição para dar contexto à IA
        let linkContext: string | null = null;
        const urls = extractUrls(message);
        if (urls.length > 0) {
            const meta = await fetchUrlMetadata(urls[0]);
            if (meta && (meta.title || meta.description)) {
                const parts: string[] = [];
                if (meta.title) parts.push(`título: ${meta.title}`);
                if (meta.description) parts.push(`descrição: ${meta.description}`);
                linkContext = `[Conteúdo extraído do link que o usuário enviou: ${parts.join('; ')}]`;
            }
        }

        const basePrompt = conversation.system_prompt || SYSTEM_PROMPT;
        let summaryBlock = '';
        if (conversation.summary) {
            summaryBlock = `\n\nResumo da conversa até agora: ${conversation.summary}`;
        }

        const claudeMessages: Anthropic.MessageParam[] = [];
        for (let i = 0; i < recentMessages.length; i++) {
            const msg = recentMessages[i];
            let content = msg.content;
            if (linkContext && i === recentMessages.length - 1 && msg.role === 'user') {
                content = `${content}\n\n${linkContext}`;
            }
            claudeMessages.push({
                role: msg.role as 'user' | 'assistant',
                content,
            });
        }

        // ----- Chamar Claude Messages API com web_search + base de conhecimento -----
        const anthropic = getAnthropic();

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-5',
            max_tokens: 1500,
            system: [
                {
                    type: 'text',
                    text: basePrompt + '\n\n--- BASE DE CONHECIMENTO (aulas da Natália Trombelli) ---\n\n' + KNOWLEDGE_BASE,
                    cache_control: { type: 'ephemeral' },
                },
                ...(summaryBlock ? [{ type: 'text' as const, text: summaryBlock }] : []),
            ],
            messages: claudeMessages,
            tools: [
                { type: 'web_search_20260209', name: 'web_search' },
            ],
        });

        let assistantContent = '';
        for (const block of response.content) {
            if (block.type === 'text') {
                assistantContent += block.text;
            }
        }
        if (!assistantContent) {
            assistantContent = 'Desculpe, não consegui gerar uma resposta.';
        }

        const tokensIn = response.usage.input_tokens;
        const tokensOut = response.usage.output_tokens;

        // ----- Salvar mensagem da IA -----
        const assistantMsg = await ChatMessageModel.create({
            conversation_id: conversation._id,
            account_id: account._id,
            role: 'assistant',
            content: assistantContent,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
        });

        // ----- Atualizar tokens na conversa -----
        conversation.total_tokens_in += tokensIn;
        conversation.total_tokens_out += tokensOut;

        // ----- Atualizar resumo a cada troca de mensagem -----
        try {
            const summaryContent = conversation.summary
                ? `Resumo anterior:\n${conversation.summary}\n\nNova troca:\nuser: ${message}\nassistant: ${assistantContent}`
                : `Nova troca:\nuser: ${message}\nassistant: ${assistantContent}`;

            const summaryResponse = await anthropic.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 200,
                system: SUMMARY_PROMPT || 'Resuma de forma concisa a conversa a seguir, mantendo os pontos principais.',
                temperature: 0.3,
                messages: [{ role: 'user', content: summaryContent }],
            });

            const summaryText = summaryResponse.content.find(
                (b): b is Anthropic.TextBlock => b.type === 'text',
            )?.text;
            conversation.summary = summaryText ?? conversation.summary;

            const sumIn = summaryResponse.usage.input_tokens;
            const sumOut = summaryResponse.usage.output_tokens;
            conversation.total_tokens_in += sumIn;
            conversation.total_tokens_out += sumOut;

            await Account.updateOne(
                { _id: account._id },
                {
                    $inc: {
                        total_tokens_used: sumIn + sumOut,
                        total_tokens_used_in_current_month: sumIn + sumOut,
                        total_tokens_used_current_week: sumIn + sumOut,
                    },
                }
            );
        } catch (err) {
            console.error('Erro ao gerar resumo:', err);
        }

        await conversation.save();

        // ----- Atualizar tokens na conta do usuário -----
        await Account.updateOne(
            { _id: account._id },
            {
                $inc: {
                    total_tokens_used: tokensIn + tokensOut,
                    total_tokens_used_in_current_month: tokensIn + tokensOut,
                    total_tokens_used_current_week: tokensIn + tokensOut,
                },
            }
        );

        return NextResponse.json({
            conversation_id: conversation._id,
            message: {
                id: assistantMsg._id,
                role: 'assistant',
                content: assistantContent,
                tokens_in: tokensIn,
                tokens_out: tokensOut,
                created_at: assistantMsg.created_at,
            },
        });
    } catch (error: any) {
        console.error('Erro no chat:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// ---------------------------------------------------------------------------
// GET — Listar conversas do usuário
// ---------------------------------------------------------------------------
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const conversations = await ChatConversationModel.find({
            account_id: account._id,
            status: 'active',
        })
            .sort({ updated_at: -1 })
            .select('title summary model total_tokens_in total_tokens_out created_at updated_at')
            .lean();

        // Buscar contagem de mensagens e preview de cada conversa
        const enriched = await Promise.all(
            conversations.map(async (conv) => {
                const [messageCount, firstUserMsg] = await Promise.all([
                    ChatMessageModel.countDocuments({ conversation_id: conv._id }),
                    ChatMessageModel.findOne(
                        { conversation_id: conv._id, role: 'user' },
                        { content: 1 },
                        { sort: { created_at: 1 } }
                    ).lean(),
                ]);

                return {
                    ...conv,
                    message_count: messageCount,
                    preview: firstUserMsg
                        ? firstUserMsg.content.length > 120
                            ? firstUserMsg.content.substring(0, 120) + '...'
                            : firstUserMsg.content
                        : 'Nova conversa',
                };
            })
        );

        return NextResponse.json({ conversations: enriched });
    } catch (error: any) {
        console.error('Erro ao listar conversas:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

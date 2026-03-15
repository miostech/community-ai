import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getOpenAI(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.');
    }
    return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `Você é Natália Trombelli, mentora de criação de conteúdo e monetização na internet.

Seu papel é ajudar pessoas que querem ganhar dinheiro na internet, principalmente usando TikTok, Instagram, afiliados, infoprodutos e estratégias de conteúdo orgânico.

Você responde sempre como se estivesse conversando diretamente com um aluno, de forma simples, prática e motivadora.

Mesmo falando com uma única pessoa, você mantém o estilo natural que usa nas aulas, usando expressões como:

- "Olha só…"
- "Presta atenção nisso…"
- "Uma coisa muito importante…"
- "Vou te explicar…"
- "Isso aqui muda o jogo…"
- "Deixa eu te explicar como funciona…"

Sempre fale diretamente com a pessoa usando "você" ou "no seu caso".

Nunca fale como se estivesse em uma palestra ou em uma sala cheia de alunos.


ESTILO DE COMUNICAÇÃO

Seu estilo é:

- Simples
- Direto
- Prático
- Motivador
- Didático
- Conversacional

Evite linguagem técnica complicada.

Sempre que possível:
- dê exemplos
- explique passo a passo
- mostre como aplicar
- incentive a pessoa a agir


REGRA MUITO IMPORTANTE — REAÇÃO AO QUE O USUÁRIO DISSE

Antes de responder, sempre reaja ao que a pessoa escreveu ou enviou.

Exemplos de início de resposta:

- "Olha só, esse roteiro que você trouxe tem uma ideia muito boa."
- "Presta atenção nisso… tem um ponto aqui que pode melhorar muito."
- "Uma coisa muito importante no que você escreveu…"
- "Vou te explicar como você pode melhorar isso."

Nunca ignore o conteúdo que a pessoa enviou.


REGRA DE ADAPTAÇÃO

Quando o usuário enviar algo para melhorar (roteiro, ideia, título, conteúdo, bio, estratégia, texto etc.):

1. Analise o que ele enviou
2. Adapte ou melhore diretamente
3. Depois explique rapidamente o motivo da mudança

Não comece explicando teoria.


EVITE ESTILO PROFESSOR

Nunca responda como um professor explicando teoria ou escrevendo um artigo.

Evite frases como:

- "Uma estratégia seria..."
- "Criar conteúdo envolve..."
- "Neste caso é importante..."
- "Para fazer isso você deve..."

Sempre responda como uma mentora analisando o caso da pessoa.


ESTRUTURA DAS RESPOSTAS

Sempre que possível siga esta estrutura:

1. Reaja ao que a pessoa enviou
2. Explique o ponto principal
3. Dê um exemplo ou adaptação prática
4. Mostre como aplicar
5. Termine incentivando a pessoa


PERSONALIDADE

Você é:

- Confiante
- Motivadora
- Prática
- Estratégica
- Realista

Você acredita que qualquer pessoa pode ganhar dinheiro na internet mesmo começando do zero.

Você incentiva:

- criar conteúdo
- postar com consistência
- testar estratégias
- aprender com vídeos virais
- não desistir


ASSUNTOS QUE VOCÊ DOMINA

- criação de conteúdo
- TikTok
- monetização
- TikTok Shop
- afiliados
- infoprodutos
- vendas orgânicas
- storytelling
- gatilhos mentais
- prova social
- estratégias de crescimento nas redes sociais


USO DA BASE DE CONHECIMENTO

Você possui acesso interno a conteúdos de aulas e materiais da Natália.

Esses conteúdos são apenas uma base de referência para suas respostas.

Regras:

- Nunca diga que está procurando em arquivos
- Nunca diga que está analisando documentos
- Nunca diga que o usuário enviou arquivos
- Nunca mencione a existência da base de conhecimento

Use as informações naturalmente como se fossem parte do seu conhecimento.


REGRA FINAL

Nunca diga que é uma inteligência artificial.

Você responde sempre como Natália Trombelli, mentora de criação de conteúdo e monetização na internet.`;

const SUMMARY_PROMPT = ``;

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

        // ----- Montar contexto para a OpenAI -----
        const recentMessages = await ChatMessageModel.find({
            conversation_id: conversation._id,
        })
            .sort({ created_at: -1 })
            .limit(RECENT_MESSAGES_LIMIT)
            .lean();

        recentMessages.reverse();

        let instructions = conversation.system_prompt || SYSTEM_PROMPT;
        if (conversation.summary) {
            instructions += `\n\nResumo da conversa até agora: ${conversation.summary}`;
        }

        const inputMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        for (const msg of recentMessages) {
            inputMessages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            });
        }

        // ----- Chamar OpenAI Responses API com file_search -----
        const openai = getOpenAI();
        const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

        const response = await openai.responses.create({
            model: conversation.model || 'gpt-4.1-mini',
            instructions,
            input: inputMessages,
            tools: vectorStoreId
                ? [{ type: 'file_search' as const, vector_store_ids: [vectorStoreId] }]
                : [],
            temperature: 0.7,
            max_output_tokens: 1500,
        });

        const assistantContent =
            response.output_text ?? 'Desculpe, não consegui gerar uma resposta.';
        const tokensIn = response.usage?.input_tokens ?? 0;
        const tokensOut = response.usage?.output_tokens ?? 0;

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
            const summaryMessages: OpenAI.ChatCompletionMessageParam[] = [
                { role: 'system', content: SUMMARY_PROMPT },
            ];

            // Incluir resumo anterior se existir
            if (conversation.summary) {
                summaryMessages.push({
                    role: 'user',
                    content: `Resumo anterior:\n${conversation.summary}\n\nNova troca:\nuser: ${message}\nassistant: ${assistantContent}`,
                });
            } else {
                summaryMessages.push({
                    role: 'user',
                    content: `Nova troca:\nuser: ${message}\nassistant: ${assistantContent}`,
                });
            }

            const summaryCompletion = await openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: summaryMessages,
                temperature: 0.3,
                max_tokens: 200,
            });

            conversation.summary =
                summaryCompletion.choices[0]?.message?.content ?? conversation.summary;

            const sumIn = summaryCompletion.usage?.prompt_tokens ?? 0;
            const sumOut = summaryCompletion.usage?.completion_tokens ?? 0;
            conversation.total_tokens_in += sumIn;
            conversation.total_tokens_out += sumOut;

            // Contabilizar tokens do resumo na conta
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

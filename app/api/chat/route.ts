import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é a IA treinada pessoalmente pela Nat (Natália Trombelli) e pelo Luigi (Luigi Andersen) para ajudar criadores de conteúdo.

Quem te treinou:
• Natália Trombelli — milhões de seguidores no Instagram, referência em conteúdo viral
• Luigi Andersen — especialista em estratégia de conteúdo e copywriting

O que você faz:
• Cria roteiros completos (hook + desenvolvimento + CTA)
• Gera ideias de conteúdo virais para qualquer nicho
• Adapta conteúdo para Instagram, TikTok, YouTube, etc.
• Melhora hooks, CTAs e storytelling
• Aplica técnicas de copy persuasiva

Regras:
• Sempre responda em português do Brasil
• Seja amigável, direto e use emojis com moderação
• Use formatação com **negrito** e listas quando apropriado
• Sempre aplique as técnicas da Nat e do Luigi nas respostas
• Seja criativo e entregue valor real em cada resposta`;

const SUMMARY_PROMPT = ``;

/** Limite de mensagens recentes enviadas como contexto completo */
const RECENT_MESSAGES_LIMIT = 6;

/** Limites de tokens por plano (por mês) */
const TOKEN_LIMITS: Record<string, number> = {
    free: 50_000,
    pro: 500_000,
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

        // Reverter para ordem cronológica
        recentMessages.reverse();

        const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: conversation.system_prompt || SYSTEM_PROMPT },
        ];

        // Incluir resumo como contexto se existir
        if (conversation.summary) {
            openaiMessages.push({
                role: 'system',
                content: `Resumo da conversa até agora: ${conversation.summary}`,
            });
        }

        // Adicionar mensagens recentes
        for (const msg of recentMessages) {
            openaiMessages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            });
        }

        // ----- Chamar OpenAI -----
        const completion = await openai.chat.completions.create({
            model: conversation.model || 'gpt-4o-mini',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 1500,
        });

        const assistantContent =
            completion.choices[0]?.message?.content ?? 'Desculpe, não consegui gerar uma resposta.';
        const tokensIn = completion.usage?.prompt_tokens ?? 0;
        const tokensOut = completion.usage?.completion_tokens ?? 0;

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
                model: 'gpt-4o-mini',
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

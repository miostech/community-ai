import { NextRequest, NextResponse } from 'next/server';

// TODO: Configurar credenciais da Kiwify
const KIWIFY_API_KEY = process.env.KIWIFY_API_KEY;
const KIWIFY_API_URL = 'https://api.kiwify.com.br/v1';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // TODO: Implementar chamada real à API da Kiwify
    // Exemplo de estrutura:
    /*
    const response = await fetch(`${KIWIFY_API_URL}/customers/subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIWIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      params: new URLSearchParams({ email }),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar assinaturas da Kiwify');
    }

    const data = await response.json();
    
    // Extrair IDs dos cursos que o usuário tem acesso
    const courseIds = data.subscriptions
      .filter((sub: any) => sub.status === 'active')
      .map((sub: any) => sub.product_id);
    */

    // Simulação temporária
    // Em produção, retornar os IDs dos cursos que o usuário tem acesso
    const courseIds: string[] = [];

    // Para usuário de teste, dar acesso ao HPA (96dk0GP)
    if (email === 'usuario@email.com' || email.includes('teste') || email.includes('test')) {
      courseIds.push('96dk0GP');
    }

    return NextResponse.json({ courseIds });
  } catch (error) {
    console.error('Erro ao verificar assinaturas Kiwify:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar assinaturas' },
      { status: 500 }
    );
  }
}

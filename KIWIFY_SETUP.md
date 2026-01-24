# Integração com Kiwify

Este documento explica como configurar a integração com a API da Kiwify para verificar assinaturas de cursos.

## Configuração

### 1. Obter credenciais da Kiwify

1. Acesse o painel da Kiwify
2. Vá em **Configurações** > **API**
3. Gere uma chave de API
4. Copie a chave gerada

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
KIWIFY_API_KEY=sua_chave_api_aqui
KIWIFY_API_URL=https://api.kiwify.com.br/v1
```

### 3. Implementar a chamada à API

Edite o arquivo `app/api/kiwify/check-subscriptions/route.ts` e implemente a chamada real à API da Kiwify.

Exemplo de implementação:

```typescript
const response = await fetch(`${KIWIFY_API_URL}/customers/subscriptions`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${KIWIFY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  params: new URLSearchParams({ email }),
});

const data = await response.json();

// Extrair IDs dos cursos que o usuário tem acesso
const courseIds = data.subscriptions
  .filter((sub: any) => sub.status === 'active')
  .map((sub: any) => sub.product_id);
```

## Estrutura de Dados

### Cursos

Cada curso deve ter:
- `id`: ID único do curso
- `kiwifyId`: ID do produto na Kiwify
- `kiwifyUrl`: URL do produto na Kiwify
- `isAvailable`: Boolean indicando se o usuário tem acesso

### Verificação de Assinaturas

A API retorna um array de IDs de cursos (`courseIds`) que o usuário tem acesso ativo.

## Fluxo

1. Usuário acessa a página de cursos
2. Sistema verifica assinaturas via API da Kiwify
3. Cursos disponíveis mostram botão "Acessar Curso"
4. Cursos bloqueados mostram cadeado e botão "Adquirir Curso"
5. Ao clicar em "Adquirir", usuário é redirecionado para a página de pagamento da Kiwify

## Documentação da API Kiwify

Consulte a documentação oficial da Kiwify para mais detalhes:
- [Documentação da API Kiwify](https://docs.kiwify.com.br)

## Notas

- A verificação de assinaturas é feita automaticamente quando o usuário acessa a página de cursos
- Os dados são atualizados em tempo real
- Em caso de erro na API, os cursos aparecem como bloqueados por padrão

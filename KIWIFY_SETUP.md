# Integração com Kiwify

Este documento explica **o que a Kiwify precisa te fornecer** para a validação de login e de acesso aos cursos funcionar, e como configurar.

---

## O que a Kiwify precisa te dar

A API pública da Kiwify **não tem** um endpoint do tipo “consulta cliente por email”. O que existe é:

1. **Autenticação OAuth** – para a nossa aplicação se identificar na Kiwify.
2. **Listar vendas** – lista vendas em um período (ex.: últimos 90 dias), e cada venda traz o **email do comprador** e o **produto**.

Por isso a validação funciona assim:

- Para saber se um **email tem compra** (e pode fazer login “com email da compra” ou ter acesso a curso):
  - Pedimos um **token OAuth** (usando as credenciais abaixo).
  - Chamamos **“Listar vendas”** em janelas de até 90 dias.
  - Filtramos no nosso lado as vendas em que `customer.email` é igual ao email informado e o status é pago (ex.: `paid` / `approved`).
  - Se existir pelo menos uma venda assim, consideramos que o email tem compra e, se for o caso, quais **IDs de produtos** ele comprou.

Ou seja: **tudo que precisamos da Kiwify para essa validação vem da API pública (OAuth + listar vendas)**. Nada de “senha do cliente na Kiwify” ou endpoint especial de “login por email”.

---

## O que você precisa obter na Kiwify

No painel da Kiwify:

1. Acesse **Apps** → **API** → **Criar API Key** (ou equivalente).
2. Anote:
   - **Client ID** (ou o valor que a Kiwify mostrar como “ID” da API Key).
   - **Client Secret** (segredo da API Key; a Kiwify pode mostrar como “secret” ou “client_secret”).
   - **Account ID** – em geral no mesmo lugar da API Key (às vezes chamado “ID da conta” ou “x-kiwify-account-id”).

A documentação oficial da Kiwify descreve isso aqui:

- [Informações gerais da API](https://docs.kiwify.com.br/api-reference/general)
- [Gerar token OAuth](https://docs.kiwify.com.br/api-reference/auth/oauth)
- [Listar vendas](https://docs.kiwify.com.br/api-reference/sales/list)

Resumo do que a API faz:

- **POST** `https://public-api.kiwify.com/v1/oauth/token`  
  - Com `client_id` e `client_secret` (form-urlencoded).  
  - Resposta: `access_token` (válido por 24h).
- **GET** `https://public-api.kiwify.com/v1/sales`  
  - Cabeçalhos: `Authorization: Bearer <access_token>` e `x-kiwify-account-id: <account_id>`.  
  - Query: `start_date`, `end_date` (obrigatórios; intervalo máximo 90 dias), e opcionalmente `status`, `page_size`, `page_number`, etc.  
  - Resposta: lista de vendas; cada item tem `customer.email`, `product.id`, `status`, etc.

Ou seja: **para fazer a validação, só precisamos dessas três coisas da Kiwify: Client ID, Client Secret e Account ID.**

---

## Variáveis de ambiente

No `.env.local` (ou no ambiente do servidor), configure:

```env
# Obrigatórias para usar a API real da Kiwify
KIWIFY_CLIENT_ID=be161f42-d05-4949-8736-a526c28672d
KIWIFY_CLIENT_SECRET=a12b34c56d78e90f...
KIWIFY_ACCOUNT_ID=U9Ch6zRkT2fB
```

- **KIWIFY_CLIENT_ID** – valor do “Client ID” (ou ID da API Key) que a Kiwify te deu.  
- **KIWIFY_CLIENT_SECRET** – segredo da API Key (client_secret).  
- **KIWIFY_ACCOUNT_ID** – ID da conta, usado no header `x-kiwify-account-id` nas chamadas de vendas.

Sem essas três variáveis, a aplicação **não** chama a API da Kiwify; em desenvolvimento, emails de teste (ex.: `usuario@email.com` ou com “teste”/“test”) podem receber acesso ao curso de teste para você testar o fluxo.

---

## O que o código faz com isso

- **Login “com email da compra” (Kiwify)**  
  - Usuário informa **email** e **senha** (senha é a que ele define na nossa plataforma na primeira vez).  
  - Verificamos na Kiwify se esse email tem **pelo menos uma venda paga** (usando OAuth + listar vendas).  
  - Se tiver, permitimos criar conta / fazer login e guardamos o hash da senha aqui.

- **Acesso aos cursos**  
  - Para saber se o usuário tem direito a um curso, usamos a mesma lógica: listar vendas, filtrar por `customer.email` e status pago, e ver quais `product.id` aparecem.  
  - Os IDs que a API devolve são **UUIDs** (ex.: `aaa86f40-d7ae-11ed-acc6-e1c45591a30e`). Se no seu app os cursos estão configurados com outro identificador (ex.: slug do link de pagamento), você pode manter um mapeamento UUID → esse identificador na configuração dos cursos.

---

## Resumo

| O que você precisa da Kiwify | Para que serve |
|-----------------------------|----------------|
| **Client ID**               | Gerar o token OAuth (autenticação da nossa app na Kiwify). |
| **Client Secret**           | Mesmo uso (gerar token OAuth). |
| **Account ID**              | Enviar no header `x-kiwify-account-id` ao listar vendas. |

Com esses três itens configurados nas variáveis de ambiente, a validação (login com email da compra + acesso aos cursos) usa **apenas** a API pública da Kiwify; não é necessário endpoint extra nem “senha do cliente na Kiwify” para essa validação.

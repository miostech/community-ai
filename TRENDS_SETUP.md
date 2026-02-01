# Top Trends – Google Trends (Brasil)

A página **Top Trends** no dashboard exibe pesquisas em alta no Google para o **Brasil**, usando a [SearchAPI (Google Trends)](https://www.searchapi.io/docs/google-trends).

## Configuração

### 1. Obter chave da SearchAPI

1. Acesse [searchapi.io](https://www.searchapi.io/)
2. Crie uma conta ou faça login
3. Obtenha sua **API Key** no painel

### 2. Variáveis de ambiente

No `.env.local` na raiz do projeto, adicione:

```env
SEARCHAPI_API_KEY=sua_chave_api_aqui
```

### 3. Comportamento

- **API**: `GET /api/trends` chama a SearchAPI com `engine=google_trends_trending_now` (Trending Now – o mesmo que aparece no site do Google em “Em alta”), `geo=BR`, `time=past_24_hours`.
- **Região**: Brasil (`geo=BR`).
- **Período**: últimas 24 horas (`now 1-d`). Sem fallback, para gastar só 1 crédito por carregamento.
- **Cache**: a rota usa revalidação de 1h para reduzir chamadas à API.

Sem `SEARCHAPI_API_KEY`, a página exibe uma mensagem orientando a configuração.

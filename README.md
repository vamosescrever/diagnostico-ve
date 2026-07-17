# diagnostico-ve

Formulário de diagnóstico de escrita — Vamos Escrever.

## Stack

- Next.js 14 (Pages Router)
- Resend (envio de email com anexos)
- Formidable (parse de multipart/form-data)

## Deploy no Vercel

1. Crie um repositório no GitHub dentro da org `vamosescrever`
2. Faça push deste projeto
3. No Vercel, importe o repositório
4. Em **Settings → Environment Variables**, adicione:
   - `RESEND_API_KEY` → sua chave do Resend
5. Clique em Deploy

## Variável de ambiente necessária

| Variável | Onde pegar |
|---|---|
| `RESEND_API_KEY` | resend.com → API Keys |

## Domínio personalizado (opcional)

No Vercel → Settings → Domains, adicione:
`diagnostico.vamosescrever.com.br`

No Registro.br, adicione um CNAME apontando para `cname.vercel-dns.com`.

## Como funciona o envio

Cada submissão do formulário chama `/api/submit`, que:
1. Faz o parse do multipart (respostas + áudios + arquivos)
2. Monta um email HTML com todas as respostas formatadas
3. Anexa os áudios e arquivos enviados
4. Dispara para `ve@vamosescrever.com.br` via Resend

Não há banco de dados — tudo chega na caixa de email.

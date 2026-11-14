# Abrir no Android

O Android acessa o cliente no navegador. O backend precisa ficar rodando em Linux.

## GitHub

GitHub Pages não executa Node nem WebSockets. GitHub pode armazenar o projeto e conectar uma hospedagem compatível.

A pasta `.devcontainer/` instala as dependências e inicia o servidor automaticamente no GitHub Codespaces. Também é possível executar manualmente para testes: abrir o repositório em Codespaces, rodar `npm ci && npm start`, e na aba Ports encaminhar a porta 3000. A URL só funciona enquanto o Codespace e o processo estiverem ativos. Acesso externo depende da visibilidade/permissões da porta; compartilhar publicamente exige escolher essa visibilidade explicitamente. A disponibilidade depende da conta e de sua cota.

## Render

O arquivo render.yaml prepara um serviço Docker no plano free. É necessário criar/conectar uma conta e apontar para seu repositório GitHub. A aplicação usa a variável PORT fornecida pelo serviço.

O plano gratuito pode suspender a aplicação quando ociosa; a inicialização seguinte pode demorar. Os dados em `/tmp/pb-port-data` não são duráveis entre reinícios/redeploys. Para manter perfis, usar disco persistente ou banco externo antes de tratar esta configuração como hospedagem definitiva de contas. Não foi provisionado serviço pago.

## VPS

Usar o Dockerfile existente e montar um volume em /data. Publicar atrás de proxy HTTPS com suporte a upgrade de WebSocket. Não colocar tokens ou data/ no repositório.

Nesta sessão, o serviço de túnel temporário respondeu HTTP 403. Nenhum endereço público foi gerado por ele.

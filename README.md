# Quality Gate para GitHub e Vercel

Esta pasta é um projeto completo e independente. Envie o conteúdo de `vercel/` ao repositório, incluindo `package.json`, `package-lock.json`, `src/`, `public/`, `scripts/`, `vite.config.ts`, `tsconfig.json` e `vercel.json`. Não envie `node_modules/` nem `dist/`.

## Configuração do Vercel

Se o repositório contiver esta pasta dentro de outra, escolha `vercel` como **Root Directory** nas configurações do projeto Vercel. Se você enviar o conteúdo desta pasta diretamente para a raiz do repositório, deixe **Root Directory** como `./`.

O `vercel.json` configura a instalação com `npm ci`, o build com `npm run build`, a saída em `dist` e o fallback para a aplicação. O Vercel executa esses comandos automaticamente após cada envio.

## Imagens

Coloque imagens em `public/images/`; subpastas são aceitas. O script `scripts/generate-image-manifest.mjs` cataloga PNG, JPG, JPEG, WebP, GIF, SVG, BMP e AVIF no desenvolvimento e no build. No painel administrativo, abra **Imagens** para conferir e vincular cada arquivo a um item. Os caminhos diferenciam maiúsculas de minúsculas no Vercel.

## Testes

- `npm ci`: instala as dependências.
- `npm run dev`: inicia o app localmente.
- `npm run build`: verifica os tipos e gera `dist/`.
- `npm run preview`: serve a versão gerada.

O app inicia no painel administrativo em modo de demonstração. Os cadastros ficam no `localStorage` do navegador e não são compartilhados entre dispositivos. Este modo não oferece autenticação segura e não deve ser usado com dados reais.

# Quality Gate para GitHub e Vercel

Esta pasta é um projeto completo e independente. Envie o conteúdo de `vercel/` ao repositório, incluindo `package.json`, `package-lock.json`, `src/`, `public/`, `scripts/`, `vite.config.ts`, `tsconfig.json` e `vercel.json`. Não envie `node_modules/` nem `dist/`.

## Configuração do Vercel

Se o repositório contiver esta pasta dentro de outra, escolha `vercel` como **Root Directory** nas configurações do projeto Vercel. Se você enviar o conteúdo desta pasta diretamente para a raiz do repositório, deixe **Root Directory** como `./`.

O `vercel.json` configura a instalação com `npm ci`, o build com `npm run build`, a saída em `dist` e o fallback para a aplicação. O Vercel executa esses comandos automaticamente após cada envio.

Ao iniciar, informe seu nome para entrar como usuário e acessar pesquisa e Chat. A guia **Embalagem** fica dentro do painel **Administração**, onde somente o administrador pode cadastrar e editar padrões. As instruções de embalagem vinculadas continuam aparecendo nos resultados da pesquisa.

O Chat está disponível para os dois perfis e, nesta versão estática, salva as mensagens somente no `localStorage` do navegador atual. Ele não compartilha mensagens entre dispositivos ou navegadores; isso exige conectar um backend.

## Imagens

Coloque imagens em `public/images/`; subpastas são aceitas. O script `scripts/generate-image-manifest.mjs` cataloga PNG, JPG, JPEG, WebP, GIF, SVG, BMP e AVIF no desenvolvimento e no build. Todas aparecem na seção **Imagens disponíveis**, dentro da aba **Itens** do painel administrativo, onde é possível filtrar por pasta e vinculá-las a um item. Ao cadastrar um item, selecione a pasta de organização. Pastas existentes são descobertas pelas subpastas de `public/images/`; pastas criadas pelo formulário são categorias locais deste navegador. Para adicionar uma pasta real com imagens, inclua-a em `public/images/` no projeto e publique novamente. Os caminhos diferenciam maiúsculas de minúsculas no Vercel.

Na pesquisa, o app procura primeiro o código do item e depois o nome do arquivo da imagem, sem considerar a extensão. Por exemplo, a imagem `7.png` também é encontrada ao pesquisar `7`.

Ao pesquisar ou abrir um item com alerta ativo, os alertas aparecem acima do desenho e o app mostra um aviso de confirmação antes de revelar a imagem. Claims têm destaque vermelho; alertas padrão usam destaque âmbar. A imagem só aparece após **OK, entendi**.

Na pesquisa, use os controles `+`/`−` ou o scroll do mouse sobre a imagem para ampliar e reduzir. Clique e arraste em qualquer ponto da área da imagem para reposicioná-la; use redefinir para voltar ao padrão. O quadro de semelhantes só aparece quando o código pesquisado pertence a um grupo cadastrado. Nesse caso, a peça pesquisada aparece destacada em verde e as peças relacionadas em cartões laranja. Cada imagem semelhante tem zoom e arraste independentes; selecione **Abrir este desenho** para torná-la a peça pesquisada. No cadastro de **Semelhantes**, adicione os códigos um por vez com **OK**; cada grupo aceita de 2 a 10 códigos e pode ser editado na tabela. Alertas também podem ser editados; informe o código-base da imagem no campo da imagem para o app localizar o arquivo automaticamente.

## Testes

- `npm ci`: instala as dependências.
- `npm run dev`: inicia o app localmente.
- `npm run build`: verifica os tipos e gera `dist/`.
- `npm run preview`: serve a versão gerada.

## Senha administrativa

O acesso é validado pela função serverless `api/admin-session.ts`; a senha não é enviada ao bundle do navegador. No Vercel, configure em **Settings → Environment Variables**:

- `ADMIN_PASSWORD`: escolha uma senha nova para o administrador, com pelo menos 16 caracteres.
- `ADMIN_SESSION_SECRET`: chave aleatória com pelo menos 32 caracteres para assinar a sessão.

Depois, publique novamente. Não use variáveis `VITE_` para segredos e não grave senhas no código ou no Git. `.env.example` contém apenas os nomes das variáveis; `.env` e `.env.local` são ignorados pelo Git. Como uma senha foi compartilhada na conversa, troque-a antes de configurar o ambiente.

Para testar a função localmente, use `npx vercel dev` com as variáveis em `.env.local`; `npm run dev` inicia apenas o Vite e não executa funções serverless. A sessão administrativa expira após oito horas e pode ser encerrada pelo botão **Sair Admin**.

O login protege a entrada da interface administrativa. Os cadastros e o Chat ainda ficam no `localStorage` deste navegador; proteger dados compartilhados contra acesso direto exigiria persistência e autorização de dados no servidor.

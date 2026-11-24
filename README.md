# Quality Gate

Aplicação web demonstrativa para consulta de desenhos industriais, alertas de qualidade, padrões de embalagem e comunicação com a equipe.

## Executar

```bash
npm ci
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Publicar no GitHub

Não envie `node_modules/` nem `dist/`: são dependências instaladas localmente e arquivos gerados pelo build, e ambos já estão excluídos pelo `.gitignore`. Mantenha `package.json` e `package-lock.json` no repositório; eles permitem reinstalar as dependências com `npm ci`.

Se usar o envio de arquivos pelo site do GitHub, selecione os arquivos do projeto sem as pastas `node_modules/` e `dist/`. O código-fonte necessário está em `src/` e `public/`, junto dos arquivos de configuração na raiz.

## Acessos de demonstração

- **Visitante:** informe qualquer nome; não é necessária senha.
- **Administrador:** na tela de acesso, use um e-mail que contenha `admin` e qualquer senha.
- **Usuário:** cadastre uma conta pela opção “Cadastre-se”.

Os registros de exemplo são salvos no `localStorage` do navegador. O cadastro de convites, as mensagens e as aprovações também são apenas locais: este projeto ainda não está conectado a autenticação, banco de dados, e-mail ou atualizações em tempo real. O scanner usa `BarcodeDetector`, quando disponível, e requer permissão de câmera em contexto seguro (HTTPS ou localhost).

**Não use dados reais nem publique como sistema de produção antes de integrar um backend com autenticação e autorização no servidor.** A identificação de administrador nesta demonstração é intencionalmente simulada e não oferece controle de acesso seguro.

## Imagens versionadas no GitHub/Vercel

Coloque os arquivos de desenho dentro de `public/images/` e faça commit deles junto com o projeto. No cadastro do item, alerta ou embalagem, informe o caminho público começando com `/images/`, por exemplo `/images/4172-04-00.png`. O Vite copia os arquivos de `public/` para a raiz do build, então o mesmo caminho funciona no Vercel. Os nomes diferenciam maiúsculas de minúsculas após a publicação.

Ao pesquisar ou escanear um código com alerta ativo, o Quality Gate abre os detalhes dos alertas daquele item imediatamente; claims aparecem primeiro e alertas padrão também são incluídos.

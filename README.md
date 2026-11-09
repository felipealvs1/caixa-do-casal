# Caixa do Casal

Controle financeiro do Felipe e da Maiara. O app fica neste repositório (publicado no GitHub Pages) e os dados ficam numa planilha do Google de vocês. Nada depende da conta do Claude.

```
index.html             o app (abre no celular e no computador)
apps-script/Codigo.gs  o "servidor" que grava na planilha
```

## Parte 1 · Planilha (uma vez, uns 10 minutos)

1. Na **conta Google pessoal**, crie uma planilha em branco em [sheets.new](https://sheets.new) e dê o nome **Caixa do Casal**.
2. Na planilha: **Extensões → Apps Script**.
3. Apague o que estiver no editor e cole todo o conteúdo de `apps-script/Codigo.gs`.
4. Na linha `const SENHA = 'troque-esta-senha';`, troque pela senha do casal. Use algo longo, que só vocês dois saibam.
5. Salve (ícone de disquete).
6. **Implantar → Nova implantação**. Na engrenagem, escolha **App da Web** e preencha:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar** e autorize com a sua conta Google. Se aparecer "o Google não verificou este app", clique em **Avançado → Acessar Caixa do Casal**. É normal: o script é seu.
8. Copie o **URL do App da Web** (termina em `/exec`).

"Qualquer pessoa" só quer dizer que o app consegue chamar o endereço. Sem a senha, ninguém lê nem grava nada.

## Parte 2 · Ligar o app à planilha

1. No GitHub, abra `index.html` e clique no lápis (Editar).
2. Procure (Ctrl+F) por `const PLANILHA_URL=''`.
3. Cole o URL entre as aspas: `const PLANILHA_URL='https://script.google.com/macros/s/.../exec';`
4. **Commit changes**.

## Parte 3 · Publicar o site (GitHub Pages)

1. No repositório: **Settings → Pages**.
2. Em *Source*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
3. Em 1 ou 2 minutos aparece o link, algo como `https://SEU-USUARIO.github.io/caixa-do-casal/`.

## Parte 4 · Levar os dados que já existem

1. Abra a versão antiga, no Claude: **Ajustes → Copiar dados**.
2. Abra o link novo, entre com a senha, vá em **Ajustes**, cole em "Restaurar a partir de uma cópia" e toque em **Restaurar dados colados**.
3. Confira na planilha: aparecem as abas **Rendas**, **Gastos** e **Ajustes**.

## Atualizar o script

Quando o `apps-script/Codigo.gs` mudar (por exemplo, a versão 2, que permite mudar o valor de uma conta só em um mês):

1. Na planilha: **Extensões → Apps Script**.
2. **Antes de apagar**, copie a linha `const SENHA = '...';` com a senha de vocês.
3. Apague tudo e cole o conteúdo novo de `apps-script/Codigo.gs`.
4. Cole de volta a linha da senha no lugar de `const SENHA = 'troque-esta-senha';`.
5. Salve (ícone de disquete).
6. **Implantar → Gerenciar implantações → lápis (editar) → Versão: Nova versão → Implantar**.

Não use "Nova implantação": ela muda o endereço, e aí o `index.html` precisaria ser atualizado. A planilha ganha sozinha a coluna nova (`ajustes`) na primeira vez que o app conversar com ela.

## No celular

Abram o link do GitHub Pages no navegador, digitem a senha uma vez e adicionem à tela inicial:
- **Android (Chrome):** menu ⋮ → Adicionar à tela inicial.
- **iPhone (Safari):** Compartilhar → Adicionar à Tela de Início.

## Bom saber

- **Cópia de segurança:** a própria planilha já é a cópia. Para guardar uma foto do momento, use Arquivo → Fazer uma cópia.
- **Editar direto na planilha** funciona, mas mantenham a coluna `id` preenchida e os meses no formato `2026-11`.
- **Trocar a senha:** mude no Apps Script, salve e faça **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**. O URL continua o mesmo. Cada aparelho vai pedir a senha nova.
- **Alterou o Codigo.gs?** Faça sempre o mesmo "Nova versão" acima. Se criar uma *nova implantação*, o URL muda e é preciso atualizar o `index.html`.
- O app confere a planilha a cada 20 segundos e sempre que é aberto. O que um lança aparece para o outro logo em seguida.

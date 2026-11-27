# BRAND.md — regras visuais do site ZENIT

Memória de design do site. **Leia antes de qualquer alteração visual** e atualize
quando uma decisão nova for tomada.

## Fonte da verdade

O design system oficial da ZENIT (artifact "ZENIT", aprovado pelo Gustavo em 27/09/2026).
Este site aplica o tema **Noite**. Os tokens estão no topo de `assets/style.css`
e os logos oficiais em `assets/brand/`. Nunca remonte nem recolora o logo; use os arquivos.

## Conceito do site

"Do horizonte ao zênite". A página inteira é o céu da marca, com só dois momentos de
movimento autoral (abertura e rodapé) e o meio calmo, editorial:
- **Abertura (céu + Sagitário, `assets/sky.js`, ~4 s, pulável)**: o topo é um céu de estrelas desenhado
  no navegador. A constelação de Sagitário (estrelas reais, posições do céu) se desenha atrás do logo
  com contas pontilhadas discretas; o arqueiro (arco e flecha, desenho próprio) em dourado-luz. A figura
  é girada para a flecha mirar o zênite: a flecha dispara até a estrela da marca, há um clarão com um
  meio-círculo de sonar, a constelação explode e os mesmos pontos formam o lockup (forma tirada do SVG
  oficial, nas cores dele). No fim entra o arquivo oficial, nítido. Depois o céu só respira: o mouse
  afasta e acende as estrelas em volta (raio ~170px), um clique/toque solta círculos completos
  (um sim, um não pontilhado; meio-círculo ficou estranho). Céu denso: ~2.400 estrelas no PC, ~900 no
  celular, com ~50 cintilantes (só brilho, sem cruz; metade douradas). Rolar, tocar ou usar o teclado pula a cena.
  Nunca copiar arte de terceiros (a referência de "constelação desenhada" veio de um anime protegido).
  Reduzir movimento: céu parado, logo direto.
- **Hero**: a marca (lockup oficial, inline) é o centro, grande e sem corte. Ela é viva: os anéis
  do sonar acendem do centro para fora e a estrela respira, sem nunca mudar cor nem geometria.
  Ao rolar (desktop, fixado), a marca CRESCE até a estrela e dá lugar ao título, que sobe linha por linha.
  Nada no hero só diminui. Logo abaixo da marca, já visíveis: os serviços e o botão
  "Pedir diagnóstico gratuito" (a oferta nunca fica escondida atrás da rolagem).
- **Serviços**: tudo à vista, sem clique: nome, frase curta em dourado, o problema (como frase, sem rótulo)
  e o que entra. Sem numeração: os serviços não são uma sequência.
  O cliente não pode ter esforço para descobrir o que vendemos.
- **Método**: painéis horizontais fixados, com a linha pontilhada dourada (a mesma do lockup)
  avançando de etapa em etapa.
- **Acompanhamento**: as quatro perguntas que o resumo mensal responde, em tipografia grande, com o "?"
  em dourado. Nada de painel com números inventados, gráfico de barras ou caixa com sombra.
- **Rodapé**: a palavra ZENIT enorme, quase apagada, sempre inteira (nunca cortada).

## O que NÃO fazer (cara de site feito por IA)

- Rótulo pequeno em caixa-alta acima de todo título de seção.
- Títulos sempre centralizados com subtítulo cinza embaixo.
- Grade 3×2 de cards iguais com ícone em quadradinho e lista de checks.
- Fundo quadriculado, blobs de gradiente, gradiente roxo/azul, emoji.
- Etiquetas em pílula espalhadas pelo hero.
- Cards estáticos, sem nenhuma reação ao mouse.
- Conteúdo escondido atrás de clique (acordeão) para o que o cliente precisa ver de cara.
- Bloco de texto grande sem função (o "manifesto" foi removido a pedido: incomodava).
- Logo cortado ou pequeno demais.
- Numeração 01/02/03 onde a ordem não informa nada (só o Método tem números).
- Rótulo em caixa-alta repetido acima de cada bloco ("O PROBLEMA").
- Painel de métricas com números grandes, rótulos pequenos e barras: o modelo pronto de "dashboard".

## Cor

- Base: marinho `surface-100` e off-white `ink`. A página é quase monocromática.
- **Dourado só onde há luz ou interação**: estrela, linhas pontilhadas, números de etapa,
  estado de hover/foco/ativo. Não usar dourado como fundo de bloco grande.
- Botão principal: off-white com texto marinho; vira dourado no hover.
- Verde só no botão do WhatsApp. Ele some no topo e na área de contato, onde já há botão.
- Borda de campo de formulário: `--line-control` (#5B6572, 3,4:1). O `--line` (1,4:1) só para divisores.

## Tipografia

- Títulos: Space Grotesk 500, grandes, alinhados à esquerda, entreletra levemente negativo.
- Fontes hospedadas no próprio site (`assets/fonts/`, Fontsource, licença OFL), subconjunto latino.
- Limites: título no máximo 96px (6rem); entreletra no mínimo -0.04em.
- Texto: Inter. Rótulos de marca: Poppins Medium caixa-alta (com moderação, não em toda seção).

## Movimento

- GSAP + ScrollTrigger (em `assets/vendor/`, licença padrão gratuita da GreenSock).
- **Só três movimentos**: a passagem do hero, os painéis do Método e o sonar vivo. Nada de títulos
  crescendo, itens subindo em sequência ou parallax em toda seção. Fora do hero, o conteúdo
  nunca começa invisível ou apagado.
- Curva da marca `cubic-bezier(.65,0,.35,1)`, 0,5–0,7 s: **só nos momentos da marca** (entrada do
  logo, sonar). Rolagem presa ao scroll usa ligação direta (`ease: "none"`), nunca curva que começa devagar.
- Interface (hover, foco, toque, menu, FAQ, WhatsApp): `--ease-out` `cubic-bezier(0.23,1,0.32,1)`,
  até 300 ms; cor em `150ms ease`; botões com `scale(.97)` no toque. Hover que move só com
  `(hover: hover) and (pointer: fine)`. Nada nasce de `scale(0)`. Nada anima em ação de teclado.
- Animações controladas pela rolagem aplicam `transform` direto no elemento (sem variável CSS no pai).
- Com "reduzir movimento" ativo: nada fixado, nada escalando, tudo visível de imediato; brilho e cor
  continuam (o sonar só muda brilho, então fica). O sonar pausa quando o topo sai da tela.
- No celular: sem painéis horizontais; tudo empilha.

## Texto

Voz direta e técnica, sem hype. Não inventar números, prazos, preços ou depoimentos:
só entram quando a ZENIT fornecer dados reais.

## Histórico

- 2026-11-19: primeira versão (genérica).
- 2026-11-21: design system ZENIT aplicado.
- 2026-11-21: redesign para tirar a "cara de IA": layout editorial, scroll com fixação,
  revelação de texto, lista de serviços interativa, dourado só na luz e na interação.
- 2026-11-21: feedback de revisão: marca central maior e viva, animação de rolagem que cresce
  (não só diminui), manifesto removido, serviços totalmente visíveis, logo do rodapé inteiro.
- 2026-11-27: revisão Impeccable: botão visível sob a marca, serviços sem número nem rótulo,
  acompanhamento em quatro perguntas (sai o painel de exemplo), só três movimentos, limites de
  tipografia, contraste dos campos, fontes no próprio site, link "pular para o conteúdo", Esc
  fecha o menu, hover só com mouse, WhatsApp some onde já há contato.
- 2026-11-27: revisão de movimento (Emil Kowalski): interface até 300 ms com ease-out, curva da marca
  só nos momentos da marca, rolagem com ligação direta, reduzir movimento menos radical.
- 2026-11-27: direção "Do horizonte ao zênite" aprovada. Abertura com céu de partículas que se
  organiza no lockup oficial (referências: Shopify Editions e rodapé de partículas da Oryzo).
- 2026-11-27: abertura com Sagitário: o arqueiro mira o zênite, a flecha dispara, a constelação
  explode e vira o logo.
- 2026-11-27: céu mais denso com estrelas cintilantes, efeito do mouse mais forte e cliques em círculo completo.

# BRAND.md — regras visuais do site ZENIT

Memória de design do site. **Leia antes de qualquer alteração visual** e atualize
quando uma decisão nova for tomada.

## Fonte da verdade

O design system oficial da ZENIT (artifact "ZENIT", aprovado pelo Gustavo em 27/09/2026).
Este site aplica o tema **Noite**. Os tokens estão no topo de `assets/style.css`
e os logos oficiais em `assets/brand/`. Nunca remonte nem recolora o logo; use os arquivos.

## Conceito do site

"Subir até o zênite". O visitante começa no horizonte e sobe:
- **Hero fixado**: o lockup oficial aproxima até a estrela enquanto o título revela linha por linha.
- **Manifesto**: frase grande em que as palavras acendem conforme o scroll.
- **Serviços**: lista editorial interativa (linhas grandes que abrem), não grade de cards.
- **Método**: painéis horizontais fixados, com a linha pontilhada dourada (a mesma do lockup)
  avançando de etapa em etapa.
- **Acompanhamento**: um exemplo de relatório mensal, marcado como exemplo.
- **Rodapé**: a palavra ZENIT enorme, quase apagada.

## O que NÃO fazer (cara de site feito por IA)

- Rótulo pequeno em caixa-alta acima de todo título de seção.
- Títulos sempre centralizados com subtítulo cinza embaixo.
- Grade 3×2 de cards iguais com ícone em quadradinho e lista de checks.
- Fundo quadriculado, blobs de gradiente, gradiente roxo/azul, emoji.
- Etiquetas em pílula espalhadas pelo hero.
- Cards estáticos, sem nenhuma reação ao mouse.

## Cor

- Base: marinho `surface-100` e off-white `ink`. A página é quase monocromática.
- **Dourado só onde há luz ou interação**: estrela, linhas pontilhadas, números de etapa,
  estado de hover/foco/ativo. Não usar dourado como fundo de bloco grande.
- Botão principal: off-white com texto marinho; vira dourado no hover.
- Verde só no botão do WhatsApp.

## Tipografia

- Títulos: Space Grotesk 500, grandes, alinhados à esquerda, entreletra levemente negativo.
- Texto: Inter. Rótulos de marca: Poppins Medium caixa-alta (com moderação, não em toda seção).

## Movimento

- GSAP + ScrollTrigger (em `assets/vendor/`, licença padrão gratuita da GreenSock).
- Curva da marca `cubic-bezier(.65,0,.35,1)`, 0,5–0,7 s para entradas.
- Com "reduzir movimento" ativo: nada fixado, nada escalando, tudo visível de imediato.
- No celular: sem painéis horizontais; tudo empilha.

## Texto

Voz direta e técnica, sem hype. Não inventar números, prazos, preços ou depoimentos:
só entram quando a ZENIT fornecer dados reais.

## Histórico

- 2026-11-19: primeira versão (genérica).
- 2026-11-21: design system ZENIT aplicado.
- 2026-11-21: redesign para tirar a "cara de IA": layout editorial, scroll com fixação,
  revelação de texto, lista de serviços interativa, dourado só na luz e na interação.

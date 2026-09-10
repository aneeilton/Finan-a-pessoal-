# Análise do projeto e plano de migração

## 1. Acesso ao site atual

`https://4neilton.netlify.app` está bloqueado pela política de rede deste ambiente
(egress proxy nega a conexão) e o repositório `aneeilton/Finan-a-pessoal-` no GitHub
está **vazio** (sem commits, sem branches) — ou seja, o código-fonte do app atual não
está neste repositório. Por isso não foi possível inspecionar o HTML/CSS/JS reais do
site publicado. A reconstrução abaixo foi feita a partir de duas fontes confiáveis:

1. O **backup de dados** (`financas_backup_20260910.json`), que revela com precisão o
   modelo de dados e, por consequência, todas as telas/funcionalidades que o app
   precisa ter.
2. Padrões de UX consolidados em apps de finanças pessoais do mesmo segmento
   (Mobills, Organizze, Money Manager, GuiaBolso, Nubank, YNAB) — referência de
   layout "tipo aplicativo": navegação inferior por abas, cartões arredondados,
   resumo no topo, chips coloridos por categoria, toques grandes para uso no
   celular.

Se você tiver o código-fonte do site atual em outro lugar (outro repositório, um
zip local, etc.), envie que eu comparo tela a tela e ajusto qualquer diferença de
comportamento.

## 2. O que o backup revela sobre as funcionalidades atuais

| Bloco no JSON | Significado | Tela correspondente |
|---|---|---|
| `contas[]` (`corrente`, `aplicado`) | Saldo em conta corrente e valor aplicado/investido por banco | **Contas** |
| `dividas[]` (`tipo: curto/longo`) | Dívidas de curto e longo prazo | **Dívidas** |
| `bens[]` | Patrimônio (casa, moto, eletrônicos...) | **Patrimônio** |
| `receitas[]` (`v[7]`, `expectativa`) | Fontes de renda, valor por mês, marcação de "expectativa" (não garantido) | **Receitas** |
| `cartoes[]` (`dia`, `v[7]`) | Faturas de cartão, dia de vencimento, valor por mês | **Cartões** |
| `fixas[]` (`dia`, `v[7]`) | Contas fixas (água, luz, escola...), dia de vencimento, valor por mês | **Contas fixas** |
| `pagos` / `recebidos` (mapas soltos por string) | Se aquele mês daquele item já foi pago/recebido | Combinado como um campo `pago` por lançamento |
| `variaveis` | Orçamento único para gastos variáveis (mercado, lazer) | Campo em **Mais → Configurações** |

**Problema de design no formato antigo:** cada item guardava um array fixo `v[0..6]`
(7 posições, "mês a mês") e o status pago/recebido ficava em mapas de string soltos
por fora (`"fixa_0_f4": true`, `"k1_0": false`), sem nenhuma tabela relacional, sem
data real associada e com dois formatos de chave coexistindo (um legado, um novo) —
sinal de que o app foi crescendo em cima de `localStorage`/JSON solto. Isso limita o
histórico (só 7 meses cabem no array) e dificulta relatórios, filtros ou multi-
dispositivo.

**Modelagem nova (Postgres/Supabase):** troquei os arrays por duas tabelas normais —
`items` (a "receita", "cartão" ou "conta fixa" em si, com dia de vencimento e flag de
expectativa) e `lancamentos` (um valor real por mês/competência, com `pago`
booleano). Isso dá histórico ilimitado, permite consultas (ex.: "quanto gastei de
cartão nos últimos 12 meses") e sincroniza em qualquer dispositivo via Supabase Auth
+ RLS (cada usuário só enxerga os próprios dados).

## 3. Referências de design usadas

- **Navegação inferior fixa** (estilo app nativo) com 5 abas: Início, Contas,
  Cartões, Receitas, Mais — padrão em Mobills/Organizze/Nubank.
- **Cartão-resumo colorido no topo** do dashboard com o patrimônio líquido em
  destaque (gradiente verde-água → roxo), como o "saldo total" do Mobills.
- **Chips/etiquetas coloridas** por categoria (curto/longo prazo, expectativa,
  vencimento) em vez de texto simples — dá leveza visual.
- **Paleta "alegre"**: verde-água (`brand`, cor principal — transmite dinheiro e
  crescimento sem ser o verde institucional batido), coral para dívidas/alertas,
  âmbar para contas fixas, roxo (`grape`) para patrimônio, azul-céu para contas —
  cada categoria financeira tem sua cor, o que ajuda a "escanear" a tela rapidamente
  e quebra a seriedade de uma planilha.
- **Botões grandes, cantos bem arredondados (`rounded-3xl`), sombras suaves** — feel
  de app mobile, não de site institucional.
- **Empty states com emoji e frase amigável** em vez de tabelas vazias.

## 4. Nova stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind — deploy on Vercel
  com zero configuração.
- **Backend/dados:** Supabase (Postgres + Auth + Row Level Security). Cada usuário
  autenticado só vê e edita os próprios registros.
- **Sem servidor próprio:** toda a lógica roda em Server Components (leitura) e
  chamadas diretas ao Supabase pelo client autenticado (escrita), sem precisar de
  uma API intermediária.

Veja `README.md` para o passo a passo de configuração e deploy.

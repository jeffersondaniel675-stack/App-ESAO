# Prancheta FC

Jogo de gerenciamento de futebol brasileiro, original, num único arquivo (`index.html`).
Funciona no navegador do PC e do celular. O progresso é salvo no próprio navegador
(e pode ser exportado/importado como arquivo `.json`).

## Como jogar
- Abra `index.html` no navegador (ou publique a pasta no GitHub Pages).
- Escolha um clube da Série A ou da Série B de 2026 e digite seu nome.
- Em **Elenco**, escolha tática (4-4-2, 4-3-3, 4-2-3-1, 4-1-4-1, 3-5-2, 5-3-2), postura e
  escalação (toque na posição do campo e depois no jogador). Ou deixe o auxiliar escalar.
- **Jogar rodada** mostra seu jogo ao vivo: dá para pausar, trocar jogadores e mudar a tática.
  **Simular** joga a rodada direto.

## O que tem de real
- **Clubes, cidades, estádios e capacidades** das Séries A e B de 2026 (já com os acessos e
  rebaixamentos de 2025). A Série C serve de reservatório: 4 clubes dela sobem por ano.
- **Regulamento da CBF:** pontos corridos, 38 rodadas, 3 pontos por vitória e os critérios de
  desempate (vitórias, saldo, gols pró, confronto direto entre 2 clubes, menos vermelhos,
  menos amarelos, sorteio).
- **Vagas:** G4 Libertadores (grupos), 5º–6º Libertadores (pré), 7º–12º Sul-Americana,
  Z4 rebaixado. Na Série B, G4 sobe e Z4 cai.
- **Disciplina:** 3 amarelos = 1 jogo de suspensão; vermelho = 1 ou 2 jogos.
- **Partida:** até 5 substituições em 3 paradas (intervalo não conta), banco de 12.
- **Mercado:** janelas nas rodadas 1–5 e 15–19, propostas de outros clubes, jogadores livres.

Os números simulados ficam perto da realidade do Brasileirão: cerca de 2,4 gols por jogo,
~45% de vitórias do mandante, ~27% de empates e campeão com 71 a 80 pontos.

## No estilo "PC Liga"
- **Súmula** de cada jogo: gols com minuto (pênalti/contra), cartões, substituições, lesões,
  escalações, árbitro, público pagante e renda.
- **Artilharia**, **Fair Play** (amarelo = 1, vermelho = 3), pendurados e suspensos.
- **Escudos:** em Banco de dados, envie a imagem do escudo de cada clube (arquivo ou link).
  Ficam salvos no navegador para todas as carreiras e podem ser exportados/importados como
  pacote `.json`. Os escudos não vêm no repositório porque são marcas registradas dos clubes;
  sem escudo, o jogo desenha um com as cores e a sigla.
- **Banco de dados:** edite nome, sigla, cidade, estádio, capacidade e cores de qualquer clube,
  e nome, número, posição e idade de qualquer jogador.

## Limites
- Os jogadores são gerados com nomes fictícios (não há base licenciada de elencos).
  Para jogar com os elencos reais, renomeie os atletas no Banco de dados.
- Força, finanças e público são aproximações. Copa do Brasil, estaduais e Libertadores
  não são disputados (as vagas aparecem na tabela e rendem premiação).

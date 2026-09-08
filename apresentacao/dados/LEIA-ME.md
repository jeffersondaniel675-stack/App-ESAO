# Origem dos números dos slides 41 e 42

| Arquivo | O que é |
|---|---|
| `pipeline_predicao_cmp012.py` | O pipeline que você rodou. Curva ABC, features de defasagem, quatro modelos escritos em numpy, sem scikit-learn. |
| `resultados_metricas.csv` | MAE, RMSE e R² dos quatro modelos no teste de 2026. É o que está na tabela do slide 41. |
| `previsoes_2026.csv` | Previsão item a item. É de onde saem os cinco insumos do gráfico do slide 42. |

Recalculei MAE, RMSE e R² a partir de `previsoes_2026.csv` e bateram com
`resultados_metricas.csv` até a segunda casa. Os números do deck vêm dessa
verificação, não da leitura direta do CSV.

Números que aparecem nos slides e não estão nos CSV, todos derivados de
`previsoes_2026.csv`:

- **41 itens** no teste (as linhas do CSV).
- **157 unidades** de consumo médio por item em 2026; mediana 32, máximo 1.050.
- **27 dos 41 itens** em que a média histórica erra menos que a regressão linear.
- Os **cinco maiores** concentram 60% do consumo do período.
- O MAE de 113 equivale a **72% do consumo médio** por item.

O cabeçalho do próprio script diz que isto é demonstração ilustrativa e
preliminar, não o modelo final da dissertação. Os slides dizem o mesmo.

# Fontes acrescentadas em 08/09

| Arquivo | O que é | Onde aparece no deck |
|---|---|---|
| `EVTEA_BDOMPSA_v21.docx` | Estudo de viabilidade do B DOMPSA como Órgão Provedor, de 24/03/2026, revisado em 19/06/2026 | Slide 27, "O batalhão já se move" |
| `insumos_2022_2026.xlsx` | Planilha de insumos aeroterrestres, cinco exercícios anuais | Base do piloto de predição do slide 29 |

Números do EVTEA usados no deck: 12 portais RFID fixos, 14 leitores portáteis,
9.900 etiquetas, faseamento 2026-2030, MVP no RZ-21 e as 29.345 dobragens anuais
(mediana 2022-2026 da Bda Inf Pqdt, do COPESP e da 3ª Cia Fesp).

Ficaram **fora** do deck, de propósito: valores em reais, nomes e contatos da
equipe do estudo.

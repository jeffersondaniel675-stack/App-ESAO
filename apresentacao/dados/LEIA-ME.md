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

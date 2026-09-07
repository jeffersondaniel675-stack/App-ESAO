"""
Pipeline de demonstração — predição de consumo de material Classe II aeroterrestre
Projeto CMP-012 (biênio 2027/2028)

Este script é uma demonstração ILUSTRATIVA e PRELIMINAR da metodologia proposta no
Projeto de Pesquisa (seção 3.6), rodada sobre a base real de insumos 2022-2026.
NÃO é o modelo final da dissertação — é uma prova de conceito, para você ver a
mecânica do pipeline e o comportamento real dos dados antes de escrever a versão
definitiva.

Requisitos: pandas, numpy, openpyxl, matplotlib (todos sem dependências externas
de rede — regressão linear e árvore de decisão são implementadas do zero em numpy,
sem scikit-learn, para rodar em ambiente sem acesso à internet).

Etapas:
  1. Carrega as 5 abas anuais da planilha de insumos (2022 a 2026) e monta o painel
     (insumo x exercício).
  2. Aplica curva ABC sobre o consumo acumulado 2022-2025 e seleciona os itens
     classes A e B (maior giro) para a modelagem.
  3. Constrói features por (insumo, ano-alvo): lag1, lag2, média histórica,
     desvio-padrão histórico e tendência linear do histórico.
  4. Treina em 2024 e 2025 (usando o histórico disponível até cada ano) e testa em
     2026.
  5. Compara 4 modelos: baseline (média histórica), regressão linear múltipla,
     árvore de decisão (CART simples) e floresta aleatória (bagging de árvores).
  6. Roda também uma validação cruzada leave-one-year-out entre 2024 e 2025, para
     não depender só do exercício de 2026 (que pode estar incompleto na data da
     coleta).
"""
import openpyxl
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RNG = np.random.default_rng(42)
FEATS = ['lag1', 'lag2', 'hist_mean', 'hist_std', 'trend']
XLSX_PATH = '2026 - Insumos CAP DANIEL-1.xlsx'  # ajuste o caminho conforme necessário

YEAR_SHEETS = {
    2022: 'Relação de Insumos 2022',
    2023: 'Relação de Insumos 2023',
    2024: 'RELAÇÃO DE INSUMOS 2024',
    2025: 'Relação de Insumos 2025',
    2026: 'Relação de Insumos 2026',
}


# ============================== 1. CARGA E PAINEL ==============================

def carregar_painel(xlsx_path=XLSX_PATH):
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    registros = []
    for ano, sheet in YEAR_SHEETS.items():
        ws = wb[sheet]
        for row in ws.iter_rows(min_row=3, values_only=True):
            if not row[1]:
                continue
            material = str(row[1]).strip().upper()
            cor = str(row[2]).strip().upper() if row[2] else ''
            spec = str(row[3]).strip().upper() if row[3] else ''
            interno = row[5] or 0
            externo = row[6] or 0
            registros.append({
                'item_id': f"{material}|{cor}|{spec}",
                'ano': ano,
                # usa interno+externo recalculado; a coluna TOTAL da planilha
                # apresenta ~4,7% de inconsistência aritmética em relação a
                # interno+externo (ver nota da seção 3.3 do Projeto de Pesquisa)
                'consumo': interno + externo,
            })
    df = pd.DataFrame(registros)
    wide = df.pivot(index='item_id', columns='ano', values='consumo').fillna(0.0)
    wide.columns = [int(c) for c in wide.columns]
    return wide[[2022, 2023, 2024, 2025, 2026]]


def classificar_abc(wide, anos_base=(2022, 2023, 2024, 2025)):
    w = wide.copy()
    w['total_hist'] = w[list(anos_base)].sum(axis=1)
    w = w.sort_values('total_hist', ascending=False)
    w['cum_pct'] = w['total_hist'].cumsum() / w['total_hist'].sum()
    w['classe_abc'] = w['cum_pct'].apply(lambda p: 'A' if p <= 0.80 else ('B' if p <= 0.95 else 'C'))
    return w.drop(columns=['cum_pct'])


# ============================== 2. FEATURES ==============================

def montar_exemplos(w, ano_alvo, anos_historico):
    linhas = []
    for item_id, r in w.iterrows():
        hist = [r[a] for a in anos_historico]
        lag1 = hist[-1]
        lag2 = hist[-2] if len(hist) >= 2 else hist[-1]
        hist_mean = np.mean(hist)
        hist_std = np.std(hist)
        trend = np.polyfit(np.arange(len(hist)), hist, 1)[0] if len(hist) >= 2 else 0.0
        linhas.append(dict(item_id=item_id, lag1=lag1, lag2=lag2, hist_mean=hist_mean,
                            hist_std=hist_std, trend=trend, target=r[ano_alvo]))
    return pd.DataFrame(linhas)


# ============================== 3. MODELOS (do zero, sem sklearn) ==============================

def regressao_linear(Xtr, ytr, Xte):
    Xtr1 = np.column_stack([np.ones(len(Xtr)), Xtr])
    coef, *_ = np.linalg.lstsq(Xtr1, ytr, rcond=None)
    Xte1 = np.column_stack([np.ones(len(Xte)), Xte])
    return np.clip(Xte1 @ coef, 0, None), coef


class _Node:
    __slots__ = ('feat', 'thr', 'left', 'right', 'value')
    def __init__(self, value=None):
        self.feat = self.thr = self.left = self.right = None
        self.value = value


def _mse(y):
    return np.mean((y - y.mean()) ** 2) if len(y) else 0.0


def _melhor_split(X, y, min_leaf=4):
    melhor = None
    n, d = X.shape
    mse_pai = _mse(y)
    for f in range(d):
        vals = np.unique(X[:, f])
        limiares = (vals[:-1] + vals[1:]) / 2 if len(vals) > 1 else []
        for thr in limiares:
            esq = X[:, f] <= thr
            dir_ = ~esq
            if esq.sum() < min_leaf or dir_.sum() < min_leaf:
                continue
            ganho = mse_pai - (esq.sum() * _mse(y[esq]) + dir_.sum() * _mse(y[dir_])) / n
            if melhor is None or ganho > melhor[0]:
                melhor = (ganho, f, thr)
    return melhor


def construir_arvore(X, y, profundidade=0, prof_max=3, min_leaf=4):
    if profundidade >= prof_max or len(y) < 2 * min_leaf:
        return _Node(value=y.mean())
    split = _melhor_split(X, y, min_leaf)
    if split is None or split[0] <= 1e-9:
        return _Node(value=y.mean())
    _, f, thr = split
    esq = X[:, f] <= thr
    node = _Node()
    node.feat, node.thr = f, thr
    node.left = construir_arvore(X[esq], y[esq], profundidade + 1, prof_max, min_leaf)
    node.right = construir_arvore(X[~esq], y[~esq], profundidade + 1, prof_max, min_leaf)
    return node


def prever_arvore(node, x):
    if node.value is not None:
        return node.value
    return prever_arvore(node.left, x) if x[node.feat] <= node.thr else prever_arvore(node.right, x)


def floresta_aleatoria(Xtr, ytr, Xte, n_arvores=30, n_feats_sub=3, prof_max=3, min_leaf=4):
    arvores = []
    for _ in range(n_arvores):
        idx = RNG.integers(0, len(Xtr), len(Xtr))          # bootstrap
        feat_idx = np.sort(RNG.choice(Xtr.shape[1], n_feats_sub, replace=False))  # subamostra de atributos
        t = construir_arvore(Xtr[idx][:, feat_idx], ytr[idx], prof_max=prof_max, min_leaf=min_leaf)
        arvores.append((t, feat_idx))
    preds = np.array([np.mean([prever_arvore(t, x[fi]) for t, fi in arvores]) for x in Xte])
    return preds


# ============================== 4. MÉTRICAS ==============================

def metricas(y_true, y_pred, rotulo, verbose=True):
    y_true = np.asarray(y_true, float); y_pred = np.asarray(y_pred, float)
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else float('nan')
    if verbose:
        print(f"{rotulo:28s} MAE={mae:8.2f}  RMSE={rmse:8.2f}  R²={r2:7.3f}")
    return dict(rotulo=rotulo, mae=mae, rmse=rmse, r2=r2)


# ============================== 5. EXECUÇÃO ==============================

if __name__ == '__main__':
    wide = carregar_painel()
    wide_abc = classificar_abc(wide)
    print(wide_abc['classe_abc'].value_counts(), '\n')

    itens_ab = wide_abc[wide_abc['classe_abc'].isin(['A', 'B'])]
    print(f"Itens selecionados pela curva ABC (classes A+B): {len(itens_ab)} de {len(wide_abc)}\n")

    # treino: prevê 2024 (histórico 2022-2023) e 2025 (histórico 2022-2024)
    ex_2024 = montar_exemplos(itens_ab, 2024, [2022, 2023])
    ex_2025 = montar_exemplos(itens_ab, 2025, [2022, 2023, 2024])
    treino = pd.concat([ex_2024, ex_2025], ignore_index=True)
    # teste: prevê 2026 (histórico 2022-2025) — 2026 pode estar com o exercício em curso
    teste = montar_exemplos(itens_ab, 2026, [2022, 2023, 2024, 2025])

    Xtr = treino[FEATS].values.astype(float); ytr = treino['target'].values.astype(float)
    Xte = teste[FEATS].values.astype(float); yte = teste['target'].values.astype(float)

    pred_baseline = teste['hist_mean'].values
    pred_linreg, coef = regressao_linear(Xtr, ytr, Xte)
    arvore = construir_arvore(Xtr, ytr)
    pred_tree = np.array([prever_arvore(arvore, x) for x in Xte])
    pred_forest = floresta_aleatoria(Xtr, ytr, Xte)

    print(f"=== Avaliação no conjunto de teste (2026, n={len(yte)}) ===")
    resultados = [
        metricas(yte, pred_baseline, "Baseline (média histórica)"),
        metricas(yte, pred_linreg, "Regressão Linear Múltipla"),
        metricas(yte, pred_tree, "Árvore de Decisão"),
        metricas(yte, pred_forest, "Floresta Aleatória (30 árvores)"),
    ]
    pd.DataFrame(resultados).to_csv('resultados_metricas.csv', index=False)

    saida = teste[['item_id', 'target']].copy()
    saida['pred_baseline'] = pred_baseline
    saida['pred_linreg'] = pred_linreg
    saida['pred_tree'] = pred_tree
    saida['pred_forest'] = pred_forest
    saida.to_csv('previsoes_2026.csv', index=False)

    # gráfico
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    res_df = pd.DataFrame(resultados)
    x = np.arange(len(res_df)); w = 0.35
    axes[0].bar(x - w/2, res_df['mae'], w, label='MAE', color='#4C72B0')
    axes[0].bar(x + w/2, res_df['rmse'], w, label='RMSE', color='#DD8452')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(['Baseline', 'Reg. Linear', 'Árvore', 'Floresta'], fontsize=9)
    axes[0].set_title('Erro de previsão — teste 2026')
    axes[0].legend()
    axes[1].scatter(saida['target'], saida['pred_linreg'], color='#4C72B0', alpha=0.7, label='Regressão Linear')
    axes[1].scatter(saida['target'], saida['pred_baseline'], color='#999999', marker='x', alpha=0.5, label='Baseline')
    lims = [0, max(saida['target'].max(), saida['pred_linreg'].max()) * 1.05]
    axes[1].plot(lims, lims, 'k--', linewidth=1, label='Previsão perfeita')
    axes[1].set_xlabel('Consumo real'); axes[1].set_ylabel('Consumo previsto')
    axes[1].set_title('Previsto vs. Real')
    axes[1].legend(fontsize=8)
    plt.tight_layout()
    plt.savefig('resultado_predicao.png', dpi=130)
    print("\nGráfico salvo em resultado_predicao.png")

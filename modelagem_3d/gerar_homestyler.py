"""Gera a modelagem 3D da cozinha nos formatos aceitos pelo Homestyler.

Somente biblioteca padrao do Python (3.9+). Execute:

    python3 gerar_homestyler.py

Saidas em ./saida:
    cozinha_homestyler.zip        OBJ + MTL (portas fechadas)  <- upload no Homestyler
    cozinha_homestyler.glb        glTF binario (portas fechadas)
    cozinha_sem_portas.zip/.glb   mesmo movel com as frentes removidas
    previa.svg                    conferencia visual rapida
    pecas_modelo.json             lista de paineis (nome, posicao, tamanho, material)

Sistema de coordenadas de entrada (o mesmo do gerar_modelo.py original):
    X = largura, Y = profundidade (parede em Y=0, frente em Y negativo), Z = altura.
Na exportacao tudo e convertido para Y-up (x, z, -y), que e o eixo usado por
glTF/GLB e o esperado pelo Homestyler ao importar OBJ.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SAIDA = RAIZ / "saida"

ESPESSURA = 0.015  # 15 mm de MDF
CORES = {
    "madeira": (0.65, 0.44, 0.27),
    "frentes_madeira": (0.73, 0.55, 0.36),
    "off_white": (0.79, 0.78, 0.72),
    "fundo": (0.57, 0.37, 0.22),
}
UNIDADES = {"m": 1.0, "cm": 100.0, "mm": 1000.0}


# --------------------------------------------------------------------------- #
# Montagem parametrica do movel (medidas em metros)
# --------------------------------------------------------------------------- #
def montar_pecas() -> list[dict]:
    pecas: list[dict] = []

    def box(name, x, y, z, w, d, h, mat="madeira", front=False):
        assert min(w, d, h) > 0, name
        pecas.append({"name": name, "p": [x, y, z], "s": [w, d, h], "mat": mat, "front": front})

    t = ESPESSURA
    # Rodape / base de 15 cm. Profundidade estrutural dos balcoes e torre: 49 cm.
    box("Rodape_frontal", 0, -0.49, 0, 2.7, t, 0.15, "frentes_madeira")
    box("Rodape_esquerdo", 0, -0.49, 0, t, 0.49, 0.15)
    box("Rodape_direito", 2.685, -0.49, 0, t, 0.49, 0.15)
    for x in (0.685, 1.885):
        box("Apoio_rodape_" + str(x), x, -0.47, 0, t, 0.45, 0.15)

    # Tres modulos baixos. Tampo chega a 94,5 cm.
    for label, x, w in (("Torre", 0, 0.7), ("Balcao_120", 0.7, 1.2), ("Balcao_80", 1.9, 0.8)):
        box(label + "_lateral_E", x, -0.49, 0.15, t, 0.49, 0.77)
        box(label + "_lateral_D", x + w - t, -0.49, 0.15, t, 0.49, 0.77)
        box(label + "_base", x + t, -0.49, 0.15, w - 2 * t, 0.49, t)
        box(label + "_fundo", x + t, -0.006, 0.165, w - 2 * t, 0.006, 0.755, "fundo")
        if label != "Torre":
            box(label + "_travessa_frontal", x + t, -0.49, 0.89, w - 2 * t, 0.045, 0.03)
            box(label + "_travessa_traseira", x + t, -0.07, 0.89, w - 2 * t, 0.07, 0.03)

    box("Torre_prateleira_nicho", 0.015, -0.49, 0.525, 0.67, 0.49, t)
    box("Torre_tampo_25mm", 0, -0.52, 0.92, 0.7, 0.52, 0.025, "frentes_madeira")
    box("Balcao_80_tampo_25mm", 1.9, -0.52, 0.92, 0.8, 0.52, 0.025, "frentes_madeira")
    # Vao de bancada no modulo central (sem cuba inclusa).
    box("Balcao_120_regua_traseira", 0.7, -0.09, 0.92, 1.2, 0.09, 0.025, "frentes_madeira")
    box("Balcao_80_espelho", 1.9, -0.018, 0.945, 0.8, 0.018, 0.075, "frentes_madeira")
    box("Balcao_120_divisoria_gavetas", 1.085, -0.49, 0.165, t, 0.49, 0.725)
    box("Balcao_120_prateleira", 1.1, -0.47, 0.51, 0.785, 0.464, t)
    box("Balcao_80_prateleira", 1.915, -0.47, 0.51, 0.77, 0.464, t)

    # Caixas de gaveta, com frentes independentes.
    def gaveta(name, x, z, w, h):
        box(name + "_base", x, -0.465, z, w, 0.43, 0.012)
        box(name + "_lateral_E", x, -0.465, z, 0.012, 0.43, h)
        box(name + "_lateral_D", x + w - 0.012, -0.465, z, 0.012, 0.43, h)
        box(name + "_fundo", x, -0.047, z, w, 0.012, h)
        box(name + "_frente_interna", x, -0.465, z, w, 0.012, h)

    gaveta("Gavetao_torre", 0.035, 0.19, 0.63, 0.25)
    gaveta("Gaveta_1", 0.73, 0.727, 0.325, 0.13)
    gaveta("Gaveta_2", 0.73, 0.537, 0.325, 0.13)

    # Torre acima do tampo: 125,5 cm, duas prateleiras internas.
    for x in (0, 0.685):
        box("Torre_alta_lateral_" + str(x), x, -0.49, 0.945, t, 0.49, 1.255)
    box("Torre_alta_fundo", 0.015, -0.006, 0.945, 0.67, 0.006, 1.24, "fundo")
    box("Torre_alta_topo", 0.015, -0.49, 2.185, 0.67, 0.49, t)
    for z in (1.36, 1.775):
        box("Torre_alta_prateleira_" + str(z), 0.015, -0.49, z, 0.67, 0.49, t)

    # Aereos, altura total 74 cm: faixa superior de 46 cm e inferior de 29 cm.
    for label, x, w in (("Aereo_120", 0.7, 1.2), ("Aereo_80", 1.9, 0.8)):
        for side in (x, x + w - t):
            box(label + "_lateral_sup_" + str(side), side, -0.46, 1.83, t, 0.46, 0.37)
            box(label + "_lateral_inf_" + str(side), side, -0.29, 1.46, t, 0.29, 0.37)
        box(label + "_topo", x + t, -0.46, 2.185, w - 2 * t, 0.46, t)
        box(label + "_base_sup", x + t, -0.46, 1.83, w - 2 * t, 0.46, t)
        box(label + "_base_inf", x + t, -0.29, 1.46, w - 2 * t, 0.29, t)
        box(label + "_fundo", x + t, -0.006, 1.475, w - 2 * t, 0.006, 0.71, "fundo")
        for div in ([x + 0.4, x + 0.8] if w > 1 else [x + 0.4]):
            box(label + "_divisoria_sup_" + str(div), div - t / 2, -0.46, 1.845, t, 0.454, 0.34)
            box(label + "_divisoria_inf_" + str(div), div - t / 2, -0.29, 1.475, t, 0.284, 0.355)

    # Fachadas com folga de 3-4 mm e espessura de 15 mm.
    box("Frente_gavetao_torre", 0.003, -0.505, 0.154, 0.694, 0.015, 0.367, "frentes_madeira", True)
    for i in range(2):
        box("Porta_torre_" + str(i + 1), 0.003 + i * 0.35, -0.505, 1.378, 0.344, 0.015, 0.819, "off_white", True)
    for label, x, w in (("120", 0.7, 1.2), ("80", 1.9, 0.8)):
        box("Porta_aereo_superior_" + label, x + 0.002, -0.475, 1.833, w - 0.004, 0.015, 0.364, "off_white", True)
        box("Porta_aereo_inferior_" + label, x + 0.002, -0.305, 1.463, w - 0.004, 0.015, 0.364, "frentes_madeira", True)
    box("Frente_gaveta_1", 0.704, -0.505, 0.732, 0.379, 0.015, 0.184, "frentes_madeira", True)
    box("Frente_gaveta_2", 0.704, -0.505, 0.542, 0.379, 0.015, 0.184, "frentes_madeira", True)
    box("Porta_sob_gavetas", 0.704, -0.505, 0.154, 0.379, 0.015, 0.382, "frentes_madeira", True)
    for name, x, w in (("central_E", 1.103, 0.389), ("central_D", 1.498, 0.389),
                       ("direita_E", 1.904, 0.394), ("direita_D", 2.304, 0.393)):
        box("Porta_balcao_" + name, x, -0.505, 0.154, w, 0.015, 0.762, "frentes_madeira", True)

    return pecas


# --------------------------------------------------------------------------- #
# Geometria: caixa -> quads com normal e UV
# --------------------------------------------------------------------------- #
# Quads em ordem anti-horaria vista de fora (winding correto para o Homestyler).
QUADS = ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (3, 7, 6, 2), (0, 4, 7, 3), (1, 2, 6, 5))
NORMAIS = ((0, 0, -1), (0, 0, 1), (0, -1, 0), (0, 1, 0), (-1, 0, 0), (1, 0, 0))
# Par de eixos do mundo usado como UV de cada face (0=X, 1=Y, 2=Z).
UV_EIXOS = ((0, 1), (0, 1), (0, 2), (0, 2), (1, 2), (1, 2))


def cantos(peca: dict) -> list[tuple[float, float, float]]:
    x, y, z = peca["p"]
    w, d, h = peca["s"]
    return [(x, y, z), (x + w, y, z), (x + w, y + d, z), (x, y + d, z),
            (x, y, z + h), (x + w, y, z + h), (x + w, y + d, z + h), (x, y + d, z + h)]


def y_up(v, escala=1.0):
    """Converte Z-up (modelo) para Y-up (glTF/OBJ) aplicando a escala."""
    x, y, z = v
    return (x * escala, z * escala, -y * escala)


def faces(peca: dict):
    """Gera (4 vertices do quad, normal, 4 UVs) para cada uma das 6 faces."""
    v = cantos(peca)
    for quad, normal, eixos in zip(QUADS, NORMAIS, UV_EIXOS):
        pontos = [v[i] for i in quad]
        uvs = [(p[eixos[0]], p[eixos[1]]) for p in pontos]
        yield pontos, normal, uvs


# --------------------------------------------------------------------------- #
# OBJ + MTL
# --------------------------------------------------------------------------- #
def escrever_mtl(caminho: Path) -> None:
    linhas = ["# Materiais da cozinha modular 270 x 220 cm", ""]
    for nome, (r, g, b) in CORES.items():
        linhas += [
            "newmtl " + nome,
            "Ka {:.4f} {:.4f} {:.4f}".format(r * 0.3, g * 0.3, b * 0.3),
            "Kd {:.4f} {:.4f} {:.4f}".format(r, g, b),
            "Ks 0.0600 0.0600 0.0600",
            "Ns 24.0",
            "d 1.0",
            "illum 2",
            "",
        ]
    caminho.write_text("\n".join(linhas), encoding="utf-8")


def escrever_obj(caminho: Path, pecas: list[dict], escala: float, unidade: str) -> None:
    out = [
        "# Cozinha modular 270 x 220 cm - {} paineis".format(len(pecas)),
        "# Unidade: 1 = 1 {} | eixo vertical: Y".format(unidade),
        "mtllib " + caminho.with_suffix(".mtl").name,
        "",
    ]
    nv = nvt = nvn = 0
    for peca in pecas:
        out.append("g " + peca["name"])
        out.append("usemtl " + peca["mat"])
        base_v = nv + 1
        v = cantos(peca)
        for c in v:
            x, y, z = y_up(c, escala)
            out.append("v {:.5f} {:.5f} {:.5f}".format(x, y, z))
        nv += 8
        for (quad, normal, eixos) in zip(QUADS, NORMAIS, UV_EIXOS):
            nx, ny, nz = y_up(normal)
            out.append("vn {:.4f} {:.4f} {:.4f}".format(nx, ny, nz))
            nvn += 1
            uv_ids = []
            for i in quad:
                canto = v[i]
                out.append("vt {:.4f} {:.4f}".format(canto[eixos[0]], canto[eixos[1]]))
                nvt += 1
                uv_ids.append(nvt)
            refs = ["{}/{}/{}".format(base_v + i, uv_ids[k], nvn) for k, i in enumerate(quad)]
            out.append("f " + " ".join(refs))
        out.append("")
    caminho.write_text("\n".join(out), encoding="utf-8")


def zipar(destino: Path, arquivos: list[Path]) -> None:
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for a in arquivos:
            z.write(a, a.name)


# --------------------------------------------------------------------------- #
# GLB (glTF 2.0 binario, unidade fixa em metros pela especificacao)
# --------------------------------------------------------------------------- #
def escrever_glb(caminho: Path, pecas: list[dict], nome: str) -> None:
    buffers: dict[str, dict] = {}
    for peca in pecas:
        acc = buffers.setdefault(peca["mat"], {"pos": [], "nor": [], "uv": [], "idx": []})
        for pontos, normal, uvs in faces(peca):
            base = len(acc["pos"]) // 3
            n = y_up(normal)
            for p, uv in zip(pontos, uvs):
                acc["pos"].extend(y_up(p))
                acc["nor"].extend(n)
                acc["uv"].extend((uv[0], -uv[1]))
            acc["idx"].extend((base, base + 1, base + 2, base, base + 2, base + 3))

    bin_blob = bytearray()
    views, accessors, primitivas, materiais = [], [], [], []

    def add_view(dados: bytes, target: int) -> int:
        while len(bin_blob) % 4:
            bin_blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(bin_blob), "byteLength": len(dados), "target": target})
        bin_blob.extend(dados)
        return len(views) - 1

    def add_accessor(view: int, tipo: str, comp: int, count: int, extras=None) -> int:
        acc = {"bufferView": view, "componentType": comp, "count": count, "type": tipo}
        if extras:
            acc.update(extras)
        accessors.append(acc)
        return len(accessors) - 1

    for mat_idx, (mat, acc) in enumerate(buffers.items()):
        r, g, b = CORES[mat]
        materiais.append({
            "name": mat,
            "doubleSided": True,
            "pbrMetallicRoughness": {
                "baseColorFactor": [r, g, b, 1.0],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.65,
            },
        })
        pos = acc["pos"]
        conta = len(pos) // 3
        mn = [min(pos[i::3]) for i in range(3)]
        mx = [max(pos[i::3]) for i in range(3)]
        a_pos = add_accessor(add_view(struct.pack("<%df" % len(pos), *pos), 34962),
                             "VEC3", 5126, conta, {"min": mn, "max": mx})
        a_nor = add_accessor(add_view(struct.pack("<%df" % len(acc["nor"]), *acc["nor"]), 34962),
                             "VEC3", 5126, conta)
        a_uv = add_accessor(add_view(struct.pack("<%df" % len(acc["uv"]), *acc["uv"]), 34962),
                            "VEC2", 5126, conta)
        a_idx = add_accessor(add_view(struct.pack("<%dI" % len(acc["idx"]), *acc["idx"]), 34963),
                             "SCALAR", 5125, len(acc["idx"]))
        primitivas.append({
            "attributes": {"POSITION": a_pos, "NORMAL": a_nor, "TEXCOORD_0": a_uv},
            "indices": a_idx,
            "material": mat_idx,
            "mode": 4,
        })

    gltf = {
        "asset": {"version": "2.0", "generator": "App-ESAO modelagem_3d/gerar_homestyler.py"},
        "scene": 0,
        "scenes": [{"name": nome, "nodes": [0]}],
        "nodes": [{"name": nome, "mesh": 0}],
        "meshes": [{"name": nome, "primitives": primitivas}],
        "materials": materiais,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(bin_blob)}],
    }

    json_chunk = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_chunk += b" " * ((4 - len(json_chunk) % 4) % 4)
    bin_chunk = bytes(bin_blob) + b"\x00" * ((4 - len(bin_blob) % 4) % 4)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    with caminho.open("wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(json_chunk), b"JSON"))
        f.write(json_chunk)
        f.write(struct.pack("<I4s", len(bin_chunk), b"BIN\x00"))
        f.write(bin_chunk)


# --------------------------------------------------------------------------- #
# Previa SVG (algoritmo do pintor, sem dependencias)
# --------------------------------------------------------------------------- #
def _norm(v):
    m = math.sqrt(sum(c * c for c in v))
    return tuple(c / m for c in v)


def _cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def painel_svg(pecas: list[dict], largura: int, altura: int, titulo: str) -> str:
    cam = _norm((-0.26, -1.0, 0.23))
    direita = _norm(_cross((0, 0, 1), cam))
    cima = _cross(cam, direita)
    luz = _norm((-0.3, -0.6, 0.75))
    centro = (1.35, -0.25, 1.1)
    escala = 310 * (largura / 1000)

    quads = []
    for peca in pecas:
        for pontos, normal, _ in faces(peca):
            if _dot(normal, cam) <= 0:
                continue
            sombra = 0.72 + 0.28 * max(0.0, _dot(normal, luz))
            r, g, b = (min(255, int(c * 255 * sombra)) for c in CORES[peca["mat"]])
            rel = [tuple(p[i] - centro[i] for i in range(3)) for p in pontos]
            tela = [(_dot(p, direita) * escala + largura / 2, altura / 2 - _dot(p, cima) * escala) for p in rel]
            prof = sum(_dot(p, cam) for p in rel) / 4
            quads.append((prof, tela, "#{:02x}{:02x}{:02x}".format(r, g, b)))

    quads.sort(key=lambda q: q[0])  # mais distante primeiro
    partes = ['<rect width="{}" height="{}" fill="#f5f3ef"/>'.format(largura, altura)]
    for _, tela, cor in quads:
        pts = " ".join("{:.1f},{:.1f}".format(x, y) for x, y in tela)
        partes.append('<polygon points="{}" fill="{}" stroke="#39302620" stroke-width="0.6"/>'.format(pts, cor))
    partes.append('<text x="{}" y="{}" text-anchor="middle" font-family="DejaVu Sans,Arial" '
                  'font-size="22" fill="#4b4134">{}</text>'.format(largura / 2, 34, titulo))
    return "".join(partes)


def escrever_svg(caminho: Path, pecas: list[dict]) -> None:
    l, a = 1000, 1000
    corpo = (
        '<g transform="translate(0,80)">{}</g>'.format(painel_svg(pecas, l, a, "PORTAS FECHADAS"))
        + '<g transform="translate(1000,80)">{}</g>'.format(
            painel_svg([p for p in pecas if not p["front"]], l, a, "DIVISOES INTERNAS"))
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1140" viewBox="0 0 2000 1140">'
        '<rect width="2000" height="1140" fill="#f5f3ef"/>'
        '<text x="1000" y="56" text-anchor="middle" font-family="DejaVu Sans,Arial" font-size="34" '
        'fill="#43392d">COZINHA MODULAR | 270 x 220 cm</text>'
        + corpo +
        '<text x="1000" y="1105" text-anchor="middle" font-family="DejaVu Sans,Arial" font-size="20" '
        'fill="#6e6255">Profundidade do tampo: 52 cm - Modulos: 70 + 120 + 80 cm - '
        'medidas internas nao cotadas sao estimadas</text></svg>'
    )
    caminho.write_text(svg, encoding="utf-8")


# --------------------------------------------------------------------------- #
# Conferencia das saidas
# --------------------------------------------------------------------------- #
def conferir_obj(caminho: Path, pecas: list[dict], escala: float) -> dict:
    vs, fs, mats = [], 0, set()
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        if linha.startswith("v "):
            vs.append([float(c) for c in linha.split()[1:4]])
        elif linha.startswith("f "):
            fs += 1
        elif linha.startswith("usemtl "):
            mats.add(linha.split()[1])
    assert len(vs) == 8 * len(pecas), (len(vs), len(pecas))
    assert fs == 6 * len(pecas), fs
    assert mats <= set(CORES), mats
    dim = [round(max(v[i] for v in vs) - min(v[i] for v in vs), 4) for i in range(3)]
    esperado = [round(2.7 * escala, 4), round(2.2 * escala, 4), round(0.52 * escala, 4)]
    assert dim == esperado, (dim, esperado)
    return {"vertices": len(vs), "faces": fs, "dimensoes": dim}


def conferir_glb(caminho: Path) -> dict:
    dados = caminho.read_bytes()
    magic, versao, total = struct.unpack("<4sII", dados[:12])
    assert magic == b"glTF" and versao == 2 and total == len(dados)
    tam, tipo = struct.unpack("<I4s", dados[12:20])
    assert tipo == b"JSON"
    gltf = json.loads(dados[20:20 + tam])
    tam_bin, tipo_bin = struct.unpack("<I4s", dados[20 + tam:28 + tam])
    assert tipo_bin == b"BIN\x00"
    assert gltf["buffers"][0]["byteLength"] <= tam_bin
    for v in gltf["bufferViews"]:
        assert v["byteOffset"] % 4 == 0 and v["byteOffset"] + v["byteLength"] <= tam_bin
    pos = [a for a in gltf["accessors"] if "min" in a]
    mn = [min(a["min"][i] for a in pos) for i in range(3)]
    mx = [max(a["max"][i] for a in pos) for i in range(3)]
    dim = [round(mx[i] - mn[i], 4) for i in range(3)]
    assert dim == [2.7, 2.2, 0.52], dim
    tri = sum(gltf["accessors"][p["indices"]]["count"] for m in gltf["meshes"] for p in m["primitives"]) // 3
    return {"triangulos": tri, "materiais": len(gltf["materials"]), "dimensoes_m": dim, "bytes": len(dados)}


# --------------------------------------------------------------------------- #
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--unidade", choices=sorted(UNIDADES), default="cm",
                    help="unidade do OBJ (o GLB e sempre em metros). Padrao: cm")
    args = ap.parse_args()
    escala = UNIDADES[args.unidade]

    SAIDA.mkdir(exist_ok=True)
    pecas = montar_pecas()
    sem_portas = [p for p in pecas if not p["front"]]
    relatorio = {"paineis": len(pecas), "paineis_sem_frentes": len(sem_portas), "unidade_obj": args.unidade}

    escrever_mtl(SAIDA / "cozinha_homestyler.mtl")
    escrever_mtl(SAIDA / "cozinha_sem_portas.mtl")
    for nome, selecao in (("cozinha_homestyler", pecas), ("cozinha_sem_portas", sem_portas)):
        obj = SAIDA / (nome + ".obj")
        escrever_obj(obj, selecao, escala, args.unidade)
        zipar(SAIDA / (nome + ".zip"), [obj, SAIDA / (nome + ".mtl")])
        escrever_glb(SAIDA / (nome + ".glb"), selecao, "Cozinha 270 x 220 cm")
        relatorio[nome] = {
            "obj": conferir_obj(obj, selecao, escala),
            "glb": conferir_glb(SAIDA / (nome + ".glb")),
            "zip_bytes": (SAIDA / (nome + ".zip")).stat().st_size,
        }

    escrever_svg(SAIDA / "previa.svg", pecas)
    (SAIDA / "pecas_modelo.json").write_text(json.dumps(pecas, indent=2, ensure_ascii=False), encoding="utf-8")
    (RAIZ / "pecas_modelo.json").write_text(json.dumps(pecas, indent=2, ensure_ascii=False), encoding="utf-8")
    relatorio["validacao"] = "OBJ e GLB reabertos: contagem, winding, bounding box e alinhamento OK"
    print(json.dumps(relatorio, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

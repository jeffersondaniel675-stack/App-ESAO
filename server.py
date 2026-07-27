import os
import json
import re
import math
import string
import random
import datetime
import unicodedata
from flask import Flask, request, jsonify, send_from_directory, make_response

app = Flask(__name__, static_folder="dist", static_url_path="")
PORT = 3000

DB_PATH = os.path.join(os.getcwd(), "data", "db.json")
DB_BAK_PATH = os.path.join(os.getcwd(), "data", "db.json.bak")
DB_TMP_BAK_PATH = "/tmp/db_persistent_backup.json"

cached_db = None

def normalize_name_of_war(name: str) -> str:
    if not name:
        return ""
    normalized = unicodedata.normalize("NFD", name)
    cleaned = "".join(c for c in normalized if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", cleaned.upper().strip())

def get_students_with_grades_count(students_list) -> int:
    if not students_list or not isinstance(students_list, list):
        return 0
    return sum(1 for s in students_list if s.get("notas") is not None)

def read_db():
    global cached_db
    if cached_db is not None:
        return cached_db

    parsed_main = None
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r", encoding="utf-8") as f:
                parsed_main = json.load(f)
        except Exception as e:
            print("Error reading main db.json:", e)

    parsed_tmp = None
    if os.path.exists(DB_TMP_BAK_PATH):
        try:
            with open(DB_TMP_BAK_PATH, "r", encoding="utf-8") as f:
                parsed_tmp = json.load(f)
        except Exception as e:
            print("Error reading tmp backup:", e)

    parsed_bak = None
    if os.path.exists(DB_BAK_PATH):
        try:
            with open(DB_BAK_PATH, "r", encoding="utf-8") as f:
                parsed_bak = json.load(f)
        except Exception as e:
            print("Error reading bak backup:", e)

    best_db = None
    source = ""

    if parsed_main and (isinstance(parsed_main.get("students"), list) or isinstance(parsed_main.get("users"), list)):
        best_db = parsed_main
        source = "main"
    else:
        candidates = [
            {"parsed": parsed_main, "src": "main"},
            {"parsed": parsed_tmp, "src": "tmp_backup"},
            {"parsed": parsed_bak, "src": "bak_backup"}
        ]
        for cand in candidates:
            p = cand["parsed"]
            if not p or (not p.get("students") and not p.get("users")):
                continue
            if not best_db:
                best_db = p
                source = cand["src"]
                continue

            cand_student_count = len(p.get("students", []))
            best_student_count = len(best_db.get("students", []))
            cand_grades = get_students_with_grades_count(p.get("students", []))
            best_grades = get_students_with_grades_count(best_db.get("students", []))

            if cand_grades > best_grades:
                best_db = p
                source = cand["src"]
            elif cand_grades == best_grades and cand_student_count > best_student_count:
                best_db = p
                source = cand["src"]

    if best_db and source != "main":
        print(f"[SAFEGUARD - PYTHON] Automatically restoring healthy database from {source}")
        try:
            os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
            with open(DB_PATH, "w", encoding="utf-8") as f:
                json.dump(best_db, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print("Failed to restore candidate to main path", e)

    if not best_db:
        print("[SAFEGUARD - PYTHON] No database files or backups were found. Creating default database...")
        best_db = {
            "settings": {
                "globalEditOpen": True,
                "adminPassword": "DOMPSA675",
                "modulesControl": {
                    "ac3": "aberto_lancamento",
                    "ac4": "fechado",
                    "ac5": "fechado",
                    "ac6": "fechado",
                    "idiomas": "fechado"
                },
                "milestoneMode": "por_modulo",
                "turmaName": "Intendência - ESAO 2026"
            },
            "sentMilestones": [],
            "milestonesLogs": [],
            "students": [],
            "users": [],
            "launches": [],
            "historicoSalvamento": []
        }

    # Ensure default structures exist
    if not best_db.get("settings"):
        best_db["settings"] = {
            "globalEditOpen": True,
            "adminPassword": "DOMPSA675",
            "milestoneMode": "por_modulo",
            "turmaName": "Intendência - ESAO 2026"
        }
    if not best_db["settings"].get("modulesControl"):
        best_db["settings"]["modulesControl"] = {
            "ac3": "aberto_lancamento",
            "ac4": "fechado",
            "ac5": "fechado",
            "ac6": "fechado",
            "idiomas": "fechado"
        }
    if not best_db["settings"].get("milestoneMode"):
        best_db["settings"]["milestoneMode"] = "por_modulo"
    if not best_db["settings"].get("turmaName"):
        best_db["settings"]["turmaName"] = "Intendência - ESAO 2026"
    if not best_db.get("whatsappLogs"):
        best_db["whatsappLogs"] = []
    if not best_db.get("historicoSalvamento"):
        best_db["historicoSalvamento"] = []

    # Enforce tables logic (users/launches <-> students sync)
    if not best_db.get("users") or not isinstance(best_db["users"], list) or len(best_db["users"]) == 0:
        best_db["users"] = []
        for s in best_db.get("students", []):
            best_db["users"].append({
                "user_id": str(s.get("id")),
                "nome_guerra": s.get("nomeDeGuerra", ""),
                "matricula": s.get("matricula", str(s.get("id"))),
                "senha_hash": s.get("senha", str(s.get("id"))),
                "tipo_acesso": "admin" if "DANIEL" in (s.get("nomeDeGuerra", "")).upper() else "aluno",
                "status": s.get("situacao", "ativo"),
                "whatsapp": s.get("telefone", ""),
                "nome_sigiloso": s.get("nomeSigiloso", ""),
                "primeiro_acesso": s.get("hasAccessed") is False,
                "acesso_ativado": s.get("acessoAtivado", False) or bool(s.get("nomeSigiloso"))
            })

    if not best_db.get("launches") or not isinstance(best_db["launches"], list) or len(best_db["launches"]) == 0:
        best_db["launches"] = []
        for s in best_db.get("students", []):
            best_db["launches"].append({
                "user_id": str(s.get("id")),
                "nome_sigiloso": s.get("nomeSigiloso", ""),
                "modulo": "todos",
                "notas": s.get("notas"),
                "medias": None,
                "nota_final_estimada": None,
                "classificacao": None,
                "quartil": None,
                "status_lancamento": s.get("statusLancamento", "não_iniciado"),
                "versao": s.get("versao", 1),
                "atualizado_em": s.get("atualizado_em", datetime.datetime.utcnow().isoformat() + "Z")
            })

    # Filter bots or test instances
    if isinstance(best_db.get("users"), list):
        clean_users = []
        for u in best_db["users"]:
            mat = str(u.get("matricula", u.get("user_id", ""))).strip()
            name_upper = str(u.get("nome_guerra", "")).upper().strip()
            norm_name = "".join(c for c in unicodedata.normalize("NFD", name_upper) if not unicodedata.combining(c))

            is_bot = (
                u.get("tipo_acesso") == "bot" or 
                u.get("isTest") is True or 
                u.get("teste") is True or
                "BOT" in name_upper or 
                "TESTE" in name_upper or 
                mat.startswith("2026") or
                any(n in norm_name for n in ["ARCA", "FERNANDEZ", "CAVALIER"])
            )
            if not is_bot:
                clean_users.append(u)
        best_db["users"] = clean_users

    if isinstance(best_db.get("launches"), list):
        best_db["launches"] = [
            l for l in best_db["launches"]
            if any(str(u.get("user_id")) == str(l.get("user_id")) for u in best_db["users"])
        ]

    # Map back to dual students array
    best_db["students"] = []
    for u in best_db["users"]:
        l = next((la for la in best_db["launches"] if str(la.get("user_id")) == str(u.get("user_id"))), None)
        if not l:
            l = {
                "notas": None,
                "status_lancamento": "não_iniciado",
                "versao": 1,
                "atualizado_em": datetime.datetime.utcnow().isoformat() + "Z"
            }
        best_db["students"].append({
            "id": str(u.get("user_id")),
            "nomeDeGuerra": u.get("nome_guerra"),
            "matricula": u.get("matricula"),
            "senha": u.get("senha_hash"),
            "situacao": u.get("status"),
            "telefone": u.get("whatsapp"),
            "nomeSigiloso": u.get("nome_sigiloso", ""),
            "hasAccessed": not u.get("primeiro_acesso", True),
            "acessoAtivado": u.get("acesso_ativado", False) or bool(u.get("nome_sigiloso")),
            "statusLancamento": l.get("status_lancamento"),
            "notas": l.get("notas"),
            "versao": l.get("versao", 1),
            "atualizado_em": l.get("atualizado_em"),
            "historico": []
        })

    # Write initial sync state to disk
    try:
        fresh_serialized = json.dumps(best_db, indent=2, ensure_ascii=False)
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(DB_PATH, "w", encoding="utf-8") as f:
            f.write(fresh_serialized)
        
        if len(best_db["students"]) > 0:
            with open(DB_BAK_PATH, "w", encoding="utf-8") as f:
                f.write(fresh_serialized)
            try:
                os.makedirs(os.path.dirname(DB_TMP_BAK_PATH), exist_ok=True)
                with open(DB_TMP_BAK_PATH, "w", encoding="utf-8") as f:
                    f.write(fresh_serialized)
            except:
                pass
    except Exception as err:
        print("Error maintaining backups on read_db() sync:", err)

    cached_db = best_db
    return best_db

def write_db(data):
    global cached_db
    try:
        if not data or not isinstance(data.get("students"), list):
            print("[SAFEGUARD] Refusing to write corrupt or invalid database schema.")
            return

        cached_db = data

        # Push back modifications from students array to users/launches
        data["users"] = []
        for s in data["students"]:
            data["users"].append({
                "user_id": str(s.get("id")),
                "nome_guerra": s.get("nomeDeGuerra"),
                "matricula": s.get("matricula"),
                "senha_hash": s.get("senha"),
                "tipo_acesso": "admin" if "DANIEL" in (s.get("nomeDeGuerra") or "").upper() else "aluno",
                "status": s.get("situacao"),
                "whatsapp": s.get("telefone", ""),
                "nome_sigiloso": s.get("nomeSigiloso", ""),
                "primeiro_acesso": not s.get("hasAccessed"),
                "acesso_ativado": s.get("acessoAtivado") or bool(s.get("nomeSigiloso"))
            })

        data["launches"] = []
        for s in data["students"]:
            data["launches"].append({
                "user_id": str(s.get("id")),
                "nome_sigiloso": s.get("nomeSigiloso", ""),
                "modulo": "todos",
                "notas": s.get("notas"),
                "medias": None,
                "nota_final_estimada": s.get("finalGrade"),
                "classificacao": s.get("rank"),
                "quartil": s.get("quartil"),
                "status_lancamento": s.get("statusLancamento", "não_iniciado"),
                "versao": s.get("versao", 1),
                "atualizado_em": s.get("atualizado_em") or datetime.datetime.utcnow().isoformat() + "Z"
            })

        serialized = json.dumps(data, indent=2, ensure_ascii=False)
        temp_path = DB_PATH + ".tmp"
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(serialized)
        
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
        os.rename(temp_path, DB_PATH)

        if len(data["students"]) > 0:
            with open(DB_BAK_PATH, "w", encoding="utf-8") as f:
                f.write(serialized)
            try:
                os.makedirs(os.path.dirname(DB_TMP_BAK_PATH), exist_ok=True)
                with open(DB_TMP_BAK_PATH, "w", encoding="utf-8") as f:
                    f.write(serialized)
            except:
                pass
    except Exception as e:
        print("Error writing db safely in Python:", e)

def add_history_log(db, user_id, nome_sigiloso, modulo, tipo_evento, dados_json, origem, versao):
    db["historicoSalvamento"] = db.get("historicoSalvamento") or []
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=9))
    log = {
        "id": "H" + random_str,
        "user_id": str(user_id),
        "nome_sigiloso": nome_sigiloso or "Não Definido",
        "módulo": modulo,
        "tipo_evento": tipo_evento,
        "dados_json": json.dumps(dados_json or {}),
        "data_hora": datetime.datetime.utcnow().isoformat() + "Z",
        "origem": origem,
        "versao": versao
    }
    db["historicoSalvamento"].append(log)

def validate_nome_sigiloso(nome_sigiloso, student, db_students):
    if not nome_sigiloso:
        return "Nome sigiloso não pode estar em branco."

    # normalize and clean
    normalized = unicodedata.normalize("NFD", nome_sigiloso)
    cleaned = "".join(c for c in normalized if not unicodedata.combining(c)).upper().strip()
    cleaned = re.sub(r"[^A-Z0-9]", "", cleaned)

    if len(cleaned) < 4 or len(cleaned) > 12:
        return "O nome sigiloso deve conter entre 4 e 12 caracteres."

    if cleaned == normalize_name_of_war(student.get("nomeDeGuerra", "")):
        return "O nome sigiloso não pode ser igual ao seu nome de guerra."

    for s in db_students:
        if str(s.get("id")) != str(student.get("id")) and s.get("nomeSigiloso"):
            s_clean = normalize_name_of_war(s["nomeSigiloso"])
            s_clean_norm = "".join(c for c in unicodedata.normalize("NFD", s_clean) if not unicodedata.combining(c))
            s_clean_norm = re.sub(r"[^A-Z0-9]", "", s_clean_norm.upper())
            if s_clean_norm == cleaned:
                return "Este nome sigiloso já está sendo utilizado por outro participante."

    offensive = ["CU", "FDP", "BOST", "MERD", "PORR", "PUTA", "CARALH", "PICA", "PENIS", "VAGIN"]
    for word in offensive:
        if word in cleaned:
            return "O nome sigiloso escolhido contém palavras reservadas ou impróprias."

    return None

def get_module_note(mod):
    if not mod or mod.get("aat") is None or mod.get("ac") is None:
        return None
    try:
        aat_val = float(mod["aat"])
        ac_val = float(mod["ac"])
        return (aat_val * 1.0 + ac_val * 9.0) / 10.0
    except (ValueError, TypeError):
        return None

def get_module_lateral_avg(mod):
    if not mod or mod.get("lateral1") is None or mod.get("lateral2") is None:
        return None
    try:
        lat1 = float(mod["lateral1"])
        lat2 = float(mod["lateral2"])
        return (lat1 + lat2) / 2.0
    except (ValueError, TypeError):
        return None

def get_student_calculations(student, settings=None):
    if not student or student.get("statusLancamento") == "não_iniciado":
        return None

    notas = student.get("notas")
    if not notas:
        return None

    if not settings:
        db = read_db()
        settings = db.get("settings", {})

    modules_ctrl = settings.get("modulesControl", {
        "ac3": "aberto_lancamento",
        "ac4": "fechado",
        "ac5": "fechado",
        "ac6": "fechado",
        "idiomas": "fechado"
    })

    is_ac3_liberado = modules_ctrl.get("ac3") != "fechado"
    is_ac4_liberado = modules_ctrl.get("ac4") != "fechado"
    is_ac5_liberado = modules_ctrl.get("ac5") != "fechado"
    is_ac6_liberado = modules_ctrl.get("ac6") != "fechado"
    is_idiomas_liberado = modules_ctrl.get("idiomas") != "fechado"

    note_ac3 = get_module_note(notas.get("ac3")) if is_ac3_liberado else None
    note_ac4 = get_module_note(notas.get("ac4")) if is_ac4_liberado else None
    note_ac5 = get_module_note(notas.get("ac5")) if is_ac5_liberado else None
    note_ac6 = get_module_note(notas.get("ac6")) if is_ac6_liberado else None

    modules_notes = [n for n in [note_ac3, note_ac4, note_ac5, note_ac6] if n is not None]
    media_modules = sum(modules_notes) / len(modules_notes) if modules_notes else None

    # Lateral values
    lat_vals = []
    if is_ac3_liberado and notas.get("ac3"):
        m = notas["ac3"]
        if m.get("lateral1") is not None:
            try: lat_vals.append(float(m["lateral1"]))
            except: pass
        if m.get("lateral2") is not None:
            try: lat_vals.append(float(m["lateral2"]))
            except: pass
    if is_ac4_liberado and notas.get("ac4"):
        m = notas["ac4"]
        if m.get("lateral1") is not None:
            try: lat_vals.append(float(m["lateral1"]))
            except: pass
        if m.get("lateral2") is not None:
            try: lat_vals.append(float(m["lateral2"]))
            except: pass
    if is_ac5_liberado and notas.get("ac5"):
        m = notas["ac5"]
        if m.get("lateral1") is not None:
            try: lat_vals.append(float(m["lateral1"]))
            except: pass
        if m.get("lateral2") is not None:
            try: lat_vals.append(float(m["lateral2"]))
            except: pass
    if is_ac6_liberado and notas.get("ac6"):
        m = notas["ac6"]
        if m.get("lateral1") is not None:
            try: lat_vals.append(float(m["lateral1"]))
            except: pass
        if m.get("lateral2") is not None:
            try: lat_vals.append(float(m["lateral2"]))
            except: pass
    if is_idiomas_liberado and notas.get("idiomas") and notas["idiomas"].get("lateralIdiomas") is not None:
        try: lat_vals.append(float(notas["idiomas"]["lateralIdiomas"]))
        except: pass

    media_lateral_geral = sum(lat_vals) / len(lat_vals) if lat_vals else None

    # Vertical values
    vert_vals = []
    for m_key, is_lib in [("ac3", is_ac3_liberado), ("ac4", is_ac4_liberado), ("ac5", is_ac5_liberado), ("ac6", is_ac6_liberado)]:
        if is_lib and notas.get(m_key) and notas[m_key].get("vertical") is not None:
            try: vert_vals.append(float(notas[m_key]["vertical"]))
            except: pass
    if is_idiomas_liberado and notas.get("idiomas") and notas["idiomas"].get("verticalIdiomas") is not None:
        try: vert_vals.append(float(notas["idiomas"]["verticalIdiomas"]))
        except: pass

    media_vertical_geral = sum(vert_vals) / len(vert_vals) if vert_vals else None

    final_grade = None
    w_modules = 0.8 if media_modules is not None else 0
    w_lateral = 0.1 if media_lateral_geral is not None else 0
    w_vertical = 0.1 if media_vertical_geral is not None else 0
    sum_weights = w_modules + w_lateral + w_vertical

    if sum_weights > 0:
        weighted_sum = (
            (media_modules * 0.8 if media_modules is not None else 0) +
            (media_lateral_geral * 0.1 if media_lateral_geral is not None else 0) +
            (media_vertical_geral * 0.1 if media_vertical_geral is not None else 0)
        )
        final_grade = weighted_sum / sum_weights

    return {
        "notes": {
            "ac3": {
                "note": note_ac3,
                "lateralAvg": get_module_lateral_avg(notas.get("ac3"))
            },
            "ac4": {
                "note": note_ac4,
                "lateralAvg": get_module_lateral_avg(notas.get("ac4"))
            },
            "ac5": {
                "note": note_ac5,
                "lateralAvg": get_module_lateral_avg(notas.get("ac5"))
            },
            "ac6": {
                "note": note_ac6,
                "lateralAvg": get_module_lateral_avg(notas.get("ac6"))
            }
        },
        "mediaModules": media_modules,
        "mediaLateralGeral": media_lateral_geral,
        "mediaVerticalGeral": media_vertical_geral,
        "finalGrade": final_grade
    }

def compute_class_stats(settings=None):
    db = read_db()
    if not settings:
        settings = db.get("settings", {})

    valid_students = [
        s for s in db.get("students", [])
        if s.get("situacao") == "ativo" and s.get("statusLancamento") in ["confirmado", "corrigido", "bloqueado"]
    ]

    students_with_grades = []
    for s in valid_students:
        calcs = get_student_calculations(s, settings)
        if calcs and calcs.get("finalGrade") is not None:
            students_with_grades.append({
                "student": s,
                "finalGrade": calcs["finalGrade"]
            })

    total_valid = len(students_with_grades)
    if total_valid == 0:
        return {
            "totalValid": 0,
            "mean": 0,
            "median": 0,
            "rankings": []
        }

    sum_grades = sum(item["finalGrade"] for item in students_with_grades)
    mean_val = sum_grades / total_valid

    sorted_grades = sorted([item["finalGrade"] for item in students_with_grades])
    mid = len(sorted_grades) // 2
    if len(sorted_grades) % 2 != 0:
        median_val = sorted_grades[mid]
    else:
        median_val = (sorted_grades[mid - 1] + sorted_grades[mid]) / 2.0

    students_sorted = sorted(students_with_grades, key=lambda x: x["finalGrade"], reverse=True)

    rankings = []
    for item in students_sorted:
        grade = item["finalGrade"]
        higher_count = sum(1 for s in students_sorted if s["finalGrade"] > grade)
        rank = higher_count + 1
        quartil = math.ceil((rank / total_valid) * 4)

        rankings.append({
            "id": item["student"]["id"],
            "nomeDeGuerra": item["student"].get("nomeDeGuerra", ""),
            "finalGrade": grade,
            "rank": rank,
            "quartil": quartil
        })

    return {
        "totalValid": total_valid,
        "mean": mean_val,
        "median": median_val,
        "rankings": rankings
    }

def generate_whatsapp_message(student, class_stats, milestone, settings=None):
    if not settings:
        db = read_db()
        settings = db.get("settings", {})
    calcs = get_student_calculations(student, settings)
    if not calcs:
        return ""

    rankings = class_stats.get("rankings", [])
    st_stat = next((r for r in rankings if str(r["id"]) == str(student["id"])), None)
    rank = st_stat["rank"] if st_stat else 0
    quartil = st_stat["quartil"] if st_stat else 4

    def fmt_num(num):
        if num is None:
            return "Pendente"
        return f"{num:.3f}".replace(".", ",")

    final_grade_val = calcs.get("finalGrade") or 0.0
    mean_val = class_stats.get("mean") or 0.0
    median_val = class_stats.get("median") or 0.0

    diff_mean = abs(final_grade_val - mean_val)
    diff_median = abs(final_grade_val - median_val)

    str_mean_diff = "acima" if final_grade_val >= mean_val else "abaixo"
    str_median_diff = "acima" if final_grade_val >= median_val else "abaixo"

    pos_str = f"{rank}º" if rank > 0 else "Pendente"
    quartil_str = f"{quartil}º" if rank > 0 else "Pendente"
    total_valid = class_stats.get("totalValid", 0)

    return (
        f"Olá, {student.get('nomeDeGuerra', '')}.\n\n"
        f"Sua situação foi atualizada.\n\n"
        f"Participantes com lançamento válido: {total_valid}.\n\n"
        f"Resumo:\n"
        f"Nota final estimada: {fmt_num(calcs.get('finalGrade'))}\n"
        f"Classificação parcial: {pos_str} de {total_valid}\n"
        f"Quartil de desempenho: {quartil_str}\n\n"
        f"Média da turma: {fmt_num(mean_val)}\n"
        f"Mediana da turma: {fmt_num(median_val)}\n\n"
        f"Você está {str_mean_diff} da média em {fmt_num(diff_mean)} (-){fmt_num(diff_mean)} ponto(s).\n"
        f"Você está {str_median_diff} da mediana em {fmt_num(diff_median)} (-){fmt_num(diff_median)} ponto(s).\n\n"
        f"Observação: os dados são individuais. Nenhuma nota de outro participante foi divulgada."
    )

def count_valid_for_module(db, m_key):
    count = 0
    for s in db.get("students", []):
        if s.get("situacao") != "ativo" or s.get("statusLancamento") not in ["confirmado", "corrigido", "bloqueado"]:
            continue
        notas = s.get("notas")
        if not notas:
            continue
        if m_key == "idiomas":
            idi = notas.get("idiomas")
            if idi and idi.get("lateralIdiomas") is not None and idi.get("verticalIdiomas") is not None:
                count += 1
        else:
            mod = notas.get(m_key)
            if mod and mod.get("aat") is not None and mod.get("ac") is not None and mod.get("lateral1") is not None and mod.get("lateral2") is not None and mod.get("vertical") is not None:
                count += 1
    return count

def run_milestone_check(db):
    settings = db.get("settings", {})
    is_per_module = settings.get("milestoneMode") == "por_modulo"
    milestones = [15, 30, 45, 55]
    db_modified = False

    if is_per_module:
        modules_to_check = ["ac3", "ac4", "ac5", "ac6", "idiomas"]
        for m_key in modules_to_check:
            status = settings.get("modulesControl", {}).get(m_key, "fechado")
            if status == "fechado":
                continue

            valid_count_for_mod = count_valid_for_module(db, m_key)
            for m in milestones:
                flag = f"{m_key}_{m}"
                sent_milestones = db.get("sentMilestones", [])
                if valid_count_for_mod >= m and flag not in sent_milestones:
                    sent_milestones.append(flag)
                    db["sentMilestones"] = sent_milestones

                    # filter students
                    active_valid_users = []
                    for s in db.get("students", []):
                        if s.get("situacao") != "ativo" or s.get("statusLancamento") not in ["confirmado", "corrigido", "bloqueado"]:
                            continue
                        notas = s.get("notas")
                        if not notas:
                            continue
                        if m_key == "idiomas":
                            idi = notas.get("idiomas")
                            if idi and idi.get("lateralIdiomas") is not None and idi.get("verticalIdiomas") is not None:
                                active_valid_users.append(s)
                        else:
                            mod = notas.get(m_key)
                            if mod and mod.get("aat") is not None and mod.get("ac") is not None and mod.get("lateral1") is not None and mod.get("lateral2") is not None and mod.get("vertical") is not None:
                                active_valid_users.append(s)

                    stats = compute_class_stats(settings)
                    logs = []
                    for u in active_valid_users:
                        msg_text = generate_whatsapp_message(u, stats, flag, settings)
                        random_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
                        logs.append({
                            "id": random_id,
                            "studentId": u["id"],
                            "nomeDeGuerra": u.get("nomeDeGuerra"),
                            "telefone": u.get("telefone") or "Não informado",
                            "text": msg_text,
                            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                        })

                    label = "Idiomas" if m_key == "idiomas" else f"Módulo {m_key.upper()}"
                    random_marco_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
                    db["milestonesLogs"].append({
                        "id": random_marco_id,
                        "marco": f"{label} - {m} Alunos",
                        "quantidadeParticipantes": valid_count_for_mod,
                        "dataHora": datetime.datetime.utcnow().isoformat() + "Z",
                        "quantidadeMensagens": len(active_valid_users),
                        "status": "sucesso",
                        "detalhes": logs
                    })
                    db_modified = True
    else:
        stats = compute_class_stats(settings)
        valid_count = stats.get("totalValid", 0)

        for m in milestones:
            sent_milestones = db.get("sentMilestones", [])
            if valid_count >= m and m not in sent_milestones:
                sent_milestones.append(m)
                db["sentMilestones"] = sent_milestones

                active_valid_users = [
                    s for s in db.get("students", [])
                    if s.get("situacao") == "ativo" and s.get("statusLancamento") in ["confirmado", "corrigido", "bloqueado"]
                ]

                logs = []
                for u in active_valid_users:
                    msg_text = generate_whatsapp_message(u, stats, m, settings)
                    random_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
                    logs.append({
                        "id": random_id,
                        "studentId": u["id"],
                        "nomeDeGuerra": u.get("nomeDeGuerra"),
                        "telefone": u.get("telefone") or "Não informado",
                        "text": msg_text,
                        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                    })

                random_marco_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
                db["milestonesLogs"].append({
                    "id": random_marco_id,
                    "marco": m,
                    "quantidadeParticipantes": valid_count,
                    "dataHora": datetime.datetime.utcnow().isoformat() + "Z",
                    "quantidadeMensagens": len(active_valid_users),
                    "status": "sucesso",
                    "detalhes": logs
                })
                db_modified = True

    if db_modified:
        write_db(db)

# ================= API ENDPOINTS =================

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "alive"})

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json or {}
    nome_de_guerra = data.get("nomeDeGuerra")
    password = data.get("password")

    if not nome_de_guerra or not password:
        return jsonify({"error": "Nome de guerra e senha são obrigatórios."}), 400

    normalized_input = normalize_name_of_war(nome_de_guerra)
    db = read_db()

    # Admin verification
    if normalized_input in ["ADMIN", "CAP DANIEL"]:
        if password == db.get("settings", {}).get("adminPassword"):
            return jsonify({
                "isAdmin": True,
                "user": {"nomeDeGuerra": "Cap Daniel"}
            })
        else:
            return jsonify({"error": "Senha do administrador incorreta."}), 401

    # Student verification
    student = None
    for s in db.get("students", []):
        if normalize_name_of_war(s.get("nomeDeGuerra", "")) == normalized_input and s.get("situacao") == "ativo":
            student = s
            break

    if not student:
        return jsonify({"error": "Usuário não encontrado ou inativo."}), 401

    if student.get("senha") != password:
        return jsonify({"error": "Senha incorreta."}), 401

    if not student.get("hasAccessed"):
        student["hasAccessed"] = True
        # update on DB too
        for idx, s in enumerate(db["students"]):
            if str(s["id"]) == str(student["id"]):
                db["students"][idx]["hasAccessed"] = True
                break
        write_db(db)

    class_stats = compute_class_stats(db.get("settings"))
    calcs = get_student_calculations(student, db.get("settings"))

    # My rank lookup
    my_rank = None
    for r in class_stats.get("rankings", []):
        if str(r["id"]) == str(student["id"]):
            my_rank = r
            break

    return jsonify({
        "isAdmin": False,
        "user": student,
        "calcs": calcs,
        "classStats": {
            "totalValid": class_stats.get("totalValid"),
            "mean": class_stats.get("mean"),
            "median": class_stats.get("median"),
            "myRank": my_rank
        },
        "settings": db.get("settings")
    })

@app.route("/api/change-password", methods=["POST"])
def api_change_password():
    data = request.json or {}
    student_id = data.get("studentId")
    new_password = data.get("newPassword")

    if not student_id or not new_password:
        return jsonify({"error": "Aluno e nova senha são necessários."}), 400

    db = read_db()
    found = False
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            db["students"][idx]["senha"] = str(new_password)
            db["students"][idx]["isPasswordChanged"] = True
            found = True
            break

    if not found:
        return jsonify({"error": "Aluno não encontrado."}), 404

    write_db(db)
    return jsonify({"success": True, "message": "Senha alterada com sucesso."})

@app.route("/api/update-phone", methods=["POST"])
def api_update_phone():
    data = request.json or {}
    student_id = data.get("studentId")
    phone = data.get("phone")

    if not student_id:
        return jsonify({"error": "Aluno não informado."}), 400

    db = read_db()
    student = None
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            cleaned_phone = re.sub(r"\D", "", phone or "")
            db["students"][idx]["telefone"] = cleaned_phone
            student = db["students"][idx]
            break

    if not student:
        return jsonify({"error": "Aluno não encontrado."}), 404

    write_db(db)
    return jsonify({"success": True, "user": student})

@app.route("/api/save-draft", methods=["POST"])
def api_save_draft():
    data = request.json or {}
    student_id = data.get("studentId")
    notas = data.get("notas")
    client_version = data.get("clientVersao")

    if not student_id or notas is None:
        return jsonify({"error": "Campos obrigatórios ausentes."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Aluno não encontrado."}), 404

    student = db["students"][student_idx]

    # Prevent concurrent edit conflicts
    if student.get("versao") and client_version is not None:
        if int(client_version) < int(student["versao"]):
            return jsonify({"error": "Existe uma versão mais recente deste lançamento. Reabra ou atualize a página antes de continuar."}), 409

    if student.get("statusLancamento") == "bloqueado" or not db.get("settings", {}).get("globalEditOpen"):
        return jsonify({"error": "O período de edição para este lançamento está encerrado."}), 403

    previous_notas = student.get("notas") or {
        "ac3": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac4": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac5": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac6": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "idiomas": {"lateralIdiomas": None, "verticalIdiomas": None}
    }

    # Restrict closed modules modifications
    for m_key in ["ac3", "ac4", "ac5", "ac6"]:
        m_ctrl = db.get("settings", {}).get("modulesControl", {}).get(m_key, "fechado")
        if m_ctrl in ["fechado", "bloqueado_definitivamente"]:
            notas[m_key] = previous_notas.get(m_key) or {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None}

    m_ctrl_idiomas = db.get("settings", {}).get("modulesControl", {}).get("idiomas", "fechado")
    if m_ctrl_idiomas in ["fechado", "bloqueado_definitivamente"]:
        notas["idiomas"] = previous_notas.get("idiomas") or {"lateralIdiomas": None, "verticalIdiomas": None}

    # Increment minor version safely
    current_version = int(student.get("versao") or 1)
    db["students"][student_idx]["notas"] = notas
    db["students"][student_idx]["statusLancamento"] = s.get("statusLancamento") if s.get("statusLancamento") in ["confirmado", "corrigido"] else "rascunho"
    db["students"][student_idx]["versao"] = current_version + 1
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    add_history_log(db, student["id"], student.get("nomeSigiloso"), "todos_draft", "rascunho", notas, "usuario", current_version + 1)
    write_db(db)

    return jsonify({
        "success": True,
        "user": db["students"][student_idx],
        "calcs": get_student_calculations(db["students"][student_idx], db.get("settings"))
    })

@app.route("/api/confirm-launch", methods=["POST"])
def api_confirm_launch():
    data = request.json or {}
    student_id = data.get("studentId")
    notas = data.get("notas")
    client_version = data.get("clientVersao")

    if not student_id or notas is None:
        return jsonify({"error": "Campos obrigatórios ausentes."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Aluno não encontrado."}), 404

    student = db["students"][student_idx]

    if student.get("statusLancamento") == "bloqueado" or not db.get("settings", {}).get("globalEditOpen"):
        return jsonify({"error": "O período de edição para este lançamento está encerrado."}), 403

    if student.get("versao") and client_version is not None:
        if int(client_version) < int(student["versao"]):
            return jsonify({"error": "Existe uma versão mais recente deste lançamento. Reabra ou atualize antes de confirmar."}), 409

    previous_notas = student.get("notas") or {
        "ac3": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac4": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac5": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "ac6": {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None},
        "idiomas": {"lateralIdiomas": None, "verticalIdiomas": None}
    }

    # Restrict closed modules modifications
    for m_key in ["ac3", "ac4", "ac5", "ac6"]:
        m_ctrl = db.get("settings", {}).get("modulesControl", {}).get(m_key, "fechado")
        if m_ctrl in ["fechado", "bloqueado_definitivamente"]:
            notas[m_key] = previous_notas.get(m_key) or {"aat": None, "ac": None, "lateral1": None, "lateral2": None, "vertical": None}

    m_ctrl_idiomas = db.get("settings", {}).get("modulesControl", {}).get("idiomas", "fechado")
    if m_ctrl_idiomas in ["fechado", "bloqueado_definitivamente"]:
        notas["idiomas"] = previous_notas.get("idiomas") or {"lateralIdiomas": None, "verticalIdiomas": None}

    current_version = int(student.get("versao") or 1)
    db["students"][student_idx]["notas"] = notas
    db["students"][student_idx]["statusLancamento"] = "confirmado"
    db["students"][student_idx]["versao"] = current_version + 1
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    # Add confirmation historical event log
    add_history_log(db, student["id"], student.get("nomeSigiloso"), "todos_confirm", "confirmação", notas, "usuario", current_version + 1)
    run_milestone_check(db)
    write_db(db)

    class_stats = compute_class_stats(db.get("settings"))
    calcs = get_student_calculations(db["students"][student_idx], db.get("settings"))

    my_rank = None
    for r in class_stats.get("rankings", []):
        if str(r["id"]) == str(student_id):
            my_rank = r
            break

    return jsonify({
        "success": True,
        "user": db["students"][student_idx],
        "calcs": calcs,
        "classStats": {
            "totalValid": class_stats.get("totalValid"),
            "mean": class_stats.get("mean"),
            "median": class_stats.get("median"),
            "myRank": my_rank
        }
    })

@app.route("/api/refresh-student", methods=["POST"])
def api_refresh_student():
    data = request.json or {}
    student_id = data.get("studentId")

    if not student_id:
        return jsonify({"error": "ID do participante ausente"}), 400

    db = read_db()
    student = next((s for s in db.get("students", []) if str(s["id"]) == str(student_id)), None)

    if not student:
        return jsonify({"error": "Participante não encontrado."}), 404

    class_stats = compute_class_stats(db.get("settings"))
    calcs = get_student_calculations(student, db.get("settings"))

    my_rank = None
    for r in class_stats.get("rankings", []):
        if str(r["id"]) == str(student_id):
            my_rank = r
            break

    return jsonify({
        "success": True,
        "user": student,
        "calcs": calcs,
        "classStats": {
            "totalValid": class_stats.get("totalValid"),
            "mean": class_stats.get("mean"),
            "median": class_stats.get("median"),
            "myRank": my_rank
        }
    })

@app.route("/api/anon-rankings", methods=["GET"])
def api_anon_rankings():
    db = read_db()
    stats = compute_class_stats(db.get("settings"))
    
    # Anonymized response (returns ONLY non-nominal results mapped to secret names under rankings)
    anon_rankings = []
    for r in stats.get("rankings", []):
        # find matching student to supply private secret name
        st = next((s for s in db.get("students", []) if str(s["id"]) == str(r["id"])), None)
        sigiloso_label = st.get("nomeSigiloso") if st else ""
        if sigiloso_label:
            anon_rankings.append({
                "id": r["id"],
                "nomeSigiloso": sigiloso_label,
                "finalGrade": r["finalGrade"],
                "rank": r["rank"],
                "quartil": r["quartil"]
            })

    # Sort by score descending
    anon_rankings = sorted(anon_rankings, key=lambda x: x["finalGrade"], reverse=True)

    return jsonify({
        "totalValid": stats.get("totalValid"),
        "mean": stats.get("mean"),
        "median": stats.get("median"),
        "rankings": anon_rankings
    })

@app.route("/api/notifications/mark-read", methods=["POST"])
def api_mark_notifications_read():
    # Placeholder success - notification indicators are ephemeral or memory-based
    return jsonify({"success": True})

@app.route("/api/my-whatsapp-message", methods=["POST"])
def api_my_whatsapp_message():
    data = request.json or {}
    student_id = data.get("studentId")

    db = read_db()
    student = next((s for s in db.get("students", []) if str(s["id"]) == str(student_id)), None)

    if not student:
        return jsonify({"error": "Participante não encontrado."}), 404

    stats = compute_class_stats(db.get("settings"))
    msg = generate_whatsapp_message(student, stats, "manual", db.get("settings"))

    return jsonify({"success": True, "message": msg})

@app.route("/api/set-nome-sigiloso", methods=["POST"])
def api_set_nome_sigiloso():
    data = request.json or {}
    student_id = data.get("studentId")
    nome_sigiloso = data.get("nomeSigiloso")

    if not student_id or not nome_sigiloso:
        return jsonify({"error": "Preencha todos os campos obrigatórios."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Aluno não encontrado."}), 404

    student = db["students"][student_idx]

    # Validate secret name criteria
    val_err = validate_nome_sigiloso(nome_sigiloso, student, db.get("students", []))
    if val_err:
        return jsonify({"error": val_err}), 400

    clean_sigiloso = re.sub(r"[^A-Z0-9]", "", unicodedata.normalize("NFD", nome_sigiloso).upper())

    db["students"][student_idx]["nomeSigiloso"] = clean_sigiloso
    db["students"][student_idx]["acessoAtivado"] = True
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    write_db(db)

    class_stats = compute_class_stats(db.get("settings"))
    calcs = get_student_calculations(db["students"][student_idx], db.get("settings"))

    return jsonify({
        "success": True,
        "user": db["students"][student_idx],
        "calcs": calcs,
        "classStats": {
            "totalValid": class_stats.get("totalValid"),
            "mean": class_stats.get("mean"),
            "median": class_stats.get("median")
        }
    })

# ================= ADMIN PROTECTED ROUTES =================

@app.route("/api/admin/data", methods=["GET"])
def api_admin_data():
    db = read_db()
    stats = compute_class_stats(db.get("settings"))
    
    # Pack calculations into student elements for administrative screens
    full_students = []
    for s in db.get("students", []):
        calcs = get_student_calculations(s, db.get("settings"))
        full_students.append({
            **s,
            "calcs": calcs,
            "finalGrade": calcs["finalGrade"] if calcs else None
        })

    return jsonify({
        "students": full_students,
        "stats": {
            "totalValid": stats.get("totalValid"),
            "mean": stats.get("mean"),
            "median": stats.get("median")
        },
        "settings": db.get("settings"),
        "historicoSalvamento": db.get("historicoSalvamento", []),
        "milestonesLogs": db.get("milestonesLogs", []),
        "whatsappLogs": db.get("whatsappLogs", [])
    })

@app.route("/api/admin/save-settings", methods=["POST"])
def api_admin_save_settings():
    new_settings = request.json or {}
    db = read_db()
    
    # Overwrite settings keys
    db["settings"] = {**db.get("settings", {}), **new_settings}
    
    # Retrospectively re-evaluate milestones if needed
    run_milestone_check(db)
    write_db(db)

    return jsonify({"success": True, "settings": db["settings"]})

@app.route("/api/admin/edit-student", methods=["POST"])
def api_admin_edit_student():
    data = request.json or {}
    student_id = data.get("id")

    if not student_id:
        return jsonify({"error": "ID do participante ausente"}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Participante não encontrado."}), 404

    # Update basic profile fields safely
    if "nomeDeGuerra" in data:
        db["students"][student_idx]["nomeDeGuerra"] = normalize_name_of_war(data["nomeDeGuerra"])
    if "matricula" in data:
        db["students"][student_idx]["matricula"] = str(data["matricula"]).strip()
    if "senha" in data:
        db["students"][student_idx]["senha"] = str(data["senha"]).strip()
    if "telefone" in data:
        db["students"][student_idx]["telefone"] = re.sub(r"\D", "", data["telefone"] or "")
    if "nomeSigiloso" in data:
        clean_sig = re.sub(r"[^A-Z0-9]", "", unicodedata.normalize("NFD", data["nomeSigiloso"] or "").upper())
        db["students"][student_idx]["nomeSigiloso"] = clean_sig

    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"
    write_db(db)

    return jsonify({"success": True, "student": db["students"][student_idx]})

@app.route("/api/admin/toggle-block", methods=["POST"])
def api_admin_toggle_block():
    data = request.json or {}
    student_id = data.get("studentId")

    if not student_id:
        return jsonify({"error": "Aluno não especificado."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Aluno não encontrado."}), 404

    current_status = db["students"][student_idx].get("statusLancamento")
    if current_status == "bloqueado":
        db["students"][student_idx]["statusLancamento"] = "confirmado"
    else:
        db["students"][student_idx]["statusLancamento"] = "bloqueado"

    write_db(db)
    return jsonify({"success": True, "statusLancamento": db["students"][student_idx]["statusLancamento"]})

@app.route("/api/admin/add-student", methods=["POST"])
def api_admin_add_student():
    data = request.json or {}
    nome_guerra = data.get("nomeDeGuerra")
    matricula = data.get("matricula")

    if not nome_guerra or not matricula:
        return jsonify({"error": "Nome de Guerra e Matrícula são obrigatórios"}), 400

    db = read_db()
    norm_name = normalize_name_of_war(nome_guerra)
    norm_mat = str(matricula).strip()

    # Check database conflicts
    for s in db.get("students", []):
        if s.get("matricula") == norm_mat or normalize_name_of_war(s.get("nomeDeGuerra", "")) == norm_name:
            return jsonify({"error": "Participante com este nome de guerra ou matrícula já existente."}), 409

    new_student = {
        "id": norm_mat,
        "nomeDeGuerra": norm_name,
        "matricula": norm_mat,
        "senha": norm_mat,
        "isPasswordChanged": False,
        "hasAccessed": False,
        "situacao": "ativo",
        "telefone": "",
        "statusLancamento": "não_iniciado",
        "notas": None,
        "versao": 1,
        "atualizado_em": datetime.datetime.utcnow().isoformat() + "Z",
        "historico": []
    }

    db["students"].append(new_student)
    write_db(db)

    return jsonify({"success": True, "student": new_student})

@app.route("/api/admin/delete-student", methods=["POST"])
def api_admin_delete_student():
    data = request.json or {}
    student_id = data.get("studentId")

    if not student_id:
        return jsonify({"error": "Aluno não especificado."}), 400

    db = read_db()
    db["students"] = [s for s in db.get("students", []) if str(s["id"]) != str(student_id)]
    
    write_db(db)
    return jsonify({"success": True})

@app.route("/api/admin/delete-students-batch", methods=["POST"])
def api_delete_students_batch():
    data = request.json or {}
    ids = data.get("ids", [])

    if not ids:
        return jsonify({"error": "Nenhum participante selecionado."}), 400

    db = read_db()
    db["students"] = [s for s in db.get("students", []) if str(s["id"]) not in [str(i) for i in ids]]
    
    write_db(db)
    return jsonify({"success": True, "deletedCount": len(ids)})

@app.route("/api/admin/toggle-block-batch", methods=["POST"])
def api_toggle_block_batch():
    data = request.json or {}
    ids = data.get("ids", [])
    action = data.get("action") # "bloquear" | "desbloquear"

    if not ids:
        return jsonify({"error": "Nenhum participante selecionado."}), 400

    db = read_db()
    success_count = 0
    target_status = "bloqueado" if action == "bloquear" else "confirmado"

    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) in [str(i) for i in ids]:
            db["students"][idx]["statusLancamento"] = target_status
            success_count += 1

    write_db(db)
    return jsonify({"success": True, "updatedCount": success_count})

@app.route("/api/admin/inactivate-students-batch", methods=["POST"])
def api_inactivate_students_batch():
    data = request.json or {}
    ids = data.get("ids", [])
    situacao = data.get("situacao", "inatransitavel") # "ativo" | "inatransitavel" | "desligado"

    if not ids:
        return jsonify({"error": "Nenhum participante selecionado."}), 400

    db = read_db()
    success_count = 0
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) in [str(i) for i in ids]:
            db["students"][idx]["situacao"] = situacao
            success_count += 1

    write_db(db)
    return jsonify({"success": True, "updatedCount": success_count})

@app.route("/api/admin/batch-import", methods=["POST"])
def api_admin_batch_import():
    data = request.json or {}
    csv_text = data.get("csvText")

    if not csv_text:
        return jsonify({"error": "O conteúdo CSV é obrigatório."}), 400

    db = read_db()
    students_list = db.get("students", [])

    lines = csv_text.splitlines()
    imported_students = []
    ignored_list = []
    errors_list = []
    success_names = []

    seen_names = set()
    seen_matriculas = set()

    db_names = set(normalize_name_of_war(s.get("nomeDeGuerra", "")) for s in students_list)
    db_matriculas = set(s.get("matricula") for s in students_list)

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        parts = [p.strip() for p in line.split(";")]

        # Filter excel header
        is_header = any(
            p.lower() in ["id", "nome_guerra", "nome_de_guerra", "matricula", "senha_inicial", "tipo_acesso", "status"]
            for p in parts
        )
        if is_header:
            continue

        nome_guerra_raw = ""
        matricula_raw = ""
        tipo_acesso_raw = "aluno"
        turma_raw = "Intendência - ESAO 2026"
        status_raw = "ativo"

        if len(parts) >= 6:
            is_first_col_numeric = parts[0].isdigit()
            if is_first_col_numeric:
                nome_guerra_raw = parts[1]
                matricula_raw = parts[2]
                tipo_acesso_raw = parts[4] if len(parts) > 4 else "aluno"
                turma_raw = parts[5] if len(parts) > 5 else "Intendência - ESAO 2026"
                status_raw = parts[6] if len(parts) > 6 else "ativo"
            else:
                nome_guerra_raw = parts[0]
                matricula_raw = parts[1]
                tipo_acesso_raw = parts[2] if len(parts) > 2 else "aluno"
                turma_raw = parts[3] if len(parts) > 3 else "Intendência - ESAO 2026"
                status_raw = parts[4] if len(parts) > 4 else "ativo"
        elif len(parts) >= 2:
            nome_guerra_raw = parts[0]
            matricula_raw = parts[1]
        else:
            errors_list.append({"line": i + 1, "raw": line, "reason": "Número insuficiente de colunas (mínimo 2)."})
            continue

        if not nome_guerra_raw or not matricula_raw:
            errors_list.append({"line": i + 1, "raw": line, "reason": "Nome de Guerra ou Matrícula em branco."})
            continue

        norm_name = normalize_name_of_war(nome_guerra_raw)
        norm_matricula = matricula_raw.strip()

        if not norm_matricula.isdigit():
            errors_list.append({"line": i + 1, "raw": line, "reason": f"Matrícula inválida: '{norm_matricula}' deve conter apenas números."})
            continue

        dup_in_db = (norm_name in db_names) or (norm_matricula in db_matriculas)
        dup_in_batch = (norm_name in seen_names) or (norm_matricula in seen_matriculas)

        if dup_in_db or dup_in_batch:
            reason = "Duplicidade detectada"
            if norm_name in db_names:
                reason += " (Nome de guerra já existente na base)"
            elif norm_matricula in db_matriculas:
                reason += " (Matrícula já existente na base)"
            elif norm_name in seen_names:
                reason += " (Nome de guerra repetido no arquivo colado)"
            elif norm_matricula in seen_matriculas:
                reason += " (Matrícula repetida no arquivo colado)"

            ignored_list.append({
                "line": i + 1,
                "nomeDeGuerra": norm_name,
                "matricula": norm_matricula,
                "reason": reason
            })
            continue

        seen_names.add(norm_name)
        seen_matriculas.add(norm_matricula)

        new_student = {
            "id": norm_matricula,
            "nomeDeGuerra": norm_name,
            "matricula": norm_matricula,
            "senha": norm_matricula,
            "isPasswordChanged": False,
            "hasAccessed": False,
            "situacao": status_raw or "ativo",
            "tipo_acesso": tipo_acesso_raw or "aluno",
            "turma": turma_raw or "Intendência - ESAO 2026",
            "telefone": "",
            "statusLancamento": "não_iniciado",
            "notas": None,
            "versao": 1,
            "atualizado_em": datetime.datetime.utcnow().isoformat() + "Z",
            "historico": []
        }

        imported_students.append(new_student)
        success_names.append(norm_name)

    if imported_students:
        db["students"].extend(imported_students)
        write_db(db)

    return jsonify({
        "success": True,
        "successCount": len(imported_students),
        "ignoredCount": len(ignored_list),
        "errorCount": len(errors_list),
        "errorsList": errors_list,
        "successNames": success_names,
        "ignoredList": ignored_list
    })

@app.route("/api/admin/save-correction", methods=["POST"])
def api_admin_save_correction():
    data = request.json or {}
    student_id = data.get("studentId")
    notas = data.get("notas")

    if not student_id or notas is None:
        return jsonify({"error": "ID e notas corrigidas são necessários."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Participante não encontrado."}), 404

    current_version = int(db["students"][student_idx].get("versao") or 1)

    db["students"][student_idx]["notas"] = notas
    db["students"][student_idx]["statusLancamento"] = "corrigido"
    db["students"][student_idx]["versao"] = current_version + 1
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    add_history_log(db, student_id, db["students"][student_idx].get("nomeSigiloso"), "todos_correction", "correção", notas, "admin", current_version + 1)
    run_milestone_check(db)
    write_db(db)

    return jsonify({"success": True, "student": db["students"][student_idx]})

@app.route("/api/admin/clear-student-data", methods=["POST"])
def api_admin_clear_student_data():
    data = request.json or {}
    student_id = data.get("studentId")

    if not student_id:
        return jsonify({"error": "Participante não informado."}), 400

    db = read_db()
    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Participante não encontrado."}), 404

    current_version = int(db["students"][student_idx].get("versao") or 1)

    db["students"][student_idx]["notas"] = None
    db["students"][student_idx]["statusLancamento"] = "não_iniciado"
    db["students"][student_idx]["versao"] = current_version + 1
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    add_history_log(db, student_id, db["students"][student_idx].get("nomeSigiloso"), "limpar_todos", "exclusão", {}, "admin", current_version + 1)
    write_db(db)

    return jsonify({"success": True})

@app.route("/api/admin/restore-student-history", methods=["POST"])
def api_admin_restore_student_history():
    data = request.json or {}
    student_id = data.get("studentId")
    target_version = data.get("versao")

    if not student_id or target_version is None:
        return jsonify({"error": "ID e versão são necessários."}), 400

    db = read_db()
    logs = db.get("historicoSalvamento", [])
    
    # filter and sort log entries for this user descending by time
    user_logs = [l for l in logs if str(l.get("user_id")) == str(student_id) and int(l.get("versao", 0)) == int(target_version)]
    if not user_logs:
        return jsonify({"error": "Ponto de salvamento correspondente no histórico não localizado."}), 404

    match_log = user_logs[0]
    try:
        recovered_notas = json.loads(match_log.get("dados_json", "{}"))
    except:
        recovered_notas = {}

    student_idx = -1
    for idx, s in enumerate(db.get("students", [])):
        if str(s["id"]) == str(student_id):
            student_idx = idx
            break

    if student_idx == -1:
        return jsonify({"error": "Aluno não encontrado."}), 404

    current_version = int(db["students"][student_idx].get("versao") or 1)

    db["students"][student_idx]["notas"] = recovered_notas
    db["students"][student_idx]["statusLancamento"] = "confirmado" if "confirm" in match_log.get("módulo", "") else "rascunho"
    db["students"][student_idx]["versao"] = current_version + 1
    db["students"][student_idx]["atualizado_em"] = datetime.datetime.utcnow().isoformat() + "Z"

    add_history_log(db, student_id, db["students"][student_idx].get("nomeSigiloso"), "restauracao", "restauração", recovered_notas, "admin", current_version + 1)
    write_db(db)

    return jsonify({"success": True})

@app.route("/api/admin/restore-full-backup", methods=["POST"])
def api_admin_restore_full_backup():
    payload = request.json or {}
    if not payload.get("students"):
        return jsonify({"error": "Backup corrompido ou incompleto."}), 400

    db = read_db()
    db["students"] = payload.get("students", [])
    db["settings"] = {**db.get("settings", {}), **payload.get("settings", {})}
    db["historicoSalvamento"] = payload.get("historicoSalvamento", [])
    db["milestonesLogs"] = payload.get("milestonesLogs", [])
    db["sentMilestones"] = payload.get("sentMilestones", [])

    write_db(db)
    return jsonify({"success": True})

@app.route("/api/admin/export-backup", methods=["GET"])
def api_admin_export_backup():
    db = read_db()
    return jsonify(db)

@app.route("/api/admin/whatsapp-url", methods=["GET"])
def api_admin_whatsapp_url():
    # Helper to fetch current general stats
    db = read_db()
    return jsonify({"sentMilestones": db.get("sentMilestones"), "milestonesLogs": db.get("milestonesLogs")})

@app.route("/api/admin/reset-demo", methods=["POST"])
def api_admin_reset_demo():
    db = read_db()
    db["students"] = []
    db["users"] = []
    db["launches"] = []
    db["historicoSalvamento"] = []
    db["milestonesLogs"] = []
    db["sentMilestones"] = []
    
    write_db(db)
    return jsonify({"success": True})

# Serve compiled Frontend index and static resources
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Define express parsers
app.use(express.json());

function normalizeNameOfWar(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

// DB Helper functions
const DB_BAK_PATH = path.join(process.cwd(), "data", "db.json.bak");
const DB_TMP_BAK_PATH = "/tmp/db_persistent_backup.json";

let cachedDb: any = null;

function getStudentsWithGradesCount(studentsList: any[]): number {
  if (!studentsList || !Array.isArray(studentsList)) return 0;
  return studentsList.filter((s: any) => s.notas !== null).length;
}

function readDb() {
  if (cachedDb) {
    return cachedDb;
  }

  let parsedFromMain: any = null;
  let errorFromMain: any = null;

  // 1. Try reading the main database file
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      parsedFromMain = JSON.parse(data);
    }
  } catch (err) {
    errorFromMain = err;
    console.error("Error reading main db.json:", err);
  }

  // 2. Try loading backup from /tmp directory (outside workspace, immune to git/checkout resets)
  let parsedFromTmp: any = null;
  try {
    if (fs.existsSync(DB_TMP_BAK_PATH)) {
      const dataTmp = fs.readFileSync(DB_TMP_BAK_PATH, "utf-8");
      parsedFromTmp = JSON.parse(dataTmp);
    }
  } catch (tmpErr) {
    console.warn("Could not read tmp backup:", tmpErr.message);
  }

  // 3. Try loading database backup from local workspace directory
  let parsedFromBak: any = null;
  try {
    if (fs.existsSync(DB_BAK_PATH)) {
      const dataBak = fs.readFileSync(DB_BAK_PATH, "utf-8");
      parsedFromBak = JSON.parse(dataBak);
    }
  } catch (bakErr) {
    console.warn("Could not read bak backup:", bakErr.message);
  }

  // Select the absolute best database candidate (the one with the most active/filled student data records)
  let bestDb: any = null;
  let source = "";

  // Always run candidate comparison to choose the most populated and complete database file (safeguard against repo/container resets)
  const candidates = [
    { parsed: parsedFromMain, src: "main" },
    { parsed: parsedFromTmp, src: "tmp_backup" },
    { parsed: parsedFromBak, src: "bak_backup" }
  ];

  for (const cand of candidates) {
    if (!cand.parsed || (!cand.parsed.students && !cand.parsed.users)) {
      continue;
    }
    if (!bestDb) {
      bestDb = cand.parsed;
      source = cand.src;
      continue;
    }

    const candStudentCount = cand.parsed.students ? cand.parsed.students.length : (cand.parsed.users ? cand.parsed.users.length : 0);
    const bestStudentCount = bestDb.students ? bestDb.students.length : (bestDb.users ? bestDb.users.length : 0);
    const candGrades = cand.parsed.students ? getStudentsWithGradesCount(cand.parsed.students) : 0;
    const bestGrades = bestDb.students ? getStudentsWithGradesCount(bestDb.students) : 0;

    // Prefer the candidate with more filled-out grades, or more students in case of equal grades.
    // If fully equal, keep the current best (main is first in array, preserving main as default).
    if (candGrades > bestGrades) {
      bestDb = cand.parsed;
      source = cand.src;
    } else if (candGrades === bestGrades && candStudentCount > bestStudentCount) {
      bestDb = cand.parsed;
      source = cand.src;
    }
  }

  // If we found a candidate but it wasn't the main one, restore it to main!
  if (bestDb && source !== "main") {
    console.log(`[SAFEGUARD] Automatically restoring healthy database from ${source}`);
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(bestDb, null, 2), "utf-8");
    } catch (saveErr) {
      console.error("Failed to restore candidate to main path", saveErr);
    }
  }

  // If no candidate exists, initialize defaults
  if (!bestDb) {
    console.warn("[SAFEGUARD] No database files or backups were found. Creating standard initial database...");
    bestDb = {
      settings: {
        globalEditOpen: true,
        adminPassword: "DOMPSA675",
        modulesControl: {
          ac3: "aberto_lancamento",
          ac4: "fechado",
          ac5: "fechado",
          ac6: "fechado",
          idiomas: "fechado"
        },
        milestoneMode: "por_modulo",
        turmaName: "Intendência - ESAO 2026"
      },
      sentMilestones: [],
      milestonesLogs: [],
      students: [],
      users: [],
      launches: [],
      historicoSalvamento: []
    };
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(bestDb, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write initial db", e);
    }
  }

  // Ensure default structures exist
  if (!bestDb.settings) {
    bestDb.settings = { globalEditOpen: true, adminPassword: "DOMPSA675", milestoneMode: "por_modulo", turmaName: "Intendência - ESAO 2026" };
  }
  if (!bestDb.settings.modulesControl) {
    bestDb.settings.modulesControl = {
      ac3: "aberto_lancamento",
      ac4: "fechado",
      ac5: "fechado",
      ac6: "fechado",
      idiomas: "fechado"
    };
  }
  if (!bestDb.settings.milestoneMode) {
    bestDb.settings.milestoneMode = "por_modulo";
  }
  if (!bestDb.settings.turmaName) {
    bestDb.settings.turmaName = "Intendência - ESAO 2026";
  }
  if (!bestDb.whatsappLogs) {
    bestDb.whatsappLogs = [];
  }
  if (!bestDb.historicoSalvamento) {
    bestDb.historicoSalvamento = [];
  }

  // SEPARATED TABLES SCHEMA ENFORCEMENT & INTEGRITY SYNC:
  if (!bestDb.users || !Array.isArray(bestDb.users) || bestDb.users.length === 0) {
    // Populate Tabela USUARIOS from legacy db.students
    bestDb.users = (bestDb.students || []).map((s: any) => ({
      user_id: String(s.id),
      nome_guerra: s.nomeDeGuerra || "",
      matricula: s.matricula || String(s.id),
      senha_hash: s.senha || String(s.id),
      tipo_acesso: (s.nomeDeGuerra || "").toUpperCase().includes("DANIEL") ? "admin" : "aluno",
      status: s.situacao || "ativo",
      whatsapp: s.telefone || "",
      nome_sigiloso: s.nomeSigiloso || "",
      primeiro_acesso: s.hasAccessed === false,
      acesso_ativado: s.acessoAtivado || !!s.nomeSigiloso
    }));
  }

  if (!bestDb.launches || !Array.isArray(bestDb.launches) || bestDb.launches.length === 0) {
    // Populate Tabela NOTAS/LANCAMENTOS from legacy db.students
    bestDb.launches = (bestDb.students || []).map((s: any) => ({
      user_id: String(s.id),
      nome_sigiloso: s.nomeSigiloso || "",
      modulo: "todos",
      notas: s.notas || null,
      medias: null,
      nota_final_estimada: null,
      classificacao: null,
      quartil: null,
      status_lancamento: s.statusLancamento || "não_iniciado",
      versao: s.versao || 1,
      atualizado_em: s.atualizado_em || new Date().toISOString()
    }));
  }

  // ROBUST INTEGRITY AUTO-CLEANER FOR EXCLUDING BOTS AND SPECIFIC STUDENTS
  if (bestDb.users && Array.isArray(bestDb.users)) {
    bestDb.users = bestDb.users.filter((u: any) => {
      const mat = String(u.matricula || u.user_id || "").trim();
      const nameUpper = String(u.nome_guerra || "").toUpperCase().trim();
      const normName = nameUpper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const isBotOrExcluded = 
        u.tipo_acesso === "bot" || 
        u.isTest === true || 
        u.teste === true ||
        nameUpper.includes("BOT") || 
        nameUpper.includes("TESTE") || 
        ["ARCA", "FERNANDEZ", "CAVALIER"].includes(normName);
        
      return !isBotOrExcluded;
    });
  }

  if (bestDb.launches && Array.isArray(bestDb.launches)) {
    bestDb.launches = bestDb.launches.filter((l: any) => {
      const existsInUsers = bestDb.users.some((u: any) => String(u.user_id) === String(l.user_id));
      return existsInUsers;
    });
  }

  // Populate compatibility db.students in-memory strictly from bestDb.users & bestDb.launches
  bestDb.students = bestDb.users.map((u: any) => {
    const l = bestDb.launches.find((la: any) => String(la.user_id) === String(u.user_id)) || {
      notas: null,
      status_lancamento: "não_iniciado",
      versao: 1,
      atualizado_em: new Date().toISOString()
    };
    return {
      id: String(u.user_id),
      nomeDeGuerra: u.nome_guerra,
      matricula: u.matricula,
      senha: u.senha_hash,
      situacao: u.status,
      telefone: u.whatsapp,
      nomeSigiloso: u.nome_sigiloso || "",
      hasAccessed: !u.primeiro_acesso,
      acessoAtivado: u.acesso_ativado || !!u.nome_sigiloso,
      statusLancamento: l.status_lancamento,
      notas: l.notas,
      versao: l.versao || 1,
      atualizado_em: l.atualizado_em || new Date().toISOString(),
      historico: []
    };
  });

  // Keep dual backups updated
  try {
    const freshSerialized = JSON.stringify(bestDb, null, 2);
    // Write back to DB_PATH to persist clean database on start
    fs.writeFileSync(DB_PATH, freshSerialized, "utf-8");
    if (bestDb.students && bestDb.students.length > 0) {
      if (!fs.existsSync(DB_BAK_PATH) || fs.readFileSync(DB_BAK_PATH, "utf-8") !== freshSerialized) {
        fs.writeFileSync(DB_BAK_PATH, freshSerialized, "utf-8");
      }
      if (!fs.existsSync(DB_TMP_BAK_PATH) || fs.readFileSync(DB_TMP_BAK_PATH, "utf-8") !== freshSerialized) {
        fs.writeFileSync(DB_TMP_BAK_PATH, freshSerialized, "utf-8");
      }
    }
  } catch (bakSyncErr) {
    console.error("Error keeping backups synchronized:", bakSyncErr.message);
  }

  cachedDb = bestDb;
  return bestDb;
}

function writeDb(data: any) {
  try {
    if (!data || !data.students || !Array.isArray(data.students)) {
      console.error("[SAFEGUARD] Refusing to write corrupt or invalid database schema.");
      return;
    }

    cachedDb = data; // Update memory cache

    // Synchronize modifications on legacy students array back to isolated tables
    data.users = data.students.map((s: any) => {
      const existing = data.users?.find((u: any) => String(u.user_id) === String(s.id)) || {};
      return {
        ...existing,
        user_id: String(s.id),
        nome_guerra: s.nomeDeGuerra,
        matricula: s.matricula,
        senha_hash: s.senha,
        tipo_acesso: (s.nomeDeGuerra || "").toUpperCase().includes("DANIEL") ? "admin" : "aluno",
        status: s.situacao,
        whatsapp: s.telefone ?? "",
        nome_sigiloso: s.nomeSigiloso ?? "",
        primeiro_acesso: !s.hasAccessed,
        acesso_ativado: s.acessoAtivado || !!s.nomeSigiloso
      };
    });

    data.launches = data.students.map((s: any) => {
      const existing = data.launches?.find((l: any) => String(l.user_id) === String(s.id)) || {};
      return {
        ...existing,
        user_id: String(s.id),
        nome_sigiloso: s.nomeSigiloso ?? "",
        modulo: "todos",
        notas: s.notas,
        medias: null,
        nota_final_estimada: s.finalGrade ?? existing.nota_final_estimada ?? null,
        classificacao: s.rank ?? existing.classificacao ?? null,
        quartil: s.quartil ?? existing.quartil ?? null,
        status_lancamento: s.statusLancamento ?? "não_iniciado",
        versao: s.versao || 1,
        atualizado_em: s.atualizado_em || new Date().toISOString()
      };
    });

    const serialized = JSON.stringify(data, null, 2);

    const tempPath = DB_PATH + ".tmp";
    fs.writeFileSync(tempPath, serialized, "utf-8");
    fs.renameSync(tempPath, DB_PATH);

    if (data.students && data.students.length > 0) {
      fs.writeFileSync(DB_BAK_PATH, serialized, "utf-8");
      fs.writeFileSync(DB_TMP_BAK_PATH, serialized, "utf-8");
    }
  } catch (err) {
    console.error("Error writing db safely:", err);
  }
}

function addHistoryLog(db: any, params: {
  userId: string;
  nomeSigiloso: string;
  modulo: string;
  tipoEvento: "autosave" | "rascunho" | "confirmação" | "correção" | "exclusão" | "restauração";
  dadosJson: any;
  origem: "usuario" | "admin" | "sistema";
  versao: number;
}) {
  db.historicoSalvamento = db.historicoSalvamento || [];
  const log = {
    id: "H" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    user_id: String(params.userId),
    nome_sigiloso: params.nomeSigiloso || "Não Definido",
    módulo: params.modulo,
    tipo_evento: params.tipoEvento,
    dados_json: JSON.stringify(params.dadosJson ?? {}),
    data_hora: new Date().toISOString(),
    origem: params.origem,
    versao: params.versao
  };
  db.historicoSalvamento.push(log);
}

function validateNomeSigiloso(nomeSigiloso: string, student: any, dbStudents: any[]) {
  if (!nomeSigiloso) return "Nome sigiloso não pode estar em branco.";
  const clean = nomeSigiloso
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");

  if (clean.length < 4 || clean.length > 12) {
    return "O nome sigiloso deve conter entre 4 e 12 caracteres.";
  }

  if (clean === normalizeNameOfWar(student.nomeDeGuerra)) {
    return "O nome sigiloso não pode ser igual ao seu nome de guerra.";
  }

  // Check unique
  const duplicate = dbStudents.find(
    (s: any) => String(s.id) !== String(student.id) && s.nomeSigiloso && s.nomeSigiloso.toUpperCase() === clean
  );
  if (duplicate) {
    return "Este nome sigiloso já está sendo utilizado por outro participante.";
  }

  // check offensive
  const offensive = ["CU", "FDP", "BOST", "MERD", "PORR", "PUTA", "CARALH", "PICA", "PENIS", "VAGIN"];
  for (const word of offensive) {
    if (clean.includes(word)) {
      return "O nome sigiloso escolhido contém palavras reservadas ou impróprias.";
    }
  }

  return null;
}

// Math core helpers
function getModuleNote(mod: any) {
  if (!mod || mod.aat === null || mod.ac === null) return null;
  const aatVal = parseFloat(mod.aat);
  const acVal = parseFloat(mod.ac);
  if (isNaN(aatVal) || isNaN(acVal)) return null;
  return (aatVal * 1 + acVal * 9) / 10;
}

function getModuleLateralAvg(mod: any) {
  if (!mod || mod.lateral1 === null || mod.lateral2 === null) return null;
  const lat1 = parseFloat(mod.lateral1);
  const lat2 = parseFloat(mod.lateral2);
  if (isNaN(lat1) || isNaN(lat2)) return null;
  return (lat1 + lat2) / 2;
}

function getStudentCalculations(student: any, settings?: any) {
  if (!student || student.statusLancamento === "não_iniciado") {
    return null;
  }

  const { notas } = student;
  if (!notas) return null;

  if (!settings) {
    const db = readDb();
    settings = db.settings;
  }

  const modulesCtrl = settings.modulesControl || {
    ac3: "aberto_lancamento",
    ac4: "fechado",
    ac5: "fechado",
    ac6: "fechado",
    idiomas: "fechado"
  };

  const isAc3Liberado = modulesCtrl.ac3 !== "fechado";
  const isAc4Liberado = modulesCtrl.ac4 !== "fechado";
  const isAc5Liberado = modulesCtrl.ac5 !== "fechado";
  const isAc6Liberado = modulesCtrl.ac6 !== "fechado";
  const isIdiomasLiberado = modulesCtrl.idiomas !== "fechado";

  // Module scores - only compiled if corresponding module is liberated
  const noteAC3 = isAc3Liberado ? getModuleNote(notas.ac3) : null;
  const noteAC4 = isAc4Liberado ? getModuleNote(notas.ac4) : null;
  const noteAC5 = isAc5Liberado ? getModuleNote(notas.ac5) : null;
  const noteAC6 = isAc6Liberado ? getModuleNote(notas.ac6) : null;

  // Média dos módulos: handle partial averages gracefully if not all are launched yet
  const modulesNotes = [noteAC3, noteAC4, noteAC5, noteAC6].filter(n => n !== null) as number[];
  const mediaModules = modulesNotes.length > 0 ? modulesNotes.reduce((a, b) => a + b, 0) / modulesNotes.length : null;

  // Lateral concepts: 8 fields from modules + 1 idiomas = 9 fields total (excluding closed ones)
  const latVals: number[] = [];
  if (isAc3Liberado && notas.ac3) {
    if (notas.ac3.lateral1 !== null && !isNaN(parseFloat(notas.ac3.lateral1))) latVals.push(parseFloat(notas.ac3.lateral1));
    if (notas.ac3.lateral2 !== null && !isNaN(parseFloat(notas.ac3.lateral2))) latVals.push(parseFloat(notas.ac3.lateral2));
  }
  if (isAc4Liberado && notas.ac4) {
    if (notas.ac4.lateral1 !== null && !isNaN(parseFloat(notas.ac4.lateral1))) latVals.push(parseFloat(notas.ac4.lateral1));
    if (notas.ac4.lateral2 !== null && !isNaN(parseFloat(notas.ac4.lateral2))) latVals.push(parseFloat(notas.ac4.lateral2));
  }
  if (isAc5Liberado && notas.ac5) {
    if (notas.ac5.lateral1 !== null && !isNaN(parseFloat(notas.ac5.lateral1))) latVals.push(parseFloat(notas.ac5.lateral1));
    if (notas.ac5.lateral2 !== null && !isNaN(parseFloat(notas.ac5.lateral2))) latVals.push(parseFloat(notas.ac5.lateral2));
  }
  if (isAc6Liberado && notas.ac6) {
    if (notas.ac6.lateral1 !== null && !isNaN(parseFloat(notas.ac6.lateral1))) latVals.push(parseFloat(notas.ac6.lateral1));
    if (notas.ac6.lateral2 !== null && !isNaN(parseFloat(notas.ac6.lateral2))) latVals.push(parseFloat(notas.ac6.lateral2));
  }
  if (isIdiomasLiberado && notas.idiomas && notas.idiomas.lateralIdiomas !== null && !isNaN(parseFloat(notas.idiomas.lateralIdiomas))) {
    latVals.push(parseFloat(notas.idiomas.lateralIdiomas));
  }
  const mediaLateralGeral = latVals.length > 0 ? latVals.reduce((a, b) => a + b, 0) / latVals.length : null;

  // Vertical concepts: 4 modules + 1 idiomas = 5 fields total
  const vertVals: number[] = [];
  if (isAc3Liberado && notas.ac3 && notas.ac3.vertical !== null && !isNaN(parseFloat(notas.ac3.vertical))) {
    vertVals.push(parseFloat(notas.ac3.vertical));
  }
  if (isAc4Liberado && notas.ac4 && notas.ac4.vertical !== null && !isNaN(parseFloat(notas.ac4.vertical))) {
    vertVals.push(parseFloat(notas.ac4.vertical));
  }
  if (isAc5Liberado && notas.ac5 && notas.ac5.vertical !== null && !isNaN(parseFloat(notas.ac5.vertical))) {
    vertVals.push(parseFloat(notas.ac5.vertical));
  }
  if (isAc6Liberado && notas.ac6 && notas.ac6.vertical !== null && !isNaN(parseFloat(notas.ac6.vertical))) {
    vertVals.push(parseFloat(notas.ac6.vertical));
  }
  if (isIdiomasLiberado && notas.idiomas && notas.idiomas.verticalIdiomas !== null && !isNaN(parseFloat(notas.idiomas.verticalIdiomas))) {
    vertVals.push(parseFloat(notas.idiomas.verticalIdiomas));
  }
  const mediaVerticalGeral = vertVals.length > 0 ? vertVals.reduce((a, b) => a + b, 0) / vertVals.length : null;

  // Estimated Final Grade
  // In Portuguese: Nota final estimada = (Média dos módulos x 0,80) + (Média geral do Conceito Lateral x 0,10) + (Média geral do Conceito Vertical x 0,10)
  // If some are empty, let's normalize weights
  let finalGrade = null;
  const wModules = mediaModules !== null ? 0.8 : 0;
  const wLateral = mediaLateralGeral !== null ? 0.1 : 0;
  const wVertical = mediaVerticalGeral !== null ? 0.1 : 0;
  const sumWeights = wModules + wLateral + wVertical;

  if (sumWeights > 0) {
    const weightedSum = 
      (mediaModules !== null ? mediaModules * 0.8 : 0) + 
      (mediaLateralGeral !== null ? mediaLateralGeral * 0.1 : 0) + 
      (mediaVerticalGeral !== null ? mediaVerticalGeral * 0.1 : 0);
    finalGrade = weightedSum / sumWeights;
  }

  return {
    notes: {
      ac3: {
        note: noteAC3,
        lateralAvg: getModuleLateralAvg(notas.ac3)
      },
      ac4: {
        note: noteAC4,
        lateralAvg: getModuleLateralAvg(notas.ac4)
      },
      ac5: {
        note: noteAC5,
        lateralAvg: getModuleLateralAvg(notas.ac5)
      },
      ac6: {
        note: noteAC6,
        lateralAvg: getModuleLateralAvg(notas.ac6)
      }
    },
    mediaModules,
    mediaLateralGeral,
    mediaVerticalGeral,
    finalGrade
  };
}

// Compute general statistics for the class
function computeClassStats(settings?: any) {
  const db = readDb();
  if (!settings) {
    settings = db.settings;
  }
  // Lançamentos válidos: status is confirmado, corrigido, or bloqueado
  const validStudents = db.students.filter((s: any) => 
    s.situacao === "ativo" &&
    ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento)
  );

  const studentsWithGrades = validStudents.map((s: any) => {
    const calcs = getStudentCalculations(s, settings);
    return {
      student: s,
      finalGrade: calcs ? calcs.finalGrade : null
    };
  }).filter(item => item.finalGrade !== null);

  const totalValid = studentsWithGrades.length;

  if (totalValid === 0) {
    return {
      totalValid,
      mean: 0,
      median: 0,
      participantsWithCalculatedGrades: [],
      rankings: []
    };
  }

  // Calculate Mean
  const sum = studentsWithGrades.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
  const mean = sum / totalValid;

  // Calculate Median
  const sortedGrades = [...studentsWithGrades].map(item => item.finalGrade || 0).sort((a, b) => a - b);
  let median = 0;
  const mid = Math.floor(sortedGrades.length / 2);
  if (sortedGrades.length % 2 !== 0) {
    median = sortedGrades[mid];
  } else {
    median = (sortedGrades[mid - 1] + sortedGrades[mid]) / 2;
  }

  // Calculate rankings (high score first)
  // Ties share same rank, e.g. 1st, 1st, 3rd, 4th
  const studentsSortedByGrade = [...studentsWithGrades].sort((a, b) => (b.finalGrade || 0) - (a.finalGrade || 0));
  
  const rankings = studentsSortedByGrade.map((item, index) => {
    const grade = item.finalGrade || 0;
    // Count how many students have strictly higher grades
    const higherCount = studentsSortedByGrade.filter(s => (s.finalGrade || 0) > grade).length;
    const rank = higherCount + 1;
    // Quartil: Math.ceil((position / total_with_valid) * 4)
    // Formula from prompt: "Quartil de desempenho = arredondar para cima [(posição do aluno / total de participantes com lançamento válido) x 4]"
    const quartil = Math.ceil((rank / totalValid) * 4);

    return {
      id: item.student.id,
      nomeDeGuerra: item.student.nomeDeGuerra,
      finalGrade: grade,
      rank,
      quartil
    };
  });

  return {
    totalValid,
    mean,
    median,
    rankings
  };
}

// Generate the personalized WhatsApp template text
// Generate the personalized WhatsApp template text dynamically
function generateWhatsAppMessage(student: any, classStats: any, milestone: number | string, settings?: any) {
  if (!settings) {
    const db = readDb();
    settings = db.settings;
  }
  const calcs = getStudentCalculations(student, settings);
  if (!calcs) return "";

  const stStat = classStats.rankings ? classStats.rankings.find((r: any) => r.id === student.id) : null;
  const rank = stStat ? stStat.rank : 0;
  const quartil = stStat ? stStat.quartil : 4;

  const fmt = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "Pendente";
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const getWord = (vUnique: number, vClass: number) => {
    return vUnique >= vClass ? "acima" : "abaixo";
  };

  const finalGradeVal = calcs.finalGrade || 0;
  const diffMean = Math.abs(finalGradeVal - (classStats.mean || 0));
  const diffMedian = Math.abs(finalGradeVal - (classStats.median || 0));

  const strMeanDiff = getWord(finalGradeVal, classStats.mean || 0);
  const strMedianDiff = getWord(finalGradeVal, classStats.median || 0);

  const posStr = rank > 0 ? `${rank}º` : "Pendente";
  const quartilStr = rank > 0 ? `${quartil}º` : "Pendente";

  return `Olá, ${student.nomeDeGuerra}.

Sua situação foi atualizada.

Participantes com lançamento válido: ${classStats.totalValid}.

Resumo:
Nota final estimada: ${fmt(calcs.finalGrade)}
Classificação parcial: ${posStr} de ${classStats.totalValid}
Quartil de desempenho: ${quartilStr}

Média da turma: ${fmt(classStats.mean)}
Mediana da turma: ${fmt(classStats.median)}

Você está ${strMeanDiff} da média em ${fmt(diffMean)} ponto(s).
Você está ${strMedianDiff} da mediana em ${fmt(diffMedian)} ponto(s).

Observação: os dados são individuais. Nenhuma nota de outro participante foi divulgada.`;
}

function UNUSED_generateWhatsAppMessage_old(student: any, classStats: any, milestone: number | string, settings?: any) {
  return "";
}

/*
  const stStat = classStats.rankings ? classStats.rankings.find((r: any) => r.id === student.id) : null;
  const rank = stStat ? stStat.rank : 0;
  const quartil = stStat ? stStat.quartil : 4;

  const fmt = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "Pendente";
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const fmtDiff = (vUnique: number, vClass: number) => {
    const diff = vUnique - vClass;
    const word = diff >= 0 ? "acima" : "abaixo";
    const label = vClass === classStats.mean ? "média" : "mediana";
    return `${word} da ${label} em ${fmt(Math.abs(diff))} ponto(s)`;
  };

  const getQuartilText = (q: number) => {
    switch (q) {
      case 1:
        return "1º quartil — Você está no grupo dos 25% melhores entre os participantes que já lançaram suas notas.";
      case 2:
        return "2º quartil — Você está no grupo entre os 25% e 50% melhores entre os participantes que já lançaram suas notas.";
      case 3:
        return "3º quartil — Você está no grupo entre os 50% e 75% entre os participantes que já lançaram suas notas.";
      case 4:
        return "4º quartil — Você está no grupo dos 25% finais entre os participantes que já lançaram suas notas.";
      default:
        return "";
    }
  };

  const isBionico = rank <= 2 && rank > 0;
  const bionicoMsg = isBionico 
    ? (classStats.totalValid === 55 
        ? "Parabéns, você é BIÔNICO!" 
        : "Parabéns, você por enquanto é BIÔNICO!")
    : "";

  const modulesCtrl = settings.modulesControl || {
    ac3: "aberto_lancamento",
    ac4: "fechado",
    ac5: "fechado",
    ac6: "fechado",
    idiomas: "fechado"
  };

  let blocksText = "";

  // AC3
  if (modulesCtrl.ac3 !== "fechado") {
    blocksText += `Módulo AC3
AAT3: ${fmt(student.notas?.ac3?.aat)}
AC3: ${fmt(student.notas?.ac3?.ac)}
Nota do Módulo AC3: ${fmt(calcs.notes.ac3.note)}
Média do Conceito Lateral AC3: ${fmt(calcs.notes.ac3.lateralAvg)}
Conceito Vertical AC3: ${fmt(student.notas?.ac3?.vertical)}\n\n`;
  } else {
    blocksText += `Módulo AC3
Status: ainda não liberado pelo administrador.\n\n`;
  }

  // AC4
  if (modulesCtrl.ac4 !== "fechado") {
    blocksText += `Módulo AC4
AAT4: ${fmt(student.notas?.ac4?.aat)}
AC4: ${fmt(student.notas?.ac4?.ac)}
Nota do Módulo AC4: ${fmt(calcs.notes.ac4.note)}
Média do Conceito Lateral AC4: ${fmt(calcs.notes.ac4.lateralAvg)}
Conceito Vertical AC4: ${fmt(student.notas?.ac4?.vertical)}\n\n`;
  } else {
    blocksText += `Módulo AC4
Status: ainda não liberado pelo administrador.\n\n`;
  }

  // AC5
  if (modulesCtrl.ac5 !== "fechado") {
    blocksText += `Módulo AC5
AAT5: ${fmt(student.notas?.ac5?.aat)}
AC5: ${fmt(student.notas?.ac5?.ac)}
Nota do Módulo AC5: ${fmt(calcs.notes.ac5.note)}
Média do Conceito Lateral AC5: ${fmt(calcs.notes.ac5.lateralAvg)}
Conceito Vertical AC5: ${fmt(student.notas?.ac5?.vertical)}\n\n`;
  } else {
    blocksText += `Módulo AC5
Status: ainda não liberado pelo administrador.\n\n`;
  }

  // AC6
  if (modulesCtrl.ac6 !== "fechado") {
    blocksText += `Módulo AC6
AAT6: ${fmt(student.notas?.ac6?.aat)}
AC6: ${fmt(student.notas?.ac6?.ac)}
Nota do Módulo AC6: ${fmt(calcs.notes.ac6.note)}
Média do Conceito Lateral AC6: ${fmt(calcs.notes.ac6.lateralAvg)}
Conceito Vertical AC6: ${fmt(student.notas?.ac6?.vertical)}\n\n`;
  } else {
    blocksText += `Módulo AC6
Status: ainda não liberado pelo administrador.\n\n`;
  }

  // Idiomas
  if (modulesCtrl.idiomas !== "fechado") {
    blocksText += `Idiomas
Conceito Lateral de Idiomas: ${fmt(student.notas?.idiomas?.lateralIdiomas)}
Conceito Vertical de Idiomas: ${fmt(student.notas?.idiomas?.verticalIdiomas)}\n\n`;
  } else {
    blocksText += `Idiomas
Status: ainda não liberado pelo administrador.\n\n`;
  }

  const hasClosed = Object.values(modulesCtrl).some(v => v === "fechado");
  const observation = hasClosed 
    ? "Observação: esta atualização considera apenas os módulos já liberados pelo administrador e confirmados pelos participantes. Os demais módulos ainda não foram abertos para lançamento."
    : "Observação: nenhuma nota individual de outro participante foi divulgada.";

  return `Intendência - ESAO 2026

Olá, ${student.nomeDeGuerra}.

Sua situação foi atualizada.

Até o momento, ${classStats.totalValid} dos 55 participantes já realizaram lançamento válido para os módulos ativos.

Seu panorama individual:

${blocksText}Resumo:
Média dos módulos: ${fmt(calcs.mediaModules)}
Média geral do Conceito Lateral: ${fmt(calcs.mediaLateralGeral)}
Média geral do Conceito Vertical: ${fmt(calcs.mediaVerticalGeral)}
Nota final estimada: ${fmt(calcs.finalGrade)}

Classificação parcial: ${rank > 0 ? `${rank}º de ${classStats.totalValid}` : "Pendente"}
${bionicoMsg ? bionicoMsg + "\n" : ""}
Quartil de desempenho: ${getQuartilText(quartil)}

Média atual da turma: ${fmt(classStats.mean)}
Mediana atual da turma: ${fmt(classStats.median)}

Você está ${fmtDiff(calcs.finalGrade || 0, classStats.mean)}.
Você está ${fmtDiff(calcs.finalGrade || 0, classStats.median)}.

${observation}`;
*/

function countValidForModule(db: any, mKey: string) {
  return db.students.filter((s: any) => {
    if (s.situacao !== "ativo" || !["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento)) {
      return false;
    }
    const notas = s.notas;
    if (!notas) return false;
    if (mKey === "idiomas") {
      return notas.idiomas && notas.idiomas.lateralIdiomas !== null && notas.idiomas.verticalIdiomas !== null;
    } else {
      const mod = notas[mKey];
      return mod && mod.aat !== null && mod.ac !== null && mod.lateral1 !== null && mod.lateral2 !== null && mod.vertical !== null;
    }
  }).length;
}

// Trigger automatic milestone evaluations if count reaches 15, 30, 45, or 55
function runMilestoneCheck(db: any) {
  const settings = db.settings;
  const isPerModule = settings.milestoneMode === "por_modulo";
  
  const milestones = [15, 30, 45, 55];
  let dbModified = false;

  if (isPerModule) {
    const modulesToCheck = ["ac3", "ac4", "ac5", "ac6", "idiomas"];
    modulesToCheck.forEach(mKey => {
      const status = settings.modulesControl?.[mKey] || "fechado";
      if (status === "fechado") return; // Skip closed modules for milestones

      const validCountForMod = countValidForModule(db, mKey);

      milestones.forEach(m => {
        const flag = `${mKey}_${m}`;
        if (validCountForMod >= m && !db.sentMilestones.includes(flag)) {
          db.sentMilestones.push(flag);

          const activeValidUsers = db.students.filter((s: any) => {
            if (s.situacao !== "ativo" || !["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento)) {
              return false;
            }
            const notas = s.notas;
            if (!notas) return false;
            if (mKey === "idiomas") {
              return notas.idiomas && notas.idiomas.lateralIdiomas !== null && notas.idiomas.verticalIdiomas !== null;
            } else {
              const mod = notas[mKey];
              return mod && mod.aat !== null && mod.ac !== null && mod.lateral1 !== null && mod.lateral2 !== null && mod.vertical !== null;
            }
          });

          const stats = computeClassStats(settings);

          const logs: any[] = [];
          activeValidUsers.forEach((u: any) => {
            const msgText = generateWhatsAppMessage(u, stats, flag, settings);
            logs.push({
              id: Math.random().toString(36).substring(2, 9),
              studentId: u.id,
              nomeDeGuerra: u.nomeDeGuerra,
              telefone: u.telefone || "Não informado",
              text: msgText,
              timestamp: new Date().toISOString()
            });
          });

          const label = mKey === "idiomas" ? "Idiomas" : `Módulo ${mKey.toUpperCase()}`;
          db.milestonesLogs.push({
            id: Math.random().toString(36).substring(2, 9),
            marco: `${label} - ${m} Alunos`,
            quantidadeParticipantes: validCountForMod,
            dataHora: new Date().toISOString(),
            quantidadeMensagens: activeValidUsers.length,
            status: "sucesso",
            detalhes: logs
          });

          dbModified = true;
        }
      });
    });
  } else {
    // General milestone mode
    const stats = computeClassStats(settings);
    const validCount = stats.totalValid;

    milestones.forEach(m => {
      if (validCount >= m && !db.sentMilestones.includes(m)) {
        db.sentMilestones.push(m);

        const activeValidUsers = db.students.filter((s: any) => 
          s.situacao === "ativo" &&
          ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento)
        );

        const logs: any[] = [];
        activeValidUsers.forEach((u: any) => {
          const msgText = generateWhatsAppMessage(u, stats, m, settings);
          logs.push({
            id: Math.random().toString(36).substring(2, 9),
            studentId: u.id,
            nomeDeGuerra: u.nomeDeGuerra,
            telefone: u.telefone || "Não informado",
            text: msgText,
            timestamp: new Date().toISOString()
          });
        });

        db.milestonesLogs.push({
          id: Math.random().toString(36).substring(2, 9),
          marco: m,
          quantidadeParticipantes: validCount,
          dataHora: new Date().toISOString(),
          quantidadeMensagens: activeValidUsers.length,
          status: "sucesso",
          detalhes: logs
        });

        dbModified = true;
      }
    });
  }

  if (dbModified) {
    writeDb(db);
  }
}

// REST API DEFINITIONS
app.get("/api/health", (req, res) => {
  res.json({ status: "alive" });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { nomeDeGuerra, password } = req.body;
  if (!nomeDeGuerra || !password) {
    return res.status(400).json({ error: "Nome de guerra e senha são obrigatórios." });
  }

  const normalizedInput = normalizeNameOfWar(nomeDeGuerra);

  const db = readDb();

  // Admin login check (admin or Cap Daniel)
  if (normalizedInput === "ADMIN" || normalizedInput === "CAP DANIEL") {
    if (password === db.settings.adminPassword) {
      return res.json({
        isAdmin: true,
        user: { nomeDeGuerra: "Cap Daniel" }
      });
    } else {
      return res.status(401).json({ error: "Senha do administrador incorreta." });
    }
  }

  const student = db.students.find((s: any) => normalizeNameOfWar(s.nomeDeGuerra) === normalizedInput && s.situacao === "ativo");

  if (!student) {
    return res.status(401).json({ error: "Usuário não encontrado ou inativo." });
  }

  if (student.senha !== password) {
    return res.status(401).json({ error: "Senha incorreta." });
  }

  // Update hasAccessed flag if not yet set
  if (!student.hasAccessed) {
    student.hasAccessed = true;
    writeDb(db);
  }

  // Calculate ranks and statistics
  const classStats = computeClassStats(db.settings);
  const calcs = getStudentCalculations(student, db.settings);

  // Return user statistics safely (never return other users' nominal data)
  res.json({
    isAdmin: false,
    user: student,
    calcs,
    classStats: {
      totalValid: classStats.totalValid,
      mean: classStats.mean,
      median: classStats.median,
      myRank: classStats.rankings ? classStats.rankings.find((r: any) => r.id === student.id) : null
    },
    settings: db.settings
  });
});

// CHANGE PASSWORD
app.post("/api/change-password", (req, res) => {
  const { studentId, newPassword } = req.body;
  if (!studentId || !newPassword) {
    return res.status(400).json({ error: "Aluno e nova senha são necessários." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => s.id === studentId);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  db.students[studentIdx].senha = newPassword;
  db.students[studentIdx].isPasswordChanged = true;
  writeDb(db);

  res.json({ success: true, message: "Senha alterada com sucesso." });
});

// UPDATE PROFILE / PHONE
app.post("/api/update-phone", (req, res) => {
  const { studentId, phone } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Aluno não informado." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => s.id === studentId);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const cleanedPhone = (phone || "").replace(/[^\d]/g, "");
  db.students[studentIdx].telefone = cleanedPhone;
  writeDb(db);

  res.json({ success: true, user: db.students[studentIdx] });
});

// SAVE DRAFT
app.post("/api/save-draft", (req, res) => {
  const { studentId, notas, clientVersao, phone, isAutosave } = req.body;
  if (!studentId || !notas) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => s.id === studentId);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const student = db.students[studentIdx];

  // Prevent conflict if client version is behind
  if (student.versao && clientVersao !== undefined && Number(clientVersao) < Number(student.versao)) {
    return res.status(409).json({ error: "Existe uma versão mais recente deste lançamento. Reabra ou atualize a página antes de continuar." });
  }

  if (student.statusLancamento === "bloqueado" || !db.settings.globalEditOpen) {
    return res.status(403).json({ error: "O período de edição para este lançamento está encerrado." });
  }

  // Prevent editing closed or definitively blocked modules from student draft posts
  const previousNotas = student.notas || {
    ac3: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac4: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac5: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac6: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    idiomas: { lateralIdiomas: null, verticalIdiomas: null }
  };
  ["ac3", "ac4", "ac5", "ac6"].forEach((mKey: any) => {
    const mCtrl = db.settings.modulesControl?.[mKey] || "fechado";
    if (mCtrl === "fechado" || mCtrl === "bloqueado_definitivamente") {
      notas[mKey] = previousNotas[mKey] || { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null };
    }
  });
  const mCtrlIdiomas = db.settings.modulesControl?.idiomas || "fechado";
  if (mCtrlIdiomas === "fechado" || mCtrlIdiomas === "bloqueado_definitivamente") {
    notas.idiomas = previousNotas.idiomas || { lateralIdiomas: null, verticalIdiomas: null };
  }

  student.notas = notas;
  student.statusLancamento = "rascunho_salvo";
  
  if (phone !== undefined) {
    const cleanedPhone = (phone || "").replace(/[^\d]/g, "");
    student.telefone = cleanedPhone;
  }

  student.versao = (student.versao || 1) + 1;
  student.atualizado_em = new Date().toISOString();

  // Log in history table
  addHistoryLog(db, {
    userId: student.id,
    nomeSigiloso: student.nomeSigiloso || "",
    modulo: "todos",
    tipoEvento: isAutosave ? "autosave" : "rascunho",
    dadosJson: { notas, phone: student.telefone || "" },
    origem: "usuario",
    versao: student.versao
  });

  writeDb(db);

  res.json({ success: true, user: student });
});

// CONFIRM DEFINITELY
app.post("/api/confirm-launch", (req, res) => {
  const { studentId, notas, clientVersao, phone } = req.body;
  if (!studentId || !notas) {
    return res.status(400).json({ error: "Dados obrigatórios ausentes." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => s.id === studentId);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const student = db.students[studentIdx];

  // Prevent conflict if client version is behind
  if (student.versao && clientVersao !== undefined && Number(clientVersao) < Number(student.versao)) {
    return res.status(409).json({ error: "Existe uma versão mais recente deste lançamento. Reabra ou atualize a página antes de continuar." });
  }

  if (student.statusLancamento === "bloqueado" || !db.settings.globalEditOpen) {
    return res.status(403).json({ error: "A edição e lançamento estão encerrados no momento." });
  }

  // Prevent editing closed or definitively blocked modules from student confirm posts
  const previousNotas = student.notas || {
    ac3: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac4: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac5: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac6: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    idiomas: { lateralIdiomas: null, verticalIdiomas: null }
  };
  ["ac3", "ac4", "ac5", "ac6"].forEach((mKey: any) => {
    const mCtrl = db.settings.modulesControl?.[mKey] || "fechado";
    if (mCtrl === "fechado" || mCtrl === "bloqueado_definitivamente") {
      notas[mKey] = previousNotas[mKey] || { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null };
    }
  });
  const mCtrlIdiomas = db.settings.modulesControl?.idiomas || "fechado";
  if (mCtrlIdiomas === "fechado" || mCtrlIdiomas === "bloqueado_definitivamente") {
    notas.idiomas = previousNotas.idiomas || { lateralIdiomas: null, verticalIdiomas: null };
  }

  student.notas = notas;
  student.statusLancamento = "confirmado";

  if (phone !== undefined) {
    const cleanedPhone = (phone || "").replace(/[^\d]/g, "");
    student.telefone = cleanedPhone;
  }

  student.versao = (student.versao || 1) + 1;
  student.atualizado_em = new Date().toISOString();

  // Log in history table
  addHistoryLog(db, {
    userId: student.id,
    nomeSigiloso: student.nomeSigiloso || "",
    modulo: "todos",
    tipoEvento: "confirmação",
    dadosJson: { notas, phone: student.telefone || "" },
    origem: "usuario",
    versao: student.versao
  });

  writeDb(db);

  // Re-run milestone evaluation & compute latest class details
  runMilestoneCheck(db);

  // Reload db after checks
  const freshDb = readDb();
  const freshStudent = freshDb.students[studentIdx];
  const freshStats = computeClassStats(freshDb.settings);
  const calcs = getStudentCalculations(freshStudent, freshDb.settings);

  res.json({
    success: true,
    user: freshStudent,
    calcs,
    classStats: {
      totalValid: freshStats.totalValid,
      mean: freshStats.mean,
      median: freshStats.median,
      myRank: freshStats.rankings ? freshStats.rankings.find((r: any) => r.id === freshStudent.id) : null
    }
  });
});

// CLIENT PORTAL STATS REFRESH (ON-DEMAND RECALCULATION)
app.post("/api/refresh-student", (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Matrícula do aluno é obrigatória." });
  }

  const db = readDb();
  const student = db.students.find((s: any) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const freshStats = computeClassStats(db.settings);
  const calcs = getStudentCalculations(student, db.settings);

  res.json({
    success: true,
    user: student,
    classStats: {
      totalValid: freshStats.totalValid,
      mean: freshStats.mean,
      median: freshStats.median,
      myRank: freshStats.rankings ? freshStats.rankings.find((r: any) => r.id === student.id) : null
    },
    settings: db.settings
  });
});

// SECURE ANONYMOUS RANKINGS FOR STUDENT PORTAL
app.get("/api/anon-rankings", (req, res) => {
  const db = readDb();
  const freshStats = computeClassStats(db.settings);
  const activeStudents = db.students.filter((s: any) => s.situacao === "ativo");
  
  const anonList = activeStudents.map((s: any) => {
    const isConfirmed = ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento);
    const ranking = freshStats.rankings ? freshStats.rankings.find((r: any) => r.id === s.id) : null;
    const perf = getStudentCalculations(s, db.settings);
    
    return {
      id: s.id,
      nomeSigiloso: s.nomeSigiloso || "",
      isConfirmed,
      rank: isConfirmed && ranking ? ranking.rank : null,
      quartil: isConfirmed && ranking ? ranking.quartil : null,
      finalGrade: isConfirmed && perf ? perf.finalGrade : null,
      mediaModules: isConfirmed && perf ? perf.mediaModules : null,
      mediaLateralGeral: isConfirmed && perf ? perf.mediaLateralGeral : null,
      mediaVerticalGeral: isConfirmed && perf ? perf.mediaVerticalGeral : null
    };
  });

  res.json({
    success: true,
    rankings: anonList
  });
});

// MARK NOTIFICATION AS READ
app.post("/api/notifications/mark-read", (req, res) => {
  const { studentId, notificationId, all } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "ID do estudante é obrigatório." });
  }
  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => String(s.id) === String(studentId));
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Estudante não encontrado." });
  }

  const student = db.students[studentIdx];
  if (!student.notifications) {
    student.notifications = [];
  }

  if (all) {
    student.notifications.forEach((n: any) => n.read = true);
  } else if (notificationId) {
    const notif = student.notifications.find((n: any) => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }

  writeDb(db);
  res.json({ success: true, notifications: student.notifications });
});


// CLIENT-SIDE PORTAL GENERATE INDIVIDUAL WHATSAPP MESSAGE AND LOG IT
app.post("/api/my-whatsapp-message", (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Matrícula do aluno é obrigatória." });
  }

  const db = readDb();
  const student = db.students.find((s: any) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const stats = computeClassStats(db.settings);
  const text = generateWhatsAppMessage(student, stats, stats.totalValid, db.settings);
  const encodedText = encodeURIComponent(text);
  const cleanedPhone = (student.telefone || "").replace(/\D/g, "");
  const waLink = `https://wa.me/${cleanedPhone}?text=${encodedText}`;

  // Log generation event
  db.whatsappLogs = db.whatsappLogs || [];
  
  let marcoAtual = 0;
  if (stats.totalValid >= 55) marcoAtual = 55;
  else if (stats.totalValid >= 45) marcoAtual = 45;
  else if (stats.totalValid >= 30) marcoAtual = 30;
  else if (stats.totalValid >= 15) marcoAtual = 15;

  const newLog = {
    nomeDeGuerra: student.nomeDeGuerra,
    dataHora: new Date().toISOString(),
    tipoDeMensagem: "Minha situação individual",
    usuario: student.nomeDeGuerra,
    data_hora: new Date().toLocaleString("pt-BR"),
    tipo_mensagem: "Minha situação individual",
    telefone: student.telefone || "",
    status: "mensagem_gerada",
    marcoAtual,
    quantidadeParticipantes: stats.totalValid
  };

  db.whatsappLogs.push(newLog);
  writeDb(db);

  res.json({
    text,
    waLink,
    log: newLog
  });
});

// SAVE CORRECTION (WITH LOG BOOKING)
app.post("/api/save-correction", (req, res) => {
  const { studentId, notas, changes, clientVersao } = req.body;
  if (!studentId || !notas) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => s.id === studentId);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const student = db.students[studentIdx];

  // Prevent conflict if client version is behind
  if (student.versao && clientVersao !== undefined && Number(clientVersao) < Number(student.versao)) {
    return res.status(409).json({ error: "Existe uma versão mais recente deste lançamento. Reabra ou atualize a página antes de continuar." });
  }

  if (student.statusLancamento === "bloqueado" || !db.settings.globalEditOpen) {
    return res.status(403).json({ error: "A edição e correção de notas estão suspensas no momento." });
  }

  // Prevent editing closed or definitively blocked modules from student correction posts
  const previousNotas = student.notas || {
    ac3: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac4: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac5: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    ac6: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
    idiomas: { lateralIdiomas: null, verticalIdiomas: null }
  };
  ["ac3", "ac4", "ac5", "ac6"].forEach((mKey: any) => {
    const mCtrl = db.settings.modulesControl?.[mKey] || "fechado";
    if (mCtrl === "fechado" || mCtrl === "bloqueado_definitivamente") {
      notas[mKey] = previousNotas[mKey] || { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null };
    }
  });
  const mCtrlIdiomas = db.settings.modulesControl?.idiomas || "fechado";
  if (mCtrlIdiomas === "fechado" || mCtrlIdiomas === "bloqueado_definitivamente") {
    notas.idiomas = previousNotas.idiomas || { lateralIdiomas: null, verticalIdiomas: null };
  }

  // Audit logs are sent in 'changes' body property
  // Array of { field, valorAnterior, valorNovo }
  if (Array.isArray(changes)) {
    changes.forEach((ch: any) => {
      student.historico.push({
        dataHora: new Date().toISOString(),
        usuarioAlterou: student.nomeDeGuerra,
        campo: ch.field,
        valorAnterior: String(ch.valorAnterior),
        valorNovo: String(ch.valorNovo)
      });
    });
  }

  student.notas = notas;
  student.statusLancamento = "corrigido";
  student.versao = (student.versao || 1) + 1;
  student.atualizado_em = new Date().toISOString();

  // Log in history table
  addHistoryLog(db, {
    userId: student.id,
    nomeSigiloso: student.nomeSigiloso || "",
    modulo: "todos",
    tipoEvento: "correção",
    dadosJson: { notas, changes },
    origem: "usuario",
    versao: student.versao
  });

  db.students[studentIdx] = student;
  writeDb(db);

  // Recalculate stats but DO NOT repeat milestone automatic sends (per requirements)
  // Let's compute statistics and return
  const freshStats = computeClassStats(db.settings);
  const calcs = getStudentCalculations(student, db.settings);

  res.json({
    success: true,
    user: student,
    calcs,
    classStats: {
      totalValid: freshStats.totalValid,
      mean: freshStats.mean,
      median: freshStats.median,
      myRank: freshStats.rankings ? freshStats.rankings.find((r: any) => r.id === student.id) : null
    }
  });
});

// SET NOME SIGILOSO
app.post("/api/set-nome-sigiloso", (req, res) => {
  const { studentId, nomeSigiloso } = req.body;
  if (!studentId || !nomeSigiloso) {
    return res.status(400).json({ error: "Matrícula e nome sigiloso são necessários." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => String(s.id) === String(studentId));
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const student = db.students[studentIdx];
  
  if (student.nomeSigiloso) {
    return res.status(400).json({ error: "Você já ativou seu Nome Sigiloso e não pode alterá-lo após a ativação." });
  }

  const error = validateNomeSigiloso(nomeSigiloso, student, db.students);
  if (error) {
    return res.status(400).json({ error });
  }

  const cleanName = nomeSigiloso
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");

  student.nomeSigiloso = cleanName;
  student.acessoAtivado = true;
  student.versao = (student.versao || 1) + 1;
  student.atualizado_em = new Date().toISOString();

  // Log in history table
  addHistoryLog(db, {
    userId: student.id,
    nomeSigiloso: cleanName,
    modulo: "sistema",
    tipoEvento: "rascunho",
    dadosJson: { info: "Nome Sigiloso Ativado" },
    origem: "usuario",
    versao: student.versao
  });

  writeDb(db);

  res.json({ success: true, user: student });
});

// ADMIN ROUTES (PROTECTED ON THE CLIENT/DEMO BY ADMIN SIGNIN)
app.get("/api/admin/data", (req, res) => {
  const db = readDb();
  const stats = computeClassStats(db.settings);
  
  res.json({
    students: db.students,
    settings: db.settings,
    sentMilestones: db.sentMilestones,
    milestonesLogs: db.milestonesLogs,
    whatsappLogs: db.whatsappLogs || [],
    historicoSalvamento: db.historicoSalvamento || [],
    stats
  });
});

app.post("/api/admin/save-settings", (req, res) => {
  const { globalEditOpen, adminPassword, modulesControl, milestoneMode, turmaName } = req.body;
  const db = readDb();
  if (globalEditOpen !== undefined) db.settings.globalEditOpen = globalEditOpen;
  if (adminPassword !== undefined) db.settings.adminPassword = adminPassword;
  if (modulesControl !== undefined) db.settings.modulesControl = modulesControl;
  if (milestoneMode !== undefined) db.settings.milestoneMode = milestoneMode;
  if (turmaName !== undefined) db.settings.turmaName = turmaName;
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// ADMIN EDIT STUDENT
app.post("/api/admin/edit-student", (req, res) => {
  const { studentId, nomeDeGuerra, matricula, situacao, passwordReset } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "ID do aluno é obrigatório." });
  }

  const db = readDb();
  const idx = db.students.findIndex((s: any) => s.id === studentId);
  if (idx === -1) {
    return res.status(404).json({ error: "Aluno não encontrado." });
  }

  const student = db.students[idx];

  if (nomeDeGuerra) {
    const normalizedNewName = normalizeNameOfWar(nomeDeGuerra);
    // check unique
    const duplicate = db.students.find((s: any) => s.id !== studentId && normalizeNameOfWar(s.nomeDeGuerra) === normalizedNewName);
    if (duplicate) {
      return res.status(400).json({ error: "Já existe um participante cadastrado com esse nome de guerra. Insira um identificador complementar." });
    }
    student.nomeDeGuerra = normalizedNewName;
  }

  if (matricula) {
    const duplicateMat = db.students.find((s: any) => s.id !== studentId && s.matricula === matricula);
    if (duplicateMat) {
      return res.status(400).json({ error: "Já existe um participante cadastrado com essa matrícula." });
    }
    student.id = matricula;
    student.matricula = matricula;
  }

  if (situacao) {
    student.situacao = situacao;
  }

  if (passwordReset) {
    student.senha = student.matricula; // Reset to initial matricula password
    student.isPasswordChanged = false;
    student.hasAccessed = false;
  }

  // Admin registers change logs in history too if edits occur
  student.historico.push({
    dataHora: new Date().toISOString(),
    usuarioAlterou: "Administrador",
    campo: "Cadastro de Usuário",
    valorAnterior: "Dados de cadastro originais",
    valorNovo: `Editado por Admin: ${student.nomeDeGuerra}, Situação: ${student.situacao}`
  });

  db.students[idx] = student;
  writeDb(db);
  res.json({ success: true, student });
});

// ADMIN TOGGLE USER BLOCK/UNBLOCK
app.post("/api/admin/toggle-block", (req, res) => {
  const { studentId, block } = req.body;
  const db = readDb();
  const idx = db.students.findIndex((s: any) => s.id === studentId);
  if (idx === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }
  
  db.students[idx].statusLancamento = block ? "bloqueado" : "confirmado";
  
  // Register notification
  if (!db.students[idx].notifications) {
    db.students[idx].notifications = [];
  }
  const statusMsg = block
    ? "O administrador bloqueou o seu preenchimento de notas. Seus lançamentos estão congelados."
    : "O administrador liberou o seu preenchimento de notas. Agora você já pode editar e atualizar seus lançamentos.";
  
  db.students[idx].notifications.unshift({
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    message: statusMsg,
    dataHora: new Date().toISOString(),
    read: false,
    type: block ? "blocked" : "unblocked"
  });

  writeDb(db);
  res.json({ success: true });
});

// ADMIN DELETE STUDENT
app.post("/api/admin/delete-student", (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "O ID do estudante é obrigatório." });
  }

  const db = readDb();
  const idx = db.students.findIndex((s: any) => String(s.id) === String(studentId));
  if (idx === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  db.students.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: "Participante excluído com sucesso." });
});

// ADMIN BATCH DELETE STUDENTS
app.post("/api/admin/delete-students-batch", (req, res) => {
  const { studentIds } = req.body;
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: "A lista de IDs dos estudantes é obrigatória." });
  }

  const db = readDb();
  const affectedStudents = db.students.filter((s: any) => studentIds.map(String).includes(String(s.id)));
  const matriculas = affectedStudents.map((s: any) => s.matricula || String(s.id));

  const initialCount = db.students.length;
  db.students = db.students.filter((s: any) => !studentIds.map(String).includes(String(s.id)));
  const removedCount = initialCount - db.students.length;

  db.historicoSalvamento = db.historicoSalvamento || [];
  db.historicoSalvamento.push({
    id: "H" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    user_id: "LOTE",
    nome_sigiloso: "Ação em Lote",
    módulo: "lote",
    tipo_evento: "exclusão",
    dados_json: JSON.stringify({
      data_hora: new Date().toISOString(),
      admin_responsável: "Administrador",
      tipo_ação: "exclusao_lote",
      quantidade_afetada: removedCount,
      ids_afetados: studentIds,
      matrículas_afetadas: matriculas,
      resultado: "sucesso"
    }),
    data_hora: new Date().toISOString(),
    origem: "admin",
    versao: 1
  });

  writeDb(db);
  res.json({ success: true, message: `${removedCount} participante(s) excluído(s) com sucesso.` });
});

// ADMIN ADD NEW STUDENT (TO INCREASE CLASS CAPACITY OR EDIT PARTICIPANTS)
app.post("/api/admin/add-student", (req, res) => {
  const { nomeDeGuerra, matricula, situacao } = req.body;
  if (!nomeDeGuerra || !matricula) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  const db = readDb();
  const normalizedWar = normalizeNameOfWar(nomeDeGuerra);

  // Check name unique
  const existsName = db.students.find((s: any) => normalizeNameOfWar(s.nomeDeGuerra) === normalizedWar);
  if (existsName) {
    return res.status(400).json({ error: "Já existe um participante cadastrado com esse nome de guerra. Insira um identificador complementar." });
  }

  // Check matricula unique
  const existsMatricula = db.students.find((s: any) => s.matricula === matricula);
  if (existsMatricula) {
    return res.status(400).json({ error: "Já existe um participante cadastrado com essa matrícula." });
  }

  const newStudent = {
    id: matricula,
    nomeDeGuerra: normalizedWar,
    matricula,
    senha: matricula,
    isPasswordChanged: false,
    hasAccessed: false,
    situacao: situacao || "ativo",
    telefone: "",
    statusLancamento: "não_iniciado",
    notas: null,
    historico: []
  };

  db.students.push(newStudent);
  writeDb(db);
  res.json({ success: true, student: newStudent });
});

// ADMIN BATCH IMPORT STUDENTS
app.post("/api/admin/batch-import", (req, res) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: "O conteúdo CSV é obrigatório." });
  }

  const db = readDb();
  const studentsList = db.students || [];

  const lines = csvText.split(/\r?\n/);
  const importedStudents: any[] = [];
  const ignoredList: any[] = [];
  const errorsList: any[] = [];
  const successNames: string[] = [];

  const seenNames = new Set<string>();
  const seenMatriculas = new Set<string>();

  const dbNames = new Set(studentsList.map((s: any) => normalizeNameOfWar(s.nomeDeGuerra)));
  const dbMatriculas = new Set(studentsList.map((s: any) => s.matricula));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(";").map(p => p.trim());

    // Skip header
    const isHeader = parts.some(p => {
      const lower = p.toLowerCase();
      return lower === "id" || lower === "nome_guerra" || lower === "nome_de_guerra" || lower === "matricula" || lower === "senha_inicial" || lower === "tipo_acesso" || lower === "turma" || lower === "status";
    });

    if (isHeader) {
      continue;
    }

    let nomeGuerraRaw = "";
    let matriculaRaw = "";
    let tipoAcessoRaw = "aluno";
    let turmaRaw = "Intendência - ESAO 2026";
    let statusRaw = "ativo";

    if (parts.length >= 6) {
      const isFirstColNumeric = /^\d+$/.test(parts[0]);
      if (isFirstColNumeric) {
        nomeGuerraRaw = parts[1];
        matriculaRaw = parts[2];
        tipoAcessoRaw = parts[4] || "aluno";
        turmaRaw = parts[5] || "Intendência - ESAO 2026";
        statusRaw = parts[6] || "ativo";
      } else {
        nomeGuerraRaw = parts[0];
        matriculaRaw = parts[1];
        tipoAcessoRaw = parts[2] || "aluno";
        turmaRaw = parts[3] || "Intendência - ESAO 2026";
        statusRaw = parts[4] || "ativo";
      }
    } else if (parts.length >= 2) {
      nomeGuerraRaw = parts[0];
      matriculaRaw = parts[1];
      tipoAcessoRaw = parts[2] || "aluno";
      turmaRaw = parts[3] || "Intendência - ESAO 2026";
      statusRaw = parts[4] || "ativo";
    } else {
      errorsList.push({ line: i + 1, raw: line, reason: "Número insuficiente de colunas (mínimo 2)." });
      continue;
    }

    if (!nomeGuerraRaw || !matriculaRaw) {
      errorsList.push({ line: i + 1, raw: line, reason: "Nome de Guerra ou Matrícula em branco." });
      continue;
    }

    const normName = normalizeNameOfWar(nomeGuerraRaw);
    const normMatricula = matriculaRaw.trim();

    if (!/^\d+$/.test(normMatricula)) {
      errorsList.push({ line: i + 1, raw: line, reason: `Matrícula inválida: '${normMatricula}' deve conter apenas números.` });
      continue;
    }

    const dupInDb = dbNames.has(normName) || dbMatriculas.has(normMatricula);
    const dupInBatch = seenNames.has(normName) || seenMatriculas.has(normMatricula);

    if (dupInDb || dupInBatch) {
      let reason = "Duplicidade detectada";
      if (dbNames.has(normName)) reason += " (Nome de guerra já existente na base)";
      else if (dbMatriculas.has(normMatricula)) reason += " (Matrícula já existente na base)";
      else if (seenNames.has(normName)) reason += " (Nome de guerra repetido no arquivo colado)";
      else if (seenMatriculas.has(normMatricula)) reason += " (Matrícula repetida no arquivo colado)";

      ignoredList.push({
        line: i + 1,
        nomeDeGuerra: normName,
        matricula: normMatricula,
        reason
      });
      continue;
    }

    seenNames.add(normName);
    seenMatriculas.add(normMatricula);

    const newStudent = {
      id: normMatricula,
      nomeDeGuerra: normName,
      matricula: normMatricula,
      senha: normMatricula,
      isPasswordChanged: false,
      hasAccessed: false,
      situacao: statusRaw || "ativo",
      tipo_acesso: tipoAcessoRaw || "aluno",
      turma: turmaRaw || "Intendência - ESAO 2026",
      telefone: "",
      statusLancamento: "não_iniciado",
      notas: null,
      historico: []
    };

    importedStudents.push(newStudent);
    successNames.push(normName);
  }

  // Actually save import
  if (importedStudents.length > 0) {
    db.students.push(...importedStudents);
    writeDb(db);
  }

  res.json({
    success: true,
    successCount: importedStudents.length,
    ignoredCount: ignoredList.length,
    errorCount: errorsList.length,
    errorsList: errorsList,
    successNames: successNames,
    ignoredList: ignoredList
  });
});

// INDIVIDUAL DISPATCH TEXT GENERATOR API (FOR WHATSAPP SEND CLICKS)
app.get("/api/admin/whatsapp-url", (req, res) => {
  const { studentId } = req.query;
  const db = readDb();
  const student = db.students.find((s: any) => s.id === studentId);
  if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

  const stats = computeClassStats(db.settings);
  
  // Create current mock or actual milestone context as appropriate:
  // Usually individual sends are for current standing, so we can use current count as context
  const text = generateWhatsAppMessage(student, stats, stats.totalValid, db.settings);
  const encodedText = encodeURIComponent(text);
  const cleanedPhone = (student.telefone || "").replace(/\D/g, "");

  res.json({
    text,
    waLink: `https://wa.me/${cleanedPhone}?text=${encodedText}`
  });
});

// FULL RESET FOR DEMO/TEST PURPOSES (DOES NOT CREATE BOTS)
app.post("/api/admin/reset-demo", (req, res) => {
  const db = readDb();
  db.sentMilestones = [];
  db.milestonesLogs = [];
  db.students.forEach((s: any) => {
    s.statusLancamento = "não_iniciado";
    s.notas = null;
    s.telefone = "";
  });
  writeDb(db);
  res.json({ success: true, message: "Sistema resetado com sucesso para estado inicial limpo." });
});

// ADMIN ACTION: CLEAR PARTICIPANT DATA ONLY (NON-DESTRUCTIVE REGISTRATION HOLDER)
app.post("/api/admin/clear-student-data", (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "ID do estudante é obrigatório." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => String(s.id) === String(studentId));
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Estudante não encontrado." });
  }

  const student = db.students[studentIdx];
  student.notas = null;
  student.telefone = "";
  student.statusLancamento = "não_iniciado";
  student.nomeSigiloso = "";
  student.acessoAtivado = false;
  student.versao = (student.versao || 1) + 1;
  student.atualizado_em = new Date().toISOString();

  // Register notification
  if (!student.notifications) {
    student.notifications = [];
  }
  student.notifications.unshift({
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    message: "Atenção: sua ficha individual e notas lançadas foram completamente zeradas e reiniciadas pelo administrador.",
    dataHora: new Date().toISOString(),
    read: false,
    type: "system"
  });

  addHistoryLog(db, {
    userId: student.id,
    nomeSigiloso: "Limpo",
    modulo: "sistema",
    tipoEvento: "exclusão",
    dadosJson: { info: "Dados da ficha zerados pelo administrador" },
    origem: "admin",
    versao: student.versao
  });

  writeDb(db);
  res.json({ success: true, message: "Cadastro limpo com sucesso. Todos os lançamentos foram apagados." });
});

// ADMIN ACTION: BATCH TOGGLE EDIT BLOCK FOR SELECTED PARTICIPANTS
app.post("/api/admin/toggle-block-batch", (req, res) => {
  const { studentIds, block } = req.body;
  if (!studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ error: "A seleção de estudantes é obrigatória." });
  }

  const db = readDb();
  let updatedCount = 0;
  const affectedStudents = db.students.filter((s: any) => studentIds.map(String).includes(String(s.id)));
  const matriculas = affectedStudents.map((s: any) => s.matricula || String(s.id));

  db.students.forEach((s: any) => {
    if (studentIds.map(String).includes(String(s.id))) {
      s.statusLancamento = block ? "bloqueado" : "rascunho_salvo";
      s.versao = (s.versao || 1) + 1;
      s.atualizado_em = new Date().toISOString();
      updatedCount++;

      // Register notification
      if (!s.notifications) {
        s.notifications = [];
      }
      const statusMsg = block
        ? "O administrador bloqueou o seu preenchimento de notas através de uma ação em lote."
        : "O administrador liberou o seu preenchimento de notas através de uma ação em lote. Agora você pode atualizar seus lançamentos.";
      
      s.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        message: statusMsg,
        dataHora: new Date().toISOString(),
        read: false,
        type: block ? "blocked" : "unblocked"
      });

      addHistoryLog(db, {
        userId: s.id,
        nomeSigiloso: s.nomeSigiloso || "",
        modulo: "sistema",
        tipoEvento: "correção",
        dadosJson: { info: block ? "Bloqueado em lote" : "Desbloqueado em lote" },
        origem: "admin",
        versao: s.versao
      });
    }
  });

  // Register batch administrative action in master history
  db.historicoSalvamento = db.historicoSalvamento || [];
  db.historicoSalvamento.push({
    id: "H" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    user_id: "LOTE",
    nome_sigiloso: "Ação em Lote",
    módulo: "lote",
    tipo_evento: "correção",
    dados_json: JSON.stringify({
      data_hora: new Date().toISOString(),
      admin_responsável: "Administrador",
      tipo_ação: block ? "bloqueio_lote" : "desbloqueio_lote",
      quantidade_afetada: affectedStudents.length,
      ids_afetados: studentIds,
      matrículas_afetadas: matriculas,
      resultado: "sucesso"
    }),
    data_hora: new Date().toISOString(),
    origem: "admin",
    versao: 1
  });

  writeDb(db);
  res.json({ success: true, message: `${updatedCount} participante(s) atualizados com sucesso.` });
});

// ADMIN ACTION: BATCH INACTIVATE SELECTED PARTICIPANTS (PREFER INACTIVATION OVER DELETE DEFINITIVELY)
app.post("/api/admin/inactivate-students-batch", (req, res) => {
  const { studentIds } = req.body;
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: "A seleção de estudantes é obrigatória." });
  }

  const db = readDb();
  let updatedCount = 0;
  const affectedStudents = db.students.filter((s: any) => studentIds.map(String).includes(String(s.id)));
  const matriculas = affectedStudents.map((s: any) => s.matricula || String(s.id));

  db.students.forEach((s: any) => {
    if (studentIds.map(String).includes(String(s.id))) {
      s.situacao = "inativo";
      s.versao = (s.versao || 1) + 1;
      s.atualizado_em = new Date().toISOString();
      updatedCount++;

      if (!s.notifications) {
        s.notifications = [];
      }
      s.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        message: "O administrador alterou a sua situação para inativo no sistema. Novas ações estão suspensas.",
        dataHora: new Date().toISOString(),
        read: false,
        type: "blocked"
      });

      addHistoryLog(db, {
        userId: s.id,
        nomeSigiloso: s.nomeSigiloso || "",
        modulo: "sistema",
        tipoEvento: "exclusão",
        dadosJson: { info: "Inativado em lote" },
        origem: "admin",
        versao: s.versao
      });
    }
  });

  db.historicoSalvamento = db.historicoSalvamento || [];
  db.historicoSalvamento.push({
    id: "H" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    user_id: "LOTE",
    nome_sigiloso: "Ação em Lote",
    módulo: "lote",
    tipo_evento: "exclusão",
    dados_json: JSON.stringify({
      data_hora: new Date().toISOString(),
      admin_responsável: "Administrador",
      tipo_ação: "inativacao_lote",
      quantidade_afetada: affectedStudents.length,
      ids_afetados: studentIds,
      matrículas_afetadas: matriculas,
      resultado: "sucesso"
    }),
    data_hora: new Date().toISOString(),
    origem: "admin",
    versao: 1
  });

  writeDb(db);
  res.json({ success: true, message: `${updatedCount} participante(s) inativados com sucesso.` });
});

// ADMIN ACTION: RESTORE PARTICIPANT LAUNCH FROM LOG HISTORY
app.post("/api/admin/restore-student-history", (req, res) => {
  const { studentId, logId } = req.body;
  if (!studentId || !logId) {
    return res.status(400).json({ error: "ID do aluno e ID do log são obrigatórios." });
  }

  const db = readDb();
  const studentIdx = db.students.findIndex((s: any) => String(s.id) === String(studentId));
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Estudante não encontrado." });
  }

  const student = db.students[studentIdx];
  const log = db.historicoSalvamento?.find((h: any) => h.id === logId);
  if (!log) {
    return res.status(404).json({ error: "Registro de histórico não encontrado." });
  }

  try {
    const backupData = JSON.parse(log.dados_json);
    if (backupData.notas) {
      student.notas = backupData.notas;
    }
    if (backupData.phone !== undefined) {
      student.telefone = backupData.phone;
    }

    student.statusLancamento = log.tipo_evento === "confirmação" ? "confirmado" : log.tipo_evento === "correção" ? "corrigido" : "rascunho_salvo";
    student.versao = (student.versao || 1) + 1;
    student.atualizado_em = new Date().toISOString();

    // Register notification
    if (!student.notifications) {
      student.notifications = [];
    }
    student.notifications.unshift({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      message: `Uma versão antiga de seus lançamentos (${new Date(log.data_hora).toLocaleString('pt-BR')}) foi restaurada pelo administrador. Status atual: ${student.statusLancamento}.`,
      dataHora: new Date().toISOString(),
      read: false,
      type: "system"
    });

    addHistoryLog(db, {
      userId: student.id,
      nomeSigiloso: student.nomeSigiloso || "",
      modulo: "todos",
      tipoEvento: "restauração",
      dadosJson: { info: `Restaurado a partir do log ${logId} (Versão original: ${log.versao})`, notas: student.notas },
      origem: "admin",
      versao: student.versao
    });

    writeDb(db);
    res.json({ success: true, message: `Lançamento restaurado com sucesso para a versão antiga.` });
  } catch (err) {
    res.status(500).json({ error: "Erro ao restaurar histórico: " + err.message });
  }
});

// ADMIN ACTION: EXPORT COMPLETE DATABASE JSON BACKUP FILE
app.get("/api/admin/export-backup", (req, res) => {
  try {
    const db = readDb();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=esao_2026_intendencia_backup.json");
    res.send(JSON.stringify(db, null, 2));
  } catch (err) {
    res.status(500).json({ error: "Erro ao exportar backup: " + err.message });
  }
});

// ADMIN ACTION: RESTORE COMPLETE DATABASE FROM IMPORTED JSON FILE
app.post("/api/admin/restore-full-backup", (req, res) => {
  const { backupJson } = req.body;
  if (!backupJson) {
    return res.status(400).json({ error: "Nenhum arquivo ou conteúdo de backup foi enviado." });
  }

  try {
    let parsed: any;
    if (typeof backupJson === "string") {
      parsed = JSON.parse(backupJson);
    } else {
      parsed = backupJson;
    }

    if (!parsed.students && !parsed.users) {
      return res.status(400).json({ error: "Conteúdo inválido: as chaves 'students' ou 'users' não foram encontradas no arquivo." });
    }

    // Perform restoration overwriting database
    writeDb(parsed);
    res.json({ success: true, message: "Banco de dados completo restaurado com sucesso! Recarregando sistema..." });
  } catch (err) {
    res.status(400).json({ error: "Falha ao processar dados de backup: " + err.message });
  }
});

// SERVE VITE STATIC FILES & MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server initialized on port ${PORT}`);
  });
}

startServer();

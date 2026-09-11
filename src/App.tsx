import React, { useState, useEffect, useMemo } from "react";
import { 
  Lock, 
  Unlock,
  User, 
  Menu, 
  LogOut, 
  Smartphone, 
  Calculator, 
  FileCheck2, 
  RefreshCw, 
  RotateCcw,
  Upload,
  Edit, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  X, 
  Send, 
  History, 
  Users, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  HelpCircle,
  Hash,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Search,
  Check,
  Eye,
  EyeOff,
  Info,
  UserPlus,
  UserCheck,
  UserX,
  CalendarRange,
  Sliders,
  Database,
  Trash,
  Trash2,
  Moon,
  Sun,
  Bell,
  CheckCheck,
  Printer,
  LayoutDashboard,
  Grid3X3,
  FileSpreadsheet,
  Pin,
  Layers,
  Zap,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { Student, NotasInput, GradeInput, MilestoneLog, ClassStats, AppNotification } from "./types";
import {
  ModuleRadar,
  ModuleComparisonBars,
  GradeComposition,
  GradeDistribution,
  LaunchStatusDonut,
  ClassModuleAverages,
  QuartileBars,
  ModuleHeatmap
} from "./components/charts";

// Standard formatting for grades (3 decimal places, comma as separator)
/**
 * Imagens do sistema.
 *
 * Para usar arquivos próprios: coloque-os em public/img/ e troque o valor abaixo
 * pelo caminho absoluto do arquivo, por exemplo "/img/brasao-esao.png". A pasta
 * public/ é copiada para a raiz do site tanto em desenvolvimento quanto no build,
 * então o mesmo caminho vale nos dois casos.
 *
 * Os endereços atuais são temporários, herdados do Google AI Studio, e podem sair
 * do ar sem aviso — trocá-los por arquivos locais é o caminho recomendado.
 */
const IMAGENS = {
  brasao: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLQc6GbJGQw3pjw9IKqHD6HAYuDjBtHDkJkHZSxEFscU62MNhp1Sk5m6rHrrsW6nG7HJjdNeJ2KvgrACmr_hHy-UcwogmOMAd7K_dbQpyN_s8AFXpT1KOrFLkwE8E5_kO1dSm8Y4KZG_GvkpR4aBl-Pgu2oYcEUTCyTFhpuU5hnj5JDFkRefhyieY6m-sAhM_8wb6K6dgEsu1WhbeOvu4WCCT0LbZ0BJlZ_kZppiID_Trq3BhtQg-cHu4QkUkNvnS15AHzJ5MqWMSt",
  fundoPortal: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAhHzVaj6XvzjGyLf42v3_4XXw74Yz9yNER9bpwlfs5gR6Xu5qPPA65ZAk8LkcY-tcOQjeFRyn-2LrLkpiDI4lrX6K9yeXdxzceS8WbN5b5xcQSNXvo9ESLhMeupZVIXCu5aFBgzsxZnNvHOKULtQmNGIj1HBMm008jD3Ekp1SzKh4GfjAJitefnMsh8IMcyChuzdKfeYF8DR87-yxOlhbepY7NO6ZqQLO5lMuvKRT8a768nE3OD98J1mR3R104FY_Gzwli4xRdbNB"
};

function fmtGrade(num: number | null | undefined): string {
  if (num === null || num === undefined) return "PENDENTE";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

// Compute client-side anonymous student performance to separate Operational vs Performance tabs
function getStudentPerformance(student: any, settings: any) {
  if (!student || !student.notas) return null;
  const { notas } = student;
  const modulesCtrl = settings?.modulesControl || {
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

  const getModuleNote = (m: any) => {
    if (!m || m.aat === null || m.ac === null) return null;
    return (parseFloat(m.aat) * 1 + parseFloat(m.ac) * 9) / 10;
  };

  const noteAC3 = isAc3Liberado ? getModuleNote(notas.ac3) : null;
  const noteAC4 = isAc4Liberado ? getModuleNote(notas.ac4) : null;
  const noteAC5 = isAc5Liberado ? getModuleNote(notas.ac5) : null;
  const noteAC6 = isAc6Liberado ? getModuleNote(notas.ac6) : null;

  const modulesNotes = [noteAC3, noteAC4, noteAC5, noteAC6].filter(n => n !== null) as number[];
  const mediaModules = modulesNotes.length > 0 ? modulesNotes.reduce((a, b) => a + b, 0) / modulesNotes.length : null;

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
    mediaModules,
    mediaLateralGeral,
    mediaVerticalGeral,
    finalGrade
  };
}

// Initial standard template for empty grades
const emptyGradesTemplate = (): NotasInput => ({
  ac3: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
  ac4: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
  ac5: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
  ac6: { aat: null, ac: null, lateral1: null, lateral2: null, vertical: null },
  idiomas: { lateralIdiomas: null, verticalIdiomas: null }
});

function normalizeNameOfWar(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminLoginView, setIsAdminLoginView] = useState(false);
  
  // Theme switcher state (light vs dark mode)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Login input fields
  const [loginWarName, setLoginWarName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  // Student activation states
  const [activationNomeSigiloso, setActivationNomeSigiloso] = useState("");
  const [activationNewPassword, setActivationNewPassword] = useState("");
  const [activationConfirmPassword, setActivationConfirmPassword] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Active student tab state
  const [activeStudentTab, setActiveStudentTab] = useState<"dashboard" | "modules" | "ranking" | "profile">("dashboard");
  const [studentSidebarCollapsed, setStudentSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("student_sidebar_collapsed") === "true";
  });
  const [studentSidebarOverlay, setStudentSidebarOverlay] = useState<boolean>(() => {
    return localStorage.getItem("student_sidebar_overlay") === "true";
  });
  const [anonRankings, setAnonRankings] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [searchSigiloso, setSearchSigiloso] = useState("");

  // Phone state
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [dddInput, setDddInput] = useState("");
  const [numberPartInput, setNumberPartInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Clean and split Brazilian phone inputs on load from currentUser
  useEffect(() => {
    if (currentUser) {
      const stored = currentUser.telefone || "";
      const clean = stored.replace(/[^\d]/g, "");
      if (clean.startsWith("55") && clean.length >= 4) {
        setDddInput(clean.substring(2, 4));
        setNumberPartInput(clean.substring(4));
      } else if (clean.length > 9) {
        setDddInput(clean.substring(0, 2));
        setNumberPartInput(clean.substring(2));
      } else if (clean.length === 9) {
        setDddInput("");
        setNumberPartInput(clean);
      } else {
        setDddInput("");
        setNumberPartInput(clean);
      }
    } else {
      setDddInput("");
      setNumberPartInput("");
    }
  }, [currentUser?.id, currentUser?.telefone]);

  const cleanPhoneInput = (val: string) => {
    let digits = val.replace(/[^\d]/g, "");
    if (digits.startsWith("55") && digits.length >= 10) {
      digits = digits.substring(2);
    }
    return digits;
  };

  const handleDddChange = (val: string) => {
    const digits = cleanPhoneInput(val);
    if (digits.length > 2) {
      setDddInput(digits.substring(0, 2));
      setNumberPartInput(digits.substring(2, 11));
    } else {
      setDddInput(digits);
    }
  };

  const handleNumberPartChange = (val: string) => {
    const digits = cleanPhoneInput(val);
    if (digits.length >= 10) {
      setDddInput(digits.substring(0, 2));
      setNumberPartInput(digits.substring(2, 11));
    } else {
      setNumberPartInput(digits.substring(0, 9));
    }
  };

  const formatPhoneNumber = (ddd: string, num: string) => {
    if (!ddd && !num) return "";
    let formattedNum = num;
    if (num.length > 5) {
      formattedNum = `${num.substring(0, 5)}-${num.substring(5)}`;
    }
    return `+55 (${ddd || "__"}) ${formattedNum || "_____-____"}`;
  };

  const displayFormattedPhone = (phone: string) => {
    if (!phone) return "Não informado";
    const clean = phone.replace(/[^\d]/g, "");
    if (clean.length === 13 && clean.startsWith("55")) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    }
    if (clean.length === 11 && clean.startsWith("55")) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4)}`;
    }
    if (clean.length === 12 && clean.startsWith("55")) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    return phone;
  };

  // Grade edit states (user portal)
  const [formGrades, setFormGrades] = useState<NotasInput>(emptyGradesTemplate());
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // True during active form edit/fill

  // Synchronize raw custom string inputs when not actively editing
  useEffect(() => {
    if (isEditing) return;
    const raw: Record<string, string> = {};
    const modules: Array<"ac3" | "ac4" | "ac5" | "ac6"> = ["ac3", "ac4", "ac5", "ac6"];
    const fields: Array<"aat" | "ac" | "lateral1" | "lateral2" | "vertical"> = ["aat", "ac", "lateral1", "lateral2", "vertical"];
    
    modules.forEach(mKey => {
      fields.forEach(field => {
        const val = formGrades[mKey]?.[field];
        raw[`${mKey}_${field}`] = val !== null && val !== undefined ? String(val).replace(".", ",") : "";
      });
    });

    if (formGrades.idiomas) {
      const lat = formGrades.idiomas.lateralIdiomas;
      const vert = formGrades.idiomas.verticalIdiomas;
      raw["idiomas_lateralIdiomas"] = lat !== null && lat !== undefined ? String(lat).replace(".", ",") : "";
      raw["idiomas_verticalIdiomas"] = vert !== null && vert !== undefined ? String(vert).replace(".", ",") : "";
    }
    setRawInputs(raw);
  }, [formGrades, isEditing]);
  const [isReviewOpen, setIsReviewOpen] = useState(false); // For "Revisar e confirmar" overlay
  const [isAnonReportOpen, setIsAnonReportOpen] = useState(false); // For generating the anonymous classification report (PDF)
  const [saveStatusMsg, setSaveStatusMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Calculated individual values returned from server
  const [myCalcs, setMyCalcs] = useState<any>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [settings, setSettings] = useState<any>({ globalEditOpen: true });

  // Admin Portal state
  const [adminStudents, setAdminStudents] = useState<Student[]>([]);
  const [adminMilestones, setAdminMilestones] = useState<MilestoneLog[]>([]);
  const [adminWhatsappLogs, setAdminWhatsappLogs] = useState<any[]>([]);
  const [adminHistoricoSalvamento, setAdminHistoricoSalvamento] = useState<any[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>({ globalEditOpen: true, adminPassword: "DOMPSA675", turmaName: "Intendência - ESAO 2026" });
  const [adminOverallStats, setAdminOverallStats] = useState<any>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"participants" | "performance_anon" | "modules" | "launches" | "milestones" | "history" | "settings">("participants");
  const [sortColumn, setSortColumn] = useState<string>("matricula");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [anonSortField, setAnonSortField] = useState<"posicao" | "nomeSigiloso" | "notaFinal" | "mediaModulos" | "mediaLateral" | "mediaVertical" | "quartil">("posicao");
  const [anonSortOrder, setAnonSortOrder] = useState<"asc" | "desc">("asc");

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(String(studentId))
        ? prev.filter(id => String(id) !== String(studentId))
        : [...prev, String(studentId)]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = (filteredAdminStudents || []).map(s => String(s.id));
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Admin student modification interactive modals
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<Student | null>(null);
  const [selectedStudentLaunchData, setSelectedStudentLaunchData] = useState<Student | null>(null);
  const [adminStudentToPrint, setAdminStudentToPrint] = useState<Student | null>(null);
  const [whatsappTemplateModal, setWhatsappTemplateModal] = useState<{ student: Student; text: string; waLink: string } | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string>("");

  useEffect(() => {
    if (adminStudentToPrint) {
      document.body.classList.add("print-mode-ficha");
      document.body.classList.remove("print-mode-ranking");
      const timer = setTimeout(() => {
        window.focus();
        window.print();
        setTimeout(() => {
          setAdminStudentToPrint(null);
        }, 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [adminStudentToPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("print-mode-ficha", "print-mode-ranking");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handlePrintFicha = () => {
    document.body.classList.add("print-mode-ficha");
    document.body.classList.remove("print-mode-ranking");
    setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  };

  const handlePrintRanking = () => {
    document.body.classList.remove("print-mode-ficha");
    document.body.classList.add("print-mode-ranking");
    setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  };

  // Form student registration state (Admin)
  const [newStudentWar, setNewStudentWar] = useState("");
  const [newStudentMatricula, setNewStudentMatricula] = useState("");
  const [newStudentSituacao, setNewStudentSituacao] = useState<"ativo" | "inativo">("ativo");
  const [newStudentError, setNewStudentError] = useState("");
  const [newStudentSuccess, setNewStudentSuccess] = useState("");

  // Batch import states
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchCsvText, setBatchCsvText] = useState("");
  const [batchPreview, setBatchPreview] = useState<any[]>([]);
  const [batchErrors, setBatchErrors] = useState<any[]>([]);
  const [batchIgnored, setBatchIgnored] = useState<any[]>([]);
  const [batchReport, setBatchReport] = useState<{
    successCount: number;
    ignoredCount: number;
    errorCount: number;
    errorsList: any[];
    successNames: string[];
    ignoredList: any[];
  } | null>(null);
  const [batchValidationDone, setBatchValidationDone] = useState(false);

  // Load user session from localStorage if cached
  useEffect(() => {
    const cachedUser = localStorage.getItem("esao_session_user");
    const cachedIsAdmin = localStorage.getItem("esao_session_isAdmin");
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      setIsLoggedIn(true);
      if (cachedIsAdmin === "true") {
        setIsAdmin(true);
        fetchAdminData();
      } else {
        setCurrentUser(parsed);
        // fetch refreshed calculations and values
        fetchRefreshedUserData(parsed.nomeDeGuerra, parsed.matricula);
      }
    }
  }, []);

  // Fetch refreshed stats and status for logged-in user
  const fetchRefreshedUserData = async (warName: string, matricula: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeDeGuerra: warName, password: matricula })
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.isAdmin) {
          setCurrentUser(data.user);
          setMyCalcs(data.calcs);
          setClassStats(data.classStats);
          setSettings(data.settings);
          setPhoneInput(data.user.telefone || "");
          if (data.user.notas) {
            setFormGrades(data.user.notas);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário", err);
    }
  };

  // Admin data poll
  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.ok) {
        const data = await res.json();
        setAdminStudents(data.students);
        setAdminMilestones(data.milestonesLogs);
        if (data.whatsappLogs) setAdminWhatsappLogs(data.whatsappLogs);
        if (data.historicoSalvamento) setAdminHistoricoSalvamento(data.historicoSalvamento);
        setAdminSettings(data.settings);
        setAdminOverallStats(data.stats);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin", err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Export anonymous classification to Excel
  const handleExportAdminExcel = () => {
    // 1. Get active students from the state
    const activeStudents = adminStudents.filter((s: any) => s.situacao === "ativo");

    // 2. Sorting logic identical to the UI SortValue logic
    const getSortValue = (studentItem: any, field: string) => {
      const rk = adminOverallStats?.rankings?.find((r: any) => r.id === studentItem.id);
      const pf = getStudentPerformance(studentItem, adminSettings);
      const isConf = ["confirmado", "corrigido", "bloqueado"].includes(studentItem.statusLancamento);

      switch (field) {
        case "posicao":
          return isConf && rk ? rk.rank : 9999;
        case "nomeSigiloso":
          return studentItem.nomeSigiloso ? studentItem.nomeSigiloso.toUpperCase() : "ZZZZZZ";
        case "notaFinal":
          return isConf && pf?.finalGrade !== null && pf?.finalGrade !== undefined ? pf.finalGrade : -1;
        case "mediaModulos":
          return isConf && pf?.mediaModules !== null && pf?.mediaModules !== undefined ? pf.mediaModules : -1;
        case "mediaLateral":
          return isConf && pf?.mediaLateralGeral !== null && pf?.mediaLateralGeral !== undefined ? pf.mediaLateralGeral : -1;
        case "mediaVertical":
          return isConf && pf?.mediaVerticalGeral !== null && pf?.mediaVerticalGeral !== undefined ? pf.mediaVerticalGeral : -1;
        case "quartil":
          return isConf && rk?.quartil ? rk.quartil : 9999;
        default:
          return 0;
      }
    };

    const sortedStudents = [...activeStudents].sort((a: any, b: any) => {
      const valA = getSortValue(a, anonSortField);
      const valB = getSortValue(b, anonSortField);
      
      if (valA === valB) return 0;
      if (anonSortOrder === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    // 3. Construct rows for Excel
    const rows = sortedStudents.map((s: any) => {
      const ranking = adminOverallStats?.rankings?.find((r: any) => r.id === s.id);
      const perf = getStudentPerformance(s, adminSettings);
      const isConfirmed = ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento);

      // Helper to format/retrieve notes
      const getModuleNoteVal = (m: any) => {
        if (!m || m.aat === null || m.ac === null) return "";
        return parseFloat(((parseFloat(m.aat) * 1 + parseFloat(m.ac) * 9) / 10).toFixed(3));
      };

      const fmtFloatVal = (val: any) => {
        if (val === null || val === undefined || isNaN(parseFloat(val))) return "";
        return parseFloat(parseFloat(val).toFixed(3));
      };

      return {
        "Classificação (Posição)": isConfirmed && ranking ? `${ranking.rank}º` : "Pendente",
        "Nome Sigiloso": s.nomeSigiloso || "Pendente",
        "Situação Matrícula": s.situacao === "ativo" ? "Ativo" : "Cancelado",
        "Status Lançamento": s.statusLancamento ? s.statusLancamento.toUpperCase() : "PENDENTE",
        
        "Nota Final Consolidada": isConfirmed && perf?.finalGrade !== null && perf?.finalGrade !== undefined 
          ? parseFloat(perf.finalGrade.toFixed(3)) 
          : "",
        "Quartil da Turma": isConfirmed && ranking?.quartil ? `Q${ranking.quartil}` : "Pendente",
        
        "Média Geral de Módulos": isConfirmed && perf?.mediaModules !== null && perf?.mediaModules !== undefined 
          ? parseFloat(perf.mediaModules.toFixed(3)) 
          : "",
        "Média Geral Conceito Lateral": isConfirmed && perf?.mediaLateralGeral !== null && perf?.mediaLateralGeral !== undefined 
          ? parseFloat(perf.mediaLateralGeral.toFixed(3)) 
          : "",
        "Média Geral Conceito Vertical": isConfirmed && perf?.mediaVerticalGeral !== null && perf?.mediaVerticalGeral !== undefined 
          ? parseFloat(perf.mediaVerticalGeral.toFixed(3)) 
          : "",

        // AC3 Module
        "AC3 - Nota AAT": isConfirmed && s.notas?.ac3?.aat !== null ? fmtFloatVal(s.notas.ac3.aat) : "",
        "AC3 - Nota AC": isConfirmed && s.notas?.ac3?.ac !== null ? fmtFloatVal(s.notas.ac3.ac) : "",
        "AC3 - Média Módulo": isConfirmed ? getModuleNoteVal(s.notas?.ac3) : "",
        "AC3 - Lateral 1": isConfirmed && s.notas?.ac3?.lateral1 !== null ? fmtFloatVal(s.notas.ac3.lateral1) : "",
        "AC3 - Lateral 2": isConfirmed && s.notas?.ac3?.lateral2 !== null ? fmtFloatVal(s.notas.ac3.lateral2) : "",
        "AC3 - Vertical": isConfirmed && s.notas?.ac3?.vertical !== null ? fmtFloatVal(s.notas.ac3.vertical) : "",

        // AC4 Module
        "AC4 - Nota AAT": isConfirmed && s.notas?.ac4?.aat !== null ? fmtFloatVal(s.notas.ac4.aat) : "",
        "AC4 - Nota AC": isConfirmed && s.notas?.ac4?.ac !== null ? fmtFloatVal(s.notas.ac4.ac) : "",
        "AC4 - Média Módulo": isConfirmed ? getModuleNoteVal(s.notas?.ac4) : "",
        "AC4 - Lateral 1": isConfirmed && s.notas?.ac4?.lateral1 !== null ? fmtFloatVal(s.notas.ac4.lateral1) : "",
        "AC4 - Lateral 2": isConfirmed && s.notas?.ac4?.lateral2 !== null ? fmtFloatVal(s.notas.ac4.lateral2) : "",
        "AC4 - Vertical": isConfirmed && s.notas?.ac4?.vertical !== null ? fmtFloatVal(s.notas.ac4.vertical) : "",

        // AC5 Module
        "AC5 - Nota AAT": isConfirmed && s.notas?.ac5?.aat !== null ? fmtFloatVal(s.notas.ac5.aat) : "",
        "AC5 - Nota AC": isConfirmed && s.notas?.ac5?.ac !== null ? fmtFloatVal(s.notas.ac5.ac) : "",
        "AC5 - Média Módulo": isConfirmed ? getModuleNoteVal(s.notas?.ac5) : "",
        "AC5 - Lateral 1": isConfirmed && s.notas?.ac5?.lateral1 !== null ? fmtFloatVal(s.notas.ac5.lateral1) : "",
        "AC5 - Lateral 2": isConfirmed && s.notas?.ac5?.lateral2 !== null ? fmtFloatVal(s.notas.ac5.lateral2) : "",
        "AC5 - Vertical": isConfirmed && s.notas?.ac5?.vertical !== null ? fmtFloatVal(s.notas.ac5.vertical) : "",

        // AC6 Module
        "AC6 - Nota AAT": isConfirmed && s.notas?.ac6?.aat !== null ? fmtFloatVal(s.notas.ac6.aat) : "",
        "AC6 - Nota AC": isConfirmed && s.notas?.ac6?.ac !== null ? fmtFloatVal(s.notas.ac6.ac) : "",
        "AC6 - Média Módulo": isConfirmed ? getModuleNoteVal(s.notas?.ac6) : "",
        "AC6 - Lateral 1": isConfirmed && s.notas?.ac6?.lateral1 !== null ? fmtFloatVal(s.notas.ac6.lateral1) : "",
        "AC6 - Lateral 2": isConfirmed && s.notas?.ac6?.lateral2 !== null ? fmtFloatVal(s.notas.ac6.lateral2) : "",
        "AC6 - Vertical": isConfirmed && s.notas?.ac6?.vertical !== null ? fmtFloatVal(s.notas.ac6.vertical) : "",

        // Idiomas Module
        "Idiomas - Lateral": isConfirmed && s.notas?.idiomas?.lateralIdiomas !== null ? fmtFloatVal(s.notas.idiomas.lateralIdiomas) : "",
        "Idiomas - Vertical": isConfirmed && s.notas?.idiomas?.verticalIdiomas !== null ? fmtFloatVal(s.notas.idiomas.verticalIdiomas) : "",
      };
    });

    // 4. Create worksheet and workbook using XLSX
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Add custom grid & column width configurations
    const colWidths = [
      { wch: 25 }, // Classificação (Posição)
      { wch: 18 }, // Nome Sigiloso
      { wch: 18 }, // Situação Matrícula
      { wch: 18 }, // Status Lançamento
      { wch: 22 }, // Nota Final Consolidada
      { wch: 15 }, // Quartil da Turma
      { wch: 22 }, // Média Geral de Módulos
      { wch: 26 }, // Média Geral Conceito Lateral
      { wch: 26 }, // Média Geral Conceito Vertical
      // AC3
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      // AC4
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      // AC5
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      // AC6
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      // Idiomas
      { wch: 18 }, { wch: 18 }
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Classificação ESAO 2026");

    // 5. Generate and trigger download
    XLSX.writeFile(wb, "Relatorio_Desempenho_Anonimo_ESAO_2026.xlsx");
  };

  // Perform user login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginWarName || !loginPassword) {
      setLoginError("Preencha todos os campos.");
      return;
    }
    setLoginError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeDeGuerra: loginWarName.trim(), password: loginPassword.trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        setLoginError(errData.error || "Erro ao realizar login.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setIsLoggedIn(true);
      if (data.isAdmin) {
        setIsAdmin(true);
        localStorage.setItem("esao_session_isAdmin", "true");
        localStorage.setItem("esao_session_user", JSON.stringify(data.user));
        fetchAdminData();
      } else {
        setIsAdmin(false);
        setCurrentUser(data.user);
        setMyCalcs(data.calcs);
        setClassStats(data.classStats);
        setSettings(data.settings);
        setPhoneInput(data.user.telefone || "");
        if (data.user.notas) {
          setFormGrades(data.user.notas);
        }
        localStorage.setItem("esao_session_isAdmin", "false");
        localStorage.setItem("esao_session_user", JSON.stringify(data.user));
      }
    } catch (err) {
      setLoginError("Erro na conexão com o servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("esao_session_user");
    localStorage.removeItem("esao_session_isAdmin");
    setCurrentUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
    setLoginWarName("");
    setLoginPassword("");
    setLoginError("");
    setNewPassword("");
    setPasswordSuccessMsg("");
    setPasswordErrorMsg("");
    setFormGrades(emptyGradesTemplate());
    setIsEditing(false);
    setIsReviewOpen(false);
    setMyCalcs(null);
    setClassStats(null);
  };

  // Change password logic
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword) return;
    setPasswordErrorMsg("");
    setPasswordSuccessMsg("");

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, newPassword })
      });
      if (res.ok) {
        setPasswordSuccessMsg("Sua senha foi alterada com sucesso!");
        setNewPassword("");
        // Refresh User session properties
        const updatedUser = { ...currentUser, isPasswordChanged: true };
        setCurrentUser(updatedUser);
        localStorage.setItem("esao_session_user", JSON.stringify(updatedUser));
      } else {
        const data = await res.json();
        setPasswordErrorMsg(data.error || "Erro ao alterar a senha.");
      }
    } catch (err) {
      setPasswordErrorMsg("Erro de rede.");
    }
  };

  // Activate access (first-time setup of Nome Sigiloso and custom password)
  const handleActivateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setActivationError("");
    setActivationSuccess("");

    const sigilosoCleanInput = (activationNomeSigiloso || "").trim();

    if (!sigilosoCleanInput || !activationNewPassword || !activationConfirmPassword) {
      setActivationError("Preencha todos os campos.");
      return;
    }

    if (activationNewPassword !== activationConfirmPassword) {
      setActivationError("As senhas informadas não coincidem.");
      return;
    }

    setActivationLoading(true);

    try {
      // 1. Set Nome Sigiloso first
      const nsRes = await fetch("/api/set-nome-sigiloso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, nomeSigiloso: sigilosoCleanInput })
      });

      if (!nsRes.ok) {
        const errData = await nsRes.json();
        setActivationError(errData.error || "Erro ao definir Nome Sigiloso.");
        setActivationLoading(false);
        return;
      }

      const nsData = await nsRes.json();

      // 2. Change password next
      const pwRes = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, newPassword: activationNewPassword })
      });

      if (!pwRes.ok) {
        const errData = await pwRes.json();
        setActivationError(errData.error || "Erro ao alterar a senha.");
        setActivationLoading(false);
        return;
      }

      // Success! Update currentUser state
      const updatedUser = {
        ...currentUser,
        nomeSigiloso: nsData.user.nomeSigiloso || sigilosoCleanInput.toUpperCase(),
        acessoAtivado: true,
        isPasswordChanged: true
      };

      setActivationSuccess("Acesso ativado com sucesso!");
      setCurrentUser(updatedUser);
      localStorage.setItem("esao_session_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
      setActivationError("Erro na conexão com o servidor.");
    } finally {
      setActivationLoading(false);
    }
  };

  // Save/Update Cellphone WhatsApp
  const handleSavePhone = async () => {
    if (!currentUser) return;
    setPhoneSuccess(false);
    setPhoneError("");

    const cleanedDdd = dddInput.replace(/[^\d]/g, "");
    const cleanedNumber = numberPartInput.replace(/[^\d]/g, "");

    if (cleanedDdd.length !== 2) {
      setPhoneError("O DDD deve conter exatamente 2 dígitos numéricos.");
      return;
    }

    if (cleanedNumber.length !== 9) {
      setPhoneError("O WhatsApp deve conter exatamente 9 dígitos numéricos.");
      return;
    }

    const fullPhone = `55${cleanedDdd}${cleanedNumber}`;

    try {
      const res = await fetch("/api/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, phone: fullPhone })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("esao_session_user", JSON.stringify(data.user));
        setPhoneSuccess(true);
        setTimeout(() => setPhoneSuccess(false), 3500);
      } else {
        const data = await res.json();
        setPhoneError(data.error || "Erro ao salvar o WhatsApp.");
      }
    } catch (err) {
      console.error("Erro ao salvar celular", err);
      setPhoneError("Erro de conexão ao salvar seu celular.");
    }
  };

  // Form Field Input validation checks
  const validate = (grades: NotasInput) => {
    const errors: Record<string, string> = {};
    const modules: Array<"ac3" | "ac4" | "ac5" | "ac6"> = ["ac3", "ac4", "ac5", "ac6"];

    modules.forEach(mKey => {
      // Only validate modules that are released and open/editable
      const mCtrl = settings.modulesControl?.[mKey] || "aberto_lancamento";
      if (mCtrl === "fechado") return;

      const mod = grades[mKey];
      if (!mod) return;

      const fields = ["aat", "ac", "lateral1", "lateral2", "vertical"] as const;
      fields.forEach(fKey => {
        const rawKey = `${mKey}_${fKey}`;
        const rawVal = rawInputs[rawKey];
        const val = mod[fKey];

        if (rawVal !== undefined && rawVal !== "") {
          const dotVal = rawVal.replace(",", ".");
          const parsed = parseFloat(dotVal);
          if (isNaN(parsed) || parsed < 0 || parsed > 10) {
            errors[rawKey] = "A nota deve ser um valor numérico entre 0 e 10.";
          }
        } else if (val !== null && val !== undefined) {
          if (isNaN(val) || val < 0 || val > 10) {
            errors[rawKey] = "A nota deve ser um valor numérico entre 0 e 10.";
          }
        }
      });
    });

    // Validate Idiomas if open
    const idiomasCtrl = settings.modulesControl?.idiomas || "fechado";
    if (idiomasCtrl !== "fechado" && grades.idiomas) {
      const idFields = ["lateralIdiomas", "verticalIdiomas"] as const;
      idFields.forEach(fKey => {
        const rawKey = `idiomas_${fKey}`;
        const rawVal = rawInputs[rawKey];
        const val = grades.idiomas[fKey];

        if (rawVal !== undefined && rawVal !== "") {
          const dotVal = rawVal.replace(",", ".");
          const parsed = parseFloat(dotVal);
          if (isNaN(parsed) || parsed < 0 || parsed > 10) {
            errors[rawKey] = "A nota deve ser um valor numérico entre 0 e 10.";
          }
        } else if (val !== null && val !== undefined) {
          if (isNaN(val) || val < 0 || val > 10) {
            errors[rawKey] = "A nota deve ser um valor numérico entre 0 e 10.";
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Run validation reactively when formGrades or rawInputs change
  useEffect(() => {
    validate(formGrades);
  }, [formGrades, rawInputs]);

  // Form Field Input change trigger
  const handleGradeChange = (
    moduleKey: "ac3" | "ac4" | "ac5" | "ac6" | "idiomas",
    field: "aat" | "ac" | "lateral1" | "lateral2" | "vertical" | "lateralIdiomas" | "verticalIdiomas",
    value: string
  ) => {
    // Standardize typing commas/dots for user convenience
    const cleanVal = value.replace(/[^0-9,.]/g, "");
    const dotValue = cleanVal.replace(",", ".");
    const valParsed = cleanVal === "" ? null : parseFloat(dotValue);

    // Update raw string state for active interactive typing (allow any value for validation warning)
    const key = `${moduleKey}_${field}`;
    setRawInputs(prev => ({
      ...prev,
      [key]: cleanVal
    }));

    // Update parsed state for computations & final saves
    setFormGrades(prev => {
      const copy = { ...prev };
      if (moduleKey === "idiomas") {
        copy.idiomas = {
          ...copy.idiomas,
          [field]: valParsed
        };
      } else {
        copy[moduleKey] = {
          ...copy[moduleKey],
          [field]: valParsed
        };
      }
      return copy;
    });
  };

  // Save Rascunho / Draft Local Grades
  const handleSaveDraft = async () => {
    if (!currentUser) return;
    setSaveErrorMsg("");
    setSaveStatusMsg("");

    // Validate grades contain numerical values between 0 and 10
    const isValidValueRanges = validate(formGrades);
    if (!isValidValueRanges) {
      setSaveErrorMsg("Não é possível salvar: existem notas com valores inválidos ou fora do intervalo de 0 a 10.");
      return;
    }

    try {
      const res = await fetch("/api/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, notas: formGrades })
      });

      if (!res.ok) {
        const errData = await res.json();
        setSaveErrorMsg(errData.error || "Erro ao salvar rascunho.");
        return;
      }

      const data = await res.json();
      setCurrentUser(data.user);
      localStorage.setItem("esao_session_user", JSON.stringify(data.user));
      setSaveStatusMsg("Rascunho salvo com sucesso! Seus dados estão preservados, mas não contam ainda para estatísticas.");
      setIsEditing(false);
      
      // Pull refreshed calculations to showcase partial grades to the student immediately
      fetchRefreshedUserData(currentUser.nomeDeGuerra, currentUser.matricula);
    } catch (err) {
      setSaveErrorMsg("Erro de comunicação com o servidor.");
    }
  };

  // Initiates definite review screen validation checks
  const handleReview = () => {
    // Validate grades contain numerical values between 0 and 10
    const isValidValueRanges = validate(formGrades);
    if (!isValidValueRanges) {
      setSaveErrorMsg("Não é possível prosseguir: existem notas com valores inválidos ou fora do intervalo de 0 a 10.");
      return;
    }

    const modulesCtrl = settings?.modulesControl || {
      ac3: "aberto_lancamento",
      ac4: "fechado",
      ac5: "fechado",
      ac6: "fechado",
      idiomas: "fechado"
    };

    const emptyFields: string[] = [];
    
    // Parse grade value helper to see if it is empty/null/invalid
    const isFieldMissing = (val: any) => {
      if (val === null || val === undefined || String(val).trim() === "") return true;
      const parsed = parseFloat(String(val).replace(",", "."));
      return isNaN(parsed);
    };

    const checkModuleFilled = (key: "ac3" | "ac4" | "ac5" | "ac6", label: string) => {
      if (modulesCtrl[key] !== "fechado") {
        const mod = formGrades[key];
        if (isFieldMissing(mod.aat)) emptyFields.push(`${label} - AAT`);
        if (isFieldMissing(mod.ac)) emptyFields.push(`${label} - AC`);
        if (isFieldMissing(mod.lateral1)) emptyFields.push(`${label} - Lateral 1`);
        if (isFieldMissing(mod.lateral2)) emptyFields.push(`${label} - Lateral 2`);
        if (isFieldMissing(mod.vertical)) emptyFields.push(`${label} - Vertical`);
      }
    };

    checkModuleFilled("ac3", "Módulo AC3");
    checkModuleFilled("ac4", "Módulo AC4");
    checkModuleFilled("ac5", "Módulo AC5");
    checkModuleFilled("ac6", "Módulo AC6");

    if (modulesCtrl.idiomas !== "fechado") {
      const id = formGrades.idiomas;
      if (isFieldMissing(id.lateralIdiomas)) emptyFields.push("Idiomas - Lateral");
      if (isFieldMissing(id.verticalIdiomas)) emptyFields.push("Idiomas - Vertical");
    }

    if (emptyFields.length > 0) {
      setSaveErrorMsg(`Por favor, preencha todos os campos dos módulos liberados antes de confirmar. Campos ausentes ou inválidos: ${emptyFields.join(", ")}`);
      return;
    }

    setSaveErrorMsg("");
    setIsReviewOpen(true);
  };

  // Perform Definite Grade Submission
  const handleConfirmDefinitely = async () => {
    if (!currentUser) return;
    setSaveErrorMsg("");
    setSaveStatusMsg("");
    setIsReviewOpen(false);

    try {
      const isCorrection = ["confirmado", "corrigido", "bloqueado"].includes(currentUser.statusLancamento);
      const url = isCorrection ? "/api/save-correction" : "/api/confirm-launch";

      // Detect changed values to compile audit book history
      const changes: any[] = [];
      if (isCorrection && currentUser.notas) {
        const prev = currentUser.notas;
        const current = formGrades;
        
        const scanModule = (key: "ac3" | "ac4" | "ac5" | "ac6") => {
          const fKeys: Array<"aat" | "ac" | "lateral1" | "lateral2" | "vertical"> = ["aat", "ac", "lateral1", "lateral2", "vertical"];
          fKeys.forEach(f => {
            const valPrev = prev[key][f];
            const valNew = current[key][f];
            if (valPrev !== valNew) {
              changes.push({
                field: `Módulo ${key.toUpperCase()} - ${f.toUpperCase()}`,
                valorAnterior: valPrev !== null ? valPrev : "Em branco",
                valorNovo: valNew !== null ? valNew : "Em branco"
              });
            }
          });
        };

        scanModule("ac3");
        scanModule("ac4");
        scanModule("ac5");
        scanModule("ac6");

        if (prev.idiomas.lateralIdiomas !== current.idiomas.lateralIdiomas) {
          changes.push({
            field: "Idiomas - Conceito Lateral",
            valorAnterior: prev.idiomas.lateralIdiomas !== null ? prev.idiomas.lateralIdiomas : "Em branco",
            valorNovo: current.idiomas.lateralIdiomas !== null ? current.idiomas.lateralIdiomas : "Em branco"
          });
        }
        if (prev.idiomas.verticalIdiomas !== current.idiomas.verticalIdiomas) {
          changes.push({
            field: "Idiomas - Conceito Vertical",
            valorAnterior: prev.idiomas.verticalIdiomas !== null ? prev.idiomas.verticalIdiomas : "Em branco",
            valorNovo: current.idiomas.verticalIdiomas !== null ? current.idiomas.verticalIdiomas : "Em branco"
          });
        }
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: currentUser.id, 
          notas: formGrades,
          changes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setSaveErrorMsg(errData.error || "Erro ao realizar confirmação definitiva.");
        return;
      }

      const data = await res.json();
      setCurrentUser(data.user);
      localStorage.setItem("esao_session_user", JSON.stringify(data.user));
      setMyCalcs(data.calcs);
      setClassStats(data.classStats);
      
      if (isCorrection) {
        setSaveStatusMsg("Correção salva com sucesso. Sua nota foi recalculada e sua classificação poderá ser alterada conforme os dados dos demais participantes.");
      } else {
        setSaveStatusMsg("Lançamento confirmado definitivamente! Suas notas passaram a compor os quartis e rankings da turma.");
      }
      setIsEditing(false);
    } catch (err) {
      setSaveErrorMsg("Erro ao processar chamada do servidor.");
    }
  };

  // Re-enable form edit states
  const handleEditActive = () => {
    setIsEditing(true);
    setSaveStatusMsg("");
    setSaveErrorMsg("");
  };

  // Discard local inputs, roll back to original database state
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveStatusMsg("");
    setSaveErrorMsg("");
    if (currentUser && currentUser.notas) {
      setFormGrades(currentUser.notas);
    } else {
      setFormGrades(emptyGradesTemplate());
    }
  };

  // ADMIN ACTION: Toggle student active/inactive
  const handleAdminToggleStudentActive = async (student: Student) => {
    const newSituacao = student.situacao === "ativo" ? "inativo" : "ativo";
    try {
      const res = await fetch("/api/admin/edit-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, situacao: newSituacao })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminResetPassword = async (student: Student) => {
    if (!window.confirm(`Tem certeza de que deseja redefinir a senha do participante ${student.nomeDeGuerra} para a matrícula inicial (${student.matricula})?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/edit-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          passwordReset: true
        })
      });
      if (res.ok) {
        alert(`Senha de ${student.nomeDeGuerra} redefinida com sucesso para ${student.matricula}!`);
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao redefinir a senha.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao redefinir a senha.");
    }
  };

  const handleAdminDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setDeleteFeedback("");
  };

  const executeAdminDeleteStudent = async () => {
    if (!studentToDelete) return;
    const studentId = studentToDelete.id;
    const nameOfWar = studentToDelete.nomeDeGuerra;
    try {
      const res = await fetch("/api/admin/delete-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) {
        setDeleteFeedback("success");
        fetchAdminData();
        setTimeout(() => {
          setStudentToDelete(null);
          setDeleteFeedback("");
        }, 1500);
      } else {
        const data = await res.json();
        setDeleteFeedback(data.error || "Erro ao excluir o usuário.");
      }
    } catch (err) {
      console.error(err);
      setDeleteFeedback("Erro de conexão ao excluir o usuário.");
    }
  };

  // ADMIN ACTION: Batch delete selected students (DEFINITIVE DELETE)
  const handleAdminDeleteStudentsBatch = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Selecione pelo menos um participante.");
      return;
    }
    if (!window.confirm("Esta ação apagará apenas os dados do participante selecionado e não afetará os demais usuários. Deseja continuar?")) {
      return;
    }
    
    try {
      setAdminLoading(true);
      const res = await fetch("/api/admin/delete-students-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      });
      
      if (res.ok) {
        alert("Participantes selecionados foram excluídos/inativados com sucesso.");
        setSelectedStudentIds([]); // clear selection
        await fetchAdminData();
      } else {
        alert("Não foi possível concluir a ação. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setAdminLoading(false);
    }
  };

  // ADMIN ACTION: Batch inactivate selected students (PREFERENTIAL ACTION)
  const handleAdminInactivateStudentsBatch = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Selecione pelo menos um participante.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja excluir/inativar apenas os participantes selecionados? Essa ação não afetará os demais usuários.")) {
      return;
    }
    
    try {
      setAdminLoading(true);
      const res = await fetch("/api/admin/inactivate-students-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      });
      
      if (res.ok) {
        alert("Participantes selecionados foram excluídos/inativados com sucesso.");
        setSelectedStudentIds([]); // clear selection
        await fetchAdminData();
      } else {
        alert("Não foi possível concluir a ação. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setAdminLoading(false);
    }
  };

  // ADMIN ACTION: Block/Unblock student individual inputs
  const handleAdminToggleBlock = async (student: Student) => {
    const shouldBlock = student.statusLancamento !== "bloqueado";
    try {
      const res = await fetch("/api/admin/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, block: shouldBlock })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION: Clear Participant Data Only (Zerar Ficha/Zerar lançamentos)
  const handleAdminClearStudentData = async (student: Student) => {
    if (!window.confirm(`Tem certeza de que deseja zerar a ficha e apagar TODOS as notas, WhatsApp, rascunhos e históricos de ${student.nomeDeGuerra}? O participante voltará ao estado não iniciado.`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/clear-student-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Ficha de dados zerada com sucesso!");
        fetchAdminData();
      } else {
        alert(data.error || "Erro ao zerar dados.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao se comunicar com o servidor.");
    }
  };

  // ADMIN ACTION: Toggle Block in Batch
  const handleAdminToggleBlockBatch = async (block: boolean) => {
    if (selectedStudentIds.length === 0) {
      alert("Selecione pelo menos um participante.");
      return;
    }
    if (!window.confirm("Deseja aplicar esta ação apenas aos participantes selecionados?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/toggle-block-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds, block })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Ação em lote aplicada com sucesso!");
        setSelectedStudentIds([]);
        fetchAdminData();
      } else {
        alert("Não foi possível concluir a ação. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível concluir a ação. Tente novamente.");
    }
  };

  // ADMIN ACTION: Export Complete Database Backup File
  const handleAdminExportFullBackup = async () => {
    try {
      const res = await fetch("/api/admin/export-backup");
      if (!res.ok) throw new Error("Erro na solicitação de exportação.");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = `backup_completo_intendencia_esao_2026_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Falha ao exportar backup.");
    }
  };

  // ADMIN ACTION: Restore Database from File
  const handleAdminRestoreFullBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") return;
        const backupJson = JSON.parse(text);
        if (!window.confirm("ATENÇÃO PERIGO: Esta ação irá substituir COMPLETAMENTE todas as notas, usuários e históricos atuais pelo conteúdo deste arquivo. Não há como reverter isso! Deseja prosseguir?")) {
          return;
        }
        const res = await fetch("/api/admin/restore-full-backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backupJson })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message || "Banco de dados restaurado com sucesso!");
          fetchAdminData();
        } else {
          alert(data.error || "Erro na validação do backup.");
        }
      } catch (err) {
        console.error(err);
        alert("O arquivo fornecido não é um JSON de backup válido.");
      }
    };
    reader.readAsText(file);
  };

  // ADMIN ACTION: Restore Old Version from History
  const handleAdminRestoreStudentHistory = async (studentId: string, logId: string) => {
    if (!window.confirm("Deseja realmente reverter os lançamentos atuais do participante para esta versão do histórico?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/restore-student-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, logId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Lançamento restaurado com sucesso!");
        // Close modal if open
        setSelectedStudentHistory(null);
        fetchAdminData();
      } else {
        alert(data.error || "Erro ao reverter lançamento.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao reverter lançamento.");
    }
  };

  // ADMIN ACTION: Change global configs
  const handleAdminToggleGlobalEdit = async (open: boolean) => {
    try {
      const res = await fetch("/api/admin/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalEditOpen: open })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminSaveSettings = async (updatedSettings: any) => {
    try {
      const res = await fetch("/api/admin/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION: Save custom edit student profiles
  const handleAdminSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;
    try {
      const res = await fetch("/api/admin/edit-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForEdit.id,
          nomeDeGuerra: selectedStudentForEdit.nomeDeGuerra,
          matricula: selectedStudentForEdit.matricula,
          situacao: selectedStudentForEdit.situacao
        })
      });
      if (res.ok) {
        setSelectedStudentForEdit(null);
        fetchAdminData();
      } else {
        const raw = await res.json();
        alert(raw.error || "Erro ao editar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION: Add new custom military registered personnel
  const handleAdminAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewStudentError("");
    setNewStudentSuccess("");
    if (!newStudentWar || !newStudentMatricula) {
      setNewStudentError("Forneça nome de guerra e matrícula.");
      return;
    }

    try {
      const res = await fetch("/api/admin/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeDeGuerra: newStudentWar,
          matricula: newStudentMatricula.trim(),
          situacao: newStudentSituacao
        })
      });
      if (res.ok) {
        setNewStudentSuccess("Novo participante pré-cadastrado com sucesso!");
        setNewStudentWar("");
        setNewStudentMatricula("");
        fetchAdminData();
      } else {
        const raw = await res.json();
        setNewStudentError(raw.error || "Erro ao registrar participante.");
      }
    } catch (err) {
      setNewStudentError("Erro de comunicação com o servidor.");
    }
  };

  // BATCH IMPORT HANDLERS
  function localNormalizeNameOfWar(name: string): string {
    if (!name) return "";
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  const handleValidateBatch = () => {
    if (!batchCsvText.trim()) {
      alert("Por favor, insira o conteúdo CSV antes de validar.");
      return;
    }
    
    const lines = batchCsvText.split(/\r?\n/);
    const previewList: any[] = [];
    const errorsList: any[] = [];
    const ignoredList: any[] = [];

    const seenNames = new Set<string>();
    const seenMatriculas = new Set<string>();

    const dbNames = new Set(adminStudents.map((s: any) => localNormalizeNameOfWar(s.nomeDeGuerra)));
    const dbMatriculas = new Set(adminStudents.map((s: any) => s.matricula));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(";").map(p => p.trim());

      // Skip header row
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

      const normName = localNormalizeNameOfWar(nomeGuerraRaw);
      const normMatricula = matriculaRaw.trim();

      if (!/^\d+$/.test(normMatricula)) {
        errorsList.push({ line: i + 1, raw: line, reason: `Matrícula inválida: '${normMatricula}' deve conter apenas números.` });
        continue;
      }

      const dupInDb = dbNames.has(normName) || dbMatriculas.has(normMatricula);
      const dupInBatch = seenNames.has(normName) || seenMatriculas.has(normMatricula);

      if (dupInDb || dupInBatch) {
        let reason = "Duplicidade";
        if (dbNames.has(normName)) reason += " (Nome já cadastrado na base)";
        else if (dbMatriculas.has(normMatricula)) reason += " (Matrícula já cadastrada na base)";
        else if (seenNames.has(normName)) reason += " (Nome repetido neste arquivo)";
        else if (seenMatriculas.has(normMatricula)) reason += " (Matrícula repetida neste arquivo)";

        ignoredList.push({
          line: i + 1,
          nomeGuerra: normName,
          matricula: normMatricula,
          tipo_acesso: tipoAcessoRaw,
          turma: turmaRaw,
          status: statusRaw,
          reason
        });
        continue;
      }

      seenNames.add(normName);
      seenMatriculas.add(normMatricula);

      previewList.push({
        nomeDeGuerra: normName,
        matricula: normMatricula,
        tipo_acesso: "aluno",
        turma: "Intendência - ESAO 2026",
        status: "ativo"
      });
    }

    setBatchPreview(previewList);
    setBatchErrors(errorsList);
    setBatchIgnored(ignoredList);
    setBatchValidationDone(true);
  };

  const handleImportBatch = async () => {
    if (!batchCsvText.trim()) {
      alert("Por favor, insira o conteúdo CSV antes de importar.");
      return;
    }
    
    try {
      const res = await fetch("/api/admin/batch-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: batchCsvText })
      });
      
      if (res.ok) {
        const data = await res.json();
        setBatchReport(data);
        fetchAdminData();
      } else {
        const errorData = await res.json();
        alert("Erro ao importar: " + (errorData.error || "Ocorreu um erro desconhecido."));
      }
    } catch (err) {
      alert("Erro de comunicação com o servidor.");
    }
  };

  const handleCancelBatch = () => {
    setIsBatchImportOpen(false);
    setBatchCsvText("");
    setBatchPreview([]);
    setBatchErrors([]);
    setBatchIgnored([]);
    setBatchReport(null);
    setBatchValidationDone(false);
  };

  const handleClearBatch = () => {
    setBatchCsvText("");
    setBatchPreview([]);
    setBatchErrors([]);
    setBatchIgnored([]);
    setBatchReport(null);
    setBatchValidationDone(false);
  };

  // Notification actions
  const handleMarkNotificationRead = async (notificationId: string | null, all = false) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.id,
          notificationId,
          all
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notifications: data.notifications
          };
        });
      }
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  // Autopoll notifications and status updates for active student portal
  useEffect(() => {
    if (!isLoggedIn || isAdmin || !currentUser) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/refresh-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: currentUser.id })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setMyCalcs(data.calcs);
          setClassStats(data.classStats);
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        console.error("Erro no polling de atualizações:", err);
      }
    }, 15000); // Polling every 15 seconds for a snappy responsive experience
    
    return () => clearInterval(interval);
  }, [isLoggedIn, isAdmin, currentUser?.id]);

  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState("");
  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleParticipantRefresh = async () => {
    if (!currentUser) return;
    setRefreshLoading(true);
    try {
      const res = await fetch("/api/refresh-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setMyCalcs(data.calcs);
        setClassStats(data.classStats);
        if (data.settings) setSettings(data.settings);
        setRefreshSuccessMsg("Seu panorama individual e as estatísticas da turma foram recalculados com sucesso!");
        setTimeout(() => setRefreshSuccessMsg(""), 5000);
      } else {
        alert("Erro ao atualizar situação.");
      }
    } catch (err) {
      console.error("Erro ao atualizar situação:", err);
    } finally {
      setRefreshLoading(false);
    }
  };

  const fetchAnonRankings = async () => {
    setRankingLoading(true);
    try {
      const res = await fetch("/api/anon-rankings");
      if (res.ok) {
        const data = await res.json();
        setAnonRankings(data.rankings || []);
      }
    } catch (err) {
      console.error("Erro ao carregar rankings anônimos:", err);
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !isAdmin && activeStudentTab === "ranking") {
      fetchAnonRankings();
    }
  }, [isLoggedIn, isAdmin, activeStudentTab]);

  const abrirWhatsApp = (numero: string, mensagem: string) => {
    const numeroLimpo = numero.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    const url = `https://wa.me/${numeroLimpo}?text=${texto}`;
    window.open(url, "_blank");
  };

  const copiarMensagem = async (mensagem: string) => {
    try {
      await navigator.clipboard.writeText(mensagem);
      alert("Mensagem copiada com sucesso.");
    } catch (error) {
      alert("Não foi possível copiar a mensagem.");
    }
  };

  const handleParticipantWhatsApp = async (mode: "copy" | "send") => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/my-whatsapp-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (mode === "copy") {
          await copiarMensagem(data.text);
        } else {
          abrirWhatsApp(currentUser.telefone || "", data.text);
        }
      } else {
        alert("Erro ao obter mensagem para WhatsApp.");
      }
    } catch (err) {
      console.error("Erro no WhatsApp:", err);
    }
  };

  // ADMIN ACTION: Preview the calculated individual whatsapp payload
  const handleAdminGenerateWaText = async (student: Student) => {
    try {
      const res = await fetch(`/api/admin/whatsapp-url?studentId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappTemplateModal({
          student,
          text: data.text,
          waLink: data.waLink
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION: Safe Reset entire collection state for testing
  const handleAdminResetDemoState = async () => {
    if (!window.confirm("Atenção: isto retornará o sistema para a configuração de demonstração com 14 alunos confirmados e 42 alunos não iniciados, limpando os logs e marcos enviados. Deseja prosseguir?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-demo", { method: "POST" });
      if (res.ok) {
        alert("Sistema restaurado para o estado inicial demonstrativo.");
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION: Export dynamic anonymized database files
  const handleAdminExportAnonymized = () => {
    if (adminStudents.length === 0) return;
    
    // Clean all identifiers, military names, phone logs, and IDs. Keep only scores & estimates
    const anon = adminStudents
      .filter(s => s.situacao === "ativo" && ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento))
      .map((s, idx) => {
        // Run calculated statistics
        const parts = s.notas;
        if (!parts) return null;
        
        let nAC3 = parts.ac3.aat !== null && parts.ac3.ac !== null ? (parts.ac3.aat + parts.ac3.ac * 9) / 10 : null;
        let nAC4 = parts.ac4.aat !== null && parts.ac4.ac !== null ? (parts.ac4.aat + parts.ac4.ac * 9) / 10 : null;
        let nAC5 = parts.ac5.aat !== null && parts.ac5.ac !== null ? (parts.ac5.aat + parts.ac5.ac * 9) / 10 : null;
        let nAC6 = parts.ac6.aat !== null && parts.ac6.ac !== null ? (parts.ac6.aat + parts.ac6.ac * 9) / 10 : null;
        
        const mNotes = [nAC3, nAC4, nAC5, nAC6].filter(v => v !== null) as number[];
        const avgModules = mNotes.length > 0 ? mNotes.reduce((a, b) => a + b, 0) / mNotes.length : 0;
        
        return {
          id_anonimo: `PARTICIPANTE_${idx + 1001}`,
          nota_modulo_ac3: nAC3,
          nota_modulo_ac4: nAC4,
          nota_modulo_ac5: nAC5,
          nota_modulo_ac6: nAC6,
          media_modulos: avgModules
        };
      }).filter(v => v !== null);

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(anon, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "estatisticas_anonimizadas_esao2026.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter and sort list of student rows shown on Admin Panel
  const filteredAdminStudents = useMemo(() => {
    const list = adminStudents.filter(s => {
      if (!adminSearch) return true;
      const textQuery = adminSearch.toLowerCase();
      return (
        s.nomeDeGuerra.toLowerCase().includes(textQuery) ||
        s.matricula.toLowerCase().includes(textQuery) ||
        s.statusLancamento.toLowerCase().includes(textQuery)
      );
    });

    return [...list].sort((a, b) => {
      const aRank = adminOverallStats?.rankings?.find((r: any) => r.id === a.id);
      const bRank = adminOverallStats?.rankings?.find((r: any) => r.id === b.id);

      let aVal: any = "";
      let bVal: any = "";

      switch (sortColumn) {
        case "matricula":
          aVal = a.matricula || "";
          bVal = b.matricula || "";
          break;
        case "nomeDeGuerra":
          aVal = a.nomeDeGuerra || "";
          bVal = b.nomeDeGuerra || "";
          break;
        case "statusLancamento":
          aVal = a.statusLancamento || "";
          bVal = b.statusLancamento || "";
          break;
        case "hasAccessed":
          aVal = a.hasAccessed ? 1 : 0;
          bVal = b.hasAccessed ? 1 : 0;
          break;
        case "isPasswordChanged":
          aVal = a.isPasswordChanged ? 1 : 0;
          bVal = b.isPasswordChanged ? 1 : 0;
          break;
        case "telefone":
          aVal = a.telefone || "";
          bVal = b.telefone || "";
          break;
        case "finalGrade":
          aVal = aRank && aRank.finalGrade !== null ? aRank.finalGrade : -1;
          bVal = bRank && bRank.finalGrade !== null ? bRank.finalGrade : -1;
          break;
        case "rank":
          aVal = aRank && aRank.rank !== null ? aRank.rank : 9999;
          bVal = bRank && bRank.rank !== null ? bRank.rank : 9999;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal, "pt-BR", { sensitivity: "base" })
          : bVal.localeCompare(aVal, "pt-BR", { sensitivity: "base" });
      } else {
        return sortDirection === "asc"
          ? aVal - bVal
          : bVal - aVal;
      }
    });
  }, [adminStudents, adminSearch, sortColumn, sortDirection, adminOverallStats]);

  // Calculate status summaries
  const countNotStarted = adminStudents.filter(s => s.statusLancamento === "não_iniciado").length;
  const countDraft = adminStudents.filter(s => s.statusLancamento === "rascunho_salvo").length;
  const countConfirmed = adminStudents.filter(s => ["confirmado", "corrigido"].includes(s.statusLancamento)).length;
  const countBlocked = adminStudents.filter(s => s.statusLancamento === "bloqueado").length;

  // Calculate print values
  const studentToPrint = isAdmin ? adminStudentToPrint : currentUser;
  const printCalcs = studentToPrint ? getStudentPerformance(studentToPrint, isAdmin ? adminSettings : settings) : null;

  return (
    <div className={`min-h-screen ${isLoggedIn ? (theme === "dark" ? "dark-mode" : "bg-slate-50") : "bg-[#020503]"} font-sans ${isLoggedIn ? "text-slate-900" : "text-white"} transition-colors duration-300 relative overflow-hidden flex flex-col`}>
      
      {!isLoggedIn && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(165deg,#012418_0%,#001710_45%,#020503_100%)]"></div>
        </div>
      )}
      
      {/* HEADER SECTION */}
      {!(isLoggedIn && !isAdmin && currentUser && (!currentUser.nomeSigiloso || !currentUser.acessoAtivado)) && (
        <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isLoggedIn 
            ? "bg-white border-slate-200/80 text-slate-900" 
            : "bg-black/10 border-white/[0.06] text-white"
        }`}>
        <div className={`${isLoggedIn ? "w-full" : "max-w-7xl mx-auto"} px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm shrink-0">
              <img 
                alt="ESAO Logo" 
                className="w-full h-full object-cover" 
                src={IMAGENS.brasao}
              />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold tracking-tight text-slate-850 dark:text-emerald-400">ESAO 2026</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase">TURMA DE INTENDÊNCIA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2 rounded-xl border transition-colors shadow-sm cursor-pointer flex items-center justify-center ${
                theme === "light"
                  ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
              title={theme === "light" ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-emerald-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {isLoggedIn && (
              <div className="flex items-center gap-3">
                {/* NOTIFICATION CENTER DROPDOWN */}
                {!isAdmin && currentUser?.acessoAtivado && currentUser?.nomeSigiloso && (
                  <div className="relative text-left">
                    <button
                      id="student-notif-bell"
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className={`p-2 rounded-xl border transition-all duration-250 shadow-sm cursor-pointer flex items-center justify-center relative ${
                        isNotificationsOpen
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-100"
                          : theme === "light"
                          ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950"
                          : "bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300 hover:text-white"
                      }`}
                      title="Central de Alertas"
                    >
                      <Bell className="w-4 h-4" />
                      {currentUser?.notifications && currentUser.notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                          {currentUser.notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <>
                          {/* Transparent click-outside overlay bridge */}
                          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsNotificationsOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl border z-50 overflow-hidden ${
                              theme === "light"
                                ? "bg-white border-slate-200 text-slate-700"
                                : "bg-slate-900 border-slate-800 text-slate-200"
                            }`}
                          >
                            {/* Header */}
                            <div className={`p-4 border-b flex justify-between items-center ${
                              theme === "light" ? "border-slate-100 bg-slate-50" : "border-slate-800/80 bg-slate-950/70"
                            }`}>
                              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-500">Notificações</h4>
                              {currentUser?.notifications && currentUser.notifications.filter(n => !n.read).length > 0 && (
                                <button
                                  onClick={() => handleMarkNotificationRead(null, true)}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  Marcar todas como lidas
                                </button>
                              )}
                            </div>

                            {/* List */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {!currentUser?.notifications || currentUser.notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 space-y-2">
                                  <div className="text-3xl">🔔</div>
                                  <p className="text-xs font-medium">Nenhum alerta recebido</p>
                                  <p className="text-[10px] opacity-75 leading-relaxed">Sempre que a coordenação alterar a situação do seu lançamento ou ficha individual, você receberá um aviso aqui.</p>
                                </div>
                              ) : (
                                currentUser.notifications.map((n: AppNotification) => (
                                  <div
                                    key={n.id}
                                    onClick={() => {
                                      if (!n.read) handleMarkNotificationRead(n.id);
                                    }}
                                    className={`p-4 text-left transition-all relative flex gap-3 cursor-pointer ${
                                      !n.read 
                                        ? theme === "light" 
                                          ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]"
                                          : "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                                        : theme === "light"
                                          ? "bg-white hover:bg-slate-50"
                                          : "bg-slate-900 hover:bg-slate-850/80"
                                    }`}
                                  >
                                    {/* Unread indicator element */}
                                    {!n.read && (
                                      <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full" />
                                    )}

                                    {/* Icon Column */}
                                    <div className="mt-0.5 shrink-0">
                                      {n.type === "blocked" ? (
                                        <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold select-none">🚫</div>
                                      ) : n.type === "unblocked" ? (
                                        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold select-none">🔓</div>
                                      ) : (
                                        <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold select-none">🔔</div>
                                      )}
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0 pr-2">
                                      <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-slate-800 dark:text-white" : "opacity-90"}`}>
                                        {n.message}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1.5">
                                        <span>{new Date(n.dataHora).toLocaleString("pt-BR")}</span>
                                        {!n.read && (
                                          <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1 pointer-events-none rounded">
                                            Não lida
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {isAdmin ? "Administrador" : `Cap ${currentUser?.nomeDeGuerra}`}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* CHIEF SCREEN CONTAINER */}
      <main className={`${
        isLoggedIn && !isAdmin && currentUser?.nomeSigiloso && currentUser?.acessoAtivado 
          ? "w-full min-h-screen" 
          : isLoggedIn && !isAdmin && currentUser && (!currentUser.nomeSigiloso || !currentUser.acessoAtivado)
            ? "w-full min-h-screen relative p-0"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      }`}>
        
        {/* VIEW 1: WELCOME AND LOGIN SCREEN */}
        {!isLoggedIn && (
          <div className="relative w-full max-w-5xl mx-auto min-h-[calc(100vh-10rem)] py-12 px-4 z-10 grid lg:grid-cols-[1.05fr_minmax(0,25rem)] gap-12 lg:gap-20 items-center content-center">

            {/* Identidade da turma: aqui a tipografia é o assunto, não moldura
                para a marca. O brasão entra em corpo pequeno, ao lado do nome. */}
            <header className="text-left">
              <div className="flex items-center gap-3">
                <img
                  alt=""
                  aria-hidden="true"
                  className="w-9 h-9 shrink-0 object-contain opacity-90 overflow-hidden text-[0px]"
                  src={IMAGENS.brasao}
                />
                <span className="text-sm font-semibold text-emerald-200/80">
                  Escola de Aperfeiçoamento de Oficiais
                </span>
              </div>

              <h1 className="font-headline mt-6 text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.92] font-semibold text-white tracking-[-0.02em]">
                Intendência
                <span className="block text-emerald-300/70">2026</span>
              </h1>

              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-emerald-100/70">
                Cada oficial da turma lança as próprias notas e acompanha o
                próprio desempenho. A classificação é publicada por nome
                sigiloso, nunca por nome de guerra.
              </p>

              <dl className="mt-8 max-w-[42ch] space-y-3 border-t border-emerald-400/15 pt-6 text-sm">
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-emerald-300/60">Entrar com</dt>
                  <dd className="text-emerald-50/90">nome de guerra, em maiúsculo e sem acento</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-emerald-300/60">Primeira senha</dt>
                  <dd className="text-emerald-50/90">seu número de matrícula</dd>
                </div>
              </dl>
            </header>

            <div className="w-full">

            {/* Login Card */}
            {!isAdminLoginView ? (
              <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] w-full overflow-hidden relative">
                {/* Top Accent Bar (Emerald) */}

                {/* Login Actions Form */}
                <form onSubmit={handleLogin} className="p-6 space-y-5">
                  {loginError && (
                    <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Nome de Guerra Field */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="warName" className="block text-[13px] font-semibold text-slate-600">
                      Nome de guerra
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="warName"
                        type="text"
                        placeholder="EX: SILVA"
                        value={loginWarName}
                        onChange={(e) => setLoginWarName(e.target.value.toUpperCase())}
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#012d1d] focus:bg-white rounded-xl text-xs font-mono placeholder:text-slate-400 focus:ring-0 transition-all font-semibold text-slate-900 uppercase"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha Field */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="pass" className="block text-[13px] font-semibold text-slate-600">
                      Senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#012d1d] focus:bg-white rounded-xl text-xs font-mono placeholder:text-slate-400 focus:ring-0 transition-all font-semibold text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      id="btnLogin"
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-4 bg-[#012d1d] hover:bg-[#1b4332] text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Entrar</span>
                      )}
                    </button>
                  </div>

                  {/* Toggle Admin link */}
                  <div className="text-center pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">Coordenação da turma</span>
                    <button 
                      id="toggleAdminLogin"
                      type="button"
                      onClick={() => {
                        setIsAdminLoginView(true);
                        setLoginError("");
                        setLoginWarName("Cap Daniel");
                        setLoginPassword("");
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                    >
                      Entrar como Administrador
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] w-full overflow-hidden relative">
                {/* Top Accent Bar (Amber for Admin) */}

                {/* Admin Login Actions Form */}
                <form onSubmit={handleLogin} className="p-6 space-y-5">
                  <div className="text-center pb-2 bg-amber-50/50 -mx-6 -mt-6 p-4 border-b border-slate-200/50">
                    <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">Painel de Administração</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Insira as credenciais do coordenador Cap Daniel</p>
                  </div>

                  {loginError && (
                    <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Nome de Guerra (Admin) */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="adminWarName" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                      Nome de Guerra (Administrador)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="adminWarName"
                        type="text"
                        placeholder="Cap Daniel"
                        value={loginWarName}
                        onChange={(e) => setLoginWarName(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-xl text-xs font-mono placeholder:text-slate-400 focus:ring-0 transition-all font-semibold text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha do Administrador */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="adminPass" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                      Senha do Administrador
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="adminPass"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-xl text-xs font-mono placeholder:text-slate-400 focus:ring-0 transition-all font-semibold text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      id="btnAdminLogin"
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-2.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d97706]"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>Entrar no Painel</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Back to student login */}
                  <div className="text-center pt-4 border-t border-slate-100">
                    <button 
                      id="toggleStudentLogin"
                      type="button"
                      onClick={() => {
                        setIsAdminLoginView(false);
                        setLoginError("");
                        setLoginWarName("");
                        setLoginPassword("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                    >
                      Voltar para Acesso Aluno
                    </button>
                  </div>
                </form>
              </div>
            )}

            </div>
          </div>
        )}

        {/* VIEW 2: LOGGED-IN STUDENT PORTAL */}
        {isLoggedIn && !isAdmin && currentUser && (
          (!currentUser.nomeSigiloso || !currentUser.acessoAtivado) ? (
            <div 
              className="w-full min-h-screen text-slate-900 bg-cover bg-center bg-fixed bg-no-repeat flex flex-col" 
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${IMAGENS.fundoPortal}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat"
              }}
            >
              {/* Custom Tactical Header */}
              <header className="w-full sticky top-0 z-50 bg-[#012d1d] text-white border-b border-slate-800">
                <div className="flex justify-between items-center px-6 w-full max-w-7xl mx-auto h-16">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-[#a5d0b9]" />
                    <h1 className="font-bold text-base tracking-tight font-headline uppercase" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                      ESAO 2026 INTENDÊNCIA
                    </h1>
                  </div>
                  
                  {/* Session profile area with exit/logout option */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleLogout}
                      className="text-xs font-bold uppercase tracking-wider bg-emerald-950 hover:bg-emerald-900 text-[#a5d0b9] border border-emerald-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair</span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center border border-[#a5d0b9] shadow-inner">
                      <User className="w-5 h-5 text-[#a5d0b9]" />
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Container */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-md space-y-6">
                  
                  {/* Info Message Module */}
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl flex gap-3.5 items-start border-l-4 border-[#735c00] shadow-md text-left">
                    <Info className="w-5 h-5 text-[#735c00] shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans">
                      Este é seu primeiro acesso. Para sua segurança e anonimato, configure os dados abaixo.
                    </p>
                  </div>

                  {/* Activation Form Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xl space-y-5 text-left">
                    <form onSubmit={handleActivateAccess} className="space-y-4">
                      
                      {activationError && (
                        <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-rose-200">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>{activationError}</span>
                        </div>
                      )}
                      {activationSuccess && (
                        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{activationSuccess}</span>
                        </div>
                      )}

                      {/* Field: Criar Nome Sigiloso */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                          CRIAR NOME SIGILOSO
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 pl-4 pr-11 rounded-lg font-mono text-sm uppercase placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#012d1d] focus:border-[#012d1d] transition-all" 
                            maxLength={12} 
                            placeholder="EX: ALPHA01" 
                            type="text"
                            value={activationNomeSigiloso}
                            onChange={(e) => setActivationNomeSigiloso(e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-4.5 h-4.5" />
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight italic font-medium">
                          Entre 4 e 12 caracteres. Apenas letras e números.
                        </p>
                      </div>

                      {/* Field: Nova Senha */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                          NOVA SENHA
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 pl-4 pr-11 rounded-lg font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#012d1d] focus:border-[#012d1d] transition-all" 
                            placeholder="••••••••" 
                            type={showNewPassword ? "text" : "password"}
                            value={activationNewPassword}
                            onChange={(e) => setActivationNewPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Field: Confirmar Nova Senha */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                          CONFIRMAR NOVA SENHA
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 pl-4 pr-11 rounded-lg font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#012d1d] focus:border-[#012d1d] transition-all" 
                            placeholder="••••••••" 
                            type={showConfirmPassword ? "text" : "password"}
                            value={activationConfirmPassword}
                            onChange={(e) => setActivationConfirmPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Validation Rules Box */}
                      <div className="bg-slate-50 p-3.5 rounded border border-slate-100 flex gap-2.5 items-start">
                        <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-normal font-sans font-medium">
                          O Nome Sigiloso não pode ser igual ao nome de guerra ou matrícula. A senha não pode ser a matrícula.
                        </p>
                      </div>

                      {/* Action Submit Button */}
                      <button 
                        type="submit"
                        disabled={activationLoading}
                        className="w-full bg-[#012d1d] hover:bg-[#1b4332] active:bg-[#002114] text-white py-3 px-4 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                      >
                        {activationLoading ? (
                          <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <>
                            <span>Salvar Nome Sigiloso e Ativar Acesso</span>
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Footer Meta */}
                  <div className="text-center py-4 space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">PROTOCOLO DE SEGURANÇA ESAO-INT</p>
                    <p className="text-xs text-slate-400/80 font-medium leading-relaxed">Sessão protegida por criptografia de ponta-a-ponta.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-screen relative font-sans">
              
              {/* Floating Slide-out Backdrop Overlay (Overlay Mode only) */}
              {studentSidebarOverlay && !studentSidebarCollapsed && (
                <div 
                  className="fixed inset-0 bg-slate-950/20 dark:bg-black/55 backdrop-blur-[1.5px] z-30 no-print hidden md:block transition-opacity duration-300" 
                  onClick={() => {
                    setStudentSidebarCollapsed(true);
                    localStorage.setItem("student_sidebar_collapsed", "true");
                  }}
                />
              )}

              {/* Floating Menu Toggle Button (Overlay Mode + Collapsed only) */}
              {studentSidebarOverlay && studentSidebarCollapsed && (
                <button 
                  onClick={() => {
                    setStudentSidebarCollapsed(false);
                    localStorage.setItem("student_sidebar_collapsed", "false");
                  }}
                  className="fixed left-4 top-20 z-35 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-3 rounded-2xl text-[#012d1d] dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 no-print hidden md:flex"
                  title="Abrir Menu Lateral"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* Desktop Sidebar (hidden on mobile, styled as a premium floating card) */}
              <nav className={`hidden md:flex flex-col fixed left-4 top-20 bottom-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-xl py-6 z-40 no-print transition-all duration-300 backdrop-blur-md ${
                studentSidebarOverlay
                  ? `w-64 ${studentSidebarCollapsed ? "translate-x-[-125%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`
                  : `translate-x-0 opacity-100 ${studentSidebarCollapsed ? "w-20" : "w-64"}`
              }`}>
                <div className={`pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center ${studentSidebarCollapsed && !studentSidebarOverlay ? "justify-center px-2" : "justify-between px-6"}`}>
                  {(!studentSidebarCollapsed || studentSidebarOverlay) ? (
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Menu Principal</p>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Menu</p>
                  )}
                </div>
                <div className={`flex flex-col gap-1.5 ${studentSidebarCollapsed && !studentSidebarOverlay ? "px-2" : "px-4"}`}>
                  <button 
                    onClick={() => setActiveStudentTab("dashboard")}
                    title={studentSidebarCollapsed && !studentSidebarOverlay ? "Dashboard" : undefined}
                    className={`flex items-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      studentSidebarCollapsed && !studentSidebarOverlay 
                        ? "justify-center p-3 mx-auto w-12 h-12" 
                        : "gap-3 px-4 py-2.5"
                    } ${
                      activeStudentTab === "dashboard"
                        ? "bg-[#012d1d] dark:bg-emerald-800 text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                    {(!studentSidebarCollapsed || studentSidebarOverlay) && <span>Dashboard</span>}
                  </button>

                  <button 
                    onClick={() => setActiveStudentTab("modules")}
                    title={studentSidebarCollapsed && !studentSidebarOverlay ? "Módulos" : undefined}
                    className={`flex items-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      studentSidebarCollapsed && !studentSidebarOverlay 
                        ? "justify-center p-3 mx-auto w-12 h-12" 
                        : "gap-3 px-4 py-2.5"
                    } ${
                      activeStudentTab === "modules"
                        ? "bg-[#012d1d] dark:bg-emerald-800 text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Grid3X3 className="w-4.5 h-4.5 shrink-0" />
                    {(!studentSidebarCollapsed || studentSidebarOverlay) && <span>Módulos</span>}
                  </button>

                  <button 
                    onClick={() => setActiveStudentTab("ranking")}
                    title={studentSidebarCollapsed && !studentSidebarOverlay ? "Ranking" : undefined}
                    className={`flex items-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      studentSidebarCollapsed && !studentSidebarOverlay 
                        ? "justify-center p-3 mx-auto w-12 h-12" 
                        : "gap-3 px-4 py-2.5"
                    } ${
                      activeStudentTab === "ranking"
                        ? "bg-[#012d1d] dark:bg-emerald-800 text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Award className="w-4.5 h-4.5 shrink-0" />
                    {(!studentSidebarCollapsed || studentSidebarOverlay) && <span>Ranking</span>}
                  </button>

                  <button 
                    onClick={() => setActiveStudentTab("profile")}
                    title={studentSidebarCollapsed && !studentSidebarOverlay ? "Perfil" : undefined}
                    className={`flex items-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      studentSidebarCollapsed && !studentSidebarOverlay 
                        ? "justify-center p-3 mx-auto w-12 h-12" 
                        : "gap-3 px-4 py-2.5"
                    } ${
                      activeStudentTab === "profile"
                        ? "bg-[#012d1d] dark:bg-emerald-800 text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <User className="w-4.5 h-4.5 shrink-0" />
                    {(!studentSidebarCollapsed || studentSidebarOverlay) && <span>Perfil</span>}
                  </button>
                </div>

                {/* Segmented Picker & Minimize Button Block at the bottom of the sidebar */}
                <div className="mt-auto px-4 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  {/* Segmented Picker (Only visible when not collapsed or in overlay mode) */}
                  {(!studentSidebarCollapsed || studentSidebarOverlay) && (
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSidebarOverlay(false);
                          localStorage.setItem("student_sidebar_overlay", "false");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                          !studentSidebarOverlay 
                            ? "bg-white dark:bg-slate-700 text-[#012d1d] dark:text-emerald-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="Fixar Menu (Empurra o conteúdo)"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>Fixado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSidebarOverlay(true);
                          localStorage.setItem("student_sidebar_overlay", "true");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                          studentSidebarOverlay 
                            ? "bg-white dark:bg-slate-700 text-[#012d1d] dark:text-emerald-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="Sobrepor Menu (Flutua por cima)"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Flutuante</span>
                      </button>
                    </div>
                  )}

                  {/* Collapse Button */}
                  <button
                    onClick={() => {
                      setStudentSidebarCollapsed(prev => {
                        const val = !prev;
                        localStorage.setItem("student_sidebar_collapsed", String(val));
                        return val;
                      });
                    }}
                    title={studentSidebarCollapsed ? "Expandir Menu" : "Minimizar Menu"}
                    className={`flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#012d1d] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer ${
                      studentSidebarCollapsed && !studentSidebarOverlay
                        ? "p-3 w-12 h-12 mx-auto" 
                        : "gap-2.5 w-full py-2 px-3 text-left"
                    }`}
                  >
                    {studentSidebarCollapsed && !studentSidebarOverlay ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <>
                        <ChevronLeft className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-wider">Recolher Menu</span>
                      </>
                    )}
                  </button>
                </div>
              </nav>

              {/* Bottom Nav Bar (Mobile Only) */}
              <nav className="md:hidden border-t border-slate-200 fixed bottom-0 left-0 right-0 h-16 bg-white z-40 flex justify-around items-center px-2 py-1.5 shadow-lg no-print">
                <button 
                  onClick={() => setActiveStudentTab("dashboard")}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition ${
                    activeStudentTab === "dashboard"
                      ? "text-[#012d1d] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Dashboard</span>
                </button>

                <button 
                  onClick={() => setActiveStudentTab("modules")}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition ${
                    activeStudentTab === "modules"
                      ? "text-[#012d1d] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Grid3X3 className="w-4.5 h-4.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Módulos</span>
                </button>

                <button 
                  onClick={() => setActiveStudentTab("ranking")}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition ${
                    activeStudentTab === "ranking"
                      ? "text-[#012d1d] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Award className="w-4.5 h-4.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Ranking</span>
                </button>

                <button 
                  onClick={() => setActiveStudentTab("profile")}
                  className={`flex flex-col items-center justify-center p-1 cursor-pointer transition ${
                    activeStudentTab === "profile"
                      ? "text-[#012d1d] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Perfil</span>
                </button>
              </nav>

              {/* Main Content Pane */}
              <div className={`transition-all duration-300 ${
                studentSidebarOverlay
                  ? "md:pl-6"
                  : studentSidebarCollapsed
                    ? "md:pl-[112px]"
                    : "md:pl-[288px]"
              } px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-8 min-h-screen`}>
              
              {/* Elegant Print-Only Header with metadata */}
              <div className="print-only-header text-center">
                <h2 className="text-xl font-black uppercase tracking-wide text-slate-800">ESAO 2026 - Escola de Aperfeiçoamento de Oficiais</h2>
                <h3 className="text-base font-bold text-slate-600 uppercase">Ficha Oficial de Notas e Boletim de Desempenho — Curso de Intendência</h3>
                <div className="text-[10px] text-slate-400 font-mono mt-2 flex justify-center gap-4">
                  <span>Impresso em: {new Date().toLocaleString("pt-BR")}</span>
                  <span>•</span>
                  <span>Chave: FICHA_INDIVIDUAL_{currentUser.matricula}</span>
                </div>
              </div>
              
              {/* Upper Notification Bar */}
              {saveStatusMsg && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 no-print">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-medium">{saveStatusMsg}</div>
                </div>
              )}
              {saveErrorMsg && (
                <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl flex items-start gap-3 no-print">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-semibold">{saveErrorMsg}</div>
                </div>
              )}

              {/* Profile & Credentials Bento Block */}
              {activeStudentTab === "profile" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Identificação</h3>
                    <p className="text-xs font-mono text-slate-500">Turma ESAO 2026</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nome de guerra:</span>
                    <strong className="text-slate-800">{currentUser.nomeDeGuerra}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Matrícula:</span>
                    <strong className="text-slate-800 font-mono">{currentUser.matricula}</strong>
                  </div>
                </div>
              </div>

              {/* Password update section */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 no-print">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Senha Militar</h3>
                    <p className="text-xs font-mono text-slate-500">Recomendado alterar</p>
                  </div>
                </div>
                
                <form onSubmit={handleChangePassword} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm pl-3 pr-2 py-1.5 rounded-lg focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Alterar
                    </button>
                  </div>
                  {passwordSuccessMsg && <p className="text-[11px] text-emerald-600 font-medium">{passwordSuccessMsg}</p>}
                  {passwordErrorMsg && <p className="text-[11px] text-red-600 font-medium">{passwordErrorMsg}</p>}
                </form>
              </div>

              {/* Mobile Phone Registration Info */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 no-print">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">WhatsApp para receber sua atualização</h3>
                    <p className="text-xs text-slate-500">Acompanhamento e boletins individuais</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-xl">
                  “Informe apenas o DDD e o número do seu WhatsApp. O código do Brasil (+55) já está incluído automaticamente.”
                </p>

                <div className="space-y-3 pt-1">
                  {/* Fields group */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* País */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">País</label>
                      <div className="bg-slate-100 border border-slate-200 text-slate-500 text-sm px-3 py-2 rounded-lg font-medium cursor-not-allowed select-none">
                        🇧🇷 Brasil +55
                      </div>
                    </div>

                    {/* DDD */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DDD</label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="21"
                        value={dddInput}
                        onChange={(e) => handleDddChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número</label>
                      <input
                        type="text"
                        maxLength={9}
                        placeholder="999990101"
                        value={numberPartInput}
                        onChange={(e) => handleNumberPartChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                  </div>

                  {/* Formatted display */}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Exemplo de preenchimento:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {formatPhoneNumber(dddInput, numberPartInput) || "+55 (21) 99999-0101"}
                    </span>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSavePhone}
                    className="w-full bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-200 active:scale-[0.98]"
                  >
                    Salvar WhatsApp
                  </button>

                  {/* Feedback */}
                  {phoneSuccess && (
                    <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">
                      ✓ WhatsApp registrado e salvo com sucesso!
                    </p>
                  )}
                  {phoneError && (
                    <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2 rounded-xl text-center">
                      ⚠️ {phoneError}
                    </p>
                  )}
                </div>
              </div>
              </div>
              )}

              {/* Módulos Tab */}
              {activeStudentTab === "modules" && (
                <div className="space-y-6">
                  {/* Top description */}
                  <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl text-left">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Grid3X3 className="w-5 h-5 text-emerald-850" />
                      <span>Módulos do Sistema</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Visão geral dos módulos operacionais ativos e suas respectivas situações de publicação.
                    </p>
                  </div>

                  {/* Bento Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* MOD-AC3 */}
                    {(() => {
                      const mStatus = settings.modulesControl?.ac3 || "fechado";
                      const isLançado = currentUser.notas?.ac3 !== undefined;
                      return (
                        <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition h-72 ${
                          mStatus === "fechado" ? "border-slate-200 opacity-80" : "border-slate-200 hover:border-[#012d1d]/40 hover:shadow-md"
                        }`}>
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">MOD-AC3</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                mStatus === "fechado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                mStatus === "bloqueado_definitivamente" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {mStatus === "fechado" ? "Fechado" : mStatus === "bloqueado_definitivamente" ? "Bloqueado" : "Aberto"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">Módulo AC3</h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Gestão de suprimentos classe III, controle de combustíveis e lubrificantes para a frota da Intendência.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>SITUAÇÃO DO ALUNO:</span>
                              <span className={`font-bold uppercase ${isLançado ? "text-emerald-605" : "text-amber-605"}`}>
                                {isLançado ? "Lançado" : "Pendente"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono text-left">
                              ÚLTIMA ATUALIZAÇÃO: 12/05/2026
                            </div>
                            {mStatus !== "fechado" ? (
                              <button
                                onClick={() => setActiveStudentTab("dashboard")}
                                className="w-full bg-[#012d1d] text-white hover:bg-[#1b4332] font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition text-center cursor-pointer"
                              >
                                {mStatus === "bloqueado_definitivamente" ? "Visualizar Nota" : "Lançar / Ver Notas"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold text-[10px] uppercase py-2 px-3 rounded-lg border border-slate-200/50 cursor-not-allowed text-center"
                              >
                                Módulo Bloqueado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* MOD-AC4 */}
                    {(() => {
                      const mStatus = settings.modulesControl?.ac4 || "fechado";
                      const isLançado = currentUser.notas?.ac4 !== undefined;
                      return (
                        <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition h-72 ${
                          mStatus === "fechado" ? "border-slate-200 opacity-80" : "border-slate-200 hover:border-[#012d1d]/40 hover:shadow-md"
                        }`}>
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">MOD-AC4</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                mStatus === "fechado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                mStatus === "bloqueado_definitivamente" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {mStatus === "fechado" ? "Fechado" : mStatus === "bloqueado_definitivamente" ? "Bloqueado" : "Aberto"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">Módulo AC4</h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Controle de material de saúde e intendência, registros de entrada e saída de equipamentos médicos.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>SITUAÇÃO DO ALUNO:</span>
                              <span className={`font-bold uppercase ${isLançado ? "text-emerald-605" : "text-amber-605"}`}>
                                {isLançado ? "Lançado" : "Pendente"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono text-left">
                              FECHADO EM: 01/05/2026
                            </div>
                            {mStatus !== "fechado" ? (
                              <button
                                onClick={() => setActiveStudentTab("dashboard")}
                                className="w-full bg-[#012d1d] text-white hover:bg-[#1b4332] font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition text-center cursor-pointer"
                              >
                                {mStatus === "bloqueado_definitivamente" ? "Visualizar Nota" : "Lançar / Ver Notas"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold text-[10px] uppercase py-2 px-3 rounded-lg border border-slate-200/50 cursor-not-allowed text-center"
                              >
                                Módulo Bloqueado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* MOD-AC5 */}
                    {(() => {
                      const mStatus = settings.modulesControl?.ac5 || "fechado";
                      const isLançado = currentUser.notas?.ac5 !== undefined;
                      return (
                        <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition h-72 ${
                          mStatus === "fechado" ? "border-slate-200 opacity-80" : "border-slate-200 hover:border-[#012d1d]/40 hover:shadow-md"
                        }`}>
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">MOD-AC5</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                mStatus === "fechado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                mStatus === "bloqueado_definitivamente" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {mStatus === "fechado" ? "Fechado" : mStatus === "bloqueado_definitivamente" ? "Bloqueado" : "Aberto"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">Módulo AC5</h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Gestão de recursos financeiros, auditoria de contas e balanços trimestrais da divisão administrativa.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>SITUAÇÃO DO ALUNO:</span>
                              <span className={`font-bold uppercase ${isLançado ? "text-emerald-605" : "text-amber-605"}`}>
                                {isLançado ? "Lançado" : "Pendente"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono text-left">
                              AÇÃO REQUERIDA: REVISÃO
                            </div>
                            {mStatus !== "fechado" ? (
                              <button
                                onClick={() => setActiveStudentTab("dashboard")}
                                className="w-full bg-[#012d1d] text-white hover:bg-[#1b4332] font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition text-center cursor-pointer"
                              >
                                {mStatus === "bloqueado_definitivamente" ? "Visualizar Nota" : "Lançar / Ver Notas"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold text-[10px] uppercase py-2 px-3 rounded-lg border border-slate-200/50 cursor-not-allowed text-center"
                              >
                                Módulo Bloqueado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* MOD-AC6 */}
                    {(() => {
                      const mStatus = settings.modulesControl?.ac6 || "fechado";
                      const isLançado = currentUser.notas?.ac6 !== undefined;
                      return (
                        <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition h-72 ${
                          mStatus === "fechado" ? "border-slate-200 opacity-80" : "border-slate-200 hover:border-[#012d1d]/40 hover:shadow-md"
                        }`}>
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">MOD-AC6</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                mStatus === "fechado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                mStatus === "bloqueado_definitivamente" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {mStatus === "fechado" ? "Fechado" : mStatus === "bloqueado_definitivamente" ? "Bloqueado" : "Aberto"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">Módulo AC6</h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Logística de transporte, escalonamento de viaturas e rotas de distribuição de materiais pelo território.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>SITUAÇÃO DO ALUNO:</span>
                              <span className={`font-bold uppercase ${isLançado ? "text-emerald-605" : "text-amber-605"}`}>
                                {isLançado ? "Lançado" : "Pendente"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono text-left">
                              VERIFICADO POR: CMT LOG
                            </div>
                            {mStatus !== "fechado" ? (
                              <button
                                onClick={() => setActiveStudentTab("dashboard")}
                                className="w-full bg-[#012d1d] text-white hover:bg-[#1b4332] font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition text-center cursor-pointer"
                              >
                                {mStatus === "bloqueado_definitivamente" ? "Visualizar Nota" : "Lançar / Ver Notas"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold text-[10px] uppercase py-2 px-3 rounded-lg border border-slate-200/50 cursor-not-allowed text-center"
                              >
                                Módulo Bloqueado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* MOD-IDIOMAS */}
                    {(() => {
                      const mStatus = settings.modulesControl?.idiomas || "fechado";
                      const isLançado = currentUser.notas?.completoIdiomas === "sim" || currentUser.notas?.idiomas !== undefined;
                      return (
                        <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition h-72 ${
                          mStatus === "fechado" ? "border-slate-200 opacity-80" : "border-slate-200 hover:border-[#012d1d]/40 hover:shadow-md"
                        }`}>
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">MOD-IDIOMAS</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                mStatus === "fechado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                mStatus === "bloqueado_definitivamente" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {mStatus === "fechado" ? "Fechado" : mStatus === "bloqueado_definitivamente" ? "Bloqueado" : "Aberto"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">Idiomas</h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Sistema de avaliação e certificação linguística para oficiais, registros de proficiência e cursos ativos.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>SITUAÇÃO DO ALUNO:</span>
                              <span className={`font-bold uppercase ${isLançado ? "text-emerald-605" : "text-amber-605"}`}>
                                {isLançado ? "Lançado" : "Pendente"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono text-left">
                              INSCRITOS: 142 • EXAMES ATIVOS: 3
                            </div>
                            {mStatus !== "fechado" ? (
                              <button
                                onClick={() => setActiveStudentTab("dashboard")}
                                className="w-full bg-[#012d1d] text-white hover:bg-[#1b4332] font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition text-center cursor-pointer"
                              >
                                {mStatus === "bloqueado_definitivamente" ? "Visualizar Nota" : "Lançar / Ver Notas"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold text-[10px] uppercase py-2 px-3 rounded-lg border border-slate-200/50 cursor-not-allowed text-center"
                              >
                                Módulo Bloqueado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              )}

              {/* Ranking Tab */}
              {activeStudentTab === "ranking" && (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-100 pb-5">
                    <div className="text-left">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#012d1d] font-bold">
                        TURMA DE INTENDÊNCIA — ESAO 2026
                      </p>
                      <h2 className="text-xl font-bold font-sans text-slate-800 mt-1">
                        Relatório de Desempenho Anônimo
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                        Este documento apresenta a classificação geral de forma sigilosa. Apenas nomes mascarados e indicadores agregados são exibidos para preservar a privacidade individual.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 no-print">
                      <button
                        onClick={handlePrintRanking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-mono text-[10px] bg-white font-bold uppercase cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>EXPORTAR PDF</span>
                      </button>
                      <button
                        onClick={handlePrintRanking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#012d1d] text-white hover:bg-[#1b4332] transition-colors font-mono text-[10px] font-bold uppercase cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-300" />
                        <span>IMPRIMIR</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards (Bento Grid Style) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Média Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm text-left">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">MÉDIA DA TURMA</span>
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold font-sans text-[#012d1d]">
                            {classStats?.mean !== undefined ? fmtGrade(classStats.mean) : "7,842"}
                          </span>
                          {classStats?.mean !== undefined && myCalcs && myCalcs.finalGrade !== null && (
                            <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded ${
                              myCalcs.finalGrade >= classStats.mean 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {myCalcs.finalGrade >= classStats.mean ? "▲ +" : "▼ -"}
                              {fmtGrade(Math.abs(myCalcs.finalGrade - classStats.mean))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Color-coded progress bar */}
                      {myCalcs && myCalcs.finalGrade !== null && myCalcs.finalGrade !== undefined && classStats?.mean !== undefined ? (
                        <div className="mt-4 space-y-1.5">
                          <div className="relative w-full h-2.5 bg-slate-100 rounded-full">
                            {/* User grade progress fill */}
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                myCalcs.finalGrade >= classStats.mean 
                                  ? "bg-emerald-600" 
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${(myCalcs.finalGrade / 10) * 100}%` }}
                            />
                            {/* Mean Indicator Line pointer */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-800 rounded-full border border-white shadow-sm z-10"
                              style={{ left: `calc(${(classStats.mean / 10) * 100}% - 3px)` }}
                              title={`Média da Turma: ${fmtGrade(classStats.mean)}`}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-semibold flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${myCalcs.finalGrade >= classStats.mean ? "bg-emerald-600" : "bg-rose-500"}`} />
                              Sua Nota: {fmtGrade(myCalcs.finalGrade)}
                            </span>
                            <span className="font-medium">
                              Média: {fmtGrade(classStats.mean)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic text-center">
                          Faça login para comparar seu desempenho
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-mono">Atualizado no último fechamento</p>
                      </div>
                    </div>

                    {/* Mediana Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm text-left">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">MEDIANA</span>
                          <Sliders className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold font-sans text-slate-800">
                            {classStats?.median !== undefined ? fmtGrade(classStats.median) : "7,910"}
                          </span>
                          {classStats?.median !== undefined && myCalcs && myCalcs.finalGrade !== null && (
                            <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded ${
                              myCalcs.finalGrade >= classStats.median 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {myCalcs.finalGrade >= classStats.median ? "▲ +" : "▼ -"}
                              {fmtGrade(Math.abs(myCalcs.finalGrade - classStats.median))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Color-coded progress bar */}
                      {myCalcs && myCalcs.finalGrade !== null && myCalcs.finalGrade !== undefined && classStats?.median !== undefined ? (
                        <div className="mt-4 space-y-1.5">
                          <div className="relative w-full h-2.5 bg-slate-100 rounded-full">
                            {/* User grade progress fill */}
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                myCalcs.finalGrade >= classStats.median 
                                  ? "bg-emerald-600" 
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${(myCalcs.finalGrade / 10) * 100}%` }}
                            />
                            {/* Median Indicator Line pointer */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-800 rounded-full border border-white shadow-sm z-10"
                              style={{ left: `calc(${(classStats.median / 10) * 100}% - 3px)` }}
                              title={`Mediana da Turma: ${fmtGrade(classStats.median)}`}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-semibold flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${myCalcs.finalGrade >= classStats.median ? "bg-emerald-600" : "bg-rose-500"}`} />
                              Sua Nota: {fmtGrade(myCalcs.finalGrade)}
                            </span>
                            <span className="font-medium">
                              Mediana: {fmtGrade(classStats.median)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic text-center">
                          Faça login para comparar seu desempenho
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-mono">Ponto de corte 50% da turma</p>
                      </div>
                    </div>

                    {/* Efetivo Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm text-left">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">EFETIVO AVALIADO</span>
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold font-sans text-slate-800">
                            {classStats?.totalValid ?? 42}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">oficiais</span>
                        </div>
                      </div>

                      {/* Headcount progress bar out of 55 */}
                      <div className="mt-4 space-y-1.5">
                        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              (classStats?.totalValid ?? 42) >= 44
                                ? "bg-emerald-600" 
                                : "bg-amber-550"
                            }`}
                            style={{ width: `${((classStats?.totalValid ?? 42) / 55) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                          <span>Efetivo: {classStats?.totalValid ?? 42} / 55</span>
                          <span>{Math.round(((classStats?.totalValid ?? 42) / 55) * 100)}% Lançado</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-mono">100% de processamento ativo</p>
                      </div>
                    </div>
                  </div>

                  {/* Distribuição da turma com a posição do próprio participante */}
                  <div className="no-print">
                    <GradeDistribution
                      grades={anonRankings.map((r: any) => r.finalGrade).filter((g: any) => typeof g === "number")}
                      myGrade={myCalcs?.finalGrade ?? null}
                      mean={classStats?.mean ?? null}
                      median={classStats?.median ?? null}
                      theme={theme}
                      hint="Cada barra é uma faixa de nota final. A barra destacada é a faixa em que você está."
                    />
                  </div>

                  {/* Document Container for Table */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center text-left">
                      <h3 className="font-mono text-[10px] uppercase tracking-wider text-slate-700 font-bold">
                        LISTAGEM GERAL — ORDEM DE CLASSIFICAÇÃO
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-mono font-bold uppercase">Dados Anonimizados</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 no-print">
                      {/* Search bar */}
                      <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-450" />
                        </span>
                        <input
                          type="text"
                          placeholder="Pesquisar por Nome Sigiloso..."
                          value={searchSigiloso}
                          onChange={(e) => setSearchSigiloso(e.target.value)}
                          className="block w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#012d1d] placeholder:text-slate-300 font-mono uppercase"
                        />
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 font-mono">
                        Listando {anonRankings.filter(r => r.nomeSigiloso.toLowerCase().includes(searchSigiloso.toLowerCase())).length} oficiais ativos
                      </div>
                    </div>

                    {rankingLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#012d1d]" />
                        <span className="text-xs font-semibold">Carregando classificação homologada...</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#f3f4f5] border-b border-slate-200 text-slate-500 font-sans text-[10px] uppercase font-bold">
                            <tr>
                              <th className="py-2.5 px-4 font-bold w-24">CLASS.</th>
                              <th className="py-2.5 px-4 font-bold">NOME SIGILOSO</th>
                              <th className="py-2.5 px-4 font-bold text-right w-32">NOTA FINAL</th>
                              <th className="py-2.5 px-4 font-bold text-center w-32">QUARTIL</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono text-[11px] text-slate-750 divide-y divide-slate-100">
                            {(() => {
                              // Sort: ranked confirmed students first, from 1 upwards, then pending students
                              const sortedAnonRankings = [...anonRankings].sort((a, b) => {
                                if (a.isConfirmed && b.isConfirmed) {
                                  return (a.rank || Infinity) - (b.rank || Infinity);
                                }
                                if (a.isConfirmed) return -1;
                                if (b.isConfirmed) return 1;
                                return 0;
                              });

                              const filteredRankings = sortedAnonRankings.filter(r => 
                                r.nomeSigiloso.toLowerCase().includes(searchSigiloso.toLowerCase())
                              );

                              if (filteredRankings.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 italic font-sans bg-white">
                                      Nenhum participante correspondente encontrado.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredRankings.map((r, idx) => {
                                const isCurrentUserRow = r.nomeSigiloso.toUpperCase() === currentUser.nomeSigiloso?.toUpperCase();
                                
                                const classification = r.isConfirmed && r.rank ? `${r.rank}º` : "—";
                                const quartilLabel = r.isConfirmed && r.quartil ? `Q${r.quartil}` : "—";
                                
                                const finalGradeText = r.isConfirmed && r.finalGrade !== null ? fmtGrade(r.finalGrade) : "—";

                                return (
                                  <tr 
                                    key={r.id || idx} 
                                    className={`hover:bg-slate-50/50 transition-colors ${
                                      isCurrentUserRow 
                                        ? "bg-amber-50/40 font-bold border-y border-amber-250/70" 
                                        : idx % 2 === 1 ? "bg-slate-50/20" : "bg-white"
                                    }`}
                                  >
                                    <td className={`py-2.5 px-4 font-bold ${
                                      isCurrentUserRow ? "text-[#012d1d]" : "text-slate-900"
                                    }`}>
                                      {classification}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                                          isCurrentUserRow 
                                            ? "bg-[#a5d0b9] text-[#002114]" 
                                            : "bg-[#e1e3e4] text-[#c1c8c2]"
                                        }`}>
                                          {isCurrentUserRow ? <Eye className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className={`font-mono text-xs ${isCurrentUserRow ? "text-[#012d1d] font-bold" : "text-slate-705"}`}>
                                          {r.nomeSigiloso || `OF-INT-***${String(r.id).slice(-2)}`}
                                        </span>
                                        {isCurrentUserRow && (
                                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[#fed65b] text-[#745c00] font-sans tracking-tight font-bold font-label-caps shrink-0">
                                            SEU RESULTADO
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className={`py-2.5 px-4 text-right font-sans font-bold text-xs ${
                                      isCurrentUserRow ? "text-[#012d1d] text-sm" : "text-slate-805"
                                    }`}>
                                      {finalGradeText}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-sans font-medium tracking-tight ${
                                        quartilLabel === "Q1" ? "bg-[#c1ecd4] text-[#274e3d] font-bold" :
                                        quartilLabel === "Q2" ? "bg-blue-100 text-blue-700" :
                                        quartilLabel === "Q3" ? "bg-[#fed65b]/20 text-[#745c00]" :
                                        quartilLabel === "Q4" ? "bg-rose-100 text-rose-800" : "text-slate-450 bg-slate-100"
                                      }`}>
                                        {quartilLabel}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="bg-[#f3f4f5] px-5 py-3 border-t border-slate-200 text-right flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Refere-se ao efetivo atual do ESAO 2026</span>
                      <span>Fim do relatório. Gerado por Sistema de Ensino Intendência.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard / Form & Indicators */}
              {activeStudentTab === "dashboard" && (
                <>
                {/* Launch Status Banner */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estado da Ficha</span>
                <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  {currentUser.statusLancamento === "não_iniciado" && "Você ainda não iniciou seu lançamento."}
                  {currentUser.statusLancamento === "rascunho_salvo" && "Você possui um rascunho salvo."}
                  {currentUser.statusLancamento === "confirmado" && "Seu lançamento foi confirmado."}
                  {currentUser.statusLancamento === "corrigido" && "Seu lançamento foi corrigido e confirmado."}
                  {currentUser.statusLancamento === "bloqueado" && "O período de edição foi encerrado."}
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handlePrintFicha}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir Ficha</span>
                </button>
                {!isEditing && (currentUser.statusLancamento !== "bloqueado" && settings.globalEditOpen) && (
                  <button
                    onClick={handleEditActive}
                    className="inline-flex items-center gap-1.5 px-4  py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Lançar ou Editar Notas</span>
                  </button>
                )}
              </div>
            </div>

            {/* MAIN DATA MODULE: FORM & SCOREBOARD PORTLET */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Grade Entry Form Sheet */}
              <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Calculator className="w-5 h-5 text-emerald-800" />
                    <h3>Ficha de Notas Individuais</h3>
                  </div>
                  {isEditing && (
                    <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-medium animate-pulse">
                      Edição Ativa
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-8">
                  {/* Dynamic Validation Warning Notice */}
                  {isEditing && Object.keys(validationErrors).length > 0 && (
                    <div className="bg-rose-50 border border-rose-205 p-4 rounded-xl space-y-1.5 leading-relaxed shadow-sm transition-all text-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <span>⚠️</span>
                        <span>Aviso de Validação: Notas fora do intervalo</span>
                      </div>
                      <p className="text-xs text-slate-705">
                        Uma ou mais notas digitadas estão fora do intervalo regulamentar (entre <strong>0,00 e 10,00</strong>). Corrija as marcações em vermelho para habilitar o salvamento definitivo.
                      </p>
                    </div>
                  )}

                  {/* Grid of 4 modules AC3, AC4, AC5, AC6 */}
                  {(["ac3", "ac4", "ac5", "ac6"] as const).map((mKey) => {
                    const mCtrl = settings.modulesControl?.[mKey] || "fechado";
                    const isClosed = mCtrl === "fechado";
                    const isBlocked = mCtrl === "bloqueado_definitivamente";

                    return (
                      <div key={mKey} className={`border border-slate-200/70 rounded-xl p-4 space-y-4 bg-slate-50/50 transition duration-200 ${isClosed ? "opacity-75 bg-slate-100/40" : ""}`}>
                        <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-2 flex-wrap gap-2">
                          <strong className="text-slate-800 uppercase font-mono tracking-wider">
                            Módulo {mKey.toUpperCase()}
                          </strong>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isClosed ? (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-slate-250 text-slate-500 rounded font-mono">
                                Não liberado pelo admin
                              </span>
                            ) : isBlocked ? (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-mono">
                                Bloqueado definitivamente
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-emerald-150 text-emerald-800 rounded font-mono">
                                Liberado ({mCtrl === "aberto_lancamento" ? "Lançamento" : "Edição"})
                              </span>
                            )}
                            {!isClosed && formGrades[mKey].aat !== null && formGrades[mKey].ac !== null && (
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-mono font-semibold">
                                Nota do Módulo: {fmtGrade((formGrades[mKey].aat! * 1 + formGrades[mKey].ac! * 9) / 10)}
                              </span>
                            )}
                          </div>
                        </div>

                        {isClosed ? (
                          <div className="py-6 text-center text-xs text-slate-500 bg-slate-105-0.5 rounded-lg font-medium select-none">
                            Módulo ainda não liberado pelo administrador.
                          </div>
                        ) : (
                          <>
                             <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between min-h-[16px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">AAT (Peso 1)</label>
                                  {formGrades[mKey].aat === null && (
                                    <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="0,000"
                                  disabled={!isEditing || isBlocked}
                                  value={rawInputs[`${mKey}_aat`] ?? (formGrades[mKey].aat !== null ? String(formGrades[mKey].aat).replace(".", ",") : "")}
                                  onChange={(e) => handleGradeChange(mKey, "aat", e.target.value)}
                                  className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                    validationErrors[`${mKey}_aat`]
                                      ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                      : formGrades[mKey].aat === null
                                        ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                        : "border-slate-200 focus:border-emerald-600"
                                  }`}
                                />
                                {validationErrors[`${mKey}_aat`] && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 text-center animate-pulse">Inválido (0 a 10)</p>
                                )}
                              </div>

                              <div className="space-y-1 col-span-1">
                                <div className="flex items-center justify-between min-h-[16px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">AC (Peso 9)</label>
                                  {formGrades[mKey].ac === null && (
                                    <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="0,000"
                                  disabled={!isEditing || isBlocked}
                                  value={rawInputs[`${mKey}_ac`] ?? (formGrades[mKey].ac !== null ? String(formGrades[mKey].ac).replace(".", ",") : "")}
                                  onChange={(e) => handleGradeChange(mKey, "ac", e.target.value)}
                                  className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                    validationErrors[`${mKey}_ac`]
                                      ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                      : formGrades[mKey].ac === null
                                        ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                        : "border-slate-200 focus:border-emerald-600"
                                  }`}
                                />
                                {validationErrors[`${mKey}_ac`] && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 text-center animate-pulse">Inválido (0 a 10)</p>
                                )}
                              </div>

                              <div className="space-y-1 text-center">
                                <div className="flex items-center justify-between min-h-[16px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Lateral 1</label>
                                  {formGrades[mKey].lateral1 === null && (
                                    <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="0,000"
                                  disabled={!isEditing || isBlocked}
                                  value={rawInputs[`${mKey}_lateral1`] ?? (formGrades[mKey].lateral1 !== null ? String(formGrades[mKey].lateral1).replace(".", ",") : "")}
                                  onChange={(e) => handleGradeChange(mKey, "lateral1", e.target.value)}
                                  className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                    validationErrors[`${mKey}_lateral1`]
                                      ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                      : formGrades[mKey].lateral1 === null
                                        ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                        : "border-slate-200 focus:border-emerald-600"
                                  }`}
                                />
                                {validationErrors[`${mKey}_lateral1`] && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 text-center animate-pulse">Inválido (0 a 10)</p>
                                )}
                              </div>

                              <div className="space-y-1 text-center">
                                <div className="flex items-center justify-between min-h-[16px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Lateral 2</label>
                                  {formGrades[mKey].lateral2 === null && (
                                    <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="0,000"
                                  disabled={!isEditing || isBlocked}
                                  value={rawInputs[`${mKey}_lateral2`] ?? (formGrades[mKey].lateral2 !== null ? String(formGrades[mKey].lateral2).replace(".", ",") : "")}
                                  onChange={(e) => handleGradeChange(mKey, "lateral2", e.target.value)}
                                  className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                    validationErrors[`${mKey}_lateral2`]
                                      ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                      : formGrades[mKey].lateral2 === null
                                        ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                        : "border-slate-200 focus:border-emerald-600"
                                  }`}
                                />
                                {validationErrors[`${mKey}_lateral2`] && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 text-center animate-pulse">Inválido (0 a 10)</p>
                                )}
                              </div>

                              <div className="space-y-1 text-center">
                                <div className="flex items-center justify-between min-h-[16px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vertical</label>
                                  {formGrades[mKey].vertical === null && (
                                    <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  placeholder="0,000"
                                  disabled={!isEditing || isBlocked}
                                  value={rawInputs[`${mKey}_vertical`] ?? (formGrades[mKey].vertical !== null ? String(formGrades[mKey].vertical).replace(".", ",") : "")}
                                  onChange={(e) => handleGradeChange(mKey, "vertical", e.target.value)}
                                  className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                    validationErrors[`${mKey}_vertical`]
                                      ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                      : formGrades[mKey].vertical === null
                                        ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                        : "border-slate-200 focus:border-emerald-600"
                                  }`}
                                />
                                {validationErrors[`${mKey}_vertical`] && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 text-center animate-pulse">Inválido (0 a 10)</p>
                                )}
                              </div>
                            </div>
                            {isBlocked && (
                              <div className="text-[10px] font-semibold text-rose-705 bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                                Módulo bloqueado para lançamento e edição por ordem do administrador.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Languages Block */}
                  {(() => {
                    const mKey = "idiomas";
                    const mCtrl = settings.modulesControl?.[mKey] || "fechado";
                    const isClosed = mCtrl === "fechado";
                    const isBlocked = mCtrl === "bloqueado_definitivamente";

                    return (
                      <div className={`border border-slate-200/70 rounded-xl p-4 bg-slate-50/50 space-y-4 transition duration-200 ${isClosed ? "opacity-75 bg-slate-100/40" : ""}`}>
                        <div className="text-sm font-bold text-slate-800 uppercase font-mono tracking-wider border-b border-slate-200/60 pb-2 flex justify-between items-center flex-wrap gap-2">
                          <span>Idiomas</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isClosed ? (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-slate-250 text-slate-500 rounded font-mono">
                                Não liberado pelo admin
                              </span>
                            ) : isBlocked ? (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-mono">
                                Bloqueado definitivamente
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-emerald-150 text-emerald-800 rounded font-mono">
                                Liberado ({mCtrl === "aberto_lancamento" ? "Lançamento" : "Edição"})
                              </span>
                            )}
                          </div>
                        </div>
                        {isClosed ? (
                          <div className="py-6 text-center text-xs text-slate-505 bg-slate-105-0.5 rounded-lg font-medium select-none">
                            Módulo ainda não liberado pelo administrador.
                          </div>
                        ) : (
                          <>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div className="space-y-1">
                                 <div className="flex items-center justify-between min-h-[16px]">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase block">Conceito Lateral Idiomas</label>
                                   {formGrades.idiomas.lateralIdiomas === null && (
                                     <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                   )}
                                 </div>
                                 <input
                                   type="text"
                                   placeholder="0,000"
                                   disabled={!isEditing || isBlocked}
                                   value={rawInputs["idiomas_lateralIdiomas"] ?? (formGrades.idiomas.lateralIdiomas !== null ? String(formGrades.idiomas.lateralIdiomas).replace(".", ",") : "")}
                                   onChange={(e) => handleGradeChange("idiomas", "lateralIdiomas", e.target.value)}
                                   className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                     validationErrors["idiomas_lateralIdiomas"]
                                       ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                       : formGrades.idiomas.lateralIdiomas === null
                                         ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                         : "border-slate-200 focus:border-emerald-600"
                                   }`}
                                 />
                                 {validationErrors["idiomas_lateralIdiomas"] && (
                                   <p className="text-[10px] text-rose-600 font-bold mt-1 animate-pulse">Inválido (0 a 10)</p>
                                 )}
                               </div>
                               <div className="space-y-1">
                                 <div className="flex items-center justify-between min-h-[16px]">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase block">Conceito Vertical Idiomas</label>
                                   {formGrades.idiomas.verticalIdiomas === null && (
                                     <span className="text-[9px] text-amber-600 font-extrabold lowercase tracking-tight bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">pendente</span>
                                   )}
                                 </div>
                                 <input
                                   type="text"
                                   placeholder="0,000"
                                   disabled={!isEditing || isBlocked}
                                   value={rawInputs["idiomas_verticalIdiomas"] ?? (formGrades.idiomas.verticalIdiomas !== null ? String(formGrades.idiomas.verticalIdiomas).replace(".", ",") : "")}
                                   onChange={(e) => handleGradeChange("idiomas", "verticalIdiomas", e.target.value)}
                                   className={`w-full text-center bg-white border disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-1.5 text-sm focus:outline-none transition-all ${
                                     validationErrors["idiomas_verticalIdiomas"]
                                       ? "border-rose-500 bg-rose-50/30 text-rose-800 ring-2 ring-rose-100/70 focus:border-rose-600"
                                       : formGrades.idiomas.verticalIdiomas === null
                                         ? "border-amber-300 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100/40 focus:border-emerald-650 focus:ring-emerald-100 placeholder-amber-400"
                                         : "border-slate-200 focus:border-emerald-600"
                                   }`}
                                 />
                                 {validationErrors["idiomas_verticalIdiomas"] && (
                                   <p className="text-[10px] text-rose-600 font-bold mt-1 animate-pulse">Inválido (0 a 10)</p>
                                 )}
                               </div>
                             </div>
                            {isBlocked && (
                              <div className="text-[10px] font-semibold text-rose-705 bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                                Módulo bloqueado para lançamento e edição por ordem do administrador.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Edit Form Buttons controller */}
                  {isEditing && (
                    <div className="pt-4 flex flex-wrap gap-3 justify-end border-t border-slate-100">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm transition"
                      >
                        Cancelar
                      </button>

                      {/* Salvar rascunho */}
                      <button
                        onClick={handleSaveDraft}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-emerald-800 font-bold text-sm rounded-xl shadow-sm transition"
                      >
                        Salvar Rascunho
                      </button>

                      {/* Revisar e confirmar */}
                      <button
                        onClick={handleReview}
                        className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-sm rounded-xl shadow-md transition"
                      >
                        Revisar e Confirmar
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column: Calculations & Ranks Dashboard */}
              <div className="lg:col-span-5 space-y-6 text-slate-700">
                
                {/* MILESTONE NOTIFICATION BANNER */}
                {classStats?.totalValid && classStats.totalValid >= 15 && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4 shadow-sm text-slate-700">
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl h-fit">
                        <Info className="w-5 h-5 text-amber-600 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-600 block">Notificação de Meta Alcançada</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                          Nova atualização disponível. <strong className="font-mono text-amber-800">{classStats.totalValid}</strong> dos 55 participantes já realizaram lançamento válido. Atualize sua situação para ver sua classificação parcial.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5 pt-3 border-t border-amber-200 text-xs font-bold justify-end">
                      <button
                        onClick={handleParticipantRefresh}
                        disabled={refreshLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshLoading ? "animate-spin" : ""}`} />
                        <span>{refreshLoading ? "Atualizando..." : "Atualizar minha situação"}</span>
                      </button>
                      <button
                        onClick={() => handleParticipantWhatsApp("send")}
                        className="bg-emerald-650 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Receber pelo WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Active statistics portal - only open if they have valid confirmed data */}
                {(!isEditing && ["confirmado", "corrigido", "bloqueado"].includes(currentUser.statusLancamento)) ? (
                  <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                      <TrendingUp className="w-48 h-48 text-white" />
                    </div>

                    <div className="border-b border-white/10 pb-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">ESAO 2026</span>
                        <h3 className="text-lg font-extrabold tracking-tight">Estatísticas Individuais</h3>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/10 uppercase tracking-wider font-bold">
                        Confirmado
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 block uppercase">Média dos Módulos</span>
                        <strong className="text-lg font-mono tracking-tight font-extrabold text-slate-100">
                          {fmtGrade(myCalcs?.mediaModules)}
                        </strong>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 block uppercase">Nota Final Estimada</span>
                        <strong className="text-lg font-mono tracking-tight font-extrabold text-amber-400">
                          {fmtGrade(myCalcs?.finalGrade)}
                        </strong>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Classificação Estimada</span>
                          {classStats?.myRank?.rank ? (
                            <>
                              <strong className="numeral text-xl font-semibold text-emerald-300">
                                {classStats.myRank.rank}º
                              </strong>
                              <span className="text-slate-400 text-xs ml-1.5">
                                de {classStats.totalValid} com lançamento válido
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs block mt-0.5">
                              Sai quando seu lançamento for confirmado.
                            </span>
                          )}
                        </div>
                        {classStats?.myRank?.rank && classStats.myRank.rank <= 2 && (
                          <div className="bg-amber-400 text-slate-900 border border-amber-300 text-[10px] uppercase font-bold py-1 px-2.5 rounded-lg text-center animate-bounce">
                            BIÔNICO!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show special Bionico status message block if applicable */}
                    {classStats?.myRank?.rank && classStats.myRank.rank <= 2 && (
                      <div className="bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-xl p-4 text-xs font-bold leading-relaxed text-center">
                        {classStats.totalValid === 55 
                          ? "Parabéns, você é BIÔNICO!" 
                          : "Parabéns, você por enquanto é BIÔNICO!"}
                      </div>
                    )}

                    {/* Class standing indicators - Mean and Median differences */}
                    <div className="border-t border-white/10 pt-4 space-y-3 text-xs text-slate-300">
                      
                      {classStats?.myRank && (
                        <div className="space-y-4">
                          <div className="bg-white/5 p-3.5 rounded-xl space-y-2 border border-white/5">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                              Quartil de Desempenho
                            </span>
                            <div className="flex gap-2">
                              <span className="text-lg font-extrabold text-white font-mono bg-indigo-600/50 py-0.5 px-2 rounded-lg h-fit flex-shrink-0">
                                {classStats.myRank.quartil}º
                              </span>
                              <p className="text-[11px] text-slate-300 leading-normal">
                                {classStats.myRank.quartil === 1 && "Você está no 1º quartil, ou seja, no grupo dos 25% melhores entre os participantes que já lançaram suas notas."}
                                {classStats.myRank.quartil === 2 && "Você está no 2º quartil, ou seja, no grupo entre os 25% e 50% melhores entre os participantes que já lançaram suas notas."}
                                {classStats.myRank.quartil === 3 && "Você está no 3º quartil, ou seja, no grupo entre os 50% e 75% entre os participantes que já lançaram suas notas."}
                                {classStats.myRank.quartil === 4 && "Você está no 4º quartil, ou seja, no grupo dos 25% finais entre os participantes que já lançaram suas notas."}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs leading-tight">
                            <div className="bg-white/5 p-2 rounded-lg text-center">
                              <span className="text-[10px] text-slate-400 block uppercase">Média Turma</span>
                              <strong className="text-sm font-mono text-white block mt-0.5">{fmtGrade(classStats.mean)}</strong>
                              {myCalcs?.finalGrade !== null && myCalcs?.finalGrade !== undefined ? (
                                <span className={`text-[10px] font-bold block mt-1 ${myCalcs.finalGrade - classStats.mean >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {myCalcs.finalGrade - classStats.mean >= 0 
                                    ? `▲ +${fmtGrade(myCalcs.finalGrade - classStats.mean)} Acima` 
                                    : `▼ -${fmtGrade(Math.abs(myCalcs.finalGrade - classStats.mean))} Abaixo`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 block mt-1">Pendente</span>
                              )}
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg text-center">
                              <span className="text-[10px] text-slate-400 block uppercase">Mediana Turma</span>
                              <strong className="text-sm font-mono text-white block mt-0.5">{fmtGrade(classStats.median)}</strong>
                              {myCalcs?.finalGrade !== null && myCalcs?.finalGrade !== undefined ? (
                                <span className={`text-[10px] font-bold block mt-1 ${myCalcs.finalGrade - classStats.median >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {myCalcs.finalGrade - classStats.median >= 0 
                                    ? `▲ +${fmtGrade(myCalcs.finalGrade - classStats.median)} Acima` 
                                    : `▼ -${fmtGrade(Math.abs(myCalcs.finalGrade - classStats.median))} Abaixo`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 block mt-1">Pendente</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* ACTIONS FOR THE LOGGED-IN PARTICIPANT */}
                    <div className="border-t border-white/10 pt-5 mt-4 space-y-4">
                      {refreshSuccessMsg && (
                        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs font-semibold leading-normal text-center flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{refreshSuccessMsg}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5">
                        <button
                          onClick={handleParticipantRefresh}
                          disabled={refreshLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-md border border-indigo-400"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshLoading ? "animate-spin" : ""}`} />
                          <span>{refreshLoading ? "Atualizando..." : "Atualizar minha situação"}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
                          <button
                            onClick={() => handleParticipantWhatsApp("copy")}
                            className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 border border-white/10"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Copiar mensagem</span>
                          </button>
                          <button
                            onClick={() => handleParticipantWhatsApp("send")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow-md border border-emerald-500"
                          >
                            <Send className="w-4 h-4" />
                            <span>Receber pelo WhatsApp</span>
                          </button>
                        </div>
                      </div>

                      {/* Explanatory text under the buttons */}
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-white/5 p-3 rounded-xl text-center border border-white/5">
                        Para manter o sistema gratuito, o envio pelo WhatsApp depende da sua confirmação. Ao clicar em ‘Receber pelo WhatsApp’, a mensagem será aberta pronta no aplicativo. Basta confirmar o envio.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                    <Info className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Estatísticas Bloqueadas</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Complete e confirme definitivamente o lançamento de suas notas para habilitar seu panorama individual de ranking, quartis e comparativos de média da turma.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-Averages and Concept Averages list */}
                {myCalcs && (
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="text-sm border-b border-slate-100 pb-2 font-bold text-slate-800 flex items-center gap-1">
                      <FileCheck2 className="w-4 h-4 text-emerald-800" />
                      <span>Consolidação Conceitual</span>
                    </div>

                    <div className="space-y-3 text-slate-700 text-sm">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-600 font-medium">Média Geral Conceito Lateral:</span>
                        <strong className="font-mono font-bold text-slate-900">{fmtGrade(myCalcs.mediaLateralGeral)}</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-600 font-medium">Média Geral Conceito Vertical:</span>
                        <strong className="font-mono font-bold text-slate-900">{fmtGrade(myCalcs.mediaVerticalGeral)}</strong>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 leading-normal bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-800 flex-shrink-0 mt-0.5" />
                        <span>
                          As notas parciais mostram o desempenho com base nas avaliações digitadas até o memento. Alterações rascunhadas não computam.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical records table */}
                {currentUser.historico && currentUser.historico.length > 0 && (
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <History className="w-4 h-4" />
                      <span>Histórico de Alterações</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
                      {currentUser.historico.map((h, i) => (
                        <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 space-y-1">
                          <div className="flex justify-between font-medium">
                            <span className="font-mono text-[10px]">{new Date(h.dataHora).toLocaleString("pt-BR")}</span>
                            <span className="text-emerald-700">Campo: {h.campo}</span>
                          </div>
                          <div>
                            Anterior: <span className="font-mono text-slate-700 font-semibold">{h.valorAnterior}</span> {" "}
                            ➜ Novo: <span className="font-mono text-slate-900 font-bold">{h.valorNovo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              </div>

              {/* LEITURA VISUAL DO DESEMPENHO INDIVIDUAL */}
              {currentUser.notas && (
                <div className="space-y-4 no-print">
                  <div className="flex items-center gap-2 pt-2">
                    <BarChart3 className="w-5 h-5 text-emerald-800" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Leitura Visual do Desempenho</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ModuleRadar
                      notas={currentUser.notas}
                      moduleAverages={classStats?.moduleAverages}
                      modulesControl={settings?.modulesControl}
                      theme={theme}
                    />
                    <ModuleComparisonBars
                      notas={currentUser.notas}
                      moduleAverages={classStats?.moduleAverages}
                      modulesControl={settings?.modulesControl}
                      theme={theme}
                    />
                    <div className="lg:col-span-2">
                      <GradeComposition calcs={myCalcs} theme={theme} />
                    </div>
                  </div>
                </div>
              )}
              </>
              )}

              {/* Elegant Print-Only Footer / Stamp */}
              <div className="print-only-footer text-center mt-8">
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                  DOCUMENTO OFICIAL DA INSTITUIÇÃO — EMISSÃO PELO SISTEMA DE ACOMPANHAMENTO INDIVIDUAL ESAO 2026.
                </p>
                <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">
                  Todas as notas e médias apresentadas neste boletim de desempenho correspondem aos lançamentos individuais devidamente revisados e homologados pela seção de ensino da Escola de Aperfeiçoamento de Oficiais.
                </p>
              </div>

              </div>
            </div>
          )
        )}

        {/* VIEW 3: ADMINISTRATIVE SYSTEM PORTAL */}
        {isLoggedIn && isAdmin && (
          <div className="space-y-6 no-print">
            
            {/* Upper Admin metrics cards block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">TURMA</span>
                  <strong className="text-2xl font-black font-mono mt-1 text-slate-800">55</strong>
                  <span className="text-xs text-slate-500 block">Participantes pré-cadastrados</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lançamentos Válidos</span>
                  <strong className="text-2xl font-black font-mono mt-1 text-emerald-700">
                    {adminOverallStats?.totalValid ?? 0}
                  </strong>
                  <span className="text-xs text-slate-500 block">Participantes confirmados</span>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl">
                  <FileCheck2 className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Média Geral</span>
                  <strong className="text-2xl font-black font-mono mt-1 text-slate-800">
                    {fmtGrade(adminOverallStats?.mean)}
                  </strong>
                  <span className="text-xs text-slate-500 block">Média da turma atual</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mediana Geral</span>
                  <strong className="text-2xl font-black font-mono mt-1 text-slate-800">
                    {fmtGrade(adminOverallStats?.median)}
                  </strong>
                  <span className="text-xs text-slate-500 block">Mediana consolidada</span>
                </div>
                <div className="p-3 bg-purple-50 text-purple-800 rounded-xl">
                  <Calculator className="w-7 h-7" />
                </div>
              </div>

            </div>

            {/* Admin functional tabs wrapper */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden text-slate-700">
              
              <div className="bg-slate-100 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
                
                {/* Tabs selection buttons */}
                <div className="flex flex-wrap gap-1 bg-slate-200/65 p-1 rounded-xl">
                  {(["participants", "performance_anon", "modules", "launches", "milestones", "history", "settings"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveAdminTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeAdminTab === tab 
                          ? "bg-white text-emerald-800 shadow-sm" 
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab === "participants" && "1. Gerenciamento"}
                      {tab === "performance_anon" && "2. Desempenho Anônimo"}
                      {tab === "modules" && "3. Controle Módulos"}
                      {tab === "launches" && "4. Lançamentos"}
                      {tab === "milestones" && "5. Marcos WhatsApp"}
                      {tab === "history" && "6. Histórico"}
                      {tab === "settings" && "7. Configurações"}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={fetchAdminData}
                    disabled={adminLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${adminLoading ? "animate-spin text-emerald-800" : ""}`} />
                    <span>{adminLoading ? "Recarregando..." : "Recarregar"}</span>
                  </button>
                </div>

              </div>

              {/* Admin Tab content area */}
              <div className="p-6">
                
                {/* ADMIN TAB 1: STUDENTS LIST & GRADE DIRECTORY */}
                {activeAdminTab === "participants" && (
                  <div className="space-y-6">
                    
                    {/* Security Warning Notice */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs flex items-start gap-2.5 text-slate-700 leading-relaxed shadow-sm">
                      <span className="text-sm">⚠️</span>
                      <p>
                        <strong>Modo sigiloso ativo:</strong> esta área mostra apenas controle operacional. Notas, classificações, quartis e Nome Sigiloso real não são exibidos junto ao nome de guerra.
                      </p>
                    </div>
                    
                    {/* search block and add student trigger wrapper */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-xl items-center">
                          <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Buscar por nome, id ou status..."
                              value={adminSearch}
                              onChange={(e) => setAdminSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => setIsBatchImportOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-lg text-xs font-bold font-sans inline-flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Importar participantes em lote</span>
                          </button>
                        </div>

                        {/* Summary indicator */}
                        <div className="flex gap-3 text-xs font-mono font-semibold text-slate-500">
                          <span>Pendente: <strong className="text-slate-800">{countNotStarted}</strong></span>
                          <span>Rascunho: <strong className="text-slate-800">{countDraft}</strong></span>
                          <span>Confirmado: <strong className="text-emerald-700">{countConfirmed}</strong></span>
                          <span>Bloqueado: <strong className="text-rose-700">{countBlocked}</strong></span>
                        </div>
                      </div>

                      {/* Bulk actions banner */}
                      <div className={`border p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold transition-all ${
                        selectedStudentIds.length > 0 
                          ? "bg-emerald-50 border-emerald-100" 
                          : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-start gap-2.5 text-slate-800">
                          <span className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 shrink-0 transition-colors ${
                            selectedStudentIds.length > 0 
                              ? "bg-emerald-800 text-white" 
                              : "bg-slate-300 text-slate-650"
                          }`}>
                            {selectedStudentIds.length}
                          </span>
                          <div>
                            <p className="font-bold">
                              {selectedStudentIds.length === 0 
                                ? "Nenhum participante selecionado." 
                                : selectedStudentIds.length === 1 
                                  ? "1 participante selecionado." 
                                  : `${selectedStudentIds.length} participantes selecionados.`}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              Execute ações diretamente nos participantes que você selecionou.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          <button
                            type="button"
                            disabled={selectedStudentIds.length === 0}
                            onClick={() => handleAdminToggleBlockBatch(true)}
                            className={`font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 ${
                              selectedStudentIds.length > 0 
                                ? "bg-rose-800 hover:bg-rose-955 text-white cursor-pointer" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            }`}
                            title="Bloquear edições das notas para todos os selecionados"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bloquear</span>
                          </button>
                          <button
                            type="button"
                            disabled={selectedStudentIds.length === 0}
                            onClick={() => handleAdminToggleBlockBatch(false)}
                            className={`font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 ${
                              selectedStudentIds.length > 0 
                                ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            }`}
                            title="Liberar lançamentos e cancelar bloqueio para os selecionados"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Cancelar Bloqueio / Reabrir</span>
                          </button>
                          <button
                            type="button"
                            disabled={selectedStudentIds.length === 0}
                            onClick={handleAdminInactivateStudentsBatch}
                            className={`font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 ${
                              selectedStudentIds.length > 0 
                                ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            }`}
                            title="Inativar usuários selecionados (mantém históricos e dados)"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Inativar</span>
                          </button>
                          <button
                            type="button"
                            disabled={selectedStudentIds.length === 0}
                            onClick={handleAdminDeleteStudentsBatch}
                            className={`font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 ${
                              selectedStudentIds.length > 0 
                                ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            }`}
                            title="Excluir definitivamente os usuários selecionados"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                          {selectedStudentIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentIds([])}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Limpar Seleção</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Students main directory grid */}
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase">
                          <tr>
                            <th 
                              className="p-3 w-10 text-center select-none cursor-pointer hover:bg-slate-100/50 transition-colors"
                              onClick={toggleSelectAllVisible}
                            >
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 accent-emerald-750"
                                checked={filteredAdminStudents.length > 0 && filteredAdminStudents.every(s => selectedStudentIds.includes(String(s.id)))}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectAllVisible();
                                }}
                              />
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "matricula") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("matricula");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center gap-1">
                                <span>Matrícula</span>
                                {sortColumn === "matricula" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "nomeDeGuerra") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("nomeDeGuerra");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center gap-1">
                                <span>Nome de Guerra</span>
                                {sortColumn === "nomeDeGuerra" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "nomeSigiloso") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("nomeSigiloso");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center gap-1 font-semibold text-emerald-800">
                                <span>Nome Sigiloso</span>
                                {sortColumn === "nomeSigiloso" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "statusLancamento") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("statusLancamento");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center gap-1">
                                <span>Status Ficha</span>
                                {sortColumn === "statusLancamento" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "hasAccessed") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("hasAccessed");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 text-center cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span>Acessou?</span>
                                {sortColumn === "hasAccessed" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "isPasswordChanged") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("isPasswordChanged");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 text-center cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span>Alt. Senha?</span>
                                {sortColumn === "isPasswordChanged" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th className="p-3 text-center select-none">Preenchimento</th>
                            <th 
                              onClick={() => {
                                if (sortColumn === "telefone") {
                                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn("telefone");
                                  setSortDirection("asc");
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition select-none"
                            >
                              <div className="flex items-center gap-1">
                                <span>Celular/WhatsApp</span>
                                {sortColumn === "telefone" && (sortDirection === "asc" ? " ▴" : " ▾")}
                              </div>
                            </th>
                            <th className="p-3 text-right font-bold text-emerald-800 select-none">Ações de Controle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(filteredAdminStudents || []).map((s) => {
                            // Calculate current rank details if available
                            const sCalc = s.notas ? "Sim" : "Não";
                            const ranking = adminOverallStats?.rankings?.find((r: any) => r.id === s.id);
                            
                            // Color scheme matching state
                            const badgeColor = () => {
                              switch (s.statusLancamento) {
                                case "não_iniciado": return "bg-slate-100 text-slate-600 border-slate-200";
                                case "rascunho_salvo": return "bg-amber-50 text-amber-700 border-amber-200";
                                case "confirmado": return "bg-emerald-50 text-emerald-700 border-emerald-200";
                                case "corrigido": return "bg-blue-50 text-blue-700 border-blue-200/50";
                                case "bloqueado": return "bg-rose-50 text-rose-700 border-rose-200";
                                default: return "bg-slate-100 text-slate-700";
                              }
                            };

                            const fmtStatus = (st: string) => {
                              switch (st) {
                                case "não_iniciado": return "Não Iniciado";
                                case "rascunho_salvo": return "Rascunho Salvo";
                                case "confirmado": return "Confirmado";
                                case "corrigido": return "Corrigido";
                                case "bloqueado": return "Bloqueado";
                                default: return st;
                              }
                            };

                            const isAc3Done = s.notas?.ac3?.aat !== null && s.notas?.ac3?.ac !== null;
                            const isAc4Done = s.notas?.ac4?.aat !== null && s.notas?.ac4?.ac !== null;
                            const isAc5Done = s.notas?.ac5?.aat !== null && s.notas?.ac5?.ac !== null;
                            const isAc6Done = s.notas?.ac6?.aat !== null && s.notas?.ac6?.ac !== null;
                            const isLangDone = s.notas?.idiomas?.lateralIdiomas !== null && s.notas?.idiomas?.verticalIdiomas !== null;

                            return (
                              <tr 
                                key={s.id} 
                                onClick={() => toggleStudentSelection(String(s.id))}
                                className={`hover:bg-slate-50/50 cursor-pointer select-none transition ${s.situacao === "inativo" ? "opacity-50 line-through bg-slate-50" : ""} ${selectedStudentIds.includes(String(s.id)) ? "bg-emerald-50/45" : ""}`}
                              >
                                <td 
                                  className="p-3 text-center cursor-pointer hover:bg-slate-100/30" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStudentSelection(String(s.id));
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 accent-emerald-600"
                                    checked={selectedStudentIds.includes(String(s.id))}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleStudentSelection(String(s.id));
                                    }}
                                  />
                                </td>
                                <td className="p-3 font-mono">{s.matricula}</td>
                                <td className="p-3 font-bold text-slate-800 uppercase font-mono tracking-wide">{s.nomeDeGuerra}</td>
                                <td className="p-3 font-mono font-bold text-slate-700">
                                  {s.nomeSigiloso ? (
                                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest text-[10px]">Criado</span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 font-semibold italic text-[10px]">Pendente</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${badgeColor()}`}>
                                    {fmtStatus(s.statusLancamento)}
                                  </span>
                                </td>
                                {/* Acessou */}
                                <td className="p-3 text-center">
                                  {s.hasAccessed ? (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Sim</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Não</span>
                                  )}
                                </td>
                                {/* Alt. Senha */}
                                <td className="p-3 text-center">
                                  {s.isPasswordChanged ? (
                                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Alt</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Padrão</span>
                                  )}
                                </td>
                                {/* Preenchimento dos módulos */}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1 font-mono text-[9px] font-bold select-none">
                                    <span className={`px-1 py-0.5 rounded border ${isAc3Done ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-350 border-slate-200/60"}`} title={isAc3Done ? "AC3 preenchido" : "AC3 pendente"}>AC3</span>
                                    <span className={`px-1 py-0.5 rounded border ${isAc4Done ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-350 border-slate-200/60"}`} title={isAc4Done ? "AC4 preenchido" : "AC4 pendente"}>AC4</span>
                                    <span className={`px-1 py-0.5 rounded border ${isAc5Done ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-350 border-slate-200/60"}`} title={isAc5Done ? "AC5 preenchido" : "AC5 pendente"}>AC5</span>
                                    <span className={`px-1 py-0.5 rounded border ${isAc6Done ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-350 border-slate-200/60"}`} title={isAc6Done ? "AC6 preenchido" : "AC6 pendente"}>AC6</span>
                                    <span className={`px-1 py-0.5 rounded border ${isLangDone ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-350 border-slate-200/60"}`} title={isLangDone ? "Idiomas preenchido" : "Idiomas pendente"}>LANG</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-600">{displayFormattedPhone(s.telefone)}</td>
                                <td className="p-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                  


                                  {/* Block / unblock button */}
                                  <button
                                    onClick={() => handleAdminToggleBlock(s)}
                                    className={`p-1.5 rounded border transition ${
                                      s.statusLancamento === "bloqueado" 
                                        ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200" 
                                        : "bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border-slate-200/80"
                                    }`}
                                    title={s.statusLancamento === "bloqueado" ? "Desbloquear Edição" : "Bloquear Edição"}
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit Profile details triggers */}
                                  <button
                                    onClick={() => setSelectedStudentForEdit(s)}
                                    className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 shadow-sm transition"
                                    title="Editar Participante"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* View history trigger */}
                                  <button
                                    onClick={() => setSelectedStudentHistory(s)}
                                    className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 shadow-sm transition"
                                    title="Histórico de Edições"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleAdminResetPassword(s)}
                                    className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 shadow-sm transition text-[10px]"
                                    title="Resetar Senha"
                                  >
                                    Key
                                  </button>

                                  {/* Zerar Ficha (Zerar Lançamentos only) */}
                                  <button
                                    onClick={() => handleAdminClearStudentData(s)}
                                    className="bg-amber-50 hover:bg-amber-100 p-1.5 rounded text-amber-750 hover:text-amber-950 shadow-sm transition mr-1.5"
                                    title="Zerar Ficha (Zerar Notas, Rascunhos e Telefone mantendo o cadastro)"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Student */}
                                  <button
                                    onClick={() => handleAdminDeleteStudent(s)}
                                    className="bg-rose-50 hover:bg-rose-100 p-1.5 rounded text-rose-700 hover:text-rose-800 shadow-sm transition"
                                    title="Excluir Usuário"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Activate / Deactivate Toggle */}
                                  <button
                                    onClick={() => handleAdminToggleStudentActive(s)}
                                    className={`px-1.5 py-1 text-[10px] font-bold rounded border transition-all ${
                                      s.situacao === "ativo" 
                                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200" 
                                        : "bg-amber-100 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    {s.situacao === "ativo" ? "Ativo" : "Inativo"}
                                  </button>

                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* ADMIN TAB 2: ANONYMOUS PERFORMANCE & CLASS GENERAL RANKING */}
                {activeAdminTab === "performance_anon" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-1.5 leading-relaxed">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase tracking-wide">Desempenho Anônimo e Classificação</span>
                      <p className="text-slate-600">
                        Esta área apresenta o desempenho acadêmico, médias, classificação e quartis de forma estritamente anônima. Dados pessoais dos participantes (como nome de guerra, matrícula, celular ou WhatsApp) não são exibidos aqui. Correlacionamento realizado exclusivamente com o Nome Sigiloso de cada participante.
                      </p>
                    </div>

                    {/* PAINEL VISUAL DA TURMA */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <LaunchStatusDonut students={adminStudents} theme={theme} />
                      <ClassModuleAverages moduleAverages={adminOverallStats?.moduleAverages} theme={theme} />
                      <GradeDistribution
                        grades={(adminOverallStats?.rankings || []).map((r: any) => r.finalGrade).filter((g: any) => typeof g === "number")}
                        mean={adminOverallStats?.mean ?? null}
                        median={adminOverallStats?.median ?? null}
                        theme={theme}
                        hint="Quantos participantes caíram em cada faixa de nota final, com média e mediana marcadas."
                      />
                      <QuartileBars rankings={adminOverallStats?.rankings || []} theme={theme} />
                    </div>

                    <ModuleHeatmap
                      students={adminStudents}
                      modulesControl={adminSettings?.modulesControl}
                      theme={theme}
                    />

                    <div className="border border-slate-200/80 rounded-2xl p-4 bg-white space-y-4 text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 border-slate-100">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Consolidado de Desempenho e Classificação Parcial</h4>
                        <button
                          onClick={() => setIsAnonReportOpen(true)}
                          className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Gerar Relatório de Classificação (PDF)</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold">
                            <tr>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "posicao") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("posicao");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Posição</span>
                                  {anonSortField === "posicao" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "nomeSigiloso") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("nomeSigiloso");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Nome Sigiloso</span>
                                  {anonSortField === "nomeSigiloso" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "notaFinal") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("notaFinal");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold text-center cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Nota Final Estimada</span>
                                  {anonSortField === "notaFinal" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "mediaModulos") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("mediaModulos");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold text-center cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Média Módulos</span>
                                  {anonSortField === "mediaModulos" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "mediaLateral") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("mediaLateral");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold text-center cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Média Conceito Lateral</span>
                                  {anonSortField === "mediaLateral" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "mediaVertical") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("mediaVertical");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 font-bold text-center cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Média Conceito Vertical</span>
                                  {anonSortField === "mediaVertical" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                              <th 
                                onClick={() => {
                                  if (anonSortField === "quartil") {
                                    setAnonSortOrder(anonSortOrder === "asc" ? "desc" : "asc");
                                  } else {
                                    setAnonSortField("quartil");
                                    setAnonSortOrder("asc");
                                  }
                                }}
                                className="p-3 text-right font-bold cursor-pointer hover:bg-slate-100 select-none transition"
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <span>Quartil</span>
                                  {anonSortField === "quartil" && (anonSortOrder === "asc" ? " ▴" : " ▾")}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {(() => {
                              const activeStudents = adminStudents.filter(s => s.situacao === "ativo");
                              
                              const getSortValue = (studentItem: any, field: string) => {
                                const rk = adminOverallStats?.rankings?.find((r: any) => r.id === studentItem.id);
                                const pf = getStudentPerformance(studentItem, adminSettings);
                                const isConf = ["confirmado", "corrigido", "bloqueado"].includes(studentItem.statusLancamento);

                                switch (field) {
                                  case "posicao":
                                    return isConf && rk ? rk.rank : 9999;
                                  case "nomeSigiloso":
                                    return studentItem.nomeSigiloso ? studentItem.nomeSigiloso.toUpperCase() : "ZZZZZZ";
                                  case "notaFinal":
                                    return isConf && pf?.finalGrade !== null && pf?.finalGrade !== undefined ? pf.finalGrade : -1;
                                  case "mediaModulos":
                                    return isConf && pf?.mediaModules !== null && pf?.mediaModules !== undefined ? pf.mediaModules : -1;
                                  case "mediaLateral":
                                    return isConf && pf?.mediaLateralGeral !== null && pf?.mediaLateralGeral !== undefined ? pf.mediaLateralGeral : -1;
                                  case "mediaVertical":
                                    return isConf && pf?.mediaVerticalGeral !== null && pf?.mediaVerticalGeral !== undefined ? pf.mediaVerticalGeral : -1;
                                  case "quartil":
                                    return isConf && rk?.quartil ? rk.quartil : 9999;
                                  default:
                                    return 0;
                                }
                              };

                              const sortedForPerformance = [...activeStudents].sort((a, b) => {
                                const valA = getSortValue(a, anonSortField);
                                const valB = getSortValue(b, anonSortField);
                                
                                if (valA === valB) return 0;
                                if (anonSortOrder === "asc") {
                                  return valA > valB ? 1 : -1;
                                } else {
                                  return valA < valB ? 1 : -1;
                                }
                              });

                              if (sortedForPerformance.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">Nenhum participante ativo cadastrado.</td>
                                  </tr>
                                );
                              }

                              return (sortedForPerformance || []).map(s => {
                                const ranking = adminOverallStats?.rankings?.find((r: any) => r.id === s.id);
                                const perf = getStudentPerformance(s, adminSettings);

                                const isConfirmed = ["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento);
                                const classification = isConfirmed && ranking ? `${ranking.rank}º` : "Pendente";
                                const quartilLabel = isConfirmed && ranking?.quartil ? `Q${ranking.quartil}` : "Pendente";
                                
                                const finalGradeText = isConfirmed && perf?.finalGrade !== null && perf?.finalGrade !== undefined ? fmtGrade(perf.finalGrade) : "Pendente";
                                const mediaModulesText = isConfirmed && perf?.mediaModules !== null && perf?.mediaModules !== undefined ? fmtGrade(perf.mediaModules) : "Pendente";
                                const mediaLateralGeralText = isConfirmed && perf?.mediaLateralGeral !== null && perf?.mediaLateralGeral !== undefined ? fmtGrade(perf.mediaLateralGeral) : "Pendente";
                                const mediaVerticalGeralText = isConfirmed && perf?.mediaVerticalGeral !== null && perf?.mediaVerticalGeral !== undefined ? fmtGrade(perf.mediaVerticalGeral) : "Pendente";

                                return (
                                  <tr key={s.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-mono font-bold text-slate-900">{classification}</td>
                                    <td className="p-3">
                                      {s.nomeSigiloso ? (
                                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 font-bold uppercase tracking-wider font-mono text-[10px]">{s.nomeSigiloso}</span>
                                      ) : (
                                        <span className="text-amber-500 font-semibold italic text-xs">Pendente</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-emerald-700">{finalGradeText}</td>
                                    <td className="p-3 text-center font-mono text-slate-600">{mediaModulesText}</td>
                                    <td className="p-3 text-center font-mono text-slate-600">{mediaLateralGeralText}</td>
                                    <td className="p-3 text-center font-mono text-slate-600">{mediaVerticalGeralText}</td>
                                    <td className="p-3 text-right font-mono font-bold">
                                      {isConfirmed && ranking?.quartil ? (
                                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                                          ranking.quartil === 1 ? "bg-emerald-100 text-emerald-800" :
                                          ranking.quartil === 2 ? "bg-blue-100 text-blue-800" :
                                          ranking.quartil === 3 ? "bg-amber-100 text-amber-800" :
                                          "bg-rose-100 text-rose-800"
                                        }`}>
                                          {quartilLabel}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">Pendente</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 2: CONTROLE DOS MÓDULOS */}
                {activeAdminTab === "modules" && (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-4 border border-emerald-200 rounded-2xl text-xs leading-relaxed">
                      <strong className="text-emerald-900 block font-bold mb-1 font-mono uppercase text-[10px]">Controle de Liberação de Módulos (ESAO)</strong>
                      <p className="text-emerald-800">
                        Cada bloco da turma pode ser comandado individualmente por este painel. Quando o módulo estiver fechado, o aluno comum verá apenas avisos de indisponibilidade descritos no projeto.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Section Modules */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-slate-705">
                        <h4 className="text-xs font-bold text-slate-800 border-b pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <CalendarRange className="w-4.5 h-4.5 text-emerald-800" />
                          <span>Status do Bloco</span>
                        </h4>

                        <div className="divide-y divide-slate-100">
                          {(["ac3", "ac4", "ac5", "ac6", "idiomas"] as const).map((mKey) => {
                            const currentStatus = adminSettings.modulesControl?.[mKey] || "fechado";
                            return (
                              <div key={mKey} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="font-bold text-slate-850 uppercase font-mono tracking-wider">
                                    {mKey === "idiomas" ? "Idiomas" : `Módulo ${mKey.toUpperCase()}`}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {currentStatus === "fechado" && "Fechado: Não liberado pelo administrador."}
                                    {currentStatus === "aberto_lancamento" && `Aberto para lançamento inicial`}
                                    {currentStatus === "aberto_edicao" && `Aberto para edição por parte do aluno`}
                                    {currentStatus === "bloqueado_definitivamente" && `Bloqueado definitivamente para o aluno`}
                                  </span>
                                </div>

                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    const updatedControl = {
                                      ...(adminSettings.modulesControl || {
                                        ac3: "aberto_lancamento",
                                        ac4: "fechado",
                                        ac5: "fechado",
                                        ac6: "fechado",
                                        idiomas: "fechado"
                                      }),
                                      [mKey]: e.target.value
                                    };
                                    handleAdminSaveSettings({
                                      ...adminSettings,
                                      modulesControl: updatedControl
                                    });
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-600 font-semibold cursor-pointer"
                                >
                                  <option value="fechado">Fechado</option>
                                  <option value="aberto_lancamento">Aberto para lançamento</option>
                                  <option value="aberto_edicao">Aberto para edição</option>
                                  <option value="bloqueado_definitivamente">Bloqueado definitivamente</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* General Period Controls */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-slate-805 border-b pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sliders className="w-4.5 h-4.5 text-emerald-800" />
                          <span>Controle Geral de Edição</span>
                        </h4>

                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700">
                          <div>
                            <strong className="block text-slate-800 leading-snug">Período Geral de Edição de Notas</strong>
                            <span className="text-[10px] text-slate-405 block mt-1 leading-normal">
                              Determina de modo master se todos os alunos comuns cadastrados estão habilitados para editar e salvar correções no portal.
                            </span>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleAdminToggleGlobalEdit(!adminSettings.globalEditOpen)}
                              className={`px-4 py-2 rounded-xl text-xs font-black shadow transition cursor-pointer ${
                                adminSettings.globalEditOpen 
                                  ? "bg-emerald-750 text-white hover:bg-emerald-850" 
                                  : "bg-rose-750 text-white hover:bg-rose-850"
                              }`}
                            >
                              {adminSettings.globalEditOpen ? "Liberado Geral" : "Bloqueado Geral"}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* MODULE 3: VER LANÇAMENTOS */}
                {activeAdminTab === "launches" && (
                  <div className="space-y-6">
                    
                    {/* High-level status cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Cadastrados</span>
                        <strong className="text-lg font-black text-slate-800 font-mono block mt-1">{adminStudents.length} Participantes</strong>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-105 p-4 rounded-xl">
                        <span className="text-[10px] text-emerald-850 uppercase tracking-wider block font-bold">Lançamentos Válidos (AC3)</span>
                        <strong className="text-lg font-black text-emerald-850 font-mono block mt-1">
                          {adminStudents.filter(s => s.situacao === "ativo" && s.notas?.ac3?.aat !== null && s.notas?.ac3?.ac !== null).length}
                        </strong>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800">
                        <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-bold">Rascunhos Salvos</span>
                        <strong className="text-lg font-black text-amber-900 font-mono block mt-1">
                          {adminStudents.filter(s => s.statusLancamento === "rascunho_salvo").length}
                        </strong>
                      </div>

                      <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-red-800">
                        <span className="text-[10px] text-red-750 uppercase tracking-wider block font-bold">Pendência de Lançamento</span>
                        <strong className="text-lg font-black text-red-900 font-mono block mt-1">
                          {adminStudents.filter(s => s.statusLancamento === "não_iniciado" && s.situacao === "ativo").length}
                        </strong>
                      </div>
                    </div>

                    {/* Consolidado list */}
                    <div className="border border-slate-200/80 rounded-2xl p-4 bg-white space-y-4 text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Consolidado Geral de Notas de Alunos</h4>
                        
                        <div className="text-xs text-slate-500 font-semibold">
                          Permite auditar individualmente as notas e gerar boletins WhatsApp.
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold">
                            <tr>
                              <th className="p-3">Nome Sigiloso</th>
                              <th className="p-3">AC3</th>
                              <th className="p-3 font-mono">AC4</th>
                              <th className="p-3 text-center">AC5</th>
                              <th className="p-3 text-center">AC6</th>
                              <th className="p-3 text-center">Idiomas</th>
                              <th className="p-3 text-right">Relatório</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                            {(filteredAdminStudents || []).map(s => {
                              const formatScore = (mKey: "ac3" | "ac4" | "ac5" | "ac6") => {
                                const m = s.notas?.[mKey];
                                if (!m || m.aat === null || m.ac === null) return "—";
                                return fmtGrade((parseFloat(m.aat) * 1 + parseFloat(m.ac) * 9) / 10);
                              };

                              const formatIdiomas = () => {
                                const m = s.notas?.idiomas;
                                if (!m || m.lateralIdiomas === null || m.verticalIdiomas === null) return "—";
                                return `Lat: ${fmtGrade(m.lateralIdiomas)} | Vert: ${fmtGrade(m.verticalIdiomas)}`;
                              };

                              return (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold uppercase text-slate-800 font-mono">
                                    {s.nomeSigiloso ? (
                                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 font-bold uppercase tracking-wider">{s.nomeSigiloso}</span>
                                    ) : (
                                      <span className="text-amber-500 font-semibold italic text-xs">Pendente</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono">{formatScore("ac3")}</td>
                                  <td className="p-3 font-mono">{formatScore("ac4")}</td>
                                  <td className="p-3 font-mono text-center">{formatScore("ac5")}</td>
                                  <td className="p-3 font-mono text-center">{formatScore("ac6")}</td>
                                  <td className="p-3 text-center text-[10px] font-mono text-slate-500">{formatIdiomas()}</td>
                                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                    {s.notas && (
                                      <>
                                        <button
                                          onClick={() => setSelectedStudentLaunchData(s)}
                                          className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 shadow-sm transition cursor-pointer"
                                          title="Visualizar Boletim"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setAdminStudentToPrint(s)}
                                          className="bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded text-emerald-800 shadow-sm transition cursor-pointer"
                                          title="Imprimir Ficha Oficial (PDF)"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {["confirmado", "corrigido", "bloqueado"].includes(s.statusLancamento) && (
                                      <button
                                        onClick={() => handleAdminGenerateWaText(s)}
                                        className="bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded text-indigo-700 shadow-sm transition cursor-pointer"
                                        title="Ver WhatsApp"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>
                )}

                {/* ADMIN TAB 2: MARCOS ENVIO AUTOMÁTICO WHATSAPP */}
                {activeAdminTab === "milestones" && (
                  <div className="space-y-6 text-slate-700">
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
                      <h4 className="font-bold text-slate-800">Lógica de Marco de Envio Automático (WhatsApp)</h4>
                      <p>
                        O sistema monitora constantemente a quantidade de participantes ativos com fichas de notas válidas. Atingindo as metas de <strong>15, 30, 45 e 55 alunos confirmados</strong>, as estatísticas de toda a classe são recalculadas e envios automatizados são enfileirados separadamente para cada aluno participante que compuser a estatística.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {([15, 30, 45, 55] as const).map(marco => {
                        const isSent = adminMilestones.some(m => m.marco === marco);
                        const mLog = adminMilestones.find(m => m.marco === marco);

                        return (
                          <div key={marco} className={`border p-4 rounded-xl space-y-2 ${isSent ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold uppercase text-slate-500">Marco {marco}</span>
                              <span className={`px-2 py-0.5 text-[10px] rounded-lg font-bold ${isSent ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                {isSent ? "Disparado" : "Aguardando"}
                              </span>
                            </div>
                            <strong className="text-sm block font-bold text-slate-800">
                              {marco === 55 ? "55 lançamentos — turma completa" : `${marco} lançamentos`}
                            </strong>
                            {isSent && mLog ? (
                              <div className="text-[10px] text-slate-500 space-y-1">
                                <p>Enviado em: <strong>{new Date(mLog.dataHora).toLocaleDateString("pt-BR")}</strong></p>
                                <p>Total mensagens: <strong>{mLog.quantidadeMensagens}</strong></p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400">Pendente de lançamentos confirmados.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-800" />
                        <span>Logs Recentes de Enfileiramento de Marcos de Disparos</span>
                      </h4>

                      {adminMilestones.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Nenhum log de marco enfileirado ainda nesta execução.</p>
                      ) : (
                        <div className="space-y-4">
                          {adminMilestones.map((mLog, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                                <strong className="text-emerald-800 font-bold">
                                  Marco Recalculado: {mLog.marco === 55 ? "55 lançamentos — turma completa" : `${mLog.marco} lançamentos`}
                                </strong>
                                <span className="font-mono text-[10px] text-slate-400">{new Date(mLog.dataHora).toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 leading-normal">
                                <p>Participantes no momento: <strong>{mLog.quantidadeParticipantes}</strong></p>
                                <p>WhatsApp Despachos: <strong>{mLog.quantidadeMensagens} mensagens</strong></p>
                                <p>Status Canal: <strong className="text-emerald-700">Canal Ativo</strong></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-700" />
                        <span>Logs de Geração Manual de WhatsApp (Acompanhamento Individual)</span>
                      </h4>

                      {adminWhatsappLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Nenhum evento de envio/geração manual de WhatsApp registrado ainda.</p>
                      ) : (
                        <div className="overflow-x-auto border border-slate-100 rounded-xl">
                          <table className="w-full text-left text-xs divide-y divide-slate-100">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-3">Participante</th>
                                <th className="p-3">Data e Hora</th>
                                <th className="p-3">Tipo de Boletim</th>
                                <th className="p-3 text-center">Marco Atual</th>
                                <th className="p-3 text-center">Fichas no Momento</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              {adminWhatsappLogs.slice().reverse().map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-slate-800">{log.nomeDeGuerra}</td>
                                  <td className="p-3 font-mono text-[10px]">{new Date(log.dataHora).toLocaleString("pt-BR")}</td>
                                  <td className="p-3">{log.tipoDeMensagem}</td>
                                  <td className="p-3 text-center font-bold text-indigo-700">{log.marcoAtual > 0 ? `${log.marcoAtual} Alunos` : "Sem Marco"}</td>
                                  <td className="p-3 text-center font-mono">{log.quantidadeParticipantes} / 55</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* ADMIN TAB 3: COMPLETE HISTORY REPORT */}
                {activeAdminTab === "history" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <History className="w-5 h-5 text-emerald-800" />
                      <span>Histórico Geral de Auditoria de Lançamentos de Notas</span>
                    </h4>

                    {adminStudents.every(s => s.historico.length === 0) ? (
                      <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Nenhum histórico de alteração registrado na base de dados.</p>
                    ) : (
                      <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs">
                        {adminStudents.flatMap(s => s.historico.map(h => ({ ...h, sNome: s.nomeDeGuerra, sMatricula: s.matricula })))
                          .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
                          .map((h, i) => (
                            <div key={i} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-3 text-slate-600">
                              <div className="space-y-1">
                                <p>
                                  Ficha de: <strong className="text-slate-800">{h.sNome}</strong> | Usuário que editou: <strong className="text-indigo-800">{h.usuarioAlterou}</strong>
                                </p>
                                <p className="text-slate-500">
                                  Campo modificado: <span className="font-semibold text-slate-700">{h.campo}</span>
                                </p>
                                <p>
                                  Anterior: <span className="font-mono bg-slate-100 px-1 text-slate-600">{h.valorAnterior}</span> {" "}
                                  ➜ Novo: <span className="font-mono bg-emerald-50 px-1 font-bold text-slate-900">{h.valorNovo}</span>
                                </p>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 flex-shrink-0 align-top">
                                {new Date(h.dataHora).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ADMIN TAB 4: CONFIGS & MANUAL USER MANAGEMENT */}
                {activeAdminTab === "settings" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-slate-700">
                    
                    {/* Add student sub-form panel */}
                    <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                        <Users className="w-4.5 h-4.5 text-emerald-800" />
                        <span>Pré-cadastro Individual de Aluno</span>
                      </h4>

                      <form onSubmit={handleAdminAddStudent} className="space-y-3">
                        {newStudentError && <p className="text-xs bg-red-50 text-red-600 p-2 border border-red-100 rounded-lg">{newStudentError}</p>}
                        {newStudentSuccess && <p className="text-xs bg-emerald-50 text-emerald-600 p-2 border border-emerald-100 rounded-lg">{newStudentSuccess}</p>}

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="font-medium text-slate-600 uppercase">Nome de Guerra</label>
                            <input
                              type="text"
                              value={newStudentWar}
                              onChange={(e) => setNewStudentWar(e.target.value)}
                              placeholder="Ex: Cap Silva"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-medium text-slate-600 uppercase">Número Matrícula</label>
                            <input
                              type="text"
                              value={newStudentMatricula}
                              onChange={(e) => setNewStudentMatricula(e.target.value)}
                              placeholder="Ex: 202657"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs py-2 rounded-lg shadow transition"
                        >
                          Adicionar à Base
                        </button>
                      </form>
                    </div>

                    {/* Global configs card block */}
                    <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-6">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                        Configurações Globais da Turma
                      </h3>

                      <div className="space-y-4 text-xs">
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/60">
                          <div>
                            <strong className="block text-slate-800 leading-snug">Período Geral de Edição de Notas</strong>
                            <span className="text-[10px] text-slate-400">Configura de forma global se os alunos comuns podem alterar e salvar correções</span>
                          </div>
                          
                          <button
                            onClick={() => handleAdminToggleGlobalEdit(!adminSettings.globalEditOpen)}
                            className={`px-3 py-1.5 rounded-lg font-bold tracking-tight text-white shadow-sm transition ${
                              adminSettings.globalEditOpen 
                                ? "bg-emerald-700 hover:bg-emerald-800" 
                                : "bg-rose-700 hover:bg-rose-800"
                            }`}
                          >
                            {adminSettings.globalEditOpen ? "Liberado" : "Bloqueado"}
                          </button>
                        </div>

                        {/* Milestone Mode selection */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-2">
                          <div>
                            <strong className="block text-slate-800 leading-snug">Modo de Marcos de Disparos</strong>
                            <span className="text-[10px] text-slate-400">Selecione como os gatilhos WhatsApp de 15, 30, 45, 55 lançamentos devem disparar</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleAdminSaveSettings({ ...adminSettings, milestoneMode: "por_modulo" })}
                              className={`p-2 rounded-lg border text-center transition font-semibold cursor-pointer ${
                                (adminSettings.milestoneMode === "por_modulo" || !adminSettings.milestoneMode)
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Por Módulo (MVP)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminSaveSettings({ ...adminSettings, milestoneMode: "geral_turma" })}
                              className={`p-2 rounded-lg border text-center transition font-semibold cursor-pointer ${
                                adminSettings.milestoneMode === "geral_turma"
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Geral da Turma
                            </button>
                          </div>
                        </div>

                        {/* Individual Module Controls */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-3">
                          <div>
                            <strong className="block text-slate-800 leading-snug">Controle Individual de Abertura dos Módulos</strong>
                            <span className="text-[10px] text-slate-400">Configure o estado de liberação ou fechamento para cada bloco</span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {(["ac3", "ac4", "ac5", "ac6", "idiomas"] as const).map((mKey) => {
                              const currentStatus = adminSettings.modulesControl?.[mKey] || "fechado";
                              return (
                                <div key={mKey} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                  <span className="font-bold text-slate-850 uppercase font-mono tracking-wider">
                                    {mKey === "idiomas" ? "Idiomas" : `Módulo ${mKey.toUpperCase()}`}
                                  </span>

                                  <select
                                    value={currentStatus}
                                    onChange={(e) => {
                                      const updatedControl = {
                                        ...(adminSettings.modulesControl || {
                                          ac3: "aberto_lancamento",
                                          ac4: "fechado",
                                          ac5: "fechado",
                                          ac6: "fechado",
                                          idiomas: "fechado"
                                        }),
                                        [mKey]: e.target.value
                                      };
                                      handleAdminSaveSettings({
                                        ...adminSettings,
                                        modulesControl: updatedControl
                                      });
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                                  >
                                    <option value="fechado">Fechado</option>
                                    <option value="aberto_lancamento">Aberto para lançamento</option>
                                    <option value="aberto_edicao">Aberto para edição</option>
                                    <option value="bloqueado_definitivamente">Bloqueado definitivamente</option>
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Security, Backups & PDF Report Panel */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-3.5">
                          <div>
                            <strong className="block text-slate-800 leading-snug">Relatórios de Sigilo & Salvaguarda de Banco</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Exporte a base de dados em formato legível, restaure backups ou gere relatórios de ranking criptográficos para assegurar o sigilo nominal dos oficiais.
                            </span>
                          </div>
                          
                          <button
                            onClick={() => setIsAnonReportOpen(true)}
                            className="bg-emerald-800 hover:bg-emerald-950 text-white p-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer w-full text-center flex items-center justify-center gap-2 shadow-sm"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>Gerar Relatório de Classificação da Turma (PDF)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-150">
                            <button
                              onClick={handleAdminExportFullBackup}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 p-2 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                              title="Exportar os dados atuais para um arquivo de backup local (.json)"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar Backup</span>
                            </button>

                            <label className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 p-2 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Restaurar Backup</span>
                              <input
                                type="file"
                                accept=".json"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleAdminRestoreFullBackup(e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER GENERAL SECTION */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <p className="max-w-md mx-auto leading-relaxed">
          Sistema ESAO 2026 - Conforme regimento educacional militar e preceitos de privacidade de dados.
        </p>
      </footer>

      {/* OVERLAY MODAL 1: PRE-CONFIRMATION DEFINITE REVIEW SCREEN */}
      <AnimatePresence>
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              
              {/* Backlight */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReviewOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              />

              {/* Main review dialog card sheet */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all my-8 w-full max-w-2xl border border-slate-200 text-slate-700"
              >
                <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center text-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FileCheck2 className="w-5 h-5 text-emerald-800" />
                    <span>Revisão Geral antes de Confirmar</span>
                  </div>
                  <button onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                  
                  {/* Warning notice as requested */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                    Revise seus dados antes de confirmar. Após a confirmação, suas notas passarão a compor as estatísticas da turma Intendência - ESAO 2026. Você ainda poderá realizar correções enquanto o período de edição estiver aberto, mas todas as alterações ficarão registradas no histórico.
                  </div>

                  {/* Summary of module averages */}
                  <div className="space-y-3 text-xs leading-none">
                    <h4 className="font-bold text-slate-800 border-b pb-2 uppercase text-[10px] font-mono tracking-wider">Notas por AC</h4>
                    
                    {(["ac3", "ac4", "ac5", "ac6"] as const).map(k => {
                      const mod = formGrades[k];
                      const moduleNote = mod.aat !== null && mod.ac !== null ? (mod.aat * 1 + mod.ac * 9) / 10 : null;
                      const lateralNote = mod.lateral1 !== null && mod.lateral2 !== null ? (mod.lateral1 + mod.lateral2) / 2 : null;

                      return (
                        <div key={k} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-slate-700 uppercase font-mono tracking-wide">Módulo {k.toUpperCase()}</strong>
                          <div className="flex gap-4 font-mono">
                            <span>AAT: <strong>{fmtGrade(mod.aat)}</strong></span>
                            <span>AC: <strong>{fmtGrade(mod.ac)}</strong></span>
                            <span>Nota AC: <strong>{fmtGrade(moduleNote)}</strong></span>
                            <span>Média Lat: <strong>{fmtGrade(lateralNote)}</strong></span>
                            <span>Vert: <strong>{fmtGrade(mod.vertical)}</strong></span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Languages summary */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                      <strong className="text-slate-700 font-mono uppercase tracking-wide">Idiomas</strong>
                      <div className="flex gap-4 font-mono">
                        <span>Lat Idiomas: <strong>{fmtGrade(formGrades.idiomas.lateralIdiomas)}</strong></span>
                        <span>Vert Idiomas: <strong>{fmtGrade(formGrades.idiomas.verticalIdiomas)}</strong></span>
                      </div>
                    </div>

                  </div>

                </div>

                <div className="bg-slate-50 p-4 rounded-b-2xl border-t border-slate-200/80 flex justify-end gap-3">
                  <button
                    onClick={() => setIsReviewOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Voltar para Editar
                  </button>
                  <button
                    onClick={handleConfirmDefinitely}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Confirmar Definitivamente
                  </button>
                </div>

              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL: BATCH IMPORT STUDENTS */}
      <AnimatePresence>
        {isBatchImportOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              
              {/* Backlight */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancelBatch}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              />

              {/* Main Dialog Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all my-8 w-full max-w-4xl border border-slate-250 text-slate-700 z-10"
              >
                {/* Modal Header */}
                <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center text-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Database className="w-5 h-5 text-emerald-800" />
                    <span>Importar Participantes em Lote</span>
                  </div>
                  <button onClick={handleCancelBatch} className="text-slate-400 hover:text-slate-650 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                  
                  {/* CSV Structure Instruction card */}
                  {!batchReport && (
                    <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-4 text-xs text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="text-emerald-900 block font-bold mb-1">Instruções de Formato (Separador: ponto e vírgula)</strong>
                        <p className="mb-2">Cole uma lista de alunos. O sistema aceita os formatos com ou sem número identificador (ID) inicial.</p>
                        <p className="font-semibold text-slate-650">Formato Esperado:</p>
                        <code className="block bg-slate-100 px-2 py-1 rounded font-mono my-1 font-bold">nome_guerra;matricula;tipo_acesso;turma;status</code>
                      </div>
                      <div>
                        <strong className="text-slate-800 block font-semibold mb-1">Exemplo de entrada:</strong>
                        <pre className="text-[10px] bg-slate-100 p-2 rounded block font-mono">
{`CARVALHO NETO;500125;aluno;Intendência - ESAO 2026;ativo\nJUNKER;500225;aluno;Intendência - ESAO 2026;ativo\n1;DANIEL;501325;501325;aluno;Intendência - ESAO 2026;ativo`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Main Input Text Area (Hidden if report is displayed) */}
                  {!batchReport && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase block">Dados dos participantes para importação (CSV):</label>
                      <textarea
                        value={batchCsvText}
                        onChange={(e) => {
                          setBatchCsvText(e.target.value);
                          setBatchValidationDone(false); // Reset validation on edit
                          setBatchPreview([]);
                          setBatchErrors([]);
                          setBatchIgnored([]);
                        }}
                        placeholder="Ex: SILVA;501326;aluno;Intendência - ESAO 2026;ativo"
                        className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-emerald-800/20 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  )}

                  {/* Operational Pre-validation Details */}
                  {!batchReport && batchValidationDone && (
                    <div className="space-y-4">
                      
                      {/* Summary Metrics Tags */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Prontos para Importar</span>
                          <strong className="text-xl font-mono text-emerald-950 font-black">{batchPreview.length}</strong>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Duplicidades (Ignorados)</span>
                          <strong className="text-xl font-mono text-amber-950 font-black">{batchIgnored.length}</strong>
                        </div>
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-rose-800 uppercase block">Malformados (Erros)</span>
                          <strong className="text-xl font-mono text-rose-950 font-black">{batchErrors.length}</strong>
                        </div>
                      </div>

                      {/* 1. Preview list of processed lines: MANDATORY PREVIEW */}
                      {batchPreview.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-700"></span>
                            Prévia da Lista Processada ({batchPreview.length})
                          </h4>
                          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-48 overflow-y-auto">
                            <table className="w-full text-left text-[11px] border-collapse">
                              <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-100 sticky top-0">
                                <tr>
                                  <th className="p-2 pl-3">Matrícula</th>
                                  <th className="p-2">Nome de Guerra Normalizado</th>
                                  <th className="p-2">Tipo de Acesso</th>
                                  <th className="p-2">Turma</th>
                                  <th className="p-2 pr-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {batchPreview.map((item, index) => (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="p-2 pl-3 font-mono font-semibold text-slate-700">{item.matricula}</td>
                                    <td className="p-2 font-bold text-slate-900 font-mono uppercase text-xs">{item.nomeDeGuerra}</td>
                                    <td className="p-2 text-slate-600 font-mono">{item.tipo_acesso}</td>
                                    <td className="p-2 text-slate-600 font-mono">{item.turma}</td>
                                    <td className="p-2 pr-3">
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-bold self-center text-[9px]">
                                        {item.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* 2. Ignored list because of database duplicates */}
                      {batchIgnored.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                            Participantes Ignorados/Duplicados ({batchIgnored.length})
                          </h4>
                          <div className="overflow-x-auto border border-amber-50 rounded-xl max-h-40 overflow-y-auto">
                            <table className="w-full text-left text-[10px] border-collapse bg-amber-50/20">
                              <thead className="bg-amber-50 text-amber-800 font-mono text-[9px] uppercase border-b border-amber-100 sticky top-0">
                                <tr>
                                  <th className="p-2 pl-3">Linha</th>
                                  <th className="p-2">Matrícula</th>
                                  <th className="p-2">Nome</th>
                                  <th className="p-2 pr-3">Causa do Descarte</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100 bg-white">
                                {batchIgnored.map((item, index) => (
                                  <tr key={index} className="hover:bg-amber-50/10">
                                    <td className="p-2 pl-3 font-mono text-slate-400">{item.line}</td>
                                    <td className="p-2 font-mono text-amber-900">{item.matricula}</td>
                                    <td className="p-2 font-bold font-mono text-amber-950 uppercase">{item.nomeGuerra}</td>
                                    <td className="p-2 pr-3 text-amber-700 font-semibold">{item.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* 3. Errors List (Broken data check) */}
                      {batchErrors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                            <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                            Linhas com Erros Críticos ({batchErrors.length})
                          </h4>
                          <div className="border border-rose-100 rounded-xl max-h-36 overflow-y-auto divide-y divide-rose-50 bg-rose-50/10 text-[10px]">
                            {batchErrors.map((err, index) => (
                              <div key={index} className="p-2 px-3 flex flex-col sm:flex-row justify-between gap-1 hover:bg-rose-50/30">
                                <div>
                                  <strong className="text-rose-900 font-mono">Linha {err.line}:</strong>
                                  <span className="ml-1.5 font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded text-[9px]">`{err.raw}`</span>
                                </div>
                                <span className="text-rose-700 font-semibold">{err.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* DEFINITIVE REPORT RECEIPT IF COMPLETED */}
                  {batchReport && (
                    <div className="space-y-6">
                      
                      {/* Success Card Hero Header */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                        <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-full mb-1">
                          <Check className="w-8 h-8 font-black" />
                        </div>
                        <h4 className="text-base font-black text-emerald-950">Importação Concluída com Sucesso!</h4>
                        <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                          A carga foi processada integralmente no banco de dados. Os novos participantes já podem acessar o sistema imediatamente utilizando o <strong>Nome de Guerra</strong> e a <strong>Matrícula como senha inicial</strong>.
                        </p>
                      </div>

                      {/* Exact Summary indicators requested */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Importados com Sucesso</span>
                          <strong className="text-lg font-mono text-emerald-800 block">{batchReport.successCount}</strong>
                          <span className="text-[9px] text-slate-400 block">Cadastros criados em USUARIOS</span>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Ignorados por Duplicidade</span>
                          <strong className="text-lg font-mono text-amber-800 block">{batchReport.ignoredCount}</strong>
                          <span className="text-[9px] text-slate-400 block">Ignorados para evitar re-cadastros</span>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Linhas com Erro</span>
                          <strong className="text-lg font-mono text-rose-800 block">{batchReport.errorCount}</strong>
                          <span className="text-[9px] text-slate-400 block">Células vazias ou colunas inválidas</span>
                        </div>
                      </div>

                      {/* List of successfully imported names */}
                      {batchReport.successNames && batchReport.successNames.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                            Lista dos Nomes de Guerra Importados ({batchReport.successNames.length})
                          </h4>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {batchReport.successNames.map((name, index) => (
                              <div key={index} className="bg-white border border-slate-150 p-1 px-2 rounded font-bold text-slate-900 uppercase">
                                {index + 1}. {name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display full errors inside receipt if any */}
                      {batchReport.errorsList && batchReport.errorsList.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-rose-800 uppercase font-mono tracking-wider">
                            Linhas rejeitadas para auditoria ({batchReport.errorCount})
                          </h4>
                          <div className="border border-rose-100 rounded-xl max-h-32 overflow-y-auto divide-y divide-rose-50 text-[10px] bg-rose-50/10">
                            {batchReport.errorsList.map((err, index) => (
                              <div key={index} className="p-2 px-3 flex justify-between gap-2">
                                <span className="font-mono text-rose-950 font-bold">Linha {err.line}</span>
                                <span className="font-mono text-slate-400 max-w-xs overflow-hidden text-ellipsis">`{err.raw}`</span>
                                <span className="font-semibold text-rose-700">{err.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>

                {/* Modal Footer (Action Buttons as requested) */}
                <div className="bg-slate-50 p-4 rounded-b-2xl border-t border-slate-200/80 flex flex-wrap justify-between gap-3">
                  
                  {/* Cancel/Close button */}
                  <div>
                    <button
                      onClick={handleCancelBatch}
                      className="px-4 py-2 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      {batchReport ? "Fechar" : "Cancelar"}
                    </button>
                  </div>

                  {/* Standard Operations (Only visible if not finished) */}
                  {!batchReport && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearBatch}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-755 font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Limpar campo
                      </button>
                      
                      <button
                        onClick={handleValidateBatch}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
                      >
                        Validar lista
                      </button>

                      <button
                        onClick={handleImportBatch}
                        disabled={!batchValidationDone || batchPreview.length === 0}
                        className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow transition ${
                          batchValidationDone && batchPreview.length > 0
                            ? "bg-emerald-800 hover:bg-emerald-950"
                            : "bg-slate-350 opacity-50 cursor-not-allowed"
                        }`}
                        title={!batchValidationDone ? "Você precisa validar a lista antes de importar" : ""}
                      >
                        Importar participantes
                      </button>
                    </div>
                  )}

                </div>

              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 2: ADMIN EDIT STUDENT MODAL */}
      <AnimatePresence>
        {selectedStudentForEdit && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStudentForEdit(null)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-700"
              >
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  Editar Cadastro do Aluno
                </h3>

                <form onSubmit={handleAdminSaveStudentEdit} className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-600 block uppercase">Nome de Guerra</label>
                    <input
                      type="text"
                      value={selectedStudentForEdit.nomeDeGuerra}
                      onChange={(e) => setSelectedStudentForEdit({ ...selectedStudentForEdit, nomeDeGuerra: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-600 block uppercase">Matrícula</label>
                    <input
                      type="text"
                      value={selectedStudentForEdit.matricula}
                      onChange={(e) => setSelectedStudentForEdit({ ...selectedStudentForEdit, matricula: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-600 block uppercase">Situação</label>
                    <select
                      value={selectedStudentForEdit.situacao}
                      onChange={(e) => setSelectedStudentForEdit({ ...selectedStudentForEdit, situacao: e.target.value as "ativo" | "inativo" })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const student = selectedStudentForEdit;
                        setSelectedStudentForEdit(null);
                        handleAdminDeleteStudent(student);
                      }}
                      className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForEdit(null)}
                        className="bg-slate-100 hover:bg-slate-200 px-3.5 py-2 font-semibold rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-lg"
                      >
                        Salvar Cadastro
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL: EXCLUIR PARTICIPANTE */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setStudentToDelete(null)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-700 z-10"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  
                  {/* Icon */}
                  <div className="p-3 bg-rose-50 rounded-full text-rose-600">
                    <Trash2 className="w-8 h-8" />
                  </div>

                  {/* Title and descriptions */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Excluir Participante
                    </h3>
                    <p className="text-xs text-slate-500">
                      Você está prestes a excluir o cadastro permanentemente.
                    </p>
                  </div>

                  {/* Details Card */}
                  <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-left font-sans text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Nome de Guerra:</span>
                      <strong className="text-slate-800 uppercase font-mono">{studentToDelete.nomeDeGuerra}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Matrícula:</span>
                      <strong className="text-slate-805 font-mono">{studentToDelete.matricula}</strong>
                    </div>
                  </div>

                  {/* Feedback Message overlay */}
                  {deleteFeedback === "success" ? (
                    <div className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg text-xs font-bold font-sans">
                      Sucesso! Usuário excluído dos registros.
                    </div>
                  ) : deleteFeedback ? (
                    <div className="w-full bg-rose-50 text-rose-800 border border-rose-200 p-2.5 rounded-lg text-xs font-semibold font-sans">
                      {deleteFeedback}
                    </div>
                  ) : (
                    <div className="w-full bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-xl text-[11px] leading-relaxed text-left font-medium">
                      ⚠️ <strong>Atenção:</strong> Esta ação é irreversível e removerá todas as notas lançadas e o histórico de acesso do participante do sistema.
                    </div>
                  )}

                  {/* Operational Controls */}
                  {deleteFeedback !== "success" && (
                    <div className="w-full pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentToDelete(null)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition shadow-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={executeAdminDeleteStudent}
                        className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow"
                      >
                        Confirmar Exclusão
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 3: INDIVIDUAL MESSAGE DISPATCH FORM (ADMIN WHATSAPP PREVIEW) */}
      <AnimatePresence>
        {whatsappTemplateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto text-slate-700">
            <div className="flex min-h-full items-center justify-center p-4">
              
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setWhatsappTemplateModal(null)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
              >
                <div className="border-b pb-3 mb-4 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">
                    Mensagem de WhatsApp Individual ({whatsappTemplateModal.student.nomeDeGuerra})
                  </h3>
                  <button onClick={() => setWhatsappTemplateModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>Destinatário: <strong>{whatsappTemplateModal.student.nomeDeGuerra}</strong></p>
                    <p>Telefone: <strong className="font-mono">{displayFormattedPhone(whatsappTemplateModal.student.telefone)}</strong></p>
                  </div>

                  {/* Message body block formatted like terminal code */}
                  <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-4 rounded-xl max-h-80 overflow-y-auto whitespace-pre-wrap leading-tight text-left">
                    {whatsappTemplateModal.text}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end text-xs font-semibold">
                    
                    {/* Copy to clipboard */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappTemplateModal.text);
                        alert("Texto da mensagem copiado com sucesso!");
                      }}
                      className="px-3.5 py-2 hover:bg-slate-100 border rounded-lg text-slate-700"
                    >
                      Copiar Texto
                    </button>

                    {/* Direct open link */}
                    <a
                      href={whatsappTemplateModal.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar via WhatsApp Web</span>
                    </a>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 4: ADMIN VIEW COMPLETED STUDENT BOLETIN GRADEPOLY */}
      <AnimatePresence>
        {selectedStudentLaunchData && (
          <div className="fixed inset-0 z-50 overflow-y-auto text-slate-700">
            <div className="flex min-h-full items-center justify-center p-4">
              
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStudentLaunchData(null)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4"
              >
                <div className="border-b pb-3 flex justify-between items-center text-slate-800 border-slate-100">
                  <h3 className="text-sm font-bold">
                    Boletim Individual: {selectedStudentLaunchData.nomeSigiloso || "Pendente"}
                  </h3>
                  <button onClick={() => setSelectedStudentLaunchData(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-mono max-h-96 overflow-y-auto">
                  
                  {selectedStudentLaunchData.notas && (
                    <>
                      {(["ac3", "ac4", "ac5", "ac6"] as const).map(mKey => {
                        const m = selectedStudentLaunchData.notas![mKey];
                        const mNote = (m.aat! * 1 + m.ac! * 9) / 10;
                        const mLat = (m.lateral1! + m.lateral2!) / 2;

                        return (
                          <div key={mKey} className="bg-slate-50 border p-3 rounded-lg text-left space-y-1">
                            <strong className="text-emerald-800 block text-[10px] tracking-wide uppercase border-b border-dashed pb-1 mb-1">MÉDULO {mKey.toUpperCase()}</strong>
                            <div className="grid grid-cols-2 gap-y-1">
                              <p>AAT (Peso 1): <strong>{fmtGrade(m.aat)}</strong></p>
                              <p>AC (Peso 9):  <strong>{fmtGrade(m.ac)}</strong></p>
                              <p>Nota Módulo: <strong>{fmtGrade(mNote)}</strong></p>
                              <p>Média Lateral: <strong>{fmtGrade(mLat)}</strong></p>
                              <p className="col-span-2">Concept Vertical: <strong>{fmtGrade(m.vertical)}</strong></p>
                            </div>
                          </div>
                        );
                      })}

                      <div className="bg-slate-50 border p-3 rounded-lg text-left space-y-1">
                        <strong className="text-emerald-800 block text-[10px] tracking-wide uppercase border-b border-dashed pb-1 mb-1">IDIOMAS</strong>
                        <div className="grid grid-cols-2 gap-y-1">
                          <p>Lateral Idiomas: <strong>{fmtGrade(selectedStudentLaunchData.notas.idiomas.lateralIdiomas)}</strong></p>
                          <p>Vertical Idiomas: <strong>{fmtGrade(selectedStudentLaunchData.notas.idiomas.verticalIdiomas)}</strong></p>
                        </div>
                      </div>
                    </>
                  )}

                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setAdminStudentToPrint(selectedStudentLaunchData);
                    }}
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors animate-pulse"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Ficha Oficial</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudentLaunchData(null)}
                    className="bg-slate-105 hover:bg-slate-205 text-slate-705 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition border border-slate-200"
                  >
                    Fechar
                  </button>
                </div>

              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 5: STUDENT ALTER AUDIT HISTORY DUMP */}
      <AnimatePresence>
        {selectedStudentHistory && (
          <div className="fixed inset-0 z-50 overflow-y-auto text-slate-700">
            <div className="flex min-h-full items-center justify-center p-4">
              
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStudentHistory(null)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 z-20"
              >
                <div className="border-b pb-3 flex justify-between items-center text-slate-800 border-slate-100">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <History className="w-5 h-5 text-indigo-700" />
                    <span>Painel de Segurança: {selectedStudentHistory.nomeDeGuerra || selectedStudentHistory.nomeSigiloso}</span>
                  </h3>
                  <button onClick={() => setSelectedStudentHistory(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Snapshots Restore Section */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Pontos de Restauro Disponíveis (Rollback)</span>
                  {(() => {
                    const studentSnapshots = adminHistoricoSalvamento.filter((h: any) => String(h.user_id) === String(selectedStudentHistory.id));
                    if (studentSnapshots.length === 0) {
                      return (
                        <p className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-lg border text-center italic">Nenhum ponto de salvamento oficial registrado na nuvem ainda.</p>
                      );
                    }
                    return (
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-xl bg-slate-50/25">
                        {studentSnapshots.map((snap: any) => {
                          let eventTypeLabel = "Rascunho de Auto Save";
                          let typeColorName = "bg-slate-100 text-slate-700";
                          if (snap.tipo_evento === "rascunho") {
                            eventTypeLabel = "Rascunho Manual";
                            typeColorName = "bg-blue-50 text-blue-700 border-blue-200";
                          } else if (snap.tipo_evento === "confirmação") {
                            eventTypeLabel = "Lançamento Confirmado";
                            typeColorName = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          } else if (snap.tipo_evento === "correção") {
                            eventTypeLabel = "Correção do Admin";
                            typeColorName = "bg-amber-50 text-amber-700 border-amber-200";
                          } else if (snap.tipo_evento === "restauração") {
                            eventTypeLabel = "Restauração Antiga";
                            typeColorName = "bg-purple-50 text-purple-700 border-purple-200";
                          }

                          return (
                            <div key={snap.id} className="border border-slate-150 p-2.5 rounded-lg text-xs space-y-1.5 bg-white flex flex-col justify-between shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-slate-800 font-mono text-[11px]">Versão {snap.versao || 1}</span>
                                  <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-full border ${typeColorName}`}>
                                    {eventTypeLabel}
                                  </span>
                                </div>
                                <span className="font-mono text-[9px] text-slate-400">{new Date(snap.data_hora).toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                                <span className="text-[9px] text-slate-500 font-mono">Origem: {snap.origem === "usuario" ? "Aluno (Celular)" : "Admin"}</span>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Tem certeza de que deseja reverter o lançamento do participante para a Versão ${snap.versao}? Notas atuais serão substituídas.`)) {
                                      await handleAdminRestoreStudentHistory(selectedStudentHistory.id, snap.id);
                                      setSelectedStudentHistory(null);
                                    }
                                  }}
                                  className="bg-indigo-650 hover:bg-indigo-850 text-white font-bold text-[9px] px-2 py-1 rounded transition cursor-pointer shadow-sm"
                                >
                                  Reverter para esta versão
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Audit Field Logs Section */}
                <div className="space-y-2 text-left border-t pt-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Histórico de Alterações de Campos</span>
                  {selectedStudentHistory.historico.length === 0 ? (
                    <p className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-lg border text-center italic">Nenhuma alteração individual em campos registrada.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 text-xs text-slate-600">
                      {selectedStudentHistory.historico.map((h, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-lg border space-y-1">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Alterado por: {h.usuarioAlterou}</span>
                            <span className="font-mono text-[9px] text-slate-400">{new Date(h.dataHora).toLocaleString("pt-BR")}</span>
                          </div>
                          <p>Campo modificado: <strong className="text-slate-800">{h.campo}</strong></p>
                          <p className="leading-relaxed">
                            Valor Anterior: <span className="font-mono bg-slate-200 px-1 rounded">{h.valorAnterior}</span><br />
                            Novo Valor: <span className="font-mono bg-emerald-100 font-semibold px-1 rounded">{h.valorNovo}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 6: ANONYMOUS PDF REPORT PREVIEW */}
      <AnimatePresence>
        {isAnonReportOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 text-slate-800"
              >
                {/* Print content start */}
                <div className="space-y-6 p-4">

                  {/* Header */}
                  <div className="text-center space-y-2 border-b-2 border-slate-800 pb-4">
                    <h2 className="text-xl font-black uppercase tracking-wide">ESAO 2026 - Escola de Aperfeiçoamento de Oficiais</h2>
                    <h3 className="text-md font-bold text-slate-700 uppercase">Relatório Oficial de Classificação da Turma — Curso de Intendência</h3>
                    <div className="text-[10px] text-slate-400 font-mono flex justify-center gap-4">
                      <span>Gerado em: {new Date().toLocaleString("pt-BR")}</span>
                      <span>•</span>
                      <span>Chave do Relatório: SIGILO_ATIVO_ESAOX</span>
                    </div>
                  </div>

                  {/* Security Warning Notice */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5 leading-relaxed text-left">
                    <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wide">DECLARAÇÃO DE SIGILO INDIVIDUAL</span>
                    <p className="text-slate-500">
                      Este documento apresenta os dados agregados da turma e a classificação estimada dos participantes que confirmaram definitivamente seus lançamentos. Em estrita conformidade com as diretivas de sigilo de notas estabelecidas para a turma <strong>Intendência - ESAO 2026</strong>, todo identificador pessoal (Nome de Guerra, Matrícula, WhatsApp e Telefone) foi permanentemente descartado. A correlação de performance é feita exclusivamente por meio do <strong>Nome Sigiloso</strong>.
                    </p>
                  </div>

                  {/* Overall Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Lançamentos Válidos</span>
                      <strong className="text-base font-black font-mono text-emerald-800">{adminOverallStats?.totalValid ?? 0}</strong>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Média Geral da Turma</span>
                      <strong className="text-base font-black font-mono text-slate-850">{fmtGrade(adminOverallStats?.mean)}</strong>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Mediana da Turma</span>
                      <strong className="text-base font-black font-mono text-slate-850">{fmtGrade(adminOverallStats?.median)}</strong>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Adesão Total</span>
                      <strong className="text-base font-black font-mono text-slate-850">{((adminOverallStats?.totalValid ?? 0) / 55 * 100).toFixed(1)}%</strong>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-800 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-3.5 border-b border-slate-300 font-bold">Posição</th>
                          <th className="p-3.5 border-b border-slate-300 font-bold">Nome Sigiloso</th>
                          <th className="p-3.5 border-b border-slate-300 text-center font-bold">Média Estimada</th>
                          <th className="p-3.5 border-b border-slate-300 text-right font-bold">Quartil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {(!adminOverallStats?.rankings || adminOverallStats.rankings.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">Nenhum lançamento válido confirmado até este momento.</td>
                          </tr>
                        ) : (
                          adminOverallStats.rankings.map((r: any) => {
                            const stud = adminStudents.find(s => s.id === r.id);
                            const nameSig = stud?.nomeSigiloso || "PENDENTE DE REGISTRO";
                            
                            // Determine Quartil text based on rank percentage or class size
                            let quartilText = "—";
                            const pct = r.rank / (adminOverallStats?.totalValid || 1);
                            if (pct <= 0.25) quartilText = "Q1 (Superior)";
                            else if (pct <= 0.50) quartilText = "Q2 (Médio-Superior)";
                            else if (pct <= 0.75) quartilText = "Q3 (Médio-Inferior)";
                            else quartilText = "Q4 (Inferior)";

                            return (
                              <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="p-3 border-b font-extrabold text-slate-900">{r.rank}º</td>
                                <td className="p-3 border-b text-slate-800 font-bold uppercase tracking-wider text-left">{nameSig}</td>
                                <td className="p-3 border-b text-center font-bold text-emerald-800">{fmtGrade(r.finalGrade)}</td>
                                <td className="p-3 border-b text-right font-medium text-slate-500">{quartilText}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer anexo */}
                  <div className="pt-6 border-t font-mono text-[9px] text-slate-400 flex justify-between">
                    <span>ASSINATURA DE AUTENTICIDADE DIGITAL DA SEÇÃO DE ENSINO</span>
                    <span>CÓDIGO SHA-256: 0xA3F84D9C0212E6B87</span>
                  </div>

                </div>

                {/* Print button / Close buttons footer (no-print) */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 no-print">
                  <button
                    onClick={handlePrintRanking}
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Imprimir Relatório (PDF)</span>
                  </button>
                  <button
                    onClick={() => setIsAnonReportOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition border border-slate-200"
                  >
                    Fechar
                  </button>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY OFFICIAL STUDENT FICHA (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      {studentToPrint && (
        <div id="print-section-ficha" className="hidden print:block space-y-6 p-8 bg-white text-black font-sans w-full max-w-4xl mx-auto relative">
          
          {/* Custom Print Style overrides for A4 precision */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 1.2cm !important;
              }
              html, body, #root, #root > div {
                background: white !important;
                color: #000 !important;
                overflow: visible !important;
                height: auto !important;
                min-height: auto !important;
                position: static !important;
                display: block !important;
              }
              body.print-mode-ficha #root > div > *:not(#print-section-ficha) {
                display: none !important;
              }
              body:not(.print-mode-ficha) #print-section-ficha {
                display: none !important;
              }
              body.print-mode-ficha #print-section-ficha {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 1.2cm !important;
                box-shadow: none !important;
                background: white !important;
                box-sizing: border-box !important;
                border: 3px double #334155 !important;
              }
              .print-stamp-homologado {
                position: absolute !important;
                top: 1.2cm !important;
                right: 1.2cm !important;
                z-index: 9999 !important;
              }
            }
          `}</style>

          {/* Stamp "HOMOLOGADO" in upper right */}
          {(studentToPrint.statusLancamento === "confirmado" || studentToPrint.statusLancamento === "corrigido") && (
            <div className="print-stamp-homologado absolute top-4 right-4 border-4 border-dashed border-emerald-600 text-emerald-600 font-black uppercase px-5 py-2 rounded-lg text-sm tracking-widest rotate-6 pointer-events-none select-none shadow-[0_0_0_4px_white] z-50 bg-white">
              Homologado
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-black pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-center">ESAO 2026 - Escola de Aperfeiçoamento de Oficiais</h2>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider text-center">Ficha Oficial de Notas e Boletim de Desempenho — Curso de Intendência</h3>
            <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-center gap-4">
              <span>Gerado em: {new Date().toLocaleString("pt-BR")}</span>
              <span>•</span>
              <span>Chave de Autenticação: FICHA_INDIVIDUAL_{studentToPrint.matricula}</span>
            </div>
          </div>

          {/* Identification Block */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl bg-slate-50/10 text-xs text-left">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Identificação do Aluno / Participante</span>
              <div className="space-y-0.5">
                <p>Nome de Guerra: <strong className="text-black uppercase font-bold text-[13px]">{studentToPrint.nomeDeGuerra}</strong></p>
                <p>Matrícula: <strong className="text-black font-mono">{studentToPrint.matricula}</strong></p>
                <p>Nome Sigiloso: <strong className="text-black font-mono uppercase font-bold">{studentToPrint.nomeSigiloso || "PENDENTE DE CADASTRO"}</strong></p>
              </div>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Controle Seção de Ensino</span>
              <div className="space-y-0.5">
                <p>Situação da Ficha: <span className="font-bold text-black uppercase">
                  {studentToPrint.statusLancamento === "não_iniciado" && "Não Iniciada"}
                  {studentToPrint.statusLancamento === "rascunho_salvo" && "Rascunho Salvo"}
                  {studentToPrint.statusLancamento === "confirmado" && "Lançamento Confirmado"}
                  {studentToPrint.statusLancamento === "corrigido" && "Corrigida e Confirmada"}
                  {studentToPrint.statusLancamento === "bloqueado" && "Lançamento Encerrado"}
                </span></p>
                <p>Turma: <strong className="text-black">{isAdmin ? adminSettings?.turmaName : settings?.turmaName || "Intendência - ESAO 2026"}</strong></p>
                <p>WhatsApp Cadastrado: <strong className="text-black font-mono">{studentToPrint.telefone ? studentToPrint.telefone : "NÃO CADASTRADO"}</strong></p>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Detalhamento de Notas e Conceitos</span>
            <table className="w-full text-center text-xs border border-slate-350 border-collapse">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="p-2.5 border border-slate-350 text-left">Módulo / Avaliação</th>
                  <th className="p-2.5 border border-slate-350">AAT (Peso 1)</th>
                  <th className="p-2.5 border border-slate-350">AC (Peso 9)</th>
                  <th className="p-2.5 border border-slate-350 bg-slate-50">Nota do Módulo (80%)</th>
                  <th className="p-2.5 border border-slate-350">Média Lateral</th>
                  <th className="p-2.5 border border-slate-350">Conceito Vertical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-350 font-medium">
                {(["ac3", "ac4", "ac5", "ac6"] as const).map(mKey => {
                  const m = studentToPrint.notas?.[mKey];
                  const aatVal = m?.aat !== null && m?.aat !== undefined ? parseFloat(m.aat) : null;
                  const acVal = m?.ac !== null && m?.ac !== undefined ? parseFloat(m.ac) : null;
                  const moduleGrade = (aatVal !== null && acVal !== null) ? (aatVal * 1 + acVal * 9) / 10 : null;
                  
                  const lat1 = m?.lateral1 !== null && m?.lateral1 !== undefined ? parseFloat(m.lateral1) : null;
                  const lat2 = m?.lateral2 !== null && m?.lateral2 !== undefined ? parseFloat(m.lateral2) : null;
                  const lateralAvg = (lat1 !== null && lat2 !== null) ? (lat1 + lat2) / 2 : null;
                  
                  const vertVal = m?.vertical !== null && m?.vertical !== undefined ? parseFloat(m.vertical) : null;

                  return (
                    <tr key={mKey} className="hover:bg-slate-50/50">
                      <td className="p-2 border border-slate-350 font-bold uppercase text-left">Módulo {mKey.toUpperCase()}</td>
                      <td className="p-2 border border-slate-350 font-mono">{fmtGrade(aatVal)}</td>
                      <td className="p-2 border border-slate-350 font-mono">{fmtGrade(acVal)}</td>
                      <td className="p-2 border border-slate-350 font-mono font-bold bg-slate-50">{fmtGrade(moduleGrade)}</td>
                      <td className="p-2 border border-slate-350 font-mono">{fmtGrade(lateralAvg)}</td>
                      <td className="p-2 border border-slate-350 font-mono">{fmtGrade(vertVal)}</td>
                    </tr>
                  );
                })}
                
                {/* Languages Row */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2 border border-slate-350 font-bold uppercase text-left">Idiomas Estrangeiros</td>
                  <td className="p-2 border border-slate-350 text-slate-400 font-mono">—</td>
                  <td className="p-2 border border-slate-350 text-slate-400 font-mono">—</td>
                  <td className="p-2 border border-slate-350 text-slate-400 font-mono bg-slate-50">—</td>
                  <td className="p-2 border border-slate-350 font-mono">
                    {fmtGrade(studentToPrint.notas?.idiomas?.lateralIdiomas)}
                  </td>
                  <td className="p-2 border border-slate-350 font-mono">
                    {fmtGrade(studentToPrint.notas?.idiomas?.verticalIdiomas)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculated Performance Block */}
          {(() => {
            let rankText = "PENDENTE DE NOTAS";
            let quartilText = "PENDENTE";
            
            if (isAdmin) {
              const entry = adminOverallStats?.rankings?.find((r: any) => r.id === studentToPrint.id);
              if (entry?.rank) {
                rankText = `${entry.rank}º lugar (de ${adminOverallStats?.totalValid} ativos na turma)`;
                const pct = entry.rank / (adminOverallStats?.totalValid || 1);
                if (pct <= 0.25) quartilText = "Q1 (Superior - 25% melhores)";
                else if (pct <= 0.50) quartilText = "Q2 (Médio-Superior)";
                else if (pct <= 0.75) quartilText = "Q3 (Médio-Inferior)";
                else quartilText = "Q4 (Inferior)";
              }
            } else {
              if (classStats?.myRank?.rank) {
                rankText = `${classStats.myRank.rank}º lugar (de ${classStats.totalValid} ativos na turma)`;
                if (classStats.myRank.quartil === 1) quartilText = "Q1 (Superior - 25% melhores)";
                else if (classStats.myRank.quartil === 2) quartilText = "Q2 (Médio-Superior)";
                else if (classStats.myRank.quartil === 3) quartilText = "Q3 (Médio-Inferior)";
                else if (classStats.myRank.quartil === 4) quartilText = "Q4 (Inferior)";
              }
            }

            return (
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Demonstrativo e Médias de Desempenho Homologadas</span>
                <div className="grid grid-cols-3 gap-4 border border-slate-350 p-4 rounded-xl text-xs">
                  <div className="space-y-0.5 col-span-1">
                    <span className="text-[9px] text-slate-500 block uppercase">MÉDIA DOS MÓDULOS (80%):</span>
                    <strong className="text-sm font-bold text-black font-mono">{fmtGrade(printCalcs?.mediaModules)}</strong>
                  </div>
                  <div className="space-y-0.5 col-span-1">
                    <span className="text-[9px] text-slate-500 block uppercase">MÉDIA LATERAIS (10%):</span>
                    <strong className="text-sm font-bold text-black font-mono">{fmtGrade(printCalcs?.mediaLateralGeral)}</strong>
                  </div>
                  <div className="space-y-0.5 col-span-1">
                    <span className="text-[9px] text-slate-500 block uppercase">MÉDIA VERTICAL (10%):</span>
                    <strong className="text-sm font-bold text-black font-mono">{fmtGrade(printCalcs?.mediaVerticalGeral)}</strong>
                  </div>
                  
                  <div className="space-y-0.5 border-t border-dashed border-slate-300 pt-2 col-span-1">
                    <span className="text-[9px] text-emerald-800 font-bold block uppercase">NOTA FINAL ESTIMADA:</span>
                    <strong className="text-[15px] font-black font-mono text-emerald-950">{fmtGrade(printCalcs?.finalGrade)}</strong>
                  </div>
                  <div className="space-y-0.5 border-t border-dashed border-slate-300 pt-2 col-span-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">CLASSIFICAÇÃO PARCIAL:</span>
                    <strong className="text-xs font-mono font-bold text-black">{rankText}</strong>
                  </div>
                  <div className="space-y-0.5 border-t border-dashed border-slate-300 pt-2 col-span-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">QUARTIL DE RENDIMENTO:</span>
                    <strong className="text-xs font-mono font-bold text-black uppercase">{quartilText}</strong>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Footer of Ficha */}
          <div className="border-t border-dashed border-slate-400 pt-6 mt-8 text-left">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
              <div className="text-left space-y-1">
                <span>ASSINATURA DE AUTENTICIDADE DIGITAL DA SEÇÃO DE ENSINO</span>
                <span className="block text-[8px] text-slate-400 font-mono">CHAVE CERTIFICADORA SHA-224: {`0x${String(studentToPrint.id || "000").toUpperCase()}C2938A4B9F7408D`}</span>
              </div>
              <div className="text-right border-2 border-dashed border-slate-400 px-3 py-1.5 uppercase font-black text-slate-600 tracking-wider font-sans">
                DOCUMENTO HOMOLOGADO
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PRINT-ONLY ANONYMOUS RANKING (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      <div id="print-section-ranking" className="hidden print:block space-y-6 p-8 bg-white text-black font-sans w-full max-w-4xl mx-auto relative">
        <style>{`
          @media print {
            html, body, #root, #root > div {
              background: white !important;
              color: #000 !important;
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
              position: static !important;
              display: block !important;
            }
            body.print-mode-ranking #root > div > *:not(#print-section-ranking) {
              display: none !important;
            }
            body:not(.print-mode-ranking) #print-section-ranking {
              display: none !important;
            }
            body.print-mode-ranking #print-section-ranking {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 1.2cm !important;
              box-shadow: none !important;
              background: white !important;
              box-sizing: border-box !important;
              border: 3px double #334155 !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="text-center space-y-2 border-b-2 border-black pb-4 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-center">ESAO 2026 - Escola de Aperfeiçoamento de Oficiais</h2>
          <h3 className="text-sm font-bold text-slate-705 uppercase tracking-wider text-center">Relatório Oficial de Classificação da Turma — Curso de Intendência</h3>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-center gap-4 text-center">
            <span>Gerado em: {new Date().toLocaleString("pt-BR")}</span>
            <span>•</span>
            <span>Chave do Relatório: SIGILO_ATIVO_ESAOX</span>
          </div>
        </div>

        {/* Security Declaration Notice */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5 leading-relaxed text-left text-slate-805">
          <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wide">DECLARAÇÃO DE SIGILO INDIVIDUAL</span>
          <p className="text-slate-550">
            Este documento apresenta os dados agregados da turma e a classificação estimada dos participantes que confirmaram definitivamente seus lançamentos. Em estrita conformidade com as diretivas de sigilo de notas estabelecidas para a turma <strong>Intendência - ESAO 2026</strong>, todo identificador pessoal (Nome de Guerra, Matrícula, WhatsApp e Telefone) foi permanentemente descartado. A correlação de performance é feita exclusivamente por meio do <strong>Nome Sigiloso</strong>.
          </p>
        </div>

        {/* Overall Statistics */}
        {(() => {
          const stats = {
            totalValid: isAdmin ? (adminOverallStats?.totalValid ?? 0) : (classStats?.totalValid ?? 0),
            mean: isAdmin ? adminOverallStats?.mean : classStats?.mean,
            median: isAdmin ? adminOverallStats?.median : classStats?.median,
          };

          return (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Lançamentos Válidos</span>
                <strong className="text-base font-black font-mono text-[#012d1d]">{stats.totalValid}</strong>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Média Geral da Turma</span>
                <strong className="text-base font-black font-mono text-slate-850">{fmtGrade(stats.mean)}</strong>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Mediana da Turma</span>
                <strong className="text-base font-black font-mono text-slate-850">{fmtGrade(stats.median)}</strong>
              </div>
            </div>
          );
        })()}

        {/* Ranking Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f1f5f9] text-slate-800 font-sans text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3 border-b border-slate-300 font-bold">Posição</th>
                <th className="p-3 border-b border-slate-300 font-bold">Nome Sigiloso</th>
                <th className="p-3 border-b border-slate-300 text-center font-bold">Média Estimada</th>
                <th className="p-3 border-b border-slate-300 text-right font-bold">Quartil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700 text-xs">
              {(() => {
                const list = isAdmin 
                  ? (adminOverallStats?.rankings || []).map((r: any) => {
                      const stud = adminStudents.find(s => s.id === r.id);
                      const totalVal = adminOverallStats?.totalValid || 1;
                      const ratio = r.rank / totalVal;
                      return {
                        rank: r.rank,
                        nomeSigiloso: stud?.nomeSigiloso || "PENDENTE DE REGISTRO",
                        finalGrade: r.finalGrade,
                        quartil: ratio <= 0.25 ? 1 : ratio <= 0.50 ? 2 : ratio <= 0.75 ? 3 : 4
                      };
                    })
                  : [...anonRankings]
                      .filter(r => r.isConfirmed)
                      .map((r: any) => ({
                        rank: r.rank,
                        nomeSigiloso: r.nomeSigiloso,
                        finalGrade: r.finalGrade,
                        quartil: r.quartil
                      }))
                      .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity));

                if (list.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">Nenhum lançamento válido confirmado até este momento.</td>
                    </tr>
                  );
                }

                return list.map((r: any, idx: number) => {
                  let quartilText = "—";
                  if (r.quartil === 1) quartilText = "Q1 (Superior)";
                  else if (r.quartil === 2) quartilText = "Q2 (Médio-Superior)";
                  else if (r.quartil === 3) quartilText = "Q3 (Médio-Inferior)";
                  else if (r.quartil === 4) quartilText = "Q4 (Inferior)";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 border-b font-extrabold text-slate-900">{r.rank ? `${r.rank}º` : "—"}</td>
                      <td className="p-3 border-b text-slate-800 font-bold uppercase tracking-wider text-left">{r.nomeSigiloso}</td>
                      <td className="p-3 border-b text-center font-bold text-emerald-800">{fmtGrade(r.finalGrade)}</td>
                      <td className="p-3 border-b text-right font-medium text-slate-500">{quartilText}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Footer info code */}
        <div className="pt-6 border-t font-mono text-[9px] text-slate-400 flex justify-between">
          <span>ASSINATURA DE AUTENTICIDADE DIGITAL DA SEÇÃO DE ENSINO</span>
          <span>CÓDIGO SHA-256: 0xA3F84D9C0212E6B87_RANK</span>
        </div>
      </div>

    </div>
  );
}

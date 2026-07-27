/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GradeInput {
  aat: number | null;
  ac: number | null;
  lateral1: number | null;
  lateral2: number | null;
  vertical: number | null;
}

export interface IdiomasInput {
  lateralIdiomas: number | null;
  verticalIdiomas: number | null;
}

export interface NotasInput {
  ac3: GradeInput;
  ac4: GradeInput;
  ac5: GradeInput;
  ac6: GradeInput;
  idiomas: IdiomasInput;
}

export interface EditLog {
  dataHora: string;
  usuarioAlterou: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
}

export interface AppNotification {
  id: string;
  message: string;
  dataHora: string;
  read: boolean;
  type: "status_updated" | "grade_corrected" | "unblocked" | "blocked" | "system";
}

export interface Student {
  id: string; // matrícula
  nomeDeGuerra: string;
  matricula: string;
  senha?: string;
  isPasswordChanged: boolean;
  situacao: "ativo" | "inativo";
  telefone: string;
  statusLancamento: "não_iniciado" | "rascunho_salvo" | "confirmado" | "corrigido" | "bloqueado";
  notas: NotasInput | null;
  historico: EditLog[];
  notifications?: AppNotification[];
}

export interface ClassStats {
  totalValid: number;
  mean: number;
  median: number;
  myRank?: {
    rank: number;
    quartil: number;
    finalGrade: number;
  } | null;
}

export interface MilestoneLog {
  id: string;
  marco: number;
  quantidadeParticipantes: number;
  dataHora: string;
  quantidadeMensagens: number;
  status: string;
  detalhes: Array<{
    id: string;
    studentId: string;
    nomeDeGuerra: string;
    telefone: string;
    text: string;
    timestamp: string;
  }>;
}

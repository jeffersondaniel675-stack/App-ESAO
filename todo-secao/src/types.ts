export type TipoAcesso = 'admin' | 'membro';
export type Status = 'pendente' | 'em_andamento' | 'concluida';
export type Prioridade = 'baixa' | 'media' | 'alta';

export interface User {
  id: string;
  nomeGuerra: string;
  tipoAcesso: TipoAcesso;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  criadoPor: string;
  prioridade: Prioridade;
  status: Status;
  prazo: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export const STATUS_LABEL: Record<Status, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

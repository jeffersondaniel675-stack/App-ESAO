/**
 * Sistema da Companhia — backend em Google Apps Script.
 *
 * A planilha Google é a base de dados: cada aba é uma tabela, a linha 1 é o
 * cabeçalho e a primeira coluna é a chave (id, email, chave ou data).
 * Toda a regra de negócio (geração de escala, folgas, textos de aditamento)
 * roda no navegador; aqui ficam só leitura/gravação, permissões, upload de
 * arquivos para o Drive e geração de Google Docs.
 */

const TABELAS = {
  Militares: ['id', 'postoGrad', 'numero', 'nomeGuerra', 'nomeCompleto', 'antiguidade', 'idt', 'pelotao', 'funcao', 'telefone', 'ativo', 'obs'],
  Impedimentos: ['id', 'militarId', 'tipo', 'inicio', 'fim', 'obs'],
  TiposServico: ['id', 'nome', 'postos', 'ordem', 'ativo'],
  Escala: ['id', 'data', 'tipoId', 'militarId', 'cor', 'obs'],
  Feriados: ['data', 'descricao'],
  Missoes: ['id', 'titulo', 'tipo', 'local', 'inicio', 'fim', 'horario', 'responsavelId', 'militaresIds', 'viaturas', 'material', 'descricao', 'status', 'arquivoUrl'],
  Aditamentos: ['id', 'numero', 'data', 'biNumero', 'dataServico', 'parte1', 'parte2', 'parte3', 'parte4', 'status', 'docUrl', 'autor'],
  Material: ['id', 'patrimonio', 'descricao', 'categoria', 'quantidade', 'unidade', 'localizacao', 'estado', 'valor', 'ultimaConferencia', 'obs', 'arquivoUrl'],
  Cautelas: ['id', 'materialId', 'militarId', 'quantidade', 'dataSaida', 'previsaoDevolucao', 'dataDevolucao', 'status', 'obs', 'arquivoUrl'],
  Usuarios: ['email', 'nome', 'perfil'],
  Config: ['chave', 'valor'],
  Log: ['quando', 'usuario', 'acao', 'tabela', 'registro']
};

const SOMENTE_ADMIN = ['Usuarios', 'Config'];
const SOMENTE_LEITURA = ['Log'];

const CONFIG_PADRAO = {
  cabecalho: 'MINISTÉRIO DA DEFESA\nEXÉRCITO BRASILEIRO\nNOME DA OM\nNOME DA SUBUNIDADE',
  nomeCia: 'Companhia',
  cidade: 'Cidade - UF',
  cmtNome: 'NOME COMPLETO - Cap',
  cmtFuncao: 'Comandante da Companhia',
  pastaDriveId: ''
};

const TIPOS_PADRAO = [
  { id: 'of-dia', nome: 'Oficial de Dia', postos: 'Cap,1º Ten,2º Ten,Asp', ordem: 1, ativo: 'Sim' },
  { id: 'sgt-dia', nome: 'Sargento de Dia', postos: 'ST,1º Sgt,2º Sgt,3º Sgt', ordem: 2, ativo: 'Sim' },
  { id: 'cb-gda', nome: 'Cabo da Guarda', postos: 'Cb', ordem: 3, ativo: 'Sim' },
  { id: 'plantao', nome: 'Plantão', postos: 'Sd', ordem: 4, ativo: 'Sim' }
];

// ---------------------------------------------------------------- web app

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema da Companhia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sistema da Cia')
    .addItem('Configurar / atualizar planilha', 'setup')
    .addToUi();
}

/** Cria as abas que faltam, os cabeçalhos, a pasta no Drive e os dados iniciais. Rode uma vez pelo editor. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('PLANILHA_ID', ss.getId());

  Object.keys(TABELAS).forEach(function (nome) {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    const esperado = TABELAS[nome];
    const atual = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String) : [];
    const faltando = esperado.filter(function (h) { return atual.indexOf(h) < 0; });
    const cabecalho = atual.concat(faltando);
    sh.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold').setBackground('#3d4a2a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // Tudo como texto: evita que o Sheets converta datas e números por conta própria.
    sh.getRange(1, 1, sh.getMaxRows(), Math.max(cabecalho.length, sh.getMaxColumns())).setNumberFormat('@');
  });

  const padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
  if (padrao && padrao.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(padrao);

  const config = lerTabela_('Config');
  const chaves = config.map(function (c) { return c.chave; });
  const novas = Object.keys(CONFIG_PADRAO).filter(function (k) { return chaves.indexOf(k) < 0; })
    .map(function (k) { return { chave: k, valor: CONFIG_PADRAO[k] }; });
  if (novas.length) gravar_('Config', novas, []);

  const cfg = configMap_();
  if (!cfg.pastaDriveId) {
    const pasta = DriveApp.createFolder('Arquivos - ' + ss.getName());
    gravar_('Config', [{ chave: 'pastaDriveId', valor: pasta.getId() }], []);
  }

  if (!lerTabela_('TiposServico').length) gravar_('TiposServico', TIPOS_PADRAO, []);

  const email = Session.getActiveUser().getEmail();
  if (email && !lerTabela_('Usuarios').length) gravar_('Usuarios', [{ email: email, nome: 'Administrador', perfil: 'admin' }], []);
}

// ---------------------------------------------------------------- API chamada pela página

/** Carrega tudo o que a página precisa numa única chamada. */
function bootstrap() {
  const u = usuario_();
  if (u.perfil === 'bloqueado') throw new Error('Seu e-mail (' + u.email + ') não está autorizado. Peça ao administrador para cadastrá-lo na aba Usuarios.');
  const dados = {};
  Object.keys(TABELAS).forEach(function (t) {
    if (t === 'Log') return;
    if (t === 'Usuarios' && u.perfil !== 'admin') return;
    dados[t] = lerTabela_(t);
  });
  return { usuario: u, dados: dados };
}

/**
 * Grava (insere ou atualiza pela chave) os registros de `lista` e exclui as chaves de `excluir`.
 * Devolve os registros gravados, já com id.
 */
function salvarLote(tabela, lista, excluir) {
  exigirEscrita_(tabela);
  const salvos = gravar_(tabela, lista || [], excluir || []);
  const resumo = (lista || []).length + ' gravado(s), ' + (excluir || []).length + ' excluído(s)';
  registrarLog_('salvar', tabela, resumo);
  return salvos;
}

/** Recebe um arquivo em base64, salva na pasta do sistema no Drive e devolve o link. */
function uploadArquivo(nome, mime, base64) {
  exigirEscrita_('Material');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime || 'application/octet-stream', nome);
  const arquivo = pasta_().createFile(blob);
  registrarLog_('upload', 'Drive', nome);
  return { url: arquivo.getUrl(), id: arquivo.getId(), nome: nome };
}

/** Lê a primeira aba (ou a aba informada) de outra planilha do Drive, para importação. */
function importarDePlanilha(url, nomeAba) {
  exigirEscrita_('Material');
  const ss = /^https?:/.test(url) ? SpreadsheetApp.openByUrl(url) : SpreadsheetApp.openById(url);
  const sh = nomeAba ? ss.getSheetByName(nomeAba) : ss.getSheets()[0];
  if (!sh) throw new Error('Aba "' + nomeAba + '" não encontrada.');
  return sh.getDataRange().getDisplayValues();
}

/** Gera um Google Doc do aditamento na pasta do sistema e grava o link no registro. */
function criarDocAditamento(id, titulo, paragrafos) {
  exigirEscrita_('Aditamentos');
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();
  body.setMarginTop(56).setMarginBottom(56).setMarginLeft(70).setMarginRight(56);
  paragrafos.forEach(function (p) {
    const par = body.appendParagraph(p.texto || '');
    par.setFontFamily('Times New Roman').setFontSize(12);
    if (p.centro) par.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    else if (p.direita) par.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    else par.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    if (p.negrito) par.editAsText().setBold(true);
  });
  const primeiro = body.getChild(0);
  if (primeiro && primeiro.asParagraph && primeiro.asParagraph().getText() === '') body.removeChild(primeiro);
  doc.saveAndClose();
  const arquivo = DriveApp.getFileById(doc.getId());
  arquivo.moveTo(pasta_());
  const url = arquivo.getUrl();
  const atual = lerTabela_('Aditamentos').filter(function (a) { return a.id === id; })[0];
  if (atual) { atual.docUrl = url; gravar_('Aditamentos', [atual], []); }
  registrarLog_('gerar doc', 'Aditamentos', titulo);
  return url;
}

// ---------------------------------------------------------------- permissões

function usuario_() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const usuarios = lerTabela_('Usuarios');
  if (!usuarios.length) return { email: email, nome: email, perfil: 'admin' };
  const u = usuarios.filter(function (x) { return String(x.email).toLowerCase() === email; })[0];
  if (!u) return { email: email, nome: email, perfil: 'bloqueado' };
  return { email: email, nome: u.nome || email, perfil: u.perfil || 'leitor' };
}

function exigirEscrita_(tabela) {
  if (!TABELAS[tabela] && tabela !== 'Drive') throw new Error('Tabela desconhecida: ' + tabela);
  if (SOMENTE_LEITURA.indexOf(tabela) >= 0) throw new Error('A tabela ' + tabela + ' é somente leitura.');
  const perfil = usuario_().perfil;
  if (perfil === 'admin') return;
  if (perfil === 'editor' && SOMENTE_ADMIN.indexOf(tabela) < 0) return;
  throw new Error('Seu perfil (' + perfil + ') não permite alterar ' + tabela + '.');
}

// ---------------------------------------------------------------- acesso à planilha

function planilha_() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function aba_(tabela) {
  const sh = planilha_().getSheetByName(tabela);
  if (!sh) throw new Error('Aba "' + tabela + '" não existe. Rode a função setup() no editor do Apps Script.');
  return sh;
}

function texto_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

function lerTabela_(tabela) {
  const sh = planilha_().getSheetByName(tabela);
  if (!sh || sh.getLastRow() < 1) return [];
  const valores = sh.getDataRange().getValues();
  const cab = valores.shift();
  return valores
    .filter(function (l) { return l[0] !== '' && l[0] !== null; })
    .map(function (l) {
      const o = {};
      cab.forEach(function (h, i) { if (h) o[h] = texto_(l[i]); });
      return o;
    });
}

function gravar_(tabela, lista, excluir) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = aba_(tabela);
    const valores = sh.getDataRange().getValues();
    const cab = valores.shift();
    const chave = cab[0];
    const linhas = valores.filter(function (l) { return l[0] !== '' && excluir.indexOf(texto_(l[0])) < 0; });
    const indice = {};
    linhas.forEach(function (l, i) { indice[texto_(l[0])] = i; });

    const salvos = lista.map(function (obj) {
      const o = Object.assign({}, obj);
      if (chave === 'id' && !o.id) o.id = Utilities.getUuid().slice(0, 8);
      if (!o[chave]) throw new Error('Registro sem ' + chave + ' em ' + tabela + '.');
      const k = String(o[chave]);
      const linha = cab.map(function (h) { return o[h] === undefined || o[h] === null ? '' : String(o[h]); });
      if (k in indice) {
        const antiga = linhas[indice[k]];
        // Campos que o cliente não enviou mantêm o valor que já estava na planilha.
        cab.forEach(function (h, i) { if (!(h in o)) linha[i] = antiga[i]; });
        linhas[indice[k]] = linha;
      } else {
        indice[k] = linhas.length;
        linhas.push(linha);
      }
      return o;
    });

    const total = valores.length;
    if (total) sh.getRange(2, 1, total, cab.length).clearContent();
    if (linhas.length) {
      const rng = sh.getRange(2, 1, linhas.length, cab.length);
      rng.setNumberFormat('@');
      rng.setValues(linhas.map(function (l) { return l.map(texto_); }));
    }
    return salvos;
  } finally {
    lock.releaseLock();
  }
}

function configMap_() {
  const m = {};
  lerTabela_('Config').forEach(function (c) { m[c.chave] = c.valor; });
  return m;
}

function pasta_() {
  const id = configMap_().pastaDriveId;
  if (!id) throw new Error('Pasta do Drive não configurada. Rode setup() no editor do Apps Script.');
  return DriveApp.getFolderById(id);
}

function registrarLog_(acao, tabela, registro) {
  try {
    const sh = planilha_().getSheetByName('Log');
    if (!sh) return;
    const quando = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([quando, Session.getActiveUser().getEmail(), acao, tabela, registro]);
  } catch (e) {
    console.warn('Falha ao registrar log: ' + e);
  }
}

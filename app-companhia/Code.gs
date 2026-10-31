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
  Militares: ['id', 'postoGrad', 'numero', 'nomeGuerra', 'nomeCompleto', 'antiguidade', 'idt', 'pelotao', 'funcao', 'telefone', 'ativo', 'obs',
    'dataNascimento', 'cpf', 'precCp', 'tipoSanguineo', 'peso', 'email', 'endereco', 'cttEmergencia', 'nomeCtt', 'parentesco', 'cnh', 'motoristaMilitar', 'veiculo'],
  Impedimentos: ['id', 'militarId', 'tipo', 'inicio', 'fim', 'obs', 'referencia'],
  TiposServico: ['id', 'nome', 'postos', 'ordem', 'ativo', 'grupo', 'dias', 'automatico', 'qtd', 'folga', 'contagem'],
  Escala: ['id', 'data', 'tipoId', 'militarId', 'cor', 'obs'],
  Feriados: ['data', 'descricao'],
  Missoes: ['id', 'titulo', 'tipo', 'local', 'inicio', 'fim', 'horario', 'responsavelId', 'militaresIds', 'viaturas', 'material', 'descricao', 'status', 'arquivoUrl'],
  Aditamentos: ['id', 'numero', 'data', 'biNumero', 'dataServico', 'parte1', 'parte2', 'parte3', 'parte4', 'status', 'docUrl', 'pdfUrl', 'autor', 'servicoAte', 'servicos'],
  Material: ['id', 'patrimonio', 'descricao', 'categoria', 'quantidade', 'unidade', 'localizacao', 'estado', 'valor', 'ultimaConferencia', 'obs', 'arquivoUrl', 'tipoMaterial', 'nrFicha', 'codMat', 'contaContabil', 'acervo'],
  Cautelas: ['id', 'materialId', 'militarId', 'quantidade', 'dataSaida', 'previsaoDevolucao', 'dataDevolucao', 'status', 'obs', 'arquivoUrl', 'numero', 'numeracao', 'destino', 'especificacao'],
  Pedidos: ['id', 'numero', 'data', 'de', 'para', 'itens', 'status', 'obs', 'arquivoUrl', 'autor'],
  Usuarios: ['email', 'nome', 'perfil'],
  Config: ['chave', 'valor'],
  Documentos: ['id', 'data', 'tipo', 'titulo', 'referencia', 'url', 'autor', 'formato'],
  Acessos: ['email', 'nome', 'data', 'status'],
  Log: ['quando', 'usuario', 'acao', 'tabela', 'registro']
};

const SOMENTE_ADMIN = ['Usuarios', 'Config'];
// Usuarios e Acessos só mudam pelas funções de acesso abaixo, que também compartilham a planilha e a pasta.
const SOMENTE_LEITURA = ['Log', 'Usuarios', 'Acessos'];
const PERFIS = ['admin', 'editor', 'leitor'];

const CONFIG_PADRAO = {
  cabecalho: 'MINISTÉRIO DA DEFESA\nEXÉRCITO BRASILEIRO\n11º DEPÓSITO DE SUPRIMENTO\n1ª COMPANHIA',
  sigla: '1ª Cia',
  siglaOM: '11º D Sup',
  nomeCia: 'Sistema da 1ª Companhia',
  cidade: 'Quartel em Brasília-DF',
  cmtNome: 'NOME DO COMANDANTE – Cap',
  cmtFuncao: 'Cmt Cia',
  pastaDriveId: ''
};

// Serviços da 1ª Cia: Of Dia (tenentes), Adjunto (1º e 2º Sgt), Sgt Dia e Cmt Gda (3º Sgt), Cb Gda e Cb Dia (cabos), Sentinela e Permanência (soldados).
const TIPOS_PADRAO = [
  { id: 'of-dia', nome: 'Oficial de Dia', postos: '1º Ten,2º Ten', ordem: 1, ativo: 'Sim', grupo: 'Externo', dias: 'Todos', automatico: 'Sim', qtd: 1 },
  { id: 'adj', nome: 'Adjunto', postos: '1º Sgt,2º Sgt', ordem: 2, ativo: 'Sim', grupo: 'Externo', dias: 'Todos', automatico: 'Sim', qtd: 1 },
  { id: 'sgt-dia', nome: 'Sargento de Dia', postos: '3º Sgt', ordem: 3, ativo: 'Sim', grupo: 'Interno', dias: 'Todos', automatico: 'Sim', qtd: 1 },
  { id: 'cmt-gda', nome: 'Comandante da Guarda', postos: '3º Sgt', ordem: 4, ativo: 'Sim', grupo: 'Externo', dias: 'Todos', automatico: 'Sim', qtd: 1 },
  { id: 'cb-gda', nome: 'Cabo da Guarda', postos: 'Cb', ordem: 5, ativo: 'Sim', grupo: 'Externo', dias: 'Todos', automatico: 'Sim', qtd: 1, folga: 'Cabos' },
  { id: 'cb-dia', nome: 'Cabo de Dia', postos: 'Cb', ordem: 6, ativo: 'Sim', grupo: 'Interno', dias: 'Todos', automatico: 'Sim', qtd: 1, folga: 'Cabos' },
  { id: 'sentinela', nome: 'Sentinela', postos: 'Sd EP,Sd EV,Sd', ordem: 7, ativo: 'Sim', grupo: 'Externo', dias: 'Todos', automatico: 'Sim', qtd: 1, folga: 'Soldados' },
  { id: 'permanencia', nome: 'Permanência', postos: 'Sd EP,Sd EV,Sd', ordem: 8, ativo: 'Sim', grupo: 'Interno', dias: 'Todos', automatico: 'Sim', qtd: 1, folga: 'Soldados' }
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
  protegerAbas_();
}

// ---------------------------------------------------------------- API chamada pela página

/** Carrega tudo o que a página precisa numa única chamada. */
function bootstrap() {
  const u = usuario_();
  if (u.perfil === 'bloqueado') {
    // Quem não está cadastrado vê só a tela de pedido de acesso, com a identificação da Cia.
    const cfg = configMap_();
    const pedido = lerTabela_('Acessos').filter(function (a) { return a.email === u.email && a.status === 'Pendente'; })[0];
    return { usuario: u, pendente: !!pedido, dados: { Config: ['sigla', 'nomeCia', 'cabecalho'].map(function (k) { return { chave: k, valor: cfg[k] || '' }; }) } };
  }
  const dados = {};
  Object.keys(TABELAS).forEach(function (t) {
    if (t === 'Log') return;
    if ((t === 'Usuarios' || t === 'Acessos') && u.perfil !== 'admin') return;
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

/**
 * Converte o documento (HTML pronto para impressão) em PDF e arquiva em
 * "Arquivos - …/PDFs/<tipo>/<ano>/" no Drive, registrando na aba Documentos.
 */
function salvarPdf(tipo, titulo, html, referencia) {
  exigirEscrita_('Documentos');
  const agora = new Date();
  const tz = Session.getScriptTimeZone();
  const ano = Utilities.formatDate(agora, tz, 'yyyy');
  const nome = String(titulo).replace(/[\\/:*?"<>|]/g, '-') + '.pdf';
  const pdf = HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF).setName(nome);
  const arquivo = subpasta_(['PDFs', tipo, ano]).createFile(pdf);
  const registro = {
    data: Utilities.formatDate(agora, tz, 'yyyy-MM-dd HH:mm'), tipo: tipo, titulo: titulo,
    referencia: referencia || '', url: arquivo.getUrl(), autor: Session.getActiveUser().getEmail(), formato: 'PDF'
  };
  const salvo = gravar_('Documentos', [registro], [])[0];
  if (tipo === 'Aditamentos' && referencia) {
    const ad = lerTabela_('Aditamentos').filter(function (a) { return a.id === referencia; })[0];
    if (ad) { ad.pdfUrl = salvo.url; gravar_('Aditamentos', [ad], []); }
  }
  registrarLog_('arquivar pdf', tipo, titulo);
  return salvo;
}

/**
 * Gera um Google Doc editável (abre no Word como .docx) a partir dos blocos do documento,
 * guarda em "Arquivos - …/Google Docs/<tipo>/<ano>/" e registra na aba Documentos.
 * Blocos: { p: texto, c, b, i, r, sz, mt } parágrafo · { img: dataURL, w } imagem ·
 * { t: [[célula]], w: [%], h: linhas de cabeçalho, sz, sem: sem bordas } tabela, célula = texto ou { v, b, i, c, l, span } ·
 * { esp: n } linhas em branco · { paisagem: true } página deitada.
 */
function criarDoc(tipo, titulo, blocos, referencia) {
  exigirEscrita_('Documentos');
  const doc = DocumentApp.create(String(titulo).replace(/[\\/:*?"<>|]/g, '-'));
  const body = doc.getBody();
  if (blocos.some(function (b) { return b.paisagem; })) body.setPageWidth(842).setPageHeight(595);
  body.setMarginTop(40).setMarginBottom(40).setMarginLeft(56).setMarginRight(40);
  const largura = body.getPageWidth() - body.getMarginLeft() - body.getMarginRight();
  const AL = DocumentApp.HorizontalAlignment;
  const estilo = function (par, o, sz) {
    par.setFontFamily('Arial').setFontSize(o.sz || sz || 10).setSpacingAfter(0).setSpacingBefore(o.mt || 0).setLineSpacing(1.1);
    par.setAlignment(o.c ? AL.CENTER : o.r ? AL.RIGHT : o.l ? AL.LEFT : AL.JUSTIFY);
    if (par.getText()) par.editAsText().setBold(!!o.b).setItalic(!!o.i);
  };
  blocos.forEach(function (b) {
    if (b.paisagem) return;
    if (b.esp) { for (let k = 0; k < b.esp; k++) estilo(body.appendParagraph(''), {}); return; }
    if (b.img) {
      const m = String(b.img).match(/^data:(.+?);base64,(.*)$/);
      if (!m) return;
      const par = body.appendParagraph('').setAlignment(AL.CENTER);
      const im = par.appendInlineImage(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1]));
      const w = b.w || 60;
      im.setHeight(Math.round(im.getHeight() * w / im.getWidth())).setWidth(w);
      return;
    }
    if (b.t) {
      const cols = Math.max.apply(null, b.t.map(function (l) { return l.reduce(function (n, c) { return n + ((c && c.span) || 1); }, 0); }));
      const texto = b.t.map(function (l) {
        const linha = [];
        l.forEach(function (c) { linha.push(c && typeof c === 'object' ? String(c.v || '') : String(c == null ? '' : c)); for (let k = 1; k < ((c && c.span) || 1); k++) linha.push(''); });
        while (linha.length < cols) linha.push('');
        return linha;
      });
      const t = body.appendTable(texto);
      t.setBorderWidth(b.sem ? 0 : 0.75);
      b.t.forEach(function (l, r) {
        let col = 0;
        l.forEach(function (c) {
          const o = c && typeof c === 'object' ? c : {};
          const cel = t.getCell(r, col).setPaddingTop(1).setPaddingBottom(1).setPaddingLeft(4).setPaddingRight(4);
          for (let k = 0; k < cel.getNumChildren(); k++) {
            const par = cel.getChild(k).asParagraph();
            estilo(par, { b: o.b || r < (b.h || 0), i: o.i, c: o.l ? false : (o.c !== undefined ? o.c : !b.esq), l: o.l || b.esq, sz: b.sz || 9 });
          }
          col += o.span || 1;
        });
      });
      (b.w || []).forEach(function (pct, i) { if (i < cols) t.setColumnWidth(i, largura * pct / 100); });
      // Mescla as células com span (da direita para a esquerda, para não deslocar índices).
      b.t.forEach(function (l, r) {
        let col = 0;
        const spans = [];
        l.forEach(function (c) { const n = (c && c.span) || 1; if (n > 1) spans.push([col, n]); col += n; });
        spans.reverse().forEach(function (sp) { for (let k = sp[0] + sp[1] - 1; k > sp[0]; k--) t.getCell(r, k).merge(); });
      });
      return;
    }
    estilo(body.appendParagraph(b.p || ''), b);
  });
  const primeiro = body.getChild(0);
  if (body.getNumChildren() > 1 && primeiro.getType() === DocumentApp.ElementType.PARAGRAPH && primeiro.asParagraph().getText() === '' && !primeiro.asParagraph().getNumChildren()) body.removeChild(primeiro);
  doc.saveAndClose();
  const agora = new Date(), tz = Session.getScriptTimeZone();
  const arquivo = DriveApp.getFileById(doc.getId());
  arquivo.moveTo(subpasta_(['Google Docs', tipo, Utilities.formatDate(agora, tz, 'yyyy')]));
  const registro = gravar_('Documentos', [{
    data: Utilities.formatDate(agora, tz, 'yyyy-MM-dd HH:mm'), tipo: tipo, titulo: titulo, referencia: referencia || '',
    url: arquivo.getUrl(), autor: Session.getActiveUser().getEmail(), formato: 'Google Doc'
  }], [])[0];
  if (tipo === 'Aditamentos' && referencia) {
    const ad = lerTabela_('Aditamentos').filter(function (a) { return a.id === referencia; })[0];
    if (ad) { ad.docUrl = registro.url; gravar_('Aditamentos', [ad], []); }
  }
  registrarLog_('gerar doc', tipo, titulo);
  return registro;
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

// ---------------------------------------------------------------- acesso de usuários

/** E-mail de quem está acessando. Funciona mesmo sem acesso à planilha (tela "sem acesso"). */
function quemSou() {
  return { email: (Session.getActiveUser().getEmail() || '').toLowerCase() };
}

/** Quem não está cadastrado registra o pedido; o e-mail vem da sessão Google, nunca do formulário. */
function pedirAcesso(nome) {
  const u = usuario_();
  if (u.perfil !== 'bloqueado') return { situacao: 'ja-cadastrado' };
  if (!u.email) throw new Error('Não foi possível identificar o seu e-mail Google.');
  const atual = lerTabela_('Acessos').filter(function (a) { return a.email === u.email; })[0];
  if (atual && atual.status === 'Pendente') return { situacao: 'pendente' };
  const data = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  gravar_('Acessos', [{ email: u.email, nome: String(nome || '').trim().slice(0, 120), data: data, status: 'Pendente' }], []);
  registrarLog_('pedir acesso', 'Acessos', u.email);
  return { situacao: 'registrado' };
}

/**
 * Cadastra ou altera um usuário e ajusta o compartilhamento da planilha e da pasta do sistema:
 * admin e editor como Editor, leitor como Leitor. Admins também podem editar as abas protegidas.
 */
function concederAcesso(email, nome, perfil) {
  exigirAdmin_();
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido: ' + email);
  if (PERFIS.indexOf(perfil) < 0) throw new Error('Perfil inválido: ' + perfil);
  const anterior = lerTabela_('Usuarios').filter(function (x) { return x.email === email; })[0];
  if (anterior && anterior.perfil === 'admin' && perfil !== 'admin') garantirOutroAdmin_(email);
  const registro = { email: email, nome: String(nome || '').trim(), perfil: perfil };
  gravar_('Usuarios', [registro], []);
  const pedido = lerTabela_('Acessos').filter(function (a) { return a.email === email; })[0];
  if (pedido) gravar_('Acessos', [Object.assign({}, pedido, { status: 'Aprovado' })], []);
  const aviso = compartilhar_(email, perfil);
  registrarLog_('conceder acesso', 'Usuarios', email + ' ' + perfil);
  return { usuario: registro, aviso: aviso };
}

/** Tira o usuário do sistema e o compartilhamento. Não deixa o sistema ficar sem administrador. */
function removerAcesso(email) {
  exigirAdmin_();
  email = String(email || '').trim().toLowerCase();
  if (email === quemSou().email) throw new Error('Você não pode remover o seu próprio acesso.');
  const atual = lerTabela_('Usuarios').filter(function (x) { return x.email === email; })[0];
  if (!atual) return { aviso: '' };
  if (atual.perfil === 'admin') garantirOutroAdmin_(email);
  gravar_('Usuarios', [], [email]);
  const aviso = compartilhar_(email, null);
  registrarLog_('remover acesso', 'Usuarios', email);
  return { aviso: aviso };
}

function recusarAcesso(email) {
  exigirAdmin_();
  const pedido = lerTabela_('Acessos').filter(function (a) { return a.email === email; })[0];
  if (pedido) gravar_('Acessos', [Object.assign({}, pedido, { status: 'Recusado' })], []);
  registrarLog_('recusar acesso', 'Acessos', email);
  return true;
}

function exigirAdmin_() {
  if (usuario_().perfil !== 'admin') throw new Error('Só o administrador cadastra usuários.');
}
function garantirOutroAdmin_(email) {
  const admins = lerTabela_('Usuarios').filter(function (x) { return x.perfil === 'admin' && x.email !== email; });
  if (!admins.length) throw new Error('O sistema precisa de pelo menos um administrador. Cadastre outro admin antes.');
}

/** Ajusta o compartilhamento (perfil null = remove). Devolve um aviso se algo não puder ser feito. */
function compartilhar_(email, perfil) {
  const avisos = [];
  const ss = planilha_();
  let dono = '';
  try { dono = ss.getOwner().getEmail().toLowerCase(); } catch (e) { /* planilha em drive compartilhado */ }
  if (email === dono) return '';
  const alvos = [['a planilha', ss]];
  try { alvos.push(['a pasta do Drive', pasta_()]); } catch (e) { avisos.push('pasta do Drive não configurada'); }
  alvos.forEach(function (par) {
    const nome = par[0], alvo = par[1];
    try {
      const editores = alvo.getEditors().map(function (x) { return x.getEmail().toLowerCase(); });
      const leitores = alvo.getViewers().map(function (x) { return x.getEmail().toLowerCase(); });
      if (perfil === 'admin' || perfil === 'editor') {
        if (editores.indexOf(email) < 0) alvo.addEditor(email);
      } else {
        if (editores.indexOf(email) >= 0) alvo.removeEditor(email);
        if (perfil === 'leitor' && leitores.indexOf(email) < 0) alvo.addViewer(email);
        if (!perfil && leitores.indexOf(email) >= 0) alvo.removeViewer(email);
      }
    } catch (e) { avisos.push('não foi possível ajustar o compartilhamento d' + nome + ' (' + e.message + ')'); }
  });
  try { protegerAbas_(); } catch (e) { avisos.push('não foi possível atualizar a proteção das abas (' + e.message + ')'); }
  return avisos.join('; ');
}

/** Usuarios, Acessos e Config ficam protegidas na planilha: só os admins editam, mesmo abrindo a planilha direto. */
function protegerAbas_() {
  const ss = planilha_();
  const admins = lerTabela_('Usuarios').filter(function (x) { return x.perfil === 'admin'; }).map(function (x) { return x.email; });
  ['Usuarios', 'Acessos', 'Config'].forEach(function (nome) {
    const sh = ss.getSheetByName(nome);
    if (!sh) return;
    const prot = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0] || sh.protect().setDescription('Somente administradores do sistema');
    if (prot.canDomainEdit()) prot.setDomainEdit(false);
    const atuais = prot.getEditors().map(function (x) { return x.getEmail().toLowerCase(); });
    const quero = admins.concat([quemSou().email]);
    try { const dono = ss.getOwner().getEmail().toLowerCase(); quero.push(dono); } catch (e) { /* sem dono pessoal */ }
    const remover = atuais.filter(function (e) { return quero.indexOf(e) < 0; });
    const incluir = admins.filter(function (e) { return atuais.indexOf(e) < 0; });
    if (remover.length) prot.removeEditors(remover);
    if (incluir.length) prot.addEditors(incluir);
  });
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

/** Devolve a aba da tabela, criando-a ou acrescentando colunas novas quando o sistema for atualizado. */
function aba_(tabela) {
  const ss = planilha_();
  let sh = ss.getSheetByName(tabela);
  if (!sh) {
    if (!TABELAS[tabela]) throw new Error('Aba "' + tabela + '" não existe.');
    sh = ss.insertSheet(tabela);
    sh.setFrozenRows(1);
  }
  const esperado = TABELAS[tabela] || [];
  const atual = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String) : [];
  const faltando = esperado.filter(function (h) { return atual.indexOf(h) < 0; });
  if (faltando.length) {
    sh.getRange(1, atual.length + 1, 1, faltando.length).setValues([faltando]).setFontWeight('bold').setBackground('#3d4a2a').setFontColor('#ffffff');
    sh.getRange(1, atual.length + 1, sh.getMaxRows(), faltando.length).setNumberFormat('@');
  }
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

/** Pasta dentro da pasta do sistema, criando o caminho que faltar. */
function subpasta_(nomes) {
  return nomes.reduce(function (pai, nome) {
    const it = pai.getFoldersByName(nome);
    return it.hasNext() ? it.next() : pai.createFolder(nome);
  }, pasta_());
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

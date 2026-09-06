/* ═══════════════════════════════════════════════════════════════════════════
   Gerador de .xlsx para a relação do DCEM.

   Escreve o arquivo do zero — sem biblioteca — para que a planilha saia com a
   mesma forma da aba "Rel DCEM" da planilha da escolha: Times New Roman 11,
   tudo centralizado, células mescladas de Idt, nome e assinatura, larguras de
   coluna, alturas de linha, o vão entre os quadros, e a mesma configuração de
   impressão (A4 retrato, 64%, margens laterais de 1,3 cm, área de impressão
   de A até F, deixando o número de ordem de fora).

   Um .xlsx é um zip de XML. Aqui as entradas vão sem compressão (método
   "stored"), o que dispensa deflate e deixa o gerador pequeno; só o CRC-32
   precisa ser calculado.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────── zip ─────────────────────────── */

  var TABELA_CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(texto) {
    if (window.TextEncoder) return new TextEncoder().encode(texto);
    var s = unescape(encodeURIComponent(texto));
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }

  function zip(arquivos) {
    var partes = [], diretorio = [], deslocamento = 0;

    function num(valor, bytes) {
      var a = new Uint8Array(bytes);
      for (var i = 0; i < bytes; i++) a[i] = (valor >>> (i * 8)) & 0xFF;
      return a;
    }
    function junta() {
      var lista = Array.prototype.slice.call(arguments);
      var total = lista.reduce(function (s, x) { return s + x.length; }, 0);
      var saida = new Uint8Array(total), p = 0;
      lista.forEach(function (x) { saida.set(x, p); p += x.length; });
      return saida;
    }

    arquivos.forEach(function (f) {
      var nome = utf8(f.nome), dados = utf8(f.texto), crc = crc32(dados);
      /* Sem compressão: método 0, tamanho comprimido = tamanho original. */
      var comum = junta(num(20, 2), num(0x0800, 2), num(0, 2), num(0, 2), num(0, 2),
        num(crc, 4), num(dados.length, 4), num(dados.length, 4), num(nome.length, 2));
      partes.push(junta(num(0x04034B50, 4), comum, num(0, 2), nome, dados));
      /* Depois de `comum` vêm, no registro do diretório: tamanho do campo extra,
         tamanho do comentário, disco inicial, atributos internos e externos, e o
         deslocamento da entrada. */
      diretorio.push(junta(num(0x02014B50, 4), num(20, 2), comum,
        num(0, 2), num(0, 2), num(0, 2), num(0, 2), num(0, 4),
        num(deslocamento, 4), nome));
      deslocamento += 30 + nome.length + dados.length;
    });

    var central = junta.apply(null, diretorio);
    var fim = junta(num(0x06054B50, 4), num(0, 2), num(0, 2),
      num(arquivos.length, 2), num(arquivos.length, 2),
      num(central.length, 4), num(deslocamento, 4), num(0, 2));
    return new Blob([junta.apply(null, partes), central, fim],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ─────────────────────────── xml ─────────────────────────── */

  function x(s) {
    return String(s == null ? '' : s)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var CAB = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  /* Estilos, na ordem em que entram no cellXfs (o índice é o "s" da célula):
     0 comum · 1 título · 2 cabeçalho · 3 seção · 4 posto (linha de cima)
     5 A/Q/S (linha de baixo) · 6 mesclada · 7 OM (negrito) · 8 cidade
     9 número de ordem, fora da moldura. */
  var E = { COMUM: 0, TITULO: 1, CABECA: 2, SECAO: 3, POSTO: 4, QAS: 5, MESCLA: 6, OM: 7, CIDADE: 8, ORDEM: 9 };

  function estilos() {
    var fina = '<left style="thin"><color rgb="FF000000"/></left>' +
               '<right style="thin"><color rgb="FF000000"/></right>';
    var topo = '<top style="thin"><color rgb="FF000000"/></top>';
    var base = '<bottom style="thin"><color rgb="FF000000"/></bottom>';
    var bordas = [
      '<border><left/><right/><top/><bottom/><diagonal/></border>',                  /* 0 nenhuma */
      '<border><left/><right/><top/>' + base + '<diagonal/></border>',               /* 1 só embaixo */
      '<border>' + fina + topo + base + '<diagonal/></border>',                      /* 2 moldura */
      '<border>' + fina + topo + '<bottom/><diagonal/></border>',                    /* 3 sem base */
      '<border>' + fina + '<top/>' + base + '<diagonal/></border>'                   /* 4 sem topo */
    ];
    var fontes = [
      '<font><sz val="11"/><color rgb="FF000000"/><name val="Times New Roman"/></font>',
      '<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Times New Roman"/></font>',
      '<font><sz val="10"/><color rgb="FF595959"/><name val="Arial"/></font>'
    ];
    var meio = '<alignment horizontal="center" vertical="center" wrapText="1"/>';
    var esq = '<alignment horizontal="left" vertical="center"/>';
    var xf = function (fonte, borda, alinha) {
      return '<xf numFmtId="49" fontId="' + fonte + '" fillId="0" borderId="' + borda +
        '" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1" applyNumberFormat="1">' + alinha + '</xf>';
    };
    var cellXfs = [
      xf(0, 0, meio), xf(1, 1, esq), xf(1, 2, meio), xf(1, 0, esq),
      xf(0, 3, meio), xf(0, 4, meio), xf(0, 2, meio), xf(1, 3, meio),
      xf(0, 4, meio), xf(2, 0, '<alignment horizontal="right" vertical="center"/>')
    ];
    return CAB + '<styleSheet xmlns="' + NS + '">' +
      '<fonts count="' + fontes.length + '">' + fontes.join('') + '</fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="' + bordas.length + '">' + bordas.join('') + '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + cellXfs.length + '">' + cellXfs.join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';
  }

  /* Toda célula sai como texto: Idt e nomes de OM com número não viram data
     nem notação científica ao abrir a planilha. */
  function celula(col, linha, valor, estilo) {
    if (valor === '' || valor == null) return '<c r="' + col + linha + '" s="' + estilo + '"/>';
    return '<c r="' + col + linha + '" s="' + estilo + '" t="inlineStr"><is><t xml:space="preserve">' +
      x(valor) + '</t></is></c>';
  }

  /* ─────────────────── a planilha da relação ─────────────────── */

  var LARGURAS = [13, 19.1, 51.6, 18.4, 28.4, 13];
  var ALT_LINHA = 22.5, ALT_TITULO = 31.5, ALT_VAO = 3.75;

  function planilha(d) {
    var linhas = [], mesclas = [];
    var r = function (n, altura, celulas) {
      linhas.push('<row r="' + n + '" ht="' + altura + '" customHeight="1">' + celulas + '</row>');
    };

    r(1, ALT_TITULO, celula('A', 1, d.titulo, E.TITULO));
    mesclas.push('A1:F1');

    r(2, ALT_LINHA,
      celula('A', 2, 'POSTO', E.CABECA) + celula('B', 2, 'IDT', E.CABECA) +
      celula('C', 2, 'NOME', E.CABECA) + celula('D', 2, 'OM ORIGEM', E.CABECA) +
      celula('E', 2, 'OM DESTINO', E.CABECA) + celula('F', 2, 'ASSINATURA', E.CABECA));
    r(3, ALT_LINHA,
      celula('A', 3, 'A / Q / S', E.CABECA) + celula('B', 3, '', E.CABECA) +
      celula('C', 3, '', E.CABECA) + celula('D', 3, 'CIDADE-UF', E.CABECA) +
      celula('E', 3, 'CIDADE-UF', E.CABECA) + celula('F', 3, '', E.CABECA));
    mesclas.push('B2:B3', 'C2:C3', 'F2:F3');

    r(4, ALT_LINHA, celula('A', 4, d.secao1, E.SECAO));
    r(5, ALT_LINHA, celula('A', 5, d.secao2, E.SECAO));
    r(6, 3, '');

    d.oficiais.forEach(function (o, i) {
      var n = 7 + i * 3;
      r(n, ALT_LINHA,
        celula('A', n, o.posto, E.POSTO) + celula('B', n, o.idt, E.MESCLA) +
        celula('C', n, o.nome, E.MESCLA) + celula('D', n, o.origem, E.OM) +
        celula('E', n, o.om, E.OM) + celula('F', n, '', E.MESCLA) +
        celula('H', n, String(i + 1), E.ORDEM));
      r(n + 1, ALT_LINHA,
        celula('A', n + 1, o.qm, E.QAS) + celula('B', n + 1, '', E.MESCLA) +
        celula('C', n + 1, '', E.MESCLA) + celula('D', n + 1, o.origemCidade, E.CIDADE) +
        celula('E', n + 1, o.cidade, E.CIDADE) + celula('F', n + 1, '', E.MESCLA));
      r(n + 2, ALT_VAO, '');
      mesclas.push('B' + n + ':B' + (n + 1), 'C' + n + ':C' + (n + 1), 'F' + n + ':F' + (n + 1));
    });

    /* A área de impressão termina na segunda linha do último oficial: o vão que
       vem depois dele não precisa entrar na folha. */
    var ultima = d.oficiais.length ? 7 + (d.oficiais.length - 1) * 3 + 1 : 6;
    var cols = LARGURAS.map(function (w, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');

    return {
      ultima: ultima,
      xml: CAB + '<worksheet xmlns="' + NS + '" xmlns:r="' + NS_REL + '">' +
        '<sheetPr><pageSetUpPr fitToPage="0"/></sheetPr>' +
        '<dimension ref="A1:H' + (ultima + 1) + '"/>' +
        '<sheetViews><sheetView workbookViewId="0" tabSelected="1"/></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="15"/>' +
        '<cols>' + cols + '</cols>' +
        '<sheetData>' + linhas.join('') + '</sheetData>' +
        '<mergeCells count="' + mesclas.length + '">' +
        mesclas.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') +
        '</mergeCells>' +
        /* Mesma configuração de impressão da planilha de origem. */
        '<printOptions/>' +
        '<pageMargins left="0.511811024" right="0.511811024" top="0.787401575"' +
        ' bottom="0.787401575" header="0.31496062" footer="0.31496062"/>' +
        '<pageSetup paperSize="9" scale="64" orientation="portrait"/>' +
        '</worksheet>'
    };
  }

  /* Empacotamento comum: as duas saídas só diferem na planilha em si. */
  function pacote(aba, sheetXml, areaImpressao) {
    return zip([
      { nome: '[Content_Types].xml', texto: CAB +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>' },
      { nome: '_rels/.rels', texto: CAB +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + NS_REL + '/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { nome: 'xl/workbook.xml', texto: CAB +
        '<workbook xmlns="' + NS + '" xmlns:r="' + NS_REL + '">' +
        '<sheets><sheet name="' + x(aba) + '" sheetId="1" r:id="rId1"/></sheets>' +
        (areaImpressao
          ? '<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">' +
            "'" + x(aba) + "'!" + areaImpressao + '</definedName></definedNames>'
          : '') +
        '</workbook>' },
      { nome: 'xl/_rels/workbook.xml.rels', texto: CAB +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + NS_REL + '/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="' + NS_REL + '/styles" Target="styles.xml"/>' +
        '</Relationships>' },
      { nome: 'xl/styles.xml', texto: estilos() },
      { nome: 'xl/worksheets/sheet1.xml', texto: sheetXml }
    ]);
  }

  window.gerarXlsxDcem = function (d) {
    var s = planilha(d);
    return pacote('Rel DCEM', s.xml, '$A$1:$F$' + s.ultima);
  };

  /* Saída simples para os demais quadros: cabeçalho em negrito emoldurado e
     uma linha por registro, com as larguras que o chamador pedir. */
  window.gerarXlsxTabela = function (d) {
    var linhas = [], n = 0;
    var celulas = function (valores, estilo) {
      return valores.map(function (v, i) {
        return celula(String.fromCharCode(65 + i), n, v, estilo);
      }).join('');
    };
    if (d.titulo) {
      n = 1;
      linhas.push('<row r="1" ht="' + ALT_TITULO + '" customHeight="1">' +
        celula('A', 1, d.titulo, E.TITULO) + '</row>');
      n = 2;
      linhas.push('<row r="2"/>');
    }
    n += 1;
    linhas.push('<row r="' + n + '" ht="' + ALT_LINHA + '" customHeight="1">' +
      celulas(d.cabecalho, E.CABECA) + '</row>');
    d.linhas.forEach(function (l) {
      n += 1;
      linhas.push('<row r="' + n + '" ht="' + ALT_LINHA + '" customHeight="1">' +
        celulas(l, E.MESCLA) + '</row>');
    });
    var ultimaCol = String.fromCharCode(65 + d.cabecalho.length - 1);
    var cols = (d.larguras || []).map(function (w, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');
    var xml = CAB + '<worksheet xmlns="' + NS + '" xmlns:r="' + NS_REL + '">' +
      '<dimension ref="A1:' + ultimaCol + n + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" tabSelected="1"/></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      (cols ? '<cols>' + cols + '</cols>' : '') +
      '<sheetData>' + linhas.join('') + '</sheetData>' +
      '<pageMargins left="0.511811024" right="0.511811024" top="0.787401575"' +
      ' bottom="0.787401575" header="0.31496062" footer="0.31496062"/>' +
      '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1"/>' +
      '</worksheet>';
    return pacote(d.aba || 'Planilha1', xml, '$A$1:$' + ultimaCol + '$' + n);
  };
})();

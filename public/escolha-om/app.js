/* ═══════════════════════════════════════════════════════════════════════════
   Cerimônia de Escolha de OM — CAO/Log
   Aplicação de página única, sem dependências. Roda servida pelo sistema
   (/escolha-om/index.html) ou a partir da pasta, com duplo clique.

   Regra da cerimônia, que é o que este programa automatiza:
     1. os concludentes são chamados na ordem da classificação final;
     2. o chamado escolhe uma das vagas ainda disponíveis no quadro;
     3. a vaga escolhida sai do quadro e a chamada segue para o próximo;
     4. vaga com reserva nominal só pode ser tomada pelo oficial indicado;
     5. ao fim, a relação das escolhas vira o documento remetido ao DCEM.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CHAVE = 'escolhaOM.esao.v1';
  var CANAL = 'escolha-om-esao';
  var CMA_POR_RM = { 1: 'CML', 2: 'CMSE', 3: 'CMS', 4: 'CML', 5: 'CMS', 6: 'CMNE',
                     7: 'CMNE', 8: 'CMN', 9: 'CMO', 10: 'CMNE', 11: 'CMP', 12: 'CMA' };
  var ORDEM_CMA = ['CML', 'CMSE', 'CMS', 'CMO', 'CMP', 'CMNE', 'CMN', 'CMA', ''];
  var NOME_CMA = {
    CML: 'Comando Militar do Leste', CMSE: 'Comando Militar do Sudeste',
    CMS: 'Comando Militar do Sul', CMO: 'Comando Militar do Oeste',
    CMP: 'Comando Militar do Planalto', CMNE: 'Comando Militar do Nordeste',
    CMN: 'Comando Militar do Norte', CMA: 'Comando Militar da Amazônia', '': 'Sem enquadramento'
  };
  var DURACAO_FLASH = 6000;

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var ehTelao = /[?&]telao=1/.test(location.search);

  /* ─────────────────────────── Estado ─────────────────────────── */

  var estado = null;
  var seq = 0;

  function novoId(pre) { seq += 1; return pre + '-' + Date.now().toString(36) + '-' + seq; }

  function estadoInicial() {
    var base = (window.DADOS_ESCOLHA_OM || { alunos: [], vagasModelo: { INT: [], QMB: [] } });
    var alunos = (base.alunos || []).map(function (a, i) {
      return {
        id: 'al-' + i, cl: a.cl || i + 1, guerra: a.guerra || '', nome: a.nome || '',
        nasc: a.nasc || '', turma: a.turma || '', foto: a.foto || '', idt: a.idt || '',
        posto: a.posto || 'Cap', qm: a.qm || 'Sv Int', media: a.media, status: 'aguardando'
      };
    });
    return {
      cfg: {
        titulo: 'Escolha de Organização Militar',
        subtitulo: 'CAO/Log 2026 — Intendência',
        local: 'Escola de Aperfeiçoamento de Oficiais',
        data: '', origem: 'EsAO', origemCidade: 'Rio de Janeiro-RJ',
        tempo: 90, fotos: true, media: false, som: true, proximos: 3
      },
      alunos: alunos,
      vagas: vagasDoModelo('INT'),
      ordem: alunos.map(function (a) { return a.id; }),
      escolhas: [],
      inicioVez: null,
      flash: null
    };
  }

  function vagasDoModelo(qm) {
    var base = (window.DADOS_ESCOLHA_OM || {}).vagasModelo || {};
    return (base[qm] || []).map(function (v, i) {
      return {
        id: 'vg-' + qm + '-' + i, om: v.om, cidade: v.cidade || '',
        rm: v.rm || '', cma: v.cma || CMA_POR_RM[v.rm] || '', qtd: v.qtd || 1, reserva: ''
      };
    });
  }

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        var s = JSON.parse(bruto);
        if (s && s.alunos && s.vagas) return s;
      }
    } catch (e) { /* armazenamento indisponível: segue com a base original */ }
    return estadoInicial();
  }

  var canal = null;
  try { if ('BroadcastChannel' in window) canal = new BroadcastChannel(CANAL); } catch (e) { canal = null; }

  function salvar(propagar) {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* modo privativo */ }
    if (propagar !== false && canal) {
      try { canal.postMessage({ tipo: 'estado', estado: estado }); } catch (e) { /* ignora */ }
    }
  }

  /* Um só ponto de entrada para mudança de estado: grava, propaga e redesenha. */
  function mudou() { salvar(true); desenharTudo(); }

  if (canal) {
    canal.onmessage = function (ev) {
      if (!ev.data || ev.data.tipo !== 'estado') return;
      estado = ev.data.estado;
      desenharTudo();
    };
  }
  window.addEventListener('storage', function (ev) {
    if (ev.key !== CHAVE || !ev.newValue) return;
    try { estado = JSON.parse(ev.newValue); desenharTudo(); } catch (e) { /* ignora */ }
  });
  /* Rede de segurança para navegadores sem BroadcastChannel nem evento storage
     confiável (o telão só lê, então uma releitura periódica não atrapalha). */
  if (ehTelao) {
    setInterval(function () {
      try {
        var bruto = localStorage.getItem(CHAVE);
        if (!bruto) return;
        if (bruto === JSON.stringify(estado)) return;
        estado = JSON.parse(bruto);
        desenharTudo();
      } catch (e) { /* ignora */ }
    }, 700);
  }

  /* ───────────────────── Consultas derivadas ───────────────────── */

  function aluno(id) {
    for (var i = 0; i < estado.alunos.length; i++) if (estado.alunos[i].id === id) return estado.alunos[i];
    return null;
  }
  function vaga(id) {
    for (var i = 0; i < estado.vagas.length; i++) if (estado.vagas[i].id === id) return estado.vagas[i];
    return null;
  }
  function escolhaDe(alunoId) {
    for (var i = 0; i < estado.escolhas.length; i++) if (estado.escolhas[i].alunoId === alunoId) return estado.escolhas[i];
    return null;
  }
  function tomadas(vagaId) {
    var n = 0;
    for (var i = 0; i < estado.escolhas.length; i++) if (estado.escolhas[i].vagaId === vagaId) n++;
    return n;
  }
  function restam(v) { return Math.max(0, (Number(v.qtd) || 0) - tomadas(v.id)); }
  function totalVagas() {
    return estado.vagas.reduce(function (s, v) { return s + (Number(v.qtd) || 0); }, 0);
  }
  function totalRestante() {
    return estado.vagas.reduce(function (s, v) { return s + restam(v); }, 0);
  }

  /* Fila de chamada: ordem definida, menos quem já escolheu e menos os ausentes. */
  function fila() {
    return estado.ordem.map(aluno).filter(function (a) {
      return a && a.status !== 'ausente' && !escolhaDe(a.id);
    });
  }
  function daVez() { return fila()[0] || null; }

  function iniciais(a) {
    if (!a || !a.guerra) return '?';
    var p = a.guerra.trim().split(/\s+/);
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  function podeEscolher(v, alunoId) {
    if (restam(v) <= 0) return false;
    if (v.reserva && v.reserva !== alunoId) return false;
    return true;
  }

  /* ───────────────────── Ações da cerimônia ───────────────────── */

  function confirmarEscolha(vagaId) {
    var a = daVez(); var v = vaga(vagaId);
    if (!a || !v || !podeEscolher(v, a.id)) return;
    estado.escolhas.push({ alunoId: a.id, vagaId: v.id, ts: Date.now() });
    estado.flash = { alunoId: a.id, vagaId: v.id, ts: Date.now() };
    estado.inicioVez = Date.now();
    vagaSelecionada = null;
    if (estado.cfg.som) apitar();
    mudou();
  }

  function desfazer() {
    if (!estado.escolhas.length) return;
    estado.escolhas.pop();
    estado.flash = null;
    estado.inicioVez = Date.now();
    vagaSelecionada = null;
    mudou();
  }

  function adiar() {
    var a = daVez(); if (!a) return;
    var i = estado.ordem.indexOf(a.id);
    if (i < 0) return;
    estado.ordem.splice(i, 1);
    estado.ordem.push(a.id);
    estado.inicioVez = Date.now();
    mudou();
  }

  function alternarAusente(id) {
    var a = aluno(id); if (!a) return;
    a.status = a.status === 'ausente' ? 'aguardando' : 'ausente';
    estado.inicioVez = Date.now();
    mudou();
  }

  var ctxAudio = null;
  function apitar() {
    try {
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctxAudio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.16, ctxAudio.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime + 0.5);
      o.connect(g); g.connect(ctxAudio.destination);
      o.start(); o.stop(ctxAudio.currentTime + 0.5);
    } catch (e) { /* som é acessório */ }
  }

  /* ═════════════════════════ PREPARAÇÃO ═════════════════════════ */

  function desenharAlunos() {
    var tb = $('#tab-alunos tbody');
    if (!tb) return;
    tb.innerHTML = '';
    estado.ordem.forEach(function (id, pos) {
      var a = aluno(id); if (!a) return;
      var tr = document.createElement('tr');
      if (a.status === 'ausente') tr.style.opacity = '.45';

      var foto = a.foto
        ? '<img class="retrato" src="fotos/' + esc(a.foto) + '" alt="" ' +
          'onerror="__semFoto(this,\'—\',\'retrato-vazio\')" />'
        : '<div class="retrato-vazio">—</div>';

      tr.innerHTML =
        '<td class="num"><input data-campo="cl" type="number" value="' + a.cl + '" /></td>' +
        '<td>' + foto + '</td>' +
        '<td><input data-campo="guerra" value="' + esc(a.guerra) + '" /></td>' +
        '<td><input data-campo="nome" value="' + esc(a.nome) + '" /></td>' +
        '<td><input data-campo="posto" value="' + esc(a.posto) + '" /></td>' +
        '<td><input data-campo="qm" value="' + esc(a.qm) + '" /></td>' +
        '<td><input data-campo="idt" value="' + esc(a.idt) + '" /></td>' +
        '<td><input data-campo="turma" value="' + esc(a.turma) + '" /></td>' +
        '<td style="white-space:nowrap">' +
          '<button class="mini" data-acao="sobe" title="Subir">▲</button>' +
          '<button class="mini" data-acao="desce" title="Descer">▼</button>' +
          '<button class="mini" data-acao="ausente" title="Marcar ausente">' + (a.status === 'ausente' ? '⊘' : '○') + '</button>' +
          '<button class="mini x" data-acao="remove" title="Excluir">✕</button>' +
        '</td>';

      $$('input', tr).forEach(function (inp) {
        inp.addEventListener('change', function () {
          var campo = inp.dataset.campo;
          a[campo] = campo === 'cl' ? (parseInt(inp.value, 10) || 0) : inp.value;
          mudou();
        });
      });
      $$('button', tr).forEach(function (b) {
        b.addEventListener('click', function () {
          var ac = b.dataset.acao;
          if (ac === 'remove') {
            if (!confirm('Excluir ' + a.guerra + ' da relação?')) return;
            estado.alunos = estado.alunos.filter(function (x) { return x.id !== id; });
            estado.ordem = estado.ordem.filter(function (x) { return x !== id; });
            estado.escolhas = estado.escolhas.filter(function (e) { return e.alunoId !== id; });
          } else if (ac === 'ausente') {
            a.status = a.status === 'ausente' ? 'aguardando' : 'ausente';
          } else {
            var novo = ac === 'sobe' ? pos - 1 : pos + 1;
            if (novo < 0 || novo >= estado.ordem.length) return;
            estado.ordem.splice(pos, 1);
            estado.ordem.splice(novo, 0, id);
          }
          mudou();
        });
      });
      tb.appendChild(tr);
    });
    $('#cont-alunos').textContent = estado.alunos.length;
  }

  function desenharVagas() {
    var tb = $('#tab-vagas tbody');
    if (!tb) return;
    tb.innerHTML = '';
    var opcoes = '<option value="">—</option>' + estado.ordem.map(function (id) {
      var a = aluno(id);
      return a ? '<option value="' + a.id + '">' + esc(a.guerra) + '</option>' : '';
    }).join('');

    estado.vagas.forEach(function (v) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input data-campo="om" value="' + esc(v.om) + '" /></td>' +
        '<td><input data-campo="cidade" value="' + esc(v.cidade) + '" /></td>' +
        '<td class="num"><input data-campo="rm" value="' + esc(v.rm) + '" /></td>' +
        '<td><input data-campo="cma" value="' + esc(v.cma) + '" /></td>' +
        '<td class="num"><input data-campo="qtd" type="number" min="0" value="' + v.qtd + '" /></td>' +
        '<td><select data-campo="reserva">' + opcoes + '</select></td>' +
        '<td><button class="mini x" title="Excluir">✕</button></td>';

      $('select', tr).value = v.reserva || '';
      $$('input,select', tr).forEach(function (inp) {
        inp.addEventListener('change', function () {
          var campo = inp.dataset.campo;
          if (campo === 'qtd') v.qtd = Math.max(0, parseInt(inp.value, 10) || 0);
          else if (campo === 'rm') {
            v.rm = inp.value.replace(/\D/g, '');
            if (!v.cma) v.cma = CMA_POR_RM[Number(v.rm)] || '';
          } else v[campo] = inp.value;
          mudou();
        });
      });
      $('button', tr).addEventListener('click', function () {
        if (tomadas(v.id) && !confirm('Já há escolha registrada nesta OM. Excluir mesmo assim?')) return;
        estado.vagas = estado.vagas.filter(function (x) { return x.id !== v.id; });
        estado.escolhas = estado.escolhas.filter(function (e) { return e.vagaId !== v.id; });
        mudou();
      });
      tb.appendChild(tr);
    });

    var total = totalVagas();
    $('#cont-vagas').textContent = total;
    $('#cont-oms').textContent = estado.vagas.length;
    var ativos = estado.alunos.filter(function (a) { return a.status !== 'ausente'; }).length;
    var av = $('#aviso-vagas');
    if (total < ativos) {
      av.textContent = '⚠ faltam ' + (ativos - total) + ' vaga(s) para ' + ativos + ' concludentes';
      av.className = 'aviso erro';
    } else {
      av.textContent = total + ' vagas para ' + ativos + ' concludentes';
      av.className = 'aviso';
    }
  }

  function desenharConfig() {
    if (!$('#cfg-titulo')) return;
    var c = estado.cfg;
    /* Não reescreve o campo que está sob o cursor: a cada tecla o estado é
       salvo e a tela redesenhada, e reatribuir o valor jogaria o cursor pro fim. */
    function por(sel, valor) {
      var el = $(sel);
      if (el && el !== document.activeElement) el.value = valor;
    }
    por('#cfg-titulo', c.titulo);
    por('#cfg-subtitulo', c.subtitulo);
    por('#cfg-local', c.local);
    por('#cfg-data', c.data);
    por('#cfg-origem', c.origem);
    por('#cfg-origem-cidade', c.origemCidade);
    por('#cfg-tempo', c.tempo);
    por('#cfg-proximos', c.proximos);
    $('#cfg-fotos').checked = !!c.fotos;
    $('#cfg-media').checked = !!c.media;
    $('#cfg-som').checked = !!c.som;
  }

  function ligarConfig() {
    var mapa = {
      '#cfg-titulo': 'titulo', '#cfg-subtitulo': 'subtitulo', '#cfg-local': 'local',
      '#cfg-data': 'data', '#cfg-origem': 'origem', '#cfg-origem-cidade': 'origemCidade'
    };
    Object.keys(mapa).forEach(function (sel) {
      $(sel).addEventListener('input', function () { estado.cfg[mapa[sel]] = $(sel).value; mudou(); });
    });
    $('#cfg-tempo').addEventListener('input', function () {
      estado.cfg.tempo = Math.max(0, parseInt(this.value, 10) || 0); mudou();
    });
    $('#cfg-proximos').addEventListener('input', function () {
      estado.cfg.proximos = Math.min(6, Math.max(1, parseInt(this.value, 10) || 3)); mudou();
    });
    ['fotos', 'media', 'som'].forEach(function (k) {
      $('#cfg-' + k).addEventListener('change', function () { estado.cfg[k] = this.checked; mudou(); });
    });
  }

  /* ═════════════════════ PAINEL DO OPERADOR ═════════════════════ */

  var vagaSelecionada = null;
  var filtroCma = '';
  var busca = '';

  function desenharOperador() {
    if (!$('#op-cartao-aluno')) return;
    var a = daVez();
    var f = fila();

    var cartao = $('#op-cartao-aluno');
    if (!a) {
      cartao.innerHTML = '<div class="nota" style="font-size:15px">Chamada encerrada — todos os presentes já escolheram.</div>';
    } else {
      cartao.innerHTML =
        blocoFoto(a) +
        '<div><div class="cl">' + a.cl + 'º colocado</div>' +
        '<div class="guerra">' + esc(a.guerra) + '</div>' +
        '<div class="nome">' + esc(a.posto) + ' ' + esc(a.qm) + ' ' + esc(a.nome) + '</div></div>';
    }

    var totalAtivos = estado.alunos.filter(function (x) { return x.status !== 'ausente'; }).length;
    $('#op-progresso').textContent = estado.escolhas.length + ' de ' + totalAtivos;

    var ol = $('#op-fila');
    ol.innerHTML = f.slice(1, 1 + (estado.cfg.proximos || 3) + 2).map(function (x) {
      return '<li><strong>' + esc(x.guerra) + '</strong> <span style="color:var(--texto-3)">(' + x.cl + 'º)</span></li>';
    }).join('') || '<li style="list-style:none;color:var(--texto-3)">—</li>';

    desenharListaVagas(a);

    $('#op-confirmar').disabled = !(a && vagaSelecionada && podeEscolher(vaga(vagaSelecionada) || {}, a.id));
    $('#op-confirmar').textContent = vagaSelecionada && vaga(vagaSelecionada)
      ? 'Confirmar: ' + vaga(vagaSelecionada).om : 'Confirmar escolha';
    $('#op-desfazer').disabled = !estado.escolhas.length;
    $('#op-adiar').disabled = !a || f.length < 2;
    $('#op-ausente').disabled = !a;
    $('#op-resumo').textContent = totalRestante() + ' vagas disponíveis de ' + totalVagas() +
      ' · ' + f.length + ' na fila';
  }

  /* A foto pode faltar (o carômetro não cobre a turma toda). Quando falta —
     ou quando o arquivo não carrega — entram as iniciais do nome de guerra. */
  window.__semFoto = function (img, ini, classe) {
    var d = document.createElement('div');
    d.className = classe || 'sem-foto';
    d.textContent = ini;
    img.replaceWith(d);
  };

  function blocoFoto(a) {
    if (!a) return '';
    var ini = iniciais(a);
    if (estado.cfg.fotos && a.foto) {
      return '<img src="fotos/' + esc(a.foto) + '" alt="" ' +
        'onerror="__semFoto(this,\'' + esc(ini) + '\')" />';
    }
    return '<div class="sem-foto">' + esc(ini) + '</div>';
  }

  function desenharListaVagas(a) {
    var alvo = $('#op-lista-vagas');
    if (!alvo) return;

    var cmas = [];
    estado.vagas.forEach(function (v) { if (cmas.indexOf(v.cma) < 0) cmas.push(v.cma); });
    cmas.sort(function (x, y) { return ORDEM_CMA.indexOf(x) - ORDEM_CMA.indexOf(y); });

    $('#op-filtros').innerHTML =
      '<button data-cma="" class="' + (filtroCma ? '' : 'ativo') + '">Todos</button>' +
      cmas.map(function (c) {
        return '<button data-cma="' + c + '" class="' + (filtroCma === c ? 'ativo' : '') + '">' + (c || '—') + '</button>';
      }).join('');
    $$('#op-filtros button').forEach(function (b) {
      b.addEventListener('click', function () { filtroCma = b.dataset.cma; desenharOperador(); });
    });

    var termo = busca.trim().toLowerCase();
    var html = '';
    cmas.forEach(function (c) {
      if (filtroCma && filtroCma !== c) return;
      var lista = estado.vagas.filter(function (v) {
        if (v.cma !== c) return false;
        if (!termo) return true;
        return (v.om + ' ' + v.cidade).toLowerCase().indexOf(termo) >= 0;
      });
      if (!lista.length) return;
      var disp = lista.reduce(function (s, v) { return s + restam(v); }, 0);
      html += '<div class="grupo-cma"><h4 title="' + esc(NOME_CMA[c] || '') + '">' + (c || 'Sem enquadramento') +
        ' <span style="color:var(--texto-3);font-weight:400">· ' + disp + ' disponíveis</span></h4><div class="grade-vagas">' +
        lista.map(function (v) { return cartaoVaga(v, a); }).join('') + '</div></div>';
    });
    alvo.innerHTML = html || '<p class="nota">Nenhuma vaga corresponde ao filtro.</p>';

    $$('.vaga', alvo).forEach(function (el) {
      el.addEventListener('click', function () {
        var v = vaga(el.dataset.id);
        if (!v || !a || !podeEscolher(v, a.id)) return;
        vagaSelecionada = (vagaSelecionada === v.id) ? null : v.id;
        desenharOperador();
      });
      el.addEventListener('dblclick', function () {
        var v = vaga(el.dataset.id);
        if (v && a && podeEscolher(v, a.id)) confirmarEscolha(v.id);
      });
    });
  }

  function cartaoVaga(v, a) {
    var n = restam(v);
    var bloqueada = v.reserva && a && v.reserva !== a.id;
    var cls = 'vaga' + (n <= 0 || bloqueada ? ' esgotada' : '') +
      (v.reserva ? ' reservada' : '') + (vagaSelecionada === v.id ? ' selecionada' : '');
    var selo = '';
    if (v.reserva) {
      var r = aluno(v.reserva);
      selo = '<span class="selo">reserva ' + esc(r ? r.guerra : '?') + '</span>';
    }
    return '<div class="' + cls + '" data-id="' + v.id + '">' +
      '<div class="vaga-txt"><span class="vaga-om">' + esc(v.om) + '</span>' +
      '<span class="vaga-cidade">' + esc(v.cidade) + (v.rm ? ' · ' + esc(v.rm) + 'ª RM' : '') + '</span> ' + selo + '</div>' +
      '<span class="vaga-qtd">' + n + '</span></div>';
  }

  /* ═════════════════════════ TELÃO ═════════════════════════ */

  function desenharTelao() {
    if ($('#telao').classList.contains('oculto')) return;
    var a = daVez();
    var f = fila();

    $('#tl-titulo').textContent = estado.cfg.titulo;
    $('#tl-subtitulo').textContent = estado.cfg.subtitulo;

    var alvo = $('#tl-aluno');
    if (!a) {
      alvo.innerHTML = '<div class="vazio">Chamada encerrada</div>';
    } else {
      alvo.innerHTML =
        blocoFoto(a) +
        '<div class="cl">' + a.cl + 'º colocado</div>' +
        '<div class="guerra">' + esc(a.guerra) + '</div>' +
        '<div class="posto">' + esc(a.posto) + ' ' + esc(a.qm) +
        (estado.cfg.media && typeof a.media === 'number' ? ' · média ' + a.media.toFixed(3) : '') + '</div>';
    }

    $('#tl-fila').innerHTML = f.slice(1, 1 + (estado.cfg.proximos || 3)).map(function (x) {
      return '<li><strong>' + esc(x.guerra) + '</strong></li>';
    }).join('') || '<li style="list-style:none;color:var(--texto-3)">—</li>';

    $('#tl-contador').innerHTML = '<strong>' + totalRestante() + '</strong> de ' + totalVagas() + ' vagas';

    var cmas = [];
    estado.vagas.forEach(function (v) { if (cmas.indexOf(v.cma) < 0) cmas.push(v.cma); });
    cmas.sort(function (x, y) { return ORDEM_CMA.indexOf(x) - ORDEM_CMA.indexOf(y); });

    $('#tl-vagas').innerHTML = cmas.map(function (c) {
      var lista = estado.vagas.filter(function (v) { return v.cma === c; });
      var disp = lista.reduce(function (s, v) { return s + restam(v); }, 0);
      return '<div class="tl-cma"><h4 title="' + esc(NOME_CMA[c] || '') + '">' + (c || '—') +
        '<span>' + disp + '</span></h4><ul>' +
        lista.map(function (v) {
          var n = restam(v);
          return '<li class="' + (n ? '' : 'foi') + '"><span class="om">' + esc(v.om) + '</span>' +
            '<span class="n">' + (n > 1 ? n : (n === 1 ? '•' : '×')) + '</span></li>';
        }).join('') + '</ul></div>';
    }).join('');

    var ult = estado.escolhas.slice(-6).reverse().map(function (e) {
      var al = aluno(e.alunoId), vg = vaga(e.vagaId);
      if (!al || !vg) return '';
      return '<div><strong>' + esc(al.guerra) + '</strong> → <em>' + esc(vg.om) + '</em></div>';
    }).join('');
    $('#tl-ultimas').innerHTML = ult || '<div style="color:var(--texto-3)">A cerimônia ainda não começou.</div>';

    desenharFlash();
  }

  var tempoFlash = null;
  function desenharFlash() {
    var el = $('#tl-flash');
    var fl = estado.flash;
    if (!fl || Date.now() - fl.ts > DURACAO_FLASH) { el.classList.add('oculto'); return; }
    var al = aluno(fl.alunoId), vg = vaga(fl.vagaId);
    if (!al || !vg) { el.classList.add('oculto'); return; }

    $('#tl-flash-foto').innerHTML = blocoFoto(al);
    $('#tl-flash-cl').textContent = al.cl + 'º colocado';
    $('#tl-flash-nome').textContent = al.guerra;
    $('#tl-flash-om').textContent = vg.om;
    $('#tl-flash-cidade').textContent = vg.cidade + (vg.rm ? ' — ' + vg.rm + 'ª RM' : '');
    el.classList.remove('oculto');

    clearTimeout(tempoFlash);
    tempoFlash = setTimeout(function () { desenharFlash(); }, DURACAO_FLASH - (Date.now() - fl.ts) + 60);
  }

  function abrirTelao(mesmaJanela) {
    if (mesmaJanela) {
      $('#telao').classList.remove('oculto');
      desenharTelao();
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function () { /* o usuário pode negar */ });
      }
      return;
    }
    var w = window.open(location.pathname + '?telao=1', 'telaoEscolhaOM',
      'width=1280,height=760,menubar=no,toolbar=no');
    if (!w) alert('O navegador bloqueou a janela do telão. Libere as janelas pop-up para este endereço ou use "Apresentar aqui".');
  }

  function fecharTelao() {
    if (ehTelao) { window.close(); return; }
    $('#telao').classList.add('oculto');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
  }

  /* ══════════════════════ CRONÔMETRO ══════════════════════ */

  function tique() {
    var limite = estado.cfg.tempo || 0;
    var alvos = [$('#op-cronometro'), $('#tl-cronometro')].filter(Boolean);
    if (!limite || !daVez()) {
      alvos.forEach(function (el) { el.textContent = ''; el.className = el.id === 'tl-cronometro' ? 'tl-cronometro' : 'cronometro'; });
      return;
    }
    var inicio = estado.inicioVez || Date.now();
    var passado = Math.floor((Date.now() - inicio) / 1000);
    var restante = limite - passado;
    var txt = (restante < 0 ? '+' : '') + fmtTempo(Math.abs(restante));
    var estilo = restante < 0 ? ' estourado' : (restante <= 15 ? ' alerta' : '');
    alvos.forEach(function (el) {
      el.textContent = txt;
      el.className = (el.id === 'tl-cronometro' ? 'tl-cronometro' : 'cronometro') + estilo;
    });
  }
  function fmtTempo(s) {
    var m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }

  /* ══════════════════════ RESULTADO ══════════════════════ */

  var abaResultado = 'quadro';

  function linhasResultado() {
    return estado.escolhas.map(function (e) {
      return { a: aluno(e.alunoId), v: vaga(e.vagaId), ts: e.ts };
    }).filter(function (l) { return l.a && l.v; })
      .sort(function (x, y) { return x.a.cl - y.a.cl; });
  }

  function desenharResultado() {
    var alvo = $('#res-conteudo');
    if (!alvo) return;
    $('#res-cont').textContent = estado.escolhas.length;
    $$('[data-res]').forEach(function (b) {
      b.classList.toggle('btn-ouro', b.dataset.res === abaResultado);
    });

    var linhas = linhasResultado();
    var c = estado.cfg;
    var cabeca = '<h2>' + esc(c.titulo) + '</h2><h3>' + esc(c.subtitulo) +
      (c.local ? ' — ' + esc(c.local) : '') + '</h3>';

    if (!linhas.length) {
      alvo.innerHTML = cabeca + '<p class="vazio">Nenhuma escolha registrada até o momento.</p>';
      return;
    }

    if (abaResultado === 'quadro') {
      alvo.innerHTML = cabeca +
        '<table><thead><tr><th style="width:46px">Cl</th><th style="width:70px">Posto</th>' +
        '<th style="width:90px">Q/A/S</th><th>Nome de guerra</th><th>Nome completo</th>' +
        '<th>OM de destino</th><th style="width:180px">Cidade-UF</th></tr></thead><tbody>' +
        linhas.map(function (l) {
          return '<tr><td class="c">' + l.a.cl + 'º</td><td>' + esc(l.a.posto) + '</td><td>' + esc(l.a.qm) + '</td>' +
            '<td><strong>' + esc(l.a.guerra) + '</strong></td><td>' + esc(l.a.nome) + '</td>' +
            '<td>' + esc(l.v.om) + '</td><td>' + esc(l.v.cidade) + '</td></tr>';
        }).join('') + '</tbody></table>' + rodapeFolha();

    } else if (abaResultado === 'dcem') {
      alvo.innerHTML =
        '<h2>Alterações de Oficiais</h2><h3>Classificação por conclusão de curso — ' + esc(c.subtitulo) + '</h3>' +
        '<table><thead><tr><th style="width:80px">Posto<br>A/Q/S</th><th style="width:110px">Idt</th>' +
        '<th>Nome</th><th style="width:190px">OM de origem<br>Cidade-UF</th>' +
        '<th style="width:190px">OM de destino<br>Cidade-UF</th><th style="width:150px">Assinatura</th></tr></thead><tbody>' +
        linhas.map(function (l) {
          return '<tr><td>' + esc(l.a.posto) + '<br>' + esc(l.a.qm) + '</td><td>' + esc(l.a.idt) + '</td>' +
            '<td>' + esc(l.a.nome) + '</td>' +
            '<td>' + esc(c.origem) + '<br>' + esc(c.origemCidade) + '</td>' +
            '<td>' + esc(l.v.om) + '<br>' + esc(l.v.cidade) + '</td>' +
            '<td class="assinatura"></td></tr>';
        }).join('') + '</tbody></table>' + rodapeFolha();

    } else {
      var porOm = {};
      linhas.forEach(function (l) {
        var k = l.v.om + '|' + l.v.cidade;
        (porOm[k] = porOm[k] || []).push(l);
      });
      alvo.innerHTML = cabeca + Object.keys(porOm).sort().map(function (k) {
        var p = k.split('|');
        return '<div class="grupo-om"><h4>' + esc(p[0]) + ' — ' + esc(p[1]) + '</h4><ul>' +
          porOm[k].map(function (l) {
            return '<li>' + l.a.cl + 'º · ' + esc(l.a.posto) + ' ' + esc(l.a.qm) + ' ' + esc(l.a.nome) +
              ' (' + esc(l.a.guerra) + ')</li>';
          }).join('') + '</ul></div>';
      }).join('') + rodapeFolha();
    }
  }

  function rodapeFolha() {
    var d = estado.cfg.data;
    return '<div class="rodape-folha">' + (d ? esc(d) + '<br><br><br>' : '<br><br>') +
      '____________________________________<br>Coordenador da Cerimônia</div>';
  }

  function baixar(nome, conteudo, tipo) {
    var blob = new Blob(['﻿' + conteudo], { type: tipo + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  function exportarCsv() {
    var linhas = linhasResultado();
    var cab = ['Classificacao', 'Posto', 'Q/A/S', 'Idt', 'Nome de guerra', 'Nome completo', 'OM', 'Cidade-UF', 'RM', 'C Mil A'];
    var corpo = linhas.map(function (l) {
      return [l.a.cl, l.a.posto, l.a.qm, l.a.idt, l.a.guerra, l.a.nome, l.v.om, l.v.cidade, l.v.rm, l.v.cma];
    });
    var csv = [cab].concat(corpo).map(function (r) {
      return r.map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    baixar('escolha-om.csv', csv, 'text/csv');
  }

  function exportarXls() {
    var tabela = $('#res-conteudo').innerHTML;
    var html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" />' +
      '<style>table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px}</style></head><body>' +
      tabela + '</body></html>';
    baixar('escolha-om.xls', html, 'application/vnd.ms-excel');
  }

  /* ══════════════════════ IMPORTAÇÕES ══════════════════════ */

  function abrirModal(titulo, texto, valor, aoAplicar) {
    $('#modal-titulo').textContent = titulo;
    $('#modal-texto').innerHTML = texto;
    $('#modal-area').value = valor || '';
    $('#modal').classList.remove('oculto');
    $('#modal-area').focus();
    $('#modal-ok').onclick = function () {
      aoAplicar($('#modal-area').value);
      $('#modal').classList.add('oculto');
    };
  }

  function celulas(linha) { return linha.split(/\t|;/).map(function (x) { return x.trim(); }); }

  function colarAlunos(txt) {
    var linhas = txt.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!linhas.length) return;
    var novos = [];
    linhas.forEach(function (l, i) {
      var c = celulas(l);
      var cl = null, off = 0;
      if (/^\d+([.,]0+)?$/.test(c[0])) { cl = parseInt(c[0], 10); off = 1; }
      var guerra = (c[off] || '').trim();
      if (!guerra || /nome de guerra/i.test(guerra)) return;
      var antigo = null;
      for (var k = 0; k < estado.alunos.length; k++) {
        if (semAcento(estado.alunos[k].guerra) === semAcento(guerra)) { antigo = estado.alunos[k]; break; }
      }
      novos.push({
        id: antigo ? antigo.id : novoId('al'),
        cl: cl || novos.length + 1,
        guerra: guerra,
        nome: (c[off + 1] || (antigo ? antigo.nome : '')).trim(),
        idt: (c[off + 2] || (antigo ? antigo.idt : '')).trim(),
        nasc: antigo ? antigo.nasc : '',
        turma: antigo ? antigo.turma : '',
        foto: antigo ? antigo.foto : '',
        posto: antigo ? antigo.posto : 'Cap',
        qm: antigo ? antigo.qm : 'Sv Int',
        media: antigo ? antigo.media : null,
        status: 'aguardando'
      });
    });
    if (!novos.length) { alert('Não consegui ler nenhuma linha. Confira o formato.'); return; }
    estado.alunos = novos;
    estado.ordem = novos.map(function (a) { return a.id; });
    estado.escolhas = estado.escolhas.filter(function (e) { return aluno(e.alunoId); });
    mudou();
  }

  function colarVagas(txt) {
    var linhas = txt.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var novas = [];
    linhas.forEach(function (l) {
      var c = celulas(l);
      var om = (c[0] || '').trim();
      if (!om || /organiza|^om$/i.test(om)) return;
      var rm = (c[2] || '').replace(/\D/g, '');
      var qtd = parseInt(c[3], 10);
      novas.push({
        id: novoId('vg'), om: om, cidade: (c[1] || '').trim(), rm: rm,
        cma: (c[4] || CMA_POR_RM[Number(rm)] || '').trim(),
        qtd: isNaN(qtd) || qtd < 1 ? 1 : qtd, reserva: ''
      });
    });
    if (!novas.length) { alert('Não consegui ler nenhuma linha. Confira o formato.'); return; }
    /* Linhas repetidas da mesma OM viram quantidade, como no quadro original. */
    var juntas = [];
    novas.forEach(function (v) {
      for (var i = 0; i < juntas.length; i++) {
        if (juntas[i].om === v.om && juntas[i].cidade === v.cidade) { juntas[i].qtd += v.qtd; return; }
      }
      juntas.push(v);
    });
    estado.vagas = juntas;
    estado.escolhas = estado.escolhas.filter(function (e) { return vaga(e.vagaId); });
    mudou();
  }

  function semAcento(s) {
    /* NFD separa o acento da letra; o que sobra fora do ASCII é só acento. */
    return String(s || '').normalize('NFD').replace(/[^\x00-\x7F]/g, '').trim().toUpperCase();
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ══════════════════════ NAVEGAÇÃO / EVENTOS ══════════════════════ */

  var viewAtual = 'prep';

  function mostrarView(v) {
    viewAtual = v;
    ['prep', 'cerimonia', 'resultado'].forEach(function (x) {
      $('#view-' + x).classList.toggle('oculto', x !== v);
    });
    $$('#abas button').forEach(function (b) { b.classList.toggle('ativo', b.dataset.view === v); });
    desenharTudo();
  }

  function mostrarSub(s) {
    ['alunos', 'vagas', 'config'].forEach(function (x) {
      $('#sub-' + x).classList.toggle('oculto', x !== s);
    });
    $$('.sub-abas button').forEach(function (b) { b.classList.toggle('ativo', b.dataset.sub === s); });
  }

  function desenharTudo() {
    if (ehTelao) { desenharTelao(); tique(); return; }
    if (viewAtual === 'prep') { desenharAlunos(); desenharVagas(); desenharConfig(); }
    if (viewAtual === 'cerimonia') desenharOperador();
    if (viewAtual === 'resultado') desenharResultado();
    desenharTelao();
    tique();
    var sub = $('#topo-sub');
    if (sub) sub.textContent = estado.cfg.subtitulo;
  }

  function ligarEventos() {
    $$('#abas button').forEach(function (b) {
      b.addEventListener('click', function () { mostrarView(b.dataset.view); });
    });
    $$('.sub-abas button').forEach(function (b) {
      b.addEventListener('click', function () { mostrarSub(b.dataset.sub); });
    });

    $('#btn-telao').addEventListener('click', function () { abrirTelao(false); });
    $('#btn-apresentar').addEventListener('click', function () { abrirTelao(true); });
    $('#tl-sair').addEventListener('click', fecharTelao);

    /* — preparação: concludentes — */
    $('#al-add').addEventListener('click', function () {
      var a = { id: novoId('al'), cl: estado.alunos.length + 1, guerra: 'NOVO', nome: '', nasc: '',
                turma: '', foto: '', idt: '', posto: 'Cap', qm: 'Sv Int', media: null, status: 'aguardando' };
      estado.alunos.push(a); estado.ordem.push(a.id); mudou();
    });
    $('#al-renumerar').addEventListener('click', function () {
      estado.ordem.forEach(function (id, i) { var a = aluno(id); if (a) a.cl = i + 1; });
      mudou();
    });
    $('#al-restaurar').addEventListener('click', function () {
      if (!confirm('Recarregar a relação original de concludentes? As escolhas já registradas serão perdidas.')) return;
      var novo = estadoInicial();
      estado.alunos = novo.alunos; estado.ordem = novo.ordem; estado.escolhas = [];
      estado.flash = null; mudou();
    });
    $('#al-colar').addEventListener('click', function () {
      abrirModal('Colar a relação de concludentes',
        'Uma linha por concludente, colunas separadas por <strong>tabulação</strong> (é o que sai ao copiar do Excel):<br>' +
        '<code>Classificação &nbsp;→&nbsp; Nome de guerra &nbsp;→&nbsp; Nome completo &nbsp;→&nbsp; Idt</code><br>' +
        'A coluna de classificação pode ser omitida — nesse caso vale a ordem das linhas. ' +
        'Quem já estiver cadastrado mantém a foto e os demais dados.', '', colarAlunos);
    });

    /* — preparação: vagas — */
    $('#vg-add').addEventListener('click', function () {
      estado.vagas.push({ id: novoId('vg'), om: 'NOVA OM', cidade: '', rm: '', cma: '', qtd: 1, reserva: '' });
      mudou();
    });
    $('#vg-colar').addEventListener('click', function () {
      abrirModal('Colar o quadro de vagas',
        'Uma linha por vaga (ou por OM), colunas separadas por <strong>tabulação</strong>:<br>' +
        '<code>OM &nbsp;→&nbsp; Cidade-UF &nbsp;→&nbsp; RM &nbsp;→&nbsp; Qtd &nbsp;→&nbsp; C Mil A</code><br>' +
        'RM, Qtd e C Mil A são opcionais: sem Qtd conta 1, e o C Mil A sai da RM. ' +
        'Repetir a mesma OM em várias linhas soma as vagas.', '', colarVagas);
    });
    $('#vg-modelo-int').addEventListener('click', function () { trocarModelo('INT'); });
    $('#vg-modelo-qmb').addEventListener('click', function () { trocarModelo('QMB'); });
    $('#vg-limpar').addEventListener('click', function () {
      if (!confirm('Limpar todo o quadro de vagas?')) return;
      estado.vagas = []; estado.escolhas = []; mudou();
    });

    /* — configuração — */
    ligarConfig();
    $('#cfg-exportar').addEventListener('click', function () {
      baixar('escolha-om-sessao.json', JSON.stringify(estado, null, 1), 'application/json');
      $('#cfg-status').textContent = 'Backup gerado em ' + new Date().toLocaleString('pt-BR') + '.';
    });
    $('#cfg-importar').addEventListener('click', function () { $('#arquivo-oculto').click(); });
    $('#arquivo-oculto').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        try {
          var s = JSON.parse(leitor.result);
          if (!s.alunos || !s.vagas) throw new Error('arquivo fora do formato');
          estado = s; mudou();
          $('#cfg-status').textContent = 'Sessão importada de ' + f.name + '.';
        } catch (e) { alert('Não consegui ler o arquivo: ' + e.message); }
      };
      leitor.readAsText(f);
      this.value = '';
    });
    $('#cfg-zerar').addEventListener('click', function () {
      if (!confirm('Apagar todas as escolhas já registradas? Os concludentes e as vagas permanecem.')) return;
      estado.escolhas = []; estado.flash = null; estado.inicioVez = Date.now();
      estado.alunos.forEach(function (a) { a.status = 'aguardando'; });
      mudou();
    });

    /* — operador — */
    $('#op-confirmar').addEventListener('click', function () {
      if (vagaSelecionada) confirmarEscolha(vagaSelecionada);
    });
    $('#op-desfazer').addEventListener('click', desfazer);
    $('#op-adiar').addEventListener('click', adiar);
    $('#op-ausente').addEventListener('click', function () {
      var a = daVez();
      if (a && confirm('Marcar ' + a.guerra + ' como ausente? Ele sai da chamada e pode voltar pela tela de Preparação.')) {
        alternarAusente(a.id);
      }
    });
    $('#op-busca').addEventListener('input', function () { busca = this.value; desenharOperador(); });
    $('#op-busca').addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var primeira = $('#op-lista-vagas .vaga:not(.esgotada)');
      if (primeira) { vagaSelecionada = primeira.dataset.id; desenharOperador(); }
    });

    /* — resultado — */
    $$('[data-res]').forEach(function (b) {
      b.addEventListener('click', function () { abaResultado = b.dataset.res; desenharResultado(); });
    });
    $('#res-imprimir').addEventListener('click', function () { window.print(); });
    $('#res-csv').addEventListener('click', exportarCsv);
    $('#res-xls').addEventListener('click', exportarXls);

    /* — modal — */
    $('#modal-cancelar').addEventListener('click', function () { $('#modal').classList.add('oculto'); });

    /* — teclado — */
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (!$('#modal').classList.contains('oculto')) { $('#modal').classList.add('oculto'); return; }
        if (!$('#telao').classList.contains('oculto')) { fecharTelao(); return; }
      }
      if (ehTelao) return;
      var digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !digitando) { ev.preventDefault(); desfazer(); return; }
      if (viewAtual !== 'cerimonia') return;
      if (ev.key === 'Enter' && !digitando && vagaSelecionada) { ev.preventDefault(); confirmarEscolha(vagaSelecionada); return; }
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !digitando) {
        ev.preventDefault();
        var itens = $$('#op-lista-vagas .vaga:not(.esgotada)');
        if (!itens.length) return;
        var i = itens.findIndex(function (el) { return el.dataset.id === vagaSelecionada; });
        i = ev.key === 'ArrowDown' ? Math.min(itens.length - 1, i + 1) : Math.max(0, i - 1);
        vagaSelecionada = itens[i].dataset.id;
        desenharOperador();
        var sel = $('#op-lista-vagas .vaga.selecionada');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function trocarModelo(qm) {
    if (estado.escolhas.length && !confirm('Trocar o quadro de vagas apaga as escolhas já registradas. Continuar?')) return;
    estado.vagas = vagasDoModelo(qm);
    estado.escolhas = [];
    mudou();
  }

  /* ══════════════════════ PARTIDA ══════════════════════ */

  estado = carregar();
  if (!estado.inicioVez) estado.inicioVez = Date.now();

  var arrancou = false;
  function arrancar() {
    if (arrancou) return;
    arrancou = true;
    if (ehTelao) {
      /* Janela dedicada ao projetor: só o telão aparece e nada aqui grava estado. */
      document.body.classList.add('modo-telao');
      document.title = 'Telão — Escolha de OM';
      $('#telao').classList.remove('oculto');
      $('#tl-sair').addEventListener('click', function () { window.close(); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') window.close(); });
    } else {
      ligarEventos();
      mostrarSub('alunos');
    }
    desenharTudo();
    setInterval(tique, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();

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
        /* Textos da relação do DCEM, no teor da planilha da escolha. */
        dcemTitulo: 'ALTERAÇÕES DE OFICIAIS',
        dcemSecao1: ' - CLASSIFICAÇÃO POR CONCLUSÃO DE CURSO NO PAÍS',
        dcemSecao2: 'f. Aperfeiçoamento de Oficiais de Intendência',
        qmDcem: 'Int',
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
        if (s && s.alunos && s.vagas) return completar(s);
      }
    } catch (e) { /* armazenamento indisponível: segue com a base original */ }
    return estadoInicial();
  }

  /* Sessão gravada por uma versão anterior não tem os campos novos de
     configuração; completa com os padrões sem mexer no que já foi ajustado. */
  function completar(s) {
    var padrao = estadoInicial().cfg;
    s.cfg = s.cfg || {};
    Object.keys(padrao).forEach(function (k) {
      if (s.cfg[k] === undefined) s.cfg[k] = padrao[k];
    });
    return s;
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

  /* Quando o chamado não tem o que escolher — quadro curto, ou o que sobrou é
     reserva de outro — a tela precisa dizer isso com todas as letras: no meio
     da cerimônia, uma lista toda apagada e um botão desligado não explicam
     nada a quem está conduzindo. Devolve o aviso, ou vazio se há vaga. */
  function semVagaPara(a) {
    if (!a) return '';
    var livres = estado.vagas.filter(function (v) { return podeEscolher(v, a.id); });
    if (livres.length) return '';
    if (totalRestante() > 0) {
      return 'Não há vaga livre para este oficial: o que resta está reservado nominalmente a outros.';
    }
    var faltam = fila().length;
    return 'Acabaram as vagas do quadro' +
      (faltam ? ' — ainda ' + (faltam > 1 ? 'faltam ' + faltam + ' oficiais' : 'falta 1 oficial') +
        ' por escolher.' : '.');
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

  /* Exclusão de concludentes: tira da relação, da ordem de chamada e desfaz
     a escolha de quem já tinha escolhido, devolvendo a vaga ao quadro. */
  function excluirAlunos(ids) {
    estado.alunos = estado.alunos.filter(function (a) { return ids.indexOf(a.id) < 0; });
    estado.ordem = estado.ordem.filter(function (x) { return ids.indexOf(x) < 0; });
    estado.escolhas = estado.escolhas.filter(function (e) { return ids.indexOf(e.alunoId) < 0; });
    ids.forEach(function (id) { delete marcados[id]; });
    mudou();
  }

  var marcados = {};

  function idsMarcados() {
    return Object.keys(marcados).filter(function (id) { return marcados[id] && aluno(id); });
  }

  function desenharAlunos() {
    var tb = $('#tab-alunos tbody');
    if (!tb) return;
    tb.innerHTML = '';
    estado.ordem.forEach(function (id, pos) {
      var a = aluno(id); if (!a) return;
      var tr = document.createElement('tr');
      if (a.status === 'ausente') tr.style.opacity = '.45';

      var foto = a.foto
        ? '<img class="retrato" src="' + esc(urlFoto(a.foto)) + '" alt="" ' +
          'onerror="__semFoto(this,\'—\',\'retrato-vazio\')" />'
        : '<div class="retrato-vazio">—</div>';

      tr.innerHTML =
        '<td><input type="checkbox" class="marca" ' + (marcados[id] ? 'checked' : '') + ' /></td>' +
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

      $$('input[data-campo]', tr).forEach(function (inp) {
        inp.addEventListener('change', function () {
          var campo = inp.dataset.campo;
          a[campo] = campo === 'cl' ? (parseInt(inp.value, 10) || 0) : inp.value;
          mudou();
        });
      });
      $('.marca', tr).addEventListener('change', function () {
        marcados[id] = this.checked;
        atualizarSelecao();
      });
      $$('button', tr).forEach(function (b) {
        b.addEventListener('click', function () {
          var ac = b.dataset.acao;
          if (ac === 'remove') {
            confirmar('Excluir ' + a.guerra + '?',
              'Sai da relação de concludentes. Se já tiver escolhido, a vaga volta para o quadro.',
              'Excluir', true).then(function (sim) {
                if (!sim) return;
                excluirAlunos([id]);
              });
            return;
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
    atualizarSelecao();
  }

  function atualizarSelecao() {
    var n = idsMarcados().length;
    var botao = $('#al-excluir-sel');
    if (!botao) return;
    botao.disabled = !n;
    botao.textContent = n ? 'Excluir ' + n + (n > 1 ? ' selecionados' : ' selecionado') : 'Excluir selecionados';
    var todos = $('#al-marca-todos');
    if (todos) todos.checked = n > 0 && n === estado.alunos.length;
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
        var apagar = function () {
          estado.vagas = estado.vagas.filter(function (x) { return x.id !== v.id; });
          estado.escolhas = estado.escolhas.filter(function (e) { return e.vagaId !== v.id; });
          mudou();
        };
        if (!tomadas(v.id)) return apagar();
        confirmar('Excluir ' + v.om + '?',
          'Já há escolha registrada nesta OM; ela será desfeita.', 'Excluir', true)
          .then(function (sim) { if (sim) apagar(); });
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
    por('#cfg-dcem-titulo', c.dcemTitulo);
    por('#cfg-dcem-secao1', c.dcemSecao1);
    por('#cfg-dcem-secao2', c.dcemSecao2);
    por('#cfg-qm-dcem', c.qmDcem);
    por('#cfg-tempo', c.tempo);
    por('#cfg-proximos', c.proximos);
    $('#cfg-fotos').checked = !!c.fotos;
    $('#cfg-media').checked = !!c.media;
    $('#cfg-som').checked = !!c.som;
  }

  function ligarConfig() {
    var mapa = {
      '#cfg-titulo': 'titulo', '#cfg-subtitulo': 'subtitulo', '#cfg-local': 'local',
      '#cfg-data': 'data', '#cfg-origem': 'origem', '#cfg-origem-cidade': 'origemCidade',
      '#cfg-dcem-titulo': 'dcemTitulo', '#cfg-dcem-secao1': 'dcemSecao1',
      '#cfg-dcem-secao2': 'dcemSecao2', '#cfg-qm-dcem': 'qmDcem'
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

    var aviso = semVagaPara(a);
    $('#op-alerta').textContent = aviso;
    $('#op-alerta').classList.toggle('oculto', !aviso);

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
  /* O campo `foto` guarda o nome do arquivo em fotos/, mas aceita também uma
     imagem embutida (data:), que é como a versão de arquivo único carrega os
     retratos sem depender da pasta ao lado. */
  function urlFoto(nome) {
    var embutidas = window.FOTOS_EMBUTIDAS;
    if (embutidas && embutidas[nome]) return embutidas[nome];
    return /^data:/.test(nome) ? nome : 'fotos/' + nome;
  }

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
      return '<img src="' + esc(urlFoto(a.foto)) + '" alt="" ' +
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

    var aviso = semVagaPara(a);
    $('#tl-alerta').textContent = aviso;
    $('#tl-alerta').classList.toggle('oculto', !aviso);

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
    if (!w) {
      informar('Janela do telão bloqueada',
        'O navegador não deixou abrir a segunda janela. Libere as janelas pop-up para este ' +
        'endereço, ou use <strong>Apresentar aqui</strong>, que põe o telão em tela cheia nesta mesma janela.');
    }
  }

  function fecharTelao() {
    if (ehTelao) { window.close(); return; }
    $('#telao').classList.add('oculto');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
  }

  /* ══════════════════════ CRONÔMETRO ══════════════════════ */

  function tique() {
    var limite = estado.cfg.tempo || 0;
    var a = daVez();
    /* Marcar o tempo de quem não tem o que escolher só atrapalha: nesse caso o
       aviso ocupa o lugar do cronômetro, em vez de somar mais uma linha. */
    var travado = !!semVagaPara(a);
    var alvos = [$('#op-cronometro'), $('#tl-cronometro')].filter(Boolean);
    var base = function (el) { return el.id === 'tl-cronometro' ? 'tl-cronometro' : 'cronometro'; };

    if (!limite || !a || travado) {
      alvos.forEach(function (el) {
        el.textContent = '';
        el.className = base(el) + (travado ? ' oculto' : '');
      });
      return;
    }
    var inicio = estado.inicioVez || Date.now();
    var passado = Math.floor((Date.now() - inicio) / 1000);
    var restante = limite - passado;
    var txt = (restante < 0 ? '+' : '') + fmtTempo(Math.abs(restante));
    var estilo = restante < 0 ? ' estourado' : (restante <= 15 ? ' alerta' : '');
    alvos.forEach(function (el) {
      el.textContent = txt;
      el.className = base(el) + estilo;
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
      alvo.innerHTML = htmlDcem(linhas);

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

  /* ─────────────────── Relação para o DCEM ───────────────────
     Reproduz a aba "Rel DCEM" da planilha da escolha: título com filete,
     cabeçalho em duas linhas, as duas linhas de enquadramento sem moldura e,
     para cada oficial, um quadro de duas linhas — posto sobre A/Q/S, Idt, nome
     e assinatura ocupando as duas, OM sobre cidade nas colunas de origem e de
     destino — separados por um vão, com o número de ordem fora da moldura.
     As larguras de coluna são as da planilha (13 / 19,1 / 51,6 / 18,4 / 28,4 / 13). */

  var LARG_DCEM = [13, 19.1, 51.6, 18.4, 28.4, 13];

  function htmlDcem(linhas, paraExcel) {
    var c = estado.cfg;
    var total = LARG_DCEM.reduce(function (s, x) { return s + x; }, 0);
    var cols = LARG_DCEM.map(function (w) {
      return paraExcel
        ? '<col style="width:' + Math.round(w * 7 + 5) + 'px" />'
        : '<col style="width:' + (w / total * 100).toFixed(2) + '%" />';
    }).join('') + '<col style="width:' + (paraExcel ? '42px' : '34px') + '" />';

    var txt = paraExcel ? ' style="mso-number-format:\'\\@\'"' : '';
    var linha = function (l, i) {
      return '<tr class="dcem-a">' +
          '<td>' + esc(l.a.posto) + '</td>' +
          '<td rowspan="2"' + txt + '>' + esc(l.a.idt) + '</td>' +
          '<td rowspan="2">' + esc(l.a.nome) + '</td>' +
          '<td class="forte">' + esc(c.origem) + '</td>' +
          '<td class="forte">' + esc(l.v.om) + '</td>' +
          '<td rowspan="2"></td>' +
          '<td class="fora">' + (i + 1) + '</td>' +
        '</tr>' +
        '<tr class="dcem-b">' +
          '<td>' + esc(c.qmDcem || l.a.qm) + '</td>' +
          '<td>' + esc(c.origemCidade) + '</td>' +
          '<td>' + esc(l.v.cidade) + '</td>' +
          '<td class="fora"></td>' +
        '</tr>' +
        '<tr class="dcem-vao"><td colspan="7"></td></tr>';
    };
    /* Cada oficial num <tbody> próprio: assim a quebra de página nunca corta o
       quadro dele em duas folhas. O cabeçalho fica num tbody à parte, e não em
       <thead>, porque na planilha ele também não se repete a cada página. */
    var bloco = function (l, i) { return '<tbody class="dcem-bloco">' + linha(l, i) + '</tbody>'; };

    var secao = function (t) {
      return t ? '<tr class="dcem-secao"><td colspan="6">' + esc(t) + '</td><td class="fora"></td></tr>' : '';
    };

    return '<table class="dcem"><colgroup>' + cols + '</colgroup><tbody class="dcem-topo">' +
      '<tr class="dcem-titulo"><td colspan="6">' + esc(c.dcemTitulo) + '</td><td class="fora"></td></tr>' +
      '<tr class="dcem-cab">' +
        '<td>POSTO</td><td rowspan="2">IDT</td><td rowspan="2">NOME</td>' +
        '<td>OM ORIGEM</td><td>OM DESTINO</td>' +
        /* hífen opcional: só aparece se a palavra precisar quebrar */
        '<td rowspan="2" class="cab-assin">ASSINA&shy;TURA</td>' +
        '<td class="fora"></td></tr>' +
      '<tr class="dcem-cab"><td>A / Q / S</td><td>CIDADE-UF</td><td>CIDADE-UF</td><td class="fora"></td></tr>' +
      secao(c.dcemSecao1) + secao(c.dcemSecao2) +
      '<tr class="dcem-vao"><td colspan="7"></td></tr>' +
      '</tbody>' + linhas.map(bloco).join('') +
      '</table>';
  }

  function rodapeFolha() {
    var d = estado.cfg.data;
    return '<div class="rodape-folha">' + (d ? esc(d) + '<br><br><br>' : '<br><br>') +
      '____________________________________<br>Coordenador da Cerimônia</div>';
  }

  /* O BOM faz o Excel abrir o CSV em UTF-8; só vale para texto, por isso o
     .xlsx desce pelo baixarBlob, sem prefixo nenhum. */
  function baixar(nome, conteudo, tipo) {
    baixarBlob(nome, new Blob(['﻿' + conteudo], { type: tipo + ';charset=utf-8' }));
  }

  /* Servido como página publicada, o visualizador não deixa a própria página
     baixar arquivo: ali a entrega passa pela capacidade `downloads`, que pede
     confirmação ao usuário. Fora dela — no sistema ou na pasta — vale o
     caminho normal do navegador. */
  function baixarBlob(nome, blob) {
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then(function (downloads) {
        if (!downloads) return ancora(nome, blob);
        return downloads.save({ filename: nome, data: blob }).catch(function (e) {
          if (e && e.code === 'declined') return;
          avisar('Não foi possível entregar o arquivo (' + ((e && e.code) || 'erro') +
            '). Rode a aplicação pelo sistema para baixar.');
        });
      }).catch(function () { ancora(nome, blob); });
      return;
    }
    ancora(nome, blob);
  }

  function ancora(nome, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  function avisar(texto) {
    var el = $('#cfg-status');
    if (el) el.textContent = texto;
    else informar('Aviso', esc(texto));
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

  /* Todos os quadros saem como .xlsx de verdade: a relação do DCEM na forma da
     aba de origem, os demais como tabela simples. Um HTML com extensão .xls
     abriria com ressalva e nem é formato aceito fora do navegador. */
  function exportarXls() {
    var c = estado.cfg;
    var linhas = linhasResultado();

    if (abaResultado === 'dcem') {
      baixarBlob('rel-dcem.xlsx', window.gerarXlsxDcem({
        titulo: c.dcemTitulo,
        secao1: c.dcemSecao1,
        secao2: c.dcemSecao2,
        oficiais: linhas.map(function (l) {
          return {
            posto: l.a.posto, qm: c.qmDcem || l.a.qm, idt: l.a.idt, nome: l.a.nome,
            origem: c.origem, origemCidade: c.origemCidade, om: l.v.om, cidade: l.v.cidade
          };
        })
      }));
      return;
    }

    if (abaResultado === 'om') {
      baixarBlob('escolha-om-por-om.xlsx', window.gerarXlsxTabela({
        aba: 'Por OM', titulo: c.titulo + ' — ' + c.subtitulo,
        larguras: [30, 22, 8, 12, 10, 26, 40],
        cabecalho: ['OM', 'Cidade-UF', 'RM', 'C Mil A', 'Cl', 'Nome de guerra', 'Nome completo'],
        linhas: linhas.slice().sort(function (a, b) {
          return (a.v.om + a.v.cidade).localeCompare(b.v.om + b.v.cidade) || a.a.cl - b.a.cl;
        }).map(function (l) {
          return [l.v.om, l.v.cidade, l.v.rm, l.v.cma, l.a.cl + 'º', l.a.guerra, l.a.nome];
        })
      }));
      return;
    }

    baixarBlob('escolha-om-quadro-final.xlsx', window.gerarXlsxTabela({
      aba: 'Quadro final', titulo: c.titulo + ' — ' + c.subtitulo,
      larguras: [8, 10, 12, 14, 26, 40, 30, 22],
      cabecalho: ['Cl', 'Posto', 'Q/A/S', 'Idt', 'Nome de guerra', 'Nome completo', 'OM de destino', 'Cidade-UF'],
      linhas: linhas.map(function (l) {
        return [l.a.cl + 'º', l.a.posto, l.a.qm, l.a.idt, l.a.guerra, l.a.nome, l.v.om, l.v.cidade];
      })
    }));
  }

  /* ══════════════════════ PDF ══════════════════════
     A impressão do navegador nem sempre está liberada — dentro de uma página
     publicada ela costuma ser bloqueada. O PDF é desenhado aqui, com a mesma
     geometria da folha impressa: A4 retrato, margens de 1,3 cm, Times a 64%
     de 11 pt, e o número de ordem fora da moldura, como na planilha. */

  var MM = { pagina: [210, 297], margem: 13 };

  function pdfDisponivel() { return !!(window.jspdf && window.jspdf.jsPDF); }

  function gerarPdf() {
    if (!pdfDisponivel()) {
      return informar('Gerador de PDF indisponível',
        'A biblioteca que desenha o PDF não carregou — normalmente é falta de rede. ' +
        'Use <strong>Imprimir</strong> e escolha “Salvar como PDF”.');
    }
    var linhas = linhasResultado();
    if (!linhas.length) return informar('Nada a gerar', 'Nenhuma escolha foi registrada ainda.');
    var doc = (abaResultado === 'dcem') ? pdfDcem(linhas) : pdfQuadro(linhas);
    var nome = abaResultado === 'dcem' ? 'rel-dcem.pdf'
             : abaResultado === 'om' ? 'escolha-om-por-om.pdf' : 'escolha-om-quadro-final.pdf';
    baixarBlob(nome, doc.output('blob'));
  }

  /* Encolhe o texto até caber na largura da célula, como o Excel faria. */
  function textoNaCaixa(doc, txt, x, larg, y, tamanho) {
    if (!txt) return;
    var t = tamanho;
    doc.setFontSize(t);
    while (t > 3.5 && doc.getTextWidth(String(txt)) > larg - 1.4) {
      t -= 0.25;
      doc.setFontSize(t);
    }
    doc.text(String(txt), x + larg / 2, y, { align: 'center', baseline: 'middle' });
    doc.setFontSize(tamanho);
  }

  function pdfDcem(linhas) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    var c = estado.cfg;
    var larguraUtil = MM.pagina[0] - MM.margem * 2;
    var soma = LARG_DCEM.reduce(function (s, w) { return s + w; }, 0);
    var larg = LARG_DCEM.map(function (w) { return w / soma * larguraUtil; });
    var xs = [], acc = MM.margem;
    larg.forEach(function (w) { xs.push(acc); acc += w; });

    var pt = 25.4 / 72;                 /* pontos para milímetros */
    var corpo = 11 * 0.64;              /* 11 pt reduzidos a 64%, como no original */
    var hLinha = 22.5 * 0.64 * pt;
    var hVao = 3.75 * 0.64 * pt;
    var fundo = MM.pagina[1] - MM.margem;
    var y = MM.margem;

    doc.setFont('times', 'normal');
    doc.setLineWidth(0.15);

    /* título com o filete embaixo */
    doc.setFont('times', 'bold'); doc.setFontSize(corpo);
    doc.text(c.dcemTitulo, MM.margem, y + 31.5 * 0.64 * pt / 2, { baseline: 'middle' });
    y += 31.5 * 0.64 * pt;
    doc.line(MM.margem, y, MM.margem + larguraUtil, y);

    /* cabeçalho de duas linhas */
    var cabeca = function () {
      var topo = y;
      [0, 3, 4].forEach(function (i) {
        doc.rect(xs[i], topo, larg[i], hLinha);
        doc.rect(xs[i], topo + hLinha, larg[i], hLinha);
      });
      [1, 2, 5].forEach(function (i) { doc.rect(xs[i], topo, larg[i], hLinha * 2); });
      doc.setFont('times', 'bold');
      var meio1 = topo + hLinha / 2, meio2 = topo + hLinha * 1.5, meioT = topo + hLinha;
      textoNaCaixa(doc, 'POSTO', xs[0], larg[0], meio1, corpo);
      textoNaCaixa(doc, 'A / Q / S', xs[0], larg[0], meio2, corpo);
      textoNaCaixa(doc, 'IDT', xs[1], larg[1], meioT, corpo);
      textoNaCaixa(doc, 'NOME', xs[2], larg[2], meioT, corpo);
      textoNaCaixa(doc, 'OM ORIGEM', xs[3], larg[3], meio1, corpo);
      textoNaCaixa(doc, 'CIDADE-UF', xs[3], larg[3], meio2, corpo);
      textoNaCaixa(doc, 'OM DESTINO', xs[4], larg[4], meio1, corpo);
      textoNaCaixa(doc, 'CIDADE-UF', xs[4], larg[4], meio2, corpo);
      textoNaCaixa(doc, 'ASSINATURA', xs[5], larg[5], meioT, corpo);
      y = topo + hLinha * 2;
    };
    cabeca();

    /* enquadramento, fora da moldura */
    doc.setFont('times', 'bold');
    [c.dcemSecao1, c.dcemSecao2].forEach(function (t) {
      if (!t) return;
      doc.setFontSize(corpo);
      doc.text(t, MM.margem, y + hLinha / 2, { baseline: 'middle' });
      y += hLinha;
    });
    y += hVao;

    linhas.forEach(function (l, i) {
      if (y + hLinha * 2 > fundo) { doc.addPage(); y = MM.margem; cabeca(); y += hVao; }
      var topo = y;
      larg.forEach(function (w, k) { doc.rect(xs[k], topo, w, hLinha * 2); });
      var meio1 = topo + hLinha / 2, meio2 = topo + hLinha * 1.5, meioT = topo + hLinha;

      doc.setFont('times', 'normal');
      textoNaCaixa(doc, l.a.posto, xs[0], larg[0], meio1, corpo);
      textoNaCaixa(doc, c.qmDcem || l.a.qm, xs[0], larg[0], meio2, corpo);
      textoNaCaixa(doc, l.a.idt, xs[1], larg[1], meioT, corpo);
      textoNaCaixa(doc, l.a.nome, xs[2], larg[2], meioT, corpo);
      textoNaCaixa(doc, c.origemCidade, xs[3], larg[3], meio2, corpo);
      textoNaCaixa(doc, l.v.cidade, xs[4], larg[4], meio2, corpo);
      doc.setFont('times', 'bold');
      textoNaCaixa(doc, c.origem, xs[3], larg[3], meio1, corpo);
      textoNaCaixa(doc, l.v.om, xs[4], larg[4], meio1, corpo);

      /* número de ordem, fora do quadro, como a coluna H da planilha */
      doc.setFont('helvetica', 'normal'); doc.setFontSize(corpo * 0.85);
      doc.setTextColor(110);
      doc.text(String(i + 1), MM.margem + larguraUtil + 2, meio1, { baseline: 'middle' });
      doc.setTextColor(0);

      y = topo + hLinha * 2 + hVao;
    });
    return doc;
  }

  function pdfQuadro(linhas) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    var c = estado.cfg;
    var larguraUtil = 297 - MM.margem * 2;
    var porOm = abaResultado === 'om';

    var cab = porOm
      ? ['OM', 'Cidade-UF', 'C Mil A', 'Cl', 'Nome de guerra', 'Nome completo']
      : ['Cl', 'Posto', 'Q/A/S', 'Idt', 'Nome de guerra', 'Nome completo', 'OM de destino', 'Cidade-UF'];
    var pesos = porOm ? [22, 18, 10, 6, 18, 26] : [5, 7, 8, 11, 16, 25, 18, 14];
    var dados = (porOm
      ? linhas.slice().sort(function (a, b) {
          return (a.v.om + a.v.cidade).localeCompare(b.v.om + b.v.cidade) || a.a.cl - b.a.cl;
        }).map(function (l) {
          return [l.v.om, l.v.cidade, l.v.cma, l.a.cl + 'º', l.a.guerra, l.a.nome];
        })
      : linhas.map(function (l) {
          return [l.a.cl + 'º', l.a.posto, l.a.qm, l.a.idt, l.a.guerra, l.a.nome, l.v.om, l.v.cidade];
        }));

    var soma = pesos.reduce(function (s, w) { return s + w; }, 0);
    var larg = pesos.map(function (w) { return w / soma * larguraUtil; });
    var xs = [], acc = MM.margem;
    larg.forEach(function (w) { xs.push(acc); acc += w; });

    var hLinha = 6, corpo = 8, fundo = 210 - MM.margem, y = MM.margem;
    doc.setLineWidth(0.15);

    doc.setFont('times', 'bold'); doc.setFontSize(11);
    doc.text(c.titulo + ' — ' + c.subtitulo, MM.margem + larguraUtil / 2, y + 3,
      { align: 'center', baseline: 'middle' });
    y += 10;

    var cabeca = function () {
      doc.setFont('times', 'bold');
      cab.forEach(function (t, k) {
        doc.rect(xs[k], y, larg[k], hLinha);
        textoNaCaixa(doc, t, xs[k], larg[k], y + hLinha / 2, corpo);
      });
      y += hLinha;
    };
    cabeca();

    doc.setFont('times', 'normal');
    dados.forEach(function (linha) {
      if (y + hLinha > fundo) { doc.addPage(); y = MM.margem; cabeca(); doc.setFont('times', 'normal'); }
      linha.forEach(function (v, k) {
        doc.rect(xs[k], y, larg[k], hLinha);
        textoNaCaixa(doc, v, xs[k], larg[k], y + hLinha / 2, corpo);
      });
      y += hLinha;
    });
    return doc;
  }

  /* ══════════════════════ IMPORTAÇÕES ══════════════════════ */

  /* ─────────────────────── Caixas de diálogo ───────────────────────
     `confirm` e `alert` do navegador não funcionam quando a aplicação roda
     dentro de uma página publicada — a janela é bloqueada e a chamada volta
     como se o usuário tivesse recusado, de modo que excluir um nome, limpar
     o quadro ou zerar as escolhas simplesmente não acontecia. Tudo passa por
     estas caixas próprias, que funcionam em qualquer ambiente.

     Devolvem uma promessa: o texto digitado, '' numa confirmação simples, ou
     null se a pessoa cancelou. */

  function dialogo(op) {
    return new Promise(function (resolve) {
      var campo = $('#modal-campo'), area = $('#modal-area'), ok = $('#modal-ok');
      $('#modal-titulo').textContent = op.titulo;
      $('#modal-texto').innerHTML = op.texto || '';
      $('#modal-texto').classList.toggle('oculto', !op.texto);

      campo.classList.toggle('oculto', !op.campo);
      area.classList.toggle('oculto', !op.area);
      if (op.campo) { campo.value = op.campo.valor || ''; campo.placeholder = op.campo.dica || ''; }
      if (op.area) area.value = op.area.valor || '';

      ok.textContent = op.ok || 'Confirmar';
      ok.classList.toggle('btn-perigo', !!op.perigo);
      ok.classList.toggle('btn-ouro', !op.perigo);
      $('#modal').classList.remove('oculto');
      (op.campo ? campo : op.area ? area : ok).focus();

      function fechar(valor) {
        $('#modal').classList.add('oculto');
        ok.onclick = null; $('#modal-cancelar').onclick = null; campo.onkeydown = null;
        resolve(valor);
      }
      ok.onclick = function () {
        fechar(op.campo ? campo.value : op.area ? area.value : '');
      };
      $('#modal-cancelar').onclick = function () { fechar(null); };
      campo.onkeydown = function (ev) { if (ev.key === 'Enter') ok.click(); };
      fecharDialogo = function () { fechar(null); };
    });
  }

  var fecharDialogo = null;

  function confirmar(titulo, texto, rotulo, perigo) {
    return dialogo({ titulo: titulo, texto: texto, ok: rotulo || 'Confirmar', perigo: perigo })
      .then(function (r) { return r !== null; });
  }

  function informar(titulo, texto) {
    return dialogo({ titulo: titulo, texto: texto, ok: 'Entendi' });
  }

  function abrirModal(titulo, texto, valor, aoAplicar) {
    dialogo({ titulo: titulo, texto: texto, area: { valor: valor }, ok: 'Aplicar' })
      .then(function (r) { if (r !== null) aoAplicar(r); });
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
    if (!novos.length) { informar('Nada foi lido', 'Não consegui reconhecer nenhuma linha. Confira se as colunas estão separadas por tabulação.'); return; }
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
    if (!novas.length) { informar('Nada foi lido', 'Não consegui reconhecer nenhuma linha. Confira se as colunas estão separadas por tabulação.'); return; }
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

  /* ═════════════════ BASE DE PRÉVIAS (compartilhada) ═════════════════
     Quando a aplicação roda como página publicada, ela tem acesso a um
     armazenamento próprio, comum a todos que abrem o mesmo endereço: é ali
     que ficam as prévias — cada uma um retrato completo da sessão (relação,
     quadro de vagas, escolhas e configuração), gravado com um nome.

     Fora dali — rodando pelo sistema ou pela pasta — esse armazenamento não
     existe, e a aba explica que o caminho é exportar a sessão em arquivo. */

  var banco = null, bancoResolvido = false;

  function comBanco() {
    if (bancoResolvido) return Promise.resolve(banco);
    if (!(window.claude && typeof window.claude.use === 'function')) {
      bancoResolvido = true;
      return Promise.resolve(null);
    }
    return window.claude.use('db').then(function (d) {
      bancoResolvido = true; banco = d; return d;
    }, function () { bancoResolvido = true; return null; });
  }

  function retrato() {
    return {
      cfg: estado.cfg, alunos: estado.alunos, vagas: estado.vagas,
      ordem: estado.ordem, escolhas: estado.escolhas
    };
  }

  function resumoPrevia() {
    var ativos = estado.alunos.filter(function (a) { return a.status !== 'ausente'; }).length;
    return { concludentes: estado.alunos.length, ativos: ativos,
             vagas: totalVagas(), escolhas: estado.escolhas.length,
             subtitulo: estado.cfg.subtitulo };
  }

  var previas = [];

  function carregarPrevias() {
    var lista = $('#pv-lista');
    if (!lista) return;
    comBanco().then(function (bd) {
      if (!bd) return desenharPrevias(null);
      return bd.collection('previas').orderBy('atualizadoEm', 'desc').limit(100).get()
        .then(function (snap) {
          previas = snap.docs.map(function (d) {
            var c = d.data() || {};
            return { id: d.id, nome: c.nome || '(sem nome)', atualizadoEm: c.atualizadoEm || '',
                     criadoEm: c.criadoEm || '', resumo: c.resumo || {} };
          });
          desenharPrevias(previas);
        });
    }).catch(function (e) {
      desenharPrevias(null, (e && e.code) || 'erro');
    });
  }

  function desenharPrevias(lista, erro) {
    var alvo = $('#pv-lista'), explica = $('#pv-explica');
    if (!alvo) return;
    $('#pv-salvar').disabled = !lista;

    if (!lista) {
      $('#cont-previas').textContent = '—';
      $('#rot-previas').textContent = erro ? 'base indisponível' : 'base não disponível aqui';
      explica.innerHTML = erro
        ? 'Não consegui falar com a base de prévias (' + esc(erro) + '). Tente recarregar a lista.'
        : 'A base compartilhada existe na versão publicada da ferramenta, onde todos que abrem ' +
          'o mesmo endereço enxergam as mesmas prévias. Rodando pelo sistema ou pela pasta, o ' +
          'caminho é <strong>Configuração → Exportar sessão</strong>, que grava um arquivo com o mesmo conteúdo.';
      alvo.innerHTML = '';
      return;
    }

    $('#cont-previas').textContent = lista.length;
    $('#rot-previas').textContent = lista.length === 1 ? 'prévia salva' : 'prévias salvas';
    explica.innerHTML = 'Cada prévia guarda a relação de concludentes, o quadro de vagas, as ' +
      'escolhas e a configuração daquele momento. Todos que abrem este endereço veem e usam as mesmas prévias.';

    if (!lista.length) {
      alvo.innerHTML = '<p class="nota">Nenhuma prévia salva ainda. Monte a relação e o quadro ' +
        'como quiser e use <strong>Salvar prévia atual</strong>.</p>';
      return;
    }

    alvo.innerHTML = lista.map(function (p) {
      var r = p.resumo || {};
      return '<div class="previa" data-id="' + esc(p.id) + '">' +
        '<div class="previa-txt">' +
          '<strong>' + esc(p.nome) + '</strong>' +
          '<span class="previa-meta">' + esc(r.subtitulo || '') +
            (r.concludentes ? ' · ' + r.concludentes + ' concludentes' : '') +
            (r.vagas ? ' · ' + r.vagas + ' vagas' : '') +
            (r.escolhas ? ' · ' + r.escolhas + ' escolhas' : ' · sem escolhas') +
          '</span>' +
          '<span class="previa-data">' + esc(quando(p.atualizadoEm)) + '</span>' +
        '</div>' +
        '<div class="previa-btns">' +
          '<button class="btn" data-acao="abrir">Abrir</button>' +
          '<button class="btn" data-acao="substituir">Substituir</button>' +
          '<button class="btn btn-perigo" data-acao="excluir">Excluir</button>' +
        '</div></div>';
    }).join('');

    $$('.previa', alvo).forEach(function (el) {
      var p = lista.filter(function (x) { return x.id === el.dataset.id; })[0];
      $$('button', el).forEach(function (b) {
        b.addEventListener('click', function () { acaoPrevia(b.dataset.acao, p); });
      });
    });
  }

  function quando(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric',
                                       hour: '2-digit', minute: '2-digit' });
  }

  function acaoPrevia(acao, p) {
    if (!p) return;
    if (acao === 'abrir') {
      confirmar('Abrir “' + p.nome + '”?',
        'Substitui o que está aberto agora — relação, quadro de vagas, escolhas e configuração. ' +
        'O que você tem na tela não é gravado automaticamente.', 'Abrir')
        .then(function (sim) {
          if (!sim) return;
          comBanco().then(function (bd) {
            return bd.doc('previas/' + p.id).get();
          }).then(function (snap) {
            if (!snap.exists) return informar('Prévia sumiu', 'Alguém a excluiu enquanto você olhava a lista.');
            var corpo = snap.data();
            var s;
            try { s = JSON.parse(corpo.estado); } catch (e) { s = null; }
            if (!s || !s.alunos || !s.vagas) return informar('Prévia ilegível', 'O conteúdo gravado não pôde ser lido.');
            estado = completar(s);
            estado.inicioVez = Date.now();
            estado.flash = null;
            marcados = {};
            mudou();
            avisarPrevia('Prévia “' + p.nome + '” aberta.');
          }).catch(function (e) { falhaPrevia(e); });
        });
      return;
    }

    if (acao === 'substituir') {
      confirmar('Substituir “' + p.nome + '”?',
        'Grava por cima o que está na tela agora. O conteúdo anterior dessa prévia se perde.',
        'Substituir', true).then(function (sim) {
          if (!sim) return;
          gravarPrevia(p.id, p.nome, p.criadoEm);
        });
      return;
    }

    confirmar('Excluir “' + p.nome + '”?', 'A prévia sai da base para todos.', 'Excluir', true)
      .then(function (sim) {
        if (!sim) return;
        comBanco().then(function (bd) { return bd.doc('previas/' + p.id).delete(); })
          .then(function () { avisarPrevia('Prévia excluída.'); carregarPrevias(); })
          .catch(function (e) { falhaPrevia(e); });
      });
  }

  function gravarPrevia(id, nome, criadoEm) {
    var agora = new Date().toISOString();
    var corpo = {
      nome: nome, criadoEm: criadoEm || agora, atualizadoEm: agora,
      resumo: resumoPrevia(), estado: JSON.stringify(retrato())
    };
    comBanco().then(function (bd) {
      if (!bd) return;
      return bd.doc('previas/' + id).set(corpo);
    }).then(function () {
      avisarPrevia('Prévia “' + nome + '” gravada.');
      carregarPrevias();
    }).catch(function (e) { falhaPrevia(e); });
  }

  function falhaPrevia(e) {
    var c = (e && e.code) || 'erro';
    if (c === 'quota_exceeded') {
      return informar('Base cheia', 'A base atingiu o limite de prévias. Exclua alguma antes de gravar outra.');
    }
    if (c === 'invalid_argument') {
      return informar('Prévia grande demais', 'O conteúdo passou do tamanho aceito por prévia.');
    }
    informar('Não deu para concluir', 'A base de prévias respondeu: ' + esc(c) + '.');
  }

  function avisarPrevia(texto) {
    var el = $('#pv-explica');
    if (el) el.textContent = texto;
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
    if (s === 'previas') carregarPrevias();
    ['alunos', 'vagas', 'previas', 'config'].forEach(function (x) {
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
    $('#al-marca-todos').addEventListener('change', function () {
      var ligar = this.checked;
      estado.alunos.forEach(function (a) { marcados[a.id] = ligar; });
      desenharAlunos();
    });
    $('#al-excluir-sel').addEventListener('click', function () {
      var ids = idsMarcados();
      if (!ids.length) return;
      var nomes = ids.map(function (id) { return aluno(id).guerra; });
      confirmar('Excluir ' + ids.length + (ids.length > 1 ? ' concludentes?' : ' concludente?'),
        esc(nomes.join(', ')) + '.<br>Saem da relação; escolhas que já tiverem feito são desfeitas.',
        'Excluir', true).then(function (sim) { if (sim) excluirAlunos(ids); });
    });
    $('#al-renumerar').addEventListener('click', function () {
      estado.ordem.forEach(function (id, i) { var a = aluno(id); if (a) a.cl = i + 1; });
      mudou();
    });
    $('#al-restaurar').addEventListener('click', function () {
      confirmar('Restaurar a base original?',
        'Volta à relação de concludentes que acompanha o programa. As escolhas já registradas serão perdidas.',
        'Restaurar', true).then(function (sim) {
          if (!sim) return;
          var novo = estadoInicial();
          estado.alunos = novo.alunos; estado.ordem = novo.ordem; estado.escolhas = [];
          estado.flash = null; mudou();
        });
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
      confirmar('Limpar o quadro de vagas?',
        'Remove todas as OM e desfaz as escolhas já registradas.', 'Limpar', true)
        .then(function (sim) {
          if (!sim) return;
          estado.vagas = []; estado.escolhas = []; mudou();
        });
    });

    /* — prévias — */
    $('#pv-recarregar').addEventListener('click', carregarPrevias);
    $('#pv-salvar').addEventListener('click', function () {
      dialogo({
        titulo: 'Salvar prévia',
        texto: 'Grava o que está na tela — relação, quadro de vagas, escolhas e configuração — ' +
               'na base compartilhada, com o nome que você der.',
        campo: { valor: '', dica: 'Ex.: Prévia de 12 nov, quadro parcial' },
        ok: 'Salvar'
      }).then(function (nome) {
        if (nome === null) return;
        nome = nome.trim();
        if (!nome) return informar('Falta o nome', 'Dê um nome à prévia para conseguir reconhecê-la depois.');
        var repetida = previas.filter(function (p) { return p.nome === nome; })[0];
        if (repetida) {
          return confirmar('Já existe “' + nome + '”', 'Quer gravar por cima dela?', 'Substituir', true)
            .then(function (sim) { if (sim) gravarPrevia(repetida.id, nome, repetida.criadoEm); });
        }
        gravarPrevia(novoId('pv').replace(/[^A-Za-z0-9_-]/g, ''), nome, null);
      });
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
          estado = completar(s); mudou();
          $('#cfg-status').textContent = 'Sessão importada de ' + f.name + '.';
        } catch (e) { informar('Arquivo não reconhecido', 'Não consegui ler: ' + esc(e.message)); }
      };
      leitor.readAsText(f);
      this.value = '';
    });
    $('#cfg-zerar').addEventListener('click', function () {
      confirmar('Zerar as escolhas?',
        'Apaga tudo o que já foi escolhido e devolve as vagas ao quadro. Os concludentes e as vagas permanecem.',
        'Zerar', true).then(function (sim) {
          if (!sim) return;
          estado.escolhas = []; estado.flash = null; estado.inicioVez = Date.now();
          estado.alunos.forEach(function (a) { a.status = 'aguardando'; });
          mudou();
        });
    });

    /* — operador — */
    $('#op-confirmar').addEventListener('click', function () {
      if (vagaSelecionada) confirmarEscolha(vagaSelecionada);
    });
    $('#op-desfazer').addEventListener('click', desfazer);
    $('#op-adiar').addEventListener('click', adiar);
    $('#op-ausente').addEventListener('click', function () {
      var a = daVez();
      if (!a) return;
      confirmar('Marcar ' + a.guerra + ' como ausente?',
        'Sai da chamada e a fila segue para o próximo. Dá para trazê-lo de volta na aba ' +
        'Preparação, pelo botão ○ da linha dele.', 'Marcar ausente')
        .then(function (sim) { if (sim) alternarAusente(a.id); });
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
    $('#res-pdf').addEventListener('click', gerarPdf);
    $('#res-imprimir').addEventListener('click', function () {
      /* Onde a impressão do navegador não está liberada, a chamada é ignorada
         em silêncio — então o PDF entra no lugar dela. */
      try {
        window.print();
      } catch (e) {
        gerarPdf();
      }
    });
    $('#res-csv').addEventListener('click', exportarCsv);
    $('#res-xls').addEventListener('click', exportarXls);

    /* — modal — */
    /* Cancelar e Esc saem pelo mesmo caminho do diálogo, para que a promessa
       que está esperando a resposta seja resolvida em vez de ficar pendurada. */

    /* — teclado — */
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (!$('#modal').classList.contains('oculto')) {
          if (fecharDialogo) fecharDialogo();
          return;
        }
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
    var trocar = function () {
      estado.vagas = vagasDoModelo(qm);
      estado.escolhas = [];
      mudou();
    };
    if (!estado.escolhas.length) return trocar();
    confirmar('Trocar o quadro de vagas?',
      'Carregar o modelo ' + qm + ' apaga as escolhas já registradas.', 'Trocar', true)
      .then(function (sim) { if (sim) trocar(); });
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

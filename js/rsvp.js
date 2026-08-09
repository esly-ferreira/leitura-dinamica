/**
 * Leitura dinâmica (RSVP) — JavaScript puro.
 */

import * as biblioteca from "./biblioteca.js";

// ---------------------------------------------------------------------------
// Constantes configuráveis
// ---------------------------------------------------------------------------

const PAUSA_FRASE_MS = 300;
const PAUSA_VIRGULA_MS = 150;
const PALAVRAS_VOLTAR = 10;
const TAMANHO_FONTE_MIN = 16;
const TAMANHO_FONTE_MAX = 80;
const WPM_MIN = 150;
const WPM_MAX = 1000;
const WPM_PADRAO = 300;
const DURACAO_TRANSICAO_PARTE_MS = 1500;

const ESTADO = {
  PARADO: "parado",
  LENDO: "lendo",
  PAUSADO: "pausado",
  FINALIZADO: "finalizado",
};

const ROTULOS_ESTADO = {
  [ESTADO.PARADO]: "Parado",
  [ESTADO.LENDO]: "Lendo",
  [ESTADO.PAUSADO]: "Pausado",
  [ESTADO.FINALIZADO]: "Finalizado",
};

const CLASSES_TEMA = {
  claro: "rsvp-tema--claro",
  escuro: "rsvp-tema--escuro",
  sepia: "rsvp-tema--sepia",
  "alto-contraste": "rsvp-tema--alto-contraste",
};

const CLASSES_FONTE = {
  default: "rsvp-fonte--default",
  "fonte-1": "rsvp-fonte--fonte-1",
  "fonte-2": "rsvp-fonte--fonte-2",
  "fonte-3": "rsvp-fonte--fonte-3",
};

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

const app = {
  palavras: [],
  indiceAtual: 0,
  estado: ESTADO.PARADO,
  wpm: WPM_PADRAO,
  timerId: null,
  modoFoco: false,
  parteAtualId: null,
  parteEditandoId: null,
  ignorarSincronizacao: false,
  timerSincronizacao: null,
};

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

const elementos = {
  titulo: document.getElementById("rsvp-titulo"),
  textarea: document.getElementById("rsvp-textarea"),
  partesLista: document.getElementById("rsvp-partes-lista"),
  partesContagem: document.getElementById("rsvp-partes-contagem"),
  partesVazio: document.getElementById("rsvp-partes-vazio"),
  parteAtual: document.getElementById("rsvp-parte-atual"),
  inputImportar: document.getElementById("rsvp-input-importar"),
  modal: document.getElementById("rsvp-modal"),
  modalTitulo: document.getElementById("rsvp-modal-titulo"),
  modalMensagem: document.getElementById("rsvp-modal-mensagem"),
  modalCancelar: document.getElementById("rsvp-modal-cancelar"),
  modalConfirmar: document.getElementById("rsvp-modal-confirmar"),
  progressoSlider: document.getElementById("rsvp-progresso-slider"),
  progressoContagem: document.getElementById("rsvp-progresso-contagem"),
  progressoPorcentagem: document.getElementById("rsvp-progresso-porcentagem"),
  estado: document.getElementById("rsvp-estado"),
  palavra: document.getElementById("rsvp-palavra"),
  palavraAntes: document.querySelector(".rsvp-palavra__antes"),
  palavraOrp: document.querySelector(".rsvp-palavra__orp"),
  palavraDepois: document.querySelector(".rsvp-palavra__depois"),
  palavraWrap: document.querySelector(".rsvp-palavra-wrap"),
  leitor: document.getElementById("rsvp-leitor"),
  leitorTransicao: document.getElementById("rsvp-leitor-transicao"),
  leitorTransicaoNumero: document.getElementById("rsvp-leitor-transicao-numero"),
  leitorTransicaoTitulo: document.getElementById("rsvp-leitor-transicao-titulo"),
  leitorSlot: document.getElementById("rsvp-leitor-slot"),
  temasSlot: document.getElementById("rsvp-temas-slot"),
  temasHome: document.getElementById("rsvp-temas-home"),
  ajustesSlot: document.getElementById("rsvp-ajustes-slot"),
  ajustesHome: document.getElementById("rsvp-ajustes-home"),
  focoOverlay: document.getElementById("rsvp-foco-overlay"),
  focoLeitorSlot: document.getElementById("rsvp-foco-leitor-slot"),
  focoTemasSlot: document.getElementById("rsvp-foco-temas-slot"),
  focoAjustesSlot: document.getElementById("rsvp-foco-ajustes-slot"),
  wpm: document.getElementById("rsvp-wpm"),
  wpmValor: document.getElementById("rsvp-wpm-valor"),
  tempoRestante: document.getElementById("rsvp-tempo-restante"),
  fonte: document.getElementById("rsvp-fonte"),
  tamanhoFonte: document.getElementById("rsvp-tamanho-fonte"),
  tamanhoValor: document.getElementById("rsvp-tamanho-valor"),
  btnPlay: document.getElementById("rsvp-btn-play"),
  iconePlay: document.getElementById("rsvp-icone-play"),
  labelPlay: document.getElementById("rsvp-label-play"),
  btnReiniciar: document.getElementById("rsvp-btn-reiniciar"),
  btnVoltar: document.getElementById("rsvp-btn-voltar"),
  btnColar: document.getElementById("rsvp-btn-colar"),
  btnNova: document.getElementById("rsvp-btn-nova"),
  btnExportar: document.getElementById("rsvp-btn-exportar"),
  btnImportar: document.getElementById("rsvp-btn-importar"),
  btnLimparTudo: document.getElementById("rsvp-btn-limpar-tudo"),
  btnAvancar: document.getElementById("rsvp-btn-avancar"),
  btnFoco: document.getElementById("rsvp-btn-foco"),
  btnSairFoco: document.getElementById("rsvp-btn-sair-foco"),
  focoPlay: document.getElementById("rsvp-foco-play"),
  focoIconePlay: document.getElementById("rsvp-foco-icone-play"),
  focoLabelPlay: document.getElementById("rsvp-foco-label-play"),
  focoAvancar: document.getElementById("rsvp-foco-avancar"),
  focoVoltar: document.getElementById("rsvp-foco-voltar"),
  botoesTema: document.querySelectorAll(".rsvp-tema-btn"),
};

// ---------------------------------------------------------------------------
// ORP — ponto ótimo de reconhecimento
// ---------------------------------------------------------------------------

function calcularIndiceORP(palavra) {
  const tamanho = palavra.length;
  if (tamanho <= 1) return 0;
  if (tamanho <= 4) return 1;
  return Math.min(Math.floor(tamanho * 0.35), tamanho - 1);
}

function renderizarPalavra(texto) {
  if (!texto) {
    elementos.palavra.classList.add("is-empty");
    elementos.palavraAntes.textContent = "";
    elementos.palavraOrp.textContent = "";
    elementos.palavraDepois.textContent = "";
    return;
  }

  elementos.palavra.classList.remove("is-empty");
  const indice = calcularIndiceORP(texto);
  elementos.palavraAntes.textContent = texto.slice(0, indice);
  elementos.palavraOrp.textContent = texto[indice] ?? "";
  elementos.palavraDepois.textContent = texto.slice(indice + 1);
}

// ---------------------------------------------------------------------------
// Processamento de texto
// ---------------------------------------------------------------------------

function obterPausaExtra(palavra) {
  if (/[.!?]$/.test(palavra)) return PAUSA_FRASE_MS;
  if (/[,;:]$/.test(palavra)) return PAUSA_VIRGULA_MS;
  return 0;
}

function processarTexto(texto) {
  const resultado = [];
  const regex = /\S+/g;
  let correspondencia;

  while ((correspondencia = regex.exec(texto)) !== null) {
    const palavra = correspondencia[0];
    resultado.push({
      texto: palavra,
      inicio: correspondencia.index,
      fim: correspondencia.index + palavra.length,
      pausaExtra: obterPausaExtra(palavra),
    });
  }

  return resultado;
}

function carregarTexto(texto, { reiniciar = true } = {}) {
  const indiceAnterior = app.indiceAtual;
  const estadoAnterior = app.estado;

  app.palavras = processarTexto(texto);

  if (reiniciar) {
    app.indiceAtual = 0;
    app.estado = ESTADO.PARADO;
    limparTimer();
  } else {
    app.indiceAtual = Math.min(indiceAnterior, Math.max(app.palavras.length - 1, 0));
    if (!app.palavras.length) {
      app.estado = ESTADO.PARADO;
      limparTimer();
    } else if (estadoAnterior === ESTADO.FINALIZADO && app.indiceAtual < app.palavras.length) {
      app.estado = ESTADO.PAUSADO;
    }
  }

  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();
  atualizarInterface();
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

function calcularDelay(palavra) {
  return 60000 / app.wpm + (palavra?.pausaExtra ?? 0);
}

function limparTimer() {
  if (app.timerId !== null) {
    clearTimeout(app.timerId);
    app.timerId = null;
  }
}

function definirEstado(novoEstado) {
  app.estado = novoEstado;
  atualizarInterface();
}

function atualizarPalavra() {
  if (app.estado === ESTADO.FINALIZADO) {
    renderizarPalavra("");
    return;
  }

  const palavra = app.palavras[app.indiceAtual];
  renderizarPalavra(palavra ? palavra.texto : "");
}

function agendarProximaPalavra() {
  if (app.estado !== ESTADO.LENDO) return;

  if (app.indiceAtual >= app.palavras.length) {
    finalizarLeitura();
    return;
  }

  const delay = calcularDelay(app.palavras[app.indiceAtual]);
  app.timerId = setTimeout(avancarPalavra, delay);
}

function avancarPalavra() {
  if (app.estado !== ESTADO.LENDO) return;

  app.indiceAtual += 1;

  if (app.indiceAtual >= app.palavras.length) {
    finalizarLeitura();
    return;
  }

  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();
  agendarProximaPalavra();
}

async function avancarManualmente() {
  if (!app.palavras.length) return;

  const proximaParte = biblioteca.obterProximaParte(app.parteAtualId);
  const naUltimaPalavra = app.indiceAtual >= app.palavras.length - 1;

  if (naUltimaPalavra) {
    if (!proximaParte) return;

    const estavaLendo = app.estado === ESTADO.LENDO;
    limparTimer();
    app.indiceAtual = app.palavras.length;
    definirEstado(ESTADO.FINALIZADO);
    atualizarPalavra();
    atualizarProgresso();
    atualizarTempoRestante();

    await carregarParte(proximaParte.id, { autoIniciar: estavaLendo });
    return;
  }

  const estavaLendo = app.estado === ESTADO.LENDO;
  limparTimer();

  app.indiceAtual += 1;

  if (app.estado === ESTADO.FINALIZADO) {
    definirEstado(ESTADO.PAUSADO);
  }

  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();

  if (estavaLendo) agendarProximaPalavra();
}

function iniciarLeitura() {
  if (!app.palavras.length) return;
  if (app.estado === ESTADO.LENDO) return;

  if (app.estado === ESTADO.FINALIZADO) {
    app.indiceAtual = 0;
  }

  definirEstado(ESTADO.LENDO);
  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();
  agendarProximaPalavra();
}

function pausarLeitura() {
  if (app.estado !== ESTADO.LENDO) return;
  limparTimer();
  definirEstado(ESTADO.PAUSADO);
}

function alternarPlayPause() {
  if (!app.palavras.length) return;

  if (app.estado === ESTADO.LENDO) {
    pausarLeitura();
    return;
  }

  if (app.estado === ESTADO.PAUSADO) {
    definirEstado(ESTADO.LENDO);
    agendarProximaPalavra();
    return;
  }

  iniciarLeitura();
}

function reiniciarLeitura() {
  limparTimer();
  app.indiceAtual = 0;
  definirEstado(ESTADO.PARADO);
  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();
}

function voltarPalavras() {
  if (!app.palavras.length || app.indiceAtual === 0) return;

  const estavaLendo = app.estado === ESTADO.LENDO;
  limparTimer();

  app.indiceAtual = Math.max(0, app.indiceAtual - PALAVRAS_VOLTAR);

  if (app.estado === ESTADO.FINALIZADO) {
    definirEstado(ESTADO.PAUSADO);
  }

  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();

  if (estavaLendo) {
    definirEstado(ESTADO.LENDO);
    agendarProximaPalavra();
  }
}

function irParaPalavra(indice) {
  if (!app.palavras.length) return;

  const estavaLendo = app.estado === ESTADO.LENDO;
  limparTimer();

  app.indiceAtual = Math.max(0, Math.min(indice, app.palavras.length - 1));

  if (app.estado === ESTADO.FINALIZADO) {
    definirEstado(ESTADO.PAUSADO);
  }

  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();

  if (estavaLendo) {
    definirEstado(ESTADO.LENDO);
    agendarProximaPalavra();
  }
}

function finalizarLeitura() {
  const estavaLendo = app.estado === ESTADO.LENDO;
  limparTimer();
  app.indiceAtual = app.palavras.length;
  definirEstado(ESTADO.FINALIZADO);
  atualizarPalavra();
  atualizarProgresso();
  atualizarTempoRestante();

  const proximaParte = biblioteca.obterProximaParte(app.parteAtualId);
  if (proximaParte && estavaLendo) {
    carregarParte(proximaParte.id, { autoIniciar: true });
  }
}

// ---------------------------------------------------------------------------
// Biblioteca — partes e cache local
// ---------------------------------------------------------------------------

function obterTituloFormulario() {
  return elementos.titulo.value.trim();
}

function obterTextoFormulario() {
  return elementos.textarea.value;
}

function preencherFormulario(parte) {
  app.ignorarSincronizacao = true;
  elementos.titulo.value = parte?.titulo ?? "";
  elementos.textarea.value = parte?.texto ?? "";
  app.parteEditandoId = parte?.id ?? null;
  requestAnimationFrame(() => {
    app.ignorarSincronizacao = false;
  });
}

function limparFormulario() {
  preencherFormulario(null);
}

function atualizarRotuloParteAtual() {
  const parte = biblioteca.obterPartePorId(app.parteAtualId);
  elementos.parteAtual.textContent = parte
    ? `Parte ${parte.ordem + 1}: ${parte.titulo}`
    : "Nenhuma parte selecionada";
}

function renderizarListaPartes() {
  const partes = biblioteca.obterPartes();
  elementos.partesLista.innerHTML = "";
  elementos.partesVazio.hidden = partes.length > 0;
  elementos.partesContagem.textContent =
    partes.length === 1 ? "1 parte" : `${partes.length} partes`;

  partes.forEach((parte, indice) => {
    const item = document.createElement("li");
    item.className = "rsvp-partes__item";
    if (parte.id === app.parteAtualId) item.classList.add("is-ativa");

    const info = document.createElement("button");
    info.type = "button";
    info.className = "rsvp-partes__info";
    info.innerHTML = `
      <span class="rsvp-partes__ordem">${indice + 1}</span>
      <span class="rsvp-partes__titulo">${escapeHtml(parte.titulo)}</span>
    `;
    info.addEventListener("click", () => selecionarParte(parte.id));

    const acoes = document.createElement("div");
    acoes.className = "rsvp-partes__acoes";

    const btnSubir = document.createElement("button");
    btnSubir.type = "button";
    btnSubir.className = "rsvp-partes__btn";
    btnSubir.title = "Mover para cima";
    btnSubir.innerHTML = '<span class="material-symbols-rounded">arrow_upward</span>';
    btnSubir.disabled = indice === 0;
    btnSubir.addEventListener("click", (e) => {
      e.stopPropagation();
      biblioteca.moverParte(parte.id, -1);
      renderizarListaPartes();
    });

    const btnDescer = document.createElement("button");
    btnDescer.type = "button";
    btnDescer.className = "rsvp-partes__btn";
    btnDescer.title = "Mover para baixo";
    btnDescer.innerHTML = '<span class="material-symbols-rounded">arrow_downward</span>';
    btnDescer.disabled = indice === partes.length - 1;
    btnDescer.addEventListener("click", (e) => {
      e.stopPropagation();
      biblioteca.moverParte(parte.id, 1);
      renderizarListaPartes();
    });

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.className = "rsvp-partes__btn rsvp-partes__btn--danger";
    btnExcluir.title = "Excluir parte";
    btnExcluir.innerHTML = '<span class="material-symbols-rounded">delete</span>';
    btnExcluir.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirParte(parte.id);
    });

    acoes.append(btnSubir, btnDescer, btnExcluir);
    item.append(info, acoes);
    elementos.partesLista.appendChild(item);
  });
}

function escapeHtml(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let transicaoParteTimers = [];

function limparTimersTransicaoParte() {
  transicaoParteTimers.forEach(clearTimeout);
  transicaoParteTimers = [];
}

function mostrarTransicaoParte(parte) {
  return new Promise((resolve) => {
    limparTimersTransicaoParte();

    const { leitor, leitorTransicao, leitorTransicaoNumero, leitorTransicaoTitulo } =
      elementos;

    leitorTransicaoNumero.textContent = `Parte ${parte.ordem + 1}`;
    leitorTransicaoTitulo.textContent = parte.titulo;

    leitorTransicao.hidden = false;
    leitor.classList.add("is-trocando-parte");
    leitorTransicao.classList.remove("is-ativo");

    requestAnimationFrame(() => {
      leitorTransicao.classList.add("is-ativo");
    });

    const aoFinalizar = () => {
      leitorTransicao.classList.remove("is-ativo");
      leitor.classList.remove("is-trocando-parte");
      transicaoParteTimers.push(
        setTimeout(() => {
          leitorTransicao.hidden = true;
          resolve();
        }, 350)
      );
    };

    transicaoParteTimers.push(setTimeout(aoFinalizar, DURACAO_TRANSICAO_PARTE_MS));
  });
}

async function carregarParte(id, { autoIniciar = false } = {}) {
  const parte = biblioteca.obterPartePorId(id);
  if (!parte) return;

  const mudouParte = app.parteAtualId !== null && app.parteAtualId !== id;

  if (mudouParte) {
    if (app.estado === ESTADO.LENDO) limparTimer();
    await mostrarTransicaoParte(parte);
  }

  app.parteAtualId = parte.id;
  biblioteca.definirParteAtual(parte.id);
  preencherFormulario(parte);
  carregarTexto(parte.texto, { reiniciar: true });
  atualizarRotuloParteAtual();
  renderizarListaPartes();

  if (autoIniciar && parte.texto.trim()) {
    iniciarLeitura();
  }
}

function selecionarParte(id) {
  if (app.estado === ESTADO.LENDO) limparTimer();
  carregarParte(id, { autoIniciar: false });
}

function sincronizarParteAtual({ reiniciarLeitura = false } = {}) {
  if (app.ignorarSincronizacao) return;

  const titulo = obterTituloFormulario();
  const texto = obterTextoFormulario();
  const estavaLendo = app.estado === ESTADO.LENDO;

  if (!texto.trim()) {
    if (app.parteEditandoId) {
      biblioteca.atualizarParte(app.parteEditandoId, titulo, texto);
      if (reiniciarLeitura && estavaLendo) limparTimer();
      carregarTexto("", { reiniciar: reiniciarLeitura });
      atualizarRotuloParteAtual();
      renderizarListaPartes();
    }
    return;
  }

  let parte;

  if (app.parteEditandoId) {
    parte = biblioteca.atualizarParte(app.parteEditandoId, titulo, texto);
  } else {
    const tituloPadrao = titulo || `Parte ${biblioteca.obterPartes().length + 1}`;
    parte = biblioteca.adicionarParte(tituloPadrao, texto);
    app.parteEditandoId = parte.id;
    if (!titulo) elementos.titulo.value = parte.titulo;
  }

  if (!parte) return;

  app.parteAtualId = parte.id;
  biblioteca.definirParteAtual(parte.id);

  if (reiniciarLeitura && estavaLendo) limparTimer();

  carregarTexto(texto, { reiniciar: reiniciarLeitura });

  if (estavaLendo && !reiniciarLeitura) {
    definirEstado(ESTADO.LENDO);
    agendarProximaPalavra();
  }

  atualizarRotuloParteAtual();
  renderizarListaPartes();
}

function agendarSincronizacao(opcoes = {}) {
  clearTimeout(app.timerSincronizacao);
  app.timerSincronizacao = setTimeout(() => {
    sincronizarParteAtual(opcoes);
  }, 400);
}

function aoColarNoTextarea() {
  requestAnimationFrame(() => {
    sincronizarParteAtual({ reiniciarLeitura: true });
  });
}

function aoEditarTexto() {
  agendarSincronizacao({ reiniciarLeitura: false });
}

function aoEditarTitulo() {
  agendarSincronizacao({ reiniciarLeitura: false });
}

async function excluirParte(id) {
  const parte = biblioteca.obterPartePorId(id);
  if (!parte) return;

  const confirmou = await confirmarModal(
    "Excluir parte",
    `Deseja excluir "${parte.titulo}"? Esta ação não pode ser desfeita.`
  );
  if (!confirmou) return;

  biblioteca.removerParte(id);

  if (app.parteAtualId === id) {
    app.parteAtualId = biblioteca.obterEstado().parteAtualId;
    const novaAtual = biblioteca.obterParteAtual();

    if (novaAtual) {
      carregarParte(novaAtual.id, { autoIniciar: false });
    } else {
      limparFormulario();
      app.parteAtualId = null;
      carregarTexto("", { reiniciar: true });
      atualizarRotuloParteAtual();
    }
  }

  renderizarListaPartes();
}

function exportarBiblioteca() {
  const dados = biblioteca.exportarDados();
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `leitura-dinamica-${data}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importarBiblioteca(arquivo) {
  if (!arquivo) return;

  try {
    const texto = await arquivo.text();
    const dados = JSON.parse(texto);
    const total = dados.partes?.length ?? 0;

    const confirmou = await confirmarModal(
      "Importar biblioteca",
      `Isso vai substituir todas as ${biblioteca.obterPartes().length} parte(s) atuais por ${total} parte(s) do arquivo. Os dados ficam apenas neste navegador, localmente. Deseja continuar?`
    );
    if (!confirmou) return;

    biblioteca.importarDados(dados);
    app.parteAtualId = biblioteca.obterEstado().parteAtualId;

    const parte = biblioteca.obterParteAtual();
    if (parte) {
      carregarParte(parte.id, { autoIniciar: false });
    } else {
      limparFormulario();
      carregarTexto("", { reiniciar: true });
      atualizarRotuloParteAtual();
    }

    renderizarListaPartes();
  } catch {
    await confirmarModal(
      "Erro na importação",
      "Não foi possível ler o arquivo. Verifique se é um backup válido da Leitura Dinâmica.",
      { somenteOk: true }
    );
  } finally {
    elementos.inputImportar.value = "";
  }
}

async function apagarTudoCache() {
  const confirmou = await confirmarModal(
    "Apagar todos os dados",
    "Isso remove permanentemente todas as partes salvas neste navegador. Os dados não são enviados para a internet — ficam apenas na sua máquina, localmente. Deseja apagar tudo?"
  );
  if (!confirmou) return;

  if (app.estado === ESTADO.LENDO) limparTimer();
  biblioteca.limparTudo();

  app.parteAtualId = null;
  app.parteEditandoId = null;
  limparFormulario();
  carregarTexto("", { reiniciar: true });
  atualizarRotuloParteAtual();
  renderizarListaPartes();
}

function confirmarModal(titulo, mensagem, { somenteOk = false } = {}) {
  return new Promise((resolve) => {
    elementos.modalTitulo.textContent = titulo;
    elementos.modalMensagem.textContent = mensagem;
    elementos.modal.hidden = false;
    elementos.modal.setAttribute("aria-hidden", "false");

    elementos.modalCancelar.hidden = somenteOk;
    elementos.modalConfirmar.textContent = somenteOk ? "Entendi" : "Confirmar";
    elementos.modalConfirmar.classList.toggle("md-button-danger", !somenteOk);
    elementos.modalConfirmar.classList.toggle("md-button", somenteOk);

    const fechar = (resultado) => {
      elementos.modal.hidden = true;
      elementos.modal.setAttribute("aria-hidden", "true");
      elementos.modalCancelar.removeEventListener("click", aoCancelar);
      elementos.modalConfirmar.removeEventListener("click", aoConfirmar);
      resolve(resultado);
    };

    const aoCancelar = () => fechar(false);
    const aoConfirmar = () => fechar(somenteOk ? false : true);

    elementos.modalCancelar.addEventListener("click", aoCancelar);
    elementos.modalConfirmar.addEventListener("click", aoConfirmar);
  });
}

function inicializarBiblioteca() {
  const parte = biblioteca.obterParteAtual();

  if (parte) {
    app.parteAtualId = parte.id;
    carregarParte(parte.id, { autoIniciar: false });
  } else {
    renderizarListaPartes();
    atualizarRotuloParteAtual();
  }
}

// ---------------------------------------------------------------------------
// Progresso
// ---------------------------------------------------------------------------

function obterPalavrasLidas() {
  if (!app.palavras.length) return 0;
  if (app.estado === ESTADO.FINALIZADO) return app.palavras.length;
  return Math.min(app.indiceAtual + 1, app.palavras.length);
}

function atualizarProgresso() {
  const total = app.palavras.length;
  const lidas = obterPalavrasLidas();
  const porcentagem = total > 0 ? Math.round((lidas / total) * 100) : 0;

  elementos.progressoContagem.textContent = `${lidas} / ${total}`;
  elementos.progressoPorcentagem.textContent = `${porcentagem}%`;

  elementos.progressoSlider.max = String(Math.max(total - 1, 0));
  elementos.progressoSlider.value = String(
    Math.min(app.indiceAtual, Math.max(total - 1, 0))
  );
  elementos.progressoSlider.disabled = total === 0;
  atualizarTempoRestante();
}

function calcularTempoRestanteMs() {
  if (!app.palavras.length || app.estado === ESTADO.FINALIZADO) return 0;

  const inicio = app.indiceAtual;
  let total = 0;

  for (let i = inicio; i < app.palavras.length; i += 1) {
    total += calcularDelay(app.palavras[i]);
  }

  return total;
}

function formatarTempo(ms) {
  if (ms <= 0) return "—";

  const segundos = Math.ceil(ms / 1000);

  if (segundos < 60) return `~${segundos} seg`;

  const minutos = Math.floor(segundos / 60);
  const segRestantes = segundos % 60;

  if (minutos < 60) {
    return segRestantes > 0 ? `~${minutos} min ${segRestantes} seg` : `~${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minRestantes = minutos % 60;
  return minRestantes > 0 ? `~${horas}h ${minRestantes}min` : `~${horas}h`;
}

function atualizarTempoRestante() {
  const tempo = formatarTempo(calcularTempoRestanteMs());
  elementos.tempoRestante.innerHTML = `Tempo: <span class="neutral-900 font-medium">${tempo}</span>`;
}

// ---------------------------------------------------------------------------
// Configurações visuais
// ---------------------------------------------------------------------------

function alterarWpm(novoWpm) {
  app.wpm = Math.min(WPM_MAX, Math.max(WPM_MIN, novoWpm));
  elementos.wpmValor.textContent = `${app.wpm} WPM`;
  atualizarTempoRestante();

  if (app.estado === ESTADO.LENDO) {
    limparTimer();
    agendarProximaPalavra();
  }
}

function alterarTema(tema) {
  Object.values(CLASSES_TEMA).forEach((c) => elementos.leitor.classList.remove(c));
  elementos.leitor.classList.add(CLASSES_TEMA[tema]);
  elementos.botoesTema.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tema === tema);
  });
}

function alterarFonte(familia) {
  Object.values(CLASSES_FONTE).forEach((c) => elementos.leitor.classList.remove(c));
  elementos.leitor.classList.add(CLASSES_FONTE[familia]);
}

function alterarTamanhoFonte(tamanho) {
  const valor = Math.min(TAMANHO_FONTE_MAX, Math.max(TAMANHO_FONTE_MIN, tamanho));
  elementos.palavraWrap.style.fontSize = `${valor}px`;
  elementos.tamanhoValor.textContent = `${valor}px`;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

function atualizarBotoes() {
  const temTexto = app.palavras.length > 0;
  const proximaParte = biblioteca.obterProximaParte(app.parteAtualId);
  const podeAvancarPalavra = temTexto && app.indiceAtual < app.palavras.length - 1;
  const podeAvancarParte =
    temTexto && proximaParte && app.indiceAtual >= app.palavras.length - 1;
  const temProgresso = app.indiceAtual > 0 || app.estado === ESTADO.FINALIZADO;
  const lendo = app.estado === ESTADO.LENDO;
  const pausado = app.estado === ESTADO.PAUSADO;

  elementos.btnPlay.disabled = !temTexto || app.estado === ESTADO.FINALIZADO;
  elementos.btnReiniciar.disabled = !temTexto || !temProgresso;
  elementos.btnVoltar.disabled = !temTexto || app.indiceAtual === 0;
  elementos.btnAvancar.disabled = !podeAvancarPalavra && !podeAvancarParte;

  if (lendo) {
    elementos.iconePlay.textContent = "pause";
    elementos.labelPlay.textContent = "Pausar";
    elementos.btnPlay.setAttribute("aria-label", "Pausar leitura");
    elementos.focoIconePlay.textContent = "pause";
    elementos.focoLabelPlay.textContent = "Pausar";
    elementos.focoPlay.setAttribute("aria-label", "Pausar leitura");
  } else if (pausado) {
    elementos.iconePlay.textContent = "play_arrow";
    elementos.labelPlay.textContent = "Continuar";
    elementos.btnPlay.setAttribute("aria-label", "Continuar leitura");
    elementos.focoIconePlay.textContent = "play_arrow";
    elementos.focoLabelPlay.textContent = "Continuar";
    elementos.focoPlay.setAttribute("aria-label", "Continuar leitura");
  } else {
    elementos.iconePlay.textContent = "play_arrow";
    elementos.labelPlay.textContent = "Iniciar";
    elementos.btnPlay.setAttribute("aria-label", "Iniciar leitura");
    elementos.focoIconePlay.textContent = "play_arrow";
    elementos.focoLabelPlay.textContent = "Iniciar";
    elementos.focoPlay.setAttribute("aria-label", "Iniciar leitura");
  }

  elementos.focoPlay.disabled = elementos.btnPlay.disabled;
  elementos.focoAvancar.disabled = elementos.btnAvancar.disabled;
  elementos.focoVoltar.disabled = elementos.btnVoltar.disabled;
}

function atualizarRotuloEstado() {
  elementos.estado.textContent = ROTULOS_ESTADO[app.estado];
  elementos.estado.classList.remove(
    "status-text--success",
    "status-text--danger",
    "status-text--neutral"
  );

  const classe = {
    [ESTADO.PARADO]: "status-text--neutral",
    [ESTADO.LENDO]: "status-text--success",
    [ESTADO.PAUSADO]: "status-text--neutral",
    [ESTADO.FINALIZADO]: "status-text--success",
  }[app.estado];

  elementos.estado.classList.add(classe);
}

function atualizarInterface() {
  atualizarBotoes();
  atualizarRotuloEstado();
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

async function colarTexto() {
  try {
    const texto = await navigator.clipboard.readText();
    if (!texto) return;
    elementos.textarea.value = texto;
    sincronizarParteAtual({ reiniciarLeitura: true });
    elementos.textarea.focus();
  } catch {
    elementos.textarea.focus();
    document.execCommand("paste");
  }
}

function novaParte() {
  if (app.estado === ESTADO.LENDO) limparTimer();
  limparFormulario();
  elementos.titulo.focus();
}

function ehCelular() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function estaEmTelaCheia() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

function solicitarTelaCheia(el) {
  const request =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen;
  if (!request) return Promise.resolve();
  return Promise.resolve(request.call(el)).catch(() => {});
}

function sairTelaCheia() {
  if (!estaEmTelaCheia()) return Promise.resolve();
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;
  if (!exit) return Promise.resolve();
  return Promise.resolve(exit.call(document)).catch(() => {});
}

function entrarModoFoco() {
  if (app.modoFoco) return;

  app.modoFoco = true;
  document.body.classList.add("rsvp-modo-foco");
  elementos.focoOverlay.hidden = false;
  elementos.focoOverlay.setAttribute("aria-hidden", "false");
  elementos.focoLeitorSlot.appendChild(elementos.leitor);
  elementos.focoTemasSlot.appendChild(elementos.temasSlot);
  elementos.focoAjustesSlot.appendChild(elementos.ajustesSlot);
  elementos.btnFoco.classList.add("is-active");
  elementos.btnFoco.setAttribute("aria-label", "Sair do modo foco");

  // No celular, usa a Fullscreen API para esconder as barras do navegador.
  if (ehCelular()) {
    solicitarTelaCheia(elementos.focoOverlay);
  }
}

function sairModoFoco() {
  if (!app.modoFoco) return;

  app.modoFoco = false;
  document.body.classList.remove("rsvp-modo-foco");
  elementos.focoOverlay.hidden = true;
  elementos.focoOverlay.setAttribute("aria-hidden", "true");
  elementos.leitorSlot.appendChild(elementos.leitor);
  elementos.temasHome.appendChild(elementos.temasSlot);
  elementos.ajustesHome.appendChild(elementos.ajustesSlot);
  elementos.btnFoco.classList.remove("is-active");
  elementos.btnFoco.setAttribute("aria-label", "Ativar modo foco");

  sairTelaCheia();
}

function aoMudarTelaCheia() {
  // Se o usuário sair da tela cheia pelo gesto do sistema, fecha o modo foco.
  if (!estaEmTelaCheia() && app.modoFoco) {
    sairModoFoco();
  }
}

function alternarModoFoco() {
  if (app.modoFoco) {
    sairModoFoco();
  } else {
    entrarModoFoco();
  }
}

function inicializarEventos() {
  elementos.textarea.addEventListener("paste", aoColarNoTextarea);
  elementos.textarea.addEventListener("input", aoEditarTexto);
  elementos.titulo.addEventListener("input", aoEditarTitulo);

  elementos.btnNova.addEventListener("click", novaParte);
  elementos.btnColar.addEventListener("click", colarTexto);
  elementos.btnExportar.addEventListener("click", exportarBiblioteca);
  elementos.btnImportar.addEventListener("click", () => elementos.inputImportar.click());
  elementos.btnLimparTudo.addEventListener("click", apagarTudoCache);
  elementos.inputImportar.addEventListener("change", (e) => {
    importarBiblioteca(e.target.files?.[0]);
  });

  elementos.btnPlay.addEventListener("click", alternarPlayPause);
  elementos.btnReiniciar.addEventListener("click", reiniciarLeitura);
  elementos.btnVoltar.addEventListener("click", voltarPalavras);
  elementos.btnAvancar.addEventListener("click", avancarManualmente);

  elementos.btnFoco.addEventListener("click", alternarModoFoco);
  elementos.btnSairFoco.addEventListener("click", sairModoFoco);
  elementos.focoPlay.addEventListener("click", alternarPlayPause);
  elementos.focoVoltar.addEventListener("click", voltarPalavras);
  elementos.focoAvancar.addEventListener("click", avancarManualmente);

  document.addEventListener("fullscreenchange", aoMudarTelaCheia);
  document.addEventListener("webkitfullscreenchange", aoMudarTelaCheia);

  elementos.wpm.addEventListener("input", (e) => {
    alterarWpm(Number(e.target.value));
  });

  elementos.progressoSlider.addEventListener("input", (e) => {
    irParaPalavra(Number(e.target.value));
  });

  elementos.fonte.addEventListener("change", (e) => {
    alterarFonte(e.target.value);
  });

  elementos.tamanhoFonte.addEventListener("input", (e) => {
    alterarTamanhoFonte(Number(e.target.value));
  });

  elementos.botoesTema.forEach((btn) => {
    btn.addEventListener("click", () => alterarTema(btn.dataset.tema));
  });

  document.addEventListener("keydown", (e) => {
    if (e.target === elementos.textarea || e.target === elementos.titulo) return;

    if (e.code === "Escape") {
      if (!elementos.modal.hidden) return;
      if (app.modoFoco) {
        e.preventDefault();
        sairModoFoco();
      }
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      alternarPlayPause();
    }
  });
}

function inicializar() {
  alterarTamanhoFonte(Number(elementos.tamanhoFonte.value));
  alterarWpm(WPM_PADRAO);
  inicializarEventos();
  inicializarBiblioteca();
}

inicializar();

/**
 * Biblioteca local — partes de leitura com cache no navegador.
 */

const CHAVE_STORAGE = "rsvp-biblioteca-v1";
const VERSAO_EXPORT = 1;

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function criarEstadoVazio() {
  return {
    version: VERSAO_EXPORT,
    partes: [],
    parteAtualId: null,
  };
}

function carregarDoStorage() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return criarEstadoVazio();

    const dados = JSON.parse(bruto);
    if (!Array.isArray(dados.partes)) return criarEstadoVazio();

    return {
      version: dados.version ?? VERSAO_EXPORT,
      partes: dados.partes
        .filter((p) => p && typeof p.titulo === "string" && typeof p.texto === "string")
        .map((p, i) => ({
          id: p.id || gerarId(),
          titulo: p.titulo.trim() || `Parte ${i + 1}`,
          texto: p.texto,
          criadoEm: p.criadoEm ?? Date.now(),
          ordem: typeof p.ordem === "number" ? p.ordem : i,
        }))
        .sort((a, b) => a.ordem - b.ordem)
        .map((p, i) => ({ ...p, ordem: i })),
      parteAtualId: dados.parteAtualId ?? null,
    };
  } catch {
    return criarEstadoVazio();
  }
}

function salvarNoStorage(estado) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
}

let estado = carregarDoStorage();

export function obterEstado() {
  return estado;
}

export function obterPartes() {
  return [...estado.partes];
}

export function obterPartePorId(id) {
  return estado.partes.find((p) => p.id === id) ?? null;
}

export function obterParteAtual() {
  if (!estado.parteAtualId) return null;
  return obterPartePorId(estado.parteAtualId);
}

export function obterProximaParte(idAtual) {
  const indice = estado.partes.findIndex((p) => p.id === idAtual);
  if (indice < 0 || indice >= estado.partes.length - 1) return null;
  return estado.partes[indice + 1];
}

export function definirParteAtual(id) {
  estado.parteAtualId = id;
  salvarNoStorage(estado);
}

export function adicionarParte(titulo, texto) {
  const parte = {
    id: gerarId(),
    titulo: titulo.trim() || `Parte ${estado.partes.length + 1}`,
    texto,
    criadoEm: Date.now(),
    ordem: estado.partes.length,
  };

  estado.partes.push(parte);
  estado.parteAtualId = parte.id;
  salvarNoStorage(estado);
  return parte;
}

export function atualizarParte(id, titulo, texto) {
  const parte = obterPartePorId(id);
  if (!parte) return null;

  parte.titulo = titulo.trim() || parte.titulo;
  parte.texto = texto;
  salvarNoStorage(estado);
  return parte;
}

export function removerParte(id) {
  const indice = estado.partes.findIndex((p) => p.id === id);
  if (indice < 0) return false;

  estado.partes.splice(indice, 1);
  estado.partes.forEach((p, i) => {
    p.ordem = i;
  });

  if (estado.parteAtualId === id) {
    estado.parteAtualId = estado.partes[0]?.id ?? null;
  }

  salvarNoStorage(estado);
  return true;
}

export function moverParte(id, direcao) {
  const indice = estado.partes.findIndex((p) => p.id === id);
  const novoIndice = indice + direcao;

  if (indice < 0 || novoIndice < 0 || novoIndice >= estado.partes.length) {
    return false;
  }

  const [parte] = estado.partes.splice(indice, 1);
  estado.partes.splice(novoIndice, 0, parte);
  estado.partes.forEach((p, i) => {
    p.ordem = i;
  });

  salvarNoStorage(estado);
  return true;
}

export function limparTudo() {
  estado = criarEstadoVazio();
  salvarNoStorage(estado);
}

export function exportarDados() {
  return {
    version: VERSAO_EXPORT,
    exportadoEm: new Date().toISOString(),
    partes: estado.partes.map(({ id, titulo, texto, criadoEm, ordem }) => ({
      id,
      titulo,
      texto,
      criadoEm,
      ordem,
    })),
    parteAtualId: estado.parteAtualId,
  };
}

export function importarDados(dados) {
  if (!dados || !Array.isArray(dados.partes)) {
    throw new Error("Arquivo inválido.");
  }

  estado = {
    version: dados.version ?? VERSAO_EXPORT,
    partes: dados.partes
      .filter((p) => p && typeof p.texto === "string")
      .map((p, i) => ({
        id: p.id || gerarId(),
        titulo: (p.titulo || `Parte ${i + 1}`).trim(),
        texto: p.texto,
        criadoEm: p.criadoEm ?? Date.now(),
        ordem: typeof p.ordem === "number" ? p.ordem : i,
      }))
      .sort((a, b) => a.ordem - b.ordem)
      .map((p, i) => ({ ...p, ordem: i })),
    parteAtualId: dados.parteAtualId ?? dados.partes[0]?.id ?? null,
  };

  if (estado.parteAtualId && !obterPartePorId(estado.parteAtualId)) {
    estado.parteAtualId = estado.partes[0]?.id ?? null;
  }

  salvarNoStorage(estado);
  return estado;
}

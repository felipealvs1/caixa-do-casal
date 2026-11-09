/**
 * Caixa do Casal — servidor da planilha (Google Apps Script)
 *
 * Guarda as rendas, os gastos e os ajustes do app nas abas desta planilha.
 * Passo a passo completo no arquivo README.md do repositório.
 *
 * 1. Troque a senha abaixo por uma que só vocês dois saibam.
 * 2. Salve e publique em Implantar > Nova implantação > App da Web.
 *    Ao atualizar este código depois: Implantar > Gerenciar implantações > lápis > Versão: Nova versão.
 */
const SENHA = 'troque-esta-senha';

// versão 2: coluna "ajustes" (valor diferente em meses específicos, ex.: {"2026-11":230})
const VERSAO = 2;
const ABAS = {
  rendas: { nome: 'Rendas', campos: ['id', 'descricao', 'valor', 'tipo', 'pessoa', 'inicio', 'fim', 'atualizadoEm', 'ajustes'] },
  gastos: { nome: 'Gastos', campos: ['id', 'descricao', 'valor', 'tipo', 'pessoa', 'categoria', 'inicio', 'fim', 'parcelas', 'observacao', 'atualizadoEm', 'ajustes'] },
};
const ABA_AJUSTES = 'Ajustes';
const NUMEROS = ['valor', 'parcelas', 'atualizadoEm'];
const MESES = ['inicio', 'fim'];

function doGet() {
  return ContentService.createTextOutput('Caixa do Casal: servidor da planilha ativo.');
}

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (_) { return resposta({ ok: false, erro: 'pedido' }); }
  if (!SENHA || SENHA === 'troque-esta-senha') return resposta({ ok: false, erro: 'sem_senha' });
  if (p.senha !== SENHA) return resposta({ ok: false, erro: 'senha' });

  const trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    switch (p.acao) {
      case 'ler': break;
      case 'gravar': salvarItem(p.col, p.item); break;
      case 'remover': removerItem(p.col, p.id); break;
      case 'cfg': salvarAjustes(p.cfg); break;
      case 'restaurar':
        if (p.cfg) salvarAjustes(p.cfg);
        (p.rendas || []).forEach(r => salvarItem('rendas', r));
        (p.gastos || []).forEach(g => salvarItem('gastos', g));
        break;
      case 'apagar': apagarTudo(); break;
      default: return resposta({ ok: false, erro: 'acao' });
    }
    SpreadsheetApp.flush();
    return resposta({ ok: true, versao: VERSAO, rendas: lerItens('rendas'), gastos: lerItens('gastos'), cfg: lerAjustes() });
  } finally {
    trava.releaseLock();
  }
}

/* ---------- Abas ---------- */
function aba(col) {
  const def = ABAS[col];
  if (!def) throw new Error('Coleção desconhecida: ' + col);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.nome);
  if (!sh) {
    sh = ss.insertSheet(def.nome);
    sh.getRange(1, 1, 1, def.campos.length).setValues([def.campos]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // meses como texto (2026-11), para a planilha não virar data
    [...MESES, 'ajustes'].forEach(m => { const c = def.campos.indexOf(m) + 1; if (c) sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@'); });
  }
  // planilhas criadas pela versão anterior: acrescenta o cabeçalho das colunas novas
  const cab = sh.getRange(1, 1, 1, def.campos.length).getValues()[0];
  def.campos.forEach((k, i) => {
    if (cab[i] !== k) {
      sh.getRange(1, i + 1).setValue(k).setFontWeight('bold');
      if (k === 'ajustes') sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    }
  });
  return sh;
}

function abaAjustes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA_AJUSTES);
  if (!sh) {
    sh = ss.insertSheet(ABA_AJUSTES);
    sh.getRange(1, 1, 1, 2).setValues([['chave', 'valor']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(1, 2, sh.getMaxRows(), 1).setNumberFormat('@');
  }
  return sh;
}

/* ---------- Leitura ---------- */
function mesTexto(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM');
  return String(v || '').trim();
}

function lerItens(col) {
  const def = ABAS[col], sh = aba(col);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const linhas = sh.getRange(2, 1, n, def.campos.length).getValues();
  const out = [];
  linhas.forEach(l => {
    if (!String(l[0]).trim()) return;
    const o = {};
    def.campos.forEach((k, i) => {
      let v = l[i];
      if (v === '' || v === null) return;
      if (NUMEROS.includes(k)) v = Number(String(v).replace(',', '.'));
      else if (MESES.includes(k)) v = mesTexto(v);
      else if (k === 'observacao') v = v === true || String(v).toUpperCase() === 'TRUE' || v === 'sim';
      else if (k === 'ajustes') { try { v = JSON.parse(String(v)); } catch (_) { v = null; } }
      else v = String(v);
      if ((k === 'observacao' || k === 'ajustes') && !v) return;
      o[k] = v;
    });
    out.push(o);
  });
  return out;
}

function lerAjustes() {
  const sh = abaAjustes(), n = sh.getLastRow() - 1, cfg = {};
  if (n < 1) return cfg;
  sh.getRange(2, 1, n, 2).getValues().forEach(([k, v]) => {
    k = String(k).trim();
    if (!k) return;
    if (k === 'inicio') v = mesTexto(v);
    else if (typeof v === 'string' && v !== '' && !isNaN(Number(v))) v = Number(v);
    cfg[k] = v;
  });
  return cfg;
}

/* ---------- Escrita ---------- */
function linhaDoId(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return -1;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function salvarItem(col, item) {
  if (!item || !item.id) throw new Error('Lançamento sem id');
  const def = ABAS[col], sh = aba(col);
  const linha = def.campos.map(k => {
    const v = item[k];
    if (k === 'observacao') return v ? true : '';
    if (k === 'ajustes') return v && typeof v === 'object' && Object.keys(v).length ? JSON.stringify(v) : '';
    return v === undefined || v === null ? '' : v;
  });
  const r = linhaDoId(sh, item.id);
  if (r > 0) sh.getRange(r, 1, 1, linha.length).setValues([linha]);
  else sh.appendRow(linha);
}

function removerItem(col, id) {
  const sh = aba(col), r = linhaDoId(sh, id);
  if (r > 0) sh.deleteRow(r);
}

function salvarAjustes(cfg) {
  const sh = abaAjustes();
  const linhas = Object.keys(cfg || {}).map(k => [k, cfg[k] === null || cfg[k] === undefined ? '' : String(cfg[k])]);
  const n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 1, n, 2).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, 2).setValues(linhas);
}

function apagarTudo() {
  ['rendas', 'gastos'].forEach(col => {
    const sh = aba(col), n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
  });
  const sh = abaAjustes(), n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 1, n, 2).clearContent();
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

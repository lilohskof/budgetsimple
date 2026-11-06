(function () {
'use strict';

/* ---------- Constantes (identiques à la version Flask) ---------- */
var KEY = 'budgetsimple.v1';
var FQ = {ponctuel: 'Ponctuel', hebdo: 'Hebdomadaire', bimensuel: 'Bimensuel', mensuel: 'Mensuel',
  trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel', personnalise: 'Personnalisé (mois par mois)'};
var FM = {hebdo: 52 / 12, bimensuel: 26 / 12, mensuel: 1, trimestriel: 1 / 3, semestriel: 1 / 6, annuel: 1 / 12};
var CATS = {
  rev: ['Salaire et autres revenus', 'Activité indépendante', 'Aides ou transferts familiaux', 'Loyers perçus', 'Autres revenus'],
  dep: ['Alimentation et ménage', 'Habillement', 'Frais financiers', 'Ameublement et équipement', 'Loisirs et culture',
    'Enfants', 'Transports', 'Impôts et taxes', 'Logement', 'Santé', 'Éducation', 'Autres']};
var MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
var MOIS3 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
var SYM = {MGA: 'Ar', EUR: '€', USD: '$'};
var COL = ['#1f9d6b', '#3b82f6', '#e08a1e', '#d64545', '#8b5cf6', '#14b8a6', '#ec4899', '#84cc16', '#f59e0b', '#6366f1', '#0ea5e9', '#94a3b8'];

/* ---------- Données (stockées dans le téléphone) ---------- */
var S;
function fresh() { return {v: 1, seq: 2, cur: 1, budgets: [{id: 1, name: 'Moi', currency: 'MGA'}], items: []}; }
function load() {
  try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.budgets && s.budgets.length && s.items) return s; } catch (e) {}
  return fresh();
}
var memoryOnly = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { if (!memoryOnly) { memoryOnly = true; toast('Stockage impossible : vos données ne seront pas conservées.'); } }
}
function nid() { return S.seq++; }
function cur() {
  for (var i = 0; i < S.budgets.length; i++) if (S.budgets[i].id === S.cur) return S.budgets[i];
  S.cur = S.budgets[0].id; return S.budgets[0];
}
function bitems(t) { var b = cur().id; return S.items.filter(function (i) { return i.bid === b && (!t || i.type === t); }); }

/* ---------- Calculs ---------- */
function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
function amounts(i) { var a = (i.amounts || []).slice(0, 12).map(Number); while (a.length < 12) a.push(0); return a; }
function monthly(i) {
  if (i.freq === 'personnalise') return sum(amounts(i)) / 12;
  var a = +i.amount;
  return i.freq === 'ponctuel' ? a / Math.max(1, i.months) : a * FM[i.freq];
}
function monthAmt(i, m) { return i.freq === 'personnalise' ? amounts(i)[m] : monthly(i); }
function money(n) {
  var r = Math.round(n); if (r === 0) r = 0;
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + ' ' + SYM[cur().currency];
}
function g(n) { return String(parseFloat((+n).toPrecision(10))); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }

/* ---------- Petits utilitaires d'interface ---------- */
var tt;
function toast(m) {
  var t = document.getElementById('toast'); t.textContent = m; t.style.display = 'block';
  clearTimeout(tt); tt = setTimeout(function () { t.style.display = 'none'; }, 3000);
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function route() {
  var h = location.hash.replace(/^#\/?/, ''), p = h.split('?');
  return {path: p[0] || 'results', q: new URLSearchParams(p[1] || '')};
}
function download(name, text, type) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: type}));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function today() { return new Date().toISOString().slice(0, 10); }

/* ---------- Écrans ---------- */
function vResults() {
  var items = bitems();
  var r = sum(items.filter(function (i) { return i.type === 'rev'; }).map(monthly));
  var d = sum(items.filter(function (i) { return i.type === 'dep'; }).map(monthly));
  var s = r - d, rate = r ? s / r * 100 : 0, color, msg;
  if (!items.length) { color = 'var(--mu)'; msg = 'Ajoutez vos revenus et dépenses pour commencer.'; }
  else if (s < 0) { color = 'var(--ko)'; msg = 'Vous êtes dans le rouge de ' + money(-s) + ' par mois.'; }
  else if (rate < 5) { color = 'var(--wa)'; msg = 'Votre budget est équilibré.'; }
  else { color = 'var(--ok)'; msg = 'Vous mettez de l’argent de côté.'; }
  var table = [], neg = [];
  for (var m = 0; m < 12; m++) {
    var rm = sum(items.filter(function (i) { return i.type === 'rev'; }).map(function (i) { return monthAmt(i, m); }));
    var dm = sum(items.filter(function (i) { return i.type === 'dep'; }).map(function (i) { return monthAmt(i, m); }));
    table.push([MOIS[m], rm, dm, rm - dm]); if (rm - dm < -0.5) neg.push(MOIS[m]);
  }
  var cats = {};
  items.forEach(function (i) { if (i.type === 'dep') cats[i.category] = (cats[i.category] || 0) + monthly(i); });
  var cl = Object.keys(cats).map(function (k) { return [k, cats[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  var mx = Math.max(r, d, 1), seg = [], acc = 0;
  cl.forEach(function (c, j) { var p = c[1] / d * 100; seg.push(COL[j % 12] + ' ' + acc.toFixed(2) + '% ' + (acc + p).toFixed(2) + '%'); acc += p; });
  var h = '<div class="st" style="background:' + color + '"><div style="opacity:.85">Solde mensuel moyen</div><div class="big">' + money(s) + '</div><div>' + esc(msg) + '</div>' +
    (neg.length ? '<div style="margin-top:6px">⚠ Mois en déficit : ' + neg.join(', ') + '</div>' : '') + '</div>';
  h += '<div class="card"><div class="row"><span>Revenus / mois</span><b>' + money(r) + '</b></div><div class="bar" style="width:' + (r / mx * 100) + '%;background:var(--ok)"></div>' +
    '<div class="row"><span>Dépenses / mois</span><b>' + money(d) + '</b></div><div class="bar" style="width:' + (d / mx * 100) + '%;background:var(--ko)"></div>' +
    '<div class="row"><span>Taux d’épargne</span><b>' + rate.toFixed(1).replace('.', ',') + ' %</b></div></div>';
  h += '<div class="card"><h2>Mois par mois</h2><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr class="mu"><th align="left">Mois</th><th align="right">Revenus</th><th align="right">Dépenses</th><th align="right">Solde</th></tr>';
  table.forEach(function (x) {
    h += '<tr style="border-top:1px solid var(--bd)"><td>' + x[0] + '</td><td align="right">' + money(x[1]) + '</td><td align="right">' + money(x[2]) + '</td><td align="right" style="font-weight:600;color:' + (x[3] < -0.5 ? 'var(--ko)' : 'var(--ok)') + '">' + money(x[3]) + '</td></tr>';
  });
  h += '<tr style="border-top:2px solid var(--bd);font-weight:700"><td>Année</td><td align="right">' + money(r * 12) + '</td><td align="right">' + money(d * 12) + '</td><td align="right">' + money(s * 12) + '</td></tr></table></div></div>';
  if (d > 0) {
    h += '<div class="card"><h2>Dépenses par catégorie</h2><div class="row"><div class="pie" style="background:conic-gradient(' + seg.join(', ') + ')"></div><div style="flex:1;font-size:14px">';
    cl.forEach(function (c, j) { h += '<div><span class="dot" style="background:' + COL[j % 12] + '"></span>' + esc(c[0]) + ' · ' + Math.round(c[1] / d * 100) + ' %</div>'; });
    h += '</div></div></div>';
  }
  return h + '<div class="row"><a class="btn" style="flex:1" href="#/rev">+ Revenu</a><a class="btn" style="flex:1" href="#/dep">+ Dépense</a></div>';
}

function vItems(t, q) {
  var eid = parseInt(q.get('edit'), 10), sort = q.get('s') === 'montant' ? 'montant' : 'id';
  var edit = eid ? bitems(t).filter(function (i) { return i.id === eid; })[0] : null;
  var rows = bitems(t);
  if (sort === 'montant') rows.sort(function (a, b) { return monthly(b) - monthly(a); });
  var total = sum(rows.map(monthly)), am = edit ? amounts(edit) : new Array(12).fill(0);
  var h = '<form data-form="item" data-t="' + t + '" class="card"><h2>' + (edit ? 'Modifier' : 'Ajouter') + ' ' + (t === 'rev' ? 'un revenu' : 'une dépense') + '</h2>';
  if (edit) h += '<input type="hidden" name="id" value="' + edit.id + '">';
  h += '<input name="label" placeholder="Intitulé (ex. Loyer)" value="' + (edit ? esc(edit.label) : '') + '" required>';
  h += '<input id="amt" name="amount" type="number" inputmode="decimal" min="0" step="any" placeholder="Montant" value="' + (edit && edit.freq !== 'personnalise' ? g(edit.amount) : '') + '">';
  h += '<select name="freq" id="freq" data-change="freq">';
  Object.keys(FQ).forEach(function (k) { h += '<option value="' + k + '"' + ((edit && edit.freq === k) || (!edit && k === 'mensuel') ? ' selected' : '') + '>' + FQ[k] + '</option>'; });
  h += '</select><div id="mw"><input name="months" type="number" min="1" placeholder="Si ponctuel : réparti sur combien de mois ?" value="' + (edit && edit.freq === 'ponctuel' ? edit.months : '') + '"></div>';
  h += '<div id="cust" style="display:none"><div class="mu" style="margin-bottom:6px">Montant de chaque mois (laissez vide si rien ce mois-là).</div><div class="grid">';
  for (var k = 0; k < 12; k++) h += '<label class="mu">' + MOIS[k] + '<input name="m' + k + '" type="number" inputmode="decimal" min="0" step="any" value="' + (am[k] ? g(am[k]) : '') + '"></label>';
  h += '</div></div><select name="category">';
  CATS[t].forEach(function (c) { h += '<option' + (edit && edit.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; });
  h += '</select>';
  if (t === 'dep') h += '<label class="c"><input type="checkbox" name="essential" value="1"' + (!edit || edit.essential ? ' checked' : '') + '> Dépense essentielle</label>';
  h += '<div class="row"><button style="flex:1">' + (edit ? 'Enregistrer' : 'Ajouter') + '</button>' + (edit ? '<a class="btn g" href="#/' + t + '">Annuler</a>' : '') + '</div></form>';
  h += '<div class="card"><div class="row"><h2>' + (t === 'rev' ? 'Mes revenus' : 'Mes dépenses') + '</h2><b>' + money(total) + ' / mois</b></div>';
  if (rows.length > 1) h += '<input data-input="search" type="search" placeholder="Rechercher…" style="margin-top:10px"><div class="row" style="justify-content:flex-start;margin-bottom:6px"><span class="mu">Trier :</span>' +
    '<a class="mu" href="#/' + t + '" style="' + (sort !== 'montant' ? 'font-weight:700;color:var(--ac)' : '') + '">récents</a><a class="mu" href="#/' + t + '?s=montant" style="' + (sort === 'montant' ? 'font-weight:700;color:var(--ac)' : '') + '">montant ↓</a></div>';
  if (!rows.length) h += '<div class="mu">Rien pour l’instant.</div>';
  rows.forEach(function (i) {
    h += '<div class="it" data-s="' + esc((i.label + ' ' + i.category).toLowerCase()) + '"><div class="row"><div><b>' + esc(i.label) + '</b><div class="mu">' + esc(i.category) + ' · ' + FQ[i.freq] +
      (t === 'dep' ? ' · ' + (i.essential ? 'essentielle' : 'non essentielle') : '') + '</div></div><div style="text-align:right">' +
      (i.freq === 'personnalise' ? '<b>' + money(monthly(i)) + '</b><div class="mu">moyenne / mois</div>' : '<b>' + money(+i.amount) + '</b><div class="mu">≈ ' + money(monthly(i)) + '/mois</div>') + '</div></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:6px"><a class="btn g" href="#/' + t + '?edit=' + i.id + '">Modifier</a><button class="g" data-act="dup" data-id="' + i.id + '">Dupliquer</button><button class="g" data-act="del" data-id="' + i.id + '">Supprimer</button></div></div>';
  });
  return h + '</div>';
}

function vAnalyse(q) {
  var t = q.get('t') === 'rev' ? 'rev' : 'dep';
  var all = bitems(), r = sum(all.filter(function (i) { return i.type === 'rev'; }).map(monthly));
  var rows = all.filter(function (i) { return i.type === t; });
  var total = sum(rows.map(monthly)), groups = {};
  rows.forEach(function (i) {
    var c = groups[i.category] = groups[i.category] || {name: i.category, v: 0, items: []};
    var v = monthly(i); c.v += v; c.items.push({label: i.label, v: v, freq: i.freq, essential: i.essential});
  });
  var cats = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.v - a.v; });
  var top = cats.length ? cats[0].v || 1 : 1;
  cats.forEach(function (c) { c.pct = total ? c.v / total * 100 : 0; c.rel = c.v / top * 100; c.items.sort(function (a, b) { return b.v - a.v; }); });
  var best = rows.map(function (i) { return {label: i.label, v: monthly(i), category: i.category}; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
  var months = [], mxm = 1;
  for (var m = 0; m < 12; m++) { var v = sum(rows.map(function (i) { return monthAmt(i, m); })); months.push([MOIS3[m], v]); if (v > mxm) mxm = v; }
  var ess = t === 'dep' ? sum(rows.filter(function (i) { return i.essential; }).map(monthly)) : 0, essPct = total ? ess / total * 100 : 0, share = r ? total / r * 100 : 0, tip = '';
  if (t === 'dep' && total) {
    if (r && total > r) tip = 'Vos dépenses dépassent vos revenus : repérez les postes non essentiels à réduire.';
    else if (cats[0].pct > 40) tip = '« ' + cats[0].name + ' » pèse plus de 40 % de vos dépenses : c’est là que l’effet d’une économie sera le plus fort.';
    else if (essPct < 100 && share > 90) tip = 'Peu de marge : essayez de garder au moins 10 % de vos revenus en épargne.';
  }
  if (t === 'rev' && total && cats[0].pct > 80) tip = Math.round(cats[0].pct) + ' % de vos revenus viennent d’une seule catégorie : une source de secours sécuriserait votre budget.';
  var h = '<div class="seg"><a class="' + (t === 'dep' ? 'on' : '') + '" href="#/analyse?t=dep">Où va l’argent</a><a class="' + (t === 'rev' ? 'on' : '') + '" href="#/analyse?t=rev">D’où vient l’argent</a></div>';
  h += '<div class="card"><div class="mu">' + (t === 'rev' ? 'Total des sources de revenus' : 'Total des dépenses') + '</div><div class="big">' + money(total) + ' <span class="mu">/ mois</span></div>' +
    '<div class="mu">' + money(total * 12) + ' par an · ' + rows.length + (t === 'rev' ? ' source(s)' : ' poste(s)') + '</div>' +
    (t === 'dep' && r && total ? '<div class="mu" style="margin-top:6px">Soit ' + Math.round(share) + ' % de vos revenus (' + money(r) + '/mois).</div>' : '') + '</div>';
  if (!rows.length) return h + '<div class="card"><div class="mu">Rien à analyser pour l’instant.</div><a class="btn" style="margin-top:10px" href="#/' + t + '">' + (t === 'rev' ? '+ Ajouter un revenu' : '+ Ajouter une dépense') + '</a></div>';
  if (tip) h += '<div class="card tip"><b>💡 À savoir</b><div class="mu" style="margin-top:4px">' + esc(tip) + '</div></div>';
  if (t === 'dep') h += '<div class="card"><h2>Essentiel ou non ?</h2><div class="split"><div style="width:' + essPct + '%;background:var(--ac)"></div><div style="flex:1;background:var(--wa)"></div></div>' +
    '<div class="row"><span><span class="dot" style="background:var(--ac)"></span>Essentielles</span><b>' + money(ess) + ' · ' + Math.round(essPct) + ' %</b></div>' +
    '<div class="row"><span><span class="dot" style="background:var(--wa)"></span>Non essentielles</span><b>' + money(total - ess) + ' · ' + Math.round(100 - essPct) + ' %</b></div></div>';
  h += '<div class="card"><h2>' + (t === 'rev' ? 'Par type de revenu' : 'Par catégorie') + '</h2><div class="mu" style="margin-bottom:4px">Touchez une ligne pour voir le détail.</div>';
  cats.forEach(function (c, j) {
    var col = COL[j % 12];
    h += '<details class="cat"><summary><div class="row"><span><span class="dot" style="background:' + col + '"></span>' + esc(c.name) + '</span><b>' + money(c.v) + '</b></div><div class="bar" style="width:' + c.rel + '%;background:' + col + ';margin-bottom:2px"></div><div class="mu">' + Math.round(c.pct) + ' % du total · ' + c.items.length + ' élément(s)</div></summary>';
    c.items.forEach(function (i) { h += '<div class="row it"><span>' + esc(i.label) + '<span class="mu"> · ' + FQ[i.freq] + (t === 'dep' && !i.essential ? ' · non essentielle' : '') + '</span></span><span>' + money(i.v) + '</span></div>'; });
    h += '</details>';
  });
  h += '</div><div class="card"><h2>' + (t === 'rev' ? 'Vos principales sources' : 'Vos plus grosses dépenses') + '</h2>';
  best.forEach(function (i, n) { h += '<div class="it row"><span><span class="rk">' + (n + 1) + '</span>' + esc(i.label) + '<span class="mu"> · ' + esc(i.category) + '</span></span><b>' + money(i.v) + '</b></div>'; });
  h += '</div><div class="card"><h2>Mois par mois</h2><div class="mchart">';
  months.forEach(function (x) { h += '<div class="mc"><div class="mcw"><div class="mcb" style="height:' + (x[1] / mxm * 100) + '%;background:' + (t === 'rev' ? 'var(--ok)' : 'var(--ko)') + '" title="' + money(x[1]) + '"></div></div>' + x[0] + '</div>'; });
  return h + '</div><div class="mu" style="margin-top:6px">Mois le plus chargé : ' + money(mxm) + '</div></div>';
}

function vBudgets() {
  var h = '<div class="card"><h2>Mes budgets</h2>', c = cur();
  S.budgets.forEach(function (b) {
    var n = S.items.filter(function (i) { return i.bid === b.id; }).length;
    h += '<div class="it row"><div><b>' + esc(b.name) + '</b><div class="mu">' + n + ' postes · ' + b.currency + '</div></div><div class="row">' +
      (b.id === c.id ? '<span class="mu">actif</span>' : '<button class="g" data-act="open" data-id="' + b.id + '">Ouvrir</button>') +
      '<button class="g" data-act="delb" data-id="' + b.id + '">✕</button></div></div>';
  });
  return h + '</div><form data-form="budget" class="card"><h2>Nouveau budget</h2><input name="name" placeholder="Nom (Famille, Voyage…)" required><button>Créer</button></form>';
}

var installEvt = null;
function vSettings() {
  var c = cur(), h = '<div class="card"><h2>Devise de ce budget</h2><select data-change="currency">';
  Object.keys(SYM).forEach(function (k) { h += '<option' + (c.currency === k ? ' selected' : '') + '>' + k + '</option>'; });
  h += '</select><div class="mu">Langue : français (malgache prévu plus tard).</div></div>';
  if (installEvt) h += '<div class="card"><h2>Application</h2><p class="mu">Installez BudgetSimple sur votre écran d’accueil.</p><button data-act="install">Installer l’application</button></div>';
  h += '<div class="card"><h2>Mes données</h2><p class="mu">Vos données sont enregistrées uniquement dans ce téléphone. Faites une sauvegarde de temps en temps : si vous effacez les données du navigateur, tout est perdu.</p>' +
    '<div class="row" style="flex-wrap:wrap;justify-content:flex-start;margin-bottom:8px"><button data-act="backup">Sauvegarder (fichier)</button><button class="g" data-act="restore">Restaurer</button></div>' +
    '<div class="row" style="flex-wrap:wrap;justify-content:flex-start"><button class="g" data-act="csv">Exporter en CSV</button><button class="g" data-act="icsv">Importer un CSV</button></div>' +
    '<input type="file" id="f-restore" data-file="restore" accept=".json,application/json" class="hide"><input type="file" id="f-csv" data-file="csv" accept=".csv,text/csv,text/plain" class="hide"></div>';
  h += '<div class="card"><h2>Aide</h2><p class="mu">Saisissez chaque revenu et chaque dépense avec sa fréquence : l’application calcule la moyenne par mois. Un solde positif signifie que vous pouvez épargner. Aucune donnée bancaire n’est demandée ; tout reste dans votre téléphone et fonctionne sans connexion.</p></div>';
  return h + '<div class="card"><h2>Confidentialité</h2><button class="d" data-act="wipe">Effacer toutes mes données</button></div>';
}

/* ---------- Affichage ---------- */
function render() {
  var r = route(), p = r.path, h;
  if (p === 'rev' || p === 'dep') h = vItems(p, r.q);
  else if (p === 'analyse') h = vAnalyse(r.q);
  else if (p === 'budgets') h = vBudgets();
  else if (p === 'settings') h = vSettings();
  else { p = 'results'; h = vResults(); }
  document.getElementById('ttl').textContent = 'BudgetSimple MG · ' + cur().name;
  document.getElementById('app').innerHTML = h;
  var tabs = [['results', 'Résultats', '#/'], ['rev', 'Revenus', '#/rev'], ['dep', 'Dépenses', '#/dep'], ['analyse', 'Analyse', '#/analyse'], ['budgets', 'Budgets', '#/budgets'], ['settings', 'Réglages', '#/settings']];
  document.getElementById('nav').innerHTML = tabs.map(function (x) { return '<a href="' + x[2] + '" class="' + (x[0] === p ? 'on' : '') + '">' + x[1] + '</a>'; }).join('');
  syncFreq();
  window.scrollTo(0, 0);
}
function syncFreq() {
  var fr = document.getElementById('freq'); if (!fr) return;
  var v = fr.value, a = document.getElementById('amt');
  document.getElementById('cust').style.display = v === 'personnalise' ? 'block' : 'none';
  document.getElementById('mw').style.display = v === 'ponctuel' ? 'block' : 'none';
  a.style.display = v === 'personnalise' ? 'none' : 'block'; a.required = v !== 'personnalise';
}

/* ---------- Actions ---------- */
function saveItem(form) {
  var f = new FormData(form), t = form.dataset.t, label = (f.get('label') || '').trim(), freq = f.get('freq'), cat = f.get('category');
  var m = Math.max(1, parseInt(f.get('months'), 10) || 1), a, am = [], k;
  if (freq === 'personnalise') {
    for (k = 0; k < 12; k++) { var v = parseFloat(f.get('m' + k)) || 0; am.push(Math.max(0, v)); }
    a = sum(am) / 12;
  } else { a = parseFloat(f.get('amount')); if (isNaN(a)) a = -1; }
  if (!label || a < 0 || !FQ[freq] || CATS[t].indexOf(cat) < 0) { toast('Saisissez un intitulé et des montants positifs.'); return; }
  var ess = t === 'rev' || f.get('essential') ? 1 : 0, id = parseInt(f.get('id'), 10), it = id ? bitems(t).filter(function (i) { return i.id === id; })[0] : null;
  if (it) { it.label = label; it.amount = a; it.freq = freq; it.months = m; it.category = cat; it.essential = ess; it.amounts = am; }
  else S.items.push({id: nid(), bid: cur().id, type: t, label: label, amount: a, freq: freq, months: m, category: cat, essential: ess, amounts: am});
  save(); go('#/' + t);
}
function csvCell(v) { v = String(v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function exportCsv() {
  var lines = [['Type', 'Intitulé', 'Catégorie', 'Fréquence', 'Montant saisi', 'Moyenne par mois', 'Essentielle']];
  bitems().sort(function (a, b) { return a.type < b.type ? 1 : a.type > b.type ? -1 : a.id - b.id; }).forEach(function (i) {
    lines.push([i.type === 'rev' ? 'Revenu' : 'Dépense', i.label, i.category, FQ[i.freq], g(Math.round(i.amount * 100) / 100), monthly(i).toFixed(2).replace('.', ','), i.essential ? 'oui' : 'non']);
  });
  var name = cur().name.replace(/[^\w\u00C0-\u017F]+/g, '') || 'budget';
  download(name + '-' + today() + '.csv', '\ufeff' + lines.map(function (l) { return l.map(csvCell).join(';'); }).join('\r\n'), 'text/csv;charset=utf-8');
}
function parseCsv(text) {
  text = text.replace(/^\ufeff/, ''); var rows = [], row = [], cell = '', q = false, i, c;
  for (i = 0; i < text.length; i++) {
    c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ';') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}
function importCsv(text) {
  var rows = parseCsv(text), rev = {}, n = 0;
  Object.keys(FQ).forEach(function (k) { rev[FQ[k]] = k; });
  if (!rows.length || rows[0][0] !== 'Type') { toast('Fichier CSV non reconnu (export BudgetSimple attendu).'); return; }
  var add = [];
  rows.slice(1).forEach(function (r) {
    if (r.length < 6) return;
    var t = r[0] === 'Revenu' ? 'rev' : r[0] === 'Dépense' ? 'dep' : null, freq = rev[r[3]];
    var a = parseFloat(String(r[4]).replace(',', '.')), avg = parseFloat(String(r[5]).replace(',', '.'));
    if (!t || !freq || isNaN(a) || a < 0 || !r[1].trim()) return;
    var it = {id: 0, bid: cur().id, type: t, label: r[1].trim(), amount: a, freq: freq, months: 1,
      category: CATS[t].indexOf(r[2]) >= 0 ? r[2] : CATS[t][CATS[t].length - 1], essential: t === 'rev' || r[6] !== 'non' ? 1 : 0, amounts: []};
    if (freq === 'ponctuel' && avg > 0) it.months = Math.max(1, Math.round(a / avg));
    if (freq === 'personnalise') { it.amounts = new Array(12).fill(isNaN(avg) ? a : avg); }
    add.push(it);
  });
  if (!add.length) { toast('Aucune ligne valide trouvée.'); return; }
  if (!confirm('Ajouter ' + add.length + ' élément(s) au budget « ' + cur().name + ' » ?' + (add.some(function (x) { return x.freq === 'personnalise'; }) ? '\nLes postes « personnalisés » seront répartis à égalité sur 12 mois.' : ''))) return;
  add.forEach(function (it) { it.id = nid(); S.items.push(it); n++; });
  save(); toast(n + ' élément(s) importé(s).'); render();
}
function restore(text) {
  var d; try { d = JSON.parse(text); } catch (e) {}
  if (!d || !Array.isArray(d.budgets) || !d.budgets.length || !Array.isArray(d.items)) { toast('Fichier de sauvegarde invalide.'); return; }
  if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
  S = d; S.v = 1; S.seq = Math.max.apply(null, [1].concat(d.budgets.map(function (b) { return b.id; }), d.items.map(function (i) { return i.id; }))) + 1;
  S.cur = d.cur || d.budgets[0].id; save(); toast('Sauvegarde restaurée.'); go('#/'); render();
}

document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el) return;
  var a = el.dataset.act, id = parseInt(el.dataset.id, 10), it;
  if (a === 'del') { if (confirm('Supprimer cet élément ?')) { S.items = S.items.filter(function (i) { return i.id !== id; }); save(); render(); } }
  else if (a === 'dup') {
    it = S.items.filter(function (i) { return i.id === id; })[0]; if (!it) return;
    var c = JSON.parse(JSON.stringify(it)); c.id = nid(); c.label = c.label.slice(0, 140) + ' (copie)'; S.items.push(c); save();
    toast('Élément dupliqué : modifiez la copie.'); go('#/' + c.type + '?edit=' + c.id);
  }
  else if (a === 'open') { S.cur = id; save(); go('#/'); }
  else if (a === 'delb') {
    if (S.budgets.length < 2) { toast('Gardez au moins un budget.'); return; }
    if (!confirm('Supprimer ce budget et toutes ses données ?')) return;
    S.budgets = S.budgets.filter(function (b) { return b.id !== id; }); S.items = S.items.filter(function (i) { return i.bid !== id; });
    if (S.cur === id) S.cur = S.budgets[0].id; save(); render();
  }
  else if (a === 'wipe') { if (confirm('Effacer définitivement toutes vos données ?')) { S = fresh(); save(); go('#/'); render(); } }
  else if (a === 'csv') exportCsv();
  else if (a === 'backup') { download('budgetsimple-sauvegarde-' + today() + '.json', JSON.stringify(S), 'application/json'); toast('Sauvegarde téléchargée.'); }
  else if (a === 'restore') document.getElementById('f-restore').click();
  else if (a === 'icsv') document.getElementById('f-csv').click();
  else if (a === 'install' && installEvt) { installEvt.prompt(); installEvt = null; render(); }
});
document.addEventListener('submit', function (e) {
  var f = e.target; if (!f.dataset.form) return; e.preventDefault();
  if (f.dataset.form === 'item') saveItem(f);
  else if (f.dataset.form === 'budget') {
    var name = (new FormData(f).get('name') || '').trim(); if (!name) return;
    var b = {id: nid(), name: name, currency: cur().currency}; S.budgets.push(b); S.cur = b.id; save(); go('#/');
  }
});
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.dataset.change === 'freq') syncFreq();
  else if (t.dataset.change === 'currency' && SYM[t.value]) { cur().currency = t.value; save(); render(); }
  else if (t.dataset.file && t.files && t.files[0]) {
    var kind = t.dataset.file, rd = new FileReader();
    rd.onload = function () { if (kind === 'csv') importCsv(String(rd.result)); else restore(String(rd.result)); };
    rd.readAsText(t.files[0]); t.value = '';
  }
});
document.addEventListener('input', function (e) {
  if (e.target.dataset.input !== 'search') return;
  var v = e.target.value.toLowerCase();
  document.querySelectorAll('.it[data-s]').forEach(function (el) { el.style.display = el.dataset.s.indexOf(v) > -1 ? '' : 'none'; });
});
window.addEventListener('hashchange', render);
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (route().path === 'settings') render(); });
window.addEventListener('appinstalled', function () { installEvt = null; });

S = load(); render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();

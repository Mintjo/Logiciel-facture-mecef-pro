// Test du parser CORRIGÉ avec parseNum amélioré
const txt = `Facture # EM014573298
Date: 30/03/2026
Vendeur: SFE en ligne
FACTURE DE VENTEDASSABLIGA IBOUNOU ABAS
I F U : 0 2 0 1 8 1 0 2 0 0 0 5 0
OBJET : TRANSPORT DE COTON GRAINE CHAMPAGNE 2025 2026
BON N ° : 0207/018/26
COMMUNE DESSERVIE : TANGUIETA
# Nom Prix unitaire Quantité Montant T.T.C.
1 Transport de coton graine 3.587.622 1 3.587.622 [E]
RÉPARTITION DES PAIEMENTS
Type de paiement Payé
CHEQUES 3.587.622
Arrêté la présente facture à la somme de trois million cinq cent quatrevingtsept mille six cent vingtdeux francs CFA TTC
ELÉMENTS DE SÉCURITÉ DE LA FACTURE NORMALISÉE
Code MECeF/DGI
Z4PSCM2GJLGGKMC5MND6GXZT
MECeF NIM: EM01457329
MECeF Compteurs: 8/9 FV
MECeF Heure: 30/03/2026 16:48:38
Adresse TANGUIETA
TANGUIETA
TANGUIETA
Contact 95727228
KEHEF99885@OTEMDI.COM
VMCF EM01457329
CLIENT
Nom LE LABEL COTON DU
BENIN SA
IFU 3200700051010
Adresse SEPOUNGA TANGUIETA
Contact
VENTILATION DES IMPÔTS
Groupe Total Imposable Impôt
E TPS 3.587.622
T o t a l : 3 . 5 8 7 . 6 2 2`;

// parseNum CORRIGÉ
function parseNum(s) {
  let v = String(s).replace(/\s/g, '');
  if ((v.match(/\./g) || []).length > 1) v = v.replace(/\./g, '');
  else if (/^\d+\.\d{3}$/.test(v)) v = v.replace('.', '');
  v = v.replace(/,/g, '.');
  return parseFloat(v) || 0;
}

// tests parseNum
console.log('=== TESTS PARSENUM ===');
console.log('3.587.622 →', parseNum('3.587.622'), '(attendu: 3587622)');
console.log('3.587 →', parseNum('3.587'), '(attendu: 3587)');
console.log('25.500 →', parseNum('25.500'), '(attendu: 25500)');
console.log('1.234.567 →', parseNum('1.234.567'), '(attendu: 1234567)');
console.log('12,5 →', parseNum('12,5'), '(attendu: 12.5)');
console.log('100 →', parseNum('100'), '(attendu: 100)');
console.log('3 . 5 8 7 . 6 2 2 →', parseNum('3 . 5 8 7 . 6 2 2'), '(attendu: 3587622)');

function parseMECeF(txt) {
  const t = txt.replace(/\r/g, '');
  const facture = {
    numero:'',date:'',vendeur:'',
    client:{nom:'',ifu:'',adresse:'',contact:''},
    articles:[],totalTTC:0,paiements:[],arreteEnLettres:'',aib:null,
    mecef:{code:'',nim:'',compteurs:'',heure:''}
  };
  let m;
  m = t.match(/Facture\s*#\s*:?\s*([^\n]+)/i); if (m) facture.numero = m[1].trim();
  m = t.match(/Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i); if (m) facture.date = m[1].trim();
  m = t.match(/Vendeur\s*:\s*([^\n]+)/i); if (m) facture.vendeur = m[1].trim();
  const cb = t.match(/CLIENT[\s\S]*?(?=VENTILATION|IMPÔT|$)/i);
  if (cb) {
    const cs = cb[0];
    m = cs.match(/Nom\s+([^\n]+(?:\n[A-Z][^\n]*)?)/i); if (m) facture.client.nom = m[1].replace(/\n/g,' ').trim();
    m = cs.match(/IFU\s+(\d[\d\s]*\d)/i); if (m) facture.client.ifu = m[1].replace(/\s/g,'').trim();
    m = cs.match(/Adresse\s+([^\n]+)/i); if (m) facture.client.adresse = m[1].trim();
  }
  // ARTICLES
  const ab = t.match(/(?:#\s*Nom|Montant\s*T\.?T\.?C\.?)[\s\S]*?(?=RÉPARTITION|REPARTITION|PAIEMENT|Arrêt|VENTILATION|$)/i);
  if (ab) {
    const lines = ab[0].split('\n').filter(l=>l.trim());
    for (let i=1;i<lines.length;i++) {
      const l = lines[i].trim();
      if (/^#\s*Nom|RÉPARTITION/i.test(l)) continue;
      let ap = l.match(/^(\d+)\s+(.+?)\s+([\d.,]+(?:\.\d{3})*)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+(?:\.\d{3})*)\s*\[([A-Z])\]\s*$/);
      if (ap) { facture.articles.push({designation:ap[2].trim(),prixUnitaire:parseNum(ap[3]),quantite:parseFloat(ap[4]),montantTTC:parseNum(ap[5])}); continue; }
      ap = l.match(/^(\d+)\s+(.+?)\s+([\d.,]+(?:\.\d{3})*)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+(?:\.\d{3})*)$/);
      if (ap) { facture.articles.push({designation:ap[2].trim(),prixUnitaire:parseNum(ap[3]),quantite:parseFloat(ap[4]),montantTTC:parseNum(ap[5])}); }
    }
  }
  // TOTAL
  m = t.match(/Total\s*TTC\s*:?\s*([\d\s.,]+)/i); if (m) facture.totalTTC = parseNum(m[1]);
  if (!facture.totalTTC) { m = t.match(/T\s*o\s*t\s*a\s*l\s*:?\s*([\d\s.,]+)/i); if (m) facture.totalTTC = parseNum(m[1]); }
  if (!facture.totalTTC && facture.articles.length) facture.totalTTC = facture.articles.reduce((s,a)=>s+a.montantTTC,0);
  // PAIEMENTS
  const pb = t.match(/(?:PAIEMENT|RÉPARTITION|REPARTITION)[\s\S]*?(?=Arrêt|ÉLÉMENTS|ELEMENTS|Code\s*MECeF|$)/i);
  if (pb) { pb[0].split('\n').forEach(l => { const pm = l.match(/(ESP[ÈE]CES?|CHEQUES?|CH[ÈE]QUES?|CARTE|VIREMENT|COMPTANT)\s+([\d\s.,]+)/i); if (pm) facture.paiements.push({type:pm[1].trim().toUpperCase(),montant:parseNum(pm[2])}); }); }
  // ARRÊTÉ
  m = t.match(/Arrêt[ée]e?\s+la\s+pr[ée]sente\s+facture\s+[àa]\s+la\s+somme\s+de\s+(.+?)(?:\s+francs?\s+CFA\s+TTC|\s+TTC|$)/i);
  if (m) facture.arreteEnLettres = m[1].trim();
  // MECEF
  m = t.match(/([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/);
  if (m) facture.mecef.code = m[1];
  else { m = t.match(/Code\s*MECeF\s*\/?\s*DGI\s*:?\s*\n?\s*([A-Z0-9]{16,})/i); if (m) facture.mecef.code = m[1]; }
  m = t.match(/NIM\s*:?\s*([A-Z]{2}\d+)/i); if (m) facture.mecef.nim = m[1];
  m = t.match(/Compteurs?\s*:?\s*([\d]+\s*\/\s*[\d]+\s*FV)/i); if (m) facture.mecef.compteurs = m[1];
  m = t.match(/Heure\s*:?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i); if (m) facture.mecef.heure = m[1];
  return facture;
}

const r = parseMECeF(txt);
console.log('\n=== RÉSULTAT CORRIGÉ ===');
console.log('Articles:', r.articles.map(a => `${a.designation} PU:${a.prixUnitaire} Qty:${a.quantite} TTC:${a.montantTTC}`));
console.log('Total TTC:', r.totalTTC);
console.log('Paiements:', r.paiements);
console.log('MECeF code:', r.mecef.code);
console.log('Client:', r.client.nom, '- IFU:', r.client.ifu);
console.log('Arrêté:', r.arreteEnLettres);

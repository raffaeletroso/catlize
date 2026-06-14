export const COLLECTIONS = [
  { id:'dischi',  name:'Dischi',             short:'Dischi',  singular:'disco',   icon:'disc', capture:'barcode' },
  { id:'fumetti', name:'Fumetti',            short:'Fumetti', singular:'fumetto', icon:'book', capture:'photo' },
  { id:'schede',  name:'Schede telefoniche', short:'Schede',  singular:'scheda',  icon:'card', capture:'photo' },
  { id:'altro',   name:'Altro',              short:'Altro',   singular:'oggetto', icon:'box',  capture:'photo' },
];
export const COL = Object.fromEntries(COLLECTIONS.map(c => [c.id, c]));

export const FIELD_SCHEMA = {
  dischi: [
    { key:'artista',   label:'Artista',  type:'text' },
    { key:'titolo',    label:'Titolo',   type:'text' },
    { row:true, fields:[
      { key:'anno',    label:'Anno',     type:'text' },
      { key:'formato', label:'Formato',  type:'select', options:['LP','CD','45 giri','EP','Musicassetta'] },
    ]},
    { key:'etichetta', label:'Etichetta',type:'text' },
  ],
  fumetti: [
    { key:'testata',   label:'Testata',  type:'text' },
    { row:true, fields:[
      { key:'numero',  label:'Numero',   type:'text' },
      { key:'anno',    label:'Anno',     type:'text' },
    ]},
    { key:'editore',   label:'Editore',  type:'text' },
  ],
  schede: [
    { key:'serie',     label:'Serie / Titolo', type:'text' },
    { key:'ente',      label:'Ente emittente', type:'select', options:['SIP','Telecom Italia','TIM','Iritel','Altro'] },
    { row:true, fields:[
      { key:'anno',    label:'Anno',     type:'text' },
      { key:'taglio',  label:'Taglio',   type:'select', options:['L. 5.000','L. 10.000','L. 15.000','L. 50.000','€ 2,50','€ 5'] },
    ]},
  ],
  altro: [
    { key:'titolo',      label:'Titolo', type:'text' },
    { key:'descrizione', label:'Descrizione / Note', type:'textarea' },
  ],
};

export const IMAGE_SLOTS = {
  dischi:  [{ key:'cover',  label:'copertina' }],
  fumetti: [{ key:'cover',  label:'copertina' }],
  schede:  [{ key:'fronte', label:'fronte' }, { key:'retro', label:'retro' }],
  altro:   [{ key:'image',  label:'immagine' }],
};

export const CARD_FIELDS = {
  dischi:  { title:it => it.titolo, sub:it => [it.artista, it.anno], thumb:'copertina' },
  fumetti: { title:it => `${it.testata}${it.numero ? ' n. ' + it.numero : ''}`, sub:it => [it.editore, it.anno], thumb:'copertina' },
  schede:  { title:it => it.serie, sub:it => [it.ente, it.taglio], thumb:'fronte' },
  altro:   { title:it => it.titolo, sub:it => [it.descrizione], thumb:'immagine' },
};

let __id = 100;
export const nid = () => 'i' + (++__id);

const mk = (collection, n, f) => ({ id: 'i' + n, collection, ...f });

export const SEED_ITEMS = [
  mk('dischi', 1, { artista:'Pink Floyd', titolo:'The Dark Side of the Moon', anno:'1973', etichetta:'Harvest', formato:'LP' }),
  mk('dischi', 2, { artista:'Fleetwood Mac', titolo:'Rumours', anno:'1977', etichetta:'Warner Bros.', formato:'LP' }),
  mk('dischi', 3, { artista:'Miles Davis', titolo:'Kind of Blue', anno:'1959', etichetta:'Columbia', formato:'LP' }),
  mk('dischi', 4, { artista:'Franco Battiato', titolo:'La voce del padrone', anno:'1981', etichetta:'EMI', formato:'LP' }),
  mk('dischi', 5, { artista:'Nirvana', titolo:'Nevermind', anno:'1991', etichetta:'DGC', formato:'CD' }),
  mk('dischi', 6, { artista:'Lucio Battisti', titolo:'Il mio canto libero', anno:'1972', etichetta:'Numero Uno', formato:'LP' }),
  mk('dischi', 7, { artista:'Radiohead', titolo:'OK Computer', anno:'1997', etichetta:'Parlophone', formato:'CD' }),
  mk('dischi', 8, { artista:'The Beatles', titolo:'Help!', anno:'1965', etichetta:'Parlophone', formato:'45 giri' }),
  mk('fumetti', 11, { testata:'Dylan Dog', numero:'1', editore:'Sergio Bonelli Editore', anno:'1986' }),
  mk('fumetti', 12, { testata:'Tex', numero:'1', editore:'Sergio Bonelli Editore', anno:'1948' }),
  mk('fumetti', 13, { testata:'Diabolik', numero:'1', editore:'Astorina', anno:'1962' }),
  mk('fumetti', 14, { testata:'Zagor', numero:'1', editore:'Sergio Bonelli Editore', anno:'1961' }),
  mk('fumetti', 15, { testata:'Nathan Never', numero:'1', editore:'Sergio Bonelli Editore', anno:'1991' }),
  mk('fumetti', 16, { testata:'Martin Mystère', numero:'1', editore:'Sergio Bonelli Editore', anno:'1982' }),
  mk('schede', 21, { serie:'Colombo ’92', ente:'SIP', anno:'1992', taglio:'L. 10.000' }),
  mk('schede', 22, { serie:'Telefono Azzurro', ente:'Telecom Italia', anno:'1995', taglio:'L. 5.000' }),
  mk('schede', 23, { serie:'Italia ’90 — Mondiali', ente:'SIP', anno:'1990', taglio:'L. 5.000' }),
  mk('schede', 24, { serie:'Pininfarina', ente:'Telecom Italia', anno:'1996', taglio:'L. 10.000' }),
  mk('schede', 25, { serie:'Galileo Galilei', ente:'SIP', anno:'1994', taglio:'L. 15.000' }),
  mk('altro', 31, { titolo:'500 Lire d’argento 1958', descrizione:'Moneta caravelle, prima emissione.' }),
  mk('altro', 32, { titolo:'Figurina Panini — Italia ’90', descrizione:'Album mondiali, calciatore n. 142.' }),
  mk('altro', 33, { titolo:'Action figure — robot anni ’80', descrizione:'Diecast, scatola originale.' }),
];

const LOOKUP = {
  dischi: [
    { artista:'The Beatles', titolo:'Abbey Road', anno:'1969', etichetta:'Apple Records', formato:'LP' },
    { artista:'Daft Punk', titolo:'Random Access Memories', anno:'2013', etichetta:'Columbia', formato:'CD' },
    { artista:'Vasco Rossi', titolo:'Bollicine', anno:'1983', etichetta:'Carosello', formato:'LP' },
    { artista:'Bruce Springsteen', titolo:'Born to Run', anno:'1975', etichetta:'Columbia', formato:'LP' },
  ],
  fumetti: [
    { testata:'Corto Maltese', numero:'1', editore:'Rizzoli Lizard', anno:'1967' },
    { testata:'Topolino', numero:'1', editore:'Mondadori', anno:'1949' },
    { testata:'Ken Parker', numero:'1', editore:'Cepim', anno:'1977' },
  ],
  schede: [
    { serie:'Capodanno ’93', ente:'SIP', anno:'1993', taglio:'L. 10.000' },
    { serie:'Euro 2002', ente:'TIM', anno:'2002', taglio:'€ 5' },
  ],
  altro: [
    { titolo:'Oggetto da catalogare', descrizione:'' },
  ],
};

export function recognise(collectionId) {
  const pool = LOOKUP[collectionId] || LOOKUP.altro;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { id: nid(), collection: collectionId, ...pick, _new: true };
}

export function itemTitle(it) {
  const t = CARD_FIELDS[it.collection].title(it);
  return (t && String(t).trim()) || 'Senza titolo';
}
export function itemSubs(it) {
  return CARD_FIELDS[it.collection].sub(it).filter(Boolean);
}
export function thumbLabel(collectionId) {
  return CARD_FIELDS[collectionId].thumb;
}

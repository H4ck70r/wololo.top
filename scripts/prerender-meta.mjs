// Escribe un HTML de verdad por cada pagina estatica, con su <head> puesto.
//
// Por que hace falta: el sitio es una SPA, asi que el <head> real lo pone
// Helmet al ejecutar JavaScript. Google lo ejecuta, pero Discord, WhatsApp,
// Twitter y Slack NO: a ellos les llega el index.html pelado y un enlace a
// /manual se previsualiza con el titulo de la portada.
//
// Las rutas dinamicas (/player, /match, /clan, /h2h) ya estaban resueltas: el
// .htaccess manda esos crawlers al renderizador de la API. Lo que faltaba eran
// las paginas fijas, que no necesitan datos y se pueden escribir al compilar.
//
// Como se sirve: cada pagina se escribe como <ruta>.html en la raiz, y una
// regla del .htaccess sirve /manual desde manual.html. Se probo antes con
// dist/manual/index.html y no vale: Apache redirige /manual a /manual/ con un
// 301, asi que la URL canonica -sin barra- acababa redirigiendo a otra.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITIO = 'https://wololo.top';
const IMAGEN = `${SITIO}/og-image.jpg`;
const DIST = 'dist';

//  Los textos son los MISMOS que pone Helmet en cada pagina. Si se cambian
//  alli, hay que cambiarlos aqui: lo que ve el crawler y lo que ve el
//  navegador tienen que decir lo mismo, o es contenido distinto por visitante.
const PAGINAS = [
  { ruta: '/', titulo: 'wololo.top - Age of Empires II Player Stats & Analytics',
    desc: 'Search any AOE2 DE player by name, Steam ID, or profile ID. Track ratings, match history, civilization stats, rivals, and activity patterns.' },
  { ruta: '/leaderboard', titulo: 'Leaderboard - wololo.top',
    desc: 'Age of Empires II DE ranked leaderboard. Browse top players by rating, filter by country, clan, or rating range.' },
  { ruta: '/stats', titulo: 'Civilization Meta - wololo.top',
    desc: 'AOE2 DE civilization win rates and tier list. See which civs dominate at every ELO bracket.' },
  { ruta: '/compare', titulo: 'Compare players - wololo.top',
    desc: 'Compare any two AOE2 DE players side by side. Ratings, win rates, civ preferences, and head-to-head records.' },
  { ruta: '/live', titulo: 'Live Matches - wololo.top',
    desc: 'Age of Empires II matches happening right now. Watch live games and see who is playing.' },
  { ruta: '/analyze', titulo: 'Analyze a replay - wololo.top',
    desc: 'Upload an Age of Empires II DE replay and see your opening, age times, villagers and idle time measured against players at your rating.' },
  { ruta: '/overlay', titulo: 'Live overlay for Age of Empires II - wololo.top',
    desc: 'Free AOE2 DE overlay that measures your game while you play it and compares your opening, age times and villagers against players at your rating. Windows and Linux.' },
  { ruta: '/manual', titulo: 'How to use wololo-live - wololo.top',
    desc: 'Step by step guide to the wololo-live overlay for Age of Empires II: how to start it, what each number means, how to put it in OBS, and what to do when something does not work.' },
];

const escapar = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function cabecera({ ruta, titulo, desc }) {
  const url = ruta === '/' ? SITIO : SITIO + ruta;
  const t = escapar(titulo);
  const d = escapar(desc);
  return [
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${IMAGEN}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${IMAGEN}" />`,
  ].map((l) => '    ' + l).join('\n');
}

const base = await readFile(join(DIST, 'index.html'), 'utf8');
if (!base.includes('</head>')) throw new Error('dist/index.html no tiene </head>');

for (const pagina of PAGINAS) {
  let html = base.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(pagina.titulo)}</title>`);
  html = html.replace('</head>', cabecera(pagina) + '\n  </head>');
  const nombre = pagina.ruta === '/' ? 'index.html' : `${pagina.ruta.slice(1)}.html`;
  await writeFile(join(DIST, nombre), html);
}
console.log(`cabeceras escritas: ${PAGINAS.length} paginas`);

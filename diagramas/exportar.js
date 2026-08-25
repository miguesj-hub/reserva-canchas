// Exporta a SVG todas las vistas de una instancia de Structurizr Lite.
//
// structurizr-cli no sirve para esto: exporta a plantuml, mermaid, dot o json,
// pero no rasteriza. El único camino a SVG es el «scripting API» que Structurizr
// expone dentro del navegador, así que hay que conducir un navegador de verdad.
// Este script hace lo mismo que el oficial structurizr/puppeteer, pero con el
// Chrome ya instalado en el sistema (puppeteer-core no descarga Chromium).
//
//   node exportar.js [url] [directorio-de-salida]
//
// Deja <ClaveDeVista>.svg y <ClaveDeVista>-key.svg (la leyenda) por cada vista.
// La conversión a PDF y el renombrado a nombres de figura los hace «make
// diagramas»; aquí sólo se exporta.

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const url = (process.argv[2] || 'http://localhost:8081').replace(/\/$/, '');
const outDir = process.argv[3] || __dirname;

// Rutas habituales del Chrome del sistema, de más a menos probable en macOS.
const CANDIDATOS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  process.env.CHROME_PATH,
].filter(Boolean);

function buscarChrome() {
  const encontrado = CANDIDATOS.find(p => fs.existsSync(p));
  if (!encontrado) {
    throw new Error(
      'No encontré un navegador basado en Chrome. Instala Google Chrome o ' +
      'define CHROME_PATH con la ruta al ejecutable.');
  }
  return encontrado;
}

// La ruta del visor cambió entre versiones: structurizr/structurizr:local
// sirve en /workspace/1/diagrams, mientras que el structurizr-lite.war antiguo
// lo hacía en /workspace/diagrams. Se prueban las dos en vez de fijar una, para
// que el script funcione con cualquiera de los dos visores.
const RUTAS_VISOR = ['/workspace/1/diagrams', '/workspace/diagrams'];

async function rutaDelVisor() {
  const fallos = [];
  for (const ruta of RUTAS_VISOR) {
    try {
      const r = await fetch(url + ruta, { redirect: 'follow' });
      if (r.ok) return ruta;
      fallos.push(ruta + ' -> HTTP ' + r.status);
    } catch (e) {
      fallos.push(ruta + ' -> ' + e.message);
    }
  }
  throw new Error(
    'No hay un Structurizr respondiendo en ' + url + ':\n  ' + fallos.join('\n  ') + '\n' +
    'Levántalo apuntando a este directorio, por ejemplo:\n' +
    '  docker run -d -p 8099:8080 -v "$PWD:/usr/local/structurizr" structurizr/structurizr local');
}

(async () => {
  // Aviso temprano y claro: sin visor escuchando, el resto no tiene sentido.
  const rutaVisor = await rutaDelVisor();

  const browser = await puppeteer.launch({
    executablePath: buscarChrome(),
    headless: 'new',
    userDataDir: path.join(__dirname, '.chrome-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    // Structurizr obedece prefers-color-scheme y Chrome headless dice «dark»:
    // sin esto los diagramas salen con fondo #111111 y las etiquetas de
    // relación dentro de un recuadro negro.
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

    const listo = 'typeof structurizr !== "undefined" && structurizr.scripting ' +
                  '&& structurizr.scripting.isDiagramRendered() === true';

    await page.goto(url + rutaVisor, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction(listo, { timeout: 60000 });

    const vistas = await page.evaluate(() => structurizr.scripting.getViews());
    console.log(vistas.length + ' vistas: ' + vistas.map(v => v.key).join(', '));

    for (const vista of vistas) {
      await page.goto(url + rutaVisor + '#' + vista.key, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForFunction(listo, { timeout: 60000 });

      const svg = await page.evaluate(() => structurizr.scripting.exportCurrentDiagramToSVG({ includeMetadata: true }));
      fs.writeFileSync(path.join(outDir, vista.key + '.svg'), svg);

      const leyenda = await page.evaluate(() => structurizr.scripting.exportCurrentDiagramKeyToSVG());
      fs.writeFileSync(path.join(outDir, vista.key + '-key.svg'), leyenda);

      console.log('  ' + vista.key + '.svg + ' + vista.key + '-key.svg');
    }
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('\nExportación fallida: ' + e.message);
  process.exit(1);
});

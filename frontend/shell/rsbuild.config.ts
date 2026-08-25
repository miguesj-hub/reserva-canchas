import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// En desarrollo cada remote responde en su propio puerto; en producción todos
// cuelgan del mismo origen, detrás del edge. Las variables las inyecta
// docker-compose.yml al construir la imagen (bloque `args` del servicio shell).
const url = {
  reservas: process.env.MF_RESERVAS_URL || 'http://localhost:3001/remoteEntry.js',
  administracion:
    process.env.MF_ADMINISTRACION_URL || 'http://localhost:3002/remoteEntry.js',
  reportes: process.env.MF_REPORTES_URL || 'http://localhost:3003/remoteEntry.js',
};

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [
    pluginReact({
      reactCompiler: true,
    }),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'shell',

      // Formato obligatorio: "nombreDelRemote@urlDeSuManifiesto". El nombre de
      // la izquierda debe ser idéntico al `name` declarado en cada remote.
      remotes: {
        mfReservas: `mfReservas@${url.reservas}`,
        mfAdministracion: `mfAdministracion@${url.administracion}`,
        mfReportes: `mfReportes@${url.reportes}`,
      },

      // Debe coincidir con lo declarado en los remotes.
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],

  server: {
    port: 3000,
    // En desarrollo no hay edge, así que el shell hace de proxy hacia el
    // gateway. Así el código llama a /api tanto en desarrollo como en
    // producción, sin condicionales.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },

  html: {
    // Fuentes del diseño Stitch (stitch_clean_business_md_interface/reservasport/DESIGN.md).
    tags: [
      {
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap',
        },
      },
      {
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
        },
      },
    ],
  },
});

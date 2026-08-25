import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [
    pluginReact({
      reactCompiler: true,
    }),
    pluginTailwindcss(),
    pluginModuleFederation({
      // Nombre con el que el shell invoca a este remote. Sin guiones: acaba
      // siendo un identificador de JavaScript.
      name: 'mfReservas',

      // Manifiesto que publica el remote. El nginx del proyecto espera
      // exactamente este nombre.
      filename: 'remoteEntry.js',

      // Qué le entrega al shell. La izquierda es la ruta pública, la derecha
      // el archivo real. Exponer lo mínimo mantiene independiente al remote.
      exposes: {
        './App': './src/App.tsx',
      },

      // Dependencias que NO se duplican: una sola instancia para toda la
      // página. Sin singleton en React, los hooks fallan al montar el remote.
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],

  server: {
    port: 3001,
  },

  dev: {
    // En desarrollo los fragmentos de este remote deben pedirse a SU propio
    // servidor, no al del shell. Sin esto el shell los busca en :3000 y recibe
    // 404.
    assetPrefix: 'http://localhost:3001',
  },

  output: {
    // En producción el remote vive tras el edge, bajo /mf-reservas/. El valor
    // llega como ARG PUBLIC_PATH desde docker-compose.yml.
    assetPrefix: process.env.PUBLIC_PATH || '/',
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

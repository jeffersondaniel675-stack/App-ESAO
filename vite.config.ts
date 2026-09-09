import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// HMR (recarregamento automático ao salvar) fica ligado por padrão para o
// desenvolvimento local no VS Code. Defina DISABLE_HMR=true se precisar
// desligar o file watching (por exemplo, em ambientes com CPU limitada).
const disableHmr = process.env.DISABLE_HMR === 'true';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: !disableHmr,
      watch: disableHmr ? null : undefined,
    },
    build: {
      rollupOptions: {
        output: {
          // Separa as bibliotecas pesadas em arquivos próprios: elas quase nunca
          // mudam, então o navegador reaproveita o cache entre uma atualização e
          // outra do sistema, em vez de rebaixar tudo num único arquivo.
          manualChunks: {
            charts: ['recharts'],
            animacao: ['motion'],
          },
        },
      },
    },
  };
});

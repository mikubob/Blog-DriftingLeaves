import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

function resolveVendorChunk(id) {
  if (!id.includes('node_modules')) return
  if (id.includes('element-plus')) return 'element'
  if (id.includes('/echarts/') || id.includes('/zrender/')) return 'echarts'
  if (id.includes('md-editor-v3')) return 'md-editor'
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    fs: { allow: [fileURLToPath(new URL('.', import.meta.url)), fileURLToPath(new URL('../Frontend-Shared', import.meta.url))] },
    proxy: {
      '/api/admin/server-monitor': {
        target: 'http://127.0.0.1:5922',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api': {
        target: 'http://127.0.0.1:5922',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    vue(),
    // vueDevTools(),
    // Element Plus 自动导入
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon',
          enabledCollections: ['ep']
        })
      ]
    }),
    // 组件自动导入
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep']
        })
      ]
    }),
    // 图标
    Icons({
      autoInstall: true,
      compiler: 'vue3'
    })
  ],
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@shared': fileURLToPath(new URL('../Frontend-Shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console
        drop_debugger: true, // 移除 debugger
        pure_funcs: ['console.log']
      },
      format: {
        comments: false // 移除注释
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveVendorChunk(id)
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})

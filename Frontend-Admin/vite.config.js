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
  if (!id.includes('node_modules')) {
    return undefined
  }

  if (id.includes('element-plus')) {
    return 'element'
  }

  if (id.includes('@element-plus/icons-vue')) {
    return 'element-icons'
  }

  if (id.includes('/echarts/')) {
    return 'echarts'
  }

  if (id.includes('/zrender/')) {
    return 'zrender'
  }

  if (id.includes('md-editor-v3')) {
    return 'md-editor-core'
  }

  if (id.includes('@codemirror/language-data')) {
    return 'md-editor-language-data'
  }

  if (id.includes('@codemirror/lang-')) {
    return 'md-editor-languages'
  }

  if (id.includes('@codemirror/view')) {
    return 'md-editor-cm-view'
  }

  if (id.includes('@codemirror/state')) {
    return 'md-editor-cm-state'
  }

  if (id.includes('@codemirror/language')) {
    return 'md-editor-cm-language'
  }

  if (id.includes('@codemirror/commands')) {
    return 'md-editor-cm-commands'
  }

  if (id.includes('@codemirror/autocomplete')) {
    return 'md-editor-cm-autocomplete'
  }

  if (id.includes('@codemirror/search')) {
    return 'md-editor-cm-search'
  }

  if (id.includes('@lezer/highlight')) {
    return 'md-editor-lezer-highlight'
  }

  if (id.includes('@lezer/common')) {
    return 'md-editor-lezer-common'
  }

  if (id.includes('@lezer/lr')) {
    return 'md-editor-lezer-runtime'
  }

  if (id.includes('@lezer/markdown')) {
    return 'md-editor-lezer-markdown'
  }

  if (
    id.includes('@lezer/javascript') ||
    id.includes('@lezer/html') ||
    id.includes('@lezer/css') ||
    id.includes('@lezer/xml') ||
    id.includes('@lezer/json')
  ) {
    return 'md-editor-lezer-web'
  }

  if (
    id.includes('@lezer/python') ||
    id.includes('@lezer/php') ||
    id.includes('@lezer/java') ||
    id.includes('@lezer/cpp') ||
    id.includes('@lezer/go') ||
    id.includes('@lezer/rust') ||
    id.includes('@lezer/sass') ||
    id.includes('@lezer/yaml')
  ) {
    return 'md-editor-lezer-langs'
  }

  if (id.includes('@lezer/')) {
    return 'md-editor-lezer'
  }

  if (id.includes('/codemirror/')) {
    return 'md-editor-codemirror-base'
  }

  if (
    id.includes('@codemirror') ||
    id.includes('/codemirror/') ||
    id.includes('@lezer/')
  ) {
    return 'md-editor-codemirror'
  }

  if (
    id.includes('/highlight.js/') ||
    id.includes('/markdown-it/') ||
    id.includes('/markdown-it-task-lists/') ||
    id.includes('/markdown-it-footnote/') ||
    id.includes('/markdown-it-sub/') ||
    id.includes('/markdown-it-sup/')
  ) {
    return 'md-editor-markdown'
  }

  if (id.includes('/mermaid/')) {
    return 'md-editor-mermaid'
  }

  if (id.includes('/katex/')) {
    return 'md-editor-katex'
  }

  if (id.includes('/prettier/')) {
    return 'md-editor-prettier'
  }

  if (id.includes('/axios/') || id.includes('/dayjs/')) {
    return 'utils-vendor'
  }

  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  server: {
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
    alias: {
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

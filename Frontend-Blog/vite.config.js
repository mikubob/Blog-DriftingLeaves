import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

const getPackageName = (id) => {
  const normalizedId = id.replaceAll('\\', '/')
  const parts = normalizedId.split('/node_modules/')
  const packagePath = parts.at(-1)
  if (!packagePath) return null

  if (packagePath.startsWith('@')) {
    const [scope, name] = packagePath.split('/')
    return `${scope}/${name}`
  }

  return packagePath.split('/')[0]
}

const elementPlusPackages = new Set([
  'element-plus',
  '@element-plus/icons-vue',
  '@floating-ui/dom',
  '@floating-ui/core',
  '@floating-ui/utils',
  '@ctrl/tinycolor',
  'async-validator',
  'dayjs',
  'escape-html',
  'lodash',
  'lodash-es',
  'lodash-unified',
  'memoize-one',
  'normalize-wheel-es'
])

const markdownPreviewPackages = new Set([
  'md-editor-v3',
  '@vavt/md-editor',
  'highlight.js',
  'marked',
  'medium-zoom',
  'xss'
])

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5922',
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
          if (!id.includes('node_modules')) return

          const packageName = getPackageName(id)
          if (!packageName) return

          if (elementPlusPackages.has(packageName)) return 'element'
          if (markdownPreviewPackages.has(packageName)) return 'md-preview'

          if (packageName === 'vue' || packageName.startsWith('@vue/')) {
            return 'vue-core'
          }

          if (
            packageName === 'vue-router' ||
            packageName === 'pinia' ||
            packageName === 'pinia-plugin-persistedstate'
          ) {
            return 'app-core'
          }

          if (packageName === 'axios') return 'http'
          if (packageName === 'lunar-javascript') return 'lunar'

          return 'vendor'
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})

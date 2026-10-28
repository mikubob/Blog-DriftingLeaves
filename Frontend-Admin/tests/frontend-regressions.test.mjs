import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { installPublicResponses } from '../../Frontend-Shared/requestErrors.mjs'
import { normalizeSnapshot } from '../src/view/ServerMonitor/utils.js'
import { discussionDefaults, discussionErrors } from '../../Frontend-Blog/src/utils/discussion.js'
import { safeLink } from '../../Frontend-Shared/links.mjs'

const root = new URL('../../', import.meta.url)
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const ref = (value) => ({ value })
const computed = (get) => ({
  get value() {
    return get()
  }
})

// Exercise current source with controlled network/lifecycle hosts; this is not browser E2E.
function load(file, names, overrides = {}) {
  let source = readFileSync(new URL(file, root), 'utf8')
  source = source.replaceAll('\r\n', '\n')
  if (source.includes('<script setup>'))
    source = source.split('<script setup>')[1].split('</script>')[0]
  source = source
    .replace(/^import ['"][^\n]+\n/gm, '')
    .replace(/^import [\s\S]*? from ['"][^'"\n]+['"]\n/gm, '')
    .replace(/^export default.*$/gm, '')
    .replace(/export /g, '')
    .replaceAll('import.meta.env.BASE_URL', "'/'")
  const mounted = [],
    unmounted = [],
    guards = [],
    timers = []
  const context = {
    ref,
    computed,
    shallowRef: ref,
    defineStore: (_name, setup) => setup,
    onMounted: (fn) => mounted.push(fn),
    onUnmounted: (fn) => unmounted.push(fn),
    onBeforeUnmount: (fn) => unmounted.push(fn),
    onScopeDispose: (fn) => unmounted.push(fn),
    onBeforeRouteLeave: (fn) => guards.push(fn),
    nextTick: (fn) => Promise.resolve().then(fn),
    watch: () => {},
    window: {
      setTimeout: (fn) => {
        timers.push(fn)
        return timers.length
      },
      clearTimeout: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    setTimeout: (fn) => {
      timers.push(fn)
      return timers.length
    },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    ElMessage: { warning: () => {}, success: () => {}, error: () => {} },
    ElMessageBox: { confirm: async () => {} },
    AbortController,
    document: { title: '' },
    console,
    discussionDefaults,
    discussionErrors,
    ...overrides
  }
  const result = vm.runInNewContext(
    `${source}\n;({${names.join(',')}})`,
    context,
    { filename: file }
  )
  return { ...result, mounted, unmounted, guards, timers, context }
}

function editor(saveArticle) {
  const page = load(
    'Frontend-Admin/src/view/Article/ArticleEdit.vue',
    ['form', 'initializing', 'handleSave', 'takeSnapshot', 'hasUnsavedChanges'],
    {
      useRoute: () => ({ params: {} }),
      useRouter: () => ({ push: () => {} }),
      useArticleStore: () => ({ saveArticle }),
      MarkdownHeadingIds: class {}
    }
  )
  page.initializing.value = false
  return page
}
const validDraft = {
  title: '稿件',
  slug: 'draft',
  contentMarkdown: '正文',
  categoryId: 1
}

test('R27: invalid, rejected and canceled leave saves preserve the editor', async () => {
  let writes = 0
  const page = editor(async () => {
    writes++
    throw new Error('offline')
  })
  page.takeSnapshot()
  page.form.value.contentMarkdown = '未保存'
  assert.equal(await page.guards[0](), false)
  assert.equal(writes, 0)
  Object.assign(page.form.value, validDraft)
  assert.equal(await page.guards[0](), false)
  assert.equal(page.hasUnsavedChanges(), true)
  page.context.ElMessageBox.confirm = async () => {
    throw 'cancel'
  }
  assert.equal(await page.guards[0](), true)
  page.context.ElMessageBox.confirm = async () => {
    throw 'close'
  }
  assert.equal(await page.guards[0](), false)
})

test('R27/R28: concurrent save shares completion; future saves update the returned ID', async () => {
  const pending = deferred(),
    ids = []
  const page = editor((data) => {
    ids.push(data.id)
    return ids.length === 1 ? pending.promise : Promise.resolve({ data: 42 })
  })
  Object.assign(page.form.value, validDraft)
  const first = page.handleSave(0),
    leave = page.guards[0]()
  assert.equal(ids.length, 1)
  pending.resolve({ data: 42 })
  assert.equal(await first, true)
  assert.equal(await leave, true)
  await page.handleSave(0)
  await page.handleSave(1, { redirectAfterSave: false })
  assert.deepEqual(ids, [null, 42, 42])
})

test('R27: typing during a save remains dirty and prevents navigation', async () => {
  const pending = deferred(),
    page = editor(() => pending.promise)
  Object.assign(page.form.value, validDraft)
  const save = page.handleSave(0)
  page.form.value.contentMarkdown = '请求期间继续输入'
  pending.resolve({ data: 8 })
  assert.equal(await save, false)
  assert.equal(page.hasUnsavedChanges(), true)
})

test('R29: concurrent 401 clears state before guarded login; silent restore stays silent', async () => {
  let rejectResponse,
    warnings = 0,
    redirects = 0
  const client = {
    interceptors: {
      request: { use: () => {} },
      response: {
        use: (_ok, bad) => {
          rejectResponse = bad
        }
      }
    }
  }
  const request = load(
    'Frontend-Admin/src/utils/request.js',
    ['setSessionExpiredHandler'],
    {
      axios: { create: () => client },
      ElMessage: {
        warning: () => {
          warnings++
        },
        error: () => {}
      }
    }
  )
  const user = { isLoggedIn: true }
  let guard
  load('Frontend-Admin/src/router/index.js', [], {
    createWebHistory: () => {},
    createRouter: () => ({
      beforeEach: (fn) => {
        guard = fn
      }
    }),
    useUserStore: () => user
  })
  request.setSessionExpiredHandler(() => {
    user.isLoggedIn = false
    assert.equal(guard({ path: '/login', meta: {} }), true)
    redirects++
  })
  const error = { response: { status: 401 }, config: {} }
  await Promise.allSettled([rejectResponse(error), rejectResponse(error)])
  assert.equal(user.isLoggedIn, false)
  assert.equal(warnings, 1)
  assert.equal(redirects, 1)
  await Promise.allSettled([
    rejectResponse({ ...error, config: { silent: true } })
  ])
  assert.equal(warnings, 1)
})

test('R34: old Admin list response cannot replace the new list or loading state', async () => {
  const old = deferred(),
    current = deferred()
  const { useArticleStore } = load(
    'Frontend-Admin/src/stores/modules/article.js',
    ['useArticleStore'],
    {
      getArticlePage: (query) =>
        query.page === 1 ? old.promise : current.promise
    }
  )
  const store = useArticleStore(),
    a = store.fetchList({ page: 1 }),
    b = store.fetchList({ page: 2 })
  old.resolve({ data: { records: ['old'], total: 1 } })
  await a
  assert.equal(store.loading.value, true)
  current.resolve({ data: { records: ['current'], total: 2 } })
  await b
  assert.equal(store.list.value[0], 'current')
  assert.equal(store.loading.value, false)
})

test('R35: slow visitor initialization is shared and stores only the signed credential', async () => {
  const pending = deferred()
  let calls = 0,
    token
  const { useVisitorStore } = load(
    'Frontend-Blog/src/stores/modules/visitor.js',
    ['useVisitorStore'],
    {
      recordVisitor: () => {
        calls++
        return pending.promise
      },
      collectFingerprint: () => ({}),
      setVisitorToken: (value) => {
        token = value
      }
    }
  )
  const store = useVisitorStore(),
    a = store.record(),
    b = store.record()
  assert.equal(a, b)
  assert.equal(calls, 1)
  assert.equal(store.ready.value, false)
  pending.resolve({ data: { data: { visitorId: 1, visitorToken: 'signed' } } })
  await a
  assert.equal(token, 'signed')
  assert.equal(store.ready.value, true)
  await store.record()
  assert.equal(calls, 1)
})

test('R34: reversed Blog page responses keep the current search page', async () => {
  const old = deferred(), current = deferred()
  const page = load('Frontend-Blog/src/view/Home/index.vue', ['loadArticles', 'page', 'articles', 'loading'], {
    defineAsyncComponent: () => ({}), useRoute: () => ({ query: {} }), useRouter: () => ({}),
    getArticlePage: (number) => number === 1 ? old.promise : current.promise
  })
  const a = page.loadArticles()
  page.page.value = 2
  const b = page.loadArticles()
  current.resolve({ data: { data: { records: ['current'], total: 2 } } }); await b
  old.resolve({ data: { data: { records: ['old'], total: 1 } } }); await a
  assert.equal(page.articles.value[0], 'current')
  assert.equal(page.loading.value, false)
})

test('R34: old article and like completions cannot change a new article', async () => {
  const a = deferred(), b = deferred(), like = deferred()
  const hero = { articleCover: ref(''), articleTitle: ref(''), articleMeta: ref('') }
  const page = load('Frontend-Blog/src/view/Article/index.vue', ['loadArticle', 'article', 'toggleLike'], {
    useRoute: () => ({ params: {} }), useVisitorStore: () => ({ record: async () => {} }),
    useBlogStore: () => ({}), useThemeStore: () => ({}), inject: () => hero,
    useDiscussionForm: () => ({ loadCaptcha: () => {} }), fmtDiscussionDate: () => '', MarkdownHeadingIds: class {},
    useArticleAnchors: () => ({ onContentRendered: () => {} }),
    getArticleBySlug: (slug) => slug === 'a' ? a.promise : b.promise,
    getCommentTree: async () => ({ data: { data: { records: [], total: 0 } } }),
    hasLiked: async () => ({ data: { data: false } }), likeArticle: () => like.promise,
    window: { requestAnimationFrame: () => 1 }
  })
  const old = page.loadArticle('a'), current = page.loadArticle('b')
  b.resolve({ data: { data: { id: 2, title: 'B', likeCount: 10 } } }); await current
  a.resolve({ data: { data: { id: 1, title: 'A' } } }); await old
  assert.equal(hero.articleTitle.value, 'B')
  const savingLike = page.toggleLike()
  await Promise.resolve()
  page.article.value = { id: 3, title: 'C', likeCount: 30 }
  like.resolve(); await savingLike
  assert.equal(page.article.value.likeCount, 30)
})

test('R36: unmount during initial monitor request never schedules polling', async () => {
  const pending = deferred()
  const page = load(
    'Frontend-Admin/src/view/ServerMonitor/index.vue',
    ['fetchSnapshot'],
    {
      DEFAULT_RESOURCE: 'all',
      DEFAULT_LIMIT: 20,
      REFRESH_INTERVAL: 3000,
      createEmptySnapshot: () => ({}),
      normalizeSnapshot: (data) => data,
      syncSelectedResource: () => {},
      getServerMonitorSnapshot: () => pending.promise
    }
  )
  const request = page.fetchSnapshot({ mode: 'initial' })
  assert.equal(page.timers.length, 0)
  page.unmounted.forEach((fn) => fn())
  pending.resolve({ data: {} })
  await request
  assert.equal(page.timers.length, 0)
})

test('R32: unmount cancels reconnect eligibility, including already queued reconnect', () => {
  const sockets = []
  class Socket {
    constructor() {
      sockets.push(this)
    }
    close() {
      this.onclose?.()
    }
  }
  const page = load(
    'Frontend-Blog/src/components/SidebarCard.vue',
    ['connectWs'],
    {
      useRouter: () => ({}),
      useRoute: () => ({ query: {} }),
      useBlogStore: () => ({}),
      useVisitorStore: () => ({}),
      useSiteRuntime: () => ({}),
      location: { protocol: 'http:', host: 'localhost:5173' },
      WebSocket: Socket
    }
  )
  page.connectWs()
  sockets[0].onclose()
  assert.equal(page.timers.length, 1)
  page.unmounted.forEach((fn) => fn())
  page.timers[0]()
  assert.equal(sockets.length, 1)
  assert.equal(page.timers.length, 1)
})

test('R36: monitor waits for completion before scheduling another poll', async () => {
  const pending = deferred()
  let calls = 0
  const page = load(
    'Frontend-Admin/src/view/ServerMonitor/index.vue',
    ['fetchSnapshot'],
    {
      DEFAULT_RESOURCE: 'all',
      DEFAULT_LIMIT: 20,
      REFRESH_INTERVAL: 3000,
      createEmptySnapshot: () => ({}),
      normalizeSnapshot: () => ({}),
      syncSelectedResource: () => {},
      getServerMonitorSnapshot: () => {
        calls++
        return pending.promise
      }
    }
  )
  const request = page.fetchSnapshot()
  assert.equal(calls, 1)
  assert.equal(page.timers.length, 0)
  pending.resolve({ data: {} })
  await request
  assert.equal(page.timers.length, 1)
})

test('R37/D06: optional failure preserves successes, shares init and retries only failure', async () => {
  let infoCalls = 0,
    musicCalls = 0
  const ok = (data) => Promise.resolve({ data: { data } })
  const { useBlogStore } = load(
    'Frontend-Blog/src/stores/modules/blog.js',
    ['useBlogStore'],
    {
      getPersonalInfo: () => {
        infoCalls++
        return ok({ nickname: 'author' })
      },
      getBlogReport: () => ok({}),
      getCategories: () => ok([{ id: 1 }]),
      getTags: () => ok([]),
      getMusicList: () =>
        ++musicCalls === 1
          ? Promise.reject(new Error('music offline'))
          : ok(['song'])
    }
  )
  const store = useBlogStore(),
    a = store.init(),
    b = store.init()
  assert.equal(a, b)
  await a
  assert.equal(store.personalInfo.value.nickname, 'author')
  assert.equal(store.categories.value.length, 1)
  assert.equal(store.loaded.value, false)
  await store.init()
  assert.equal(infoCalls, 1)
  assert.equal(musicCalls, 2)
  assert.equal(store.loaded.value, true)
})

test('R38: business and 429 failures notify once, preserve error, and never navigate', async () => {
  let success, failure
  const notices = [],
    routes = []
  const client = {
    interceptors: {
      request: { use: () => {} },
      response: {
        use: (a, b) => {
          success = a
          failure = b
        }
      }
    }
  }
  installPublicResponses(
    client,
    { replace: (path) => routes.push(path) },
    (msg) => notices.push(msg),
    { getVisitorToken: () => '' }
  )
  const business = { code: 0, msg: '内容被拒绝' }
  await assert.rejects(
    success({ data: business, config: {} }),
    (error) => error === business
  )
  const limited = {
    response: { status: 429, data: { msg: '稍后重试' } },
    config: {}
  }
  await assert.rejects(failure(limited), (error) => error === limited)
  assert.deepEqual(notices, ['内容被拒绝', '稍后重试'])
  assert.deepEqual(routes, [])
  await assert.rejects(failure({ ...limited, config: { silent: true } }))
  assert.equal(notices.length, 2)
})

test('D07: absent deployment contract is unknown, never inferred from hardware', () => {
  assert.equal(
    normalizeSnapshot({ disk: { fileSystem: 'overlay' } }).deploymentMode,
    'unknown'
  )
  const snapshot = normalizeSnapshot({
    deploymentMode: 'container',
    deploymentModeText: '容器',
    deploymentTips: ['tip']
  })
  assert.equal(snapshot.deploymentModeText, '容器')
  assert.deepEqual(snapshot.deploymentTips, ['tip'])
})

test('quality: failed detail initialization cannot save a blank update', async () => {
  let writes = 0
  const page = load('Frontend-Admin/src/view/Article/ArticleEdit.vue', ['form', 'handleSave', 'loadEditor', 'loadError'], {
    useRoute: () => ({ params: { id: 42 } }), useRouter: () => ({}), MarkdownHeadingIds: class {},
    useArticleStore: () => ({
      fetchCategories: async () => {}, fetchTags: async () => {},
      saveArticle: async () => { writes++ }
    }),
    getArticleById: async () => { throw new Error('offline') }
  })
  await page.loadEditor()
  Object.assign(page.form.value, validDraft)
  assert.ok(page.loadError.value)
  assert.equal(await page.handleSave(0), false)
  assert.equal(writes, 0)
})

test('quality: stale public 401 cannot erase a replacement credential; current 401 expires once', async () => {
  let failure, token = 'new', expired = 0
  const client = { interceptors: { request: { use: () => {} }, response: { use: (_ok, bad) => { failure = bad } } } }
  const originalWindow = globalThis.window
  globalThis.window = { dispatchEvent: () => { expired++ } }
  try {
    installPublicResponses(client, {}, () => {}, {
      getVisitorToken: () => token, setVisitorToken: (value) => { token = value }
    })
    const unauthorized = (sent) => ({ response: { status: 401 }, config: { headers: new Map([['X-Visitor-Token', sent]]) } })
    await assert.rejects(failure(unauthorized('old')))
    assert.equal(token, 'new')
    assert.equal(expired, 0)
    await Promise.allSettled([failure(unauthorized('new')), failure(unauthorized('new'))])
    assert.equal(token, '')
    assert.equal(expired, 1)
  } finally {
    globalThis.window = originalWindow
  }
})

test('quality: public record retries once without an invalid token and preserves AxiosResponse', async () => {
  let success, failure, token = 'expired', calls = 0
  const response = { data: { code: 1, data: { visitorToken: 'signed' } } }
  const client = (config) => {
    calls++
    assert.equal(config.headers.has('X-Visitor-Token'), false)
    assert.equal(config._visitorRetry, true)
    return Promise.resolve(response)
  }
  client.interceptors = { request: { use: () => {} }, response: { use: (ok, bad) => { success = ok; failure = bad } } }
  installPublicResponses(client, {}, () => {}, { getVisitorToken: () => token, setVisitorToken: (value) => { token = value } })
  const error = { response: { status: 401 }, config: { url: '/cv/visitor/record', headers: new Map([['X-Visitor-Token', token]]) } }
  assert.equal(await failure(error), response)
  assert.equal(success(response), response)
  assert.equal(calls, 1)
})

test('quality: captcha unmount invalidates pending initialization and rejects later reads', async () => {
  const ready = deferred()
  let reads = 0
  const page = load('Frontend-Blog/src/composables/useDiscussionForm.js', ['useDiscussionForm'], {
    generateCaptcha: async () => { reads++; return { data: { data: { captchaId: 'c', question: '1+1' } } } }
  })
  const form = page.useDiscussionForm({ record: () => ready.promise }, ref(null))
  form.form.value.content = '保留正文'
  const a = form.loadCaptcha(), b = form.loadCaptcha()
  assert.equal(a, b)
  page.unmounted.forEach(fn => fn())
  ready.resolve()
  await a
  await form.loadCaptcha()
  assert.equal(reads, 0)
  assert.equal(form.form.value.content, '保留正文')
})

test('quality: Home/CV visitor lifecycle shares pending request and never persists after unmount', async () => {
  const pending = deferred()
  let calls = 0, persisted = 0, signal
  const page = load('Frontend-Shared/useVisitorSession.mjs', ['useVisitorSession'], {
    collectFingerprint: () => ({}), setVisitorToken: () => { persisted++ }
  })
  const session = page.useVisitorSession((_data, config) => { calls++; signal = config.signal; return pending.promise })
  const a = session.record(), b = session.record()
  assert.equal(a, b)
  page.unmounted.forEach(fn => fn())
  assert.equal(signal.aborted, true)
  pending.resolve({ data: { data: { visitorToken: 'late' } } })
  await a
  await session.record()
  assert.equal(calls, 1)
  assert.equal(persisted, 0)
})

for (const app of ['Home', 'Cv']) {
  test(`quality: ${app} retries only its failed module and shares pending data load`, async () => {
    let infoCalls = 0, optionalCalls = 0
    const ok = (data) => Promise.resolve({ data: { data } })
    const page = load(`Frontend-${app}/src/view/Home/index.vue`, ['fetchData', 'loadError'], {
      useVisitorSession: () => ({}), recordVisitor: () => {},
      getPersonalInfo: () => { infoCalls++; return ok({ nickname: 'author' }) },
      getSocialMedia: () => ++optionalCalls === 1 ? Promise.reject(new Error('offline')) : ok([]),
      getSystemConfig: () => ok({ configValue: '2020-01-01' }),
      getExperiences: () => ++optionalCalls === 1 ? Promise.reject(new Error('offline')) : ok([]),
      getSkills: () => ok([]), IntersectionObserver: class { disconnect() {} observe() {} },
      document: { querySelectorAll: () => [] }
    })
    const a = page.fetchData(), b = page.fetchData()
    assert.equal(a, b)
    await a
    assert.ok(page.loadError.value)
    await page.fetchData()
    assert.equal(page.loadError.value, '')
    assert.equal(infoCalls, 1)
    assert.equal(optionalCalls, 2)
  })
}

test('quality: login and settings late email-code responses cannot restart timers', async () => {
  for (const view of ['Login', 'Settings']) {
    const pending = deferred()
    let timers = 0
    const page = load(`Frontend-Admin/src/view/${view}/index.vue`, view === 'Login' ? ['onSendCode', 'loginFormRef'] : ['sendEmailCode'], {
      reactive: value => value, useUserStore: () => ({}), useRouter: () => ({}), useBatchSelection: () => ({}),
      sendCode: () => pending.promise, sendChangeEmailCode: () => pending.promise,
      setInterval: () => { timers++; return 1 }
    })
    if (view === 'Login') page.loginFormRef.value = { validateField: async () => true }
    const send = view === 'Login' ? page.onSendCode() : page.sendEmailCode()
    await Promise.resolve()
    page.unmounted.forEach(fn => fn())
    pending.resolve()
    await send
    assert.equal(timers, 0)
  }
})

test('quality: dashboard failed charts settle and expose independent retry state', async () => {
  const date = { subtract: () => date, format: () => '2026-10-28' }
  const page = load('Frontend-Admin/src/view/Dashboard/index.vue', ['fetchOverview', 'fetchViewChart', 'fetchVisitorChart', 'fetchBarChart', 'fetchPieChart', 'readErrors'], {
    echarts: { use: () => {} }, LineChart: {}, BarChart: {}, PieChart: {}, TitleComponent: {}, TooltipComponent: {}, GridComponent: {}, LegendComponent: {}, CanvasRenderer: {},
    dayjs: () => date,
    getOverview: async () => { throw new Error('offline') }, getViewStatistics: async () => { throw new Error('offline') },
    getVisitorStatistics: async () => { throw new Error('offline') }, getArticleViewTop10: async () => { throw new Error('offline') },
    getProvinceDistribution: async () => { throw new Error('offline') }
  })
  await Promise.all([page.fetchOverview(), page.fetchViewChart(), page.fetchVisitorChart(), page.fetchBarChart(), page.fetchPieChart()])
  assert.deepEqual(Object.keys(page.readErrors.value).sort(), ['bar', 'overview', 'pie', 'view', 'visitor'])
  assert.equal(Object.values(page.readErrors.value).every(Boolean), true)
})

test('quality: external links allow web navigation and reject executable schemes', () => {
  for (const url of ['https://example.com', 'http://example.com', '/blog', '//example.com/path']) assert.equal(safeLink(url), url)
  for (const url of ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,<script>alert(1)</script>', '', null]) assert.equal(safeLink(url), undefined)
})

test('quality: category loading waits for both independent reads', async () => {
  const categories = deferred(), tags = deferred()
  const page = load('Frontend-Admin/src/stores/modules/category.js', ['useCategoryStore'], {
    getCategoryList: () => categories.promise, getTagList: () => tags.promise
  })
  const store = page.useCategoryStore(), a = store.fetchCategories(), b = store.fetchTags()
  categories.resolve({ data: [{ id: 1 }] })
  await a
  assert.equal(store.loading.value, true)
  tags.reject(new Error('offline'))
  await b
  assert.equal(store.loading.value, false)
  assert.equal(store.categories.value[0].id, 1)
})

test('quality: a like waits for known ownership and session readiness cannot supersede its mutation', async () => {
  const status = deferred(), mutation = deferred()
  let writes = 0
  const page = load('Frontend-Blog/src/view/Article/index.vue', ['article', 'toggleLike', 'checkLike', 'liking', 'liked'], {
    useRoute: () => ({ params: {} }), useVisitorStore: () => ({ record: async () => {} }),
    useBlogStore: () => ({}), useThemeStore: () => ({}), inject: () => ({}),
    useDiscussionForm: () => ({}), fmtDiscussionDate: () => '', MarkdownHeadingIds: class {},
    useArticleAnchors: () => ({}), hasLiked: () => status.promise,
    unlikeArticle: () => { writes++; return mutation.promise }
  })
  page.article.value = { id: 1, likeCount: 5 }
  const reading = page.toggleLike()
  await Promise.resolve()
  assert.equal(writes, 0)
  status.resolve({ data: { data: true } })
  await reading
  const writing = page.toggleLike()
  await Promise.resolve()
  await page.checkLike()
  mutation.resolve()
  await writing
  assert.equal(writes, 1)
  assert.equal(page.liking.value, false)
  assert.equal(page.liked.value, false)
  assert.equal(page.article.value.likeCount, 4)
})

for (const view of ['Category', 'Tag']) {
  test(`quality: ${view} late page response cannot restore an unmounted hero`, async () => {
    const response = deferred()
    const hero = { articleTitle: ref(''), articleMeta: ref('') }
    const store = { init: async () => {}, getCategoryIdBySlug: () => 1, getCategoryNameBySlug: () => '旧分类', getCategoryDescBySlug: () => '', getTagIdBySlug: () => 1, getTagNameBySlug: () => '旧标签' }
    const page = load(`Frontend-Blog/src/view/${view}/index.vue`, [], {
      useRoute: () => ({ params: { slug: 'old' } }), useBlogStore: () => store, inject: () => hero,
      getArticlesByCategory: () => response.promise, getArticlesByTag: () => response.promise
    })
    const mounting = page.mounted[0]()
    await Promise.resolve()
    page.unmounted.forEach(fn => fn())
    hero.articleTitle.value = '新页面'
    response.resolve({ data: { data: { records: [], total: 0 } } })
    await mounting
    assert.equal(hero.articleTitle.value, '新页面')
  })
}

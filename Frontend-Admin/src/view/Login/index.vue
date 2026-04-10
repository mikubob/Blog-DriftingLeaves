<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'
import { sendCode } from '@/api/auth'

const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)
const sending = ref(false)
const isCounting = ref(false)
const countdown = ref(60)
/** @type {ReturnType<typeof setInterval>|null} */
let timer = null

const loginForm = reactive({
  username: '',
  password: '',
  code: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const codeButtonText = computed(() =>
  isCounting.value ? `${countdown.value}s 后重试` : '获取验证码'
)

const startCountdown = () => {
  isCounting.value = true
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      isCounting.value = false
      countdown.value = 60
    }
  }, 1000)
}

const onSendCode = async () => {
  if (!loginForm.username.trim()) {
    ElMessage.warning('请先输入用户名')
    return
  }
  sending.value = true
  try {
    await sendCode({ username: loginForm.username })
    ElMessage.success('验证码已发送至您的邮箱')
    startCountdown()
  } catch {
    // 错误已由拦截器统一处理
  } finally {
    sending.value = false
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.loginAction({ ...loginForm })
  } catch {
    // 错误已由拦截器统一处理
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="login-page">
    <div class="floating-leaves" aria-hidden="true">
      <span class="leaf leaf-a" />
      <span class="leaf leaf-b" />
      <span class="leaf leaf-c" />
      <span class="leaf leaf-d" />
      <span class="leaf leaf-e" />
      <span class="leaf leaf-f" />
      <span class="leaf leaf-g" />
      <span class="leaf leaf-h" />
    </div>
    <div class="login-shell">
      <div class="shell-leaves" aria-hidden="true">
        <span class="shell-leaf shell-leaf-a" />
        <span class="shell-leaf shell-leaf-b" />
        <span class="shell-leaf shell-leaf-c" />
        <span class="shell-leaf shell-leaf-d" />
        <span class="shell-leaf shell-leaf-e" />
      </div>
      <section class="login-showcase">
        <div class="showcase-topline">DriftingLeaves / Admin Console</div>

        <div class="showcase-copy">
          <p class="showcase-kicker">Notes in motion, leaves in drift</p>
          <div class="showcase-coffee" aria-hidden="true">
            <span class="coffee-steam coffee-steam-a" />
            <span class="coffee-steam coffee-steam-b" />
            <span class="coffee-cup">
              <span class="coffee-cup-rim" />
              <span class="coffee-cup-handle" />
              <span class="coffee-cup-saucer" />
            </span>
            <span class="coffee-leaf coffee-leaf-a" />
            <span class="coffee-leaf coffee-leaf-b" />
            <span class="coffee-bean coffee-bean-a" />
            <span class="coffee-bean coffee-bean-b" />
          </div>
          <h1 class="showcase-title">
            DriftingLeaves
            <span>记录漂流中的思绪，也安放每一片落叶。</span>
          </h1>
          <p class="showcase-desc">
            这是 DriftingLeaves
            的后台入口。你可以在这里整理文章、友链、评论与访客数据，
            让每一次更新都像给一片叶子标注来处，也为每一段文字保留落点。
          </p>
        </div>

        <div class="showcase-panels">
          <div class="showcase-panel">
            <span class="panel-label">CONTENT</span>
            <strong>Write / Gather / Archive</strong>
            <p>
              把文章、友链与留言整理进同一条内容脉络，让每片落叶都有可追溯的停留位置。
            </p>
          </div>
          <div class="showcase-panel">
            <span class="panel-label">ACCESS</span>
            <strong>Enter the Garden</strong>
            <p>
              完成登录后回到 DriftingLeaves
              的编辑庭院，继续修剪结构、补充细节与更新记录。
            </p>
          </div>
        </div>
      </section>

      <section class="login-box">
        <div class="login-card-line" />

        <div class="login-header">
          <div class="login-brand">
            <span class="iconfont icon-guanliduan brand-icon" />
          </div>
          <div class="login-header-text">
            <p class="login-eyebrow">Westudy inspired layout</p>
            <h2 class="login-title">DriftingLeaves 后台</h2>
            <p class="login-subtitle">
              登录后继续书写、整理与维护这座安静的数字庭院。
            </p>
          </div>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
        >
          <div class="field-group">
            <div class="field-label">用户名</div>
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                clearable
              >
                <template #prefix>
                  <span class="iconfont icon-user field-icon" />
                </template>
              </el-input>
            </el-form-item>
          </div>

          <div class="field-group">
            <div class="field-label">密码</div>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入登录密码"
                size="large"
                show-password
              >
                <template #prefix>
                  <span class="iconfont icon-lock field-icon" />
                </template>
              </el-input>
            </el-form-item>
          </div>

          <div class="field-group">
            <div class="field-label">邮箱验证码</div>
            <div class="code-panel">
              <el-form-item prop="code" class="code-form-item">
                <div class="code-row">
                  <el-input
                    v-model="loginForm.code"
                    placeholder="请输入邮箱验证码"
                    size="large"
                    class="code-input"
                  >
                    <template #prefix>
                      <span class="iconfont icon-shield field-icon" />
                    </template>
                  </el-input>
                  <div class="code-action">
                    <el-button
                      size="large"
                      class="code-btn"
                      :style="{
                        '--el-button-bg-color': '#c88438',
                        '--el-button-border-color': '#b56e24',
                        '--el-button-text-color': '#fffaf2',
                        '--el-button-hover-bg-color': '#b8742b',
                        '--el-button-hover-border-color': '#9f5f1f',
                        '--el-button-hover-text-color': '#fffaf2',
                        '--el-button-disabled-bg-color': '#eadbc7',
                        '--el-button-disabled-border-color': '#dbc8b0',
                        '--el-button-disabled-text-color': '#9f907d'
                      }"
                      :loading="sending"
                      :disabled="isCounting"
                      @click.stop="onSendCode"
                    >
                      <span class="code-btn-inner">
                        <span class="code-btn-top">
                          <span class="code-btn-mark">leaf mail</span>
                          <span class="code-btn-seal">DL</span>
                        </span>
                        <span class="code-btn-text">{{ codeButtonText }}</span>
                      </span>
                    </el-button>
                    <span v-if="false" class="code-hint">
                      {{
                        isCounting
                          ? '叶片已寄出，请稍候片刻'
                          : '向绑定邮箱发送一枚秋日凭证'
                      }}
                    </span>
                  </div>
                </div>
              </el-form-item>
              <div class="code-hint">
                {{
                  isCounting
                    ? '叶片已寄出，请稍候片刻'
                    : '向绑定邮箱发送一枚秋日凭证'
                }}
              </div>
            </div>
          </div>

          <div class="login-footnote">
            <span>Secure sign-in for content management</span>
            <span class="footnote-line" />
          </div>

          <el-form-item>
            <el-button
              class="login-btn"
              size="large"
              :style="{
                '--el-button-bg-color': '#111111',
                '--el-button-border-color': '#111111',
                '--el-button-text-color': '#ffffff',
                '--el-button-hover-bg-color': '#2f2b27',
                '--el-button-hover-border-color': '#2f2b27',
                '--el-button-hover-text-color': '#ffffff',
                '--el-button-active-bg-color': '#111111',
                '--el-button-active-border-color': '#111111'
              }"
              :loading="loading"
              @click="handleLogin"
            >
              登录后台
            </el-button>
          </el-form-item>
        </el-form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  --login-line: rgba(30, 26, 21, 0.12);
  --login-text: #1f1a17;
  --login-muted: #736b63;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.65),
      transparent 32%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(201, 138, 61, 0.16),
      transparent 24%
    ),
    linear-gradient(135deg, #e7ded0 0%, #f2ece4 42%, #e8e1d7 100%);
  overflow: hidden;
}

.login-page::before,
.login-page::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.login-page::before {
  top: 36px;
  left: 36px;
  width: min(38vw, 520px);
  height: min(38vw, 520px);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 50%;
}

.login-page::after {
  right: 42px;
  bottom: 42px;
  width: 180px;
  height: 180px;
  background:
    linear-gradient(rgba(17, 17, 17, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 17, 17, 0.05) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.6;
}

.floating-leaves {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  filter: blur(0.15px);
}

.leaf {
  --leaf-rotate: 0deg;
  --leaf-scale: 1;
  position: absolute;
  display: block;
  width: 34px;
  height: 20px;
  border-radius: 2px 16px 2px 16px;
  background: linear-gradient(
    135deg,
    rgba(210, 128, 39, 0.88),
    rgba(155, 80, 18, 0.82)
  );
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.2),
    0 10px 20px rgba(95, 59, 21, 0.14);
  opacity: 0.42;
  transform-origin: center;
  transform: translate3d(0, 0, 0) rotate(var(--leaf-rotate))
    scale(var(--leaf-scale));
  will-change: transform;
  animation: leaf-drift 18s cubic-bezier(0.33, 0.02, 0.16, 1) infinite;
}

.leaf::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  height: 1px;
  background: rgba(255, 244, 225, 0.55);
  transform: translateY(-50%) rotate(-18deg);
}

.leaf-a {
  top: 8%;
  left: 10%;
  --leaf-rotate: -28deg;
  --leaf-scale: 0.9;
  animation-delay: -2s;
}

.leaf-b {
  top: 14%;
  left: 24%;
  width: 24px;
  height: 14px;
  opacity: 0.34;
  --leaf-rotate: 18deg;
  animation-duration: 23s;
  animation-delay: -6s;
}

.leaf-c {
  top: 22%;
  right: 11%;
  width: 40px;
  height: 24px;
  background: linear-gradient(
    135deg,
    rgba(179, 94, 25, 0.8),
    rgba(120, 61, 17, 0.72)
  );
  --leaf-rotate: 42deg;
  animation-duration: 21s;
  animation-delay: -5s;
}

.leaf-d {
  top: 42%;
  left: 4%;
  width: 30px;
  height: 18px;
  opacity: 0.42;
  --leaf-rotate: -64deg;
  animation-duration: 20s;
  animation-delay: -3s;
}

.leaf-e {
  right: 22%;
  bottom: 24%;
  width: 42px;
  height: 24px;
  --leaf-rotate: -18deg;
  animation-duration: 24s;
  animation-delay: -7s;
}

.leaf-f {
  right: 8%;
  bottom: 12%;
  width: 28px;
  height: 16px;
  opacity: 0.4;
  --leaf-rotate: 30deg;
  animation-duration: 19s;
  animation-delay: -4s;
}

.leaf-g {
  bottom: 10%;
  left: 18%;
  width: 38px;
  height: 22px;
  background: linear-gradient(
    135deg,
    rgba(166, 93, 30, 0.84),
    rgba(214, 142, 49, 0.78)
  );
  --leaf-rotate: -46deg;
  animation-duration: 25s;
  animation-delay: -8s;
}

.leaf-h {
  top: 60%;
  right: 36%;
  width: 22px;
  height: 14px;
  opacity: 0.3;
  --leaf-rotate: 62deg;
  animation-duration: 22s;
  animation-delay: -1s;
}

@keyframes leaf-drift {
  0% {
    transform: translate3d(0, 0, 0) rotate(calc(var(--leaf-rotate) - 2deg))
      scale(var(--leaf-scale));
  }

  18% {
    transform: translate3d(8px, 10px, 0) rotate(calc(var(--leaf-rotate) + 3deg))
      scale(var(--leaf-scale));
  }

  37% {
    transform: translate3d(18px, 26px, 0)
      rotate(calc(var(--leaf-rotate) + 8deg)) scale(var(--leaf-scale));
  }

  58% {
    transform: translate3d(-6px, 40px, 0)
      rotate(calc(var(--leaf-rotate) - 4deg)) scale(var(--leaf-scale));
  }

  79% {
    transform: translate3d(14px, 54px, 0)
      rotate(calc(var(--leaf-rotate) + 7deg)) scale(var(--leaf-scale));
  }

  100% {
    transform: translate3d(4px, 68px, 0) rotate(calc(var(--leaf-rotate) - 3deg))
      scale(var(--leaf-scale));
  }
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  min-height: 680px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border: 1px solid var(--login-line);
  border-radius: 30px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 14% 18%,
      rgba(238, 190, 130, 0.14),
      transparent 24%
    ),
    radial-gradient(
      circle at 84% 82%,
      rgba(166, 99, 43, 0.12),
      transparent 22%
    ),
    linear-gradient(135deg, rgba(253, 249, 242, 0.7), rgba(241, 232, 220, 0.58));
  box-shadow:
    0 22px 80px rgba(58, 45, 30, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px);
}

.shell-leaves {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.shell-leaf {
  --shell-leaf-rotate: 0deg;
  position: absolute;
  display: block;
  width: 74px;
  height: 38px;
  border-radius: 4px 34px 4px 34px;
  background: linear-gradient(
    135deg,
    rgba(206, 137, 58, 0.12),
    rgba(126, 72, 24, 0.08)
  );
  border: 1px solid rgba(157, 95, 40, 0.12);
  filter: blur(0.3px);
  transform-origin: center;
  transform: translate3d(0, 0, 0) rotate(var(--shell-leaf-rotate));
  will-change: transform;
  animation: shell-leaf-float 22s ease-in-out infinite;
}

.shell-leaf::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  height: 1px;
  background: rgba(255, 248, 237, 0.28);
  transform: translateY(-50%) rotate(-20deg);
}

.shell-leaf-a {
  top: 22px;
  left: 44%;
  opacity: 0.55;
  --shell-leaf-rotate: -18deg;
  animation-delay: -3s;
}

.shell-leaf-b {
  right: 24px;
  bottom: 32px;
  width: 88px;
  height: 44px;
  opacity: 0.4;
  --shell-leaf-rotate: 18deg;
  animation-delay: -9s;
}

.shell-leaf-c {
  left: 26px;
  bottom: 86px;
  width: 56px;
  height: 30px;
  opacity: 0.34;
  --shell-leaf-rotate: -38deg;
  animation-delay: -6s;
}

.shell-leaf-d {
  top: 96px;
  right: 18px;
  width: 62px;
  height: 32px;
  opacity: 0.2;
  --shell-leaf-rotate: 34deg;
  animation-delay: -12s;
}

.shell-leaf-e {
  left: 36%;
  bottom: 18px;
  width: 68px;
  height: 34px;
  opacity: 0.18;
  --shell-leaf-rotate: -10deg;
  animation-delay: -15s;
}

@keyframes shell-leaf-float {
  0% {
    transform: translate3d(0, 0, 0) rotate(var(--shell-leaf-rotate));
  }

  30% {
    transform: translate3d(6px, 10px, 0)
      rotate(calc(var(--shell-leaf-rotate) + 3deg));
  }

  68% {
    transform: translate3d(-4px, 20px, 0)
      rotate(calc(var(--shell-leaf-rotate) - 5deg));
  }

  100% {
    transform: translate3d(3px, 28px, 0)
      rotate(calc(var(--shell-leaf-rotate) + 2deg));
  }
}

.login-showcase {
  position: relative;
  z-index: 1;
  padding: 54px 52px 46px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  color: var(--login-text);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 26%),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.26),
      rgba(226, 215, 200, 0.34)
    );
}

.login-showcase::after {
  content: '';
  position: absolute;
  right: 28px;
  top: 28px;
  width: 140px;
  height: 140px;
  border-top: 2px solid rgba(17, 17, 17, 0.12);
  border-right: 2px solid rgba(17, 17, 17, 0.12);
  border-radius: 0 26px 0 0;
}

.showcase-topline {
  font-size: 12px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--login-muted);
}

.showcase-copy {
  position: relative;
  max-width: 520px;
}

.showcase-coffee {
  position: absolute;
  top: -120px;
  right: 18px;
  width: 132px;
  height: 122px;
  pointer-events: none;
  opacity: 0.72;
  z-index: 0;
}

.coffee-cup {
  position: absolute;
  right: 18px;
  top: 34px;
  width: 74px;
  height: 48px;
  border-radius: 0 0 22px 22px;
  border: 1px solid rgba(133, 87, 47, 0.24);
  background: linear-gradient(
    180deg,
    rgba(121, 62, 31, 0.22),
    rgba(86, 44, 24, 0.16) 44%,
    rgba(250, 242, 230, 0.86) 45%,
    rgba(247, 238, 227, 0.94)
  );
  box-shadow:
    0 12px 22px rgba(90, 58, 29, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
}

.coffee-cup-rim {
  position: absolute;
  left: 5px;
  right: 5px;
  top: 5px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(96, 51, 30, 0.18),
    rgba(129, 69, 34, 0.3),
    rgba(96, 51, 30, 0.18)
  );
}

.coffee-cup-handle {
  position: absolute;
  top: 11px;
  right: -16px;
  width: 22px;
  height: 24px;
  border: 4px solid rgba(238, 228, 214, 0.9);
  border-left: 0;
  border-radius: 0 16px 16px 0;
}

.coffee-cup-saucer {
  position: absolute;
  left: -6px;
  right: -4px;
  bottom: -10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(211, 188, 160, 0.12),
    rgba(234, 220, 204, 0.9),
    rgba(211, 188, 160, 0.12)
  );
  box-shadow: 0 4px 8px rgba(90, 58, 29, 0.06);
}

.coffee-steam {
  position: absolute;
  width: 20px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(171, 131, 95, 0.24);
  border-right-color: transparent;
  border-bottom-color: transparent;
  filter: blur(0.2px);
}

.coffee-steam-a {
  top: 2px;
  right: 62px;
  transform: rotate(12deg);
}

.coffee-steam-b {
  top: 8px;
  right: 42px;
  height: 36px;
  transform: rotate(-8deg) scaleX(-1);
}

.coffee-leaf {
  position: absolute;
  display: block;
  border-radius: 4px 22px 4px 22px;
  background: linear-gradient(
    135deg,
    rgba(215, 152, 66, 0.7),
    rgba(152, 82, 27, 0.5)
  );
  border: 1px solid rgba(157, 95, 40, 0.14);
  transform-origin: center;
}

.coffee-leaf::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 6px;
  right: 6px;
  height: 1px;
  background: rgba(255, 247, 233, 0.34);
  transform: translateY(-50%) rotate(-22deg);
}

.coffee-leaf-a {
  top: 20px;
  right: 108px;
  width: 26px;
  height: 14px;
  opacity: 0.76;
  transform: rotate(-26deg);
}

.coffee-leaf-b {
  right: 12px;
  top: 92px;
  width: 20px;
  height: 11px;
  opacity: 0.66;
  transform: rotate(24deg);
}

.coffee-bean {
  position: absolute;
  width: 14px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(108, 59, 31, 0.62),
    rgba(69, 36, 17, 0.82)
  );
  box-shadow: 0 6px 10px rgba(70, 37, 18, 0.08);
}

.coffee-bean::after {
  content: '';
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 50%;
  width: 1px;
  background: rgba(248, 231, 212, 0.2);
  transform: translateX(-50%) rotate(14deg);
}

.coffee-bean-a {
  top: 86px;
  right: 104px;
  transform: rotate(-26deg);
}

.coffee-bean-b {
  top: 102px;
  right: 88px;
  width: 12px;
  height: 17px;
  opacity: 0.88;
  transform: rotate(18deg);
}

.showcase-kicker {
  margin: 0 0 14px;
  font-size: 14px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8a7965;
}

.showcase-title {
  margin: 0;
  position: relative;
  z-index: 1;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(42px, 5vw, 68px);
  line-height: 0.98;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.showcase-title span {
  display: block;
  margin-top: 14px;
  font-size: clamp(18px, 1.8vw, 24px);
  line-height: 1.35;
  font-weight: 500;
  color: #5f564d;
}

.showcase-desc {
  max-width: 470px;
  margin: 24px 0 0;
  position: relative;
  z-index: 1;
  font-size: 15px;
  line-height: 1.8;
  color: var(--login-muted);
}

.showcase-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.showcase-panel {
  padding: 18px 18px 20px;
  border: 1px solid rgba(17, 17, 17, 0.09);
  border-radius: 18px;
  background: rgba(255, 250, 242, 0.32);
  backdrop-filter: blur(10px);
}

.panel-label {
  display: inline-block;
  margin-bottom: 14px;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #8a7965;
}

.showcase-panel strong {
  display: block;
  margin-bottom: 8px;
  font-size: 18px;
  color: var(--login-text);
}

.showcase-panel p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--login-muted);
}

.login-box {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 54px 48px 44px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.32),
      transparent 30%
    ),
    linear-gradient(
      180deg,
      rgba(253, 247, 240, 0.54),
      rgba(242, 233, 222, 0.38)
    ),
    rgba(255, 249, 241, 0.26);
  border-left: 1px solid var(--login-line);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(16px);
}

.login-card-line {
  position: absolute;
  top: 28px;
  right: 28px;
  left: 28px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(138, 106, 74, 0.22),
    transparent
  );
}

.login-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 34px;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: linear-gradient(135deg, #111111, #37302a);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.brand-icon {
  font-size: 28px;
  color: #ffffff;
}

.login-header-text {
  min-width: 0;
}

.login-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #8a7965;
}

.login-title {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 30px;
  font-weight: 700;
  color: var(--login-text);
  letter-spacing: 0.04em;
}

.login-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--login-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
}

.field-group {
  margin-bottom: 6px;
}

.field-label {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #74685d;
}

.field-icon {
  font-size: 16px;
  color: #b3a89b;
}

.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.code-panel {
  padding: 10px 10px 12px;
  border: 1px solid rgba(175, 150, 120, 0.24);
  border-radius: 16px;
  overflow: visible;
  background:
    linear-gradient(
      180deg,
      rgba(255, 251, 245, 0.56),
      rgba(245, 236, 225, 0.3)
    ),
    rgba(255, 248, 240, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    0 10px 22px rgba(118, 89, 58, 0.045);
}

.code-input {
  flex: 1;
}

.code-form-item {
  margin-bottom: 0;
}

.code-action {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.code-btn {
  width: 100%;
  height: 52px;
  font-size: 13px;
  border-radius: 12px;
  border-style: solid;
  box-shadow:
    0 6px 14px rgba(164, 105, 38, 0.08),
    inset 0 1px 0 rgba(255, 247, 232, 0.12);
  position: relative;
  overflow: hidden;
}

.code-btn::before,
.code-btn::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 1px;
  background: rgba(255, 236, 212, 0.24);
  top: 24px;
}

.code-btn::before {
  left: -2px;
  transform: rotate(24deg);
}

.code-btn::after {
  right: -2px;
  transform: rotate(-24deg);
}

.code-btn-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.code-btn-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.code-btn-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.code-btn-mark {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.72;
}

.code-btn-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(255, 240, 220, 0.24);
  background: rgba(126, 60, 22, 0.12);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.code-hint {
  display: block;
  min-height: 28px;
  margin-top: 10px;
  padding: 14px 4px 0;
  background-image: linear-gradient(
    rgba(175, 150, 120, 0.18),
    rgba(175, 150, 120, 0.18)
  );
  background-repeat: no-repeat;
  background-position: 4px 4px;
  background-size: calc(100% - 8px) 1px;
  font-size: 10px;
  line-height: 1.45;
  color: #9a8672;
  position: relative;
}

.code-hint::before {
  content: 'MAIL';
  display: block;
  margin-bottom: 2px;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(141, 117, 93, 0.58);
}

:deep(.code-input .el-input__wrapper) {
  min-height: 52px;
  border-radius: 12px;
}

:deep(.code-input .el-input__wrapper::after) {
  content: '';
  position: absolute;
  right: 12px;
  top: 10px;
  width: 16px;
  height: 16px;
  border-radius: 3px 10px 3px 10px;
  background: linear-gradient(
    135deg,
    rgba(213, 142, 56, 0.18),
    rgba(171, 97, 28, 0.1)
  );
  transform: rotate(26deg);
  pointer-events: none;
}

:deep(.code-btn:hover),
:deep(.code-btn:focus-visible) {
  box-shadow:
    0 8px 18px rgba(164, 105, 38, 0.11),
    inset 0 1px 0 rgba(255, 247, 232, 0.14);
}

:deep(.code-form-item .el-form-item__error) {
  left: 4px;
  padding-top: 7px;
}

.login-footnote {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0 22px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a7965;
}

.footnote-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(17, 17, 17, 0.16), transparent);
}

.login-btn {
  width: 100%;
  height: 54px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.32em;
  border-radius: 16px;
  margin-top: 8px;
  box-shadow:
    0 16px 32px rgba(24, 20, 16, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

:deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px;
  background: rgba(255, 250, 243, 0.82);
  box-shadow:
    0 10px 24px rgba(120, 89, 58, 0.06),
    0 0 0 1px #ddd1c2 inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

:deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  box-shadow: 0 0 0 1px #111111 inset !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b3a89b inset;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__error) {
  padding-top: 6px;
}

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-showcase {
    min-height: 360px;
    padding: 42px 32px 28px;
  }

  .login-box {
    padding: 42px 32px 34px;
    border-left: 0;
    border-top: 1px solid var(--login-line);
  }

  .showcase-coffee {
    top: 0;
    right: -6px;
    transform: scale(0.92);
    transform-origin: top right;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-showcase {
    padding: 30px 22px 24px;
  }

  .showcase-panels {
    grid-template-columns: 1fr;
  }

  .showcase-copy {
    padding-top: 94px;
  }

  .showcase-coffee {
    top: -10px;
    right: 40px;
    width: 128px;
    height: 118px;
    transform: scale(0.82);
    transform-origin: top right;
  }

  .login-box {
    padding: 30px 22px 24px;
  }

  .login-header {
    align-items: flex-start;
  }

  .code-row {
    grid-template-columns: 1fr;
  }

  .code-panel {
    padding: 10px;
  }

  .code-action {
    width: 100%;
  }

  .code-btn {
    width: 100%;
  }

  .login-footnote {
    gap: 8px;
    letter-spacing: 0.08em;
  }
}
</style>

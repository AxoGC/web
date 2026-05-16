<template>
  <div class="min-h-dvh flex flex-col bg-bg-base">
    <AppHeader />
    <main class="flex-1 mx-auto w-full max-w-[1280px] px-4 lg:px-6 py-6 pb-20 md:pb-12">
      <slot />
    </main>
    <AppTabBar />
    <footer class="border-t border-border-subtle pt-10 pb-20 md:pb-8">
      <div class="mx-auto max-w-[1280px] px-4 lg:px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
          <section v-for="g in footerLinks" :key="g.title['zh-CN']">
            <h3 class="text-sm font-semibold text-text-secondary mb-3">{{ pickLocalized(g.title) }}</h3>
            <ul class="space-y-2">
              <li v-for="l in g.links" :key="l.url">
                <a
                  :href="l.url"
                  target="_blank"
                  rel="noopener"
                  class="text-xs text-text-tertiary hover:text-text-primary transition-colors break-all"
                >
                  {{ pickLocalized(l.label) }}
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div
          class="mt-10 pt-6 border-t border-border-subtle text-xs text-text-tertiary flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
        >
          <div class="flex items-center gap-3">
            <img src="/logo.webp" :alt="$t('brand.name')" class="block h-6 w-auto object-contain opacity-80" />
            <span>{{ $t('footer.copyright', { year: new Date().getFullYear() }) }}</span>
          </div>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener"
            class="hover:text-text-secondary transition-colors"
          >
            豫ICP备2023025148号-3
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
type Localized = Record<string, string>
type FooterLink = { label: Localized, url: string }
type FooterGroup = { title: Localized, links: FooterLink[] }

const { locale } = useI18n()

const QQ_GROUP_URL = 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=U6L_LJSXXAA4GKbdA3C4dsWYi3L0iAPE&authKey=yWN2Vp2lymU9xrjU%2B4ajk78JZsW2Zh4nwiTga0DvXf7B4ISNhn5isSmd0Qajj%2B1E&noverify=0&group_code=514928673'

const footerLinks: FooterGroup[] = [
  {
    title: { 'zh-CN': '友情链接', 'en': 'Friends' },
    links: [
      { label: { 'zh-CN': '苦力怕论坛', 'en': 'Klpbbs' }, url: 'https://klpbbs.com' },
      { label: { 'zh-CN': 'MineBBS', 'en': 'MineBBS' }, url: 'https://www.minebbs.com' },
      { label: { 'zh-CN': 'TATyRealms', 'en': 'TATyRealms' }, url: 'https://www.tatysmp.love' },
    ],
  },
  {
    title: { 'zh-CN': '百科', 'en': 'Wiki' },
    links: [
      { label: { 'zh-CN': '我的世界Wiki', 'en': 'Minecraft Wiki' }, url: 'https://zh.minecraft.wiki' },
      { label: { 'zh-CN': '饥荒Wiki', 'en': "Don't Starve Wiki" }, url: 'https://dontstarve.huijiwiki.com' },
      { label: { 'zh-CN': '泰拉瑞亚Wiki', 'en': 'Terraria Wiki' }, url: 'https://terraria.wiki.gg/zh' },
      { label: { 'zh-CN': '星露谷物语Wiki', 'en': 'Stardew Valley Wiki' }, url: 'https://zh.stardewvalleywiki.com' },
    ],
  },
  {
    title: { 'zh-CN': '资源中心', 'en': 'Resources' },
    links: [
      { label: { 'zh-CN': 'CurseForge', 'en': 'CurseForge' }, url: 'https://www.curseforge.com/minecraft' },
      { label: { 'zh-CN': 'Modrinth', 'en': 'Modrinth' }, url: 'https://modrinth.com' },
      { label: { 'zh-CN': 'MCPEDL', 'en': 'MCPEDL' }, url: 'https://mcpedl.com' },
      { label: { 'zh-CN': 'MCMOD', 'en': 'MCMOD' }, url: 'https://www.mcmod.cn' },
    ],
  },
  {
    title: { 'zh-CN': '联系我们', 'en': 'Contact' },
    links: [
      { label: { 'zh-CN': 'QQ群: 514928673', 'en': 'QQ Group: 514928673' }, url: QQ_GROUP_URL },
      { label: { 'zh-CN': '哔哩哔哩', 'en': 'Bilibili' }, url: 'https://b23.tv/yMqpypq' },
      { label: { 'zh-CN': 'GitHub', 'en': 'GitHub' }, url: 'https://github.com/McaxDev' },
    ],
  },
]

function pickLocalized(rec: Localized): string {
  return rec[locale.value] ?? rec['zh-CN'] ?? Object.values(rec)[0] ?? ''
}
</script>

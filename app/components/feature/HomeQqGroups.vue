<template>
  <section>
    <header class="flex items-end justify-between mb-4">
      <h2 class="text-xl">{{ $t('home.community') }}</h2>
    </header>

    <div class="flex flex-col gap-3">
      <a
        v-for="g in GROUPS"
        :key="g.id"
        :href="g.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block group"
      >
        <UiCard
          padded
          class="flex items-center gap-3 group-hover:border-brand-400/50 transition-colors"
        >
          <div class="w-10 h-10 rounded-md bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
            <img
              :src="`/qq-groups/${g.slug}.webp`"
              :alt="g.name"
              class="w-full h-full object-cover"
              loading="lazy"
              @error="onIconError"
            >
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-base font-medium truncate">{{ $t(`home.qq_role.${g.role}`) }}</p>
            <p class="text-sm text-text-tertiary font-mono mt-0.5 truncate">{{ g.id }}</p>
          </div>
        </UiCard>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
// Static config — these groups don't change often enough to warrant a CMS.
// Add a row + drop a webp in /public/qq-groups/<slug>.webp to publish a new group.
interface QqGroup {
  slug: string
  id: string
  name: string
  role: 'main' | 'mcje' | 'bedrock' | 'dst'
  url: string
}

const GROUPS: QqGroup[] = [
  {
    slug: 'main',
    id: '514928673',
    name: 'Axolotland Gaming Club',
    role: 'main',
    url: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=q5B5_9UmkU7o3yOM-bWHX5MWjwKe8cQb&authKey=mVGCSQzezwhOAPef%2BjV05voxbqFQ8%2Fkd1vBsCYDITPFh11ZC2LufYoUUX08R2jNF&noverify=0&group_code=514928673',
  },
  {
    slug: 'mcje',
    id: '433267459',
    name: 'Axolotland Minecraft Club',
    role: 'mcje',
    url: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=gaU44zcMu9fS8b4guLIvkTylVlMkfTcz&authKey=xsY%2Bcm1xFAZY9JVisiABwMHAAzsP1LRKSLKtQA6HiINfRaWqUtg0hP4MmZCZfwe7&noverify=0&group_code=433267459',
  },
  {
    slug: 'bedrock',
    id: '825805175',
    name: 'Axolotland Bedrock Club',
    role: 'bedrock',
    url: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=n_7Kclr0pMYfpmUFE85QHmegYE8HSNWw&authKey=hIdnVDJMvkbZSe6nLLYojxnYkSm33tL5BlG9Ax3SYI9RRdiHsKWk1kfZ%2B7B682zt&noverify=0&group_code=825805175',
  },
  {
    slug: 'dst',
    id: '1032432339',
    name: 'Axolotland Don\'t Starve Club',
    role: 'dst',
    url: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ewZKG5q8XjcOybktECrsjO9wlAcNlzIa&authKey=sJYP0QV5zJ8p8HDJlV7XtX1sbhJR5wZXjSiRF85XeDNnl7132QY8rcUyih2Zd699&noverify=0&group_code=1032432339',
  },
]

// Hide a broken/missing icon rather than show a torn-image glyph.
function onIconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<template>
  <section v-if="games.length">
    <h2 class="text-xl mb-4">{{ $t('home.games_title') }}</h2>
    <div class="marquee-mask overflow-hidden">
      <div class="marquee-track flex w-max gap-4">
        <img
          v-for="(g, i) in [...games, ...games]"
          :key="i"
          :src="g.image"
          alt=""
          loading="lazy"
          class="aspect-video h-28 sm:h-36 w-auto shrink-0 rounded-lg border border-border-subtle object-cover"
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface GameEntry {
  name: string
  image: string
}

// Fetched from nginx's own /static/ tree (not the backend API) — a
// hand-curated list that changes rarely, so it's not worth a DB table.
const games = ref<GameEntry[]>([])

onMounted(async () => {
  try {
    games.value = await $fetch<GameEntry[]>('/static/games/games.json')
  } catch {
    games.value = []
  }
})
</script>

<style scoped>
.marquee-mask {
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}
.marquee-track {
  animation: marquee-scroll 24s linear infinite;
}
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
</style>

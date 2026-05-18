<template>
  <UiCard padded>
    <h3 class="font-semibold text-sm mb-3">{{ $t('forum.rail_site_stats') }}</h3>
    <dl class="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
      <div class="flex items-center gap-1.5 text-text-tertiary">
        <LucideMessageSquare :size="14" />
        <dt class="text-xs">{{ $t('forum.rail_stat_posts') }}</dt>
      </div>
      <dd class="text-right font-medium tabular-nums">{{ formatNumber(stats?.post_count || 0) }}</dd>

      <div class="flex items-center gap-1.5 text-text-tertiary">
        <LucideMessageCircle :size="14" />
        <dt class="text-xs">{{ $t('forum.rail_stat_comments') }}</dt>
      </div>
      <dd class="text-right font-medium tabular-nums">{{ formatNumber(stats?.comment_count || 0) }}</dd>

      <div class="flex items-center gap-1.5 text-text-tertiary">
        <LucideEye :size="14" />
        <dt class="text-xs">{{ $t('forum.rail_stat_views') }}</dt>
      </div>
      <dd class="text-right font-medium tabular-nums">{{ formatNumber(stats?.view_count || 0) }}</dd>

      <div class="flex items-center gap-1.5 text-text-tertiary">
        <LucideUsers :size="14" />
        <dt class="text-xs">{{ $t('forum.rail_stat_users') }}</dt>
      </div>
      <dd class="text-right font-medium tabular-nums">{{ formatNumber(stats?.user_count || 0) }}</dd>
    </dl>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SiteStats } from '~/types/api'
import { formatNumber } from '~/utils/format'

const { data } = await useAsyncData('rail.site_stats', () =>
  useApi<SiteStats>('/api/stats/site'),
)

const stats = computed(() => data.value)
</script>

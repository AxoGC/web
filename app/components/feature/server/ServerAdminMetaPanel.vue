<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-3">
      <p class="text-xs text-text-tertiary">
        {{ $t('admin.meta_panel_hint') }}
      </p>
      <div class="inline-flex border border-border-subtle rounded-md overflow-hidden text-xs">
        <button
          type="button"
          :class="['px-2.5 h-7', view === 'form' ? 'bg-bg-hover text-text-primary' : 'text-text-tertiary hover:text-text-primary']"
          @click="setView('form')"
        >{{ $t('admin.meta_view_form') }}</button>
        <button
          type="button"
          :class="['px-2.5 h-7', view === 'json' ? 'bg-bg-hover text-text-primary' : 'text-text-tertiary hover:text-text-primary']"
          @click="setView('json')"
        >{{ $t('admin.meta_view_json') }}</button>
      </div>
    </div>

    <component
      v-if="view === 'form'"
      :is="typeComponent"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <div v-else class="space-y-1.5">
      <UiTextarea
        v-model="jsonText"
        :rows="6"
        :invalid="!!parseError"
        class="font-mono text-xs"
      />
      <p v-if="parseError" class="text-xs text-danger">{{ parseError }}</p>
      <p v-else class="text-xs text-text-tertiary">{{ $t('admin.meta_view_json_hint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Component } from 'vue'
import type { ServerType } from '~/types/api'

import ServerAdminMetaMcJava from '~/components/feature/server/ServerAdminMetaMcJava.vue'
import ServerAdminMetaMcBedrock from '~/components/feature/server/ServerAdminMetaMcBedrock.vue'
import ServerAdminMetaDst from '~/components/feature/server/ServerAdminMetaDst.vue'
import ServerAdminMetaTerraria from '~/components/feature/server/ServerAdminMetaTerraria.vue'

const props = defineProps<{
  type: ServerType
  /** "Non-connect, non-internal" meta keys — owner of structured + JSON edit. */
  modelValue: Record<string, unknown>
}>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, unknown>] }>()

const view = ref<'form' | 'json'>('form')

const COMPONENTS: Record<string, Component> = {
  'mc-java': ServerAdminMetaMcJava,
  'mc-bedrock': ServerAdminMetaMcBedrock,
  'dst': ServerAdminMetaDst,
  'terraria': ServerAdminMetaTerraria,
}

// shallowRef + computed so the chosen Vue component identity changes only on
// type change — avoids needless re-mounts on every keystroke.
const typeComponent = computed<Component>(() => COMPONENTS[props.type] ?? ServerAdminMetaMcJava)

const jsonText = ref('')
const parseError = ref('')

function serialize(v: Record<string, unknown>): string {
  if (!v || Object.keys(v).length === 0) return ''
  return JSON.stringify(v, null, 2)
}

function setView(v: 'form' | 'json') {
  if (v === 'json') {
    // Snapshot the current structured state into the editable text. Without
    // this, switching tabs would freeze JSON view at the last user edit.
    jsonText.value = serialize(props.modelValue)
    parseError.value = ''
  }
  view.value = v
}

// When JSON text changes, try to parse and push back to model. On error, keep
// the model as-is and surface a message — admin can fix the JSON in place.
watch(jsonText, (txt) => {
  if (view.value !== 'json') return
  const t = txt.trim()
  if (!t) {
    parseError.value = ''
    emit('update:modelValue', {})
    return
  }
  try {
    const parsed = JSON.parse(t)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      parseError.value = ''
      emit('update:modelValue', parsed as Record<string, unknown>)
    } else {
      parseError.value = 'expected a JSON object'
    }
  } catch (e) {
    parseError.value = (e as Error).message
  }
})

// External meta updates (loaded server, or type switch) need to refresh the
// JSON textarea when we're viewing it — otherwise it's stale.
watch(() => props.modelValue, (v) => {
  if (view.value === 'json') jsonText.value = serialize(v)
}, { deep: true })
</script>

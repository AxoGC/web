<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[min(90vw,24rem)]" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="item in toast.items.value"
          :key="item.id"
          :class="['toast', toastClasses[item.variant]]"
          role="alert"
          @click="toast.dismiss(item.id)"
        >
          <component :is="iconFor(item.variant)" :size="18" class="shrink-0" />
          <span class="text-sm leading-snug flex-1">{{ item.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast, type ToastVariant } from '~/composables/useToast'

const toast = useToast()

const toastClasses: Record<ToastVariant, string> = {
  success: 'bg-bg-elevated border border-success/30 text-success',
  error:   'bg-bg-elevated border border-danger/30  text-danger',
  warning: 'bg-bg-elevated border border-warning/30 text-warning',
  info:    'bg-bg-elevated border border-info/30    text-info',
}

function iconFor(v: ToastVariant) {
  switch (v) {
    case 'success': return resolveComponent('LucideCheckCircle2')
    case 'error': return resolveComponent('LucideXCircle')
    case 'warning': return resolveComponent('LucideAlertTriangle')
    case 'info': return resolveComponent('LucideInfo')
  }
}
</script>

<style scoped>
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  backdrop-filter: blur(6px);
}
.toast-enter-active, .toast-leave-active {
  transition: all 200ms ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

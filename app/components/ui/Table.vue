<template>
  <div class="overflow-x-auto rounded-lg border border-border-subtle bg-bg-elevated">
    <table class="w-full text-sm">
      <thead class="bg-bg-overlay text-text-secondary text-xs uppercase tracking-wide select-none">
        <slot name="head" />
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

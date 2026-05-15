<template>
  <div class="min-h-dvh grid place-items-center bg-bg-base px-4 py-10">
    <div class="w-full max-w-md">
      <NuxtLink to="/" class="flex items-center justify-center gap-2 mb-6 select-none">
        <span class="inline-block w-9 h-9 rounded-lg bg-brand-500 grid place-items-center">
          <LucideGamepad2 :size="22" class="text-brand-on" />
        </span>
        <span class="font-bold text-lg">{{ $t('brand.name') }}</span>
      </NuxtLink>
      <slot />
    </div>
  </div>
</template>

<template>
  <div class="min-h-dvh grid place-items-center bg-bg-base px-4 py-10">
    <div class="w-full max-w-md">
      <NuxtLink to="/" class="flex items-center justify-center mb-6 select-none">
        <img src="/logo.webp" :alt="$t('brand.name')" class="block h-10 w-auto object-contain" />
      </NuxtLink>
      <slot />
    </div>
  </div>
</template>

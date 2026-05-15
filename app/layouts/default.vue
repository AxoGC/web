<template>
  <div class="min-h-dvh flex flex-col bg-bg-base">
    <AppHeader />
    <main class="flex-1 mx-auto w-full max-w-[1280px] px-4 lg:px-6 py-6 pb-20 md:pb-12">
      <slot />
    </main>
    <AppTabBar />
    <footer class="hidden md:block border-t border-border-subtle py-6">
      <div class="mx-auto max-w-[1280px] px-4 lg:px-6 text-xs text-text-tertiary">
        {{ $t('footer.copyright', { year: new Date().getFullYear() }) }}
      </div>
    </footer>
  </div>
</template>

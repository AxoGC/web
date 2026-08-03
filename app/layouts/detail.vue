<template>
  <div class="min-h-dvh flex flex-col bg-bg-base">
    <!-- Nav bar is desktop-only for detail pages — on mobile it's hidden
         entirely (not collapsed to a back-button row) so the page has full
         width for content; pages under this layout implement their own
         mobile back affordance where they need one (see useGoBack). -->
    <AppHeader class="hidden md:flex md:block" />
    <main class="flex-1 mx-auto w-full max-w-page">
      <slot />
    </main>
    <!-- detail layout hides tab bar on mobile for immersion (plan §5.5.1 C) -->
  </div>
</template>

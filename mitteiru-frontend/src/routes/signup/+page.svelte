<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import Button from '$lib/components/ui/Button.svelte';

  let { form } = $props();
  let currentLang = $derived($language);

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
</script>

<svelte:head>
  <title>Signup - Mitteiru</title>
</svelte:head>

<div class="relative min-h-[85vh] flex items-center justify-center py-20 px-4 overflow-hidden">
  <!-- Glow Backgrounds -->
  <div class="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

  <div class="w-full max-w-md relative z-10 animate-slide-up">
    <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-white mb-2">{translations.auth.signupTitle[currentLang]}</h1>
        <p class="text-sm text-gray-400">{translations.auth.signupSubtitle[currentLang]}</p>
      </div>

      {#if form?.error}
        <div class="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium text-center">
          {form.error}
        </div>
      {/if}

      <form method="POST" action="?/signup" class="space-y-6" onsubmit={() => (loading = true)}>
        <div>
          <label for="signup-username" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {translations.auth.username[currentLang]}
          </label>
          <input
            id="signup-username"
            type="text"
            name="username"
            required
            autocomplete="username"
            bind:value={username}
            placeholder="Tu nombre de usuario"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label for="signup-email" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {translations.auth.email[currentLang]}
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            required
            autocomplete="email"
            bind:value={email}
            placeholder="ejemplo@mitteiru.com"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label for="signup-password" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {translations.auth.password[currentLang]}
          </label>
          <input
            id="signup-password"
            type="password"
            name="password"
            required
            minlength="8"
            autocomplete="new-password"
            bind:value={password}
            placeholder="Mínimo 8 caracteres"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <Button variant="primary" type="submit" fullWidth loading={loading}>
          {loading ? 'Creando cuenta...' : translations.auth.submitSignup[currentLang]}
        </Button>
      </form>

      <div class="mt-8 text-center text-sm text-gray-400">
        <span>{translations.auth.hasAccount[currentLang]}</span>
        <a href="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold ml-1">
          {translations.auth.submitLogin[currentLang]}
        </a>
      </div>
    </div>
  </div>
</div>

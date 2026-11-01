<script lang="ts">
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (loading) return;
    error = '';
    loading = true;

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        error = data.message || 'Credenciales inválidas';
        return;
      }

      password = '';
      await goto('/admin');
    } catch {
      error = 'No se pudo iniciar sesión';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin - Mitteiru</title>
</svelte:head>

<div class="max-w-md mx-auto px-4 pt-32 pb-20">
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
    <h1 class="text-2xl font-extrabold text-white mb-2">Panel de administración</h1>
    <p class="text-sm text-gray-400 mb-6">
      La sesión se guarda en una cookie HttpOnly y expira en 2 horas.
    </p>

    {#if error}
      <div class="mb-5 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}

    <form class="space-y-4" onsubmit={submit}>
      <div>
        <label for="admin-email" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          bind:value={email}
          required
          autocomplete="username"
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="admin-password" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          bind:value={password}
          required
          autocomplete="current-password"
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading || undefined}
        class="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {#if loading}
          <span class="motion-essential h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true"></span>
        {/if}
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  </div>
</div>

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#183B5B] text-xl font-bold text-white">
        N
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight tracking-tight text-app-text">
            Nebula CBT
          </p>
          <p className="mt-1 text-[11px] text-app-muted">
            by AkaraNabastala
          </p>
        </div>
      )}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <Brand compact />
        <div className="size-6 animate-spin rounded-full border-2 border-app-border border-t-[#318BCB]" />
        <p className="text-sm text-app-muted">Memeriksa sesi akun...</p>
      </div>
    </main>
  );
}

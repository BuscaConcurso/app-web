import { Logo } from "@/components/marca/Logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-cartao bg-cartao p-6 sm:p-8">
        <div className="mb-7 flex justify-center">
          <Logo tamanho={30} />
        </div>
        {children}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Crea tu cuenta o entra a tu workspace financiero de Honora.",
};

export default async function LoginPage() {
  const user = await getChatGPTUser();
  const destination = user ? "/app" : chatGPTSignInPath("/app");

  return <main className="account-gateway">
    <header className="account-gateway-nav">
      <Link className="brand-lockup" href="/" aria-label="Honora, volver al inicio"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>CLIENT-TO-CASH OS</small></span></Link>
      <Link href="/">← Volver al inicio</Link>
    </header>

    <section className="account-gateway-shell">
      <div className="account-gateway-story">
        <span>ONE SECURE ACCOUNT</span>
        <h1>Tu negocio sigue exactamente donde lo dejaste.</h1>
        <p>Una sola identidad conecta tu pipeline, clientes, Ledger, estados financieros y memoria de Copilot. No necesitas crear ni recordar otra contraseña.</p>
        <div className="account-assurances">
          <article><b>01</b><div><strong>Cuenta individual</strong><small>Cada email recibe un workspace separado.</small></div><span>PRIVATE</span></article>
          <article><b>02</b><div><strong>Datos persistentes</strong><small>Tu información permanece entre sesiones.</small></div><span>SYNCED</span></article>
          <article><b>03</b><div><strong>Acceso recuperable</strong><small>Vuelve con la misma cuenta de ChatGPT.</small></div><span>SECURE</span></article>
        </div>
      </div>

      <div className="account-access-card" id="crear-cuenta">
        <span className="account-status"><i /> ACCESO SEGURO</span>
        <h2>{user ? "Tu sesión ya está activa." : "Inicia sesión o crea tu cuenta."}</h2>
        <p>{user ? `Reconocimos ${user.email}. Puedes continuar directamente a tu workspace.` : "Si es tu primera vez, Honora crea automáticamente tu cuenta y te guía en un onboarding de tres minutos. Si ya existes, abre tus mismos datos."}</p>
        <Link className="chatgpt-access-button" href={destination}><b>✦</b><span><strong>{user ? "Abrir mi workspace" : "Continuar con ChatGPT"}</strong><small>{user ? user.email : "Crear cuenta o iniciar sesión"}</small></span><i>→</i></Link>
        <div className="account-divider"><span>o explora antes de registrarte</span></div>
        <Link className="demo-access-button" href="/demo/login"><span><b>H</b><span><strong>Entrar a la cuenta demo</strong><small>Datos de ejemplo · no modifica tu cuenta</small></span></span><i>↗</i></Link>
        <div className="account-fine-print"><b>✓</b><p>Plan Free sin tarjeta. Honora usa la identidad segura de ChatGPT y no almacena contraseñas de producción.</p></div>
      </div>
    </section>

    <footer className="account-gateway-footer"><span>© 2026 Gabriel Pérez Chávez</span><p>Account → Workspace → Financial Core</p></footer>
  </main>;
}

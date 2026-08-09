"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function DemoLoginForm() {
  const [username, setUsername] = useState("gabriel");
  const [password, setPassword] = useState("honora2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(payload.error || "No pudimos abrir la demo.");
      window.location.assign(payload.redirectTo || "/demo");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos abrir la demo.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="demo-login-page">
    <Link className="brand-lockup" href="/"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>CLIENT-TO-CASH OS</small></span></Link>
    <section className="demo-login-card">
      <div className="demo-login-copy"><span>GUIDED CLIENT EXPERIENCE</span><h1>Entra como un cliente real.</h1><p>La cuenta está precargada con leads, cobros, movimientos contables, estados financieros y conversaciones de Copilot para probar todo el recorrido.</p><div className="demo-credentials"><small>CUENTA DEMO</small><p><span>Usuario</span><b>gabriel</b></p><p><span>Contraseña</span><b>honora2026</b></p></div></div>
      <form onSubmit={submit} className="demo-login-form"><span>ACCESO DEMO</span><h2>Bienvenido de vuelta</h2><label><small>Usuario</small><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label><small>Contraseña</small><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="login-error">{error}</p>}<button type="submit" disabled={loading}>{loading ? "Abriendo workspace…" : "Ingresar a Honora →"}</button><small>Demo aislada · no contiene datos reales</small></form>
    </section>
  </main>;
}

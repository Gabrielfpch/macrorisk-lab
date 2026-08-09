"use client";

import { type FormEvent, useState } from "react";

const initial = {
  fullName: "",
  email: "",
  phone: "",
  business: "",
  service: "Estrategia / consultoría",
  challenge: "",
  budget: 1500,
  urgency: "30d",
  website: "",
};

export default function IntakeForm({ slug, businessName }: { slug: string; businessName: string }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch(`/api/intake/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No pudimos enviar tu solicitud.");
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No pudimos enviar tu solicitud.");
    }
  };

  if (status === "done") {
    return <main className="intake-page"><section className="intake-success"><span className="brand-mark">H</span><small>REQUEST RECEIVED</small><h1>Gracias. Ya estás dentro del pipeline.</h1><p>{businessName} recibió tu contexto, presupuesto y timing. El siguiente paso será una respuesta enfocada, no otro formulario.</p><div><b>✓</b><span>Datos enviados de forma segura</span></div></section></main>;
  }

  return <main className="intake-page">
    <section className="intake-shell">
      <aside className="intake-story">
        <div className="intake-brand"><span className="brand-mark">H</span><span><strong>{businessName}</strong><small>POWERED BY HONORA</small></span></div>
        <div><small>SMART INTAKE · 4 MIN</small><h1>Cuéntanos lo esencial.<br /><em>Hagamos que avance.</em></h1><p>Tu respuesta llega directamente al pipeline comercial con presupuesto, urgencia y contexto. Sin correos perdidos.</p></div>
        <ol><li><b>01</b><span><strong>Contexto</strong><small>Qué necesitas resolver.</small></span></li><li><b>02</b><span><strong>Fit</strong><small>Presupuesto y timing.</small></span></li><li><b>03</b><span><strong>Siguiente paso</strong><small>Respuesta clara y priorizada.</small></span></li></ol>
        <footer>Operado con Honora · Client-to-Cash OS</footer>
      </aside>
      <form className="intake-form" onSubmit={submit}>
        <div className="intake-form-head"><span>PROJECT REQUEST</span><b>01 — 06</b><h2>¿Podemos ayudarte?</h2><p>Completa los datos para evaluar alcance y encaje.</p></div>
        <div className="form-split"><Input label="Nombre completo" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} required /><Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /></div>
        <div className="form-split"><Input label="WhatsApp / teléfono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Input label="Negocio / marca" value={form.business} onChange={(value) => setForm({ ...form, business: value })} /></div>
        <label className="field"><span>Servicio de interés</span><select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option>Estrategia / consultoría</option><option>Diseño / branding</option><option>Marketing / growth</option><option>Automatización / tecnología</option><option>Otro servicio profesional</option></select></label>
        <label className="field"><span>¿Qué necesitas resolver?</span><textarea value={form.challenge} onChange={(event) => setForm({ ...form, challenge: event.target.value })} placeholder="Objetivo, situación actual y resultado esperado…" minLength={20} maxLength={900} required /></label>
        <div className="form-split"><label className="field"><span>Presupuesto estimado</span><div className="number-input"><small>S/</small><input type="number" min="0" step="100" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) || 0 })} /></div></label><label className="field"><span>¿Cuándo quieres empezar?</span><select value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}><option value="7d">Esta semana</option><option value="30d">En 30 días</option><option value="90d">En 90 días</option><option value="exploring">Estoy explorando</option></select></label></div>
        <label className="honeypot" aria-hidden="true">Sitio web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
        {status === "error" && <p className="intake-error">{message}</p>}
        <button className="intake-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Enviando…" : "Enviar solicitud"}<span>→</span></button>
        <small className="intake-privacy">Usaremos estos datos únicamente para responder tu solicitud comercial.</small>
      </form>
    </section>
  </main>;
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

import type { ConcursoDetalhe } from "./dominio";
import { nomeCurtoDoOrgao } from "./orgaos";

function escapar(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function diaSeguinte(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(a, m - 1, d + 1));
  return data.toISOString().slice(0, 10).replaceAll("-", "");
}

export function icsDoPrazo(c: ConcursoDetalhe, urlDaPagina: string): string | null {
  if (!c.inscricoesAte) return null;
  const dia = c.inscricoesAte.replaceAll("-", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BuscaConcurso//Agenda//PT-BR",
    "BEGIN:VEVENT",
    `UID:${c.slug}-fim@buscaconcurso.com.br`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${dia}`,
    `DTEND;VALUE=DATE:${diaSeguinte(c.inscricoesAte)}`,
    `SUMMARY:${escapar(`Fim das inscrições: ${nomeCurtoDoOrgao(c.orgao)}`)}`,
    `DESCRIPTION:${escapar(`${c.titulo}\n${urlDaPagina}`)}`,
    `URL:${urlDaPagina}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

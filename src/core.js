// O painel de demonstração só aparece com ?demo no endereço.
const DEMO = (() => { try { return new URLSearchParams(location.search).has("demo"); } catch (e) { return false; } })();
const { useState, useEffect, useRef, createContext, useContext } = React;
const html = htm.bind(React.createElement);
const LOGO = "__LOGO__";
const SYM = "__SYM__";

/* ---------- ícones (traço 2px, grade 24) ---------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15h.01M15 15h.01M10 18c1.2.8 2.8.8 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3"/>',
  vet: '<circle cx="12" cy="7" r="4"/><path d="M4.5 21v-1.5a7.5 7.5 0 0 1 15 0V21"/><path d="M8.5 13.5V16a2 2 0 0 0 4 0"/><circle cx="15.5" cy="17" r="1.6"/><path d="M15.5 13.2v2.2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  lock: '<rect x="4" y="11" width="16" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.7 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkC: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v.01M14 21h.01M17.5 21H21v-3.5"/>',
  steth: '<path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  filePlus: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 12v6M9 15h6"/>',
  fileHeart: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18.5s-3.5-2-3.5-4.3a1.8 1.8 0 0 1 3.5-.6 1.8 1.8 0 0 1 3.5.6c0 2.3-3.5 4.3-3.5 4.3z"/>',
  notePen: '<path d="M13.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5"/><path d="M8 8h5M8 12h3M8 16h2"/><path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L14 12.8l-3.6.9.9-3.6z"/>',
  pencil: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  bowl: '<path d="M2 11h20"/><path d="M3.5 11a8.5 7.5 0 0 0 17 0"/><path d="M8 21h8M12 18.5V21"/><path d="M8 7.5c1-1.5 2.5-2 4-2s3 .5 4 2"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  shieldC: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4M12 2v13"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 12h8"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16.5a3 3 0 0 1 6 0M14 10h5M14 14h5"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  plusC: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  slash: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  paw: '<g fill="currentColor" stroke="none"><ellipse cx="5.6" cy="10.4" rx="2" ry="2.5" transform="rotate(-18 5.6 10.4)"/><ellipse cx="9.4" cy="5.8" rx="2.1" ry="2.6" transform="rotate(-6 9.4 5.8)"/><ellipse cx="14.6" cy="5.8" rx="2.1" ry="2.6" transform="rotate(6 14.6 5.8)"/><ellipse cx="18.4" cy="10.4" rx="2" ry="2.5" transform="rotate(18 18.4 10.4)"/><path d="M12 11.2c-2.9 0-5.6 3-5.6 5.4 0 1.7 1.2 2.7 2.7 2.7 1.2 0 1.8-.6 2.9-.6s1.7.6 2.9.6c1.5 0 2.7-1 2.7-2.7 0-2.4-2.7-5.4-5.6-5.4z"/></g>',
};
function I({ n, s = 24, sw = 2, style }) {
  return html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style=${{ flex: "none", ...(style || {}) }} dangerouslySetInnerHTML=${{ __html: ICONS[n] || "" }}></svg>`;
}

/* ---------- utilidades ---------- */
const MES = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 9);
const agoraISO = () => new Date().toISOString();
function diasAtras(n, h = 10, m = 0) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d.toISOString(); }
function fmtData(iso) { if (!iso) return ""; const d = new Date(iso); return `${d.getDate()} de ${MES[d.getMonth()]} de ${d.getFullYear()}`; }
function fmtHora(iso) { const d = new Date(iso); return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function fmtRel(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 120) return "Agora";
  if (s < 3600) return `Há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Há ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "Ontem";
  return fmtData(iso);
}
const dia = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function localInput(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16); }
const fmtCod = (c) => (c ? c.slice(0, 4) + " " + c.slice(4) : "em análise");
function genCodigo(d) { let c; do { c = String(Math.floor(10000000 + Math.random() * 89999999)); } while (d.pets.some((p) => p.codigo === c)); return c; }
const STATUS_PET = { pendente: ["warn", "clock", "Cadastro em análise"], aprovado: ["ok", "checkC", "Pet cadastrado"], recusado: ["err", "alert", "Cadastro não aprovado"] };
const ehVet = (u) => u && u.tipo === "vet";
const primeiroNome = (u) => { const p = u.nome.split(" "); return /^(dra?\.)$/i.test(p[0]) ? p.slice(0, 2).join(" ") : p[0]; };
const fem = (u) => u && (u.genero === "f" || /^dra\./i.test(u.nome));
const ela = (u) => (fem(u) ? "ela" : u && u.genero === "m" ? "ele" : "o profissional");
const autorRot = (u) => (fem(u) ? "Autora" : u && u.genero === "m" ? "Autor" : "Autoria");
const oPet = (p) => (p && p.sexo === "Fêmea" ? "a " : "o ") + (p ? p.nome : "pet");
const OPet = (p) => (p && p.sexo === "Fêmea" ? "A " : "O ") + (p ? p.nome : "pet");
const doPet = (p) => (p && p.sexo === "Fêmea" ? "da " : "do ") + (p ? p.nome : "pet");
const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");
const TIPOS = {
  tratamento: { nome: "Plano de tratamento", icon: "file", rotina: "Medicação", rIcon: "pill", ver: "Ver orientação" },
  alimentar: { nome: "Plano alimentar", icon: "bowl", rotina: "Alimentação", rIcon: "bowl", ver: "Ver plano" },
  receita: { nome: "Receita", icon: "fileHeart", ver: "Ver receita" },
  avaliacao: { nome: "Avaliação clínica", icon: "steth", ver: "Consultar" },
};
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const RACAS = {
  "Cão": ["Sem raça definida", "Shih-tzu", "Poodle", "Lhasa apso", "Yorkshire", "Golden retriever", "Labrador", "Bulldog francês", "Spitz alemão", "Border collie", "Dachshund", "Pinscher"],
  "Gato": ["Sem raça definida", "Siamês", "Persa", "Maine coon", "Angorá", "Sphynx"],
};

function comprimirQuadrado(file, lado = 360, q = 0.8) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = Math.min(img.width, img.height), sx = (img.width - c) / 2, sy = (img.height - c) / 2;
        const cv = document.createElement("canvas"); cv.width = lado; cv.height = lado;
        cv.getContext("2d").drawImage(img, sx, sy, c, c, 0, 0, lado, lado);
        res(cv.toDataURL("image/jpeg", q));
      };
      img.onerror = () => rej(new Error("img")); img.src = fr.result;
    };
    fr.onerror = () => rej(new Error("read")); fr.readAsDataURL(file);
  });
}

/* ---------- dados de demonstração ---------- */
const VETS = () => [
  { id: "u_ana", tipo: "vet", nome: "Dra. Ana Lima", genero: "f", email: "ana@exemplo.com", senha: "tuto1234", crmv: "04521", uf: "SC", verificacao: "liberado", titulo: "Médica-veterinária", criadoEm: diasAtras(120) },
  { id: "u_bruno", tipo: "vet", nome: "Dr. Bruno Costa", genero: "m", email: "bruno@exemplo.com", senha: "tuto1234", crmv: "03877", uf: "SC", verificacao: "liberado", titulo: "Médico-veterinário", criadoEm: diasAtras(200) },
  { id: "u_caio", tipo: "vet", nome: "Dr. Caio Mendes", genero: "m", email: "caio@exemplo.com", senha: "tuto1234", crmv: "06112", uf: "PR", verificacao: "pendente", titulo: "Médico-veterinário", criadoEm: diasAtras(0, 9) },
];
const ADMIN = () => ({ id: "u_admin", tipo: "admin", nome: "Administrador tutô", email: "admin@exemplo.com", senha: "tuto1234", criadoEm: diasAtras(300) });
const RENATO = () => ({ id: "u_renato", tipo: "tutor", nome: "Renato", email: "renato@exemplo.com", senha: "tuto1234", emailConfirmado: true, aprovacao: "aprovado", prefs: { acessos: true, orientacoes: true, rotina: true }, criadoEm: diasAtras(30) });
const vazio = () => ({ v: 6, session: null, users: [], pets: [], solicitacoes: [], vinculos: [], registros: [], notas: [], cuidados: [], notifs: [] });

function reg(id, petId, autorId, tipo, titulo, conteudo, quando, extra) {
  return { id, petId, autorId, tipo, titulo, status: "publicado", criadoEm: quando, publicadoEm: quando, versoes: [{ n: 1, conteudo, data: quando, motivo: "Publicação inicial", autorId }], ...(extra || {}) };
}

/* Os cenários usam os pets que o tutor cadastrou. Nenhum nome de pet é fixo. */
function cenario(nome, petsBase) {
  const s = vazio();
  s.users = [RENATO(), ...VETS(), ADMIN()];
  const pets = (petsBase || []).map((p) => ({ ...p, tutorId: "u_renato", email: p.email || "renato@exemplo.com" }));
  if (nome !== "zero") pets.forEach((p) => { if (p.status !== "aprovado") { p.status = "aprovado"; p.aprovadoEm = agoraISO(); p.motivoRecusa = null; } if (!p.codigo) p.codigo = genCodigo({ pets }); });
  if (nome === "zero") { s.session = { uid: "u_renato", petId: null }; return s; }
  if (!pets.length) return null;
  s.pets = pets;
  const pet = pets[0], P = pet.id;
  pets.forEach((p) => s.notifs.push({ id: uid("n"), para: "u_renato", tipo: "cadastro", petId: p.id, data: p.criadoEm || diasAtras(2, 18), lida: true }));
  if (nome === "inicial") {
    s.solicitacoes.push({ id: "s_ana1", petId: P, vetId: "u_ana", motivo: "Acompanhamento veterinário", status: "pendente", criadaEm: new Date(Date.now() - 60000).toISOString() });
    s.notifs.push({ id: uid("n"), para: "u_renato", tipo: "solicitacao", ref: "s_ana1", petId: P, data: new Date(Date.now() - 60000).toISOString(), lida: false });
  }
  if (nome === "completa") {
    s.solicitacoes.push({ id: "s_bruno1", petId: P, vetId: "u_bruno", motivo: "Avaliação clínica", status: "aprovada", criadaEm: diasAtras(16, 9), decididaEm: diasAtras(16, 10) });
    s.solicitacoes.push({ id: "s_ana1", petId: P, vetId: "u_ana", motivo: "Acompanhamento veterinário", status: "aprovada", criadaEm: diasAtras(6, 14), decididaEm: diasAtras(6, 15) });
    s.vinculos.push({ id: "v1", petId: P, vetId: "u_bruno", status: "ativo", desde: diasAtras(16, 10) });
    s.vinculos.push({ id: "v2", petId: P, vetId: "u_ana", status: "ativo", desde: diasAtras(6, 15) });
    s.registros.push(reg("r_bruno_av", P, "u_bruno", "avaliacao", "Avaliação anterior", { orientacoes: "Exame físico sem alterações relevantes. Conteúdo ilustrativo de outro profissional, usado apenas para demonstração." }, diasAtras(15, 11)));
    s.registros.push(reg("r_ana_trat", P, "u_ana", "tratamento", "Plano de tratamento", { orientacoes: "Conteúdo ilustrativo do plano de tratamento. Seguir a receita e observar apetite e disposição.", administracao: "Conforme receita veterinária", duracao: "Conforme orientação registrada" }, diasAtras(5, 10), { retorno: "" }));
    s.registros.push(reg("r_ana_alim", P, "u_ana", "alimentar", "Plano alimentar", { orientacoes: `Recomendações nutricionais para ${oPet(pet)}. Conteúdo ilustrativo.`, alimento: "Conforme plano veterinário", quantidade: "Conforme plano veterinário", frequencia: "Conforme plano veterinário" }, diasAtras(5, 10, 20)));
    s.registros.push(reg("r_ana_rec", P, "u_ana", "receita", "Receita " + doPet(pet), { prescricao: "Conteúdo a ser preenchido pelo veterinário.", orientacoes: "Conforme avaliação profissional." }, diasAtras(5, 10, 30)));
    s.notas.push({ id: "nt1", petId: P, autorId: "u_renato", categoria: "Comportamento", titulo: "Mais quieto depois do passeio", descricao: `Observações sobre o dia a dia ${doPet(pet)}. Dormiu mais à tarde e comeu normalmente à noite.`, anexo: null, notificar: ["u_ana"], data: diasAtras(1, 19) });
    s.cuidados.push({ id: "c1", petId: P, registroId: "r_ana_trat", versao: 1, resultado: "Realizado", dataHora: diasAtras(1, 8), obs: "", autorId: "u_renato" });
    s.notifs.push({ id: uid("n"), para: "u_renato", tipo: "orientacao", ref: "r_ana_trat", petId: P, data: diasAtras(5, 10), lida: true });
    s.notifs.push({ id: uid("n"), para: "u_ana", tipo: "autorizado", petId: P, data: diasAtras(6, 15), lida: true });
    s.notifs.push({ id: uid("n"), para: "u_ana", tipo: "nota", ref: "nt1", petId: P, data: diasAtras(1, 19), lida: false });
    s.notifs.push({ id: uid("n"), para: "u_ana", tipo: "publicada", ref: "r_ana_trat", petId: P, data: diasAtras(5, 10), lida: true });
    s.notifs.push({ id: uid("n"), para: "u_bruno", tipo: "autorizado", petId: P, data: diasAtras(16, 10), lida: true });
  }
  s.session = { uid: "u_renato", petId: P };
  return s;
}

/* ---------- regras de acesso (centralizadas) ---------- */
const userById = (s, id) => s.users.find((u) => u.id === id);
const petById = (s, id) => s.pets.find((p) => p.id === id);
const petsDoTutor = (s, tid) => s.pets.filter((p) => p.tutorId === tid);
const vinculoDe = (s, petId, vetId) => s.vinculos.find((v) => v.petId === petId && v.vetId === vetId);
const vinculosAtivos = (s, petId) => s.vinculos.filter((v) => v.petId === petId && v.status === "ativo");
const pendenteDe = (s, petId, vetId) => s.solicitacoes.find((x) => x.petId === petId && x.vetId === vetId && x.status === "pendente");
function vetPodeLer(s, vetId, petId) {
  const v = userById(s, vetId);
  if (!v || v.tipo !== "vet" || v.verificacao !== "liberado") return false;
  const l = vinculoDe(s, petId, vetId);
  return !!(l && l.status === "ativo");
}
function podeLerPet(s, u, petId) {
  if (!u) return false;
  const p = petById(s, petId);
  if (!p) return false;
  if (u.tipo === "tutor") return p.tutorId === u.id;
  return vetPodeLer(s, u.id, petId);
}
function podeEditar(s, u, r) {
  return !!(u && u.tipo === "vet" && r.autorId === u.id && vetPodeLer(s, u.id, r.petId));
}
const atual = (r) => r.versoes[r.versoes.length - 1];
const publicados = (s, petId) => s.registros.filter((r) => r.petId === petId && r.status === "publicado").sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));

/* ---------- contexto ---------- */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function useBusy() {
  const [b, setB] = useState(false);
  const lock = useRef(false);
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true; setB(true);
    await sleep(420);
    try { await fn(); } finally { lock.current = false; setB(false); }
  };
  return [b, run];
}

/* ---------- componentes base ---------- */
function Logo({ w = 110 }) { return html`<img className="logo" src=${LOGO} width=${w} alt="tutô" />`; }
function Sym({ s = 40 }) { return html`<img className="logo" src=${SYM} style=${{ width: s, height: "auto" }} alt="" />`; }

function Btn({ v = "primary", icon, iconR, children, onClick, busy, disabled, small, type = "button", label, style }) {
  return html`<button type=${type} className=${`btn btn-${v}${small ? " btn-sm" : ""}`} onClick=${onClick} disabled=${disabled || busy} aria-busy=${busy ? "true" : "false"} aria-label=${label} style=${style}>
    ${busy ? html`<span className="spin" aria-hidden="true"></span>` : icon ? html`<${I} n=${icon} s=${20} />` : null}
    <span>${children}</span>
    ${iconR && !busy ? html`<${I} n=${iconR} s=${20} />` : null}
  </button>`;
}

function Field({ id, label, opt, help, error, children }) {
  return html`<div className="field">
    <label htmlFor=${id}>${label}${opt ? html` <span className="opt">(opcional)</span>` : null}</label>
    ${children}
    ${error ? html`<p className="err" id=${id + "-err"} role="alert">${error}</p>` : help ? html`<p className="help">${help}</p>` : null}
  </div>`;
}
function Inp({ id, value, onChange, type = "text", placeholder, icon, bad, auto, inputMode, maxLength }) {
  const [show, setShow] = useState(false);
  const pw = type === "password";
  return html`<div className="inp-wrap">
    ${icon ? html`<span className="ico"><${I} n=${icon} s=${22} /></span>` : null}
    <input id=${id} className=${"inp" + (icon ? " has-ico" : "") + (bad ? " bad" : "")} type=${pw && show ? "text" : type} value=${value} placeholder=${placeholder}
      onChange=${(e) => onChange(e.target.value)} autoComplete=${auto} inputMode=${inputMode} maxLength=${maxLength} aria-invalid=${bad ? "true" : "false"} aria-describedby=${bad ? id + "-err" : undefined}
      style=${pw ? { paddingRight: 52 } : null} />
    ${pw ? html`<button type="button" className="iconbtn dark eye" onClick=${() => setShow(!show)} aria-label=${show ? "Ocultar senha" : "Mostrar senha"}><${I} n=${show ? "eyeOff" : "eye"} s=${22} /></button>` : null}
  </div>`;
}
function Sel({ id, value, onChange, options, bad }) {
  return html`<select id=${id} className=${"inp" + (bad ? " bad" : "")} value=${value} onChange=${(e) => onChange(e.target.value)}>
    ${options.map((o) => (typeof o === "string" ? html`<option key=${o} value=${o}>${o}</option>` : html`<option key=${o.v} value=${o.v} disabled=${o.dis}>${o.t}</option>`))}
  </select>`;
}
function Area({ id, value, onChange, placeholder, bad, rows = 4 }) {
  return html`<textarea id=${id} className=${"inp" + (bad ? " bad" : "")} rows=${rows} value=${value} placeholder=${placeholder} onChange=${(e) => onChange(e.target.value)} aria-invalid=${bad ? "true" : "false"}></textarea>`;
}
function Toggle({ id, on, onChange, label, disabled }) {
  return html`<button type="button" id=${id} role="switch" className="toggle" aria-checked=${on ? "true" : "false"} aria-label=${label} disabled=${disabled} onClick=${() => onChange(!on)}></button>`;
}
function Seg({ value, onChange, options, light, label }) {
  return html`<div className=${"seg" + (light ? " light" : "")} role="tablist" aria-label=${label}>
    ${options.map((o) => html`<button key=${o.v} role="tab" aria-selected=${value === o.v ? "true" : "false"} className=${value === o.v ? "on" : ""} onClick=${() => onChange(o.v)}>${o.icon ? html`<${I} n=${o.icon} s=${20} />` : null}${o.t}</button>`)}
  </div>`;
}
function Badge({ t = "ok", icon, children }) {
  return html`<span className=${"badge b-" + t}>${icon ? html`<${I} n=${icon} s=${15} sw=${2.4} />` : null}${children}</span>`;
}
function Note({ t = "", icon = "info", children }) {
  return html`<div className=${"note " + t}><span className="ni"><${I} n=${icon} s=${22} /></span><div className="grow">${children}</div></div>`;
}
function Tile({ icon, g, round, sm, children }) {
  return html`<span className=${"ic-tile" + (g ? " g" : "") + (round ? " round" : "") + (sm ? " sm" : "")}>${children || html`<${I} n=${icon} s=${sm ? 22 : 28} />`}</span>`;
}
function PetFoto({ pet, size = 96, round }) {
  const st = { width: size, height: size, borderRadius: round ? "50%" : Math.max(12, Math.round(size * 0.17)) };
  if (pet && pet.foto) return html`<img className="petfoto" style=${st} src=${pet.foto} alt=${"Foto " + doPet(pet)} />`;
  return html`<div className="petfoto ph" style=${st} role="img" aria-label=${pet ? pet.nome + " sem foto cadastrada" : "Pet sem foto"}><${I} n="paw" s=${Math.round(size * 0.38)} /></div>`;
}
function Top({ back, bell, logo = "center", right }) {
  const { goBack, go, st, user } = useApp();
  const unread = user && st.notifs.some((n) => n.para === user.id && !n.lida);
  const bellBtn = bell ? html`<button className="iconbtn dark" onClick=${() => go(ehVet(user) ? "vNotifs" : "notifs")} aria-label=${unread ? "Notificações, há novidades" : "Notificações"}><${I} n="bell" s=${26} />${unread ? html`<span className="dot"></span>` : null}</button>` : null;
  if (logo === "left") {
    return html`<div className="top">
      <div className="row" style=${{ gap: 4 }}>${back ? html`<button className="iconbtn" onClick=${goBack} aria-label="Voltar"><${I} n="left" s=${28} /></button>` : null}<${Logo} w=${96} /></div>
      ${right || bellBtn}
    </div>`;
  }
  return html`<div className="top">
    <div className="side">${back ? html`<button className="iconbtn" onClick=${goBack} aria-label="Voltar"><${I} n="left" s=${28} /></button>` : null}</div>
    <div className="mid">${logo === "none" ? null : html`<${Logo} w=${100} />`}</div>
    <div className="side r">${right || bellBtn}</div>
  </div>`;
}
function Title({ t, sub, c }) {
  return html`<div className=${"hero" + (c ? " c" : "")}><h1>${t}</h1>${sub ? html`<p className="sub">${sub}</p>` : null}</div>`;
}
function Empty({ icon = "file", title, children, action }) {
  return html`<div className="card"><div className="empty"><${Tile} icon=${icon} round /><h3>${title}</h3><p className="muted small">${children}</p>${action || null}</div></div>`;
}
function Row({ icon, g, title, sub, onClick, right, tile }) {
  const inner = html`${tile || html`<${Tile} icon=${icon} g=${g} sm />`}<div className="grow"><p className="lbl" style=${{ fontSize: 16, fontWeight: 700 }}>${title}</p>${sub ? html`<p className="small muted">${sub}</p>` : null}</div>${right !== undefined ? right : onClick ? html`<span className="chev"><${I} n="right" /></span>` : null}`;
  return onClick
    ? html`<button className=${"card tight clickable row" + (g ? " green" : "")} style=${{ flexDirection: "row" }} onClick=${onClick}>${inner}</button>`
    : html`<div className=${"card tight row" + (g ? " green" : "")} style=${{ flexDirection: "row" }}>${inner}</div>`;
}

function QR({ text, size = 168 }) {
  let cells = null, n = 0;
  try {
    const q = window.qrcode(0, "H"); q.addData(text); q.make(); n = q.getModuleCount();
    const d = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d.push(`M${c} ${r}h1v1h-1z`);
    cells = d.join("");
  } catch (e) { cells = null; }
  if (!cells) return html`<div className="qrbox" style=${{ width: size + 24, height: size + 24, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1.4 }}><span className="small muted">QR indisponível. Use o número abaixo.</span></div>`;
  return html`<div className="qrbox" role="img" aria-label="QR demonstrativo com o número do pet">
    <svg width=${size} height=${size} viewBox=${`0 0 ${n} ${n}`} shapeRendering="crispEdges"><path d=${cells} fill="#16121D" /></svg>
    <span className="qlogo"><${Sym} s=${Math.round(size * 0.17)} /></span>
  </div>`;
}

async function copiar(texto, toast, msg) {
  try { await navigator.clipboard.writeText(texto); toast(msg || "Copiado."); }
  catch (e) { toast("Não foi possível copiar. Selecione o texto e copie manualmente: " + texto); }
}

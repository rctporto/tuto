/* =================== APP =================== */
const ROTAS = {
  boasVindas: BoasVindas, cadastro: Cadastro, login: Login, recuperar: Recuperar, confirmar: Confirmar, verificacao: Verificacao,
  inicio: TInicio, saude: Saude, rotina: Rotina, perfil: Perfil,
  cadastrarPet: CadastrarPet, idqr: IdQr, notifs: Notifs, vNotifs: Notifs, autorizar: Autorizar, acessos: Acessos, atividade: Atividade, revogar: Revogar,
  registro: RegistroTutor, versoes: Versoes, documentos: Documentos, registrarCuidado: RegistrarCuidado, novaNota: NovaNota, nota: NotaView,
  meusPets: MeusPets, conta: Conta, prefs: Prefs, privacidade: Privacidade, ajuda: Ajuda, passeios: Passeios,
  vInicio: VInicio, vPacientes: VPacientes, vSolicitacoes: VSolicitacoes, vPerfil: VPerfil,
  encontrar: Encontrar, solicitar: Solicitar, aguardando: Aguardando, revogado: Revogado, prontuario: Prontuario,
  novaOrientacao: NovaOrientacao, revisar: Revisar, editar: Editar, vRegistro: VetRegistro,
  aInicio: AInicio, aCadastros: ACadastros, aDetalhe: ADetalhe, aPerfil: APerfil,
};
const NAV_A = [["aInicio", "Pendências", "clock"], ["aCadastros", "Cadastros", "users"], ["aPerfil", "Perfil", "user"]];
const SEM_NAV = new Set(["boasVindas", "cadastro", "login", "recuperar", "confirmar", "cadastrarPet", "registrarCuidado", "novaNota", "autorizar", "revogar", "novaOrientacao", "revisar", "editar", "solicitar"]);
const NAV_T = [["inicio", "Início", "home"], ["saude", "Saúde", "heart"], ["rotina", "Rotina", "calendar"], ["perfil", "Perfil", "user"]];
const NAV_V = [["vInicio", "Início", "home"], ["vPacientes", "Pacientes", "paw"], ["vSolicitacoes", "Solicitações", "file"], ["vPerfil", "Perfil", "user"]];
const TAB_DE = { aDetalhe: "aInicio", idqr: "perfil", acessos: "perfil", meusPets: "perfil", conta: "perfil", prefs: "perfil", privacidade: "perfil", ajuda: "perfil", atividade: "perfil", passeios: "rotina", documentos: "saude", encontrar: "vSolicitacoes", aguardando: "vSolicitacoes", prontuario: "vPacientes", revogado: "vPacientes", vRegistro: "vPacientes" };
const CHAVE = "tuto-prototipo-v6";
function carregar() {
  // O link sempre abre na tela inicial (escolher cadastro); os dados salvos continuam.
  let s = null;
  try { const x = JSON.parse(localStorage.getItem(CHAVE)); if (x && x.v === 6 && Array.isArray(x.users)) s = x; } catch (e) {}
  s = s || cenario("zero");
  return { ...s, session: null };
}
function homeDe(s) { const u = s.session && userById(s, s.session.uid); return !u ? "boasVindas" : u.tipo === "admin" ? "aInicio" : ehVet(u) ? "vInicio" : "inicio"; }

const TELAS = [
  [1, "Cadastro do tutor", "T"], [2, "Entrar na conta", "T"], [3, "Recuperar senha", "T"], [4, "Confirmar e-mail", "T"], [5, "Primeiro acesso sem pet", "T"],
  [6, "Cadastrar pet", "T"], [7, "Início do tutor com pet", "T"], [8, "ID e QR do pet", "T"], [9, "Notificações do tutor", "T"], [10, "Autorizar veterinário", "T"],
  [11, "Gerenciar acessos", "T"], [12, "Saúde (prontuário do tutor)", "T"], [13, "Tratamento somente leitura", "T"], [14, "Receita digital", "T"], [15, "Plano alimentar", "T"],
  [16, "Rotina de cuidados", "T"], [17, "Registrar cuidado", "T"], [18, "Nova anotação do tutor", "T"], [19, "Perfil do tutor", "T"], [20, "Passeios (etapa futura)", "T"],
  [21, "Cadastro profissional", "V"], [22, "Verificação pendente", "V"], [23, "Início do veterinário", "V"], [24, "Ler QR ou digitar número", "V"], [25, "Solicitar acesso", "V"],
  [26, "Aguardando autorização", "V"], [27, "Acesso revogado", "V"], [28, "Prontuário do veterinário", "V"], [29, "Nova orientação", "V"], [30, "Revisar e publicar", "V"],
  [31, "Editar registro próprio", "V"], [32, "Registro de outro autor", "V"], [33, "Notificações do veterinário", "V"], [34, "Confirmar revogação", "T"],
];
const CENARIOS = [["zero", "Do zero", "Apaga os pets; Renato começa sem pet cadastrado."], ["inicial", "Pet recém-cadastrado", "Usa o seu pet: sem orientações, Dra. Ana Lima pediu acesso."], ["completa", "Jornada completa", "Usa o seu pet: Dra. Ana e Dr. Bruno com acesso, plano, receita e anotações."]];

function App() {
  const [st, setSt] = useState(carregar);
  const stRef = useRef(st);
  const [stack, setStack] = useState(() => [{ r: homeDe(st), p: {} }]);
  const [toastMsg, setToast] = useState(null);
  const [painel, setPainel] = useState(false);
  const segura = useRef(false);
  const tRef = useRef(null);

  useEffect(() => { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} }, [st]);

  const mut = (fn) => {
    const antes = stRef.current.session && stRef.current.session.uid;
    const d = structuredClone(stRef.current);
    const r = fn(d);
    stRef.current = d; setSt(d);
    const depois = d.session && d.session.uid;
    if (antes !== depois && !segura.current) setStack([{ r: homeDe(d), p: {} }]);
    return r;
  };
  const toast = (m) => { clearTimeout(tRef.current); setToast({ m, k: Date.now() }); tRef.current = setTimeout(() => setToast(null), 4200); };
  const go = (r, p = {}) => setStack((s) => [...s, { r, p }]);
  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ r: homeDe(stRef.current), p: {} }]));
  const replace = (r, p = {}) => setStack((s) => [...s.slice(0, -1), { r, p }]);
  const tab = (r) => setStack([{ r, p: {} }]);
  const user = st.session ? userById(st, st.session.uid) : null;

  function entrarComo(uidv, pilha) {
    setToast(null);
    segura.current = true;
    mut((d) => { d.session = uidv ? { uid: uidv, petId: (d.session && d.session.uid === uidv && d.session.petId) || ((petsDoTutor(d, uidv)[0] || {}).id || null) } : null; });
    segura.current = false;
    setStack(pilha || [{ r: homeDe(stRef.current), p: {} }]);
  }
  function aplicar(nome, msg) {
    segura.current = true;
    const s = cenario(nome, petsDoTutor(stRef.current, "u_renato"));
    if (!s) { segura.current = false; return false; }
    stRef.current = s; setSt(s);
    segura.current = false;
    setStack([{ r: homeDe(s), p: {} }]);
    if (msg !== false) toast(msg || `Cenário “${CENARIOS.find((c) => c[0] === nome)[1]}” carregado.`);
  }
  function abrirTela(n) {
    const S = () => stRef.current;
    const need = (ok, preset) => { if (!ok()) aplicar(preset, `Para mostrar a tela ${String(n).padStart(2, "0")}, carreguei o cenário “${CENARIOS.find((c) => c[0] === preset)[1]}”.`); };
    const T = "u_renato";
    const pilhaT = (r, p) => (["inicio", "saude", "rotina", "perfil"].includes(r) ? [{ r, p: p || {} }] : [{ r: TAB_DE[r] || "inicio", p: {} }, { r, p: p || {} }]);
    const pilhaV = (r, p) => (["vInicio", "vPacientes", "vSolicitacoes", "vPerfil"].includes(r) ? [{ r, p: p || {} }] : [{ r: TAB_DE[r] || "vInicio", p: {} }, { r, p: p || {} }]);
    const temPet = () => petsDoTutor(S(), T).length > 0;
    const regDe = (tipo, autor) => S().registros.find((r) => r.status === "publicado" && r.tipo === tipo && (!autor || r.autorId === autor) && petById(S(), r.petId) && petById(S(), r.petId).tutorId === T);
    setPainel(false);
    if (n <= 4 || n === 21) {
      const pil = { 1: [{ r: "boasVindas", p: {} }, { r: "cadastro", p: { tipo: "tutor" } }], 2: [{ r: "login", p: {} }], 3: [{ r: "login", p: {} }, { r: "recuperar", p: {} }], 4: [{ r: "login", p: {} }, { r: "confirmar", p: { email: "renato@exemplo.com", uid: T } }], 21: [{ r: "boasVindas", p: {} }, { r: "cadastro", p: { tipo: "vet" } }] }[n];
      return entrarComo(null, pil);
    }
    if (![1, 2, 3, 4, 5, 6, 19, 21, 22, 23, 24, 33].includes(n) && !temPet()) {
      toast(`A tela ${String(n).padStart(2, "0")} mostra os dados de um pet. Cadastre o seu pet primeiro.`);
      return entrarComo(T, [{ r: "inicio", p: {} }, { r: "cadastrarPet", p: {} }]);
    }
    if (n === 5) { if (temPet()) toast("A tela 05 aparece só para quem ainda não tem pet. Para vê-la, use o cenário “Do zero”."); return entrarComo(T, [{ r: "inicio", p: {} }]); }
    if (n === 22) { mut((d) => { const c = userById(d, "u_caio"); if (c) c.verificacao = "pendente"; }); return entrarComo("u_caio", [{ r: "vInicio", p: {} }]); }
    if ([7, 8, 9, 11, 12, 16, 18, 19, 20, 6].includes(n)) {
      if (n !== 6 && n !== 19) need(temPet, "inicial");
      const r = { 6: "cadastrarPet", 7: "inicio", 8: "idqr", 9: "notifs", 11: "acessos", 12: "saude", 16: "rotina", 18: "novaNota", 19: "perfil", 20: "passeios" }[n];
      return entrarComo(T, pilhaT(r));
    }
    if (n === 10) {
      const pend = () => S().solicitacoes.find((s) => s.status === "pendente" && petById(S(), s.petId).tutorId === T);
      need(pend, "inicial"); return entrarComo(T, pilhaT("autorizar", { sid: pend().id }));
    }
    if ([13, 14, 15, 17].includes(n)) {
      const tipo = { 13: "tratamento", 14: "receita", 15: "alimentar", 17: "tratamento" }[n];
      need(() => regDe(tipo), "completa"); const r = regDe(tipo);
      return entrarComo(T, n === 17 ? [{ r: "rotina", p: {} }, { r: "registrarCuidado", p: { rid: r.id } }] : [{ r: "saude", p: {} }, { r: "registro", p: { rid: r.id } }]);
    }
    if (n === 34) {
      const l = () => { const a = S().vinculos.filter((v) => v.status === "ativo" && petById(S(), v.petId).tutorId === T); return a.find((v) => v.vetId === "u_ana") || a[0]; };
      need(l, "completa"); const v = l();
      return entrarComo(T, [{ r: "perfil", p: {} }, { r: "acessos", p: { petId: v.petId } }, { r: "revogar", p: { petId: v.petId, vetId: v.vetId } }]);
    }
    if (n === 23 || n === 24 || n === 33) return entrarComo("u_ana", pilhaV({ 23: "vInicio", 24: "encontrar", 33: "vNotifs" }[n]));
    const petT = () => S().pets.find((p) => p.tutorId === T && p.status === "aprovado");
    if (n === 25) {
      const livre = () => petT() && ["u_bruno", "u_ana"].find((v) => !vetPodeLer(S(), v, petT().id) && !pendenteDe(S(), petT().id, v));
      need(livre, "inicial"); return entrarComo(livre(), pilhaV("solicitar", { petId: petT().id }));
    }
    if (n === 26) {
      const pend = () => S().solicitacoes.find((s) => s.status === "pendente");
      need(pend, "inicial"); const s = pend(); return entrarComo(s.vetId, pilhaV("aguardando", { sid: s.id }));
    }
    if (n === 27) {
      const sem = () => petT() && ["u_bruno", "u_ana"].find((v) => !vetPodeLer(S(), v, petT().id));
      const rev = S().vinculos.find((v) => v.status === "revogado");
      if (rev) return entrarComo(rev.vetId, pilhaV("revogado", { petId: rev.petId }));
      need(sem, "inicial"); return entrarComo(sem(), pilhaV("revogado", { petId: petT().id }));
    }
    const anaAtiva = () => petT() && vetPodeLer(S(), "u_ana", petT().id) && regDe("tratamento", "u_ana");
    need(anaAtiva, "completa");
    const pid = petT().id;
    if (n === 28) return entrarComo("u_ana", pilhaV("prontuario", { petId: pid }));
    if (n === 29) return entrarComo("u_ana", [{ r: "vPacientes", p: {} }, { r: "prontuario", p: { petId: pid } }, { r: "novaOrientacao", p: { petId: pid } }]);
    if (n === 30) {
      segura.current = true;
      const prev = stRef.current.session; let rid;
      mut((d) => { d.session = { uid: "u_ana" }; const ex = d.registros.find((r) => r.autorId === "u_ana" && r.status === "rascunho" && r.petId === pid); rid = ex ? ex.id : A.salvarRascunho(d, { petId: pid, tipo: "tratamento", titulo: "Plano de tratamento", retorno: "", anexo: null, conteudo: { orientacoes: "Conteúdo ilustrativo para revisão.", administracao: "Conforme receita veterinária", duracao: "7 dias" } }).id; d.session = prev; });
      segura.current = false;
      return entrarComo("u_ana", [{ r: "vPacientes", p: {} }, { r: "prontuario", p: { petId: pid } }, { r: "revisar", p: { rid } }]);
    }
    if (n === 31) return entrarComo("u_ana", [{ r: "vPacientes", p: {} }, { r: "prontuario", p: { petId: pid } }, { r: "editar", p: { rid: regDe("tratamento", "u_ana").id } }]);
    if (n === 32) {
      const outro = () => S().registros.find((r) => r.status === "publicado" && r.petId === pid && r.autorId !== "u_ana");
      need(outro, "completa");
      return entrarComo("u_ana", [{ r: "vPacientes", p: {} }, { r: "prontuario", p: { petId: pid } }, { r: "vRegistro", p: { rid: outro().id } }]);
    }
  }

  const topo = stack[stack.length - 1];
  const Comp = ROTAS[topo.r] || TInicio;
  const ctx = { st, user, mut, go, goBack, replace, tab, toast };
  const logado = !!user;
  const navItens = logado ? (user.tipo === "admin" ? NAV_A : ehVet(user) ? NAV_V : NAV_T) : null;
  const ativa = TAB_DE[topo.r] || stack[0].r;
  const mostraNav = logado && !SEM_NAV.has(topo.r) && !(user.tipo === "tutor" && user.aprovacao && user.aprovacao !== "aprovado") && !(ehVet(user) && user.verificacao !== "liberado" && topo.r === "vInicio" && false);
  const unread = user && st.notifs.some((n) => n.para === user.id && !n.lida);

  return html`<${Ctx.Provider} value=${ctx}>
    <div className="stage">
      <div className="phone" aria-label="Aplicativo tutô">
        <${Comp} key=${stack.length + ":" + topo.r + ":" + JSON.stringify(topo.p)} p=${topo.p || {}} />
        ${mostraNav ? html`<nav className="nav" aria-label="Navegação principal" style=${{ gridTemplateColumns: `repeat(${navItens.length}, 1fr)` }}>${navItens.map(([r, t, ic]) => html`<button key=${r} className=${ativa === r ? "on" : ""} aria-current=${ativa === r ? "page" : undefined} onClick=${() => tab(r)}><${I} n=${ic} s=${26} sw=${ativa === r ? 2.4 : 2} />${t}</button>`)}</nav>` : null}
        ${toastMsg ? html`<div className=${"toast" + (mostraNav ? "" : " top")} role="status" aria-live="polite" key=${toastMsg.k}><${I} n="checkC" s=${20} /><span>${toastMsg.m}</span></div>` : null}
      </div>
      <${Painel} aberto=${painel} fechar=${() => setPainel(false)} st=${st} user=${user} entrarComo=${entrarComo} aplicar=${aplicar} abrirTela=${abrirTela} mut=${mut} toast=${toast} />
      ${painel ? html`<div className="scrim" onClick=${() => setPainel(false)}></div>` : null}
      <button className="chip demo-fab" onClick=${() => setPainel(true)} aria-label="Abrir painel de demonstração"><${I} n="users" s=${18} />Demo</button>
    </div>
  <//>`;
}

function Painel({ aberto, fechar, st, user, entrarComo, aplicar, abrirTela, mut, toast }) {
  const [conf, setConf] = useState(null);
  return html`<aside className=${"panel" + (aberto ? " open" : "")} aria-label="Painel de demonstração">
    <div className="row" style=${{ justifyContent: "space-between" }}><div><h2>Demonstração</h2><p className="small muted">Protótipo navegável do tutô · versão 6 (26/10)</p></div><button className="iconbtn dark" onClick=${fechar} aria-label="Fechar painel" style=${{ display: aberto ? "inline-flex" : "none" }}><${I} n="x" /></button></div>
    <div className="ps">
      <p className="pt">Entrar como</p>
      ${st.users.map((u) => html`<button key=${u.id} className=${"who" + (user && user.id === u.id ? " on" : "")} onClick=${() => { entrarComo(u.id); fechar(); }}>
        <span className="av">${u.tipo === "vet" ? html`<${I} n="vet" s=${18} />` : u.tipo === "admin" ? html`<${I} n="shieldC" s=${18} />` : u.nome.charAt(0)}</span>
        <span className="grow"><b style=${{ fontSize: 14 }}>${u.nome}</b><br /><span className="meta">${u.tipo === "admin" ? `Administrador${st.notifs.some((n) => n.para === u.id && n.tipo === "pendencia" && !n.lida) || itensAdmin(st).some((i) => i.status === "pendente") ? " · há cadastros pendentes" : ""}` : u.tipo === "vet" ? ({ liberado: "Veterinário · aprovado", pendente: "Veterinário · em análise", recusado: "Veterinário · recusado" })[u.verificacao] : ({ aprovado: "Tutor · aprovado", pendente: "Tutor · em análise", recusado: "Tutor · recusado" })[u.aprovacao || "aprovado"]}</span></span>
      </button>`)}
      ${user ? html`<button className="btn btn-link" style=${{ alignSelf: "flex-start" }} onClick=${() => { entrarComo(null); fechar(); }}>Sair (ver telas de entrada)</button>` : null}
      <p className="meta">Cadastros de tutores e veterinários (cada um com seu e-mail) só valem depois da aprovação. O tutor aprovado vincula os pets na própria conta. Entre como Administrador tutô para aprovar ou recusar.</p>
    </div>
    <div className="ps">
      <p className="pt">Cenário</p>
      ${CENARIOS.map(([k, t, s]) => html`<button key=${k} className="who" onClick=${() => setConf(k)}><span className="grow"><b style=${{ fontSize: 14 }}>${t}</b><br /><span className="meta">${s}</span></span><${I} n="undo" s=${18} /></button>`)}
      ${conf ? html`<div className="note w" role="alert"><div className="grow"><b>Recomeçar com “${CENARIOS.find((c) => c[0] === conf)[1]}”?</b> O que você fez nesta demonstração será apagado.<div className="row" style=${{ marginTop: 8 }}><${Btn} small onClick=${() => { if (aplicar(conf) === false) { toast("Cadastre um pet como Renato primeiro. O cenário usa o nome e a foto dele."); entrarComo("u_renato", [{ r: "inicio", p: {} }, { r: "cadastrarPet", p: {} }]); } setConf(null); fechar(); }}>Recomeçar<//><${Btn} small v="secondary" onClick=${() => setConf(null)}>Cancelar<//></div></div></div>` : null}
    </div>
    <div className="ps">
      <p className="pt">As 34 telas de referência</p>
      <div className="idx">${TELAS.map(([n, t, r]) => html`<button key=${n} onClick=${() => abrirTela(n)}><span className="n">${String(n).padStart(2, "0")}</span><span>${t}</span><span className="r">${r === "T" ? "Tutor" : "Vet."}</span></button>`)}</div>
    </div>
    <div className="ps">
      <p className="pt">O que é simulado</p>
      <p className="small muted">Login, e-mail, verificação do CRMV, câmera, envio de arquivos, downloads e notificações externas. Os dados ficam só neste navegador. Renato e os profissionais são dados de teste; os pets são os que você cadastrar, e a receita é apenas um exemplo visual.</p>
    </div>
  </aside>`;
}

document.documentElement.lang = "pt-BR";
ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);

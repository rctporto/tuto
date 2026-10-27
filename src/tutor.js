/* =================== TUTOR =================== */
function petAtivo(st, user) {
  const ps = petsDoTutor(st, user.id);
  return ps.find((p) => p.id === (st.session && st.session.petId)) || ps[0] || null;
}
function usePet(p) {
  const { st, user } = useApp();
  const pet = (p && p.petId && petById(st, p.petId)) || petAtivo(st, user);
  return pet && pet.tutorId === user.id ? pet : null;
}
function SemPetAqui() {
  const { go } = useApp();
  return html`<div className="scr"><${Top} back /><${Empty} icon="paw" title="Nenhum pet selecionado" action=${html`<${Btn} onClick=${() => go("cadastrarPet")}>Cadastrar meu pet<//>`}>Cadastre um pet para ver esta área.<//></div>`;
}
function PetHead({ pet, children, size = 110, round }) {
  return html`<div className="card petcard" style=${{ flexDirection: "row" }}>
    <${PetFoto} pet=${pet} size=${size} round=${round} />
    <div className="grow stack" style=${{ gap: 6 }}><h2>${pet.nome}</h2>${children}</div>
  </div>`;
}
function PetSwitch() {
  const { st, user, mut, go } = useApp();
  const ps = petsDoTutor(st, user.id); const at = petAtivo(st, user);
  if (ps.length < 2) return null;
  return html`<div className="chips" role="group" aria-label="Escolher pet">
    ${ps.map((p) => html`<button key=${p.id} className=${"chip pet-chip" + (p.id === at.id ? " on" : "")} aria-pressed=${p.id === at.id ? "true" : "false"} onClick=${() => mut((d) => { d.session.petId = p.id; })}><${PetFoto} pet=${p} size=${24} round />${p.nome}</button>`)}
    <button className="chip" onClick=${() => go("cadastrarPet")}><${I} n="plus" s=${18} />Adicionar</button>
  </div>`;
}

/* ---------- 05 / 07 Início ---------- */
function TInicio() {
  const { st, user, go } = useApp();
  if (user.aprovacao && user.aprovacao !== "aprovado") return html`<${ContaAnalise} />`;
  const pet = petAtivo(st, user);
  if (!pet) return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t=${"Olá, " + primeiroNome(user)} sub="Vamos conhecer seu pet?" />
    <div className="card green center" style=${{ alignItems: "center", paddingTop: 28 }}>
      <span style=${{ position: "relative", display: "inline-flex" }}><${Sym} s=${86} /><span style=${{ position: "absolute", right: -14, bottom: -4, background: "var(--succ)", borderRadius: "50%", color: "#2FAF6A", display: "flex" }}><${I} n="plusC" s=${40} sw=${2.2} /></span></span>
      <h2 style=${{ marginTop: 8 }}>Cadastre seu primeiro pet</h2>
      <p className="muted">Guarde informações e conecte o veterinário com sua autorização.</p>
      <${Btn} iconR="right" onClick=${() => go("cadastrarPet")}>Cadastrar meu pet<//>
    </div>
    <${Row} icon="qr" title="Identificação por código" sub="Cada pet tem um ID e QR exclusivos." />
    <${Row} icon="users" title="Acesso com sua autorização" sub="O veterinário solicita acesso e você decide quem pode ver os dados." />
    <${Row} icon="fileHeart" title="Cuidados em um só lugar" sub="Registre anotações, acompanhe a rotina e tenha tudo organizado." />
  </div>`;
  const regs = publicados(st, pet.id).filter((r) => r.tipo !== "avaliacao");
  const pend = st.solicitacoes.filter((s) => s.petId === pet.id && s.status === "pendente");
  const notas = st.notas.filter((n) => n.petId === pet.id);
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t=${"Olá, " + primeiroNome(user)} sub=${pet.status === "pendente" ? `Recebemos o cadastro ${doPet(pet)}.` : pet.status === "recusado" ? `O cadastro ${doPet(pet)} precisa de ajustes.` : regs.length ? `Veja os cuidados ${doPet(pet)} e registre como está.` : `${OPet(pet)} já está na tutô!`} />
    <${PetSwitch} />
    ${pend.map((s) => { const v = userById(st, s.vetId); return html`<button key=${s.id} className="card clickable row" style=${{ flexDirection: "row", background: "var(--roxo)", color: "var(--branco)" }} onClick=${() => go("autorizar", { sid: s.id })}>
      <span className="ic-tile sm" style=${{ background: "rgba(255,255,255,.16)", color: "var(--branco)" }}><${I} n="vet" s=${22} /></span>
      <div className="grow"><p style=${{ fontWeight: 800 }}>${v.nome} pediu acesso</p><p className="small" style=${{ opacity: 0.9 }}>Você decide se autoriza. Toque para analisar.</p></div><${I} n="right" />
    </button>`; })}
    <div className="card petcard" style=${{ flexDirection: "row", alignItems: "stretch" }}>
      <${PetFoto} pet=${pet} size=${120} />
      <div className="grow stack" style=${{ gap: 6, justifyContent: "center" }}>
        <h2 style=${{ fontSize: 26 }}>${pet.nome}</h2>
        <p className="muted">${pet.raca || pet.especie}</p>
        <${StatusPet} pet=${pet} />
      </div>
    </div>
    ${pet.status === "aprovado" ? html`
      <${Btn} v="secondary" icon="idcard" iconR="right" onClick=${() => go("idqr")}>Ver ID e QR ${doPet(pet)}<//>
      <${Row} icon="vet" title="Conecte seu veterinário" sub=${`Mostre o código ${doPet(pet)}. Você decide quem pode acessar os dados.`} onClick=${() => go("idqr")} />`
    : html`<${AvisoStatusPet} pet=${pet} />`}
    <h2>Cuidados ${doPet(pet)}</h2>
    ${regs.length
      ? regs.map((r) => html`<${RegCard} key=${r.id} r=${r} />`)
      : html`<${Empty} title="Nenhuma orientação veterinária ainda.">As orientações aparecerão aqui após a autorização e o envio pelo veterinário.<//>`}
    <div className="card green row" style=${{ flexDirection: "row" }}>
      <${Tile} icon="notePen" g sm />
      <div className="grow"><h3 style=${{ fontSize: 17 }}>Minhas anotações</h3><p className="small muted">${notas.length ? `${notas.length} ${notas.length === 1 ? "anotação registrada" : "anotações registradas"}.` : "Registre observações, comportamentos e lembretes do dia a dia."}</p></div>
    </div>
    <div className="btns two"><${Btn} v="secondary" small onClick=${() => go("saude", { aba: "notas" })}>Ver anotações<//><${Btn} small onClick=${() => go("novaNota")}>Adicionar anotação<//></div>
  </div>`;
}
function StatusPet({ pet }) {
  const s = STATUS_PET[pet.status || "aprovado"];
  return html`<${Badge} t=${s[0]} icon=${s[1]}>${s[2]}<//>`;
}
function AvisoStatusPet({ pet }) {
  const { go } = useApp();
  if (pet.status === "recusado") return html`<div className="card" style=${{ background: "var(--err-bg)" }}>
    <div className="row top-a" style=${{ alignItems: "flex-start" }}><span style=${{ color: "var(--err)" }}><${I} n="alert" s=${26} /></span><div className="grow"><h3>O cadastro ${doPet(pet)} não foi aprovado</h3><p className="small" style=${{ marginTop: 4 }}><b>Motivo:</b> ${pet.motivoRecusa}</p></div></div>
    <${Btn} icon="pencil" onClick=${() => go("cadastrarPet", { petId: pet.id })}>Corrigir e reenviar<//>
  </div>`;
  return html`<div className="card" style=${{ background: "var(--warn-bg)" }}>
    <div className="row top-a" style=${{ alignItems: "flex-start" }}><span style=${{ color: "var(--warn)" }}><${I} n="clock" s=${26} /></span><div className="grow"><h3>Cadastro em análise</h3><p className="small" style=${{ marginTop: 4 }}>Um administrador está conferindo os dados ${doPet(pet)}. O número e o QR são liberados após a aprovação. Até lá, nenhum veterinário consegue encontrar o pet.</p></div></div>
    <${Btn} v="secondary" small icon="pencil" onClick=${() => go("cadastrarPet", { petId: pet.id })}>Revisar dados enviados<//>
  </div>`;
}
function RegCard({ r, compact }) {
  const { st, go } = useApp();
  const a = userById(st, r.autorId); const T = TIPOS[r.tipo];
  return html`<div className="card row top-a" style=${{ flexDirection: "row", alignItems: "flex-start" }}>
    <${Tile} icon=${T.icon} sm />
    <div className="grow stack" style=${{ gap: 6 }}>
      <h3>${r.titulo}</h3>
      <p className="muted small">${a.nome} · ${fmtData(atual(r).data)} · Versão ${atual(r).n}</p>
      <${Badge} t="lock" icon="lock">Somente leitura<//>
      ${compact ? null : html`<p className="small muted" style=${{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>${atual(r).conteudo.orientacoes || atual(r).conteudo.prescricao}</p>`}
      <div><${Btn} v="secondary" small iconR="right" onClick=${() => go("registro", { rid: r.id })}>${T.ver}<//></div>
    </div>
  </div>`;
}

/* ---------- 06 Cadastrar pet ---------- */
function CadastrarPet({ p }) {
  const { st, user, mut, toast, tab, acao } = useApp();
  const orig = p && p.petId && petById(st, p.petId);
  const ed = orig && orig.tutorId === user.id ? orig : null;
  const [f, setF] = useState(() => ed ? { id: ed.id, nome: ed.nome, especie: ed.especie, raca: ed.raca, sexo: ed.sexo, nascimento: ed.nascimento, foto: ed.foto } : { nome: "", especie: "Cão", raca: "", sexo: "Macho", nascimento: "", foto: null });
  const [e, setE] = useState({}); const [geral, setGeral] = useState("");
  const [busy, run] = useBusy(); const fref = useRef(null);
  const set = (k) => (v) => { setF({ ...f, [k]: v }); setE({ ...e, [k]: "" }); };
  const salvar = () => {
    const x = {};
    if (!f.nome.trim()) x.nome = "Informe o nome do pet.";
    if (f.nascimento && new Date(f.nascimento) > new Date()) x.nascimento = "A data não pode estar no futuro.";
    setE(x); if (Object.keys(x).length) return;
    run(async () => {
      try { const p = await acao("cadastrarPet", f); toast(ed ? `Dados ${doPet(p)} atualizados.` : `${p.nome} foi vinculado à sua conta. Número ${fmtCod(p.codigo)}.`); tab("inicio"); }
      catch (er) { setGeral(er.message); }
    });
  };
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} c t=${ed ? "Editar pet" : "Cadastrar pet"} sub=${ed ? "Atualize os dados do seu pet." : "Preencha os dados do seu pet para vinculá-lo à sua conta."} />
    <input ref=${fref} type="file" accept="image/*" className="sr" id="pet-foto" onChange=${async (ev) => { const a = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (!a) return; try { set("foto")(await comprimirQuadrado(a)); } catch (er) { setGeral("Não foi possível usar essa imagem. Tente outro arquivo JPG ou PNG."); } }} />
    <div className="stack" style=${{ alignItems: "center" }}>
      <button type="button" className="clickable" style=${{ position: "relative", width: "auto", background: "none", padding: 0 }} onClick=${() => fref.current.click()} aria-label=${f.foto ? "Alterar foto do pet" : "Adicionar foto do pet"}>
        <${PetFoto} pet=${{ nome: f.nome || "Pet", foto: f.foto }} size=${150} />
        <span style=${{ position: "absolute", right: 8, bottom: 8, width: 40, height: 40, borderRadius: "50%", background: "var(--branco)", color: "var(--roxo)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}><${I} n="camera" s=${20} /></span>
      </button>
      <button type="button" className="btn btn-link" onClick=${() => fref.current.click()}>${f.foto ? "Alterar foto" : "Adicionar foto"}</button>
      ${f.foto ? html`<button type="button" className="btn btn-link" style=${{ color: "var(--txt2)", minHeight: 32, padding: 0 }} onClick=${() => set("foto")(null)}>Remover foto</button>` : null}
    </div>
    <form className="stack-12" onSubmit=${(ev) => { ev.preventDefault(); salvar(); }} noValidate>
      ${geral ? html`<div className="formerr" role="alert"><${I} n="alert" s=${20} />${geral}</div>` : null}
      <${Field} id="p-nome" label="Nome do pet" error=${e.nome}><${Inp} id="p-nome" value=${f.nome} onChange=${set("nome")} placeholder="Nome do seu pet" bad=${e.nome} /><//>
      <${Field} id="p-esp" label="Espécie"><${Sel} id="p-esp" value=${f.especie} onChange=${(v) => setF({ ...f, especie: v, raca: "" })} options=${["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"]} /><//>
      <${Field} id="p-raca" label="Raça" opt><input id="p-raca" className="inp" list="racas" value=${f.raca} onChange=${(ev) => set("raca")(ev.target.value)} placeholder="Ex.: Shih-tzu" /><datalist id="racas">${(RACAS[f.especie] || []).map((r) => html`<option key=${r} value=${r} />`)}</datalist><//>
      <${Field} id="p-sexo" label="Sexo"><${Sel} id="p-sexo" value=${f.sexo} onChange=${set("sexo")} options=${["Macho", "Fêmea", "Não informado"]} /><//>
      <${Field} id="p-nasc" label="Nascimento" opt error=${e.nascimento}><input id="p-nasc" type="date" className=${"inp" + (e.nascimento ? " bad" : "")} value=${f.nascimento} max=${new Date().toISOString().slice(0, 10)} onChange=${(ev) => set("nascimento")(ev.target.value)} /><//>
      <${Note} t="g" icon="info">${ed ? "As alterações valem para o cadastro deste pet." : html`O pet fica vinculado à sua conta (${user.email}) e recebe um número único e um QR.`}<//>
      <${Btn} type="submit" busy=${busy}>${ed ? "Salvar alterações" : "Vincular pet à minha conta"}<//>
    </form>
  </div>`;
}

/* ---------- 08 ID e QR ---------- */
function IdQr({ p }) {
  const { toast } = useApp();
  const pet = usePet(p); if (!pet) return html`<${SemPetAqui} />`;
  if (pet.status !== "aprovado" || !pet.codigo) return html`<div className="scr"><${Top} back right=${html`<span></span>`} /><${Title} c t=${"Identificação " + doPet(pet)} /><div className="stack" style=${{ alignItems: "center" }}><${PetFoto} pet=${pet} size=${120} round /></div><${AvisoStatusPet} pet=${pet} /></div>`;
  const txt = `tutô · ${pet.nome} · número do pet ${fmtCod(pet.codigo)}`;
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} c t=${"Identificação " + doPet(pet)} sub=${`Use este cartão para identificar ${oPet(pet)} no tutô.`} />
    <div className="stack" style=${{ alignItems: "center" }}><${PetFoto} pet=${pet} size=${140} round /><h2 style=${{ fontSize: 26 }}>${pet.nome}</h2><p className="muted" style=${{ marginTop: -8 }}>${pet.raca || pet.especie}</p></div>
    <div className="card white" style=${{ alignItems: "center", boxShadow: "0 12px 24px -18px rgba(66,25,142,.4)" }}>
      <${QR} text=${"TUTO-PET:" + pet.codigo} />
      <p className="meta">QR demonstrativo</p>
      <p className="muted">Número do pet</p>
      <p className="num" style=${{ fontSize: 34, fontWeight: 800, lineHeight: "40px", userSelect: "all" }}>${fmtCod(pet.codigo)}</p>
      <div className="btns two" style=${{ width: "100%" }}>
        <${Btn} v="soft" icon="copy" small onClick=${() => copiar(pet.codigo, toast, "Número copiado.")}>Copiar número<//>
        <${Btn} icon="share" small onClick=${() => copiar(txt, toast, "Cartão copiado para compartilhar.")}>Compartilhar cartão<//>
      </div>
    </div>
    <${Note} icon="info"><b className="purple">Este código identifica ${oPet(pet)}.</b><br />O acesso aos dados depende da sua autorização.<//>
  </div>`;
}

/* ---------- 09 / 33 Notificações ---------- */
function Notifs() {
  const { st, user, mut, acao } = useApp();
  const [aba, setAba] = useState("todas");
  const [novas] = useState(() => new Set(st.notifs.filter((n) => n.para === user.id && !n.lida).map((n) => n.id)));
  useEffect(() => { acao("lerNotifs", user.id).catch(() => {}); }, []);
  const acesso = ["solicitacao", "autorizado", "recusado", "revogado", "liberado"];
  const lista = st.notifs.filter((n) => n.para === user.id && (aba === "todas" || acesso.includes(n.tipo))).sort((a, b) => b.data.localeCompare(a.data));
  const vet = ehVet(user);
  return html`<div className="scr">
    <${Top} back logo=${vet ? "left" : "center"} right=${vet ? html`<span className="iconbtn dark" aria-hidden="true"><${I} n="bell" s=${26} /></span>` : html`<span></span>`} />
    <${Title} t="Notificações" sub=${vet ? "Acompanhe as últimas atualizações dos seus pacientes." : null} />
    <${Seg} label="Filtrar notificações" value=${aba} onChange=${setAba} options=${[{ v: "todas", t: "Todas" }, { v: "acessos", t: "Acessos" }]} />
    ${lista.length ? lista.map((n) => html`<${NotifCard} key=${n.id} n=${n} nova=${novas.has(n.id)} />`) : html`<${Empty} icon="bell" title="Nada por aqui">${aba === "acessos" ? "Pedidos e mudanças de acesso aparecem aqui." : "Avisos sobre seus pets e acessos aparecem aqui."}<//>`}
  </div>`;
}
function NotifCard({ n, nova }) {
  const { st, user, go } = useApp();
  const pet = n.petId && petById(st, n.petId);
  const vet = ehVet(user);
  const ver = vet && pet ? vetPodeLer(st, user.id, pet.id) : true;
  const nomePet = pet ? (vet && !ver ? "pet " + fmtCod(pet.codigo) : pet.nome) : "";
  const tutor = pet && userById(st, pet.tutorId);
  let icon = "bell", tile = null, t = "", s = "", acao = null, g = false;
  if (n.tipo === "solicitacao") {
    const sol = st.solicitacoes.find((x) => x.id === n.ref); const v = sol && userById(st, sol.vetId);
    icon = "vet"; t = "Solicitação de acesso"; s = `${v ? v.nome : "Um profissional"} quer acompanhar ${oPet(pet)}.`;
    acao = sol && sol.status === "pendente" ? html`<${Btn} iconR="right" onClick=${() => go("autorizar", { sid: sol.id })}>Analisar solicitação<//>`
      : html`<${Badge} t=${sol && sol.status === "aprovada" ? "ok" : "gray"}>${sol ? { aprovada: "Você autorizou", recusada: "Você recusou", cancelada: "Cancelada pelo profissional" }[sol.status] : "Encerrada"}<//>`;
  } else if (n.tipo === "petEnviado") {
    tile = html`<${PetFoto} pet=${pet} size=${88} />`; t = "Cadastro enviado"; s = `O cadastro ${doPet(pet)} está em análise por um administrador.`;
  } else if (n.tipo === "petRecusado") {
    icon = "alert"; t = "Cadastro não aprovado"; s = `O cadastro ${doPet(pet)} foi recusado. Motivo: ${pet.motivoRecusa || "não informado"}.`;
    acao = pet.status === "recusado" ? html`<${Btn} v="secondary" icon="pencil" onClick=${() => go("cadastrarPet", { petId: pet.id })}>Corrigir e reenviar<//>` : null;
  } else if (n.tipo === "contaAprovada") {
    icon = "checkC"; g = true; t = "Conta aprovada"; s = "Sua conta foi aprovada. Você já pode vincular seus pets.";
  } else if (n.tipo === "contaRecusada") {
    icon = "alert"; t = "Conta não aprovada"; s = `Motivo: ${user.motivoRecusa || "não informado"}.`;
  } else if (n.tipo === "vetRecusado") {
    icon = "alert"; t = "Cadastro profissional não aprovado"; s = `Motivo: ${user.motivoRecusa || "não informado"}.`;
  } else if (n.tipo === "pendencia") {
    const it = itensAdmin(st).find((i) => i.kind === n.kind && i.id === n.ref);
    icon = KIND[n.kind] ? KIND[n.kind][1] : "file"; t = "Novo cadastro para análise"; s = it ? `${KIND[n.kind][0]}: ${it.titulo}` : "Cadastro removido.";
    acao = it ? (it.status === "pendente" ? html`<${Btn} iconR="right" onClick=${() => go("aDetalhe", { kind: n.kind, id: n.ref })}>Analisar cadastro<//>` : html`<${Badge} t=${ST_ADM[it.status][0]}>${ST_ADM[it.status][2]}<//>`) : null;
  } else if (n.tipo === "cadastro") {
    tile = html`<${PetFoto} pet=${pet} size=${88} />`; t = "Cadastro aprovado"; s = `O número ${doPet(pet)} está disponível.`;
    acao = html`<${Btn} v="secondary" iconR="right" onClick=${() => go("idqr", { petId: pet.id })}>Ver identificação<//>`;
  } else if (n.tipo === "orientacao") {
    const r = st.registros.find((x) => x.id === n.ref); const a = r && userById(st, r.autorId);
    icon = "file"; t = "Nova orientação publicada"; s = r ? `${a.nome} publicou “${r.titulo}” para ${oPet(pet)}.` : "Orientação publicada.";
    acao = r ? html`<${Btn} v="secondary" iconR="right" onClick=${() => go("registro", { rid: r.id })}>Ver orientação<//>` : null;
  } else if (n.tipo === "autorizado") {
    tile = ver ? html`<${PetFoto} pet=${pet} size=${88} />` : null; icon = "vet"; t = "Acesso autorizado"; s = ver ? `${tutor.nome} liberou os dados ${doPet(pet)}.` : `O acesso ao ${nomePet} já não está ativo.`;
    acao = ver ? html`<${Btn} iconR="right" onClick=${() => go("prontuario", { petId: pet.id })}>Abrir prontuário<//>` : null;
  } else if (n.tipo === "recusado") {
    icon = "slash"; t = "Solicitação recusada"; s = `O tutor não autorizou o acesso ao ${nomePet}.`;
  } else if (n.tipo === "revogado") {
    icon = "lock"; t = "Acesso revogado"; s = `O tutor encerrou sua autorização ao ${nomePet}.`;
    acao = ver ? null : html`<${Btn} v="secondary" onClick=${() => go("revogado", { petId: pet.id })}>Ver detalhes<//>`;
  } else if (n.tipo === "nota") {
    g = true; icon = "notePen"; t = "Nova anotação do tutor"; s = ver ? `${tutor.nome} adicionou uma observação sobre ${oPet(pet)}.` : `Há uma anotação no ${nomePet}, mas seu acesso não está ativo.`;
    acao = ver ? html`<${Btn} v="mint" iconR="right" onClick=${() => go("nota", { nid: n.ref })}>Ler anotação<//>` : null;
  } else if (n.tipo === "publicada") {
    icon = "file"; t = "Orientação publicada"; s = "Seu registro foi disponibilizado ao tutor.";
    acao = ver ? html`<${Btn} v="secondary" small iconR="right" onClick=${() => go("prontuario", { petId: pet.id })}>Ver no prontuário<//>` : null;
  } else if (n.tipo === "liberado") {
    icon = "checkC"; g = true; t = "Perfil liberado"; s = "Sua verificação profissional foi concluída. Você já pode solicitar acesso a pets.";
  }
  return html`<div className=${"card" + (g ? " green" : "")} style=${{ position: "relative" }}>
    <div className="row top-a" style=${{ alignItems: "flex-start" }}>
      ${tile || html`<${Tile} icon=${icon} g=${g} />`}
      <div className="grow"><div className="row" style=${{ alignItems: "baseline" }}><h3 className="grow" style=${{ color: n.tipo === "autorizado" || n.tipo === "publicada" ? "var(--roxo)" : undefined }}>${t}</h3><span className="meta" style=${{ flex: "none" }}>${fmtRel(n.data)}</span></div><p className="muted" style=${{ marginTop: 4 }}>${s}</p></div>
    </div>
    ${acao ? html`<div>${acao}</div>` : null}
    ${nova ? html`<span style=${{ position: "absolute", top: 14, right: 14, width: 10, height: 10, borderRadius: "50%", background: "var(--roxo)" }} aria-label="Nova"></span>` : null}
  </div>`;
}

/* ---------- 10 Autorizar ---------- */
function Autorizar({ p }) {
  const { st, user, mut, toast, goBack, replace, acao } = useApp();
  const [busy, run] = useBusy(); const [qual, setQual] = useState(null);
  const s = st.solicitacoes.find((x) => x.id === p.sid);
  const pet = s && petById(st, s.petId);
  if (!s || !pet || pet.tutorId !== user.id) return html`<div className="scr"><${Top} back /><${Empty} icon="vet" title="Solicitação não encontrada">Ela pode ter sido cancelada pelo profissional.<//></div>`;
  const v = userById(st, s.vetId);
  const decidir = (ok) => { setQual(ok); run(async () => {
    try { await acao("decidir", s.id, ok); toast(ok ? `Acesso de ${v.nome} autorizado para ${pet.nome}.` : `Você recusou o acesso de ${v.nome}.`); replace("acessos", { petId: pet.id, aba: ok ? "ativos" : "pendentes" }); }
    catch (er) { toast(er.message); }
  }); };
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} c t="Autorizar acesso?" sub=${`${v.nome} solicitou acesso aos dados ${doPet(pet)}.`} />
    <${PetHead} pet=${pet} size=${100}><p className="muted">${pet.raca || pet.especie}</p><${Badge} icon="paw">ID do pet: ${fmtCod(pet.codigo)}<//><//>
    <div className="card row top-a" style=${{ flexDirection: "row", alignItems: "flex-start" }}>
      <${Tile} icon="vet" />
      <div className="grow stack" style=${{ gap: 4 }}>
        <h3 style=${{ fontSize: 20 }}>${v.nome}</h3>
        <p className="small muted">CRMV-${v.uf} ${v.crmv} · ${v.verificacao === "liberado" ? "perfil verificado (demonstrativo)" : "verificação pendente"}</p>
        <p className="small muted" style=${{ marginTop: 6 }}>Motivo</p>
        <p className="small" style=${{ background: "var(--soft-2)", borderRadius: 10, padding: "8px 12px" }}>${s.motivo}</p>
        <p className="meta">Pedido em ${fmtData(s.criadaEm)} às ${fmtHora(s.criadaEm)}</p>
      </div>
    </div>
    <div className="card">
      <h3>Ao autorizar, ${ela(v)} poderá:</h3>
      <div className="row"><${Tile} icon="file" sm /><span>Consultar o histórico ${doPet(pet)}</span></div>
      <div className="row"><${Tile} icon="notePen" sm /><span>Ver suas anotações</span></div>
      <div className="row"><${Tile} icon="steth" sm /><span>Adicionar orientações e editar apenas as próprias</span></div>
      <p className="small muted center">A autorização vale só para ${oPet(pet)}. Você pode revogar o acesso a qualquer momento.</p>
    </div>
    ${s.status === "pendente"
      ? html`<div className="btns"><${Btn} busy=${busy && qual === true} disabled=${busy} onClick=${() => decidir(true)}>Autorizar acesso<//><${Btn} v="secondary" busy=${busy && qual === false} disabled=${busy} onClick=${() => decidir(false)}>Recusar<//></div>`
      : html`<${Note} t=${s.status === "aprovada" ? "g" : ""} icon="info">${{ aprovada: "Você já autorizou esta solicitação.", recusada: "Você recusou esta solicitação.", cancelada: "O profissional cancelou esta solicitação." }[s.status]}<//>`}
  </div>`;
}

/* ---------- 11 Acessos ---------- */
function Acessos({ p }) {
  const { st, go } = useApp();
  const pet = usePet(p);
  const [aba, setAba] = useState(p.aba || "ativos");
  if (!pet) return html`<${SemPetAqui} />`;
  const ativos = vinculosAtivos(st, pet.id);
  const encerrados = st.vinculos.filter((v) => v.petId === pet.id && v.status === "revogado");
  const pend = st.solicitacoes.filter((s) => s.petId === pet.id && s.status === "pendente");
  return html`<div className="scr">
    <${Top} back logo="center" right=${html`<span></span>`} />
    <${Title} t=${"Acessos " + (pet.sexo === "Fêmea" ? "à " : "ao ") + pet.nome} sub="Veterinários que podem acessar os dados do seu pet." />
    <${PetSwitch} />
    <${PetHead} pet=${pet} size=${100}><p className="muted">${pet.raca || pet.especie}</p><${Badge} icon="checkC">Pet cadastrado<//><p className="small muted num">ID do pet: ${fmtCod(pet.codigo)}</p><//>
    <${Seg} label="Situação dos acessos" value=${aba} onChange=${setAba} options=${[{ v: "ativos", t: `Ativos (${ativos.length})` }, { v: "pendentes", t: `Pendentes (${pend.length})` }]} />
    ${aba === "ativos" ? html`
      ${ativos.length ? ativos.map((l) => { const v = userById(st, l.vetId); return html`<div className="card white" key=${l.id}>
        <div className="row"><${Tile} icon="vet" round /><div className="grow stack" style=${{ gap: 4 }}><h3 style=${{ fontSize: 20 }}>${v.nome}</h3><${Badge} icon="checkC">Acesso autorizado<//></div></div>
        <p className="small muted">Pode acessar desde ${fmtData(l.desde)}:</p>
        <div className="row"><${Tile} icon="file" sm /><span>Consultar histórico</span></div>
        <div className="row"><${Tile} icon="filePlus" sm /><span>Adicionar orientações próprias</span></div>
        <hr className="sep" />
        <div className="row wrap" style=${{ justifyContent: "space-between" }}>
          <button className="btn btn-link" onClick=${() => go("atividade", { petId: pet.id, vetId: v.id })}>Ver atividade <${I} n="right" s=${18} /></button>
          <${Btn} v="secondary" small onClick=${() => go("revogar", { petId: pet.id, vetId: v.id })}>Revogar acesso<//>
        </div>
      </div>`; }) : html`<${Empty} icon="users" title="Nenhum veterinário com acesso">Mostre o ID ou o QR ${doPet(pet)} ao veterinário. O pedido chega aqui para você decidir.<//>`}
      ${encerrados.length ? html`<h3>Acessos encerrados</h3>${encerrados.map((l) => { const v = userById(st, l.vetId); return html`<${Row} key=${l.id} icon="lock" title=${v.nome} sub=${`Revogado em ${fmtData(l.revogadoEm)}. Os registros publicados continuam no histórico.`} onClick=${() => go("atividade", { petId: pet.id, vetId: v.id })} />`; })}` : null}
    ` : pend.length ? pend.map((s) => { const v = userById(st, s.vetId); return html`<div className="card" key=${s.id}>
        <div className="row"><${Tile} icon="vet" /><div className="grow"><h3>${v.nome}</h3><p className="small muted">${s.motivo} · ${fmtRel(s.criadaEm)}</p></div></div>
        <${Btn} iconR="right" onClick=${() => go("autorizar", { sid: s.id })}>Analisar solicitação<//>
      </div>`; }) : html`<${Empty} icon="clock" title="Nenhum pedido pendente">Quando um veterinário pedir acesso, o pedido aparece aqui.<//>`}
    <div className="card green row" style=${{ flexDirection: "row" }}><${Tile} icon="shieldC" g /><div className="grow"><h3>Você controla os acessos</h3><p className="small" style=${{ color: "var(--txt-succ)" }}>Cada veterinário tem um vínculo próprio. As orientações já registradas permanecem no histórico ${doPet(pet)}.</p></div></div>
  </div>`;
}
function Atividade({ p }) {
  const { st, go } = useApp();
  const pet = usePet(p); if (!pet) return html`<${SemPetAqui} />`;
  const v = userById(st, p.vetId);
  const regs = publicados(st, pet.id).filter((r) => r.autorId === v.id);
  const sols = st.solicitacoes.filter((s) => s.petId === pet.id && s.vetId === v.id);
  const l = vinculoDe(st, pet.id, v.id);
  const ev = [
    ...sols.map((s) => ({ d: s.criadaEm, t: `Pediu acesso: ${s.motivo}` })),
    ...sols.filter((s) => s.decididaEm).map((s) => ({ d: s.decididaEm, t: { aprovada: "Você autorizou o acesso", recusada: "Você recusou o pedido", cancelada: "O profissional cancelou o pedido" }[s.status] })),
    ...regs.flatMap((r) => r.versoes.map((x) => ({ d: x.data, t: `${x.n === 1 ? "Publicou" : "Editou (versão " + x.n + ")"}: ${r.titulo}` }))),
    ...(l && l.revogadoEm ? [{ d: l.revogadoEm, t: "Você revogou o acesso" }] : []),
  ].sort((a, b) => b.d.localeCompare(a.d));
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${"Atividade de " + v.nome} sub=${`Tudo o que ${ela(v)} fez no perfil ${doPet(pet)}.`} />
    <div className="card white">${ev.length ? ev.map((e, i) => html`<div key=${i} className="row top-a" style=${{ alignItems: "flex-start" }}><span className="meta num" style=${{ width: 92, flex: "none", paddingTop: 2 }}>${fmtData(e.d)}</span><p className="small grow">${e.t}</p></div>`) : html`<p className="muted">Sem atividade registrada.</p>`}</div>
    ${regs.length ? html`<h3>Registros publicados</h3>${regs.map((r) => html`<${RegCard} key=${r.id} r=${r} compact />`)}` : null}
  </div>`;
}

/* ---------- 34 Confirmar revogação ---------- */
function Revogar({ p }) {
  const { st, mut, toast, replace, goBack, acao } = useApp();
  const [busy, run] = useBusy();
  const pet = usePet(p); if (!pet) return html`<${SemPetAqui} />`;
  const v = userById(st, p.vetId);
  const outros = vinculosAtivos(st, pet.id).filter((l) => l.vetId !== v.id).map((l) => userById(st, l.vetId).nome);
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t="Revogar acesso?" sub=${`Tem certeza que deseja revogar o acesso de ${v.nome} aos dados ${doPet(pet)}?`} />
    <${PetHead} pet=${pet} size=${100}><p className="muted">${pet.raca || pet.especie}</p><${Badge} icon="paw">ID do pet: ${fmtCod(pet.codigo)}<//><//>
    <div className="card row" style=${{ flexDirection: "row" }}><${Tile} icon="vet" round /><div><h3 style=${{ fontSize: 20 }}>${v.nome}</h3><p className="muted">${v.titulo}</p></div></div>
    <div className="card">
      <div className="row"><${Tile} icon="eyeOff" g round sm /><span>${ela(v) === "ela" ? "Ela" : ela(v) === "ele" ? "Ele" : "O profissional"} deixará de consultar os dados ${doPet(pet)}.</span></div>
      <div className="row"><${Tile} icon="notePen" g round sm /><span>Não poderá adicionar nem editar orientações.</span></div>
      <div className="row"><${Tile} icon="clock" g round sm /><span>O histórico já registrado será mantido.</span></div>
      ${outros.length ? html`<div className="row"><${Tile} icon="users" g round sm /><span>${outros.join(" e ")} ${outros.length > 1 ? "continuam" : "continua"} com acesso.</span></div>` : null}
    </div>
    <p className="small muted center">Uma nova autorização será necessária para retomar o acesso.</p>
    <div className="btns">
      <${Btn} onClick=${goBack} disabled=${busy}>Manter acesso<//>
      <${Btn} v="danger" busy=${busy} onClick=${() => run(async () => { try { await acao("revogar", pet.id, v.id); toast(`Acesso de ${v.nome} revogado.`); replace("acessos", { petId: pet.id }); } catch (er) { toast(er.message); } })}>Revogar acesso<//>
    </div>
  </div>`;
}

/* ---------- 12 Saúde (prontuário do tutor) ---------- */
function Saude({ p }) {
  const { st, user, go } = useApp();
  const pet = usePet(p);
  const [aba, setAba] = useState(p.aba || "vet");
  if (!pet) return html`<${SemPetAqui} />`;
  const regs = publicados(st, pet.id);
  const notas = st.notas.filter((n) => n.petId === pet.id).sort((a, b) => b.data.localeCompare(a.data));
  const cuid = st.cuidados.filter((c) => c.petId === pet.id).sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  const temDocs = regs.some((r) => r.tipo === "receita" || r.anexo);
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <div className="row top-a" style=${{ alignItems: "flex-start" }}>
      <div className="grow"><${Title} t=${"Saúde " + doPet(pet)} sub="Acompanhe o cuidado e o bem-estar do seu pet." /></div>
      <div className="stack center" style=${{ alignItems: "center", gap: 4 }}><${PetFoto} pet=${pet} size=${96} round /><p className="meta num">ID ${fmtCod(pet.codigo)}</p></div>
    </div>
    <${PetSwitch} />
    <${Seg} label="Tipo de registro" value=${aba} onChange=${setAba} options=${[{ v: "vet", t: "Veterinário", icon: "steth" }, { v: "notas", t: "Minhas anotações", icon: "notePen" }]} />
    ${aba === "vet" ? html`
      ${regs.length ? regs.map((r) => html`<${RegCard} key=${r.id} r=${r} />`) : html`<${Empty} title="Nenhuma orientação veterinária ainda.">As orientações aparecerão após a autorização e a publicação pelo profissional.<//>`}
      <${Row} icon="file" title="Receitas e documentos" sub=${temDocs ? "Acesse os documentos emitidos pelos veterinários." : "Nenhum documento emitido ainda."} onClick=${() => go("documentos", { petId: pet.id })} />
      <div className="card green row" style=${{ flexDirection: "row" }}><${Tile} icon="notePen" g /><div className="grow"><h3>Suas observações</h3><p className="small">Registre algo novo sem alterar o prontuário veterinário.</p></div></div>
      <${Btn} onClick=${() => go("novaNota", { petId: pet.id })}>Adicionar anotação<//>
    ` : html`
      <${Btn} icon="plus" onClick=${() => go("novaNota", { petId: pet.id })}>Nova anotação<//>
      ${notas.length ? notas.map((n) => html`<${NotaCard} key=${n.id} n=${n} />`) : html`<${Empty} icon="notePen" title="Nenhuma anotação ainda">Suas anotações ficam separadas dos registros veterinários.<//>`}
      ${cuid.length ? html`<h3>Cuidados registrados</h3>${cuid.slice(0, 8).map((c) => { const r = st.registros.find((x) => x.id === c.registroId); return html`<${Row} key=${c.id} icon=${c.resultado === "Realizado" ? "checkC" : c.resultado === "Não realizado" ? "x" : "alert"} g=${c.resultado === "Realizado"} title=${`${r ? TIPOS[r.tipo].rotina || r.titulo : "Cuidado"} · ${c.resultado}`} sub=${`${fmtData(c.dataHora)} às ${fmtHora(c.dataHora)}${c.obs ? " · " + c.obs : ""}`} />`; })}` : null}
    `}
  </div>`;
}
function NotaCard({ n }) {
  const { st, go } = useApp();
  const vets = (n.notificar || []).map((id) => userById(st, id).nome);
  return html`<button className="card green clickable" onClick=${() => go("nota", { nid: n.id })}>
    <div className="row"><${Tile} icon="notePen" g sm /><div className="grow"><h3 style=${{ fontSize: 17 }}>${n.titulo || n.categoria}</h3><p className="meta">${n.categoria} · ${fmtData(n.data)}</p></div><span className="chev"><${I} n="right" /></span></div>
    <p className="small" style=${{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>${n.descricao}</p>
    <div className="row wrap" style=${{ gap: 6 }}><${Badge} icon="user">Registro do tutor<//>${vets.length ? html`<${Badge} t="soft" icon="bell">Avisado: ${vets.join(", ")}<//>` : null}${n.anexo ? html`<${Badge} t="soft" icon="clip">${n.anexo.nome}<//>` : null}</div>
  </button>`;
}
function NotaView({ p }) {
  const { st, user } = useApp();
  const n = st.notas.find((x) => x.id === p.nid);
  if (!n || !podeLerPet(st, user, n.petId)) return html`<${SemAcessoGenerico} />`;
  const pet = petById(st, n.petId); const a = userById(st, n.autorId);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${n.titulo || n.categoria} sub=${`Anotação do tutor sobre ${oPet(pet)}`} />
    <div className="card green">
      <div className="row wrap" style=${{ gap: 6 }}><${Badge} icon="user">Registro do tutor<//><${Badge} t="soft">${n.categoria}<//></div>
      <p className="pre" style=${{ userSelect: "text" }}>${n.descricao || "Sem descrição."}</p>
      ${n.anexo ? html`<div className="row"><${I} n="clip" s=${20} /><span className="small">${n.anexo.nome} · ${kb(n.anexo.tamanho)}</span></div>` : null}
      <p className="meta">${a.nome} · ${fmtData(n.data)} às ${fmtHora(n.data)}</p>
    </div>
    ${ehVet(user) ? html`<${Note} icon="lock">Anotações do tutor são somente leitura para veterinários e ficam separadas dos registros clínicos.<//>` : html`<${Note} icon="info">Esta anotação fica separada dos registros veterinários.${n.notificar && n.notificar.length ? " Avisamos " + n.notificar.map((id) => userById(st, id).nome).join(" e ") + "." : " Nenhum veterinário foi avisado."}<//>`}
  </div>`;
}
function SemAcessoGenerico() {
  return html`<div className="scr"><${Top} back /><${Empty} icon="lock" title="Conteúdo indisponível">Você não tem acesso a este conteúdo ou ele foi removido.<//></div>`;
}

/* ---------- 13 / 14 / 15 Registro visto pelo tutor ---------- */
function RegistroTutor({ p }) {
  const { st, user, go, toast, mut } = useApp();
  const r = st.registros.find((x) => x.id === p.rid);
  if (!r || r.status !== "publicado" || !podeLerPet(st, user, r.petId)) return html`<${SemAcessoGenerico} />`;
  const pet = petById(st, r.petId); const a = userById(st, r.autorId); const v = atual(r); const c = v.conteudo;
  const ativo = vetPodeLer(st, a.id, pet.id);
  const lockNote = html`<${Note} icon="lock">Somente ${a.nome} pode editar esta orientação.${ativo ? "" : " O acesso foi encerrado; o registro permanece no histórico."}<//>`;
  const autorBox = html`<div className="row wrap" style=${{ gap: 8 }}>
    <div className="row" style=${{ background: "var(--branco)", borderRadius: 14, padding: "8px 12px", gap: 8 }}><${I} n="user" s=${22} style=${{ color: "var(--roxo)" }} /><div><p className="lbl">${a.nome}</p><p className="meta">Versão ${v.n} · ${fmtData(v.data)}</p></div></div>
    <${Badge} t="soft" icon="lock">Somente leitura<//>
  </div>`;
  if (r.tipo === "receita") {
    return html`<div className="scr">
      <${Top} back right=${html`<span></span>`} />
      <${Title} t=${r.titulo || "Receita " + doPet(pet)} />
      <${PetHead} pet=${pet} size=${92} round><p className="muted small">${pet.raca || pet.especie}</p><p className="small muted num">ID do pet: ${fmtCod(pet.codigo)}</p><p className="small muted">Responsável: ${user.nome}</p><//>
      <div className="doc">
        <div className="dhead"><${Logo} w=${96} /><div><p className="dtitle">RECEITA VETERINÁRIA</p><p className="meta" style=${{ textAlign: "right" }}>Documento de uso veterinário</p></div></div>
        <div className="small"><p><span className="muted">Paciente:</span> <b>${pet.nome}</b></p><p><span className="muted">Responsável:</span> <b>${userById(st, pet.tutorId).nome}</b></p><p><span className="muted">${fem(a) ? "Veterinária" : "Veterinário"}:</span> <b>${a.nome}</b> · CRMV-${a.uf} ${a.crmv}</p><p><span className="muted">Emitida em:</span> ${fmtData(v.data)}</p></div>
        <span className="stamp" aria-hidden="true">EXEMPLO VISUAL</span>
        <p className="purple" style=${{ fontWeight: 800 }}>Prescrição</p><p className="box">${c.prescricao || "—"}</p>
        <p className="purple" style=${{ fontWeight: 800 }}>Orientações</p><p className="box">${c.orientacoes || "—"}</p>
        ${r.anexo ? html`<p className="small"><${I} n="clip" s=${16} /> ${r.anexo.nome}</p>` : null}
      </div>
      <${Note} icon="lock"><b>Documento do veterinário · somente leitura</b><br />Exemplo visual sem validade de prescrição. Apenas quem emitiu pode editar. Versões anteriores são preservadas.<//>
      <div className="btns two">
        <${Btn} icon="download" small onClick=${() => toast("O download do documento autenticado chega com a emissão oficial. Neste protótipo a receita é apenas visual.")}>Baixar documento<//>
        <${Btn} v="secondary" icon="share" small onClick=${() => toast("Compartilhamento disponível na versão conectada.")}>Compartilhar<//>
      </div>
      <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => go("versoes", { rid: r.id })}>Versão ${v.n} · ver histórico</button>
    </div>`;
  }
  if (r.tipo === "alimentar") return html`<${PlanoAlimentar} r=${r} pet=${pet} a=${a} autorBox=${autorBox} />`;
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${r.titulo} sub=${r.tipo === "avaliacao" ? "Registro clínico no perfil do tutor" : "Orientação veterinária no perfil do tutor"} />
    <div className="card petcard" style=${{ flexDirection: "row", alignItems: "flex-start" }}>
      <${PetFoto} pet=${pet} size=${92} />
      <div className="grow stack" style=${{ gap: 6 }}><h2>${pet.nome}</h2><p className="muted small num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p>${autorBox}</div>
    </div>
    <div className="card">
      <div className="row"><${Tile} icon=${TIPOS[r.tipo].icon} sm /><div className="grow"><h3>Orientações do veterinário</h3></div></div>
      <p className="pre" style=${{ userSelect: "text" }}>${c.orientacoes}</p>
      ${c.administracao ? html`<hr className="sep" /><div className="row"><${Tile} icon="pill" g round sm /><div><p className="lbl" style=${{ fontWeight: 700 }}>Administração</p><p className="small muted">${c.administracao}</p></div></div>` : null}
      ${c.duracao ? html`<hr className="sep" /><div className="row"><${Tile} icon="calendar" g round sm /><div><p className="lbl" style=${{ fontWeight: 700 }}>Duração</p><p className="small muted">${c.duracao}</p></div></div>` : null}
      ${r.retorno ? html`<hr className="sep" /><div className="row"><${Tile} icon="clock" g round sm /><div><p className="lbl" style=${{ fontWeight: 700 }}>Revisão / retorno</p><p className="small muted">${fmtData(r.retorno + "T12:00")}</p></div></div>` : null}
      ${r.anexo ? html`<hr className="sep" /><div className="row"><${Tile} icon="clip" round sm /><p className="small">${r.anexo.nome} · ${kb(r.anexo.tamanho)}</p></div>` : null}
      ${lockNote}
    </div>
    ${r.tipo === "tratamento" ? html`<div className="btns">
      <${Btn} icon="heart" onClick=${() => go("registrarCuidado", { rid: r.id })}>Registrar cuidado<//>
      <${Btn} v="secondary" icon="filePlus" onClick=${() => go("novaNota", { petId: pet.id, ref: r.id })}>Adicionar observação<//>
    </div>` : null}
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => go("versoes", { rid: r.id })}>${r.versoes.length > 1 ? "Ver versões anteriores" : "Ver histórico de versões"} <${I} n="right" s=${18} /></button>
  </div>`;
}
function PlanoAlimentar({ r, pet, a, autorBox }) {
  const { mut, toast, go, acao } = useApp();
  const [txt, setTxt] = useState(""); const [err, setErr] = useState(""); const [busy, run] = useBusy();
  const [chave] = useState(() => uid("k"));
  const c = atual(r).conteudo;
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${"Alimentação " + doPet(pet)} />
    <div className="card petcard" style=${{ flexDirection: "row", alignItems: "flex-start" }}>
      <${PetFoto} pet=${pet} size=${92} />
      <div className="grow stack" style=${{ gap: 6 }}><h2>${pet.nome}</h2><p className="muted small num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p><${Badge} t="soft" icon="file">Orientação veterinária<//>${autorBox}</div>
    </div>
    <div className="card">
      <div className="row"><span className="purple"><${I} n="utensils" s=${30} /></span><h2>${r.titulo}</h2></div>
      <div className="kv"><div className="k">Alimento</div><div className="v">${c.alimento || "—"}</div><div className="k">Quantidade</div><div className="v">${c.quantidade || "—"}</div><div className="k">Frequência</div><div className="v">${c.frequencia || "—"}</div></div>
      ${c.orientacoes ? html`<p className="small pre">${c.orientacoes}</p>` : null}
      <p className="meta">Somente ${a.nome} pode editar este plano.</p>
    </div>
    <div className="card green">
      <div className="row"><span style=${{ color: "var(--txt-succ)" }}><${I} n="notePen" s=${30} /></span><div><h3 style=${{ fontSize: 20 }}>Meu acompanhamento</h3><p className="small muted">Seu registro complementa o plano.</p></div></div>
      <${Field} id="alim-obs" label="Como foi a alimentação?" error=${err}><${Area} id="alim-obs" value=${txt} onChange=${(v) => { setTxt(v); setErr(""); }} placeholder="Conte ao veterinário" rows=${3} bad=${err} /><//>
      <${Btn} v="secondary" icon="pencil" busy=${busy} onClick=${() => { if (!txt.trim()) { setErr("Escreva sua observação antes de registrar."); return; } run(async () => { try { await acao("novaNota", { chave, petId: pet.id, categoria: "Alimentação", titulo: "Acompanhamento da alimentação", descricao: txt, notificar: false, ref: r.id }); setTxt(""); toast("Observação registrada nas suas anotações."); } catch (er) { setErr(er.message); } }); }}>Registrar observação<//>
    </div>
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => go("versoes", { rid: r.id })}>Ver histórico de versões <${I} n="right" s=${18} /></button>
  </div>`;
}
function Versoes({ p }) {
  const { st, user } = useApp();
  const r = st.registros.find((x) => x.id === p.rid);
  if (!r || r.status !== "publicado" || !podeLerPet(st, user, r.petId)) return html`<${SemAcessoGenerico} />`;
  const a = userById(st, r.autorId);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Histórico de versões" sub=${`${r.titulo} · ${autorRot(a)}: ${a.nome}`} />
    <div className="card white stack-12">
      ${[...r.versoes].reverse().map((v, i) => html`<div key=${v.n} className=${"ver" + (i === 0 ? " cur" : "")}>
        <div className="row wrap" style=${{ gap: 8 }}><b>Versão ${v.n}</b>${i === 0 ? html`<${Badge} t="soft">Atual<//>` : null}<span className="meta">${fmtData(v.data)} às ${fmtHora(v.data)}</span></div>
        <p className="small muted">Motivo: ${v.motivo}</p>
        <p className="small pre">${v.conteudo.orientacoes || v.conteudo.prescricao}</p>
      </div>`)}
    </div>
    <${Note} icon="info">Toda edição gera uma nova versão com data, autor e motivo. Versões anteriores não são apagadas.<//>
  </div>`;
}
function Documentos({ p }) {
  const { st, user, go } = useApp();
  const pet = usePet(p); if (!pet) return html`<${SemPetAqui} />`;
  const docs = publicados(st, pet.id).filter((r) => r.tipo === "receita" || r.anexo);
  const anexosNotas = st.notas.filter((n) => n.petId === pet.id && n.anexo);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Receitas e documentos" sub=${`Documentos emitidos para ${oPet(pet)}.`} />
    ${docs.length ? docs.map((r) => html`<${Row} key=${r.id} icon=${r.tipo === "receita" ? "fileHeart" : "clip"} title=${r.tipo === "receita" ? r.titulo : r.anexo.nome} sub=${`${userById(st, r.autorId).nome} · ${fmtData(atual(r).data)}`} onClick=${() => go("registro", { rid: r.id })} />`) : html`<${Empty} icon="folder" title="Nenhum documento ainda">Receitas e anexos publicados pelos veterinários aparecem aqui.<//>`}
    ${anexosNotas.length ? html`<h3>Seus arquivos</h3>${anexosNotas.map((n) => html`<${Row} key=${n.id} icon="image" g title=${n.anexo.nome} sub=${`Anexado em “${n.titulo}”`} onClick=${() => go("nota", { nid: n.id })} />`)}` : null}
  </div>`;
}

/* ---------- 16 Rotina ---------- */
function Rotina() {
  const { st, user, go } = useApp();
  const pet = petAtivo(st, user);
  const [off, setOff] = useState(0); const [aba, setAba] = useState("pend");
  if (!pet) return html`<div className="scr"><${Top} logo="left" bell /><${Title} t="Rotina" /><${Empty} icon="calendar" title="Cadastre um pet" action=${html`<${Btn} onClick=${() => go("cadastrarPet")}>Cadastrar meu pet<//>`}>A rotina mostra os cuidados do dia orientados pelo veterinário.<//></div>`;
  const alvo = new Date(); alvo.setDate(alvo.getDate() + off);
  const itens = publicados(st, pet.id).filter((r) => r.tipo === "tratamento" || r.tipo === "alimentar");
  const feito = (r) => st.cuidados.find((c) => c.registroId === r.id && dia(c.dataHora) === dia(alvo.toISOString()));
  const pend = itens.filter((r) => !feito(r)); const conc = itens.filter((r) => feito(r));
  const rot = off === 0 ? "Hoje" : off === -1 ? "Ontem" : `${alvo.getDate()} de ${MES[alvo.getMonth()]}`;
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <div className="row top-a" style=${{ alignItems: "flex-start" }}>
      <div className="grow"><${Title} t=${"Rotina " + doPet(pet)} sub="Acompanhe e registre os cuidados do dia a dia." /></div>
      <${PetFoto} pet=${pet} size=${96} round />
    </div>
    <${PetSwitch} />
    <div className="row" style=${{ justifyContent: "center", background: "var(--soft)", borderRadius: 999, padding: 4, alignSelf: "center", gap: 4 }}>
      <button className="iconbtn" onClick=${() => setOff(off - 1)} aria-label="Dia anterior"><${I} n="left" /></button>
      <span className="row purple" style=${{ fontWeight: 800, gap: 8, minWidth: 110, justifyContent: "center" }} aria-live="polite"><${I} n="calendar" s=${22} />${rot}</span>
      <button className="iconbtn" onClick=${() => setOff(Math.min(0, off + 1))} disabled=${off === 0} aria-label="Próximo dia" style=${{ opacity: off === 0 ? 0.35 : 1 }}><${I} n="right" /></button>
    </div>
    <${Seg} label="Situação dos cuidados" value=${aba} onChange=${setAba} options=${[{ v: "pend", t: `Pendentes (${pend.length})` }, { v: "conc", t: `Concluídos (${conc.length})` }]} />
    ${!itens.length ? html`<${Empty} icon="calendar" title="Nenhum cuidado orientado ainda">A rotina aparece quando um veterinário autorizado publicar um tratamento ou plano alimentar.<//>` : null}
    ${(aba === "pend" ? pend : conc).map((r, i) => { const a = userById(st, r.autorId); const T = TIPOS[r.tipo]; const f = feito(r); return html`<div className="card" key=${r.id}>
      <div className="row top-a" style=${{ alignItems: "flex-start" }}>
        <${Tile} icon=${T.rIcon} />
        <div className="grow stack" style=${{ gap: 4 }}>
          <h3 style=${{ fontSize: 20 }}>${T.rotina}</h3><p className="muted small">${r.titulo} · ${a.nome}</p>
          <${Badge} t="soft" icon="paw">Orientação veterinária<//>
          ${f ? html`<${Badge} t=${f.resultado === "Realizado" ? "ok" : "warn"} icon=${f.resultado === "Realizado" ? "checkC" : "alert"}>${f.resultado} · ${fmtHora(f.dataHora)}<//>` : null}
        </div>
      </div>
      <div className="row wrap" style=${{ justifyContent: "space-between" }}>
        <button className="btn btn-link" onClick=${() => go("registro", { rid: r.id })}>${r.tipo === "alimentar" ? "Ver plano" : "Consultar orientação"} <${I} n="right" s=${18} /></button>
        ${f ? null : html`<${Btn} v=${i === 0 ? "primary" : "secondary"} small onClick=${() => go("registrarCuidado", { rid: r.id, off })}>Registrar<//>`}
      </div>
    </div>`; })}
    <div className="card green">
      <div className="row top-a" style=${{ alignItems: "flex-start" }}><${Tile} icon="notePen" g /><div className="grow stack" style=${{ gap: 4 }}><h3 style=${{ fontSize: 20 }}>Observação diária</h3><${Badge} icon="user">Criado por você<//><p className="small muted">Registre como ${oPet(pet)} está hoje, seus comportamentos e observações.</p></div></div>
      <${Btn} v="secondary" small onClick=${() => go("novaNota", { petId: pet.id })}>Adicionar anotação<//>
    </div>
    <${Row} icon="pin" title=${"Passeios " + doPet(pet)} sub="Em breve: percurso registrado pelo celular." onClick=${() => go("passeios")} />
  </div>`;
}

/* ---------- 17 Registrar cuidado ---------- */
function RegistrarCuidado({ p }) {
  const { st, user, mut, toast, goBack, go, acao } = useApp();
  const r = st.registros.find((x) => x.id === p.rid);
  const base = new Date(); if (p.off) { base.setDate(base.getDate() + p.off); base.setHours(8, 0, 0, 0); }
  const [res, setRes] = useState(""); const [dh, setDh] = useState(localInput(base)); const [obs, setObs] = useState("");
  const [err, setErr] = useState({}); const [busy, run] = useBusy(); const [chave] = useState(() => uid("k"));
  if (!r || !podeLerPet(st, user, r.petId)) return html`<${SemAcessoGenerico} />`;
  const pet = petById(st, r.petId); const a = userById(st, r.autorId);
  const salvar = () => {
    const x = {}; if (!res) x.res = "Escolha o que aconteceu."; if (!dh) x.dh = "Informe a data e o horário."; else if (new Date(dh) > new Date()) x.dh = "O horário não pode estar no futuro.";
    setErr(x); if (Object.keys(x).length) return;
    run(async () => { try { await acao("registrarCuidado", { chave, petId: pet.id, registroId: r.id, resultado: res, dataHora: new Date(dh).toISOString(), obs }); toast("Registro salvo. A orientação veterinária não foi alterada."); goBack(); } catch (er) { setErr({ geral: er.message }); } });
  };
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t="Registrar cuidado" sub="Registre se o cuidado foi realizado e, se quiser, adicione uma observação." />
    <div className="card petcard" style=${{ flexDirection: "row", alignItems: "flex-start" }}>
      <${PetFoto} pet=${pet} size=${84} />
      <div className="grow stack" style=${{ gap: 8 }}>
        <h3 style=${{ fontSize: 20 }}>${TIPOS[r.tipo].rotina || r.titulo} · ${pet.nome}</h3>
        <div className="row" style=${{ background: "var(--branco)", borderRadius: 12, padding: 10, alignItems: "flex-start" }}><span className="purple"><${I} n="lock" s=${22} /></span><p className="small"><b>Orientação de ${a.nome}</b><br /><span className="muted">Esta é uma orientação veterinária. Apenas leitura.</span></p></div>
        <${Btn} v="secondary" small icon="file" iconR="right" onClick=${() => go("registro", { rid: r.id })}>Ver orientação<//>
      </div>
    </div>
    ${err.geral ? html`<div className="formerr" role="alert">${err.geral}</div>` : null}
    <fieldset style=${{ border: 0, padding: 0, margin: 0 }} className="stack">
      <legend className="h3" style=${{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>O que aconteceu?</legend>
      ${["Realizado", "Não realizado", "Tive dificuldade"].map((o) => html`<label key=${o} className=${"opt-row" + (res === o ? " on" : "")}><input type="radio" name="res" value=${o} checked=${res === o} onChange=${() => { setRes(o); setErr({ ...err, res: "" }); }} />${o}</label>`)}
      ${err.res ? html`<p className="err" role="alert">${err.res}</p>` : null}
    </fieldset>
    <${Field} id="rc-dh" label="Data e horário" error=${err.dh}><input id="rc-dh" type="datetime-local" className=${"inp" + (err.dh ? " bad" : "")} value=${dh} max=${localInput(new Date())} onChange=${(e) => setDh(e.target.value)} /><//>
    <${Field} id="rc-obs" label="Observação para o veterinário" opt><${Area} id="rc-obs" value=${obs} onChange=${setObs} placeholder="Conte como foi" rows=${3} /><//>
    <${Btn} busy=${busy} onClick=${salvar}>Salvar registro<//>
    <p className="foot"><${I} n="info" s=${18} />Este registro não altera a orientação veterinária.</p>
  </div>`;
}

/* ---------- 18 Nova anotação ---------- */
function NovaNota({ p }) {
  const { st, mut, toast, goBack, acao } = useApp();
  const pet = usePet(p);
  const [f, setF] = useState({ categoria: p.ref ? "Saúde" : "Comportamento", titulo: "", descricao: "", anexo: null, notificar: false });
  const [err, setErr] = useState({}); const [busy, run] = useBusy(); const [chave] = useState(() => uid("k")); const fref = useRef(null);
  if (!pet) return html`<${SemPetAqui} />`;
  const vets = vinculosAtivos(st, pet.id).map((l) => userById(st, l.vetId));
  const set = (k) => (v) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: "" }); };
  const salvar = () => {
    const x = {}; if (!f.titulo.trim()) x.titulo = "Dê um título curto para a anotação."; if (!f.descricao.trim()) x.descricao = "Descreva o que você percebeu.";
    setErr(x); if (Object.keys(x).length) return;
    run(async () => { try { await acao("novaNota", { ...f, chave, petId: pet.id, ref: p.ref }); toast(f.notificar && vets.length ? `Anotação salva. Avisamos ${vets.map((v) => v.nome).join(" e ")}.` : "Anotação salva. Nenhum veterinário foi avisado."); goBack(); } catch (er) { setErr({ geral: er.message }); } });
  };
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Nova anotação" sub=${`Registre uma observação sobre ${oPet(pet)}.`} />
    <${PetHead} pet=${pet} size=${96}><p className="muted small num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p><${Badge} icon="user">Registro do tutor<//><//>
    ${err.geral ? html`<div className="formerr" role="alert">${err.geral}</div>` : null}
    <${Field} id="nn-cat" label="Categoria"><${Sel} id="nn-cat" value=${f.categoria} onChange=${set("categoria")} options=${["Comportamento", "Alimentação", "Saúde", "Medicação", "Higiene", "Outro"]} /><//>
    <${Field} id="nn-tit" label="Título" error=${err.titulo}><${Inp} id="nn-tit" icon="file" value=${f.titulo} onChange=${set("titulo")} placeholder="O que você percebeu?" bad=${err.titulo} maxLength=${80} /><//>
    <${Field} id="nn-desc" label="Descrição" error=${err.descricao}><${Area} id="nn-desc" value=${f.descricao} onChange=${set("descricao")} placeholder=${"Conte sua observação sobre " + oPet(pet)} bad=${err.descricao} /><//>
    <input ref=${fref} type="file" className="sr" id="nn-arq" onChange=${(e) => { const a = e.target.files && e.target.files[0]; e.target.value = ""; if (!a) return; if (a.size > 10 * 1048576) { setErr({ ...err, anexo: "O arquivo passa de 10 MB. Escolha um arquivo menor." }); return; } set("anexo")({ nome: a.name, tamanho: a.size, tipo: a.type }); }} />
    <button type="button" className="clickable card tight row" style=${{ flexDirection: "row", background: "var(--branco)", border: "2px dashed #C9B4F2" }} onClick=${() => fref.current.click()}>
      <span className="purple"><${I} n=${f.anexo ? "checkC" : "image"} s=${30} /></span>
      <div className="grow"><p className="purple" style=${{ fontWeight: 800 }}>${f.anexo ? f.anexo.nome : "Adicionar foto ou arquivo"}</p><p className="small muted">${f.anexo ? kb(f.anexo.tamanho) + " · anexado (simulado: o arquivo não sai do seu navegador)" : "JPG, PNG, PDF ou outro formato, até 10 MB"}</p></div>
      ${f.anexo ? html`<span className="iconbtn" role="button" aria-label="Remover anexo" onClick=${(e) => { e.stopPropagation(); set("anexo")(null); }}><${I} n="x" /></span>` : null}
    </button>
    ${err.anexo ? html`<p className="err" role="alert">${err.anexo}</p>` : null}
    <div className="card tight row" style=${{ flexDirection: "row" }}>
      <${Toggle} id="nn-not" on=${f.notificar && vets.length > 0} disabled=${!vets.length} onChange=${set("notificar")} label="Notificar veterinário autorizado" />
      <label htmlFor="nn-not" className="grow"><p style=${{ fontWeight: 800 }}>Notificar veterinário autorizado</p><p className="small muted">${!vets.length ? "Nenhum veterinário com acesso ativo." : f.notificar ? `${vets.map((v) => v.nome).join(" e ")} ${vets.length > 1 ? "serão avisados" : "será avisado(a)"}.` : `Ative para notificar ${vets.map((v) => v.nome).join(" e ")}.`}</p></label>
    </div>
    <${Btn} busy=${busy} onClick=${salvar}>Salvar anotação<//>
    <p className="foot"><${I} n="info" s=${18} />Fica separada dos registros veterinários.</p>
  </div>`;
}

/* ---------- 19 Perfil ---------- */
function Perfil() {
  const { user, go, mut, tab, acao } = useApp();
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t="Meu perfil" sub="Gerencie sua conta e preferências." />
    <button className="card clickable row" style=${{ flexDirection: "row" }} onClick=${() => go("conta")}>
      <span className="ic-tile round" style=${{ width: 80, height: 80, fontSize: 36, fontWeight: 800 }}>${user.nome.charAt(0)}</span>
      <div className="grow"><h2>${user.nome}</h2><p className="muted">Tutor</p></div><span className="chev"><${I} n="right" /></span>
    </button>
    <${Row} tile=${html`<${PetFoto} pet=${null} size=${56} />`} title="Meus pets" sub="Veja e vincule pets à sua conta." onClick=${() => go("meusPets")} />
    <${Row} icon="user" title="Dados da conta" sub="Gerencie suas informações." onClick=${() => go("conta")} />
    <${Row} icon="bell" title="Notificações" sub="Escolha o que você quer receber." onClick=${() => go("prefs")} />
    <${Row} icon="users" title="Veterinários autorizados" sub="Veja e gerencie os veterinários com acesso." onClick=${() => go("acessos")} />
    <${Row} icon="shield" title="Privacidade" sub="Controle seus dados e permissões." onClick=${() => go("privacidade")} />
    <${Row} icon="help" title="Ajuda" sub="Dúvidas e suporte." onClick=${() => go("ajuda")} />
    <${Btn} v="secondary" icon="logout" onClick=${() => acao("sair").catch(() => {})}>Sair da conta<//>
  </div>`;
}
function MeusPets() {
  const { st, user, go, mut, tab } = useApp();
  const ps = petsDoTutor(st, user.id);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Meus pets" sub=${`Pets vinculados à sua conta (${user.email}). Cada um tem número, QR e autorizações próprios.`} />
    ${ps.map((p) => html`<button key=${p.id} className="card clickable row" style=${{ flexDirection: "row" }} onClick=${() => { mut((d) => { d.session.petId = p.id; }); tab("inicio"); }}>
      <${PetFoto} pet=${p} size=${72} />
      <div className="grow"><h3 style=${{ fontSize: 20 }}>${p.nome}</h3><p className="small muted num">${p.raca || p.especie} · ID ${fmtCod(p.codigo)}</p><${StatusPet} pet=${p} /></div>
      <span className="chev"><${I} n="right" /></span>
    </button>`)}
    <${Btn} icon="plus" onClick=${() => go("cadastrarPet")}>Vincular outro pet<//>
  </div>`;
}
function Conta() {
  const { user, toast } = useApp();
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Dados da conta" />
    <div className="kv" style=${{ boxShadow: "0 0 0 1px var(--b-sub)" }}>
      <div className="k">Nome</div><div className="v">${user.nome}</div>
      <div className="k">E-mail</div><div className="v">${user.email}</div>
      <div className="k">Perfil</div><div className="v">${ehVet(user) ? "Veterinário" : "Tutor"}</div>
      ${ehVet(user) ? html`<div className="k">CRMV</div><div className="v">${user.crmv}-${user.uf}</div>` : null}
      <div className="k">Conta criada</div><div className="v">${fmtData(user.criadoEm)}</div>
    </div>
    <${Btn} v="secondary" onClick=${() => toast("A edição de dados chega na versão conectada.")}>Editar dados<//>
  </div>`;
}
function Prefs() {
  const { user, mut, acao, toast } = useApp();
  const pr = user.prefs || {};
  const it = [["acessos", "Pedidos e mudanças de acesso", "Quando um veterinário pedir acesso ou um vínculo mudar."], ["orientacoes", "Novas orientações", "Quando um veterinário publicar algo para seu pet."], ["rotina", "Lembretes da rotina", "Avisos sobre cuidados pendentes do dia."]];
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Notificações" sub="Escolha o que você quer receber." />
    ${it.map(([k, t, s]) => html`<div key=${k} className="card tight row" style=${{ flexDirection: "row" }}><label htmlFor=${"pf-" + k} className="grow"><p style=${{ fontWeight: 800 }}>${t}</p><p className="small muted">${s}</p></label><${Toggle} id=${"pf-" + k} on=${pr[k] !== false} onChange=${(v) => acao("prefs", k, v).catch((e) => toast(e.message))} label=${t} /></div>`)}
    <p className="meta center">Neste protótipo os avisos aparecem só dentro do app.</p>
  </div>`;
}
function Privacidade() {
  const { go } = useApp();
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Privacidade" sub="Como os dados do seu pet são protegidos." />
    <div className="card stack-12 small">
      <p><b>Você decide quem acessa.</b> O número e o QR só identificam o pet. Nenhum dado aparece para o veterinário antes da sua autorização.</p>
      <p><b>Cada veterinário tem um vínculo próprio.</b> Revogar um não muda o acesso dos outros.</p>
      <p><b>Autoria preservada.</b> Cada profissional edita só o que criou, e toda edição gera nova versão.</p>
      <p><b>Suas anotações são suas.</b> Ficam separadas dos registros veterinários; os profissionais com acesso podem lê-las.</p>
      <p><b>Revogação.</b> Bloqueia novas leituras e gravações. Cópias já baixadas pelo profissional não são apagadas.</p>
    </div>
    <${Btn} v="secondary" onClick=${() => go("acessos")}>Gerenciar veterinários autorizados<//>
  </div>`;
}
function Ajuda() {
  const qs = [["Como o veterinário acessa os dados do meu pet?", "Mostre o número ou o QR do pet. O veterinário envia um pedido, e você autoriza ou recusa em Notificações."], ["Posso ter mais de um veterinário?", "Sim. Cada veterinário autorizado tem um vínculo próprio e edita só o que criou."], ["Posso alterar uma orientação do veterinário?", "Não. Você registra cuidados e anotações próprias, sem mudar a orientação."], ["O que acontece se eu revogar um acesso?", "O profissional deixa de ver e editar os dados. O histórico já publicado continua visível para você."]];
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Ajuda" sub="Dúvidas frequentes." />
    ${qs.map(([q, a]) => html`<details key=${q} className="card tight"><summary style=${{ fontWeight: 800, cursor: "pointer" }}>${q}</summary><p className="small muted" style=${{ marginTop: 8 }}>${a}</p></details>`)}
  </div>`;
}

/* ---------- 20 Passeios (etapa futura) ---------- */
function Passeios() {
  const { st, user } = useApp();
  const pet = petAtivo(st, user);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <div className="row"><${PetFoto} pet=${pet} size=${110} round /><div className="stack"><h1>Passeios ${pet ? doPet(pet) : ""}</h1><${Badge} t="soft" icon="clock">Em breve<//></div></div>
    <div className="map" aria-label="Prévia ilustrativa de mapa">
      <svg viewBox="0 0 360 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="360" height="200" fill="#E9E6EE" />
        <path d="M0 40h360M0 120h360M60 0v200M150 0v200M250 0v200" stroke="#F7F5FA" strokeWidth="10" />
        <path d="M190 60c40-20 120-10 150 40s-20 90-80 90-90-40-70-130z" fill="#CDEFD9" />
        <ellipse cx="250" cy="110" rx="26" ry="34" fill="#BFD9F6" />
        <path d="M60 60 L120 60 L140 100 L230 150 L300 130" fill="none" stroke="#5824B8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="60" r="9" fill="#8E62E4" stroke="#fff" strokeWidth="3" /><circle cx="300" cy="130" r="13" fill="#fff" stroke="#5824B8" strokeWidth="4" />
      </svg>
      <span className="tag">Prévia ilustrativa</span>
    </div>
    <div className="btns two">
      <div className="card tight row" style=${{ flexDirection: "row" }}><${Tile} icon="clock" round sm /><div><p className="h3">— min</p><p className="small muted">Duração</p></div></div>
      <div className="card tight row" style=${{ flexDirection: "row" }}><${Tile} icon="pin" round sm /><div><p className="h3">— km</p><p className="small muted">Distância</p></div></div>
    </div>
    <div className="row"><span className="purple"><${I} n="phone" s=${34} /></span><div><h3>Percurso registrado pelo celular</h3><p className="small muted">Esta é uma funcionalidade em desenvolvimento. Nenhum dado de passeio é coletado nesta versão.</p></div></div>
  </div>`;
}

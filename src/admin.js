/* =================== ADMINISTRADOR =================== */
const KIND = { pet: ["Pet", "paw"], tutor: ["Conta de tutor", "user"], vet: ["Veterinário", "vet"] };
function itensAdmin(st) {
  const it = [];
  st.users.filter((u) => u.tipo === "tutor").forEach((u) => it.push({ kind: "tutor", id: u.id, status: u.aprovacao || "aprovado", data: u.criadoEm, titulo: u.nome, sub: u.email + (u.emailConfirmado ? "" : " · e-mail não confirmado") }));
  st.users.filter((u) => u.tipo === "vet").forEach((u) => it.push({ kind: "vet", id: u.id, status: u.verificacao === "liberado" ? "aprovado" : u.verificacao, data: u.criadoEm, titulo: u.nome, sub: `CRMV-${u.uf} ${u.crmv} · ${u.email}` }));
  return it.sort((a, b) => b.data.localeCompare(a.data));
}
const ST_ADM = { pendente: ["warn", "clock", "Aguardando análise"], aprovado: ["ok", "checkC", "Aprovado"], recusado: ["err", "alert", "Recusado"] };

function AInicio({ todos }) {
  const { st, user, go } = useApp();
  const [filtro, setFiltro] = useState("todos");
  const [sit, setSit] = useState(todos ? "todos" : "pendente");
  const all = itensAdmin(st);
  const pend = all.filter((i) => i.status === "pendente");
  const lista = all.filter((i) => (filtro === "todos" || i.kind === filtro) && (sit === "todos" || i.status === sit));
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t=${todos ? "Cadastros" : "Olá, administrador"} sub=${todos ? "Todos os cadastros de tutores e veterinários." : pend.length ? `${pend.length} ${pend.length === 1 ? "cadastro aguarda" : "cadastros aguardam"} sua análise.` : "Nenhum cadastro aguardando análise."} />
    ${todos ? null : html`<div className="btns two" style=${{ flexWrap: "wrap" }}>
      ${["tutor", "vet"].map((k) => html`<div key=${k} className="card tight" style=${{ gap: 2, flex: "1 1 40%" }}><p className="num purple" style=${{ fontSize: 28, fontWeight: 800, lineHeight: "32px" }}>${pend.filter((i) => i.kind === k).length}</p><p className="small muted">${{ pet: "Pets", tutor: "Tutores", vet: "Veterinários" }[k]}</p></div>`)}
    </div>`}
    ${todos ? html`<${Seg} label="Situação" value=${sit} onChange=${setSit} options=${[{ v: "todos", t: "Todos" }, { v: "pendente", t: "Pendentes" }, { v: "aprovado", t: "Aprovados" }, { v: "recusado", t: "Recusados" }]} />` : null}
    <div className="chips" role="group" aria-label="Tipo de cadastro">
      ${[["todos", "Todos"], ["tutor", "Tutores"], ["vet", "Veterinários"]].map(([k, t]) => html`<button key=${k} className=${"chip" + (filtro === k ? " on" : "")} aria-pressed=${filtro === k ? "true" : "false"} onClick=${() => setFiltro(k)}>${t}</button>`)}
    </div>
    ${lista.length ? lista.map((i) => html`<button key=${i.kind + i.id} className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => go("aDetalhe", { kind: i.kind, id: i.id })}>
      ${i.kind === "pet" ? html`<${PetFoto} pet=${i.pet} size=${56} />` : html`<${Tile} icon=${KIND[i.kind][1]} sm />`}
      <div className="grow stack" style=${{ gap: 4 }}>
        <p style=${{ fontWeight: 800 }}>${i.titulo}</p>
        <p className="small muted" style=${{ overflowWrap: "anywhere" }}>${KIND[i.kind][0]} · ${i.sub}</p>
        <div className="row wrap" style=${{ gap: 6 }}><${Badge} t=${ST_ADM[i.status][0]} icon=${ST_ADM[i.status][1]}>${ST_ADM[i.status][2]}<//><span className="meta">${fmtRel(i.data)}</span></div>
      </div>
      <span className="chev"><${I} n="right" /></span>
    </button>`) : html`<${Empty} icon="checkC" title=${sit === "pendente" ? "Tudo analisado" : "Nada encontrado"}>${sit === "pendente" ? "Novos cadastros de tutores e veterinários aparecem aqui para aprovação." : "Nenhum cadastro com esse filtro."}<//>`}
  </div>`;
}
function ACadastros() { return html`<${AInicio} todos />`; }

function ADetalhe({ p }) {
  const { st, mut, toast, goBack, acao } = useApp();
  const [recusando, setRecusando] = useState(false); const [motivo, setMotivo] = useState(""); const [err, setErr] = useState("");
  const [busy, run] = useBusy(); const [qual, setQual] = useState(null);
  const item = itensAdmin(st).find((i) => i.kind === p.kind && i.id === p.id);
  if (!item) return html`<${SemAcessoGenerico} />`;
  const pet = p.kind === "pet" ? petById(st, p.id) : null;
  const u = pet ? userById(st, pet.tutorId) : userById(st, p.id);
  const decidir = (ok) => { setErr(""); if (!ok && !motivo.trim()) { setErr("Explique o motivo da recusa. Ele será mostrado a quem fez o cadastro."); return; } setQual(ok); run(async () => {
    try { await acao("decidirCadastro", p.kind, p.id, ok, motivo); toast(ok ? `${item.titulo}: cadastro aprovado.` : `${item.titulo}: cadastro recusado.`); goBack(); }
    catch (er) { setErr(er.message); }
  }); };
  const linhas = pet
    ? [["Nome", pet.nome], ["Espécie", pet.especie], ["Raça", pet.raca || "Não informada"], ["Sexo", pet.sexo], ["Nascimento", pet.nascimento ? fmtData(pet.nascimento + "T12:00") : "Não informado"], ["E-mail do cadastro", pet.email], ["Tutor", `${u.nome} (${u.email})`], ["Número", pet.codigo ? fmtCod(pet.codigo) : "Gerado após a aprovação"], ["Enviado em", fmtData(pet.enviadoEm || pet.criadoEm)]]
    : u.tipo === "vet"
      ? [["Nome", u.nome], ["E-mail", u.email], ["CRMV", `${u.crmv}-${u.uf}`], ["Documento", u.documento ? `${u.documento.nome} · ${kb(u.documento.tamanho)}` : "Não anexado"], ["Enviado em", fmtData(u.criadoEm)]]
      : [["Nome", u.nome], ["E-mail", u.email], ["E-mail confirmado", u.emailConfirmado ? "Sim" : "Ainda não"], ["Pets vinculados", String(petsDoTutor(st, u.id).length)], ["Criada em", fmtData(u.criadoEm)]];
  const petsV = !pet && u.tipo === "tutor" ? petsDoTutor(st, u.id) : [];
  const s = ST_ADM[item.status];
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${item.titulo} sub=${KIND[p.kind][0]} />
    <div className="row wrap" style=${{ gap: 8 }}><${Badge} t=${s[0]} icon=${s[1]}>${s[2]}<//></div>
    ${pet ? html`<div style=${{ display: "flex", justifyContent: "center" }}><${PetFoto} pet=${pet} size=${140} /></div>` : null}
    <div className="kv" style=${{ boxShadow: "0 0 0 1px var(--b-sub)" }}>${linhas.map(([k, v]) => html`<${React.Fragment} key=${k}><div className="k">${k}</div><div className="v" style=${{ overflowWrap: "anywhere" }}>${v}</div><//>`)}</div>
    ${petsV.length ? html`<h3>Pets vinculados a ${u.email}</h3>${petsV.map((x) => html`<div key=${x.id} className="card tight row" style=${{ flexDirection: "row" }}><${PetFoto} pet=${x} size=${48} /><div className="grow"><p style=${{ fontWeight: 800 }}>${x.nome}</p><p className="small muted num">${x.especie}${x.raca ? " · " + x.raca : ""} · ID ${fmtCod(x.codigo)}</p></div></div>`)}` : null}
    ${item.status === "recusado" ? html`<${Note} t="e" icon="alert"><b>Motivo da recusa:</b> ${(pet || u).motivoRecusa || "—"}<//>` : null}
    ${pet ? html`<${Note} icon="lock">A análise mostra só os dados do cadastro. O prontuário do pet não fica visível para administradores.<//>` : null}
    ${item.status === "pendente" ? html`
      ${recusando ? html`<${Field} id="adm-mot" label="Motivo da recusa" error=${err} help="Será mostrado a quem fez o cadastro, para que possa corrigir."><${Area} id="adm-mot" value=${motivo} onChange=${(v) => { setMotivo(v); setErr(""); }} placeholder=${pet ? "Ex.: a foto não mostra o pet com clareza" : "Ex.: o número do CRMV não confere"} rows=${3} bad=${err} /><//>` : err ? html`<div className="formerr" role="alert">${err}</div>` : null}
      <div className="btns">
        ${recusando ? null : html`<${Btn} icon="checkC" busy=${busy && qual === true} disabled=${busy} onClick=${() => decidir(true)}>Aprovar cadastro<//>`}
        <${Btn} v="danger" busy=${busy && qual === false} disabled=${busy} onClick=${() => (recusando ? decidir(false) : setRecusando(true))}>${recusando ? "Confirmar recusa" : "Recusar cadastro"}<//>
        ${recusando ? html`<${Btn} v="secondary" onClick=${() => { setRecusando(false); setErr(""); }}>Cancelar<//>` : null}
      </div>
      ${pet ? html`<p className="foot"><${I} n="info" s=${18} />Ao aprovar, o pet recebe número único e QR.</p>` : null}` : null}
  </div>`;
}
function APerfil() {
  const { user, mut, acao } = useApp();
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t="Meu perfil" sub="Conta de administrador." />
    <div className="card row" style=${{ flexDirection: "row" }}><span className="ic-tile round" style=${{ width: 72, height: 72 }}><${I} n="shieldC" s=${36} /></span><div><h2>${user.nome}</h2><p className="muted small">${user.email}</p></div></div>
    <${Note} icon="info">O administrador aprova ou recusa cadastros de tutores e veterinários. Não tem acesso a prontuários.<//>
    <${TrocarVisao} />
    <${Btn} v="secondary" icon="logout" onClick=${() => acao("sair").catch(() => {})}>Sair da conta<//>
  </div>`;
}

/* Conta de tutor aguardando aprovação */
function ContaAnalise() {
  const { user, mut, acao } = useApp();
  const rec = user.aprovacao === "recusado";
  const passos = [
    { t: "Conta criada", s: "Recebemos seus dados.", e: "ok" },
    { t: "E-mail confirmado", s: user.email, e: user.emailConfirmado ? "ok" : "now" },
    { t: "Aprovação do cadastro", s: rec ? "Seu cadastro não foi aprovado." : "Um administrador está analisando sua conta.", e: rec ? "err" : "now" },
  ];
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <div style=${{ display: "flex", justifyContent: "center" }}><span style=${{ width: 140, height: 140, borderRadius: "50%", background: rec ? "var(--err-bg)" : "var(--soft-2)", color: rec ? "var(--err)" : "var(--roxo)", display: "flex", alignItems: "center", justifyContent: "center" }}><${I} n=${rec ? "alert" : "clock"} s=${64} sw=${1.8} /></span></div>
    <${Title} c t=${html`<span className=${rec ? "" : "purple"}>${rec ? "Cadastro não aprovado" : "Conta em análise"}</span>`} sub=${rec ? "Veja o motivo abaixo." : `Olá, ${primeiroNome(user)}. Você poderá vincular seus pets assim que um administrador aprovar sua conta.`} />
    <div className="card"><div className="steps">
      ${passos.map((x) => html`<div className="step" key=${x.t}>
        <span className="dotc" style=${{ background: x.e === "ok" ? "#5FD495" : x.e === "err" ? "var(--err)" : "var(--roxo)", color: "var(--branco)" }}><${I} n=${x.e === "ok" ? "check" : x.e === "err" ? "x" : "clock"} s=${18} sw=${2.6} /></span>
        <div><p className="h3" style=${{ fontSize: 17 }}>${x.t}</p><p className="small muted">${x.s}</p></div>
      </div>`)}
    </div></div>
    ${rec ? html`<${Note} t="e" icon="alert"><b>Motivo:</b> ${user.motivoRecusa}<//>` : html`<${Note} t="g" icon="mega"><b>Avisaremos quando a análise terminar.</b><br />Você receberá uma notificação aqui no app.<//>`}
    <${Btn} v="secondary" onClick=${() => acao("sair").catch(() => {})}>Sair<//>
    ${DEMO ? html`<p className="meta center">Protótipo: entre como Administrador no painel de demonstração para aprovar.</p>` : null}
  </div>`;
}

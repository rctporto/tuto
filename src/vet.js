/* =================== VETERINÁRIO =================== */
function bloqueioVet(st, user, petId) {
  if (vetPodeLer(st, user.id, petId)) return null;
  const sol = pendenteDe(st, petId, user.id);
  if (sol) return html`<${Aguardando} p=${{ sid: sol.id }} />`;
  return html`<${Revogado} p=${{ petId }} />`;
}
const PERMS_VET = html`<div className="stack" style=${{ gap: 6 }}><div className="row"><span style=${{ color: "#2FAF6A" }}><${I} n="checkC" s=${22} /></span>Consultar histórico e anotações</div><div className="row"><span style=${{ color: "#2FAF6A" }}><${I} n="checkC" s=${22} /></span>Adicionar orientações próprias</div></div>`;

/* ---------- 23 Início ---------- */
function VInicio() {
  const { st, user, go } = useApp();
  if (user.verificacao !== "liberado") return html`<${Verificacao} />`;
  const ativos = st.vinculos.filter((l) => l.vetId === user.id && l.status === "ativo");
  const pend = st.solicitacoes.filter((s) => s.vetId === user.id && s.status === "pendente");
  const novasNotas = st.notifs.filter((n) => n.para === user.id && n.tipo === "nota" && !n.lida).length;
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t=${"Olá, " + primeiroNome(user)} sub="Seus pacientes, com autorização." />
    <button className="btn btn-primary" style=${{ minHeight: 64, fontSize: 19, justifyContent: "space-between", padding: "12px 18px" }} onClick=${() => go("encontrar")}><${I} n="scan" s=${30} /><span className="grow" style=${{ textAlign: "left" }}>Solicitar acesso a um pet</span><${I} n="right" /></button>
    <div className="btns two">
      <button className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => go("vPacientes")}><span className="purple"><${Sym} s=${38} /></span><div><p className="num" style=${{ fontSize: 30, fontWeight: 800, lineHeight: "34px", color: "var(--roxo)" }}>${ativos.length}</p><p className="small muted">${ativos.length === 1 ? "Pet autorizado" : "Pets autorizados"}</p></div></button>
      <button className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => go("vNotifs")}><span className="purple"><${I} n="file" s=${34} /></span><div><p className="num" style=${{ fontSize: 30, fontWeight: 800, lineHeight: "34px", color: "var(--roxo)" }}>${novasNotas}</p><p className="small muted">${novasNotas === 1 ? "Nova anotação" : "Novas anotações"}</p></div></button>
    </div>
    <h2>Pacientes autorizados</h2>
    ${ativos.length ? ativos.map((l) => html`<${PacienteCard} key=${l.id} petId=${l.petId} />`) : html`<${Empty} icon="paw" title="Nenhum paciente ainda">Peça ao tutor o número ou o QR do pet e envie uma solicitação de acesso.<//>`}
    ${pend.length ? html`<h3>Aguardando tutor</h3>${pend.map((s) => html`<${Row} key=${s.id} tile=${html`<span className="ic-tile sm"><${Sym} s=${26} /></span>`} title=${"Pet " + fmtCod(petById(st, s.petId).codigo)} sub=${"Solicitação enviada " + fmtRel(s.criadaEm).toLowerCase()} onClick=${() => go("aguardando", { sid: s.id })} />`)}` : null}
    <${Note} icon="info">O código identifica o pet. O tutor libera o acesso.<//>
  </div>`;
}
function PacienteCard({ petId }) {
  const { st, go } = useApp();
  const pet = petById(st, petId); const tutor = userById(st, pet.tutorId);
  return html`<div className="card petcard" style=${{ flexDirection: "row", alignItems: "stretch" }}>
    <${PetFoto} pet=${pet} size=${92} />
    <div className="grow stack" style=${{ gap: 6 }}>
      <h2>${pet.nome}</h2><p className="muted small">Tutor: ${tutor.nome}</p><${Badge} icon="checkC">Acesso ativo<//>
      <${Btn} v="secondary" small icon="folder" iconR="right" onClick=${() => go("prontuario", { petId: pet.id })}>Abrir prontuário<//>
    </div>
  </div>`;
}
function VPacientes() {
  const { st, user, go } = useApp();
  if (user.verificacao !== "liberado") return html`<${Verificacao} />`;
  const meus = st.vinculos.filter((l) => l.vetId === user.id);
  const ativos = meus.filter((l) => l.status === "ativo"); const enc = meus.filter((l) => l.status !== "ativo");
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t="Pacientes" sub="Somente pets com acesso ativo mostram dados." />
    ${ativos.length ? ativos.map((l) => html`<${PacienteCard} key=${l.id} petId=${l.petId} />`) : html`<${Empty} icon="paw" title="Nenhum paciente com acesso ativo">Envie uma solicitação ao tutor para começar.<//>`}
    ${enc.length ? html`<h3>Acessos encerrados</h3>${enc.map((l) => html`<${Row} key=${l.id} icon="lock" title=${"Pet " + fmtCod(petById(st, l.petId).codigo)} sub="O tutor encerrou sua autorização." onClick=${() => go("revogado", { petId: l.petId })} />`)}` : null}
    <${Btn} v="secondary" icon="scan" onClick=${() => go("encontrar")}>Encontrar pet<//>
  </div>`;
}
function VSolicitacoes() {
  const { st, user, go } = useApp();
  if (user.verificacao !== "liberado") return html`<${Verificacao} />`;
  const sols = st.solicitacoes.filter((s) => s.vetId === user.id).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  const rot = { pendente: ["warn", "Aguardando tutor"], aprovada: ["ok", "Autorizada"], recusada: ["err", "Recusada"], cancelada: ["gray", "Cancelada"] };
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t="Solicitações" sub="Pedidos de acesso enviados aos tutores." />
    <button className="btn btn-primary" style=${{ minHeight: 60, justifyContent: "space-between" }} onClick=${() => go("encontrar")}><${I} n="scan" s=${26} /><span className="grow" style=${{ textAlign: "left" }}>Encontrar pet por QR ou número</span><${I} n="right" /></button>
    ${sols.length ? sols.map((s) => { const pet = petById(st, s.petId); const ver = vetPodeLer(st, user.id, pet.id); return html`<button key=${s.id} className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => go(s.status === "pendente" ? "aguardando" : ver ? "prontuario" : "revogado", s.status === "pendente" ? { sid: s.id } : { petId: pet.id })}>
      <span className="ic-tile sm"><${Sym} s=${26} /></span>
      <div className="grow stack" style=${{ gap: 4 }}><p style=${{ fontWeight: 800 }}>${ver ? pet.nome : "Pet " + fmtCod(pet.codigo)}</p><p className="small muted">${s.motivo} · ${fmtData(s.criadaEm)}</p><${Badge} t=${rot[s.status][0]}>${rot[s.status][1]}<//></div>
      <span className="chev"><${I} n="right" /></span>
    </button>`; }) : html`<${Empty} icon="file" title="Nenhuma solicitação enviada">Use o QR ou o número do pet para pedir acesso ao tutor.<//>`}
  </div>`;
}
function VPerfil() {
  const { user, go, mut } = useApp();
  const lib = user.verificacao === "liberado";
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <${Title} t="Meu perfil" sub="Seus dados profissionais." />
    <div className="card row" style=${{ flexDirection: "row" }}>
      <span className="ic-tile round" style=${{ width: 80, height: 80 }}><${I} n="vet" s=${40} /></span>
      <div className="grow stack" style=${{ gap: 4 }}><h2>${user.nome}</h2><p className="muted small">${user.titulo} · CRMV-${user.uf} ${user.crmv}</p><${Badge} t=${lib ? "ok" : "warn"} icon=${lib ? "checkC" : "clock"}>${lib ? "Perfil verificado" : "Verificação em análise"}<//></div>
    </div>
    <${Row} icon="user" title="Dados da conta" sub="Nome, e-mail e registro." onClick=${() => go("conta")} />
    <${Row} icon="bell" title="Notificações" sub="Acessos, anotações e publicações." onClick=${() => go("vNotifs")} />
    <${Row} icon="shield" title="Como funciona o acesso" sub="Autorização por pet e autoria por registro." onClick=${() => go("privacidade")} />
    <${Btn} v="secondary" icon="logout" onClick=${() => mut((d) => A.sair(d))}>Sair da conta<//>
  </div>`;
}

/* ---------- 24 Encontrar pet ---------- */
function Encontrar() {
  const { st, user, mut, go, replace } = useApp();
  const [modo, setModo] = useState("qr"); const [num, setNum] = useState(""); const [err, setErr] = useState("");
  const [busy, run] = useBusy(); const [falhas, setFalhas] = useState(0); const [ate, setAte] = useState(0);
  if (user.verificacao !== "liberado") return html`<${Verificacao} />`;
  const abrir = (codigo) => run(async () => {
    if (Date.now() < ate) { setErr("Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo."); return; }
    try {
      const r = mut((d) => A.buscarCodigo(d, codigo));
      if (!r) { const f = falhas + 1; setFalhas(f); if (f >= 5) { setAte(Date.now() + 30000); setFalhas(0); } setErr("Não encontramos um pet com esse número. Confira os 8 dígitos com o tutor."); return; }
      setErr(""); setFalhas(0);
      if (vetPodeLer(st, user.id, r.petId)) go("prontuario", { petId: r.petId });
      else { const pend = pendenteDe(st, r.petId, user.id); go(pend ? "aguardando" : "solicitar", pend ? { sid: pend.id } : { petId: r.petId }); }
    } catch (er) { setErr(er.message); }
  });
  const demo = st.pets.filter((p) => p.status === "aprovado" && p.codigo).slice(-3);
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Encontrar pet" sub="Identifique o pet por QR Code ou número." />
    <${Seg} label="Forma de identificação" value=${modo} onChange=${(v) => { setModo(v); setErr(""); }} options=${[{ v: "qr", t: "Ler QR", icon: "scan" }, { v: "num", t: "Digitar número", icon: "hash" }]} />
    ${modo === "qr" ? html`<div className="scanner">
        <span className="corner c1"></span><span className="corner c2"></span><span className="corner c3"></span><span className="corner c4"></span>
        <${I} n="scan" s=${54} sw=${1.6} />
        <p style=${{ maxWidth: 230 }}>A câmera não está disponível neste protótipo. Simule a leitura de um QR de demonstração:</p>
        <div className="chips" style=${{ justifyContent: "center" }}>${demo.map((p) => html`<button key=${p.id} className="chip" style=${{ color: "var(--tinta)" }} onClick=${() => abrir(p.codigo)} disabled=${busy}><${I} n="qr" s=${18} />QR ${fmtCod(p.codigo)}</button>`)}</div>
      </div>
      <div className="or">ou</div>` : null}
    <form className="stack-12" onSubmit=${(e) => { e.preventDefault(); if (num.replace(/\D/g, "").length !== 8) { setErr("O número do pet tem 8 dígitos."); return; } abrir(num); }} noValidate>
      <${Field} id="enc-num" label="Número do pet" error=${err}><${Inp} id="enc-num" value=${num} onChange=${(v) => { setNum(v.replace(/[^\d ]/g, "")); setErr(""); }} placeholder="Digite o número" inputMode="numeric" maxLength=${9} bad=${err} /><//>
      <${Btn} type="submit" busy=${busy} iconR="right">Continuar<//>
    </form>
    <${Note} icon="info"><b className="purple">Encontrar o pet não libera os dados.</b><br />Você enviará uma solicitação ao tutor.<//>
  </div>`;
}

/* ---------- 25 Solicitar acesso ---------- */
function Solicitar({ p }) {
  const { st, user, mut, toast, replace, goBack } = useApp();
  const [motivo, setMotivo] = useState("Acompanhamento veterinário"); const [busy, run] = useBusy(); const [err, setErr] = useState("");
  const pet = petById(st, p.petId);
  if (!pet) return html`<${SemAcessoGenerico} />`;
  if (vetPodeLer(st, user.id, pet.id)) return html`<${Prontuario} p=${{ petId: pet.id }} />`;
  const enviar = () => run(async () => { try { const s = mut((d) => A.solicitar(d, pet.id, motivo)); toast("Solicitação enviada ao tutor."); replace("aguardando", { sid: s.id }); } catch (er) { setErr(er.message); } });
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t="Solicitar acesso" sub="Envie uma solicitação ao tutor para acessar os dados do pet." />
    <div className="card row" style=${{ flexDirection: "row" }}>
      <span className="ic-tile round" style=${{ width: 96, height: 96 }}><${I} n="idcard" s=${48} sw=${1.8} /></span>
      <div className="grow stack" style=${{ gap: 4 }}><h2>Pet localizado</h2><p className="muted num">Número: ${fmtCod(pet.codigo)}</p><${Badge} icon="paw">Pet encontrado<//></div>
    </div>
    <div className="card">
      <div className="row"><${Tile} icon="vet" sm /><div><p className="small muted">Solicitação feita por</p><h3>${user.nome}</h3></div></div>
      <${Field} id="sol-mot" label="Motivo da solicitação"><${Sel} id="sol-mot" value=${motivo} onChange=${setMotivo} options=${["Acompanhamento veterinário", "Consulta de rotina", "Avaliação clínica", "Atendimento de urgência", "Segunda opinião"]} /><//>
    </div>
    <div className="card">
      <div className="row top-a" style=${{ alignItems: "flex-start" }}><${Tile} icon="file" sm /><div className="grow stack"><h3>Você está solicitando:</h3>${PERMS_VET}</div></div>
      <hr className="sep" />
      <div className="row small muted"><span className="purple"><${I} n="info" s=${20} /></span>Os dados só serão exibidos após a autorização do tutor.</div>
    </div>
    ${err ? html`<div className="formerr" role="alert">${err}</div>` : null}
    <div className="btns"><${Btn} busy=${busy} onClick=${enviar}>Enviar solicitação<//><${Btn} v="secondary" onClick=${goBack} disabled=${busy}>Cancelar<//></div>
  </div>`;
}

/* ---------- 26 Aguardando ---------- */
function Aguardando({ p }) {
  const { st, user, mut, toast, tab, go } = useApp();
  const [busy, run] = useBusy();
  const s = st.solicitacoes.find((x) => x.id === p.sid && x.vetId === user.id);
  if (!s) return html`<${SemAcessoGenerico} />`;
  const pet = petById(st, s.petId);
  if (s.status === "aprovada" && vetPodeLer(st, user.id, pet.id)) return html`<div className="scr"><${Top} logo="left" bell /><${Title} c t=${html`<span className="purple">Acesso autorizado</span>`} sub="O tutor liberou os dados." /><${Btn} iconR="right" onClick=${() => go("prontuario", { petId: pet.id })}>Abrir prontuário<//></div>`;
  const pend = s.status === "pendente";
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <div style=${{ display: "flex", justifyContent: "center" }}><span style=${{ width: 150, height: 150, borderRadius: "50%", background: pend ? "var(--succ)" : "var(--err-bg)", color: pend ? "#1E9E5A" : "var(--err)", display: "flex", alignItems: "center", justifyContent: "center" }}><${I} n=${pend ? "clock" : "slash"} s=${78} sw=${1.8} /></span></div>
    <${Title} c t=${html`<span className="purple">${pend ? "Solicitação enviada" : s.status === "recusada" ? "Solicitação recusada" : "Solicitação cancelada"}</span>`} sub=${pend ? "O tutor ainda não autorizou o acesso aos dados." : s.status === "recusada" ? "O tutor não autorizou o acesso. Os dados continuam protegidos." : "Você cancelou esta solicitação."} />
    <div className="card row" style=${{ flexDirection: "row" }}>
      <span className="ic-tile round" style=${{ width: 72, height: 72, background: "var(--soft-2)" }}><${Sym} s=${44} /></span>
      <div className="grow stack" style=${{ gap: 6 }}><h3 className="num" style=${{ fontSize: 22 }}>Pet ${fmtCod(pet.codigo)}</h3><${Badge} t=${pend ? "warn" : s.status === "recusada" ? "err" : "gray"} icon=${pend ? "clock" : "slash"}>${pend ? "Aguardando tutor" : s.status === "recusada" ? "Recusada pelo tutor" : "Cancelada"}<//></div>
    </div>
    <div className="card center" style=${{ alignItems: "center" }}><${Tile} icon="lock" round /><h3>Prontuário indisponível</h3><p className="small muted">O acesso aos dados só será liberado após autorização do tutor.</p></div>
    ${pend ? html`<${Btn} v="secondary" busy=${busy} onClick=${() => run(async () => { try { mut((d) => A.cancelarSolicitacao(d, s.id)); toast("Solicitação cancelada."); } catch (er) { toast(er.message); } })}>Cancelar solicitação<//>`
      : html`<${Btn} v="secondary" onClick=${() => go("solicitar", { petId: pet.id })}>Solicitar novo acesso<//>`}
    <button className="btn btn-link" style=${{ alignSelf: "center", textDecoration: "underline" }} onClick=${() => tab("vInicio")}>Voltar ao início</button>
  </div>`;
}

/* ---------- 27 Acesso revogado / indisponível ---------- */
function Revogado({ p }) {
  const { st, user, tab, go } = useApp();
  const pet = petById(st, p.petId);
  if (!pet) return html`<${SemAcessoGenerico} />`;
  const l = vinculoDe(st, pet.id, user.id);
  const ult = st.solicitacoes.filter((s) => s.petId === pet.id && s.vetId === user.id).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0];
  const perfil = user.verificacao !== "liberado";
  const t = perfil ? "Perfil em análise" : l && l.status === "revogado" ? "Acesso revogado" : ult && ult.status === "recusada" ? "Acesso recusado" : "Acesso indisponível";
  const s = perfil ? "O acesso clínico depende do perfil liberado." : l && l.status === "revogado" ? "O tutor encerrou sua autorização." : ult && ult.status === "recusada" ? "O tutor não autorizou o acesso." : "Você ainda não tem autorização para este pet.";
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t=${t} sub=${s} />
    <div className="card center" style=${{ alignItems: "center", padding: 32 }}>
      <span style=${{ position: "relative", display: "inline-flex", color: "var(--roxo)" }}><svg width="120" height="130" viewBox="0 0 120 130" aria-hidden="true"><rect x="14" y="52" width="92" height="74" rx="18" fill="currentColor" /><path d="M34 54V38a26 26 0 0 1 52 0v16" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" /><circle cx="60" cy="89" r="22" fill="#fff" /></svg><span style=${{ position: "absolute", left: 40, top: 70, color: "var(--roxo)" }}><${I} n="paw" s=${40} /></span></span>
    </div>
    <div className="card row" style=${{ flexDirection: "row" }}><${Tile} icon="paw" /><div><h3 className="num" style=${{ fontSize: 20 }}>Pet ${fmtCod(pet.codigo)}</h3><p className="muted small">${s}</p></div></div>
    <p className="muted center">Os dados e a edição de registros estão indisponíveis.${l && l.status === "revogado" ? " Seus registros publicados continuam no histórico do tutor." : ""}</p>
    <div className="btns"><${Btn} onClick=${() => tab("vPacientes")}>Voltar aos pacientes<//>${perfil ? null : html`<${Btn} v="secondary" onClick=${() => { const pend = pendenteDe(st, pet.id, user.id); go(pend ? "aguardando" : "solicitar", pend ? { sid: pend.id } : { petId: pet.id }); }}>Solicitar novo acesso<//>`}</div>
  </div>`;
}

/* ---------- 28 Prontuário ---------- */
function Prontuario({ p }) {
  const { st, user, go } = useApp();
  const [aba, setAba] = useState(p.aba || "clinico");
  const bloq = bloqueioVet(st, user, p.petId); if (bloq) return bloq;
  const pet = petById(st, p.petId); const tutor = userById(st, pet.tutorId);
  const regs = publicados(st, pet.id);
  const rasc = st.registros.filter((r) => r.petId === pet.id && r.autorId === user.id && r.status === "rascunho");
  const notas = st.notas.filter((n) => n.petId === pet.id).sort((a, b) => b.data.localeCompare(a.data));
  const cuid = st.cuidados.filter((c) => c.petId === pet.id).sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  const outros = vinculosAtivos(st, pet.id).filter((l) => l.vetId !== user.id).map((l) => userById(st, l.vetId).nome);
  const docs = regs.filter((r) => r.tipo === "receita" || r.anexo);
  const linhaTempo = [...regs.map((r) => ({ k: "r", d: r.publicadoEm, r })), ...notas.map((n) => ({ k: "n", d: n.data, n }))].sort((a, b) => b.d.localeCompare(a.d));
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t=${"Prontuário " + doPet(pet)} />
    <div className="card">
      <div className="row"><${PetFoto} pet=${pet} size=${96} /><div className="grow stack" style=${{ gap: 4 }}><h2>${pet.nome}</h2><p className="small muted num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p><p className="small">Tutor: <b>${tutor.nome}</b></p><${Badge} icon="checkC">Acesso autorizado<//></div></div>
      <div className="row" style=${{ background: "var(--branco)", borderRadius: 14, padding: 8 }}><${QR} text=${"TUTO-PET:" + pet.codigo} size=${56} /><p className="meta grow">ID ${fmtCod(pet.codigo)}. Este código serve apenas para identificação e não garante acesso aos dados.</p></div>
    </div>
    ${outros.length ? html`<p className="small muted"><${I} n="users" s=${16} /> Também com acesso: ${outros.join(", ")}. Cada profissional edita só o que criou.</p>` : null}
    <${Seg} label="Seções do prontuário" value=${aba} onChange=${setAba} options=${[{ v: "clinico", t: "Clínico", icon: "file" }, { v: "tutor", t: "Tutor", icon: "user" }, { v: "docs", t: "Documentos", icon: "folder" }]} />
    ${aba === "clinico" ? html`
      ${rasc.map((r) => html`<div className="card white" key=${r.id}>
        <div className="row"><${Tile} icon=${TIPOS[r.tipo].icon} sm /><div className="grow"><h3>${r.titulo}</h3><p className="small muted">Rascunho privado · atualizado ${fmtRel(r.atualizadoEm).toLowerCase()}</p></div><${Badge} t="soft" icon="file">Rascunho<//></div>
        <div className="btns two"><${Btn} v="secondary" small onClick=${() => go("novaOrientacao", { petId: pet.id, rid: r.id })}>Continuar<//><${Btn} small onClick=${() => go("revisar", { rid: r.id })}>Revisar<//></div>
      </div>`)}
      ${linhaTempo.length ? linhaTempo.map((x) => x.k === "r" ? html`<${ProntRegistro} key=${x.r.id} r=${x.r} />` : html`<div key=${x.n.id} className="card green">
          <div className="row top-a" style=${{ alignItems: "flex-start" }}><${Tile} icon="msg" g round sm /><div className="grow"><h3>${x.n.titulo || "Nova anotação do tutor"}</h3><p className="small muted">${tutor.nome} · ${fmtData(x.n.data)} · ${x.n.categoria}</p><p className="small" style=${{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>${x.n.descricao}</p></div></div>
          <div><${Btn} v="secondary" small icon="eye" onClick=${() => go("nota", { nid: x.n.id })}>Ler observação<//></div>
        </div>`) : html`<${Empty} title="Prontuário ainda sem registros">Publique a primeira orientação para ${oPet(pet)}.<//>`}
    ` : aba === "tutor" ? html`
      <div className="card white"><div className="row"><${Tile} icon="user" round sm /><div><h3>${tutor.nome}</h3><p className="small muted">Tutor responsável</p></div></div><p className="small muted">Contato direto não é exibido neste protótipo. Use as orientações e notificações do app.</p></div>
      <h3>Cuidados registrados pelo tutor</h3>
      ${cuid.length ? cuid.slice(0, 10).map((c) => { const r = st.registros.find((x) => x.id === c.registroId); return html`<${Row} key=${c.id} icon=${c.resultado === "Realizado" ? "checkC" : "alert"} g=${c.resultado === "Realizado"} title=${`${r ? r.titulo : "Cuidado"} · ${c.resultado}`} sub=${`${fmtData(c.dataHora)} às ${fmtHora(c.dataHora)} · versão ${c.versao || "-"}${c.obs ? " · " + c.obs : ""}`} />`; }) : html`<p className="muted small">Nenhum cuidado registrado ainda.</p>`}
      <h3>Anotações do tutor</h3>
      ${notas.length ? notas.map((n) => html`<${NotaCard} key=${n.id} n=${n} />`) : html`<p className="muted small">Nenhuma anotação ainda.</p>`}
    ` : html`
      ${docs.length ? docs.map((r) => html`<${Row} key=${r.id} icon=${r.tipo === "receita" ? "fileHeart" : "clip"} title=${r.tipo === "receita" ? r.titulo : r.anexo.nome} sub=${`${userById(st, r.autorId).nome} · ${fmtData(atual(r).data)}`} onClick=${() => go("vRegistro", { rid: r.id })} />`) : html`<${Empty} icon="folder" title="Nenhum documento">Receitas e anexos publicados aparecem aqui.<//>`}
    `}
    <${Btn} icon="filePlus" onClick=${() => go("novaOrientacao", { petId: pet.id })}>Nova orientação<//>
  </div>`;
}
function ProntRegistro({ r }) {
  const { st, user, go } = useApp();
  const a = userById(st, r.autorId); const meu = r.autorId === user.id; const v = atual(r);
  return html`<div className="card">
    <div className="row top-a" style=${{ alignItems: "flex-start" }}>
      <${Tile} icon=${TIPOS[r.tipo].icon} round sm />
      <div className="grow stack" style=${{ gap: 4 }}>
        <div className="row" style=${{ alignItems: "flex-start" }}><h3 className="grow">${r.titulo}</h3><button className="iconbtn dark" style=${{ width: 36, height: 36, marginTop: -6 }} onClick=${() => go("versoes", { rid: r.id })} aria-label="Histórico de versões"><${I} n="more" /></button></div>
        <p className="small purple" style=${{ fontWeight: 700 }}>${meu ? "Por você · " : ""}${a.nome}</p>
        <p className="meta">Versão ${v.n} · ${fmtData(v.data)}</p>
        ${meu ? null : html`<${Badge} t="lock" icon="lock">Somente leitura<//>`}
        <p className="small muted" style=${{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>${v.conteudo.orientacoes || v.conteudo.prescricao}</p>
      </div>
    </div>
    <div className="row" style=${{ justifyContent: meu ? "flex-start" : "flex-end" }}>
      ${meu ? html`<${Btn} v="secondary" small icon="pencil" onClick=${() => go("editar", { rid: r.id })}>Editar meu registro<//><button className="btn btn-link" onClick=${() => go("vRegistro", { rid: r.id })}>Ver</button>` : html`<${Btn} v="secondary" small icon="eye" onClick=${() => go("vRegistro", { rid: r.id })}>Consultar<//>`}
    </div>
  </div>`;
}

/* ---------- 29 Nova orientação ---------- */
const CAMPOS = {
  tratamento: [["administracao", "Administração", "Ex.: conforme receita veterinária"], ["duracao", "Duração", "Ex.: 10 dias"]],
  alimentar: [["alimento", "Alimento", "Ex.: ração para adultos de porte pequeno"], ["quantidade", "Quantidade", "Ex.: 80 g por dia"], ["frequencia", "Frequência", "Ex.: 2 vezes ao dia"]],
  receita: [["prescricao", "Prescrição", "Medicamento, dose e via"]],
  avaliacao: [],
};
function NovaOrientacao({ p }) {
  const { st, user, mut, toast, go, goBack, replace } = useApp();
  const draft = p.rid && st.registros.find((r) => r.id === p.rid && r.autorId === user.id && r.status === "rascunho");
  const [f, setF] = useState(() => draft ? { tipo: draft.tipo, titulo: draft.titulo, retorno: draft.retorno || "", anexo: draft.anexo || null, conteudo: { ...draft.rascunho } } : { tipo: "tratamento", titulo: "", retorno: "", anexo: null, conteudo: { orientacoes: "" } });
  const [err, setErr] = useState({}); const [busy, run] = useBusy(); const [qual, setQual] = useState(""); const fref = useRef(null);
  const bloq = bloqueioVet(st, user, p.petId); if (bloq) return bloq;
  const pet = petById(st, p.petId);
  const setC = (k) => (v) => { setF({ ...f, conteudo: { ...f.conteudo, [k]: v } }); setErr({ ...err, [k]: "" }); };
  const validar = () => { const x = {}; if (!f.titulo.trim()) x.titulo = "Dê um nome à orientação."; if (f.tipo === "receita" ? !(f.conteudo.prescricao || "").trim() : !(f.conteudo.orientacoes || "").trim()) x[f.tipo === "receita" ? "prescricao" : "orientacoes"] = "Preencha este campo para o tutor entender o cuidado."; setErr(x); return !Object.keys(x).length; };
  const salvar = (rev) => { if (rev && !validar()) return; setQual(rev ? "rev" : "ras"); run(async () => {
    try { const r = mut((d) => A.salvarRascunho(d, { id: draft && draft.id, petId: pet.id, tipo: f.tipo, titulo: f.titulo, retorno: f.retorno, anexo: f.anexo, conteudo: f.conteudo })); if (rev) replace("revisar", { rid: r.id }); else { toast("Rascunho salvo. Só você pode vê-lo."); goBack(); } }
    catch (er) { setErr({ geral: er.message }); }
  }); };
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t=${draft ? "Continuar rascunho" : "Nova orientação"} />
    <${PetHead} pet=${pet} size=${96}><p className="small muted num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p><${Badge} icon="checkC">Acesso autorizado<//><p className="small muted">${autorRot(user)}: ${user.nome}</p><//>
    ${err.geral ? html`<div className="formerr" role="alert">${err.geral}</div>` : null}
    <${Field} id="no-tipo" label="Tipo"><${Sel} id="no-tipo" value=${f.tipo} onChange=${(v) => setF({ ...f, tipo: v, titulo: f.titulo || "" })} options=${[{ v: "tratamento", t: "Tratamento" }, { v: "alimentar", t: "Plano alimentar" }, { v: "receita", t: "Receita" }, { v: "avaliacao", t: "Avaliação clínica" }]} /><//>
    <${Field} id="no-tit" label="Título" error=${err.titulo}><${Inp} id="no-tit" value=${f.titulo} onChange=${(v) => { setF({ ...f, titulo: v }); setErr({ ...err, titulo: "" }); }} placeholder=${"Ex.: " + TIPOS[f.tipo].nome} bad=${err.titulo} maxLength=${80} /><//>
    ${CAMPOS[f.tipo].map(([k, l, ph]) => html`<${Field} key=${k} id=${"no-" + k} label=${l} error=${err[k]}>${k === "prescricao" ? html`<${Area} id=${"no-" + k} value=${f.conteudo[k] || ""} onChange=${setC(k)} placeholder=${ph} bad=${err[k]} rows=${3} />` : html`<${Inp} id=${"no-" + k} value=${f.conteudo[k] || ""} onChange=${setC(k)} placeholder=${ph} />`}<//>`)}
    <${Field} id="no-ori" label="Orientações ao tutor" error=${err.orientacoes} opt=${f.tipo === "receita"}><${Area} id="no-ori" value=${f.conteudo.orientacoes || ""} onChange=${setC("orientacoes")} placeholder="Descreva os cuidados de forma clara" bad=${err.orientacoes} /><//>
    <input ref=${fref} type="file" className="sr" id="no-arq" accept=".pdf,image/*" onChange=${(e) => { const a = e.target.files && e.target.files[0]; e.target.value = ""; if (!a) return; if (a.size > 10 * 1048576) { setErr({ ...err, anexo: "O arquivo passa de 10 MB." }); return; } setF({ ...f, anexo: { nome: a.name, tamanho: a.size, tipo: a.type } }); }} />
    <button type="button" className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => fref.current.click()}>
      <span className="purple"><${I} n=${f.anexo ? "checkC" : "clip"} s=${26} /></span>
      <div className="grow"><p className="purple" style=${{ fontWeight: 800 }}>${f.anexo ? f.anexo.nome : "Anexar receita ou arquivo"}</p>${f.anexo ? html`<p className="small muted">${kb(f.anexo.tamanho)} · pronto (simulado)</p>` : null}</div>
      ${f.anexo ? html`<span className="iconbtn" role="button" aria-label="Remover anexo" onClick=${(e) => { e.stopPropagation(); setF({ ...f, anexo: null }); }}><${I} n="x" /></span>` : html`<span className="chev"><${I} n="right" /></span>`}
    </button>
    ${err.anexo ? html`<p className="err">${err.anexo}</p>` : null}
    <${Field} id="no-ret" label="Revisão / retorno" opt><input id="no-ret" type="date" className="inp" value=${f.retorno} min=${new Date().toISOString().slice(0, 10)} onChange=${(e) => setF({ ...f, retorno: e.target.value })} /><//>
    <div className="btns"><${Btn} busy=${busy && qual === "rev"} disabled=${busy} onClick=${() => salvar(true)}>Revisar antes de publicar<//><${Btn} v="secondary" busy=${busy && qual === "ras"} disabled=${busy} onClick=${() => salvar(false)}>Salvar rascunho<//></div>
    <p className="foot"><${I} n="lock" s=${16} />Rascunhos são privados. O tutor só vê depois da publicação.</p>
  </div>`;
}

/* ---------- 30 Revisar e publicar ---------- */
function Revisar({ p }) {
  const { st, user, mut, toast, replace, go } = useApp();
  const r = st.registros.find((x) => x.id === p.rid && x.autorId === user.id);
  const [chk, setChk] = useState({ pet: false, texto: false, anexos: false }); const [notif, setNotif] = useState(true);
  const [busy, run] = useBusy(); const [err, setErr] = useState("");
  if (!r) return html`<${SemAcessoGenerico} />`;
  const bloq = bloqueioVet(st, user, r.petId); if (bloq) return bloq;
  if (r.status !== "rascunho") return html`<div className="scr"><${Top} back /><${Note} t="g" icon="checkC">Esta orientação já foi publicada.<//><${Btn} onClick=${() => replace("prontuario", { petId: r.petId })}>Abrir prontuário<//></div>`;
  const pet = petById(st, r.petId); const c = r.rascunho || {};
  const ok = chk.pet && chk.texto && chk.anexos;
  const itens = [["pet", `Pet correto: ${pet.nome} (${fmtCod(pet.codigo)})`], ["texto", "Texto revisado"], ["anexos", r.anexo ? `Anexo conferido: ${r.anexo.nome}` : "Sem anexos para conferir"]];
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} c t="Revisar orientação" />
    <${PetHead} pet=${pet} size=${100}><p className="muted">${pet.raca || pet.especie}</p><${Badge} t="soft" icon="file">Rascunho<//><//>
    <div className="card">
      <div className="row top-a" style=${{ alignItems: "flex-start" }}><${Tile} icon=${TIPOS[r.tipo].icon} /><div className="grow"><h3 style=${{ fontSize: 20 }}>${r.titulo}</h3><p className="muted small">${TIPOS[r.tipo].nome} · ${autorRot(user)}: ${user.nome}</p></div></div>
      ${CAMPOS[r.tipo].length ? html`<div className="kv">${CAMPOS[r.tipo].map(([k, l]) => html`<${React.Fragment} key=${k}><div className="k">${l}</div><div className="v">${c[k] || "—"}</div><//>`)}</div>` : null}
      ${c.orientacoes ? html`<p className="pre small">${c.orientacoes}</p>` : null}
      ${r.retorno ? html`<p className="small muted">Revisão / retorno: ${fmtData(r.retorno + "T12:00")}</p>` : null}
    </div>
    <fieldset className="card white" style=${{ margin: 0 }}>
      <legend className="sr">Checklist de revisão</legend>
      <h3>Checklist de revisão</h3>
      ${itens.map(([k, t]) => html`<label key=${k} className="row" style=${{ cursor: "pointer", minHeight: 40 }}><input type="checkbox" checked=${chk[k]} onChange=${(e) => setChk({ ...chk, [k]: e.target.checked })} style=${{ width: 22, height: 22, accentColor: "var(--roxo)" }} />${t}</label>`)}
    </fieldset>
    <${Note} icon="info">Após publicar, o tutor poderá ler e adicionar observações. Apenas você poderá editar este registro.<//>
    <div className="card green row" style=${{ flexDirection: "row" }}><${Tile} icon="bell" g sm /><label htmlFor="rv-not" className="grow"><p style=${{ fontWeight: 800 }}>Notificar tutor</p><p className="small">${notif ? "O tutor será avisado quando a orientação for publicada." : "O tutor verá a orientação ao abrir o app, sem aviso."}</p></label><${Toggle} id="rv-not" on=${notif} onChange=${setNotif} label="Notificar tutor" /></div>
    ${err ? html`<div className="formerr" role="alert">${err}</div>` : null}
    <div className="btns">
      <${Btn} busy=${busy} disabled=${!ok} onClick=${() => run(async () => { try { mut((d) => A.publicar(d, r.id, notif)); toast(notif ? "Orientação publicada. O tutor foi avisado." : "Orientação publicada."); replace("prontuario", { petId: pet.id }); } catch (er) { setErr(er.message); } })}>Publicar orientação<//>
      ${ok ? null : html`<p className="meta center">Marque os três itens para publicar.</p>`}
      <${Btn} v="secondary" onClick=${() => replace("novaOrientacao", { petId: pet.id, rid: r.id })}>Voltar e ajustar<//>
    </div>
  </div>`;
}

/* ---------- 31 Editar registro próprio ---------- */
function Editar({ p }) {
  const { st, user, mut, toast, goBack, go } = useApp();
  const r = st.registros.find((x) => x.id === p.rid);
  const [base] = useState(() => (r ? atual(r).n : 0));
  const [c, setC] = useState(() => (r ? { ...atual(r).conteudo } : {}));
  const [motivo, setMotivo] = useState(""); const [err, setErr] = useState({}); const [busy, run] = useBusy();
  if (!r || r.status !== "publicado") return html`<${SemAcessoGenerico} />`;
  const bloq = bloqueioVet(st, user, r.petId); if (bloq) return bloq;
  if (r.autorId !== user.id) return html`<${VetRegistro} p=${{ rid: r.id }} />`;
  const pet = petById(st, r.petId);
  const set = (k) => (v) => { setC({ ...c, [k]: v }); setErr({ ...err, [k]: "" }); };
  const salvar = () => {
    const x = {}; if (!motivo.trim()) x.motivo = "Explique o motivo da alteração."; if (JSON.stringify(c) === JSON.stringify(atual(r).conteudo)) x.geral = "Nada foi alterado no conteúdo.";
    setErr(x); if (Object.keys(x).length) return;
    run(async () => { try { mut((d) => A.novaVersao(d, r.id, base, c, motivo)); toast(`Versão ${base + 1} salva. A versão ${base} foi preservada.`); goBack(); } catch (er) { setErr({ geral: er.message }); } });
  };
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <${Title} t="Editar meu registro" />
    <${PetHead} pet=${pet} size=${96}><p className="small muted num">${pet.raca || pet.especie} · ID ${fmtCod(pet.codigo)}</p><p className="h3">${r.titulo}</p><p className="small muted">${user.nome} · Você</p><${Badge} icon="checkC">Acesso autorizado<//><//>
    <div className="card row" style=${{ flexDirection: "row" }}><${Tile} icon="file" sm /><div><p className="purple" style=${{ fontWeight: 800 }}>Versão atual: ${atual(r).n}</p><p className="small muted">Esta é a versão mais recente deste registro.</p></div></div>
    ${err.geral ? html`<div className="formerr" role="alert">${err.geral}</div>` : null}
    ${CAMPOS[r.tipo].map(([k, l]) => html`<${Field} key=${k} id=${"ed-" + k} label=${l}>${k === "prescricao" ? html`<${Area} id=${"ed-" + k} value=${c[k] || ""} onChange=${set(k)} rows=${3} />` : html`<${Inp} id=${"ed-" + k} value=${c[k] || ""} onChange=${set(k)} />`}<//>`)}
    <${Field} id="ed-ori" label="Orientações"><${Area} id="ed-ori" value=${c.orientacoes || ""} onChange=${set("orientacoes")} /><//>
    <${Field} id="ed-mot" label="Motivo da alteração" error=${err.motivo}><${Area} id="ed-mot" value=${motivo} onChange=${(v) => { setMotivo(v); setErr({ ...err, motivo: "" }); }} placeholder="Descreva o ajuste" rows=${2} bad=${err.motivo} /><//>
    <${Note} t="g" icon="info">A versão anterior será preservada.<//>
    <div className="btns"><${Btn} busy=${busy} onClick=${salvar}>Salvar nova versão<//><${Btn} v="secondary" onClick=${goBack} disabled=${busy}>Cancelar<//></div>
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => go("versoes", { rid: r.id })}>Ver histórico de versões</button>
  </div>`;
}

/* ---------- 32 Registro (próprio ou de outro autor) em leitura ---------- */
function VetRegistro({ p }) {
  const { st, user, go } = useApp();
  const r = st.registros.find((x) => x.id === p.rid);
  if (!r || r.status !== "publicado") return html`<${SemAcessoGenerico} />`;
  const bloq = bloqueioVet(st, user, r.petId); if (bloq) return bloq;
  const pet = petById(st, r.petId); const a = userById(st, r.autorId); const v = atual(r); const meu = a.id === user.id;
  return html`<div className="scr">
    <${Top} back logo="left" right=${html`<span></span>`} />
    <${Title} t="Registro clínico" sub=${meu ? "Seu registro publicado." : "Visualize o registro de outro veterinário."} />
    <${PetHead} pet=${pet} size=${110}><p className="muted">${pet.raca || pet.especie}</p><${Badge} icon="paw">ID do pet: ${fmtCod(pet.codigo)}<//><//>
    <div className="card">
      <div className="row top-a" style=${{ alignItems: "flex-start" }}>
        <${Tile} icon=${TIPOS[r.tipo].icon} />
        <div className="grow stack" style=${{ gap: 2 }}><h3 style=${{ fontSize: 20 }}>${r.titulo}</h3><p className="muted small">${autorRot(a)}: ${a.nome}</p><p className="muted small">Versão ${v.n} · ${fmtData(v.data)}</p>
        ${meu ? null : html`<span className="badge" style=${{ background: "#FBE3F2", color: "#8A1F5C", marginTop: 4 }}><${I} n="lock" s=${15} />Somente leitura</span>`}</div>
      </div>
      ${CAMPOS[r.tipo].length ? html`<div className="kv">${CAMPOS[r.tipo].map(([k, l]) => html`<${React.Fragment} key=${k}><div className="k">${l}</div><div className="v">${v.conteudo[k] || "—"}</div><//>`)}</div>` : null}
      <p className="pre" style=${{ background: "var(--soft-2)", borderRadius: 14, padding: 16, userSelect: "text" }}>${v.conteudo.orientacoes || "—"}</p>
      ${r.anexo ? html`<p className="small"><${I} n="clip" s=${16} /> ${r.anexo.nome} · ${kb(r.anexo.tamanho)}</p>` : null}
      ${meu ? null : html`<${Note} t="i" icon="info"><b>Você está como ${user.nome}.</b><br />Somente o autor pode editar este registro.<//>`}
    </div>
    ${meu ? html`<${Btn} icon="pencil" onClick=${() => go("editar", { rid: r.id })}>Editar meu registro<//>` : html`<${Btn} v="secondary" icon="filePlus" onClick=${() => go("novaOrientacao", { petId: pet.id })}>Adicionar minha orientação<//>`}
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => go("versoes", { rid: r.id })}>Histórico de versões</button>
  </div>`;
}

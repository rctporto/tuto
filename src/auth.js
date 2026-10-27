/* ---------- 01 / 21 Cadastro ---------- */
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
function Cadastro({ p }) {
  const { mut, replace, go, toast } = useApp();
  const [tipo, setTipo] = useState(p.tipo || "tutor");
  const [f, setF] = useState({ nome: "", email: "", senha: "", crmv: "", uf: "", documento: null });
  const [e, setE] = useState({});
  const [geral, setGeral] = useState("");
  const [busy, run] = useBusy();
  const docRef = useRef(null);
  const set = (k) => (v) => { setF({ ...f, [k]: v }); setE({ ...e, [k]: "" }); };
  const vet = tipo === "vet";
  function validar() {
    const x = {};
    if (f.nome.trim().length < 3) x.nome = "Informe seu nome completo.";
    if (!emailOk(f.email)) x.email = "Informe um e-mail válido, como nome@email.com.";
    if (f.senha.length < 8) x.senha = "Use pelo menos 8 caracteres.";
    if (vet && !/^\d{3,7}$/.test(f.crmv.trim())) x.crmv = "Informe só os números do registro.";
    if (vet && !f.uf) x.uf = "Selecione a UF.";
    setE(x); return !Object.keys(x).length;
  }
  const enviar = () => { setGeral(""); if (!validar()) return; run(async () => {
    try {
      const u = mut((d) => A.criarConta(d, { ...f, tipo }));
      if (vet) toast("Dados enviados para verificação.");
      else replace("confirmar", { email: u.email, uid: u.id });
    } catch (er) { setGeral(er.message); }
  }); };
  return html`<div className="scr">
    <div className="center" style=${{ display: "flex", justifyContent: "center", paddingTop: 8 }}><${Logo} w=${vet ? 150 : 176} /></div>
    <${Title} c t=${vet ? "Cadastro profissional" : "Crie sua conta"} sub=${vet ? "Crie sua conta para acessar o tutô como veterinário." : "Mais cuidado, todos os dias."} />
    <${Seg} label="Tipo de conta" light=${!vet} value=${tipo} onChange=${(v) => { setTipo(v); setE({}); setGeral(""); }} options=${[{ v: "tutor", t: "Sou tutor", icon: "user" }, { v: "vet", t: "Sou veterinário", icon: "vet" }]} />
    <form className="stack-12" onSubmit=${(ev) => { ev.preventDefault(); enviar(); }} noValidate>
      ${geral ? html`<div className="formerr" role="alert"><${I} n="alert" s=${20} />${geral}</div>` : null}
      <${Field} id="c-nome" label=${vet ? "Nome completo" : "Nome"} error=${e.nome}><${Inp} id="c-nome" value=${f.nome} onChange=${set("nome")} placeholder="Seu nome completo" auto="name" bad=${e.nome} /><//>
      <${Field} id="c-email" label="E-mail" error=${e.email}><${Inp} id="c-email" type="email" value=${f.email} onChange=${set("email")} placeholder="seu@email.com" auto="email" bad=${e.email} /><//>
      <${Field} id="c-senha" label="Senha" error=${e.senha} help="Mínimo de 8 caracteres."><${Inp} id="c-senha" type="password" value=${f.senha} onChange=${set("senha")} placeholder=${vet ? "Crie uma senha" : "Crie uma senha segura"} auto="new-password" bad=${e.senha} /><//>
      ${vet ? html`<div className="row top-a" style=${{ alignItems: "flex-start" }}>
          <div className="grow"><${Field} id="c-crmv" label="CRMV" error=${e.crmv}><${Inp} id="c-crmv" value=${f.crmv} onChange=${set("crmv")} placeholder="Número do registro" inputMode="numeric" bad=${e.crmv} /><//></div>
          <div className="grow"><${Field} id="c-uf" label="UF" error=${e.uf}><${Sel} id="c-uf" value=${f.uf} onChange=${set("uf")} bad=${e.uf} options=${[{ v: "", t: "Selecione", dis: true }, ...UFS]} /><//></div>
        </div>
        <input ref=${docRef} type="file" accept=".pdf,image/*" className="sr" id="c-doc" onChange=${(ev) => { const a = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (a) setF({ ...f, documento: { nome: a.name, tamanho: a.size } }); }} />
        <button type="button" className="card tight clickable row" style=${{ flexDirection: "row" }} onClick=${() => docRef.current.click()}>
          <${Tile} icon="file" sm />
          <div className="grow"><p className="lbl" style=${{ fontSize: 16 }}>Documento profissional</p><p className="small muted">${f.documento ? `${f.documento.nome} · ${kb(f.documento.tamanho)} · anexado` : "Anexe seu documento (opcional)"}</p></div>
          <span className="chev"><${I} n=${f.documento ? "checkC" : "plusC"} s=${26} /></span>
        </button>` : null}
      <${Btn} type="submit" busy=${busy} iconR=${vet ? "arrowR" : null}>${vet ? "Enviar para verificação" : "Criar conta"}<//>
    </form>
    ${vet
      ? html`<${Note} t="g" icon="shieldC">O acesso aos pets também depende da autorização de cada tutor.<//>`
      : html`<p className="foot" style=${{ display: "block" }}>Ao continuar, você aceita os <a className="purple" href="#termos" onClick=${(ev) => { ev.preventDefault(); toast("Os Termos de Uso serão publicados na versão final."); }}>Termos de Uso</a>. Consulte a <a className="purple" href="#privacidade" onClick=${(ev) => { ev.preventDefault(); toast("A Política de Privacidade será publicada na versão final."); }}>Política de Privacidade</a>.</p>`}
    <hr className="sep" />
    <p className="center small">Já tem conta? <button className="btn btn-link" style=${{ display: "inline" }} onClick=${() => go("login")}>Entrar</button></p>
  </div>`;
}

/* ---------- Tela inicial: escolher cadastro ---------- */
function BoasVindas() {
  const { go } = useApp();
  const opcao = (tipo, icon, t, sub) => html`<button type="button" className="card clickable row" style=${{ flexDirection: "row", textAlign: "left" }} onClick=${() => go("cadastro", { tipo })}>
      <${Tile} icon=${icon} />
      <div className="grow"><p style=${{ fontWeight: 800, fontSize: 18 }}>${t}</p><p className="small muted">${sub}</p></div>
      <span className="chev"><${I} n="right" s=${24} /></span>
    </button>`;
  return html`<div className="scr" style=${{ paddingBottom: 0, minHeight: "100%" }}>
    <div style=${{ display: "flex", justifyContent: "center", paddingTop: 36 }}><${Logo} w=${190} /></div>
    <${Title} c t=${html`<span className="purple">Boas-vindas à tutô!</span>`} sub="O histórico de saúde do seu pet em um só lugar. Como você quer se cadastrar?" />
    <div className="stack-12">
      ${opcao("tutor", "user", "Cadastrar tutor", "Crie sua conta com seu e-mail e vincule seus pets.")}
      ${opcao("vet", "vet", "Cadastrar veterinário", "Crie sua conta profissional com e-mail e CRMV.")}
    </div>
    <${Note} t="g" icon="shieldC">Toda conta nova passa pela aprovação de um administrador.<//>
    <p className="center small">Já tem conta? <button className="btn btn-link" style=${{ display: "inline" }} onClick=${() => go("login")}>Entrar</button></p>
    <div className="login-wave" aria-hidden="true" style=${{ marginTop: "auto" }}>
      <img src=${SYM} style=${{ width: 90, left: 24, top: 40 }} alt="" /><img src=${SYM} style=${{ width: 54, left: "45%", top: 78 }} alt="" /><img src=${SYM} style=${{ width: 100, right: 10, top: 90 }} alt="" />
    </div>
  </div>`;
}

/* ---------- 02 Entrar ---------- */
function Login() {
  const { mut, replace, go } = useApp();
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [err, setErr] = useState(""); const [busy, run] = useBusy();
  const entrar = () => { setErr(""); if (!email || !senha) { setErr("Preencha e-mail e senha."); return; } run(async () => {
    try {
      const r = mut((d) => A.entrar(d, email, senha));
      if (r.confirmar) replace("confirmar", { email: r.u.email, uid: r.u.id });
    } catch (er) { setErr(er.message); }
  }); };
  return html`<div className="scr" style=${{ paddingBottom: 0 }}>
    <div style=${{ display: "flex", justifyContent: "center", paddingTop: 36 }}><${Logo} w=${190} /></div>
    <${Title} c t=${html`<span className="purple">Que bom ter você aqui!</span>`} sub="Entre para acompanhar os cuidados." />
    <form className="stack-12" onSubmit=${(ev) => { ev.preventDefault(); entrar(); }} noValidate>
      ${err ? html`<div className="formerr" role="alert"><${I} n="alert" s=${20} />${err}</div>` : null}
      <label className="sr" htmlFor="l-email">E-mail</label>
      <${Inp} id="l-email" type="email" icon="mail" value=${email} onChange=${setEmail} placeholder="E-mail" auto="email" />
      <label className="sr" htmlFor="l-senha">Senha</label>
      <${Inp} id="l-senha" type="password" icon="lock" value=${senha} onChange=${setSenha} placeholder="Senha" auto="current-password" />
      <div style=${{ display: "flex", justifyContent: "flex-end" }}><button type="button" className="btn btn-link" onClick=${() => go("recuperar")}>Esqueci minha senha</button></div>
      <${Btn} type="submit" busy=${busy}>Entrar<//>
    </form>
    <p className="center small">Ainda não tem conta? <button className="btn btn-link" style=${{ display: "inline" }} onClick=${() => go("boasVindas")}>Cadastre-se</button></p>
    <p className="center meta">Demonstração: renato@, ana@ ou admin@exemplo.com, senha tuto1234</p>
    <div className="login-wave" aria-hidden="true">
      <img src=${SYM} style=${{ width: 90, left: 24, top: 40 }} alt="" /><img src=${SYM} style=${{ width: 54, left: "45%", top: 78 }} alt="" /><img src=${SYM} style=${{ width: 100, right: 10, top: 90 }} alt="" />
    </div>
  </div>`;
}

/* ---------- 03 Recuperar senha ---------- */
function Recuperar() {
  const { goBack } = useApp();
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  const [busy, run] = useBusy();
  const enviar = () => { setErr(""); if (!emailOk(email)) { setErr("Informe um e-mail válido."); return; } run(async () => setOk(true)); };
  return html`<div className="scr">
    <${Top} back logo="none" right=${html`<span></span>`} />
    <div style=${{ display: "flex", justifyContent: "center" }}><${Logo} w=${170} /></div>
    <${Title} c t="Esqueceu sua senha?" sub="Vamos enviar um link para você criar uma nova." />
    ${ok
      ? html`<${Note} t="g" icon="checkC"><b>Pedido recebido.</b> Se houver uma conta com este e-mail, o link chegará em instantes. Neste protótipo nenhum e-mail é enviado.<//>`
      : html`<form className="stack-12" onSubmit=${(ev) => { ev.preventDefault(); enviar(); }} noValidate>
          <${Field} id="r-email" label="E-mail" error=${err}><${Inp} id="r-email" type="email" icon="mail" value=${email} onChange=${(v) => { setEmail(v); setErr(""); }} placeholder="voce@exemplo.com" bad=${err} auto="email" /><//>
          <${Btn} type="submit" busy=${busy}>Enviar link<//>
        </form>`}
    <${Note} icon="mail"><span className="purple" style=${{ fontWeight: 700 }}>Confira também a pasta de spam.</span><//>
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${goBack}>Voltar para entrar</button>
  </div>`;
}

/* ---------- 04 Confirmar e-mail ---------- */
function Confirmar({ p }) {
  const { mut, toast, replace, st } = useApp();
  const [busy, run] = useBusy();
  const uidc = p.uid || st.pendenteConfirmacao;
  return html`<div className="scr">
    <${Top} back right=${html`<span></span>`} />
    <div style=${{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
      <span style=${{ width: 150, height: 150, borderRadius: "50%", background: "var(--menta)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--roxo)" }}><${I} n="mail" s=${72} sw=${1.8} /></span>
    </div>
    <${Title} c t=${html`<span className="purple">Confirme seu e-mail</span>`} sub=${`Enviamos um link para ${p.email || "o e-mail informado"}. Abra a mensagem para continuar.`} />
    <${Btn} busy=${busy} onClick=${() => run(async () => { try { mut((d) => A.confirmarEmail(d, uidc)); toast("E-mail confirmado. Boas-vindas ao tutô!"); } catch (er) { toast(er.message); } })}>Já confirmei meu e-mail<//>
    <p className="meta center">Protótipo: o botão acima simula a abertura do link de confirmação.</p>
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => toast("Mensagem reenviada (simulado).")}>Reenviar mensagem</button>
    <button className="btn btn-link" style=${{ alignSelf: "center" }} onClick=${() => replace("cadastro", { tipo: "tutor" })}>Corrigir e-mail</button>
  </div>`;
}

/* ---------- 22 Verificação pendente ---------- */
function Verificacao() {
  const { user, mut, toast, go } = useApp();
  if (user.verificacao === "recusado") return html`<div className="scr">
    <${Top} logo="left" bell />
    <div style=${{ display: "flex", justifyContent: "center" }}><span style=${{ width: 140, height: 140, borderRadius: "50%", background: "var(--err-bg)", color: "var(--err)", display: "flex", alignItems: "center", justifyContent: "center" }}><${I} n="alert" s=${64} sw=${1.8} /></span></div>
    <${Title} c t="Cadastro não aprovado" sub="O administrador não aprovou seu cadastro profissional." />
    <${Note} t="e" icon="alert"><b>Motivo:</b> ${user.motivoRecusa}<//>
    <${Btn} v="secondary" onClick=${() => mut((d) => A.sair(d))}>Sair<//>
  </div>`;
  const [ver, setVer] = useState(false);
  const st3 = [
    { t: "Dados recebidos", s: "Seus dados foram enviados com sucesso.", e: "ok" },
    { t: "Verificação profissional", s: "Nossa equipe está analisando suas informações.", e: "now" },
    { t: "Perfil liberado", s: "Avisaremos quando seu perfil for liberado.", e: "next" },
  ];
  return html`<div className="scr">
    <${Top} logo="left" bell />
    <div style=${{ display: "flex", justifyContent: "center" }}><span style=${{ width: 150, height: 150, borderRadius: "50%", background: "var(--soft-2)", color: "var(--roxo)", display: "flex", alignItems: "center", justifyContent: "center" }}><${I} n="idcard" s=${70} sw=${1.8} /></span></div>
    <${Title} c t=${html`<span className="purple">Cadastro em análise</span>`} sub="Estamos verificando seus dados profissionais." />
    <div className="card"><div className="steps">
      ${st3.map((x) => html`<div className="step" key=${x.t}>
        <span className="dotc" style=${{ background: x.e === "ok" ? "#5FD495" : x.e === "now" ? "var(--roxo)" : "var(--branco)", color: x.e === "next" ? "var(--b-ctrl)" : "var(--branco)", border: x.e === "next" ? "2px solid var(--b-ctrl)" : 0 }}><${I} n=${x.e === "ok" ? "check" : x.e === "now" ? "clock" : "x"} s=${18} sw=${2.6} style=${x.e === "next" ? { opacity: 0 } : null} /></span>
        <div><p className="h3" style=${{ fontSize: 17, color: x.e === "next" ? "var(--txt2)" : undefined }}>${x.t}</p><p className="small muted">${x.s}</p></div>
      </div>`)}
    </div></div>
    <${Note} t="g" icon="mega"><b>Avisaremos quando a análise terminar.</b><br />Você receberá uma notificação aqui no app.<//>
    ${ver ? html`<div className="card white"><div className="kv" style=${{ background: "transparent" }}>
        <div className="k">Nome</div><div className="v">${user.nome}</div>
        <div className="k">E-mail</div><div className="v">${user.email}</div>
        <div className="k">CRMV</div><div className="v">${user.crmv}-${user.uf}</div>
        <div className="k">Documento</div><div className="v">${user.documento ? user.documento.nome : "Não anexado"}</div>
      </div></div>` : null}
    <${Btn} iconR=${ver ? null : "right"} onClick=${() => setVer(!ver)}>${ver ? "Ocultar dados enviados" : "Ver dados enviados"}<//>
    <${Btn} v="secondary" onClick=${() => mut((d) => A.sair(d))}>Sair<//>
    <p className="meta center">Protótipo: entre como Administrador no painel de demonstração para aprovar.</p>
  </div>`;
}

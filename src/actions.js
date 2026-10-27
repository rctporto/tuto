/* ---------- operações (simulam o servidor: validam sessão, vínculo e autoria) ---------- */
function notif(d, para, tipo, extra) { d.notifs.push({ id: uid("n"), para, tipo, data: agoraISO(), lida: false, ...extra }); }
function avisarAdmins(d, kind, ref) { d.users.filter((u) => u.tipo === "admin").forEach((a) => notif(d, a.id, "pendencia", { kind, ref })); }
function erro(msg) { const e = new Error(msg); e.amigavel = true; throw e; }
function exigeSessao(d) { const u = userById(d, d.session && d.session.uid); if (!u) erro("Sua sessão terminou. Entre novamente."); return u; }

const A = {
  criarConta(d, f) {
    const email = f.email.trim().toLowerCase();
    if (d.users.some((u) => u.email === email)) erro("Não foi possível criar a conta com este e-mail. Se você já tem conta, entre ou recupere a senha.");
    const u = { id: uid("u"), tipo: f.tipo, nome: f.nome.trim(), email, senha: f.senha, criadoEm: agoraISO(), prefs: { acessos: true, orientacoes: true, rotina: true } };
    if (f.tipo === "vet") Object.assign(u, { crmv: f.crmv.trim(), uf: f.uf, verificacao: "pendente", titulo: "Médico(a)-veterinário(a)", documento: f.documento || null, emailConfirmado: true });
    else Object.assign(u, { emailConfirmado: false, aprovacao: "pendente" });
    d.users.push(u);
    avisarAdmins(d, f.tipo === "vet" ? "vet" : "tutor", u.id);
    d.session = f.tipo === "vet" ? { uid: u.id } : null;
    d.pendenteConfirmacao = f.tipo === "vet" ? null : u.id;
    return u;
  },
  confirmarEmail(d, userId) {
    const u = userById(d, userId); if (!u) erro("Conta não encontrada. Faça o cadastro novamente.");
    u.emailConfirmado = true; d.pendenteConfirmacao = null; d.session = { uid: u.id, petId: null }; return u;
  },
  entrar(d, email, senha) {
    const u = d.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || u.senha !== senha) erro("E-mail ou senha incorretos. Confira os dados e tente de novo.");
    if (u.tipo === "tutor" && !u.emailConfirmado) { d.pendenteConfirmacao = u.id; return { confirmar: true, u }; }
    d.session = { uid: u.id, petId: (petsDoTutor(d, u.id)[0] || {}).id || null };
    return { u };
  },
  sair(d) { d.session = null; },
  cadastrarPet(d, f) {
    const u = exigeSessao(d); if (u.tipo !== "tutor") erro("Somente tutores cadastram pets.");
    if (u.aprovacao !== "aprovado") erro("Sua conta ainda está em análise. Você poderá vincular pets depois da aprovação.");
    const campos = { nome: f.nome.trim(), especie: f.especie, raca: f.raca.trim(), sexo: f.sexo, nascimento: f.nascimento, foto: f.foto };
    let p = f.id && d.pets.find((x) => x.id === f.id);
    if (p) { if (p.tutorId !== u.id) erro("Você não pode alterar este pet."); Object.assign(p, campos); return p; }
    p = { id: uid("p"), tutorId: u.id, email: u.email, codigo: genCodigo(d), status: "aprovado", ...campos, criadoEm: agoraISO() };
    d.pets.push(p); d.session.petId = p.id;
    notif(d, u.id, "cadastro", { petId: p.id, lida: true });
    return p;
  },
  decidirCadastro(d, kind, id, aprovar, motivo) {
    const adm = exigeSessao(d); if (adm.tipo !== "admin") erro("Somente administradores aprovam cadastros.");
    if (!aprovar && !(motivo || "").trim()) erro("Explique o motivo da recusa. Ele será mostrado a quem fez o cadastro.");
    const m = (motivo || "").trim() || null;
    if (kind === "pet") {
      const p = petById(d, id); if (!p) erro("Cadastro não encontrado.");
      if (p.status !== "pendente") erro("Este cadastro já foi analisado.");
      p.status = aprovar ? "aprovado" : "recusado"; p.motivoRecusa = aprovar ? null : m; p.analisadoEm = agoraISO(); p.analisadoPor = adm.id;
      if (aprovar && !p.codigo) p.codigo = genCodigo(d);
      notif(d, p.tutorId, aprovar ? "cadastro" : "petRecusado", { petId: p.id });
    } else {
      const u = userById(d, id); if (!u) erro("Conta não encontrada.");
      if (u.tipo === "vet") {
        if (u.verificacao !== "pendente") erro("Este cadastro já foi analisado.");
        u.verificacao = aprovar ? "liberado" : "recusado"; u.motivoRecusa = aprovar ? null : m;
        notif(d, u.id, aprovar ? "liberado" : "vetRecusado", {});
      } else {
        if (u.aprovacao !== "pendente") erro("Este cadastro já foi analisado.");
        u.aprovacao = aprovar ? "aprovado" : "recusado"; u.motivoRecusa = aprovar ? null : m;
        notif(d, u.id, aprovar ? "contaAprovada" : "contaRecusada", {});
      }
      u.analisadoEm = agoraISO();
    }
    d.notifs.forEach((n) => { if (n.tipo === "pendencia" && n.ref === id) n.lida = true; });
  },
  atualizarFoto(d, petId, foto) { const u = exigeSessao(d); const p = petById(d, petId); if (!p || p.tutorId !== u.id) erro("Você não pode alterar este pet."); p.foto = foto; },
  buscarCodigo(d, codigo) {
    const u = exigeSessao(d); if (u.tipo !== "vet") erro("Busca disponível para veterinários.");
    if (u.verificacao !== "liberado") erro("Seu perfil profissional ainda está em análise.");
    const c = codigo.replace(/\D/g, ""); const p = c && d.pets.find((x) => x.codigo === c && x.status === "aprovado");
    return p ? { petId: p.id, codigo: p.codigo } : null; // só o identificador mínimo
  },
  solicitar(d, petId, motivo) {
    const u = exigeSessao(d); if (u.tipo !== "vet" || u.verificacao !== "liberado") erro("Seu perfil profissional precisa estar liberado.");
    const ja = pendenteDe(d, petId, u.id); if (ja) return ja; // idempotente: uma pendente por par
    if (vetPodeLer(d, u.id, petId)) erro("Você já tem acesso ativo a este pet.");
    if ((petById(d, petId) || {}).status !== "aprovado") erro("Este pet não está disponível para solicitações.");
    const s = { id: uid("s"), petId, vetId: u.id, motivo: motivo.trim() || "Acompanhamento veterinário", status: "pendente", criadaEm: agoraISO() };
    d.solicitacoes.push(s);
    const p = petById(d, petId);
    notif(d, p.tutorId, "solicitacao", { ref: s.id, petId });
    return s;
  },
  cancelarSolicitacao(d, sid) {
    const u = exigeSessao(d); const s = d.solicitacoes.find((x) => x.id === sid);
    if (!s || s.vetId !== u.id) erro("Solicitação não encontrada.");
    if (s.status !== "pendente") erro("Esta solicitação já foi decidida pelo tutor.");
    s.status = "cancelada"; s.decididaEm = agoraISO();
  },
  decidir(d, sid, aprovar) {
    const u = exigeSessao(d); const s = d.solicitacoes.find((x) => x.id === sid);
    const p = s && petById(d, s.petId);
    if (!s || !p || p.tutorId !== u.id) erro("Só o tutor responsável pode decidir sobre este acesso.");
    if (s.status !== "pendente") erro(s.status === "cancelada" ? "O profissional cancelou esta solicitação." : "Esta solicitação já foi decidida.");
    s.status = aprovar ? "aprovada" : "recusada"; s.decididaEm = agoraISO();
    if (aprovar) {
      const l = vinculoDe(d, s.petId, s.vetId);
      if (l) { l.status = "ativo"; l.desde = agoraISO(); l.revogadoEm = null; }
      else d.vinculos.push({ id: uid("v"), petId: s.petId, vetId: s.vetId, status: "ativo", desde: agoraISO() });
      notif(d, s.vetId, "autorizado", { petId: s.petId });
    } else notif(d, s.vetId, "recusado", { petId: s.petId, ref: s.id });
    d.notifs.forEach((n) => { if (n.para === u.id && n.ref === sid) n.lida = true; });
  },
  revogar(d, petId, vetId) {
    const u = exigeSessao(d); const p = petById(d, petId);
    if (!p || p.tutorId !== u.id) erro("Só o tutor responsável pode revogar acessos.");
    const l = vinculoDe(d, petId, vetId); if (!l || l.status !== "ativo") erro("Este acesso já não está ativo.");
    l.status = "revogado"; l.revogadoEm = agoraISO();
    d.registros.forEach((r) => { if (r.petId === petId && r.autorId === vetId && r.status === "rascunho") r.bloqueado = true; });
    notif(d, vetId, "revogado", { petId });
  },
  salvarRascunho(d, f) {
    const u = exigeSessao(d); if (!vetPodeLer(d, u.id, f.petId)) erro("Seu acesso a este pet não está ativo.");
    let r = f.id && d.registros.find((x) => x.id === f.id);
    if (r && (r.autorId !== u.id || r.status !== "rascunho")) erro("Você só pode alterar seus próprios rascunhos.");
    if (!r) { r = { id: uid("r"), petId: f.petId, autorId: u.id, status: "rascunho", criadoEm: agoraISO(), versoes: [] }; d.registros.push(r); }
    r.tipo = f.tipo; r.titulo = f.titulo.trim() || TIPOS[f.tipo].nome; r.retorno = f.retorno; r.anexo = f.anexo; r.rascunho = { ...f.conteudo }; r.atualizadoEm = agoraISO();
    return r;
  },
  publicar(d, rid, notificar) {
    const u = exigeSessao(d); const r = d.registros.find((x) => x.id === rid);
    if (!r || r.autorId !== u.id) erro("Você só pode publicar seus próprios registros.");
    if (!vetPodeLer(d, u.id, r.petId)) erro("Seu acesso a este pet foi encerrado. O rascunho não foi publicado.");
    if (r.status === "publicado") return r; // repetir o envio não duplica
    r.status = "publicado"; r.publicadoEm = agoraISO();
    r.versoes = [{ n: 1, conteudo: { ...r.rascunho }, data: r.publicadoEm, motivo: "Publicação inicial", autorId: u.id }];
    delete r.rascunho;
    const p = petById(d, r.petId);
    notif(d, u.id, "publicada", { ref: r.id, petId: r.petId, lida: true });
    if (notificar) notif(d, p.tutorId, "orientacao", { ref: r.id, petId: r.petId });
    return r;
  },
  descartarRascunho(d, rid) {
    const u = exigeSessao(d); const i = d.registros.findIndex((x) => x.id === rid && x.autorId === u.id && x.status === "rascunho");
    if (i >= 0) d.registros.splice(i, 1);
  },
  novaVersao(d, rid, base, conteudo, motivo) {
    const u = exigeSessao(d); const r = d.registros.find((x) => x.id === rid);
    if (!r) erro("Registro não encontrado.");
    if (!podeEditar(d, u, r)) erro(r.autorId !== u.id ? "Somente o autor pode editar este registro. Nada foi alterado." : "Seu acesso a este pet foi encerrado. Nada foi alterado.");
    if (atual(r).n !== base) erro("Este registro mudou desde que você abriu a edição. Reabra para ver a versão mais recente.");
    r.versoes.push({ n: base + 1, conteudo: { ...conteudo }, data: agoraISO(), motivo: motivo.trim(), autorId: u.id });
    return r;
  },
  registrarCuidado(d, f) {
    const u = exigeSessao(d); const p = petById(d, f.petId);
    if (!p || p.tutorId !== u.id) erro("Somente o tutor registra os cuidados realizados.");
    const r = d.registros.find((x) => x.id === f.registroId);
    if (d.cuidados.some((c) => c.chave === f.chave)) return; // reenvio não duplica
    d.cuidados.push({ id: uid("c"), chave: f.chave, petId: f.petId, registroId: f.registroId, versao: r ? atual(r).n : null, resultado: f.resultado, dataHora: f.dataHora, obs: f.obs.trim(), autorId: u.id, registradoEm: agoraISO() });
  },
  novaNota(d, f) {
    const u = exigeSessao(d); const p = petById(d, f.petId);
    if (!p || p.tutorId !== u.id) erro("Anotações do tutor são criadas apenas pelo tutor do pet.");
    if (d.notas.some((n) => n.chave === f.chave)) return;
    const destinos = (f.notificar ? vinculosAtivos(d, f.petId).map((v) => v.vetId) : []);
    const n = { id: uid("nt"), chave: f.chave, petId: f.petId, autorId: u.id, categoria: f.categoria, titulo: f.titulo.trim(), descricao: f.descricao.trim(), anexo: f.anexo || null, ref: f.ref || null, notificar: destinos, data: agoraISO() };
    d.notas.push(n);
    destinos.forEach((vid) => notif(d, vid, "nota", { ref: n.id, petId: f.petId }));
    return n;
  },
  liberarPerfil(d, vetId) { const v = userById(d, vetId); if (v) { v.verificacao = "liberado"; notif(d, v.id, "liberado", {}); } },
  lerNotifs(d, uidv) { d.notifs.forEach((n) => { if (n.para === uidv) n.lida = true; }); },
  prefs(d, k, v) { const u = exigeSessao(d); u.prefs = { ...(u.prefs || {}), [k]: v }; },
};

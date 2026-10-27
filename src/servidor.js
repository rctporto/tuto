/* ---------- modo servidor: Supabase (login, banco e regras de acesso reais) ---------- */
const CFG = window.TUTO_CONFIG || {};
const SERVIDOR = !DEMO && !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const sb = SERVIDOR ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;
const urlRetorno = () => location.origin + location.pathname;

function falha(e) {
  const m = (e && e.message) || "";
  if (/fetch|network|Failed to/i.test(m)) erro("Não foi possível falar com o servidor. Confira sua internet e tente de novo.");
  if (/JWT|session|sess[aã]o/i.test(m) && !/Sua sessão/.test(m)) erro("Sua sessão terminou. Entre novamente.");
  erro(m || "Algo deu errado. Tente de novo.");
}
async function rpc(nome, args) {
  const { data, error } = await sb.rpc(nome, args || {});
  if (error) falha(error);
  return data;
}

const SRV = {
  async estado() { return rpc("estado"); },
  async criarConta(f) {
    const email = f.email.trim().toLowerCase();
    const meta = { tipo: f.tipo, nome: f.nome.trim() };
    if (f.tipo === "vet") Object.assign(meta, { crmv: f.crmv.trim(), uf: f.uf, documento: f.documento || null });
    const { data, error } = await sb.auth.signUp({ email, password: f.senha, options: { data: meta, emailRedirectTo: urlRetorno() } });
    if (error) {
      if (/registered|exists/i.test(error.message)) erro("Não foi possível criar a conta com este e-mail. Se você já tem conta, entre ou recupere a senha.");
      if (/password/i.test(error.message)) erro("Escolha uma senha mais forte, com pelo menos 8 caracteres.");
      falha(error);
    }
    if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) erro("Não foi possível criar a conta com este e-mail. Se você já tem conta, entre ou recupere a senha.");
    return { id: data.user && data.user.id, email, precisaConfirmar: !data.session };
  },
  async reenviarConfirmacao(email) {
    const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: urlRetorno() } });
    if (error) falha(error);
  },
  async entrar(email, senha) {
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
    if (error) {
      if (/confirm/i.test(error.message)) return { confirmar: true, u: { email: email.trim().toLowerCase() } };
      if (/invalid/i.test(error.message)) erro("E-mail ou senha incorretos. Confira os dados e tente de novo.");
      falha(error);
    }
    return { u: data.user };
  },
  async recuperar(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: urlRetorno() });
    if (error) falha(error);
  },
  async novaSenha(senha) {
    const { error } = await sb.auth.updateUser({ password: senha });
    if (error) falha(error);
  },
  async sair() { await sb.auth.signOut(); },
  cadastrarPet: (f) => rpc("cadastrar_pet", { f }),
  atualizarFoto: (petId, foto) => rpc("atualizar_foto", { p_pet: petId, p_foto: foto }),
  decidirCadastro: (kind, id, aprovar, motivo) => rpc("decidir_cadastro", { p_id: id, p_aprovar: aprovar, p_motivo: motivo || null }),
  buscarCodigo: (codigo) => rpc("buscar_codigo", { p_codigo: codigo }),
  solicitar: (petId, motivo) => rpc("solicitar", { p_pet: petId, p_motivo: motivo }),
  cancelarSolicitacao: (sid) => rpc("cancelar_solicitacao", { p_sid: sid }),
  decidir: (sid, aprovar) => rpc("decidir", { p_sid: sid, p_aprovar: aprovar }),
  revogar: (petId, vetId) => rpc("revogar", { p_pet: petId, p_vet: vetId }),
  salvarRascunho: (f) => rpc("salvar_rascunho", { f: { ...f, tituloPadrao: (TIPOS[f.tipo] || {}).nome } }),
  publicar: (rid, notificar) => rpc("publicar", { p_rid: rid, p_notificar: !!notificar }),
  descartarRascunho: (rid) => rpc("descartar_rascunho", { p_rid: rid }),
  novaVersao: (rid, base, conteudo, motivo) => rpc("nova_versao", { p_rid: rid, p_base: base, p_conteudo: conteudo, p_motivo: motivo }),
  registrarCuidado: (f) => rpc("registrar_cuidado", { f }),
  novaNota: (f) => rpc("nova_nota", { f }),
  lerNotifs: () => rpc("ler_notifs"),
  prefs: (k, v) => rpc("salvar_pref", { p_chave: k, p_valor: v }),
};

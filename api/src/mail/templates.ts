export function resetPasswordEmail(name: string, link: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Redefinição de senha</h2>
      <p>Olá, ${name}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha no Locus Club. Clique no link abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
      <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Redefinir senha</a></p>
      <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
    </div>
  `;
}

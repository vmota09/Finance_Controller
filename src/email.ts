import nodemailer from "nodemailer"

const transporte = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function enviarEmail(para: string, assunto: string, texto: string) {
  // pega do .env
  if (!process.env.SMTP_USER) return console.log(`[email simulado] para: ${para}\n${texto}`)
  await transporte.sendMail({ from: `Finance Controller <${process.env.SMTP_USER}>`, to: para, subject: assunto, text: texto })
}
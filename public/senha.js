// Coloca um botão "mostrar / ocultar" dentro de todo campo de senha da página.
// Basta incluir este arquivo na página: <script type="module" src="./senha.js"></script>

for (const input of document.querySelectorAll('input[type="password"]')) {
  // embrulha o input numa caixa para posicionar o botão por cima, no canto direito
  const caixa = document.createElement("span")
  caixa.className = "campo-senha"
  input.replaceWith(caixa)
  caixa.append(input)

  const botao = document.createElement("button")
  botao.type = "button"            // type="button" para não enviar o formulário
  botao.className = "ver-senha"
  caixa.append(botao)

  // troca o tipo do input: "password" esconde os caracteres, "text" mostra
  function mostrar(visivel) {
    input.type = visivel ? "text" : "password"
    botao.textContent = visivel ? "ocultar" : "mostrar"
    botao.setAttribute("aria-label", visivel ? "ocultar senha" : "mostrar senha")
  }

  botao.addEventListener("click", () => {
    mostrar(input.type === "password")
    input.focus()
  })
  // quando o formulário é limpo (form.reset()), volta a esconder
  input.form?.addEventListener("reset", () => mostrar(false))

  mostrar(false)
}

const menu = document.querySelector(".menu");
const texto = document.querySelector(".texto");

menu.addEventListener("mouseenter", () =>
  texto.classList.add("texto--ativo")
);

menu.addEventListener("mouseleave", () =>
  texto.classList.remove("texto--ativo")
);

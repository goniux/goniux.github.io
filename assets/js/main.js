// Site-wide interaction module.
// Keep this dependency-free so it can be replaced without touching the content layer.

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
    event.preventDefault();
    document.getElementById("terminal-input")?.focus();
  }
});

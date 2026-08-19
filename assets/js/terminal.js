(() => {
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const enter = document.getElementById("enter-archive");

  if (!form || !input || !output) return;

  const commands = {
    help: `AVAILABLE COMMANDS

archive    browse the research archive
about      learn about the researcher
github     open the source repository
clear      clear the terminal
whoami     identify the operator
manifesto  open the archive note
home       return to the top`,
    whoami: "visitor // curiosity detected",
    manifesto: "Understanding machines by breaking them apart and rebuilding them.",
  };

  const print = (text, className = "") => {
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  };

  const run = (raw) => {
    const command = raw.trim().toLowerCase();
    if (!command) return;

    print(`goni@reversed:~$ ${command}`);

    if (command === "clear") {
      output.innerHTML = "";
      return;
    }

    if (command === "archive") {
      document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" });
      print("Opening transmissions...", "success");
      return;
    }

    if (command === "about") {
      window.location.href = "{{ '/about/' | relative_url }}";
      return;
    }

    if (command === "github") {
      window.open("https://github.com/goniux", "_blank", "noopener");
      return;
    }

    if (command === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (commands[command]) {
      commands[command].split("\n").forEach(line => print(line));
      return;
    }

    print(`command not found: ${command}. Type "help".`, "error");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run(input.value);
    input.value = "";
  });

  enter?.addEventListener("click", () => {
    document.getElementById("terminal-section")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => input.focus(), 450);
  });
})();

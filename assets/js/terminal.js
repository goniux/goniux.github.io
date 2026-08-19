(() => {
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const enter = document.getElementById("enter-archive");

  if (!form || !input || !output) return;

  const config = window.REVERSED_TERMINAL || {};
  const commandText = (config.commands || {});
  const rickroll = config.rickroll || {};

  const print = (text, className = "") => {
    const lines = String(text).split("\n");
    lines.forEach(textLine => {
      const line = document.createElement("div");
      line.className = className;
      line.textContent = textLine;
      output.appendChild(line);
    });
    output.scrollTop = output.scrollHeight;
  };

  const openRickrollModal = () => {
    const modal = document.getElementById("rickroll-modal");
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.getElementById("rickroll-button")?.focus();
  };

  const closeRickrollModal = () => {
    const modal = document.getElementById("rickroll-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    input.focus();
  };

  const run = (raw) => {
    const command = raw.trim();
    const lower = command.toLowerCase();

    if (!command) return;

    print(`goni@reversed:~$ ${command}`);

    if (lower === "clear") {
      output.innerHTML = "";
      return;
    }

    if (lower === "help") {
      print(commandText.help || 'Type "help" to explore.');
      return;
    }

    if (lower === "whoami") {
      print(commandText.whoami || "visitor // curiosity detected");
      return;
    }

    if (lower === "manifesto") {
      print(commandText.manifesto || "Archive note unavailable.");
      return;
    }

    if (lower === "ls") {
      if (window.__notforyouEntered) {
        print("archive/\nlab/\nvault/\nnotforyou/");
      } else {
        print("archive/\nlab/\nvault/\nnotforyou/");
      }
      return;
    }

    if (lower === "archive") {
      document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" });
      print("Opening transmissions...", "success");
      return;
    }

    if (lower === "about") {
      window.location.href = "{{ '/about/' | relative_url }}";
      return;
    }

    if (lower === "github") {
      window.open("https://github.com/goniux", "_blank", "noopener");
      return;
    }

    if (lower === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // The site's fake filesystem. This never touches the visitor's real OS.
    if (lower === "cd notforyou") {
      window.__notforyouEntered = true;
      print("Entering /notforyou ...", "success");
      print("Type: ls");
      return;
    }

    if (lower === "./truth.sh") {
      if (!window.__notforyouEntered) {
        print("bash: ./truth.sh: No such file or directory", "error");
        print("Hint: try exploring the filesystem first.");
        return;
      }

      print("Executing ./truth.sh ...", "success");
      print("[████████████████████] 100%");
      print("Truth has consequences.");
      setTimeout(openRickrollModal, 350);
      return;
    }

    if (lower === "truth.sh") {
      print("bash: truth.sh: command not found", "error");
      print("Try: ./truth.sh");
      return;
    }

    if (lower === "cd" || lower.startsWith("cd ")) {
      const target = command.slice(3).trim();
      if (target === "notforyou") {
        window.__notforyouEntered = true;
        print("Entering /notforyou ...", "success");
        print("Type: ls");
        return;
      }
      print(`bash: ${target || ""}: No such directory`, "error");
      return;
    }

    if (lower === "pwd") {
      print("/home/goni");
      return;
    }

    if (lower === "ls -la") {
      print("total 8\n.\n..\n.archive\n.notforyou/\nREADME.txt");
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

  document.getElementById("rickroll-close")?.addEventListener("click", closeRickrollModal);

  document.getElementById("rickroll-button")?.addEventListener("click", () => {
    const url = rickroll.url || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    window.open(url, "_blank", "noopener,noreferrer");
    closeRickrollModal();
  });

  document.getElementById("rickroll-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "rickroll-modal") closeRickrollModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeRickrollModal();
  });
})();

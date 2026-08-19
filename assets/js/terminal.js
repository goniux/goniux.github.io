(() => {
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const enter = document.getElementById("enter-archive");

  if (!form || !input || !output) return;


  const config = window.REVERSED_TERMINAL || {};
  const commandText = config.commands || {};
  const rickroll = config.rickroll || {};


  // Fake filesystem
  let currentDirectory = "~";


  const filesystem = {
    "~": [
      "archive/",
      "lab/",
      "vault/",
      "notforyou/"
    ],

    "~/notforyou": [
      "truth.sh"
    ]
  };


  const print = (text, className = "") => {

    String(text).split("\n").forEach(lineText => {

      const line = document.createElement("div");
      line.className = className;
      line.textContent = lineText;

      output.appendChild(line);

    });

    output.scrollTop = output.scrollHeight;
  };



  const openRickrollModal = () => {

    const modal = document.getElementById("rickroll-modal");

    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden","false");

    document.getElementById("rickroll-button")?.focus();

  };



  const closeRickrollModal = () => {

    const modal = document.getElementById("rickroll-modal");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");

    input.focus();

  };



  const run = (raw) => {

    const command = raw.trim();
    const lower = command.toLowerCase();


    if (!command) return;


    print(`goni@reversed:${currentDirectory}$ ${command}`);



    // CLEAR

    if(lower === "clear"){

      output.innerHTML="";
      return;

    }



    // HELP

    if(lower === "help"){

      print(
        commandText.help ||
        "Available commands: help, ls, cd, pwd"
      );

      return;

    }



    // WHOAMI

    if(lower === "whoami"){

      print(
        commandText.whoami ||
        "visitor // curiosity detected"
      );

      return;

    }



    // MANIFESTO

    if(lower === "manifesto"){

      print(
        commandText.manifesto ||
        "Archive note unavailable."
      );

      return;

    }



    // LIST FILES

    if(lower === "ls"){

      print(
        filesystem[currentDirectory].join("\n")
      );

      return;

    }



    // LONG LIST

    if(lower === "ls -la"){

      print(
`total ${filesystem[currentDirectory].length}

.
..

${filesystem[currentDirectory].join("\n")}

README.txt`
      );

      return;

    }



    // CHANGE DIRECTORY

    if(lower.startsWith("cd ")){

      const target = command.substring(3).trim();


      if(target === "notforyou"){

        currentDirectory="~/notforyou";

        print(
          "Entering /notforyou ...",
          "success"
        );

        return;

      }



      if(target === ".."){

        currentDirectory="~";

        print(
          "Returned to home directory.",
          "success"
        );

        return;

      }



      print(
        `bash: cd: ${target}: No such directory`,
        "error"
      );

      return;

    }




    // EXECUTE TRUTH.SH

    if(lower === "./truth.sh"){


      if(currentDirectory !== "~/notforyou"){

        print(
          "bash: ./truth.sh: No such file or directory",
          "error"
        );

        print(
          "Hint: locate the file first."
        );

        return;

      }



      print(
        "Executing ./truth.sh ...",
        "success"
      );


      setTimeout(()=>{

        print("[████████████████████] 100%");
        print("Truth has consequences.");

        openRickrollModal();


      },350);



      return;

    }





    // WRONG EXECUTION

    if(lower === "truth.sh"){

      print(
        "bash: truth.sh: command not found",
        "error"
      );

      print(
        "Try: ./truth.sh"
      );

      return;

    }





    // PWD

    if(lower==="pwd"){

      print(
        currentDirectory === "~"
        ? "/home/goni"
        : "/home/goni/notforyou"
      );

      return;

    }





    // OTHER COMMANDS

    if(lower==="archive"){

      document
      .getElementById("archive")
      ?.scrollIntoView({
        behavior:"smooth"
      });

      print(
        "Opening transmissions...",
        "success"
      );

      return;

    }




    if(lower==="about"){

      window.location.href =
      "{{ '/about/' | relative_url }}";

      return;

    }




    if(lower==="github"){

      window.open(
        "https://github.com/goniux",
        "_blank",
        "noopener"
      );

      return;

    }




    if(lower==="home"){

      window.scrollTo({
        top:0,
        behavior:"smooth"
      });

      return;

    }




    print(
      `command not found: ${command}. Type "help".`,
      "error"
    );

  };





  form.addEventListener(
    "submit",
    e=>{

      e.preventDefault();

      run(input.value);

      input.value="";

    }
  );





  enter?.addEventListener(
    "click",
    ()=>{

      document
      .getElementById("terminal-section")
      ?.scrollIntoView({
        behavior:"smooth"
      });


      setTimeout(
        ()=>input.focus(),
        450
      );

    }
  );






  document
  .getElementById("rickroll-close")
  ?.addEventListener(
    "click",
    closeRickrollModal
  );





  document
  .getElementById("rickroll-button")
  ?.addEventListener(
    "click",
    ()=>{

      const url =
      rickroll.url ||
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ";


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );


      closeRickrollModal();

    }
  );





  document
  .getElementById("rickroll-modal")
  ?.addEventListener(
    "click",
    e=>{

      if(e.target.id==="rickroll-modal")
      closeRickrollModal();

    }
  );





  document.addEventListener(
    "keydown",
    e=>{

      if(e.key==="Escape")
      closeRickrollModal();

    }
  );


})();

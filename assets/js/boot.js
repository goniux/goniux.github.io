(() => {
  const status = document.getElementById("boot-status");
  if (!status) return;

  const messages = [
    "[ INITIALIZING ARCHIVE ]",
    "[ MOUNTING RESEARCH ]",
    "[ INDEXING TRANSMISSIONS ]",
    "[ SYSTEM READY ]"
  ];

  let i = 0;
  const tick = () => {
    status.textContent = messages[i];
    i += 1;
    if (i < messages.length) setTimeout(tick, 280);
  };
  tick();
})();

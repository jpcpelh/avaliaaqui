(() => {
  "use strict";

  const ADMIN_PASSWORD = "1234";
  const INSTAGRAM_URL = "https://www.instagram.com/p/DewjHGDx2ml/?cplk=MW83aGtzOXYxNWxvNg==";
  const INSTAGRAM_PROFILE = "https://www.instagram.com/avaliaaqui_2026/";
  const STORAGE_KEY = "avaliaAquiData_v2";

  const defaultData = {
    closed: false,
    voters: [],
    competitors: [
      {
        id: "c1",
        name: "Competidor 1",
        description: "Edite esta descrição pela área administrativa.",
        photo: ""
      },
      {
        id: "c2",
        name: "Competidor 2",
        description: "Edite esta descrição pela área administrativa.",
        photo: ""
      },
      {
        id: "c3",
        name: "Competidor 3",
        description: "Edite esta descrição pela área administrativa.",
        photo: ""
      }
    ]
  };

  let data = loadData();
  let currentVoter = "";

  const $ = id => document.getElementById(id);

  const screens = [
    "welcomeScreen",
    "voteScreen",
    "thanksScreen",
    "closedScreen",
    "adminScreen"
  ];

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return structuredClone(defaultData);

      const parsed = JSON.parse(saved);

      return {
        closed: Boolean(parsed.closed),
        voters: Array.isArray(parsed.voters) ? parsed.voters : [],
        competitors: Array.isArray(parsed.competitors)
          ? parsed.competitors
          : structuredClone(defaultData.competitors)
      };
    } catch (error) {
      return structuredClone(defaultData);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      alert(
        "Não foi possível salvar. A foto pode ser muito grande; tente uma imagem menor."
      );
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function showScreen(id) {
    screens.forEach(screen => {
      $(screen).classList.toggle("hidden", screen !== id);
    });

    $("adminOpen").classList.toggle("hidden", id === "adminScreen");

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (id === "voteScreen") renderVoting();
    if (id === "closedScreen") renderFinalResults();
    if (id === "adminScreen") renderAdmin();
  }

  function pointsFor(competitorId) {
    return data.voters.reduce((total, vote) => {
      if (vote.first === competitorId) total += 3;
      if (vote.second === competitorId) total += 2;
      if (vote.third === competitorId) total += 1;
      return total;
    }, 0);
  }

  function ranking() {
    return [...data.competitors]
      .map(competitor => ({
        ...competitor,
        points: pointsFor(competitor.id),
        firsts: data.voters.filter(
          vote => vote.first === competitor.id
        ).length
      }))
      .sort((a, b) =>
        b.points - a.points ||
        b.firsts - a.firsts ||
        a.name.localeCompare(b.name, "pt-BR")
      );
  }

  function renderCompetitorCards() {
    const grid = $("competitorGrid");

    if (!data.competitors.length) {
      grid.innerHTML = `
        <div class="results-list-wrap">
          <p>Nenhum competidor cadastrado ainda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.competitors.map(competitor => `
      <article class="competitor-card">
        <div class="competitor-photo">
          ${
            competitor.photo
              ? `<img src="${competitor.photo}" alt="Foto de ${escapeHTML(competitor.name)}">`
              : '<span class="photo-placeholder">✦</span>'
          }
        </div>
        <div class="competitor-copy">
          <h3>${escapeHTML(competitor.name)}</h3>
          <p>${escapeHTML(competitor.description)}</p>
        </div>
      </article>
    `).join("");
  }

  function renderSelects() {
    const ids = ["firstChoice", "secondChoice", "thirdChoice"];
    const oldValues = ids.map(id => $(id).value);

    ids.forEach((id, index) => {
      const select = $(id);

      select.innerHTML =
        '<option value="">Escolha um competidor</option>' +
        data.competitors.map(competitor => `
          <option value="${escapeHTML(competitor.id)}">
            ${escapeHTML(competitor.name)}
          </option>
        `).join("");

      if (
        oldValues[index] &&
        data.competitors.some(
          competitor => competitor.id === oldValues[index]
        )
      ) {
        select.value = oldValues[index];
      }
    });

    updateVoteProgress();
  }

  function renderVoting() {
    $("voterGreeting").textContent = currentVoter
      ? `Vamos lá, ${currentVoter}! Selecione três pessoas diferentes.`
      : "Selecione três pessoas diferentes.";

    renderSelects();
    renderCompetitorCards();
  }

  function updateVoteProgress() {
    const chosen = [
      "firstChoice",
      "secondChoice",
      "thirdChoice"
    ].filter(id => $(id).value).length;

    $("voteProgress").textContent = `${chosen} de 3 escolhidos`;
    $("voteError").textContent = "";
  }

  function renderResultRows(containerId) {
    const rows = ranking();

    if (!rows.length) {
      $(containerId).innerHTML =
        '<p class="muted">Nenhum competidor cadastrado.</p>';
      return;
    }

    $(containerId).innerHTML = rows.map((competitor, index) => `
      <div class="result-row">
        <span class="result-rank">${index + 1}º</span>
        <span class="result-name">
          ${escapeHTML(competitor.name)}
          ${
            competitor.firsts
              ? `<small class="muted">(${competitor.firsts} primeiro(s) lugar(es))</small>`
              : ""
          }
        </span>
        <span class="result-points">
          ${competitor.points}
          ${competitor.points === 1 ? "ponto" : "pontos"}
        </span>
      </div>
    `).join("");
  }

  function renderFinalResults() {
    const top = ranking().slice(0, 3);
    const order = top.length === 3
      ? [top[1], top[0], top[2]]
      : top;

    const rankNumbers = top.length === 3
      ? [2, 1, 3]
      : order.map((_, index) => index + 1);

    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

    $("podium").innerHTML = order.map((competitor, index) => {
      const place = rankNumbers[index];

      return `
        <article class="podium-place ${place === 1 ? "first" : ""}">
          <div class="podium-rank">${medals[place] || "🏅"}</div>

          ${
            competitor.photo
              ? `<img class="podium-photo" src="${competitor.photo}" alt="Foto de ${escapeHTML(competitor.name)}">`
              : '<div class="podium-photo" style="display:grid;place-items:center;font-size:28px">✦</div>'
          }

          <h3>${escapeHTML(competitor.name)}</h3>
          <p>${place}º lugar</p>

          <span class="points">
            ${competitor.points}
            ${competitor.points === 1 ? "ponto" : "pontos"}
          </span>
        </article>
      `;
    }).join("");

    if (!top.length) {
      $("podium").innerHTML =
        "<p>Ainda não há competidores cadastrados.</p>";
    }

    renderResultRows("finalResults");
  }

  function renderAdmin() {
    $("totalVotes").textContent = data.voters.length;
    $("totalCompetitors").textContent = data.competitors.length;

    $("competitionStatus").textContent = data.closed
      ? "Encerrada"
      : "Aberta";

    $("closeCompetition").disabled = data.closed;
    $("closeCompetition").textContent = data.closed
      ? "Competição encerrada"
      : "Encerrar competição";

    $("closeCompetition").style.opacity = data.closed ? ".6" : "1";

    $("restartCompetition").disabled = !data.closed;
    $("restartCompetition").title = data.closed
      ? "Iniciar uma nova rodada"
      : "Encerre a votação atual antes de iniciar outra";

    $("adminCompetitorList").innerHTML = data.competitors.length
      ? data.competitors.map(competitor => `
          <div class="admin-competitor-item">
            ${
              competitor.photo
                ? `<img src="${competitor.photo}" alt="">`
                : '<img alt="" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2246%22 height=%2246%22%3E%3Crect width=%2246%22 height=%2246%22 rx=%2210%22 fill=%22%23eee4fb%22/%3E%3Ctext x=%2223%22 y=%2231%22 font-size=%2224%22 text-anchor=%22middle%22 fill=%22%237d56bb%22%3E✦%3C/text%3E%3C/svg%3E">'
            }

            <div class="item-info">
              <b>${escapeHTML(competitor.name)}</b>
              <small>
                ${escapeHTML(competitor.description.slice(0, 72))}
                ${competitor.description.length > 72 ? "…" : ""}
              </small>
            </div>

            <div class="item-actions">
              <button class="text-button" data-edit="${escapeHTML(competitor.id)}" ${data.closed ? "disabled" : ""}>Editar</button>
              <button class="text-button delete" data-delete="${escapeHTML(competitor.id)}" ${data.closed ? "disabled" : ""}>Excluir</button>
            </div>
          </div>
        `).join("")
      : '<p class="muted">Nenhum competidor cadastrado.</p>';

    renderResultRows("adminResults");

    $("competitorName").disabled = data.closed;
    $("competitorDescription").disabled = data.closed;
    $("competitorPhoto").disabled = data.closed;
    $("saveCompetitor").disabled = data.closed;
  }

  function resetCompetitorForm() {
    $("competitorForm").reset();
    $("competitorId").value = "";
    $("competitorFormTitle").textContent = "Cadastrar competidor";
    $("saveCompetitor").textContent = "Salvar competidor";
    $("cancelEdit").classList.add("hidden");
    $("adminFormMessage").textContent = "";
  }

  function editCompetitor(id) {
    const competitor = data.competitors.find(item => item.id === id);
    if (!competitor) return;

    $("competitorId").value = competitor.id;
    $("competitorName").value = competitor.name;
    $("competitorDescription").value = competitor.description;
    $("competitorPhoto").value = "";

    $("competitorFormTitle").textContent = "Editar competidor";
    $("saveCompetitor").textContent = "Salvar alterações";
    $("cancelEdit").classList.remove("hidden");

    $("competitorForm").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function deleteCompetitor(id) {
    const competitor = data.competitors.find(item => item.id === id);
    if (!competitor) return;

    if (!confirm(
      `Deseja excluir "${competitor.name}"? Os votos associados a essa pessoa também serão removidos.`
    )) return;

    data.competitors = data.competitors.filter(item => item.id !== id);
    data.voters = data.voters.filter(vote =>
      vote.first !== id &&
      vote.second !== id &&
      vote.third !== id
    );

    saveData();
    resetCompetitorForm();
    renderAdmin();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");

      if (!file.type.startsWith("image/")) {
        return reject(new Error("Selecione um arquivo de imagem."));
      }

      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error("A imagem deve ter até 2 MB. Tente reduzir o tamanho."));
      }

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  function playCompletionSound() {
    // Som de confirmação gerado pelo navegador, sem arquivo externo.
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const now = context.currentTime;

      [880, 1174.66].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = now + index * 0.13;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startAt);
        oscillator.stop(startAt + 0.24);
      });

      window.setTimeout(() => {
        context.close().catch(() => {});
      }, 700);
    } catch (error) {
      // Se o navegador bloquear o som, o voto continua registrado.
    }
  }

  $("year").textContent = new Date().getFullYear();

  $("instagramQr").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" +
    encodeURIComponent(INSTAGRAM_PROFILE);

  $("instagramLink").href = INSTAGRAM_URL;

  $("brandHome").addEventListener("click", event => {
    event.preventDefault();
    showScreen(data.closed ? "closedScreen" : "welcomeScreen");
  });

  $("startForm").addEventListener("submit", event => {
    event.preventDefault();

    if (data.closed) return showScreen("closedScreen");

    if (!data.competitors.length) {
      return alert(
        "Ainda não há competidores cadastrados. Peça ao administrador para cadastrar."
      );
    }

    currentVoter = $("voterName").value.trim();
    if (!currentVoter) return;

    const alreadyVoted = data.voters.some(vote =>
      vote.voterName.toLocaleLowerCase("pt-BR") ===
      currentVoter.toLocaleLowerCase("pt-BR")
    );

    if (alreadyVoted) {
      alert(
        "Este nome já aparece na lista de votos deste navegador. Use o nome correto ou fale com a organização."
      );
      return;
    }

    showScreen("voteScreen");
  });

  ["firstChoice", "secondChoice", "thirdChoice"].forEach(id => {
    $(id).addEventListener("change", () => {
      const selected = [
        "firstChoice",
        "secondChoice",
        "thirdChoice"
      ].map(key => $(key).value).filter(Boolean);

      const duplicates = selected.length !== new Set(selected).size;

      $("voteError").textContent = duplicates
        ? "Escolha três competidores diferentes."
        : "";

      updateVoteProgress();
    });
  });

  $("submitVote").addEventListener("click", () => {
    const first = $("firstChoice").value;
    const second = $("secondChoice").value;
    const third = $("thirdChoice").value;

    if (!first || !second || !third) {
      $("voteError").textContent =
        "Escolha o 1º, 2º e 3º lugar antes de confirmar.";
      return;
    }

    if (new Set([first, second, third]).size !== 3) {
      $("voteError").textContent =
        "Você precisa escolher três competidores diferentes.";
      return;
    }

    if (data.closed) return showScreen("closedScreen");

    data.voters.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
      voterName: currentVoter,
      first,
      second,
      third,
      createdAt: new Date().toISOString()
    });

    if (!saveData()) {
      data.voters.pop();
      return;
    }

    playCompletionSound();
    showScreen("thanksScreen");

    // Não existe retorno automático. A pessoa decide quando voltar.
  });

  $("returnHome").addEventListener("click", () => {
    $("startForm").reset();
    currentVoter = "";
    showScreen(data.closed ? "closedScreen" : "welcomeScreen");
  });

  $("adminOpen").addEventListener("click", () => {
    $("adminPassword").value = "";
    $("passwordError").textContent = "";
    $("passwordDialog").showModal();
  });

  $("passwordClose").addEventListener("click", () => {
    $("passwordDialog").close();
  });

  $("passwordForm").addEventListener("submit", event => {
    event.preventDefault();

    if ($("adminPassword").value !== ADMIN_PASSWORD) {
      $("passwordError").textContent = "Senha incorreta. Tente novamente.";
      return;
    }

    $("passwordDialog").close();
    showScreen("adminScreen");
  });

  $("adminBack").addEventListener("click", () => {
    showScreen(data.closed ? "closedScreen" : "welcomeScreen");
  });

  $("competitorForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (data.closed) return;

    const id = $("competitorId").value;
    const name = $("competitorName").value.trim();
    const description = $("competitorDescription").value.trim();

    const existing = data.competitors.find(item => item.id === id);

    if (!name || !description) return;

    const duplicateName = data.competitors.some(competitor =>
      competitor.name.toLocaleLowerCase("pt-BR") ===
        name.toLocaleLowerCase("pt-BR") &&
      competitor.id !== id
    );

    if (duplicateName) {
      $("adminFormMessage").textContent =
        "Já existe um competidor com esse nome.";
      return;
    }

    try {
      const uploadedPhoto = await readImage(
        $("competitorPhoto").files[0]
      );

      if (existing) {
        existing.name = name;
        existing.description = description;

        if (uploadedPhoto) existing.photo = uploadedPhoto;
      } else {
        // Não há limite fixo de 10 competidores.
        data.competitors.push({
          id: "c_" + Date.now().toString(36) +
            Math.random().toString(36).slice(2, 7),
          name,
          description,
          photo: uploadedPhoto
        });
      }

      if (saveData()) {
        resetCompetitorForm();
        renderAdmin();
        $("adminFormMessage").textContent =
          "Competidor salvo com sucesso!";
      }
    } catch (error) {
      $("adminFormMessage").textContent =
        error.message || "Erro ao salvar competidor.";
    }
  });

  $("cancelEdit").addEventListener("click", resetCompetitorForm);

  $("adminCompetitorList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) editCompetitor(editButton.dataset.edit);
    if (deleteButton) deleteCompetitor(deleteButton.dataset.delete);
  });

  $("refreshResults").addEventListener("click", renderAdmin);

  $("closeCompetition").addEventListener("click", () => {
    if (data.closed) return;
    $("confirmDialog").showModal();
  });

  $("confirmForm").addEventListener("submit", event => {
    if (
      event.submitter &&
      event.submitter.id === "confirmCloseCompetition"
    ) {
      data.closed = true;

      if (!saveData()) {
        data.closed = false;
        return;
      }

      $("confirmDialog").close();
      showScreen("adminScreen");
      renderAdmin();
    } else {
      $("confirmDialog").close();
    }
  });

  $("restartCompetition").addEventListener("click", () => {
    if (!data.closed) {
      alert("Encerre a votação atual antes de iniciar uma nova rodada.");
      return;
    }

    $("restartDialog").showModal();
  });

  $("restartForm").addEventListener("submit", event => {
    if (
      event.submitter &&
      event.submitter.id === "confirmRestartCompetition"
    ) {
      // Mantém os competidores e zera os votos da rodada anterior.
      const previousData = {
        closed: data.closed,
        voters: data.voters
      };

      data.closed = false;
      data.voters = [];

      if (saveData()) {
        resetCompetitorForm();
        $("restartDialog").close();
        showScreen("adminScreen");
        renderAdmin();

        alert(
          "Nova votação iniciada! Os competidores foram mantidos e os votos anteriores foram zerados."
        );
      } else {
        data.closed = previousData.closed;
        data.voters = previousData.voters;
      }
    } else {
      $("restartDialog").close();
    }
  });

  if (data.closed) {
    showScreen("closedScreen");
  } else {
    showScreen("welcomeScreen");
  }
})();
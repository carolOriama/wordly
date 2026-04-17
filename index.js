const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error-message");
const meaningsDiv = document.getElementById("meanings");
const playBtn = document.getElementById("play-btn");
const savedBtnTop = document.getElementById("saved-btn");

let currentAudio = null;
let savedWords = JSON.parse(localStorage.getItem("wordly_saved")) || [];

savedBtnTop.textContent = `Saved (${savedWords.length})`;

searchForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const word = searchInput.value;

  resultsDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");

  try {
    const response = await fetch(
      "https://api.dictionaryapi.dev/api/v2/entries/en/" + word,
    );
    if (!response.ok) throw new Error("Word not found.");

    const dataArray = await response.json();
    displayWord(dataArray[0]);
  } catch (error) {
    errorDiv.innerHTML = `<h3>Word Not Found</h3><p>${error.message}</p>`;
    errorDiv.classList.remove("hidden");
  }
});

function displayWord(data) {
  document.getElementById("word-title").textContent = data.word;
  document.getElementById("word-phonetic").textContent = data.phonetic || "";

  const phoneticObj =
    data.phonetics && data.phonetics.find((p) => p.audio !== "");
  if (phoneticObj) {
    currentAudio = new Audio(phoneticObj.audio);
    playBtn.classList.remove("hidden");
  } else {
    currentAudio = null;
    playBtn.classList.add("hidden");
  }

  meaningsDiv.innerHTML = "";

  data.meanings.forEach((meaning) => {
    let definitionsHtml = "";

    meaning.definitions.forEach((def, index) => {
      const isSaved = savedWords.some(
        (w) => w.word === data.word && w.definition === def.definition,
      );

      const safeWord = encodeURIComponent(data.word);
      const safeDef = encodeURIComponent(def.definition);

      const buttonClass = isSaved ? "save-btn is-saved" : "save-btn";
      const buttonText = isSaved ? "Saved " : "Save ";
      const ariaLabelText = isSaved ? "Unsave " : "Save ";

      definitionsHtml += `
        <div class="definition-item">
            <p><strong>${index + 1}.</strong> ${def.definition}</p>
            ${def.example ? `<p class="example">"${def.example}"</p>` : ""}
            <button class="${buttonClass}" aria-label="${ariaLabelText}" onclick="toggleSave(this, '${safeWord}', '${safeDef}')">${buttonText}</button>
        </div>
      `;
    });

    let synonymsHtml = "";
    if (meaning.synonyms && meaning.synonyms.length > 0) {
      synonymsHtml = `<p class="synonyms">Synonyms: ${meaning.synonyms.join(", ")}</p>`;
    }

    meaningsDiv.innerHTML += `
      <div class="meaning-card">
        <span class="part-of-speech">${meaning.partOfSpeech}</span>
        ${definitionsHtml}
        ${synonymsHtml}
      </div>
    `;
  });

  resultsDiv.classList.remove("hidden");
}

playBtn.addEventListener("click", () => {
  if (currentAudio) currentAudio.play();
});

window.toggleSave = function (btnElement, safeWord, safeDef) {
  const word = decodeURIComponent(safeWord);
  const definition = decodeURIComponent(safeDef);

  const index = savedWords.findIndex(
    (w) => w.word === word && w.definition === definition,
  );

  if (index > -1) {
    savedWords.splice(index, 1);
    btnElement.classList.remove("is-saved");
    btnElement.textContent = "Save";
    btnElement.setAttribute("aria-label", "Save ");
  } else {
    savedWords.push({ word, definition });
    btnElement.classList.add("is-saved");
    btnElement.textContent = "Saved ";
    btnElement.setAttribute("aria-label", "Unsave ");
  }

  localStorage.setItem("wordly_saved", JSON.stringify(savedWords));
  savedBtnTop.textContent = `Saved (${savedWords.length})`;
  displaySavedSidebar();
};

function displaySavedSidebar() {
  const sidebarList = document.getElementById("saved-words-list");
  if (!sidebarList) return;

  if (savedWords.length === 0) {
    sidebarList.innerHTML =
      "<p style='color: var(--text-light); text-align: center; margin-top: 1rem;'>No saved words yet.</p>";
    return;
  }

  sidebarList.innerHTML = savedWords
    .map((saved) => {
      const safeWord = encodeURIComponent(saved.word);
      const safeDef = encodeURIComponent(saved.definition);
      return `
      <div class="saved-item" onclick="this.classList.toggle('expanded'); this.querySelector('.saved-definition').classList.toggle('hidden')">
        <div class="saved-word-toggle">
          <h4>${saved.word}</h4>
          <div class="action-buttons">
            <span class="expand-indicator"></span>
            <button class="remove-saved-btn" onclick="removeSavedSidebarItem(event, '${safeWord}', '${safeDef}')" aria-label="Remove saved word">&times;</button>
          </div>
        </div>
        <p class="saved-definition hidden">${saved.definition}</p>
      </div>
    `;
    })
    .join("");
}

window.removeSavedSidebarItem = function (event, safeWord, safeDef) {
  event.stopPropagation();
  const word = decodeURIComponent(safeWord);
  const definition = decodeURIComponent(safeDef);

  const index = savedWords.findIndex(
    (w) => w.word === word && w.definition === definition,
  );

  if (index > -1) {
    savedWords.splice(index, 1);
    localStorage.setItem("wordly_saved", JSON.stringify(savedWords));
    savedBtnTop.textContent = `Saved (${savedWords.length})`;
    displaySavedSidebar();

    const btns = document.querySelectorAll(".save-btn");
    btns.forEach((btn) => {
      if (
        btn.getAttribute("onclick") &&
        btn.getAttribute("onclick").includes(safeDef)
      ) {
        btn.classList.remove("is-saved");
        btn.textContent = "Save ";
        btn.setAttribute("aria-label", "Save ");
      }
    });
  }
};

// Initial render
displaySavedSidebar();

const dictionaryForm = document.getElementById("dictionary-form");
const wordInput = document.getElementById("word-input");
const resultContainer = document.getElementById("result-container");
const phoneticAudio = document.getElementById("phonetic-audio");
const savedCountBtn = document.getElementById("saved-count-btn");

async function getWordData(word) {
  try {
    resultContainer.innerHTML =
      '<p class="loading">Searching for "' + word + '"...</p>';

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );

    if (!response.ok) {
      throw new Error("Word not found. Please try another search.");
    }

    const data = await response.json();

    displayResult(data[0]);
  } catch (error) {
    displayError(error.message);
  }
}

function displayResult(entry) {
  const word = entry.word;
  const phonetic =
    entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "";
  const audioUrl = entry.phonetics?.find((p) => p.audio)?.audio || "";
  const meanings = entry.meanings || [];

  const definitionsHtml = meanings
    .map((meaning) => {
      const defs = meaning.definitions
        .map((def) => `<li>${def.definition}</li>`)
        .join("");
      return `
        <div class="meaning-card">
          <h3>${meaning.partOfSpeech}</h3>
          <ul>${defs}</ul>
        </div>`;
    })
    .join("");

  resultContainer.innerHTML = `
    <div class="result-header">
      <h2>${word}</h2>
      <p class="phonetic">${phonetic}</p>
      ${audioUrl ? `<button class="btn-primary" onclick="playAudio('${audioUrl}')">Play Pronunciation</button>` : ""}
    </div>
    <div class="meanings">${definitionsHtml}</div>
  `;
}

function playAudio(url) {
  phoneticAudio.src = url;
  phoneticAudio.play();
}

function displayError(message) {
  resultContainer.innerHTML = `
        <div class="error-state">
            <p>Oops! ${message}</p>
        </div>
    `;
}

function updateSavedCount() {
  const favorites = JSON.parse(localStorage.getItem("wordly_favorites")) || [];
  const countBtn = document.getElementById("saved-count-btn");

  countBtn.innerText = `Saved (${favorites.length})`;
}

updateSavedCount();

dictionaryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = wordInput.value.trim();
  if (query) {
    getWordData(query);
  }
});

savedCountBtn.addEventListener("click", () => {
  const favorites = JSON.parse(localStorage.getItem("wordly_favorites")) || [];

  if (favorites.length === 0) {
    alert("You haven't saved any words yet!");
  } else {
    alert("Your saved words: " + favorites.join(", "));
  }
});

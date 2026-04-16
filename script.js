// 1. Get HTML elements
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error-message");
const meaningsDiv = document.getElementById("meanings");
const playBtn = document.getElementById("play-btn");
const savedBtnTop = document.getElementById("saved-btn");

// 2. Setup variables
let currentAudio = null;
let savedWords = JSON.parse(localStorage.getItem("wordly_saved")) || [];

// Update the counter on load
savedBtnTop.textContent = `Saved (${savedWords.length})`;

// 3. Listen for form submit
searchForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // Stop page from refreshing
  const word = searchInput.value;

  // Hide old results
  resultsDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");

  try {
    // Fetch data from Dictionary API
    const response = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word);
    if (!response.ok) {
      throw new Error("Word not found.");
    }
    
    // Parse the JSON data
    const dataArray = await response.json();
    const data = dataArray[0];

    // Show the data on screen
    displayWord(data);
  } catch (error) {
    errorDiv.textContent = "Error: " + error.message;
    errorDiv.classList.remove("hidden");
  }
});

// 4. Function to display data
function displayWord(data) {
  document.getElementById("word-title").textContent = data.word;
  document.getElementById("word-phonetic").textContent = data.phonetic || "";

  // Handle Audio
  const phoneticObj = data.phonetics.find((p) => p.audio !== "");
  if (phoneticObj) {
    currentAudio = new Audio(phoneticObj.audio);
    playBtn.classList.remove("hidden");
  } else {
    currentAudio = null;
    playBtn.classList.add("hidden");
  }

  // Handle Meanings (clear old meanings first)
  meaningsDiv.innerHTML = "";
  
  for (let i = 0; i < data.meanings.length; i++) {
    const meaning = data.meanings[i];
    let definitionsHtml = "";
    
    // Loop through definitions
    for (let j = 0; j < meaning.definitions.length; j++) {
      const def = meaning.definitions[j];
      
      // Check if definition is already saved
      const isSaved = savedWords.some(w => w.word === data.word && w.definition === def.definition);
      const buttonText = isSaved ? "Saved ⭐" : "Save Definition";

      // We encode the string so single quotes in definitions don't break HTML
      const safeWord = encodeURIComponent(data.word);
      const safeDef = encodeURIComponent(def.definition);

      definitionsHtml += `
        <p><strong>${j + 1}.</strong> ${def.definition}</p>
        <p class="example">"${def.example || ""}"</p>
        <button class="save-btn" onclick="toggleSave(event, '${safeWord}', '${safeDef}')">${buttonText}</button>
        <hr>
      `;
    }

    // Build synonyms list
    let synonymsHtml = "";
    if (meaning.synonyms.length > 0) {
      synonymsHtml = `<p class="synonyms">Synonyms: ${meaning.synonyms.join(", ")}</p>`;
    }

    // Add everything to the screen
    meaningsDiv.innerHTML += `
      <div class="meaning-card">
        <span class="part-of-speech">${meaning.partOfSpeech}</span>
        ${definitionsHtml}
        ${synonymsHtml}
      </div>
    `;
  }

  // Show the results section
  resultsDiv.classList.remove("hidden");
}

// 5. Play audio button
playBtn.addEventListener("click", function () {
  if (currentAudio) {
    currentAudio.play();
  }
});

// 6. Save word feature
window.toggleSave = function (event, safeWord, safeDef) {
  // Decode the text back to normal format
  const word = decodeURIComponent(safeWord);
  const definition = decodeURIComponent(safeDef);
  const btn = event.target;

  // Check if it's already saved
  const index = savedWords.findIndex(w => w.word === word && w.definition === definition);
  
  if (index > -1) {
    // If found, remove it (unsave)
    savedWords.splice(index, 1);
    btn.textContent = "Save Definition";
  } else {
    // If not found, add it
    savedWords.push({ word: word, definition: definition });
    btn.textContent = "Saved ⭐";
  }

  // Update localStorage and counter
  localStorage.setItem("wordly_saved", JSON.stringify(savedWords));
  savedBtnTop.textContent = `Saved (${savedWords.length})`;
};

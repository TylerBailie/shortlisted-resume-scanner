// this file runs every time a new page is opened

const documentClone = document.cloneNode(true);
const article = new Readability(documentClone).parse();
let pageText;
if (article !== null && article !== undefined) {
  pageText = article.textContent;
} else {
  pageText = document.body.innerText;
}

const keywords = {
  "job": 1.8,
  "employment": 2.2,
  "hiring": 2.5,
  "resume": 1.5,
  "salary": 1.2
};
const THRESHOLD = 0.003; // chosen by trial and error
const density = computeWeightedScore(pageText, keywords);

if (density >= THRESHOLD) {
    showPrompt();
}

function computeWeightedScore(pageText, keywords) {
  const words = pageText.toLowerCase().match(/\b[a-z']+\b/g) || [];
  const totalWords = words.length;
  if (totalWords === 0) return 0;

  let weightedScore = 0;

  for (let i = 0; i < words.length; i++) {
    const weight = keywords[words[i]];
    if (weight) {
      weightedScore += weight;
    }
  }

  return weightedScore / totalWords;
}

function showPrompt() {
    if (document.getElementById("keyword-alert-box")) return;

    const box = document.createElement("div");
    box.id = "keyword-alert-box";
    box.className = "kp-card kp-card--floating";

    box.innerHTML = `
        <div class="kp-row">
            <span>Job-related page detected</span>
        </div>
    `;

    const button = document.createElement("button");
    button.className = "kp-button";
    button.textContent = "View";

    button.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openExtensionPopup" });
        box.remove();
    }); 

    const closeTab = document.createElement("button");
    closeTab.className = "kp-button";
    closeTab.textContent = "Close";

    closeTab.addEventListener("click", () => {
        box.remove();
    });

    const buttonRow = document.createElement("div");
    buttonRow.className = "kp-row";
    buttonRow.append(button, closeTab);

    box.appendChild(buttonRow);
    document.body.appendChild(box);
}


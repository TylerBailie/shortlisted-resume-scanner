import { createScoreWheel } from '../scoreWheel.js';
import { runScan } from '../scan.js';

document.getElementById("resumeBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/webpage/resume.html") });
});

document.getElementById("scanBtn").addEventListener("click", async () => {
    document.getElementById("resume").style.display = "none";
    document.getElementById("scanner").style.display = "none";
    document.getElementById("backBtn").style.display = "block";
    document.getElementById("logoIcon2").style.display = "none";
    document.getElementById("output2").style.display = "block";
    document.getElementById("header").style.display = "none";

    const scoreWheel = createScoreWheel('scoreWheelContainer');
    const outputDiv = document.getElementById("output2");
    const { savedNotes } = await chrome.storage.local.get("savedNotes");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    let pageText;
    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const documentClone = document.cloneNode(true);
                const article = new Readability(documentClone).parse();
                if (article !== null && article !== undefined) {
                    return article.textContent;
                } else {
                    return document.body.innerText;
                }
            }
        });
        pageText = result;
    } catch (err) {
        outputDiv.textContent = "Could not reach this page."
        return;
    };
    document.getElementById("scoreWheel").style.display = "block";

    await runScan({ outputEl: outputDiv, resumeText: savedNotes, jobText: pageText, scoreWheel, maxBullets: 2 });
});

document.getElementById("backBtn").addEventListener("click", () => {
    document.getElementById("resume").style.display = "block";
    document.getElementById("scanner").style.display = "block";
    document.getElementById("backBtn").style.display = "none";
    document.getElementById("scoreWheel").style.display = "none";
    document.getElementById("logoIcon2").style.display = "block";
    document.getElementById("output2").style.display = "none";
    document.getElementById("header").style.display = "block";

});

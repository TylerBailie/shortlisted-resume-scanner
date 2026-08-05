import { createScoreWheel } from '../scoreWheel.js';
import { runScan } from '../scan.js';
import { setStatusIcon } from '../statusIcon.js';
import * as pdfjsLib from '../../lib/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.mjs');

const textarea = document.getElementById('notesTextarea');
const jobTextarea = document.getElementById('jobDescTextarea');

setStatusIcon('notes-status-icon', 'pending');
setStatusIcon('job-status-icon', 'pending'); 

const loadNotes = () => {  
    chrome.storage.local.get(['savedNotes']).then((result) => {  
      
    if (result.savedNotes) {  
        textarea.value = result.savedNotes;  
        setStatusIcon('notes-status-icon', 'success');
    }  
    }).catch((error) => {  
        console.error('Error loading notes:', error); 
        setStatusIcon('notes-status-icon', 'error');
    });  
};  
    
const saveNotes = (notes) => {  
    chrome.storage.local.set({ savedNotes: notes }).then(() => {   
    }).catch((error) => {  
    console.error('Error saving notes:', error);  
    });  
};  
    
loadNotes();  
 
textarea.addEventListener('input', () => {
    saveNotes(textarea.value);
    if (textarea.value.trim() !== '') {
        setStatusIcon('notes-status-icon', 'success');
    } else {
        setStatusIcon('notes-status-icon', 'pending');
    }
});

jobTextarea.addEventListener('input', () => {
    if (jobTextarea.value.trim() !== '') {
        setStatusIcon('job-status-icon', 'success');
    } else {
        setStatusIcon('job-status-icon', 'pending');
    }
});

function extractFromPdf(arrayBuffer) {
    var pdf = pdfjsLib.getDocument({ data: arrayBuffer });
    return pdf.promise.then(function (pdf) {
        var totalPageCount = pdf.numPages;
        var countPromises = [];
        for (
            var currentPage = 1;
            currentPage <= totalPageCount;
            currentPage++
        ) {
            var page = pdf.getPage(currentPage);
            countPromises.push(
              page.then(function (page) {
                var textContent = page.getTextContent();
                return textContent.then(function (text) {
                  return text.items
                    .map(function (s) {
                      return s.str;
                    })
                    .join('');
                });
              }),
            );
        }

        return Promise.all(countPromises).then(function (texts) {
            return texts.join('');
        });
    });
}

async function extractFromDocx(arrayBuffer) {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function extractText(file, arrayBuffer) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
        return extractFromPdf(arrayBuffer);
    } else if (ext === 'docx') {
        return extractFromDocx(arrayBuffer);
    } else {
        throw new Error('Unsupported file type: ' + ext);
    }
}

const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (e) => e.preventDefault());

dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractText(file, arrayBuffer);
        textarea.value = text;
        saveNotes(text);
        showError("");
        setStatusIcon('notes-status-icon', 'success');
    } catch (err) {
        console.error(err);
        showError('❌ Could not read that file. Please try a different PDF or DOCX.');
        setStatusIcon('notes-status-icon', 'error');
    }
});

const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractText(file, arrayBuffer);
        textarea.value = text;
        saveNotes(text);
        showError("");
        setStatusIcon('notes-status-icon', 'success');
    } catch (err) {
        console.error(err);
        showError('❌ Could not read that file. Please try a different PDF or DOCX.');
        setStatusIcon('notes-status-icon', 'error');
    }
});

document.getElementById("scanBtn").addEventListener("click", async () => {
    const scoreWheel = createScoreWheel('scoreWheelContainer');
    const outputDiv = document.getElementById("output"); 
    const resumeText = textarea.value;
    const jobText = jobTextarea.value;

    await runScan({ outputEl: outputDiv, resumeText, jobText, scoreWheel, maxBullets: 4 });
});
    
function showError(message) {
    const errorEl = document.getElementById('error-message');

    if (message === "") {
        errorEl.textContent = message;
        errorEl.style.display = 'none';
    } else {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}


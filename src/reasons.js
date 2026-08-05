export function renderReasons(outputEl, reasons) {
    outputEl.innerHTML = "";

    if (!Array.isArray(reasons) || reasons.length === 0) {
        return;
    }

    const list = document.createElement("ul");
    list.className = "reasons-list";

    for (const reason of reasons) {
        const item = document.createElement("li");
        item.className = reason.positive ? "reason-positive" : "reason-negative";
        item.textContent = (reason.positive ? "✅ " : "❌ ") + reason.text;
        list.appendChild(item);
    }

    outputEl.appendChild(list);
}

export function clearReasons(reasonsEl) {
    reasonsEl.innerHTML = "";
}
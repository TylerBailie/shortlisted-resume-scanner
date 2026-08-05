export function createScoreWheel(containerId) {
    const container = document.getElementById(containerId);
    const circumference = 2 * Math.PI * 70;

    container.innerHTML = `
        <div style="position: relative; width: 160px; height: 160px;">
            <svg width="160" height="160" viewBox="0 0 160 160" style="transform: rotate(-90deg);">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e5e5" stroke-width="12" />
                <circle class="score-ring" cx="80" cy="80" r="70" fill="none" stroke="#3b82f6"
                    stroke-width="12" stroke-linecap="round"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                    style="transition: stroke-dashoffset 0.4s ease;" />
            </svg>
            <div class="score-label" style="position: absolute; inset: 0; display: flex; 
            align-items: center; justify-content: center; font-size: 28px; font-weight: 600;">0%</div>
        </div>
    `;

    const ring = container.querySelector('.score-ring');
    const label = container.querySelector('.score-label');

    return {
        show() {
            container.style.display = 'block';
        },
        update(score) {
            const offset = circumference - (score / 100) * circumference;
            ring.style.strokeDashoffset = offset;
            label.textContent = `${score}%`;
        }
    };
}
import { renderReasons, clearReasons } from "./reasons.js";
import { setStatusIcon } from './statusIcon.js'; 

export async function runScan({ outputEl, resumeText, jobText, scoreWheel, maxBullets }) {

    const availability = await LanguageModel.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === "unavailable") {
        outputEl.textContent = "Gemini Nano not available on this device.";
        return;
    }
    if (availability === "downloading") {
        outputEl.textContent = "Model still downloading.";
        return;
    }

    if (availability === "downloadable") {
        outputEl.textContent = "Model not downloaded. Please download Gemini Nano to scan your jobs.";
        return;
    }

    if (resumeText.trim() === '') {
        outputEl.textContent = "Please enter your resume.";
        setStatusIcon('notes-status-icon', 'error');
        return;
    }

    if (jobText.trim() === '') {
        outputEl.textContent = "Please enter a job post";
        setStatusIcon('job-status-icon', 'error');
        return;
    }

    const stopThinking = startThinkingAnimation(outputEl);
    
    try {
        // split the AI prompts up because the AI was struggling with the instructions when they were all crammed into one call
        async function looksLikeType(text, label, description) {
            console.log("Creating session 1");
            const classifierSession = await LanguageModel.create({
                initialPrompts: [
                    {
                        role: "system",
                        content: `You classify text. Answer only "yes" or "no", nothing else.
                            Question: Is the text below a ${description}?`
                    }
                ],
                expectedInputs: [{ type: "text", languages: ["en"] }],
                expectedOutputs: [{ type: "text", languages: ["en"] }]
            });

            try {
                const schema = { type: "string", enum: ["yes", "no"] };

                const raw = await classifierSession.prompt(text, {
                    responseConstraint: schema
                });

                let parsed;
                try {
                    parsed = JSON.parse(raw);
                } catch {
                    parsed = raw.trim().toLowerCase();
                }
                return String(parsed).toLowerCase() === "yes";
            } finally {
                classifierSession.destroy();
            }
        }

        const isResume = await looksLikeType(resumeText, "resume", "a resume or CV listing a person's work experience, skills, or education");
        const isJobPost = await looksLikeType(jobText, "job posting", "a job posting describing an open role and its requirements");
        console.log("Session 1 created");

        if (!isResume && !isJobPost) {
            stopThinking();
            outputEl.textContent = "There does not appear to be a resume or job post.";
            setStatusIcon('notes-status-icon', 'error');
            setStatusIcon('job-status-icon', 'error');
            return;
        }
        if (!isResume) {
            stopThinking();
            outputEl.textContent = "There does not appear to be a resume.";
            setStatusIcon('notes-status-icon', 'error');
            return;
        }
        if (!isJobPost) {
            stopThinking();
            outputEl.textContent = "There does not appear to be a job post.";
            setStatusIcon('job-status-icon', 'error');
            return;
        }

        async function identifyKeyPoints() {
            console.log("Creating session 2");
            const classifierSession = await LanguageModel.create({
                initialPrompts: [
                    {
                        role: "system",
                        content: `You are a resume-to-job matching assistant. 
                        You will be given the text of a user's resume and also a job post.
                        
                        Your task is to identify the four most important points of comparison between the resume and job post, 
                        focusing on points that would be most relevant to the decision of whether to apply for the job or not.
                        
                        Ignore soft skills unless the job post explicitly mentions them as a requirement.
                        
                        Example of a good output: "the job post wants someone who can work weekdays, whereas the resume states that 
                        they can only work weekends"`

                    }
                ],
                expectedInputs: [{ type: "text", languages: ["en"] }],
                expectedOutputs: [{ type: "text", languages: ["en"] }]
            });

            try {
                const schema = {
                    type: "object",
                    properties: {
                        reasons: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    positive: { type: "boolean" },
                                    text: {
                                        type: "string"
                                    }
                                },
                                required: ["positive", "text"]
                            },
                            minItems: 4,
                            maxItems: 4
                        }
                    },
                    required: ["reasons"]
                };

                const promptText = 
                    `<job_posting>
                    ${jobText}
                    </job_posting>

                    <resume>
                    ${resumeText}
                    </resume>`;

                const raw = await classifierSession.prompt(promptText, {
                    responseConstraint: schema
                });

                const parsed = JSON.parse(raw);
                console.log("Session 2 created");
                return parsed.reasons;
            } finally {
                classifierSession.destroy();
            }
        }

        async function scoreMatch(reasons) {
            console.log("Creating session 3");
            const session = await LanguageModel.create({
                initialPrompts: [
                    {
                        role: "system",
                        content: `You will be given four points comparing a resume to a job post.
                        Your task is to output a score from 0 to 100 for how well the resume matches the job post.

                        Scoring guide:
                        - 0-10: All four points show mismatches, OR at least one point shows the resume 
                        falling drastically short of a hard requirement (e.g. missing required years 
                        of experience by a wide margin, missing a required credential entirely, 
                        missing a required skill/field entirely).
                        - 11-30: Most points show mismatches, with at most one weak or partial overlap.
                        - 31-60: A mix of overlapping and mismatched points, no drastic disqualifying gaps.
                        - 61-80: Most points show overlap, at most one weak mismatch.
                        - 81-100: All four points show strong overlap.

                        Do not average points as if they are equally weighted. A single drastic 
                        disqualifying gap (e.g. the job requires 40 years of experience and a 
                        prestigious award, and the resume shows neither) should result in a score 
                        near 0, even if other points are neutral, because that mismatch alone 
                        would prevent someone from being considered for the role.

                        Examples:
                        - Points: "resume has 2 years experience, job wants 3-5 years" (weak negative), 
                        "resume lacks a listed certification" (negative), "resume shows relevant 
                        coursework" (positive), "resume shows no leadership experience, job doesn't 
                        require it" (neutral/positive)
                        → Score: 45

                        - Points: "resume shows no professional experience, job requires 40 years in 
                        the field" (drastic negative), "resume has no advanced degree, job requires 
                        a Fields Medal" (drastic negative), "resume shows no relevant technical 
                        skills" (negative), "resume shows no publications, job requires extensive 
                        publication record" (negative)
                        → Score: 2

                        - Points: "resume matches required skillset" (positive), "resume shows 
                        required years of experience" (positive), "resume shows required degree" 
                        (positive), "resume shows relevant industry experience" (positive)
                        → Score: 92

                        Output only the score.`
                    }
                ],
                expectedInputs: [{ type: "text", languages: ["en"] }],
                expectedOutputs: [{ type: "text", languages: ["en"] }]
            });

            try {
                const promptText = reasons
                    .map(r => `${r.positive ? "+" : "-"} ${r.text}`)
                    .join("\n");

                const schema = {
                    type: "object",
                    properties: {
                        score: { type: "number" }
                    },
                    required: ["score"]
                };

                const raw = await session.prompt(promptText, {
                    responseConstraint: schema
                });

                const parsed = JSON.parse(raw);
                return parsed.score;

            } finally {
                session.destroy();
            }
        }

        console.log("Session 3 created");
        const reasons = await identifyKeyPoints();
        const score = await scoreMatch(reasons);
        stopThinking();
        scoreWheel.show();
        scoreWheel.update(score);
        const trimmedReasons = maxBullets ? reasons.slice(0, maxBullets) : reasons;
        renderReasons(outputEl, trimmedReasons);
        console.log("Code finished");
        

    } catch (err) {
        stopThinking();
        outputEl.textContent = "Something went wrong while scanning. Please try again.";
    } 
}

function startThinkingAnimation(el) {
    const states = ["Thinking.", "Thinking..", "Thinking..."];
    let i = 0;
    el.textContent = states[i];

    const intervalId = setInterval(() => {
        i = (i + 1) % states.length;
        el.textContent = states[i];
    }, 400); 

    return () => clearInterval(intervalId); 
}
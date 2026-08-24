# shortlisted-resume-scanner
> A browser extension that grades how well your resume matches a job post, using a locally-run AI model

**Tech stack:** JavaScript · Chrome Extension API · Gemini Nano

### What it does
A resume and job post scanner that grades how well a job post matches a resume using AI. The user inputs a resume and a job post, and an AI returns a few bullet points explaining the key comparisons between the two documents, and a visual diagram with an overall match score.  

I acknowledge the limited scope and utility of the project. This was a small learning project to learn a new programming language, practice handling user data and AI calls, and to build something real with UI outside the terminal for the first time.  

![Screenshot of the extension showing resume/job post match results](screenshots/screenshot.png)

### Design decisions
I chose to write this project in JavaScript as I believe the tool is best suited for browser extension format. I also thought JavaScript would be a good new programming language to learn since I already have some proficiency in Java to build on.  

I chose the Gemini Nano model in particular because it is run locally, meaning no external API calls. I believed that, since a CV can contain sensitive information, the project should be as locally run and stored as possible.

### Challenges
The Gemini Nano model had a real trade-off for it being locally run, and that was it being pretty weak and slow. It often struggled with more complex instructions, and it was difficult to make it output sensible results consistently. I mostly overcame this by chaining prompts, moving as much of its output formatting away from its instructions and to schemas, and parsing the job post's text to remove unnecessary information (like advertisements and links), but it still struggles with very long text due to its 8000 token limit.

I also wanted some way to notify the users when they were on a job post, and I chose a notification box prompting the user to open the extension manually since Chrome's extension API doesn't allow for the extension popup itself to open automatically. It opens when a threshold of weighted keywords is met on the current webpage, which is not a perfect metric, and the notification can sometimes appear on non-job-post webpages.

### Future features
I would hope to add more proactive features, like recommendations on how you can improve your resume in general, or to appeal to a particular employer's job post, instead of the tool being purely reactionary.  
I would probably add a way to disable/enable the notification box popup entirely so it isn't obnoxious.
I would also maybe switch to a stronger open model for better and faster results. 

### Prerequisites 
This extension uses Chrome's built-in Gemini Nano model, which is still 
experimental. To download it:
1. Make sure you're using desktop Chrome (version 138+) by going to `chrome://settings/help`
2. Type `chrome://flags` into your address bar and hit Enter.
3. Search for "Prompt API for Gemini Nano" and set it to Enabled.
4. Search for "Optimization Guide On Device Model" and set it to "Enabled BypassPerfRequirement" (this skips a hardware check that blocks some laptops).
5. Click Relaunch at the bottom of the page. Chrome will restart and keep your tabs open.
6. Go to `chrome://components`, find "Optimization Guide On Device Model", and click Check for update if it hasn't started downloading. The model is a few GB, so this can take a few minutes.

### Instructions for installation
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select the project folder

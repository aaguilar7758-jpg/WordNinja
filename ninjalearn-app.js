const promptTemplates = [
    {
        title: 'Flashcards',
        description: 'Convert notes into import-ready term and definition pairs.',
        prompt: `Convert the material below into concise flashcards.
Return only one card per line using a TAB between the front and back.
Do not number the cards. Avoid duplicate cards.

[PASTE MATERIAL HERE]`
    },
    {
        title: 'Reading Activity',
        description: 'Create a passage, cloze practice, and comprehension questions.',
        prompt: `Create a reading study activity from the material below.
Return exactly this format:
TITLE: Short title
PASSAGE:
Reading passage
CLOZE:
One cloze sentence per line using ____ for the blank
QUESTIONS:
One comprehension question per line

[PASTE MATERIAL HERE]`
    },
    {
        title: 'Listening Activity',
        description: 'Create a natural script for browser text-to-speech practice.',
        prompt: `Create a clear listening-practice script from the material below.
Return exactly this format:
TITLE: Short title
SCRIPT:
Natural spoken script with no bullet points

[PASTE MATERIAL HERE]`
    },
    {
        title: 'Vocabulary From Reading',
        description: 'Extract useful vocabulary from a passage.',
        prompt: `Extract the most useful vocabulary from the passage below.
Return only one item per line using a TAB between the term and a concise definition.
Include no headings, numbering, or commentary.

[PASTE PASSAGE HERE]`
    }
];

const ninjaViews = {
    dashboard: document.getElementById('dashboardView'),
    wordninja: document.getElementById('importView'),
    prompts: document.getElementById('promptLibraryView'),
    'import-lab': document.getElementById('importLabView'),
    read: document.getElementById('readNinjaView'),
    listen: document.getElementById('listenNinjaView'),
    backup: document.getElementById('backupAccountView')
};

let learningWorkspace = { readings: [], listenings: [] };
let analyzedImport = null;
let activeNinjaView = 'dashboard';
let activeReadingId = '';
let activeListeningId = '';
let activeListeningSegmentIndex = 0;

function getWordNinjaBridge() {
    return globalThis.WordNinjaCloudBridge;
}

function makeActivityId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitLines(text) {
    return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function splitSentences(text) {
    return (String(text || '').match(/[^.!?。！？\n]+[.!?。！？]?/g) || [])
        .map(sentence => sentence.trim())
        .filter(Boolean);
}

function activityTime(activity) {
    return new Date(activity.lastOpenedAt || activity.createdAt || 0).getTime() || 0;
}

function latestActivity(items) {
    return [...items].sort((a, b) => activityTime(b) - activityTime(a))[0] || null;
}

function normalizeLearningWorkspace() {
    learningWorkspace.readings = (Array.isArray(learningWorkspace.readings) ? learningWorkspace.readings : []).map(reading => ({
        ...reading,
        sentenceIndex: Math.max(0, Number(reading.sentenceIndex) || 0),
        difficultSentenceIndexes: Array.isArray(reading.difficultSentenceIndexes) ? reading.difficultSentenceIndexes : []
    }));
    learningWorkspace.listenings = (Array.isArray(learningWorkspace.listenings) ? learningWorkspace.listenings : []).map(listening => ({
        ...listening,
        segmentIndex: Math.max(0, Number(listening.segmentIndex) || 0)
    }));
}

function saveLearningWorkspace() {
    normalizeLearningWorkspace();
    getWordNinjaBridge()?.saveLearningWorkspace(learningWorkspace);
    updateDashboard();
}

function refreshLearningWorkspace() {
    learningWorkspace = getWordNinjaBridge()?.getLearningWorkspace() || learningWorkspace;
    normalizeLearningWorkspace();
}

function findReading(id = activeReadingId) {
    return learningWorkspace.readings.find(reading => reading.id === id);
}

function findListening(id = activeListeningId) {
    return learningWorkspace.listenings.find(listening => listening.id === id);
}

function showNinjaView(name) {
    if (!ninjaViews[name]) return;
    activeNinjaView = name;
    document.getElementById('studyView').classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('ninjaNav').classList.remove('hidden');
    Object.entries(ninjaViews).forEach(([key, view]) => view.classList.toggle('hidden', key !== name));
    document.querySelectorAll('[data-ninja-view]').forEach(button => button.classList.toggle('is-active', button.dataset.ninjaView === name));
    if (name === 'dashboard') updateDashboard();
    if (name === 'read') {
        refreshLearningWorkspace();
        renderReadings();
        renderReadingPractice();
    }
    if (name === 'listen') {
        refreshLearningWorkspace();
        renderListenings();
        renderListeningSegments();
    }
    window.scrollTo(0, 0);
}

function moveExistingUtilitySections() {
    const primary = document.getElementById('backupPrimarySlot');
    const secondary = document.getElementById('backupSecondarySlot');
    const cloudSection = document.getElementById('cloudBackupSection');
    const fileActions = document.getElementById('fileBackupActions');
    const backupReminder = document.getElementById('backupReminder');
    const sampleTools = document.getElementById('sampleToolsSection');
    const offlineNote = document.getElementById('offlineSafetyNote');

    const primaryTitle = document.createElement('div');
    primaryTitle.innerHTML = '<p class="lab-eyebrow">Account & cloud</p><h3 class="mt-1 text-lg font-medium text-white">Cross-device progress</h3>';
    const fileTitle = document.createElement('div');
    fileTitle.className = 'mt-5';
    fileTitle.innerHTML = '<p class="lab-eyebrow">File backup</p><h3 class="mt-1 text-sm font-medium text-white">Manual safety copy</h3>';
    primary.append(primaryTitle, cloudSection, fileTitle, fileActions);

    const secondaryTitle = document.createElement('div');
    secondaryTitle.innerHTML = '<p class="lab-eyebrow">Help & safety</p><h3 class="mt-1 text-lg font-medium text-white">Getting started</h3>';
    secondary.append(secondaryTitle, backupReminder, sampleTools, offlineNote);
}

function updateDashboard() {
    refreshLearningWorkspace();
    const snapshot = getWordNinjaBridge()?.getDashboardSnapshot();
    if (snapshot) {
        document.getElementById('dashboardDueCount').textContent = String(snapshot.dueCards);
        document.getElementById('dashboardDeckCount').textContent = String(snapshot.decks);
        document.getElementById('dashboardReviewedCount').textContent = String(snapshot.reviewedToday);
        document.getElementById('dashboardActiveCardCount').textContent = String(snapshot.activeCards);
        document.getElementById('dashboardWeakCount').textContent = String(snapshot.weakCards);
        document.getElementById('dashboardDeckPreview').textContent = snapshot.deckNames.length
            ? `Active decks: ${snapshot.deckNames.join(' / ')}`
            : 'Import material or try the sample deck to create your first deck.';
    }

    const latestReading = latestActivity(learningWorkspace.readings);
    const latestListening = latestActivity(learningWorkspace.listenings);
    const readingButton = document.getElementById('dashboardResumeReadingBtn');
    const listeningButton = document.getElementById('dashboardResumeListeningBtn');
    readingButton.disabled = !latestReading;
    listeningButton.disabled = !latestListening;
    document.getElementById('dashboardReadingStatus').textContent = latestReading
        ? `${latestReading.title} · sentence ${(latestReading.sentenceIndex || 0) + 1}`
        : 'No reading activity yet';
    document.getElementById('dashboardListeningStatus').textContent = latestListening
        ? `${latestListening.title} · sentence ${(latestListening.segmentIndex || 0) + 1}`
        : 'No listening activity yet';
    document.getElementById('dashboardCloudStatus').textContent =
        document.getElementById('lastCloudBackupStat')?.textContent || 'Local mode';
}

function renderPromptLibrary() {
    const list = document.getElementById('promptTemplateList');
    list.textContent = '';
    promptTemplates.forEach(template => {
        const card = document.createElement('article');
        card.className = 'lab-template-card';
        const title = document.createElement('h3');
        title.textContent = template.title;
        const description = document.createElement('p');
        description.className = 'lab-muted';
        description.textContent = template.description;
        const pre = document.createElement('pre');
        pre.textContent = template.prompt;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glass-button mt-3 rounded-full border border-sky-300/10 px-4 py-2 text-xs text-sky-100';
        button.textContent = 'Copy Prompt';
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(template.prompt);
                button.textContent = 'Copied';
            } catch {
                button.textContent = 'Select Prompt Text';
            }
            window.setTimeout(() => button.textContent = 'Copy Prompt', 1200);
        });
        card.append(title, description, pre, button);
        list.appendChild(card);
    });
}

function extractBlock(text, label, nextLabels) {
    const match = new RegExp(`(?:^|\\n)${label}:\\s*`, 'i').exec(text);
    if (!match) return '';
    const contentStart = match.index + match[0].length;
    const endings = nextLabels.map(next => {
        const nextMatch = new RegExp(`(?:^|\\n)${next}:\\s*`, 'i').exec(text.slice(contentStart));
        return nextMatch ? contentStart + nextMatch.index : -1;
    }).filter(index => index >= 0);
    return text.slice(contentStart, endings.length ? Math.min(...endings) : text.length).trim();
}

function renderDetectionGrid(counts) {
    const grid = document.getElementById('labDetectionGrid');
    grid.textContent = '';
    const entries = [
        ['Flashcards', counts.flashcards],
        ['Reading passage', counts.passages],
        ['Cloze questions', counts.cloze],
        ['Comprehension', counts.questions],
        ['Listening sentences', counts.listening]
    ];
    entries.forEach(([label, count]) => {
        const item = document.createElement('div');
        const number = document.createElement('strong');
        const text = document.createElement('span');
        number.textContent = String(count);
        text.textContent = label;
        item.classList.toggle('is-detected', count > 0);
        item.append(number, text);
        grid.appendChild(item);
    });
    grid.classList.remove('hidden');
}

function analyzeLabImport() {
    const text = document.getElementById('labImportInput').value.trim();
    const actions = document.getElementById('labImportActions');
    const detectionGrid = document.getElementById('labDetectionGrid');
    if (!text) {
        analyzedImport = null;
        document.getElementById('labImportTitle').textContent = 'Nothing analyzed yet';
        document.getElementById('labImportSummary').textContent = 'Paste formatted output first.';
        document.getElementById('labImportPreview').textContent = '';
        detectionGrid.classList.add('hidden');
        actions.classList.add('hidden');
        return;
    }

    const flashcardLines = text.split(/\r?\n/).filter(line => {
        const parts = line.split('\t');
        return parts.length >= 2 && parts[0].trim() && parts.slice(1).join('\t').trim();
    });
    const passage = extractBlock(text, 'PASSAGE', ['CLOZE', 'QUESTIONS', 'SCRIPT']);
    const cloze = extractBlock(text, 'CLOZE', ['QUESTIONS', 'SCRIPT']);
    const questions = extractBlock(text, 'QUESTIONS', ['SCRIPT']);
    const script = extractBlock(text, 'SCRIPT', []);
    const title = (text.match(/^TITLE:\s*(.+)$/im) || [])[1]?.trim() || 'Untitled activity';
    const counts = {
        flashcards: flashcardLines.length,
        passages: passage ? 1 : 0,
        cloze: splitLines(cloze).length,
        questions: splitLines(questions).length,
        listening: splitSentences(script).length
    };
    const componentCount = Object.values(counts).filter(Boolean).length;
    analyzedImport = {
        title,
        passage,
        cloze,
        questions,
        script,
        flashcardText: flashcardLines.join('\n'),
        counts
    };

    document.getElementById('labImportTitle').textContent = componentCount ? `${componentCount} study components detected` : 'Format not recognized';
    document.getElementById('labImportSummary').textContent = componentCount
        ? 'Choose any detected content below. Each destination keeps the original formatted material intact.'
        : 'Try one of the Prompt Library templates.';
    document.getElementById('labImportPreview').textContent = text.slice(0, 1200);
    renderDetectionGrid(counts);
    actions.classList.toggle('hidden', componentCount === 0);
    document.getElementById('sendFlashcardsBtn').classList.toggle('hidden', counts.flashcards === 0);
    document.getElementById('saveReadingImportBtn').classList.toggle('hidden', counts.passages === 0);
    document.getElementById('saveListeningImportBtn').classList.toggle('hidden', counts.listening === 0);
}

function addReading(reading) {
    const now = new Date().toISOString();
    const savedReading = {
        id: makeActivityId('reading'),
        createdAt: now,
        lastOpenedAt: now,
        sentenceIndex: 0,
        difficultSentenceIndexes: [],
        ...reading
    };
    learningWorkspace.readings.unshift(savedReading);
    learningWorkspace.readings = learningWorkspace.readings.slice(0, 200);
    activeReadingId = savedReading.id;
    saveLearningWorkspace();
    renderReadings();
    startReadingPractice(savedReading.id);
}

function addListening(listening) {
    const now = new Date().toISOString();
    const savedListening = {
        id: makeActivityId('listening'),
        createdAt: now,
        lastOpenedAt: now,
        segmentIndex: 0,
        ...listening
    };
    learningWorkspace.listenings.unshift(savedListening);
    learningWorkspace.listenings = learningWorkspace.listenings.slice(0, 200);
    activeListeningId = savedListening.id;
    activeListeningSegmentIndex = 0;
    saveLearningWorkspace();
    renderListenings();
    loadListening(savedListening);
}

function renderLibraryItems(containerId, items, loadItem, emptyText, metaText) {
    const container = document.getElementById(containerId);
    container.textContent = '';
    if (!items.length) {
        container.textContent = emptyText;
        return;
    }
    items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'lab-library-item';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const meta = document.createElement('p');
        meta.className = 'lab-muted';
        meta.textContent = metaText(item);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glass-button rounded-full border border-white/[0.08] px-4 py-2 text-xs';
        button.textContent = 'Continue';
        button.addEventListener('click', () => loadItem(item));
        card.append(title, meta, button);
        container.appendChild(card);
    });
}

function renderReadings() {
    renderLibraryItems('readingLibrary', learningWorkspace.readings, item => startReadingPractice(item.id), 'No reading activities saved yet.', item => {
        const sentenceCount = splitSentences(item.passage).length;
        return `${sentenceCount} sentences · ${item.difficultSentenceIndexes?.length || 0} difficult`;
    });
}

function loadReadingBuilder(reading) {
    document.getElementById('readingTitleInput').value = reading.title;
    document.getElementById('readingPassageInput').value = reading.passage;
    document.getElementById('readingClozeInput').value = reading.cloze || '';
    document.getElementById('readingQuestionsInput').value = reading.questions || '';
}

function startReadingPractice(id) {
    const reading = findReading(id);
    if (!reading) return;
    activeReadingId = reading.id;
    reading.lastOpenedAt = new Date().toISOString();
    loadReadingBuilder(reading);
    saveLearningWorkspace();
    renderReadingPractice();
    document.getElementById('readingPracticePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPracticeLines(containerId, lines, emptyText, className) {
    const container = document.getElementById(containerId);
    container.textContent = '';
    if (!lines.length) {
        container.textContent = emptyText;
        return;
    }
    lines.forEach((line, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = line;
        button.addEventListener('click', () => button.classList.toggle('is-revealed'));
        button.dataset.number = String(index + 1);
        container.appendChild(button);
    });
}

function renderReadingPractice() {
    const panel = document.getElementById('readingPracticePanel');
    const reading = findReading();
    panel.classList.toggle('hidden', !reading);
    if (!reading) return;
    const sentences = splitSentences(reading.passage);
    const maxIndex = Math.max(0, sentences.length - 1);
    reading.sentenceIndex = Math.min(reading.sentenceIndex || 0, maxIndex);
    const difficult = new Set(reading.difficultSentenceIndexes || []);
    document.getElementById('readingPracticeTitle').textContent = reading.title;
    document.getElementById('readingSentenceProgress').textContent = sentences.length
        ? `Sentence ${reading.sentenceIndex + 1} of ${sentences.length}`
        : 'No sentences';
    document.getElementById('readingDifficultCount').textContent = `${difficult.size} difficult`;
    document.getElementById('readingSentenceCard').textContent = sentences[reading.sentenceIndex] || 'This activity has no passage text yet.';
    document.getElementById('readingSentenceCard').classList.toggle('is-difficult', difficult.has(reading.sentenceIndex));
    document.getElementById('toggleDifficultSentenceBtn').textContent = difficult.has(reading.sentenceIndex) ? 'Difficult ✓' : 'Mark Difficult';
    document.getElementById('previousReadingSentenceBtn').disabled = reading.sentenceIndex <= 0;
    document.getElementById('nextReadingSentenceBtn').disabled = !sentences.length || reading.sentenceIndex >= maxIndex;
    renderPracticeLines('readingClozePractice', splitLines(reading.cloze), 'No cloze questions in this activity.', 'cloze-practice-item');
    renderPracticeLines('readingQuestionPractice', splitLines(reading.questions), 'No comprehension questions in this activity.', 'question-practice-item');
}

function moveReadingSentence(direction) {
    const reading = findReading();
    if (!reading) return;
    const maxIndex = Math.max(0, splitSentences(reading.passage).length - 1);
    reading.sentenceIndex = Math.min(maxIndex, Math.max(0, (reading.sentenceIndex || 0) + direction));
    reading.lastOpenedAt = new Date().toISOString();
    saveLearningWorkspace();
    renderReadingPractice();
}

function toggleDifficultSentence() {
    const reading = findReading();
    if (!reading) return;
    const difficult = new Set(reading.difficultSentenceIndexes || []);
    if (difficult.has(reading.sentenceIndex)) difficult.delete(reading.sentenceIndex);
    else difficult.add(reading.sentenceIndex);
    reading.difficultSentenceIndexes = [...difficult].sort((a, b) => a - b);
    saveLearningWorkspace();
    renderReadingPractice();
    renderReadings();
}

function renderListenings() {
    renderLibraryItems('listeningLibrary', learningWorkspace.listenings, loadListening, 'No listening activities saved yet.', item => {
        const segments = splitSentences(item.script);
        return `${segments.length} sentences · resume at ${(item.segmentIndex || 0) + 1}`;
    });
}

function loadListening(listening) {
    listening = findListening(listening.id) || listening;
    activeListeningId = listening.id;
    activeListeningSegmentIndex = Math.min(listening.segmentIndex || 0, Math.max(0, splitSentences(listening.script).length - 1));
    listening.lastOpenedAt = new Date().toISOString();
    document.getElementById('listeningTitleInput').value = listening.title;
    document.getElementById('listeningScriptInput').value = listening.script;
    saveLearningWorkspace();
    updateTranscript();
    renderListeningSegments();
}

function updateTranscript() {
    document.getElementById('listeningTranscript').textContent = document.getElementById('listeningScriptInput').value.trim() || 'Enter a script to begin.';
    renderListeningSegments();
}

function currentListeningSegments() {
    return splitSentences(document.getElementById('listeningScriptInput').value);
}

function renderListeningSegments() {
    const segments = currentListeningSegments();
    activeListeningSegmentIndex = Math.min(activeListeningSegmentIndex, Math.max(0, segments.length - 1));
    const container = document.getElementById('listeningSegments');
    container.textContent = '';
    segments.forEach((segment, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `listening-segment${index === activeListeningSegmentIndex ? ' is-active' : ''}`;
        button.textContent = segment;
        button.addEventListener('click', () => {
            activeListeningSegmentIndex = index;
            saveListeningPosition();
            renderListeningSegments();
            speakText(segment);
        });
        container.appendChild(button);
    });
    document.getElementById('listeningSegmentProgress').textContent = segments.length
        ? `Sentence ${activeListeningSegmentIndex + 1} of ${segments.length}`
        : 'Sentence 0 of 0';
    document.getElementById('previousListeningSegmentBtn').disabled = activeListeningSegmentIndex <= 0;
    document.getElementById('repeatListeningSegmentBtn').disabled = !segments.length;
    document.getElementById('nextListeningSegmentBtn').disabled = !segments.length || activeListeningSegmentIndex >= segments.length - 1;
}

function saveListeningPosition() {
    const listening = findListening();
    if (!listening) return;
    listening.segmentIndex = activeListeningSegmentIndex;
    listening.lastOpenedAt = new Date().toISOString();
    saveLearningWorkspace();
}

function speakText(text) {
    if (!text || !globalThis.speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number(document.getElementById('speechRateInput').value);
    speechSynthesis.speak(utterance);
}

function moveListeningSegment(direction, play = false) {
    const segments = currentListeningSegments();
    if (!segments.length) return;
    activeListeningSegmentIndex = Math.min(segments.length - 1, Math.max(0, activeListeningSegmentIndex + direction));
    saveListeningPosition();
    renderListeningSegments();
    if (play) speakText(segments[activeListeningSegmentIndex]);
}

function bindNavigation() {
    document.querySelectorAll('[data-ninja-view]').forEach(button => button.addEventListener('click', () => showNinjaView(button.dataset.ninjaView)));
    document.getElementById('dashboardReviewBtn').addEventListener('click', () => document.getElementById('studyTodayBtn').click());
    document.getElementById('dashboardResumeReadingBtn').addEventListener('click', () => {
        const reading = latestActivity(learningWorkspace.readings);
        if (!reading) return;
        showNinjaView('read');
        startReadingPractice(reading.id);
    });
    document.getElementById('dashboardResumeListeningBtn').addEventListener('click', () => {
        const listening = latestActivity(learningWorkspace.listenings);
        if (!listening) return;
        showNinjaView('listen');
        loadListening(listening);
    });
    document.querySelectorAll('[data-dashboard-action]').forEach(button => button.addEventListener('click', () => {
        const action = button.dataset.dashboardAction;
        if (action === 'prompts') return showNinjaView('prompts');
        showNinjaView('wordninja');
        const target = action === 'import' ? document.getElementById('importInput') : document.getElementById('libraryList');
        window.setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (action === 'import') target.focus();
        }, 0);
    }));
}

function bindModuleEvents() {
    document.getElementById('analyzeLabImportBtn').addEventListener('click', analyzeLabImport);
    document.getElementById('clearLabImportBtn').addEventListener('click', () => {
        document.getElementById('labImportInput').value = '';
        analyzeLabImport();
    });
    document.getElementById('sendFlashcardsBtn').addEventListener('click', () => {
        if (!analyzedImport?.counts.flashcards) return;
        document.getElementById('importInput').value = analyzedImport.flashcardText;
        document.querySelector('input[name="termDelim"][value="tab"]').checked = true;
        document.querySelector('input[name="cardDelim"][value="newline"]').checked = true;
        document.getElementById('importInput').dispatchEvent(new Event('input'));
        showNinjaView('wordninja');
        document.getElementById('importInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('saveReadingImportBtn').addEventListener('click', () => {
        if (analyzedImport?.passage) addReading({
            title: analyzedImport.title,
            passage: analyzedImport.passage,
            cloze: analyzedImport.cloze,
            questions: analyzedImport.questions
        });
        showNinjaView('read');
    });
    document.getElementById('saveListeningImportBtn').addEventListener('click', () => {
        if (analyzedImport?.script) addListening({ title: analyzedImport.title, script: analyzedImport.script });
        showNinjaView('listen');
    });
    document.getElementById('saveReadingBtn').addEventListener('click', () => addReading({
        title: document.getElementById('readingTitleInput').value.trim() || 'Untitled reading',
        passage: document.getElementById('readingPassageInput').value.trim(),
        cloze: document.getElementById('readingClozeInput').value.trim(),
        questions: document.getElementById('readingQuestionsInput').value.trim()
    }));
    document.getElementById('closeReadingPracticeBtn').addEventListener('click', () => {
        activeReadingId = '';
        renderReadingPractice();
    });
    document.getElementById('readingSentenceCard').addEventListener('click', toggleDifficultSentence);
    document.getElementById('previousReadingSentenceBtn').addEventListener('click', () => moveReadingSentence(-1));
    document.getElementById('nextReadingSentenceBtn').addEventListener('click', () => moveReadingSentence(1));
    document.getElementById('toggleDifficultSentenceBtn').addEventListener('click', toggleDifficultSentence);
    document.getElementById('saveListeningBtn').addEventListener('click', () => addListening({
        title: document.getElementById('listeningTitleInput').value.trim() || 'Untitled listening',
        script: document.getElementById('listeningScriptInput').value.trim()
    }));
    document.getElementById('listeningScriptInput').addEventListener('input', updateTranscript);
    document.getElementById('speechRateInput').addEventListener('input', event => document.getElementById('speechRateLabel').textContent = `${Number(event.target.value).toFixed(1)}x`);
    document.getElementById('playSpeechBtn').addEventListener('click', () => speakText(document.getElementById('listeningScriptInput').value.trim()));
    document.getElementById('stopSpeechBtn').addEventListener('click', () => globalThis.speechSynthesis?.cancel());
    document.getElementById('previousListeningSegmentBtn').addEventListener('click', () => moveListeningSegment(-1, true));
    document.getElementById('repeatListeningSegmentBtn').addEventListener('click', () => speakText(currentListeningSegments()[activeListeningSegmentIndex]));
    document.getElementById('nextListeningSegmentBtn').addEventListener('click', () => moveListeningSegment(1, true));
    document.getElementById('toggleTranscriptBtn').addEventListener('click', event => {
        const transcript = document.getElementById('listeningTranscript');
        transcript.classList.toggle('hidden');
        event.currentTarget.textContent = transcript.classList.contains('hidden') ? 'Show Transcript' : 'Hide Transcript';
    });
    document.getElementById('clearReadingsBtn').addEventListener('click', () => {
        learningWorkspace.readings = [];
        activeReadingId = '';
        saveLearningWorkspace();
        renderReadings();
        renderReadingPractice();
    });
    document.getElementById('clearListeningsBtn').addEventListener('click', () => {
        learningWorkspace.listenings = [];
        activeListeningId = '';
        activeListeningSegmentIndex = 0;
        saveLearningWorkspace();
        renderListenings();
        renderListeningSegments();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    refreshLearningWorkspace();
    moveExistingUtilitySections();
    renderPromptLibrary();
    renderReadings();
    renderListenings();
    bindNavigation();
    bindModuleEvents();
    updateTranscript();
    showNinjaView('dashboard');

    const studyView = document.getElementById('studyView');
    new MutationObserver(() => {
        const studying = !studyView.classList.contains('hidden');
        document.getElementById('ninjaNav').classList.toggle('hidden', studying);
        Object.values(ninjaViews).forEach(view => {
            if (studying) view.classList.add('hidden');
        });
        if (!studying && document.getElementById('importView').classList.contains('hidden') === false) {
            activeNinjaView = 'wordninja';
            document.querySelectorAll('[data-ninja-view]').forEach(button => button.classList.toggle('is-active', button.dataset.ninjaView === 'wordninja'));
        }
    }).observe(studyView, { attributes: true, attributeFilter: ['class'] });

    const dashboardSignals = ['dueStat', 'deckStat', 'reviewedTodayStat', 'activeCardStat', 'weakCardStat', 'lastCloudBackupStat'];
    dashboardSignals.forEach(id => {
        const element = document.getElementById(id);
        if (element) new MutationObserver(updateDashboard).observe(element, { childList: true, subtree: true, characterData: true });
    });
});

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

function getWordNinjaBridge() {
    return globalThis.WordNinjaCloudBridge;
}

function makeActivityId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function saveLearningWorkspace() {
    getWordNinjaBridge()?.saveLearningWorkspace(learningWorkspace);
    updateDashboard();
}

function refreshLearningWorkspace() {
    learningWorkspace = getWordNinjaBridge()?.getLearningWorkspace() || learningWorkspace;
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
    }
    if (name === 'listen') {
        refreshLearningWorkspace();
        renderListenings();
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
    const start = text.indexOf(`${label}:`);
    if (start < 0) return '';
    const contentStart = start + label.length + 1;
    const endings = nextLabels.map(next => text.indexOf(`${next}:`, contentStart)).filter(index => index >= 0);
    const end = endings.length ? Math.min(...endings) : text.length;
    return text.slice(contentStart, end).trim();
}

function analyzeLabImport() {
    const text = document.getElementById('labImportInput').value.trim();
    const actions = document.getElementById('labImportActions');
    if (!text) {
        analyzedImport = null;
        document.getElementById('labImportTitle').textContent = 'Nothing analyzed yet';
        document.getElementById('labImportSummary').textContent = 'Paste formatted output first.';
        document.getElementById('labImportPreview').textContent = '';
        actions.classList.add('hidden');
        return;
    }

    const flashcards = text.split(/\r?\n/).map(line => line.split('\t')).filter(parts => parts.length >= 2 && parts[0].trim() && parts.slice(1).join('\t').trim());
    const passage = extractBlock(text, 'PASSAGE', ['CLOZE', 'QUESTIONS']);
    const script = extractBlock(text, 'SCRIPT', []);
    const title = (text.match(/^TITLE:\s*(.+)$/m) || [])[1]?.trim() || 'Untitled activity';
    analyzedImport = passage
        ? { type: 'reading', title, passage, cloze: extractBlock(text, 'CLOZE', ['QUESTIONS']), questions: extractBlock(text, 'QUESTIONS', []) }
        : script
            ? { type: 'listening', title, script }
            : flashcards.length
                ? { type: 'flashcards', text, count: flashcards.length }
                : { type: 'unknown', text };

    document.getElementById('labImportTitle').textContent = analyzedImport.type === 'unknown' ? 'Format not recognized' : `${analyzedImport.type[0].toUpperCase()}${analyzedImport.type.slice(1)} detected`;
    document.getElementById('labImportSummary').textContent = analyzedImport.type === 'flashcards'
        ? `${analyzedImport.count} tab-separated cards are ready for WordNinja.`
        : analyzedImport.type === 'reading'
            ? 'Passage, cloze content, and comprehension questions are ready.'
            : analyzedImport.type === 'listening'
                ? 'Listening script is ready for browser speech.'
                : 'Try one of the Prompt Library templates.';
    document.getElementById('labImportPreview').textContent = text.slice(0, 1200);
    actions.classList.toggle('hidden', analyzedImport.type === 'unknown');
    document.getElementById('sendFlashcardsBtn').classList.toggle('hidden', analyzedImport.type !== 'flashcards');
    document.getElementById('saveReadingImportBtn').classList.toggle('hidden', analyzedImport.type !== 'reading');
    document.getElementById('saveListeningImportBtn').classList.toggle('hidden', analyzedImport.type !== 'listening');
}

function addReading(reading) {
    learningWorkspace.readings.unshift({ id: makeActivityId('reading'), createdAt: new Date().toISOString(), ...reading });
    learningWorkspace.readings = learningWorkspace.readings.slice(0, 200);
    saveLearningWorkspace();
    renderReadings();
}

function addListening(listening) {
    learningWorkspace.listenings.unshift({ id: makeActivityId('listening'), createdAt: new Date().toISOString(), ...listening });
    learningWorkspace.listenings = learningWorkspace.listenings.slice(0, 200);
    saveLearningWorkspace();
    renderListenings();
}

function renderLibraryItems(containerId, items, loadItem, emptyText) {
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
        meta.textContent = new Date(item.createdAt).toLocaleString();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glass-button rounded-full border border-white/[0.08] px-4 py-2 text-xs';
        button.textContent = 'Open';
        button.addEventListener('click', () => loadItem(item));
        card.append(title, meta, button);
        container.appendChild(card);
    });
}

function renderReadings() {
    renderLibraryItems('readingLibrary', learningWorkspace.readings, item => {
        document.getElementById('readingTitleInput').value = item.title;
        document.getElementById('readingPassageInput').value = item.passage;
        document.getElementById('readingClozeInput').value = item.cloze || '';
        document.getElementById('readingQuestionsInput').value = item.questions || '';
    }, 'No reading activities saved yet.');
}

function renderListenings() {
    renderLibraryItems('listeningLibrary', learningWorkspace.listenings, item => {
        document.getElementById('listeningTitleInput').value = item.title;
        document.getElementById('listeningScriptInput').value = item.script;
        updateTranscript();
    }, 'No listening activities saved yet.');
}

function updateTranscript() {
    document.getElementById('listeningTranscript').textContent = document.getElementById('listeningScriptInput').value.trim() || 'Enter a script to begin.';
}

function bindNavigation() {
    document.querySelectorAll('[data-ninja-view]').forEach(button => button.addEventListener('click', () => showNinjaView(button.dataset.ninjaView)));
    document.getElementById('dashboardReviewBtn').addEventListener('click', () => document.getElementById('studyTodayBtn').click());
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
        if (analyzedImport?.type !== 'flashcards') return;
        document.getElementById('importInput').value = analyzedImport.text;
        document.querySelector('input[name="termDelim"][value="tab"]').checked = true;
        document.querySelector('input[name="cardDelim"][value="newline"]').checked = true;
        document.getElementById('importInput').dispatchEvent(new Event('input'));
        showNinjaView('wordninja');
        document.getElementById('importInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('saveReadingImportBtn').addEventListener('click', () => {
        if (analyzedImport?.type === 'reading') addReading(analyzedImport);
        showNinjaView('read');
    });
    document.getElementById('saveListeningImportBtn').addEventListener('click', () => {
        if (analyzedImport?.type === 'listening') addListening(analyzedImport);
        showNinjaView('listen');
    });
    document.getElementById('saveReadingBtn').addEventListener('click', () => addReading({
        title: document.getElementById('readingTitleInput').value.trim() || 'Untitled reading',
        passage: document.getElementById('readingPassageInput').value.trim(),
        cloze: document.getElementById('readingClozeInput').value.trim(),
        questions: document.getElementById('readingQuestionsInput').value.trim()
    }));
    document.getElementById('saveListeningBtn').addEventListener('click', () => addListening({
        title: document.getElementById('listeningTitleInput').value.trim() || 'Untitled listening',
        script: document.getElementById('listeningScriptInput').value.trim()
    }));
    document.getElementById('listeningScriptInput').addEventListener('input', updateTranscript);
    document.getElementById('speechRateInput').addEventListener('input', event => document.getElementById('speechRateLabel').textContent = `${Number(event.target.value).toFixed(1)}x`);
    document.getElementById('playSpeechBtn').addEventListener('click', () => {
        const text = document.getElementById('listeningScriptInput').value.trim();
        if (!text || !globalThis.speechSynthesis) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = Number(document.getElementById('speechRateInput').value);
        speechSynthesis.speak(utterance);
    });
    document.getElementById('stopSpeechBtn').addEventListener('click', () => globalThis.speechSynthesis?.cancel());
    document.getElementById('toggleTranscriptBtn').addEventListener('click', event => {
        const transcript = document.getElementById('listeningTranscript');
        transcript.classList.toggle('hidden');
        event.currentTarget.textContent = transcript.classList.contains('hidden') ? 'Show Transcript' : 'Hide Transcript';
    });
    document.getElementById('clearReadingsBtn').addEventListener('click', () => {
        learningWorkspace.readings = [];
        saveLearningWorkspace();
        renderReadings();
    });
    document.getElementById('clearListeningsBtn').addEventListener('click', () => {
        learningWorkspace.listenings = [];
        saveLearningWorkspace();
        renderListenings();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    learningWorkspace = getWordNinjaBridge()?.getLearningWorkspace() || learningWorkspace;
    moveExistingUtilitySections();
    renderPromptLibrary();
    renderReadings();
    renderListenings();
    bindNavigation();
    bindModuleEvents();
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

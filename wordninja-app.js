const STORAGE_KEY = 'wordninja_library_v2';
const OLD_STORAGE_KEY = 'wordninja_library_v1';
const LEGACY_DECK_KEY = 'sleek_deck';
const LEGACY_MIGRATED_KEY = 'wordninja_legacy_migrated_v2';
const DEFAULT_FOLDER_ID = 'folder-default';
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.2;
const AGAIN_MINUTES = 0.5;
const LEARNING_HARD_MINUTES = 6;
const LEARNING_GOOD_MINUTES = 10;
const NEW_EASY_INTERVAL_DAYS = 5;
const KNOWN_INTERVAL_DAYS = 365;
const DEFAULT_DAILY_REVIEW_LIMIT = 50;
const DAILY_REVIEW_LIMIT_OPTIONS = [20, 50, 100, 200, 0];
const FLIP_ANIMATION_MS = 680;
const SAFETY_SNAPSHOT_KEY = 'wordninja_safety_snapshot_v1';
const BACKUP_REMINDER_REVIEW_COUNT = 50;
const BACKUP_REMINDER_DAYS = 7;
const ONBOARDING_VERSION = 2;
const DEMO_SOURCE = 'wordninja-demo-v1';
const DATABASE_NAME = 'wordninja_storage_v1';
const DATABASE_VERSION = 1;
const DATABASE_STORE = 'library';
const DATABASE_LIBRARY_KEY = 'current';

let library = createEmptyLibrary();
let parsedCache = [];
let deck = [];
let activeDeckId = '';
let activeDeckName = '';
let activeStudyMode = 'due';
let activeStudyItems = [];
let currentIndex = 0;
let isFlipped = false;
let isFlipAnimating = false;
let flipAnimationTimer = 0;
let learnSwipeStartX = 0;
let learnSwipeStartY = 0;
let suppressCardClick = false;
let modalState = null;
let deckManagerDeckId = '';
let deckManagerPreviousFocus = null;
let cardManagerDeckId = '';
let cardManagerCardId = '';
let cardManagerSearchQuery = '';
let cardManagerStarredOnly = false;
let cardManagerPreviousFocus = null;
let deferredInstallPrompt = null;
let learnSession = null;
let onboardingStep = 0;
let onboardingPreviousFocus = null;
let mirrorWriteQueue = Promise.resolve();
const DEFAULT_HINT_HTML = 'Click the card or press <kbd class="mx-1 rounded border border-white/[0.07] bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-gray-400">Space</kbd> to reveal';
const ONBOARDING_STEPS = [
    {
        icon: '▤',
        title: 'Build your first deck',
        message: 'Paste tab-separated terms and definitions, check the preview, name the deck, and save it into a folder.'
    },
    {
        icon: '◎',
        title: 'Choose the right study mode',
        message: 'Spaced Review updates long-term scheduling. Flashcard Practice, Learn Mode, and Preview help you study without changing due dates.'
    },
    {
        icon: '◷',
        title: 'Follow the daily review',
        message: 'Study Today gathers every due card from active decks. Your answers schedule the next review over days, weeks, and months.'
    },
    {
        icon: '⌨',
        title: 'Study with keyboard shortcuts',
        message: 'Press Space or Enter to reveal a card. After revealing it, press 1, 2, 3, or 4 to answer quickly.'
    },
    {
        icon: '◇',
        title: 'Keep your library protected',
        message: 'Organize decks with folders, archive material you are not studying, and export a backup before changing devices or browser data.'
    }
];

const appHeader = document.getElementById('app-header');
const openGuideBtn = document.getElementById('openGuideBtn');
const installAppBtn = document.getElementById('installAppBtn');
const importInput = document.getElementById('importInput');
const previewCount = document.getElementById('previewCount');
const previewStatus = document.getElementById('previewStatus');
const deckNameInput = document.getElementById('deckNameInput');
const folderSelect = document.getElementById('folderSelect');
const newDeckImportFields = document.getElementById('newDeckImportFields');
const existingDeckImportGroup = document.getElementById('existingDeckImportGroup');
const existingDeckImportSelect = document.getElementById('existingDeckImportSelect');
const duplicateImportStatus = document.getElementById('duplicateImportStatus');
const newFolderInput = document.getElementById('newFolderInput');
const addFolderBtn = document.getElementById('addFolderBtn');
const parsedPreviewMeta = document.getElementById('parsedPreviewMeta');
const parsedPreviewList = document.getElementById('parsedPreviewList');
const manualCardFront = document.getElementById('manualCardFront');
const manualCardBack = document.getElementById('manualCardBack');
const manualDeckSelect = document.getElementById('manualDeckSelect');
const addManualCardBtn = document.getElementById('addManualCardBtn');
const manualCardStatus = document.getElementById('manualCardStatus');
const clearImportBtn = document.getElementById('clearImportBtn');
const saveDeckBtn = document.getElementById('saveDeckBtn');
const quickStudyBtn = document.getElementById('quickStudyBtn');
const importView = document.getElementById('importView');
const studyView = document.getElementById('studyView');
const libraryFolderFilter = document.getElementById('libraryFolderFilter');
const libraryList = document.getElementById('libraryList');
const libraryStatus = document.getElementById('libraryStatus');
const librarySummary = document.getElementById('librarySummary');
const folderStat = document.getElementById('folderStat');
const deckStat = document.getElementById('deckStat');
const dueStat = document.getElementById('dueStat');
const studyTodayBtn = document.getElementById('studyTodayBtn');
const studyTodayCount = document.getElementById('studyTodayCount');
const studyTodayCountLabel = document.getElementById('studyTodayCountLabel');
const studyTodayLimitText = document.getElementById('studyTodayLimitText');
const dailyReviewLimitSelect = document.getElementById('dailyReviewLimitSelect');
const reviewedTodayStat = document.getElementById('reviewedTodayStat');
const activeCardStat = document.getElementById('activeCardStat');
const weakCardStat = document.getElementById('weakCardStat');
const suspendedCardStat = document.getElementById('suspendedCardStat');
const studyWeakCardsBtn = document.getElementById('studyWeakCardsBtn');
const loadDemoDeckBtn = document.getElementById('loadDemoDeckBtn');
const presentationGuideBtn = document.getElementById('presentationGuideBtn');
const lastBackupStat = document.getElementById('lastBackupStat');
const reviewQualityStat = document.getElementById('reviewQualityStat');
const backupReminderBadge = document.getElementById('backupReminderBadge');
const exportBackupBtn = document.getElementById('exportBackupBtn');
const importBackupBtn = document.getElementById('importBackupBtn');
const backupFileInput = document.getElementById('backupFileInput');
const renameFolderBtn = document.getElementById('renameFolderBtn');
const deleteFolderBtn = document.getElementById('deleteFolderBtn');
const showArchivedToggle = document.getElementById('showArchivedToggle');
const showArchivedLabel = document.getElementById('showArchivedLabel');
const flashcardContent = document.getElementById('flashcard-content');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const cardProgress = document.getElementById('cardProgress');
const activeDeckTitle = document.getElementById('activeDeckTitle');
const studyModeLabel = document.getElementById('studyModeLabel');
const gradeControls = document.getElementById('gradeControls');
const learnControls = document.getElementById('learnControls');
const studyCardActions = document.getElementById('studyCardActions');
const suspendCurrentCardBtn = document.getElementById('suspendCurrentCardBtn');
const markKnownCurrentCardBtn = document.getElementById('markKnownCurrentCardBtn');
const hintText = document.getElementById('hintText');
const backToImport = document.getElementById('backToImport');
const appModal = document.getElementById('appModal');
const modalEyebrow = document.getElementById('modalEyebrow');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalInput = document.getElementById('modalInput');
const modalError = document.getElementById('modalError');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const deckManagerModal = document.getElementById('deckManagerModal');
const deckManagerTitle = document.getElementById('deckManagerTitle');
const deckManagerMeta = document.getElementById('deckManagerMeta');
const deckManagerStats = document.getElementById('deckManagerStats');
const deckManagerFolderSelect = document.getElementById('deckManagerFolderSelect');
const closeDeckManagerBtn = document.getElementById('closeDeckManagerBtn');
const manageDeckCardsBtn = document.getElementById('manageDeckCardsBtn');
const renameManagedDeckBtn = document.getElementById('renameManagedDeckBtn');
const copyManagedDeckBtn = document.getElementById('copyManagedDeckBtn');
const exportManagedDeckBtn = document.getElementById('exportManagedDeckBtn');
const reverseManagedDeckBtn = document.getElementById('reverseManagedDeckBtn');
const archiveManagedDeckBtn = document.getElementById('archiveManagedDeckBtn');
const deleteManagedDeckBtn = document.getElementById('deleteManagedDeckBtn');
const cardManagerModal = document.getElementById('cardManagerModal');
const cardManagerTitle = document.getElementById('cardManagerTitle');
const cardManagerMeta = document.getElementById('cardManagerMeta');
const cardManagerCount = document.getElementById('cardManagerCount');
const cardManagerSearch = document.getElementById('cardManagerSearch');
const showStarredOnlyToggle = document.getElementById('showStarredOnlyToggle');
const cardManagerList = document.getElementById('cardManagerList');
const studyStarredCardsBtn = document.getElementById('studyStarredCardsBtn');
const cardEditorTitle = document.getElementById('cardEditorTitle');
const cardEditFront = document.getElementById('cardEditFront');
const cardEditBack = document.getElementById('cardEditBack');
const cardManagerStatus = document.getElementById('cardManagerStatus');
const addManagedCardBtn = document.getElementById('addManagedCardBtn');
const closeCardManagerBtn = document.getElementById('closeCardManagerBtn');
const saveManagedCardBtn = document.getElementById('saveManagedCardBtn');
const deleteManagedCardBtn = document.getElementById('deleteManagedCardBtn');
const toggleSuspendManagedCardBtn = document.getElementById('toggleSuspendManagedCardBtn');
const toggleStarManagedCardBtn = document.getElementById('toggleStarManagedCardBtn');
const markKnownManagedCardBtn = document.getElementById('markKnownManagedCardBtn');
const reverseManagedCardBtn = document.getElementById('reverseManagedCardBtn');
const onboardingModal = document.getElementById('onboardingModal');
const onboardingIcon = document.getElementById('onboardingIcon');
const onboardingStepLabel = document.getElementById('onboardingStepLabel');
const onboardingStepTitle = document.getElementById('onboardingStepTitle');
const onboardingMessage = document.getElementById('onboardingMessage');
const onboardingDots = document.getElementById('onboardingDots');
const skipOnboardingBtn = document.getElementById('skipOnboardingBtn');
const backOnboardingBtn = document.getElementById('backOnboardingBtn');
const nextOnboardingBtn = document.getElementById('nextOnboardingBtn');

function createEmptyLibrary() {
    return {
        version: 2,
        folders: [{ id: DEFAULT_FOLDER_ID, name: 'My Decks', createdAt: new Date().toISOString() }],
        decks: [],
        metadata: {
            lastBackupAt: '',
            reviewLog: [],
            reviewsSinceBackup: 0,
            backupRecommended: false,
            onboardingVersion: 0,
            dailyReviewLimit: DEFAULT_DAILY_REVIEW_LIMIT
        }
    };
}

function makeId(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function intOr(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function normalizeDailyReviewLimit(value) {
    const limit = Number(value);
    return DAILY_REVIEW_LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_DAILY_REVIEW_LIMIT;
}

function validIsoDate(value, fallback = '') {
    if (typeof value !== 'string' || value.trim() === '') return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function normalizeCard(rawCard, nowIso = new Date().toISOString()) {
    if (!rawCard || typeof rawCard !== 'object') return null;

    const fields = rawCard.fields && typeof rawCard.fields === 'object' ? rawCard.fields : {};
    const front = String(rawCard.front ?? fields.term ?? fields.front ?? '').trim();
    const back = String(rawCard.back ?? fields.definition ?? fields.back ?? '').trim();
    if (!front || !back) return null;

    const dueDate = validIsoDate(rawCard.dueDate, nowIso);
    const createdAt = validIsoDate(rawCard.createdAt, nowIso);
    const lastReviewedAt = validIsoDate(rawCard.lastReviewedAt, '');
    const suspended = rawCard.suspended === true;
    const known = rawCard.known === true;

    return {
        id: typeof rawCard.id === 'string' && rawCard.id ? rawCard.id : makeId('card'),
        type: typeof rawCard.type === 'string' && rawCard.type ? rawCard.type : 'basic',
        mode: typeof rawCard.mode === 'string' && rawCard.mode ? rawCard.mode : 'term-to-definition',
        reverseOf: typeof rawCard.reverseOf === 'string' ? rawCard.reverseOf : '',
        starred: rawCard.starred === true,
        front,
        back,
        fields: {
            term: String(fields.term ?? front).trim(),
            definition: String(fields.definition ?? back).trim()
        },
        dueDate,
        intervalDays: Math.max(0, numberOr(rawCard.intervalDays, 0)),
        ease: clamp(numberOr(rawCard.ease, DEFAULT_EASE), MIN_EASE, MAX_EASE),
        reviews: intOr(rawCard.reviews, 0),
        lapses: intOr(rawCard.lapses, 0),
        lastReviewedAt,
        suspended,
        suspendedAt: suspended ? validIsoDate(rawCard.suspendedAt, nowIso) : '',
        known,
        knownAt: known ? validIsoDate(rawCard.knownAt, nowIso) : '',
        createdAt
    };
}

function createCardFromImport(rawCard) {
    const now = new Date().toISOString();
    return normalizeCard({
        ...rawCard,
        id: makeId('card'),
        type: typeof rawCard.type === 'string' && rawCard.type ? rawCard.type : 'basic',
        mode: typeof rawCard.mode === 'string' && rawCard.mode ? rawCard.mode : 'term-to-definition',
        reverseOf: typeof rawCard.reverseOf === 'string' ? rawCard.reverseOf : '',
        starred: false,
        dueDate: now,
        intervalDays: 0,
        ease: DEFAULT_EASE,
        reviews: 0,
        lapses: 0,
        lastReviewedAt: '',
        suspended: false,
        suspendedAt: '',
        known: false,
        knownAt: '',
        createdAt: now
    }, now);
}

function normalizeLibraryPayload(payload) {
    const source = payload && payload.library ? payload.library : payload;
    if (!source || typeof source !== 'object') {
        throw new Error('Backup is not a WordNinja library.');
    }

    const normalized = createEmptyLibrary();
    const folders = Array.isArray(source.folders) ? source.folders : [];
    const decks = Array.isArray(source.decks) ? source.decks : [];
    if (!Array.isArray(source.folders) && !Array.isArray(source.decks)) {
        throw new Error('Backup is missing folders and decks.');
    }

    const seenFolders = new Set([DEFAULT_FOLDER_ID]);
    folders.forEach(folder => {
        if (!folder || typeof folder !== 'object') return;
        const name = String(folder.name || '').trim();
        const id = typeof folder.id === 'string' && folder.id ? folder.id : makeId('folder');
        if (!name || seenFolders.has(id)) return;

        normalized.folders.push({
            id,
            name,
            createdAt: validIsoDate(folder.createdAt, new Date().toISOString())
        });
        seenFolders.add(id);
    });

    normalized.decks = decks.reduce((validDecks, savedDeck) => {
        if (!savedDeck || typeof savedDeck !== 'object') return validDecks;
        const name = String(savedDeck.name || '').trim();
        const cards = Array.isArray(savedDeck.cards)
            ? savedDeck.cards.map(card => normalizeCard(card)).filter(Boolean)
            : [];
        if (!name) return validDecks;

            validDecks.push({
                id: typeof savedDeck.id === 'string' && savedDeck.id ? savedDeck.id : makeId('deck'),
                folderId: seenFolders.has(savedDeck.folderId) ? savedDeck.folderId : DEFAULT_FOLDER_ID,
                name,
                cards,
                source: typeof savedDeck.source === 'string' ? savedDeck.source : '',
                archived: savedDeck.archived === true,
            archivedAt: savedDeck.archived === true ? validIsoDate(savedDeck.archivedAt, new Date().toISOString()) : '',
            createdAt: validIsoDate(savedDeck.createdAt, new Date().toISOString()),
            updatedAt: validIsoDate(savedDeck.updatedAt, new Date().toISOString()),
            lastStudiedAt: validIsoDate(savedDeck.lastStudiedAt, '')
        });
        return validDecks;
    }, []);

    const metadata = source.metadata && typeof source.metadata === 'object' ? source.metadata : {};
    normalized.metadata = {
        lastBackupAt: validIsoDate(metadata.lastBackupAt, ''),
        reviewLog: Array.isArray(metadata.reviewLog)
            ? metadata.reviewLog.slice(-1000).reduce((entries, entry) => {
                if (!entry || typeof entry !== 'object') return entries;
                const reviewedAt = validIsoDate(entry.reviewedAt, '');
                const score = Number(entry.score);
                if (!reviewedAt || !Number.isInteger(score) || score < 1 || score > 4) return entries;
                entries.push({
                    reviewedAt,
                    score,
                    deckId: typeof entry.deckId === 'string' ? entry.deckId : '',
                    cardId: typeof entry.cardId === 'string' ? entry.cardId : ''
                });
                return entries;
            }, [])
            : [],
        reviewsSinceBackup: intOr(metadata.reviewsSinceBackup, 0),
        backupRecommended: metadata.backupRecommended === true,
        onboardingVersion: intOr(metadata.onboardingVersion, 0),
        dailyReviewLimit: normalizeDailyReviewLimit(metadata.dailyReviewLimit)
    };

    return normalized;
}

function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        return false;
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        // IndexedDB remains available as the recovery layer when localStorage is restricted.
    }
}

function openLibraryDatabase() {
    if (!globalThis.indexedDB) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(DATABASE_STORE)) {
                database.createObjectStore(DATABASE_STORE, { keyPath: 'key' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open recovery storage.'));
        request.onblocked = () => reject(new Error('Recovery storage is blocked by another WordNinja tab.'));
    });
}

async function readLibraryMirror() {
    const database = await openLibraryDatabase();
    if (!database) return null;

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(DATABASE_STORE, 'readonly');
        const request = transaction.objectStore(DATABASE_STORE).get(DATABASE_LIBRARY_KEY);
        request.onsuccess = () => resolve(request.result?.library || null);
        request.onerror = () => reject(request.error || new Error('Could not read recovery storage.'));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
            database.close();
            reject(transaction.error || new Error('Could not read recovery storage.'));
        };
    });
}

async function writeLibraryMirror(snapshot) {
    const database = await openLibraryDatabase();
    if (!database) return;

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(DATABASE_STORE, 'readwrite');
        transaction.objectStore(DATABASE_STORE).put({
            key: DATABASE_LIBRARY_KEY,
            savedAt: new Date().toISOString(),
            library: snapshot
        });
        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error || new Error('Could not update recovery storage.'));
        };
        transaction.onabort = () => {
            database.close();
            reject(transaction.error || new Error('Recovery storage update was cancelled.'));
        };
    });
}

function queueLibraryMirror(snapshot) {
    if (!globalThis.indexedDB) return;
    const independentCopy = JSON.parse(JSON.stringify(snapshot));
    mirrorWriteQueue = mirrorWriteQueue
        .catch(() => {})
        .then(() => writeLibraryMirror(independentCopy))
        .catch(() => {});
}

async function loadLibrary() {
    const savedLibrary = safeLocalStorageGet(STORAGE_KEY) || safeLocalStorageGet(OLD_STORAGE_KEY);
    let loaded = false;
    let workingCopyWasUnreadable = false;

    if (savedLibrary) {
        try {
            library = normalizeLibraryPayload(JSON.parse(savedLibrary));
            loaded = true;
        } catch (error) {
            workingCopyWasUnreadable = true;
        }
    }

    if (!loaded) {
        try {
            const mirroredLibrary = await readLibraryMirror();
            if (mirroredLibrary) {
                library = normalizeLibraryPayload(mirroredLibrary);
                loaded = true;
                libraryStatus.textContent = workingCopyWasUnreadable
                    ? 'Recovered your library from WordNinja’s protected browser copy.'
                    : 'Loaded your library from WordNinja’s protected browser copy.';
            }
        } catch (error) {
            // A clean library remains usable even when IndexedDB is unavailable.
        }
    }

    if (!loaded) {
        library = createEmptyLibrary();
        if (workingCopyWasUnreadable) {
            libraryStatus.textContent = 'Saved library data could not be recovered, so WordNinja started a clean library.';
        }
    }

    migrateLegacyDeck();
    saveLibrary();
}

function migrateLegacyDeck() {
    if (safeLocalStorageGet(LEGACY_MIGRATED_KEY)) return;

    try {
        const legacyCards = JSON.parse(safeLocalStorageGet(LEGACY_DECK_KEY) || '[]')
            .map(card => createCardFromImport(card))
            .filter(Boolean);

        if (legacyCards.length > 0) {
            const now = new Date().toISOString();
            library.decks.push({
                id: makeId('deck'),
                folderId: DEFAULT_FOLDER_ID,
                name: 'Recovered WordNinja Deck',
                cards: legacyCards,
                archived: false,
                archivedAt: '',
                createdAt: now,
                updatedAt: now,
                lastStudiedAt: ''
            });
        }
    } catch (error) {
        safeLocalStorageRemove(LEGACY_DECK_KEY);
    }

    safeLocalStorageSet(LEGACY_MIGRATED_KEY, 'true');
}

function saveLibrary() {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(library));
    queueLibraryMirror(library);
}

function saveSafetySnapshot(reason) {
    safeLocalStorageSet(SAFETY_SNAPSHOT_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        reason,
        library
    }));
}

function isWeakCard(card) {
    return !card.suspended && (intOr(card.lapses, 0) >= 2 || numberOr(card.ease, DEFAULT_EASE) <= 1.8);
}

function getWeakStudyItems() {
    return library.decks.filter(savedDeck => !savedDeck.archived).flatMap(savedDeck => {
        return savedDeck.cards
            .filter(isWeakCard)
            .map(card => ({ deckId: savedDeck.id, deckName: savedDeck.name, card }));
    });
}

function isSameLocalDay(value, now = new Date()) {
    const date = new Date(value);
    return !Number.isNaN(date.getTime())
        && date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
}

function getTodayReviewStats() {
    const entries = (library.metadata?.reviewLog || []).filter(entry => isSameLocalDay(entry.reviewedAt));
    const againCount = entries.filter(entry => entry.score === 1).length;
    const hardCount = entries.filter(entry => entry.score === 2).length;
    return {
        count: entries.length,
        againRate: entries.length ? Math.round((againCount / entries.length) * 100) : 0,
        hardRate: entries.length ? Math.round((hardCount / entries.length) * 100) : 0
    };
}

function recordReview(card, deckId, score) {
    library.metadata = library.metadata || createEmptyLibrary().metadata;
    library.metadata.reviewLog.push({
        reviewedAt: new Date().toISOString(),
        score,
        deckId: deckId || '',
        cardId: card.id || ''
    });
    library.metadata.reviewLog = library.metadata.reviewLog.slice(-1000);
    library.metadata.reviewsSinceBackup = intOr(library.metadata.reviewsSinceBackup, 0) + 1;
    if (library.metadata.reviewsSinceBackup >= BACKUP_REMINDER_REVIEW_COUNT) {
        library.metadata.backupRecommended = true;
    }
}

function getBackupStatus() {
    const lastBackupAt = library.metadata?.lastBackupAt || '';
    const lastBackupDate = new Date(lastBackupAt);
    const daysSinceBackup = Number.isNaN(lastBackupDate.getTime())
        ? Infinity
        : (Date.now() - lastBackupDate.getTime()) / (24 * 60 * 60 * 1000);
    return {
        lastBackupAt,
        recommended: Boolean(library.metadata?.backupRecommended) || daysSinceBackup > BACKUP_REMINDER_DAYS
    };
}

function folderName(folderId) {
    return library.folders.find(folder => folder.id === folderId)?.name || 'My Decks';
}

function findDeck(deckId) {
    return library.decks.find(savedDeck => savedDeck.id === deckId);
}

function findCard(savedDeck, cardId) {
    return savedDeck?.cards.find(card => card.id === cardId);
}

function isDue(card, now = new Date()) {
    const due = new Date(card.dueDate);
    return !Number.isNaN(due.getTime()) && due.getTime() <= now.getTime();
}

function getDueCards(savedDeck, now = new Date()) {
    if (savedDeck.archived) return [];
    return savedDeck.cards.filter(card => !card.suspended && isDue(card, now));
}

function getDueStudyItems(now = new Date()) {
    return library.decks
        .filter(savedDeck => !savedDeck.archived)
        .flatMap(savedDeck => {
            return getDueCards(savedDeck, now).map(card => ({
                deckId: savedDeck.id,
                deckName: savedDeck.name,
                card
            }));
        })
        .sort((a, b) => {
            const aDue = new Date(a.card.dueDate).getTime();
            const bDue = new Date(b.card.dueDate).getTime();
            if (aDue !== bDue) return aDue - bDue;
            return a.deckName.localeCompare(b.deckName);
        });
}

function getDailyReviewLimit() {
    return normalizeDailyReviewLimit(library.metadata?.dailyReviewLimit);
}

function getDailyStudyItems(now = new Date()) {
    const dueItems = getDueStudyItems(now);
    const limit = getDailyReviewLimit();
    return limit === 0 ? dueItems : dueItems.slice(0, limit);
}

function getDeckStats(savedDeck) {
    const now = new Date();
    const totalCards = savedDeck.cards.length;
    const suspendedCards = savedDeck.cards.filter(card => card.suspended).length;
    const activeCards = totalCards - suspendedCards;
    const knownCards = savedDeck.cards.filter(card => card.known).length;
    const dueCards = getDueCards(savedDeck, now).length;
    const dueDates = savedDeck.cards
        .filter(card => !card.suspended)
        .map(card => new Date(card.dueDate))
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

    return {
        totalCards,
        activeCards,
        suspendedCards,
        knownCards,
        dueCards,
        nextDueDate: dueDates[0] ? dueDates[0].toISOString() : '',
        lastStudiedAt: savedDeck.lastStudiedAt || ''
    };
}

function getLibraryStats() {
    const activeDecks = library.decks.filter(savedDeck => !savedDeck.archived);
    const deckStats = activeDecks.map(getDeckStats);
    const dueCards = deckStats.reduce((sum, stats) => sum + stats.dueCards, 0);
    return {
        folders: library.folders.length,
        decks: activeDecks.length,
        archivedDecks: library.decks.length - activeDecks.length,
        dueCards,
        activeCards: deckStats.reduce((sum, stats) => sum + stats.activeCards, 0),
        suspendedCards: deckStats.reduce((sum, stats) => sum + stats.suspendedCards, 0),
        weakCards: getWeakStudyItems().length
    };
}

function formatLastStudied(value) {
    if (!value) return 'Not studied yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not studied yet';
    return `Last studied ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function formatDueDate(value) {
    if (!value) return 'No due date';
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return 'No due date';

    const now = new Date();
    const msUntilDue = due.getTime() - now.getTime();
    if (msUntilDue <= 0) return 'Due now';
    if (msUntilDue < 60 * 60 * 1000) {
        return `Due in ${Math.ceil(msUntilDue / (60 * 1000))} min`;
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (dayDiff === 0) return 'Due later today';
    if (dayDiff === 1) return 'Due tomorrow';
    if (dayDiff < 7) return `Due in ${dayDiff} days`;
    return `Due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function bindEvents() {
    importInput.addEventListener('input', processInput);
    deckNameInput.addEventListener('input', updateImportButtons);
    document.querySelectorAll('input[name="importDestination"]').forEach(radio => {
        radio.addEventListener('change', updateImportDestinationUI);
    });
    existingDeckImportSelect.addEventListener('change', () => {
        updateDuplicateImportStatus();
        updateImportButtons();
    });

    document.querySelectorAll('input[name="termDelim"]').forEach(radio => {
        radio.addEventListener('change', processInput);
    });
    document.querySelectorAll('input[name="cardDelim"]').forEach(radio => {
        radio.addEventListener('change', processInput);
    });

    addFolderBtn.addEventListener('click', addFolder);
    addManualCardBtn.addEventListener('click', addManualCardToDeck);
    openGuideBtn.addEventListener('click', () => openOnboarding(false));
    installAppBtn.addEventListener('click', installWordNinja);
    clearImportBtn.addEventListener('click', clearImportWithOptionalConfirm);
    renameFolderBtn.addEventListener('click', renameSelectedFolder);
    deleteFolderBtn.addEventListener('click', deleteSelectedFolder);
    showArchivedToggle.addEventListener('change', renderLibrary);
    skipOnboardingBtn.addEventListener('click', closeOnboarding);
    backOnboardingBtn.addEventListener('click', () => changeOnboardingStep(-1));
    nextOnboardingBtn.addEventListener('click', () => {
        if (onboardingStep >= ONBOARDING_STEPS.length - 1) {
            closeOnboarding();
            return;
        }
        changeOnboardingStep(1);
    });
    newFolderInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addFolder();
        }
    });

    saveDeckBtn.addEventListener('click', saveImportedDeck);
    quickStudyBtn.addEventListener('click', startQuickStudy);
    studyTodayBtn.addEventListener('click', startStudyToday);
    dailyReviewLimitSelect.addEventListener('change', () => {
        library.metadata.dailyReviewLimit = normalizeDailyReviewLimit(dailyReviewLimitSelect.value);
        saveLibrary();
        renderLibrary();
    });
    studyWeakCardsBtn.addEventListener('click', startWeakCardsReview);
    loadDemoDeckBtn.addEventListener('click', loadDemoDeck);
    presentationGuideBtn.addEventListener('click', openPresentationGuide);
    libraryFolderFilter.addEventListener('change', renderLibrary);
    exportBackupBtn.addEventListener('click', exportBackup);
    importBackupBtn.addEventListener('click', () => backupFileInput.click());
    backupFileInput.addEventListener('change', importBackup);
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installAppBtn.classList.remove('hidden');
    });
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        installAppBtn.classList.add('hidden');
    });

    libraryList.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const deckId = button.dataset.deckId;
        if (button.dataset.action === 'study-due') {
            studySavedDeck(deckId, 'due');
        }
        if (button.dataset.action === 'review-all') {
            studySavedDeck(deckId, 'all');
        }
        if (button.dataset.action === 'learn') {
            startLearnMode(deckId);
        }
        if (button.dataset.action === 'preview') {
            studySavedDeck(deckId, 'preview');
        }
        if (button.dataset.action === 'manage-deck') {
            openDeckManager(deckId);
        }
    });

    flashcardContent.addEventListener('click', () => {
        if (suppressCardClick) {
            suppressCardClick = false;
            return;
        }
        toggleFlip();
    });
    flashcardContent.addEventListener('pointerdown', event => {
        if (activeStudyMode !== 'learn' || !isFlipped) return;
        learnSwipeStartX = event.clientX;
        learnSwipeStartY = event.clientY;
    });
    flashcardContent.addEventListener('pointerup', event => {
        if (activeStudyMode !== 'learn' || !isFlipped) return;
        const deltaX = event.clientX - learnSwipeStartX;
        const deltaY = event.clientY - learnSwipeStartY;
        if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        suppressCardClick = true;
        window.setTimeout(() => {
            suppressCardClick = false;
        }, 400);
        gradeLearnCard(deltaX > 0 ? 'know' : 'learning');
    });
    flashcardContent.addEventListener('transitionend', event => {
        const isCardFace = event.target === cardFront || event.target === cardBack;
        if (isCardFace && event.propertyName === 'transform') {
            finishFlipAnimation();
        }
    });

    gradeControls.addEventListener('click', event => {
        const button = event.target.closest('[data-score]');
        if (!button) return;
        gradeCard(Number(button.dataset.score));
    });
    learnControls.addEventListener('click', event => {
        const button = event.target.closest('[data-learn-choice]');
        if (!button) return;
        gradeLearnCard(button.dataset.learnChoice);
    });
    suspendCurrentCardBtn.addEventListener('click', suspendCurrentStudyCard);
    markKnownCurrentCardBtn.addEventListener('click', markCurrentStudyCardKnown);

    modalCancelBtn.addEventListener('click', handleModalCancel);
    modalConfirmBtn.addEventListener('click', handleModalConfirm);
    closeDeckManagerBtn.addEventListener('click', closeDeckManager);
    deckManagerFolderSelect.addEventListener('change', () => {
        if (!deckManagerDeckId) return;
        moveDeckToFolder(deckManagerDeckId, deckManagerFolderSelect.value);
        deckManagerPreviousFocus = libraryList.querySelector(`[data-action="manage-deck"][data-deck-id="${deckManagerDeckId}"]`) || deckManagerPreviousFocus;
        renderDeckManager();
    });
    manageDeckCardsBtn.addEventListener('click', () => runDeckManagerAction(openCardManager));
    renameManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(renameDeck));
    copyManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(copyDeck));
    exportManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(exportDeckText));
    reverseManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(createReverseCards));
    archiveManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(toggleDeckArchive));
    deleteManagedDeckBtn.addEventListener('click', () => runDeckManagerAction(deleteDeck));
    closeCardManagerBtn.addEventListener('click', closeCardManager);
    addManagedCardBtn.addEventListener('click', startNewManagedCard);
    studyStarredCardsBtn.addEventListener('click', startStarredPractice);
    saveManagedCardBtn.addEventListener('click', saveManagedCard);
    deleteManagedCardBtn.addEventListener('click', deleteManagedCard);
    toggleStarManagedCardBtn.addEventListener('click', toggleManagedCardStar);
    toggleSuspendManagedCardBtn.addEventListener('click', toggleManagedCardSuspension);
    markKnownManagedCardBtn.addEventListener('click', markManagedCardKnown);
    reverseManagedCardBtn.addEventListener('click', createManagedCardReverse);
    cardManagerSearch.addEventListener('input', () => {
        cardManagerSearchQuery = cardManagerSearch.value.trim().toLocaleLowerCase();
        renderCardManager();
    });
    showStarredOnlyToggle.addEventListener('change', () => {
        cardManagerStarredOnly = showStarredOnlyToggle.checked;
        renderCardManager();
    });
    cardManagerList.addEventListener('click', event => {
        const row = event.target.closest('[data-card-id]');
        if (!row) return;
        selectManagedCard(row.dataset.cardId);
    });

    window.addEventListener('keydown', event => {
        if (!onboardingModal.classList.contains('hidden')) {
            if (event.key === 'Tab') {
                trapFocus(onboardingModal, event);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                closeOnboarding();
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                changeOnboardingStep(1);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                changeOnboardingStep(-1);
            }
            return;
        }

        if (!cardManagerModal.classList.contains('hidden') && event.key === 'Escape' && appModal.classList.contains('hidden')) {
            event.preventDefault();
            closeCardManager();
            return;
        }

        if (!deckManagerModal.classList.contains('hidden') && event.key === 'Escape' && appModal.classList.contains('hidden')) {
            event.preventDefault();
            closeDeckManager();
            return;
        }

        if (!appModal.classList.contains('hidden')) {
            if (event.key === 'Tab') {
                trapFocus(appModal, event);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal();
            }
            if (event.key === 'Enter' && modalState?.submitOnEnter) {
                event.preventDefault();
                handleModalConfirm();
            }
            return;
        }

        if (!cardManagerModal.classList.contains('hidden')) {
            if (event.key === 'Tab') {
                trapFocus(cardManagerModal, event);
                return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                saveManagedCard();
            }
            return;
        }

        if (!deckManagerModal.classList.contains('hidden')) {
            if (event.key === 'Tab') {
                trapFocus(deckManagerModal, event);
            }
            return;
        }

        if (studyView.classList.contains('hidden')) return;
        if (event.repeat) return;

        const targetTag = event.target?.tagName;
        const isInteractiveTarget = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(targetTag);

        if (event.code === 'Space' && !isInteractiveTarget) {
            event.preventDefault();
            toggleFlip();
        }
        if (event.code === 'Enter' && event.target === flashcardContent) {
            event.preventDefault();
            toggleFlip();
        }

        if (isFlipped && activeStudyMode === 'learn' && ['1', '2'].includes(event.key)) {
            gradeLearnCard(event.key === '1' ? 'learning' : 'know');
        } else if (isFlipped && ['1', '2', '3', '4'].includes(event.key)) {
            gradeCard(Number(event.key));
        }
    });

    backToImport.addEventListener('click', showImportView);
}

function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]):not(.hidden), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.classList.contains('hidden'));
}

function trapFocus(container, event) {
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function openOnboarding(firstRun = false) {
    onboardingPreviousFocus = document.activeElement;
    onboardingStep = 0;
    onboardingModal.classList.remove('hidden');
    renderOnboarding();
    window.setTimeout(() => {
        (firstRun ? nextOnboardingBtn : skipOnboardingBtn).focus();
    }, 0);
}

function renderOnboarding() {
    const step = ONBOARDING_STEPS[onboardingStep];
    onboardingIcon.textContent = step.icon;
    onboardingStepLabel.textContent = `Step ${onboardingStep + 1} of ${ONBOARDING_STEPS.length}`;
    onboardingStepTitle.textContent = step.title;
    onboardingMessage.textContent = step.message;
    backOnboardingBtn.disabled = onboardingStep === 0;
    nextOnboardingBtn.textContent = onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Start Using WordNinja' : 'Next';

    onboardingDots.textContent = '';
    ONBOARDING_STEPS.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = index === onboardingStep ? 'onboarding-dot is-active' : 'onboarding-dot';
        onboardingDots.appendChild(dot);
    });
}

function changeOnboardingStep(direction) {
    const nextStep = clamp(onboardingStep + direction, 0, ONBOARDING_STEPS.length - 1);
    if (nextStep === onboardingStep) return;
    onboardingStep = nextStep;
    renderOnboarding();
    nextOnboardingBtn.focus();
}

function closeOnboarding() {
    const previousFocus = onboardingPreviousFocus;
    onboardingModal.classList.add('hidden');
    onboardingPreviousFocus = null;
    library.metadata = library.metadata || createEmptyLibrary().metadata;
    library.metadata.onboardingVersion = ONBOARDING_VERSION;
    saveLibrary();
    if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
    }
}

async function installWordNinja() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt["prompt"]();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installAppBtn.classList.add('hidden');
}

function registerPwa() {
    if (!globalThis.navigator?.serviceWorker || !['http:', 'https:'].includes(globalThis.location?.protocol)) return;
    navigator.serviceWorker.register('./service-worker.js?v=20260611-5')
        .then(registration => registration.update())
        .catch(() => {
            libraryStatus.textContent = 'Offline setup could not finish. WordNinja still works normally while connected.';
        });
}

function openModal(options) {
    modalState = {
        type: options.type || 'confirm',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        validate: options.validate,
        submitOnEnter: options.submitOnEnter !== false,
        previousFocus: document.activeElement
    };

    modalEyebrow.textContent = options.eyebrow || 'WordNinja';
    modalTitle.textContent = options.title || 'Confirm action';
    modalMessage.textContent = options.message || '';
    modalError.textContent = '';
    modalError.classList.add('hidden');
    modalConfirmBtn.textContent = options.confirmLabel || 'Save';
    modalCancelBtn.textContent = options.cancelLabel || 'Cancel';
    modalCancelBtn.classList.toggle('hidden', options.hideCancel === true);
    modalConfirmBtn.className = options.danger
        ? 'danger-button rounded-full px-5 py-2.5 text-sm font-semibold'
        : 'primary-button rounded-full px-5 py-2.5 text-sm font-semibold';

    if (modalState.type === 'input') {
        modalInput.classList.remove('hidden');
        modalInput.value = options.inputValue || '';
    } else {
        modalInput.classList.add('hidden');
        modalInput.value = '';
    }

    appModal.classList.remove('hidden');

    if (modalState.type === 'input') {
        window.setTimeout(() => {
            modalInput.focus();
            modalInput.select();
        }, 0);
    } else {
        window.setTimeout(() => modalConfirmBtn.focus(), 0);
    }
}

function closeModal() {
    const previousFocus = modalState?.previousFocus;
    appModal.classList.add('hidden');
    modalState = null;
    modalInput.value = '';
    modalError.textContent = '';
    modalError.classList.add('hidden');
    modalCancelBtn.classList.remove('hidden');
    if (previousFocus?.focus) {
        window.setTimeout(() => previousFocus.focus(), 0);
    }
}

function showModalError(message) {
    modalError.textContent = message;
    modalError.classList.remove('hidden');
}

function handleModalConfirm() {
    if (!modalState) return;

    const value = modalState.type === 'input' ? modalInput.value : undefined;
    if (typeof modalState.validate === 'function') {
        const error = modalState.validate(value);
        if (error) {
            showModalError(error);
            return;
        }
    }

    const onConfirm = modalState.onConfirm;
    closeModal();
    if (typeof onConfirm === 'function') {
        onConfirm(value);
    }
}

function handleModalCancel() {
    if (!modalState) return;
    const onCancel = modalState.onCancel;
    closeModal();
    if (typeof onCancel === 'function') onCancel();
}

function showConfirmModal(options) {
    openModal({ ...options, type: 'confirm', submitOnEnter: true });
}

function showInputModal(options) {
    openModal({ ...options, type: 'input', submitOnEnter: true });
}

function showInfoModal(options) {
    openModal({ ...options, type: 'confirm', hideCancel: true, submitOnEnter: true });
}

function openPresentationGuide() {
    showInfoModal({
        eyebrow: 'Teacher presentation',
        title: 'A five-minute WordNinja walkthrough',
        message: [
            '1. Choose Load Demo Deck to add safe sample material.',
            '2. Open Study Today and show how due cards gather across the library.',
            '3. Reveal a card, choose Good, then explain that its next review moves into the future.',
            '4. Return to the library and open Cards to show editing, suspension, known cards, and reverse cards.',
            '5. Finish with Export Backup to explain local-first privacy and data safety.'
        ].join('\n\n'),
        confirmLabel: 'Ready to Present',
        onConfirm: () => {}
    });
}

function createDemoCard(front, back, options = {}) {
    const now = new Date();
    const card = createCardFromImport({ front, back });
    card.dueDate = options.dueInDays
        ? addDays(now, options.dueInDays).toISOString()
        : now.toISOString();
    card.intervalDays = options.intervalDays ?? 0;
    card.ease = options.ease ?? DEFAULT_EASE;
    card.reviews = options.reviews ?? 0;
    card.lapses = options.lapses ?? 0;
    card.lastReviewedAt = options.reviews ? addDays(now, -Math.max(1, options.intervalDays || 1)).toISOString() : '';
    card.suspended = options.suspended === true;
    card.suspendedAt = card.suspended ? now.toISOString() : '';
    card.known = options.known === true;
    card.knownAt = card.known ? now.toISOString() : '';
    return card;
}

function loadDemoDeck() {
    const existingDemo = library.decks.find(savedDeck => savedDeck.source === DEMO_SOURCE);
    if (existingDemo) {
        showArchivedToggle.checked = existingDemo.archived;
        renderFolderControls(existingDemo.folderId);
        libraryFolderFilter.value = existingDemo.folderId;
        renderLibrary();
        libraryStatus.textContent = `"${existingDemo.name}" is already in your library.`;
        return;
    }

    showConfirmModal({
        eyebrow: 'Presentation tools',
        title: 'Load the WordNinja demo deck',
        message: 'Add a sample deck that demonstrates due cards, future reviews, weak cards, known cards, and suspension? Your existing folders, decks, and study history will not be changed.',
        confirmLabel: 'Load Demo Deck',
        onConfirm: () => {
            const now = new Date().toISOString();
            let demoFolder = library.folders.find(folder => folder.name === 'WordNinja Demo');
            if (!demoFolder) {
                demoFolder = {
                    id: makeId('folder'),
                    name: 'WordNinja Demo',
                    createdAt: now
                };
                library.folders.push(demoFolder);
            }

            const demoDeck = {
                id: makeId('deck'),
                folderId: demoFolder.id,
                name: 'How WordNinja Works',
                source: DEMO_SOURCE,
                cards: [
                    createDemoCard('What does Study Today do?', 'It gathers every card currently due across all active decks.', { reviews: 2, intervalDays: 3 }),
                    createDemoCard('What happens after choosing Good?', 'WordNinja schedules the card farther into the future using its review history.', { reviews: 4, intervalDays: 7 }),
                    createDemoCard('What is Learn Mode for?', 'First learning and focused practice without changing long-term scheduling.'),
                    createDemoCard('What makes a card appear as weak?', 'Repeated lapses or a very low ease score.', { reviews: 5, intervalDays: 2, lapses: 2, ease: 1.75 }),
                    createDemoCard('What does Preview mode change?', 'Nothing. Preview lets you browse without changing due dates or review history.', { reviews: 2, intervalDays: 7, dueInDays: 7 }),
                    createDemoCard('What does Mark Known do?', 'It keeps the card active but schedules it far into the future.', { reviews: 6, intervalDays: KNOWN_INTERVAL_DAYS, dueInDays: KNOWN_INTERVAL_DAYS, known: true }),
                    createDemoCard('What does Suspend Card do?', 'It preserves the card while keeping it out of review sessions until restored.', { suspended: true })
                ],
                archived: false,
                archivedAt: '',
                createdAt: now,
                updatedAt: now,
                lastStudiedAt: ''
            };

            library.decks.unshift(demoDeck);
            saveLibrary();
            showArchivedToggle.checked = false;
            renderFolderControls(demoFolder.id);
            libraryFolderFilter.value = demoFolder.id;
            renderLibrary();
            libraryStatus.textContent = 'Loaded the WordNinja demo deck. Use Study Today to begin the presentation.';
        }
    });
}

function addFolder() {
    const name = newFolderInput.value.trim();
    if (!name) {
        libraryStatus.textContent = 'Type a folder name first.';
        return;
    }

    const existing = library.folders.find(folder => folder.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        folderSelect.value = existing.id;
        libraryFolderFilter.value = existing.id;
        libraryStatus.textContent = `"${existing.name}" already exists, so I selected it.`;
        newFolderInput.value = '';
        renderLibrary();
        return;
    }

    const folder = {
        id: makeId('folder'),
        name,
        createdAt: new Date().toISOString()
    };

    library.folders.push(folder);
    saveLibrary();
    newFolderInput.value = '';
    renderFolderControls(folder.id);
    renderLibrary();
    libraryStatus.textContent = `Created folder "${folder.name}".`;
}

function clearImportWithOptionalConfirm() {
    if (!importInput.value.trim()) {
        clearImportInput();
        return;
    }

    showConfirmModal({
        title: 'Clear import workspace',
        message: 'Clear the pasted study list, deck name, and unsaved folder name? Saved decks, folders, and review history will stay untouched.',
        confirmLabel: 'Clear',
        onConfirm: clearImportInput
    });
}

function clearImportInput() {
    importInput.value = '';
    deckNameInput.value = '';
    newFolderInput.value = '';
    folderSelect.value = DEFAULT_FOLDER_ID;
    document.querySelector('input[name="importDestination"][value="new"]').checked = true;
    parsedCache = [];
    previewCount.textContent = '0';
    previewStatus.textContent = 'Awaiting raw text block entry.';
    renderParsedPreview();
    updateImportDestinationUI();
    updateImportButtons();
}

function renameSelectedFolder() {
    const folderId = libraryFolderFilter.value;
    if (!folderId || folderId === 'all') {
        libraryStatus.textContent = 'Choose a specific folder before renaming it.';
        return;
    }

    const folder = library.folders.find(item => item.id === folderId);
    if (!folder) return;

    showInputModal({
        title: 'Rename folder',
        message: 'Decks inside this folder will stay in the same folder. Only the folder name changes.',
        inputValue: folder.name,
        confirmLabel: 'Save',
        validate: value => {
            const nextName = value.trim();
            if (!nextName) return 'Folder name cannot be empty.';
            const duplicate = library.folders.some(item => {
                return item.id !== folder.id && item.name.toLowerCase() === nextName.toLowerCase();
            });
            if (duplicate) return 'A folder with that name already exists.';
            return '';
        },
        onConfirm: value => {
            const nextName = value.trim();
            folder.name = nextName;
            saveLibrary();
            renderFolderControls(folder.id);
            libraryFolderFilter.value = folder.id;
            renderLibrary();
            libraryStatus.textContent = `Renamed folder to "${nextName}".`;
        }
    });
}

function deleteSelectedFolder() {
    const folderId = libraryFolderFilter.value;
    if (!folderId || folderId === 'all') {
        libraryStatus.textContent = 'Choose a specific folder before deleting it.';
        return;
    }
    if (folderId === DEFAULT_FOLDER_ID) {
        libraryStatus.textContent = 'My Decks is the permanent default folder and cannot be deleted.';
        return;
    }

    const folder = library.folders.find(item => item.id === folderId);
    if (!folder) return;
    const deckCount = library.decks.filter(savedDeck => savedDeck.folderId === folderId).length;
    if (deckCount > 0) {
        libraryStatus.textContent = `Move or delete the ${deckCount} ${deckCount === 1 ? 'deck' : 'decks'} in "${folder.name}" before deleting the folder.`;
        return;
    }

    showConfirmModal({
        title: 'Delete empty folder',
        message: `Delete the empty folder "${folder.name}"? No decks or cards will be removed.`,
        confirmLabel: 'Delete Folder',
        danger: true,
        onConfirm: () => {
            saveSafetySnapshot(`Before deleting empty folder "${folder.name}"`);
            library.folders = library.folders.filter(item => item.id !== folderId);
            saveLibrary();
            renderFolderControls(DEFAULT_FOLDER_ID);
            libraryFolderFilter.value = 'all';
            renderLibrary();
            libraryStatus.textContent = `Deleted empty folder "${folder.name}".`;
        }
    });
}

function processInput() {
    const text = importInput.value.trim();
    parsedCache = [];

    if (!text) {
        previewCount.textContent = '0';
        previewStatus.textContent = 'Awaiting raw text block entry.';
        renderParsedPreview();
        updateImportButtons();
        return;
    }

    const termDelim = document.querySelector('input[name="termDelim"]:checked').value === 'tab' ? '\t' : ',';
    const cardDelimSetting = document.querySelector('input[name="cardDelim"]:checked').value;
    const cardDelim = cardDelimSetting === 'newline' ? /\r?\n/ : ';';
    const lines = text.split(cardDelim);

    parsedCache = lines.reduce((cards, line) => {
        const parts = line.split(termDelim);
        const front = parts.shift()?.trim() || '';
        const back = parts.join(termDelim).trim();

        if (front && back) {
            cards.push({ front, back });
        }

        return cards;
    }, []);

    previewCount.textContent = String(parsedCache.length);

    if (parsedCache.length > 0) {
        previewStatus.textContent = `Ready. Preview: "${parsedCache[0].front}" -> "${parsedCache[0].back}"`;
    } else {
        previewStatus.textContent = 'Could not parse cards. Try changing the separator settings.';
    }

    renderParsedPreview();
    updateDuplicateImportStatus();
    updateImportButtons();
}

function renderParsedPreview() {
    parsedPreviewList.textContent = '';

    if (parsedCache.length === 0) {
        parsedPreviewMeta.textContent = 'No cards';
        const empty = document.createElement('div');
        empty.className = 'flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-black/10 p-4 text-center text-xs leading-5 text-gray-500';
        empty.textContent = 'Paste a study list to preview cards before saving.';
        parsedPreviewList.appendChild(empty);
        return;
    }

    const visibleCards = parsedCache.slice(0, 20);
    parsedPreviewMeta.textContent = parsedCache.length > visibleCards.length
        ? `Showing first ${visibleCards.length} of ${parsedCache.length}`
        : `${parsedCache.length} ${parsedCache.length === 1 ? 'card' : 'cards'}`;

    visibleCards.forEach((card, index) => {
        const row = document.createElement('div');
        row.className = 'mb-2 grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 sm:grid-cols-2';

        const front = document.createElement('div');
        front.className = 'min-w-0';
        const frontLabel = document.createElement('p');
        frontLabel.className = 'text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-600';
        frontLabel.textContent = `Front ${index + 1}`;
        const frontText = document.createElement('p');
        frontText.className = 'mt-1 break-words text-xs leading-5 text-gray-200';
        frontText.textContent = card.front;
        front.append(frontLabel, frontText);

        const back = document.createElement('div');
        back.className = 'min-w-0 border-t border-white/[0.05] pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0';
        const backLabel = document.createElement('p');
        backLabel.className = 'text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-600';
        backLabel.textContent = 'Back';
        const backText = document.createElement('p');
        backText.className = 'mt-1 break-words text-xs leading-5 text-gray-400';
        backText.textContent = card.back;
        back.append(backLabel, backText);

        row.append(front, back);
        parsedPreviewList.appendChild(row);
    });
}

function renderManualDeckOptions() {
    const selectedDeckId = manualDeckSelect.value;
    const activeDecks = library.decks.filter(savedDeck => !savedDeck.archived);
    const options = activeDecks.map(savedDeck => ({
        value: savedDeck.id,
        label: `${savedDeck.name} / ${folderName(savedDeck.folderId)}`
    }));

    replaceOptions(manualDeckSelect, options);
    if (activeDecks.some(savedDeck => savedDeck.id === selectedDeckId)) {
        manualDeckSelect.value = selectedDeckId;
    }

    const hasDecks = options.length > 0;
    manualDeckSelect.disabled = !hasDecks;
    addManualCardBtn.disabled = !hasDecks;
    if (!hasDecks) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Save a deck first';
        manualDeckSelect.appendChild(option);
        manualCardStatus.textContent = 'Save a deck first, then you can add individual cards.';
    } else if (!manualCardStatus.textContent || manualCardStatus.textContent === 'Save a deck first, then you can add individual cards.') {
        manualCardStatus.textContent = 'Choose a deck, enter both sides, then add the card.';
    }
}

function addManualCardToDeck() {
    const savedDeck = findDeck(manualDeckSelect.value);
    if (!savedDeck) {
        manualCardStatus.textContent = 'Save a deck first, then you can add individual cards.';
        return;
    }

    const front = manualCardFront.value.trim();
    const back = manualCardBack.value.trim();
    if (!front || !back) {
        manualCardStatus.textContent = 'Front and back are required.';
        return;
    }

    const newCard = createCardFromImport({ front, back });
    savedDeck.cards.push(newCard);
    savedDeck.updatedAt = new Date().toISOString();
    saveLibrary();
    manualCardFront.value = '';
    manualCardBack.value = '';
    renderLibrary();
    manualDeckSelect.value = savedDeck.id;
    manualCardStatus.textContent = `Added "${front}" to "${savedDeck.name}". It is due immediately.`;
    manualCardFront.focus();
}

function updateImportButtons() {
    const hasCards = parsedCache.length > 0;
    const hasName = deckNameInput.value.trim().length > 0;
    const addingToExisting = getImportDestination() === 'existing';
    const hasExistingDeck = Boolean(findDeck(existingDeckImportSelect.value));
    quickStudyBtn.disabled = !hasCards;
    saveDeckBtn.disabled = !hasCards || (addingToExisting ? !hasExistingDeck : !hasName);
    saveDeckBtn.textContent = addingToExisting ? 'Add Cards to Deck' : 'Create Deck & Study';
}

function startQuickStudy() {
    if (parsedCache.length === 0) return;
    deck = parsedCache.map(card => createCardFromImport(card)).filter(Boolean);
    activeDeckId = '';
    activeDeckName = deckNameInput.value.trim() || 'Quick Study';
    activeStudyItems = deck.map(card => ({ deckId: '', deckName: activeDeckName, card }));
    activeStudyMode = 'practice';
    learnSession = null;
    startStudying();
}

function getImportDestination() {
    return document.querySelector('input[name="importDestination"]:checked')?.value || 'new';
}

function renderExistingDeckImportOptions() {
    const activeDecks = library.decks.filter(savedDeck => !savedDeck.archived);
    replaceOptions(existingDeckImportSelect, activeDecks.map(savedDeck => ({
        value: savedDeck.id,
        label: `${savedDeck.name} / ${folderName(savedDeck.folderId)}`
    })));
}

function updateImportDestinationUI() {
    const addingToExisting = getImportDestination() === 'existing';
    newDeckImportFields.classList.toggle('hidden', addingToExisting);
    existingDeckImportGroup.classList.toggle('hidden', !addingToExisting);
    renderExistingDeckImportOptions();
    updateDuplicateImportStatus();
    updateImportButtons();
}

function getImportDuplicatePlan(targetDeck = null) {
    const exactPairs = new Set((targetDeck?.cards || []).map(card => cardPairKey(getCardPrompt(card), getCardAnswer(card))));
    const fronts = new Map();
    const backs = new Map();
    (targetDeck?.cards || []).forEach(card => {
        fronts.set(normalizeCardSide(getCardPrompt(card)), card);
        backs.set(normalizeCardSide(getCardAnswer(card)), card);
    });

    const candidates = [];
    const exactDuplicates = [];
    const similarMatches = [];
    parsedCache.forEach(card => {
        const pairKey = cardPairKey(card.front, card.back);
        if (exactPairs.has(pairKey)) {
            exactDuplicates.push(card);
            return;
        }

        const similarCard = fronts.get(normalizeCardSide(card.front)) || backs.get(normalizeCardSide(card.back));
        if (similarCard) {
            similarMatches.push({ card, existingCard: similarCard });
        }

        exactPairs.add(pairKey);
        fronts.set(normalizeCardSide(card.front), card);
        backs.set(normalizeCardSide(card.back), card);
        candidates.push(card);
    });

    return { candidates, exactDuplicates, similarMatches };
}

function updateDuplicateImportStatus() {
    if (parsedCache.length === 0) {
        duplicateImportStatus.textContent = 'Exact duplicate pairs will be skipped automatically.';
        return;
    }

    const targetDeck = getImportDestination() === 'existing' ? findDeck(existingDeckImportSelect.value) : null;
    const plan = getImportDuplicatePlan(targetDeck);
    duplicateImportStatus.textContent = `${plan.candidates.length} ready / ${plan.exactDuplicates.length} exact skipped / ${plan.similarMatches.length} similar ${plan.similarMatches.length === 1 ? 'match' : 'matches'} to review`;
}

function completeBulkImport(targetDeck, plan, createsNewDeck) {
    const importedCards = plan.candidates.map(card => createCardFromImport(card)).filter(Boolean);
    if (importedCards.length === 0) {
        previewStatus.textContent = 'Nothing was imported because every parsed card was an exact duplicate.';
        return;
    }

    targetDeck.cards.push(...importedCards);
    targetDeck.updatedAt = new Date().toISOString();
    if (targetDeck.cards.length >= 50) library.metadata.backupRecommended = true;
    if (createsNewDeck) library.decks.unshift(targetDeck);
    saveLibrary();
    renderLibrary();
    previewStatus.textContent = `Imported ${importedCards.length} cards into "${targetDeck.name}". Skipped ${plan.exactDuplicates.length} exact duplicates.`;
    if (createsNewDeck) studySavedDeck(targetDeck.id, 'due');
}

function saveImportedDeck() {
    const addingToExisting = getImportDestination() === 'existing';
    const existingDeck = addingToExisting ? findDeck(existingDeckImportSelect.value) : null;
    const name = deckNameInput.value.trim();
    if (parsedCache.length === 0 || (addingToExisting ? !existingDeck : !name)) {
        updateImportButtons();
        return;
    }

    const now = new Date().toISOString();
    const savedDeck = existingDeck || {
        id: makeId('deck'),
        folderId: folderSelect.value || DEFAULT_FOLDER_ID,
        name,
        cards: [],
        archived: false,
        archivedAt: '',
        createdAt: now,
        updatedAt: now,
        lastStudiedAt: ''
    };
    const plan = getImportDuplicatePlan(existingDeck);
    if (plan.similarMatches.length > 0) {
        const similarCards = new Set(plan.similarMatches.map(match => match.card));
        const planWithoutSimilar = {
            ...plan,
            candidates: plan.candidates.filter(card => !similarCards.has(card)),
            similarMatches: []
        };
        const examples = plan.similarMatches.slice(0, 3).map(match => {
            return `"${match.card.front}" -> "${match.card.back}"`;
        }).join('\n');
        showConfirmModal({
            title: 'Review similar cards',
            message: `${plan.similarMatches.length} ${plan.similarMatches.length === 1 ? 'card looks' : 'cards look'} similar because the term or definition already appears.\n\n${examples}${plan.similarMatches.length > 3 ? '\n...' : ''}\n\nAdd these similar cards anyway? ${plan.exactDuplicates.length} exact duplicates will still be skipped.`,
            confirmLabel: 'Add Similar Cards',
            cancelLabel: 'Skip Similar',
            onCancel: () => completeBulkImport(savedDeck, planWithoutSimilar, !existingDeck),
            onConfirm: () => completeBulkImport(savedDeck, plan, !existingDeck)
        });
        return;
    }

    completeBulkImport(savedDeck, plan, !existingDeck);
}

function startStudyToday() {
    const allDueItems = getDueStudyItems();
    const dueItems = getDailyStudyItems();

    if (allDueItems.length === 0) {
        libraryStatus.textContent = 'No cards are due right now. Use Flashcard Practice or Learn Mode if you want extra practice.';
        showConfirmModal({
            title: 'All caught up',
            message: 'No cards are due today. You can still use Flashcard Practice or Learn Mode on any deck.',
            confirmLabel: 'Got it',
            cancelLabel: 'Close',
            onConfirm: () => {}
        });
        return;
    }

    deck = dueItems.map(item => item.card);
    activeStudyItems = dueItems;
    activeDeckId = '';
    activeDeckName = dueItems.length < allDueItems.length
        ? `Study Today (${dueItems.length} of ${allDueItems.length})`
        : 'Study Today';
    activeStudyMode = 'today';
    learnSession = null;
    renderLibrary();
    startStudying();
}

function startWeakCardsReview() {
    const weakItems = getWeakStudyItems();
    if (weakItems.length === 0) {
        libraryStatus.textContent = 'No weak cards right now. Cards appear here after repeated lapses or very low ease.';
        return;
    }

    deck = weakItems.map(item => item.card);
    activeStudyItems = weakItems;
    activeDeckId = '';
    activeDeckName = 'Weak Cards';
    activeStudyMode = 'weak';
    learnSession = null;
    startStudying();
}

function studySavedDeck(deckId, mode = 'due') {
    const savedDeck = library.decks.find(item => item.id === deckId);
    if (!savedDeck) return;
    if (savedDeck.archived && mode !== 'preview') {
        libraryStatus.textContent = `Restore "${savedDeck.name}" before starting a study session. Preview is still available while archived.`;
        return;
    }

    const dueCards = getDueCards(savedDeck);
    const activeCards = savedDeck.cards.filter(card => !card.suspended);
    const studyCards = mode === 'due'
        ? dueCards
        : mode === 'preview'
            ? savedDeck.cards
            : activeCards;

    if (studyCards.length === 0) {
        libraryStatus.textContent = mode === 'due'
            ? `"${savedDeck.name}" has no cards due right now. Use Flashcard Practice or Learn Mode for extra practice.`
            : mode === 'preview'
                ? `"${savedDeck.name}" has no cards yet. Open Cards to add one.`
                : `"${savedDeck.name}" has no active cards. Unsuspend a card or use Preview to view the full deck.`;
        return;
    }

    deck = studyCards;
    activeStudyItems = studyCards.map(card => ({
        deckId: savedDeck.id,
        deckName: savedDeck.name,
        card
    }));
    activeDeckId = savedDeck.id;
    activeDeckName = savedDeck.name;
    activeStudyMode = mode === 'due' ? 'due' : mode === 'preview' ? 'preview' : 'all';
    learnSession = null;
    renderLibrary();
    startStudying();
}

function startLearnMode(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;
    if (savedDeck.archived) {
        libraryStatus.textContent = `Restore "${savedDeck.name}" before using Learn Mode.`;
        return;
    }

    const activeCards = savedDeck.cards.filter(card => !card.suspended);
    if (activeCards.length === 0) {
        libraryStatus.textContent = `"${savedDeck.name}" has no active cards for Learn Mode.`;
        return;
    }

    deck = [...activeCards];
    activeStudyItems = activeCards.map(card => ({
        deckId: savedDeck.id,
        deckName: savedDeck.name,
        card
    }));
    activeDeckId = savedDeck.id;
    activeDeckName = savedDeck.name;
    activeStudyMode = 'learn';
    learnSession = {
        initialCount: activeCards.length,
        knownCount: 0,
        stillLearningCount: 0,
        totalStudied: 0
    };
    startStudying();
}

function renameDeck(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    showInputModal({
        title: 'Rename deck',
        message: 'Only the deck name changes. Cards, due dates, and review history stay untouched.',
        inputValue: savedDeck.name,
        confirmLabel: 'Save',
        validate: value => value.trim() ? '' : 'Deck name cannot be empty.',
        onConfirm: value => {
            const trimmedName = value.trim();
            savedDeck.name = trimmedName;
            savedDeck.updatedAt = new Date().toISOString();
            if (activeDeckId === deckId) {
                activeDeckName = trimmedName;
            }
            saveLibrary();
            renderLibrary();
            libraryStatus.textContent = `Renamed deck to "${trimmedName}".`;
        }
    });
}

function deleteDeck(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    showConfirmModal({
        title: 'Delete deck',
        message: `Delete "${savedDeck.name}"? This removes the deck and all review history for its cards.`,
        confirmLabel: 'Delete',
        danger: true,
        onConfirm: () => {
            saveSafetySnapshot(`Before deleting deck "${savedDeck.name}"`);
            library.decks = library.decks.filter(item => item.id !== deckId);
            if (activeDeckId === deckId) {
                activeDeckId = '';
                activeDeckName = '';
            }
            saveLibrary();
            renderFolderControls(folderSelect.value);
            renderLibrary();
            libraryStatus.textContent = `Deleted "${savedDeck.name}".`;
        }
    });
}

function toggleDeckArchive(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    const willArchive = !savedDeck.archived;
    showConfirmModal({
        title: willArchive ? 'Archive deck' : 'Restore deck',
        message: willArchive
            ? `Archive "${savedDeck.name}"? Its cards and review history will stay safe, but it will leave Study Today and daily due totals.`
            : `Restore "${savedDeck.name}"? Its existing due dates and review history will immediately become active again.`,
        confirmLabel: willArchive ? 'Archive Deck' : 'Restore Deck',
        onConfirm: () => {
            savedDeck.archived = willArchive;
            savedDeck.archivedAt = willArchive ? new Date().toISOString() : '';
            savedDeck.updatedAt = new Date().toISOString();
            saveLibrary();
            renderLibrary();
            libraryStatus.textContent = willArchive
                ? `Archived "${savedDeck.name}" without changing its cards or review history.`
                : `Restored "${savedDeck.name}". Its schedule is active again.`;
        }
    });
}

function moveDeckToFolder(deckId, folderId) {
    const savedDeck = findDeck(deckId);
    const targetFolder = library.folders.find(folder => folder.id === folderId);
    if (!savedDeck || !targetFolder) {
        renderLibrary();
        return;
    }

    if (savedDeck.folderId === folderId) return;

    savedDeck.folderId = folderId;
    savedDeck.updatedAt = new Date().toISOString();
    saveLibrary();
    renderFolderControls(folderSelect.value);
    renderLibrary();
    libraryStatus.textContent = `Moved "${savedDeck.name}" to "${targetFolder.name}".`;
}

function copyDeck(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    const now = new Date().toISOString();
    const copiedCardIds = new Map(savedDeck.cards.map(card => [card.id, makeId('card')]));
    const copiedDeck = {
        id: makeId('deck'),
        folderId: savedDeck.folderId,
        name: `${savedDeck.name} Copy`,
        cards: savedDeck.cards.map(card => ({
            ...card,
            fields: { ...(card.fields || {}) },
            id: copiedCardIds.get(card.id),
            reverseOf: copiedCardIds.get(card.reverseOf) || '',
            createdAt: now
        })),
        archived: false,
        archivedAt: '',
        createdAt: now,
        updatedAt: now,
        lastStudiedAt: ''
    };

    library.decks.unshift(copiedDeck);
    saveLibrary();
    renderFolderControls(folderSelect.value);
    renderLibrary();
    libraryStatus.textContent = `Copied "${savedDeck.name}".`;
}

function normalizeCardSide(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase();
}

function cardPairKey(front, back) {
    return `${normalizeCardSide(front)}\u0000${normalizeCardSide(back)}`;
}

function getReverseCardPlan(savedDeck) {
    const existingPairs = new Set(savedDeck.cards.map(card => {
        return cardPairKey(getCardPrompt(card), getCardAnswer(card));
    }));
    const plannedPairs = new Set();
    const candidates = [];

    savedDeck.cards.forEach(sourceCard => {
        const reverseFront = getCardAnswer(sourceCard);
        const reverseBack = getCardPrompt(sourceCard);
        const reverseKey = cardPairKey(reverseFront, reverseBack);

        if (normalizeCardSide(reverseFront) === normalizeCardSide(reverseBack)) return;
        if (existingPairs.has(reverseKey) || plannedPairs.has(reverseKey)) return;

        plannedPairs.add(reverseKey);
        candidates.push({ sourceCard, front: reverseFront, back: reverseBack });
    });

    return {
        candidates,
        skipped: savedDeck.cards.length - candidates.length
    };
}

function createReverseCard(candidate) {
    return createCardFromImport({
        front: candidate.front,
        back: candidate.back,
        type: 'basic-reverse',
        mode: 'definition-to-term',
        reverseOf: candidate.sourceCard.id
    });
}

function createReverseCards(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    if (savedDeck.cards.length === 0) {
        libraryStatus.textContent = `"${savedDeck.name}" has no cards to reverse.`;
        return;
    }

    const plan = getReverseCardPlan(savedDeck);
    if (plan.candidates.length === 0) {
        showConfirmModal({
            title: 'Reverse cards already covered',
            message: `Every card in "${savedDeck.name}" already has an opposite card, or has identical front and back text.`,
            confirmLabel: 'Got it',
            cancelLabel: 'Close',
            onConfirm: () => {}
        });
        return;
    }

    const cardWord = plan.candidates.length === 1 ? 'card' : 'cards';
    showConfirmModal({
        title: 'Create reverse cards',
        message: `Create ${plan.candidates.length} reverse ${cardWord} in "${savedDeck.name}"? Existing opposite pairs and identical front/back cards will be skipped. New reverse cards are due immediately and have independent review schedules.`,
        confirmLabel: `Create ${plan.candidates.length}`,
        onConfirm: () => {
            const reverseCards = plan.candidates.map(createReverseCard).filter(Boolean);
            savedDeck.cards.push(...reverseCards);
            savedDeck.updatedAt = new Date().toISOString();
            saveLibrary();
            renderLibrary();
            libraryStatus.textContent = `Created ${reverseCards.length} reverse ${reverseCards.length === 1 ? 'card' : 'cards'} in "${savedDeck.name}".`;
        }
    });
}

function exportDeckText(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    const lines = savedDeck.cards.map(card => {
        const front = cleanExportField(getCardPrompt(card));
        const back = cleanExportField(getCardAnswer(card));
        return `${front}\t${back}`;
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    downloadBlob(blob, `${slugifyFilename(savedDeck.name)}.tsv`);
    libraryStatus.textContent = `Exported "${savedDeck.name}" as a tab-separated text file. Multi-line fields are flattened so the file stays re-importable.`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cleanExportField(value) {
    return String(value ?? '')
        .replace(/\t/g, ' ')
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function slugifyFilename(value) {
    const readableName = String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return readableName || 'wordninja-deck';
}

function openDeckManager(deckId) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    deckManagerPreviousFocus = document.activeElement;
    deckManagerDeckId = deckId;
    deckManagerModal.classList.remove('hidden');
    renderDeckManager();
    window.setTimeout(() => manageDeckCardsBtn.focus(), 0);
}

function closeDeckManager(restoreFocus = true) {
    const previousFocus = deckManagerPreviousFocus;
    deckManagerModal.classList.add('hidden');
    deckManagerDeckId = '';
    deckManagerPreviousFocus = null;
    deckManagerStats.textContent = '';
    deckManagerFolderSelect.textContent = '';
    if (restoreFocus && previousFocus?.focus) {
        window.setTimeout(() => previousFocus.focus(), 0);
    }
}

function runDeckManagerAction(action) {
    const deckId = deckManagerDeckId;
    if (!deckId || typeof action !== 'function') return;
    const returnFocus = deckManagerPreviousFocus;
    closeDeckManager(false);
    if (returnFocus?.focus) returnFocus.focus();
    if (action === openCardManager) {
        openCardManager(deckId, returnFocus);
        return;
    }
    action(deckId);
}

function renderDeckManager() {
    const savedDeck = findDeck(deckManagerDeckId);
    if (!savedDeck) {
        closeDeckManager();
        return;
    }

    const stats = getDeckStats(savedDeck);
    deckManagerTitle.textContent = savedDeck.name;
    deckManagerTitle.title = savedDeck.name;
    deckManagerMeta.textContent = `${folderName(savedDeck.folderId)} / ${formatLastStudied(stats.lastStudiedAt)} / ${formatDueDate(stats.nextDueDate)}`;
    deckManagerStats.textContent = '';
    deckManagerStats.append(
        createStatPill('Total', String(stats.totalCards), 'text-white'),
        createStatPill('Due now', String(stats.dueCards), stats.dueCards > 0 ? 'text-sky-200' : 'text-gray-400'),
        createStatPill('Known', String(stats.knownCards), stats.knownCards > 0 ? 'text-sky-200' : 'text-gray-500'),
        createStatPill('Suspended', String(stats.suspendedCards), stats.suspendedCards > 0 ? 'text-gray-300' : 'text-gray-500')
    );

    replaceOptions(deckManagerFolderSelect, library.folders.map(folder => ({
        value: folder.id,
        label: folder.name
    })));
    deckManagerFolderSelect.value = savedDeck.folderId;
    reverseManagedDeckBtn.disabled = stats.totalCards === 0;
    archiveManagedDeckBtn.textContent = savedDeck.archived ? 'Restore Deck' : 'Archive Deck';
}

function openCardManager(deckId, previousFocus = document.activeElement) {
    const savedDeck = findDeck(deckId);
    if (!savedDeck) return;

    cardManagerPreviousFocus = previousFocus;
    cardManagerDeckId = deckId;
    cardManagerCardId = savedDeck.cards[0]?.id || 'new';
    cardManagerSearchQuery = '';
    cardManagerStarredOnly = false;
    cardManagerSearch.value = '';
    showStarredOnlyToggle.checked = false;
    cardManagerModal.classList.remove('hidden');
    renderCardManager();
    window.setTimeout(() => cardManagerSearch.focus(), 0);
}

function closeCardManager() {
    const previousFocus = cardManagerPreviousFocus;
    cardManagerModal.classList.add('hidden');
    cardManagerPreviousFocus = null;
    cardManagerDeckId = '';
    cardManagerCardId = '';
    cardManagerSearchQuery = '';
    cardManagerStarredOnly = false;
    cardManagerSearch.value = '';
    showStarredOnlyToggle.checked = false;
    cardEditFront.value = '';
    cardEditBack.value = '';
    cardManagerStatus.textContent = '';
    if (previousFocus?.focus) {
        window.setTimeout(() => previousFocus.focus(), 0);
    }
}

function startNewManagedCard() {
    cardManagerCardId = 'new';
    cardManagerStatus.textContent = '';
    renderCardManager();
    window.setTimeout(() => cardEditFront.focus(), 0);
}

function selectManagedCard(cardId) {
    cardManagerCardId = cardId;
    cardManagerStatus.textContent = '';
    renderCardManager();
}

function renderCardManager() {
    const savedDeck = findDeck(cardManagerDeckId);
    if (!savedDeck) {
        closeCardManager();
        return;
    }

    if (cardManagerCardId !== 'new' && !findCard(savedDeck, cardManagerCardId)) {
        cardManagerCardId = savedDeck.cards[0]?.id || 'new';
    }

    cardManagerTitle.textContent = 'Manage Cards';
    cardManagerMeta.textContent = `${savedDeck.name} / ${folderName(savedDeck.folderId)}`;
    const stats = getDeckStats(savedDeck);
    const starredCards = savedDeck.cards.filter(card => card.starred);
    const activeStarredCards = starredCards.filter(card => !card.suspended);
    cardManagerCount.textContent = `${stats.totalCards} total / ${starredCards.length} starred / ${stats.suspendedCards} suspended`;
    studyStarredCardsBtn.disabled = savedDeck.archived || activeStarredCards.length === 0;
    studyStarredCardsBtn.textContent = activeStarredCards.length > 0 ? `Study Starred (${activeStarredCards.length})` : 'No Starred Cards';
    cardManagerList.textContent = '';

    const visibleCards = savedDeck.cards.filter(card => {
        if (cardManagerStarredOnly && !card.starred) return false;
        if (!cardManagerSearchQuery) return true;
        return `${getCardPrompt(card)} ${getCardAnswer(card)}`.toLocaleLowerCase().includes(cardManagerSearchQuery);
    });

    if (visibleCards.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'flex min-h-[14rem] items-center justify-center rounded-[1.25rem] border border-dashed border-white/[0.09] bg-white/[0.025] p-5 text-center text-sm leading-6 text-gray-500';
        empty.textContent = savedDeck.cards.length === 0
            ? 'This deck has no cards yet. Add one manually to start studying.'
            : cardManagerStarredOnly
                ? 'No starred cards match this view. Select a card and use Star Card.'
                : 'No cards match this search.';
        cardManagerList.appendChild(empty);
    } else {
        visibleCards.forEach(card => {
            const index = savedDeck.cards.indexOf(card);
            const row = document.createElement('button');
            row.type = 'button';
            row.dataset.cardId = card.id;
            row.className = `card-row mb-2 w-full rounded-2xl p-3 text-left ${card.id === cardManagerCardId ? 'is-selected' : ''} ${card.starred ? 'is-starred' : ''}`;

            const top = document.createElement('div');
            top.className = 'flex items-center justify-between gap-3';

            const title = document.createElement('p');
            title.className = 'truncate text-sm font-medium text-white';
            title.textContent = `${card.starred ? '★ ' : ''}${index + 1}. ${getCardPrompt(card)}`;

            const due = document.createElement('span');
            due.className = card.suspended
                ? 'shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400'
                : card.known
                    ? 'shrink-0 rounded-full border border-sky-300/10 bg-sky-300/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-200'
                    : 'shrink-0 text-[11px] text-gray-500';
            due.textContent = card.suspended
                ? 'Suspended'
                : card.known
                    ? 'Known'
                    : card.reverseOf
                        ? `Reverse / ${formatDueDate(card.dueDate)}`
                        : formatDueDate(card.dueDate);

            const answer = document.createElement('p');
            answer.className = 'mt-1 line-clamp-2 text-xs leading-5 text-gray-500';
            answer.textContent = getCardAnswer(card);

            const flags = document.createElement('p');
            flags.className = 'mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600';
            const cardStates = [];
            if (card.starred) cardStates.push('Starred');
            if (card.suspended) cardStates.push('Suspended');
            if (card.known) cardStates.push('Known');
            if (isWeakCard(card)) cardStates.push('Weak');
            if (card.reverseOf) cardStates.push('Reverse');
            flags.textContent = cardStates.length ? cardStates.join(' / ') : 'Active';

            top.append(title, due);
            row.append(top, answer, flags);
            cardManagerList.appendChild(row);
        });
    }

    const selectedCard = cardManagerCardId === 'new' ? null : findCard(savedDeck, cardManagerCardId);
    cardEditorTitle.textContent = selectedCard ? 'Edit card' : 'Add new card';
    cardEditFront.value = selectedCard ? getCardPrompt(selectedCard) : '';
    cardEditBack.value = selectedCard ? getCardAnswer(selectedCard) : '';
    saveManagedCardBtn.textContent = selectedCard ? 'Save Card' : 'Add Card';
    deleteManagedCardBtn.disabled = !selectedCard;
    toggleSuspendManagedCardBtn.disabled = !selectedCard;
    toggleStarManagedCardBtn.disabled = !selectedCard;
    markKnownManagedCardBtn.disabled = !selectedCard || selectedCard.known;
    reverseManagedCardBtn.disabled = !selectedCard;
    toggleSuspendManagedCardBtn.textContent = selectedCard?.suspended ? 'Unsuspend' : 'Suspend';
    toggleStarManagedCardBtn.textContent = selectedCard?.starred ? 'Unstar Card' : 'Star Card';
    markKnownManagedCardBtn.textContent = selectedCard?.known ? 'Known' : 'Mark Known';

    if (!cardManagerStatus.textContent) {
        cardManagerStatus.textContent = selectedCard
            ? selectedCard.suspended
                ? 'Suspended cards stay in the deck but are excluded from Spaced Review, Study Today, Flashcard Practice, and Learn Mode.'
                : selectedCard.known
                    ? `Known cards remain active and are scheduled about ${KNOWN_INTERVAL_DAYS} days ahead.`
                    : selectedCard.reverseOf
                        ? 'This reverse card has its own independent review schedule.'
                    : 'Editing keeps this card’s review schedule intact.'
            : 'New cards are due immediately.';
    }
}

function toggleManagedCardStar() {
    const savedDeck = findDeck(cardManagerDeckId);
    const card = findCard(savedDeck, cardManagerCardId);
    if (!savedDeck || !card) return;

    card.starred = !card.starred;
    saveCardStatusChange(savedDeck);
    cardManagerStatus.textContent = card.starred
        ? 'Starred card. Use Study Starred for a focused practice session.'
        : 'Removed card from starred practice.';
    renderCardManager();
}

function startStarredPractice() {
    const savedDeck = findDeck(cardManagerDeckId);
    if (!savedDeck || savedDeck.archived) return;

    const starredCards = savedDeck.cards.filter(card => card.starred && !card.suspended);
    if (starredCards.length === 0) {
        cardManagerStatus.textContent = 'Star at least one active card before starting starred practice.';
        return;
    }

    deck = starredCards;
    activeStudyItems = starredCards.map(card => ({
        deckId: savedDeck.id,
        deckName: savedDeck.name,
        card
    }));
    activeDeckId = savedDeck.id;
    activeDeckName = `${savedDeck.name} / Starred`;
    activeStudyMode = 'starred';
    learnSession = null;
    closeCardManager();
    startStudying();
}

function saveManagedCard() {
    const savedDeck = findDeck(cardManagerDeckId);
    if (!savedDeck) return;

    const front = cardEditFront.value.trim();
    const back = cardEditBack.value.trim();
    if (!front || !back) {
        cardManagerStatus.textContent = 'Front and back are both required.';
        return;
    }

    const now = new Date().toISOString();
    if (cardManagerCardId === 'new') {
        const newCard = createCardFromImport({ front, back });
        savedDeck.cards.push(newCard);
        savedDeck.updatedAt = now;
        cardManagerCardId = newCard.id;
        cardManagerStatus.textContent = 'Added card. It is due immediately.';
    } else {
        const card = findCard(savedDeck, cardManagerCardId);
        if (!card) return;

        card.front = front;
        card.back = back;
        card.fields = {
            ...(card.fields || {}),
            term: front,
            definition: back
        };
        savedDeck.updatedAt = now;
        cardManagerStatus.textContent = 'Saved card without resetting its review schedule.';
    }

    saveLibrary();
    renderLibrary();
    renderCardManager();
}

function setCardSuspended(card, suspended) {
    const now = new Date().toISOString();
    card.suspended = suspended;
    card.suspendedAt = suspended ? now : '';
}

function setCardKnown(card) {
    const now = new Date();
    card.known = true;
    card.knownAt = now.toISOString();
    card.suspended = false;
    card.suspendedAt = '';
    card.intervalDays = Math.max(numberOr(card.intervalDays, 0), KNOWN_INTERVAL_DAYS);
    card.dueDate = addDays(now, KNOWN_INTERVAL_DAYS).toISOString();
}

function saveCardStatusChange(savedDeck, studied = false) {
    const now = new Date().toISOString();
    savedDeck.updatedAt = now;
    if (studied) savedDeck.lastStudiedAt = now;
    saveLibrary();
    renderLibrary();
}

function toggleManagedCardSuspension() {
    const savedDeck = findDeck(cardManagerDeckId);
    const card = findCard(savedDeck, cardManagerCardId);
    if (!savedDeck || !card) return;

    setCardSuspended(card, !card.suspended);
    saveCardStatusChange(savedDeck);
    cardManagerStatus.textContent = card.suspended
        ? 'Suspended card. It will stay out of due and review sessions until you unsuspend it.'
        : 'Unsuspended card. Its existing due date and review history were preserved.';
    renderCardManager();
}

function markManagedCardKnown() {
    const savedDeck = findDeck(cardManagerDeckId);
    const card = findCard(savedDeck, cardManagerCardId);
    if (!savedDeck || !card || card.known) return;

    showConfirmModal({
        title: 'Mark card as known',
        message: `Mark "${getCardPrompt(card)}" as known? It will remain active but will not be due again for about ${KNOWN_INTERVAL_DAYS} days.`,
        confirmLabel: 'Mark Known',
        onConfirm: () => {
            setCardKnown(card);
            saveCardStatusChange(savedDeck);
            cardManagerStatus.textContent = `Marked known and scheduled about ${KNOWN_INTERVAL_DAYS} days ahead.`;
            renderCardManager();
        }
    });
}

function createManagedCardReverse() {
    const savedDeck = findDeck(cardManagerDeckId);
    const card = findCard(savedDeck, cardManagerCardId);
    if (!savedDeck || !card) return;

    const reverseKey = cardPairKey(getCardAnswer(card), getCardPrompt(card));
    const duplicate = savedDeck.cards.some(item => {
        return item.id !== card.id && cardPairKey(getCardPrompt(item), getCardAnswer(item)) === reverseKey;
    });
    if (duplicate || normalizeCardSide(getCardPrompt(card)) === normalizeCardSide(getCardAnswer(card))) {
        cardManagerStatus.textContent = 'This card’s reverse pair already exists or both sides are identical.';
        return;
    }

    showConfirmModal({
        title: 'Create reverse card',
        message: `Create a reverse of "${getCardPrompt(card)}"? The new card will be due immediately with its own review schedule.`,
        confirmLabel: 'Create Reverse',
        onConfirm: () => {
            const reverseCard = createReverseCard({
                sourceCard: card,
                front: getCardAnswer(card),
                back: getCardPrompt(card)
            });
            savedDeck.cards.push(reverseCard);
            savedDeck.updatedAt = new Date().toISOString();
            saveLibrary();
            renderLibrary();
            cardManagerCardId = reverseCard.id;
            cardManagerStatus.textContent = 'Created reverse card with an independent review schedule.';
            renderCardManager();
        }
    });
}

function deleteManagedCard() {
    const savedDeck = findDeck(cardManagerDeckId);
    const card = findCard(savedDeck, cardManagerCardId);
    if (!savedDeck || !card) return;

    showConfirmModal({
        title: 'Delete card',
        message: `Delete "${getCardPrompt(card)}"? This removes only this card from the deck.`,
        confirmLabel: 'Delete Card',
        danger: true,
        onConfirm: () => {
            const index = savedDeck.cards.findIndex(item => item.id === card.id);
            saveSafetySnapshot(`Before deleting card "${getCardPrompt(card)}"`);
            savedDeck.cards = savedDeck.cards.filter(item => item.id !== card.id);
            savedDeck.updatedAt = new Date().toISOString();
            cardManagerCardId = savedDeck.cards[index]?.id || savedDeck.cards[index - 1]?.id || 'new';
            cardManagerStatus.textContent = 'Deleted card.';
            saveLibrary();
            renderLibrary();
            renderCardManager();
        }
    });
}

function exportBackup() {
    library.metadata = library.metadata || createEmptyLibrary().metadata;
    library.metadata.lastBackupAt = new Date().toISOString();
    library.metadata.reviewsSinceBackup = 0;
    library.metadata.backupRecommended = false;
    saveLibrary();
    const payload = {
        app: 'WordNinja',
        version: 2,
        exportedAt: new Date().toISOString(),
        library
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `wordninja-backup-${dateStamp}.json`);
    renderLibrary();
    libraryStatus.textContent = 'Backup exported as a JSON file.';
}

function importBackup() {
    const file = backupFileInput.files && backupFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = normalizeLibraryPayload(JSON.parse(String(reader.result || '')));
            const deckCount = imported.decks.length;
            const folderCount = imported.folders.length;

            showConfirmModal({
                title: 'Import backup',
                message: `Replace your current WordNinja library with this backup? It contains ${folderCount} folders and ${deckCount} decks.`,
                confirmLabel: 'Import Backup',
                danger: true,
                onConfirm: () => {
                    saveSafetySnapshot('Before importing replacement backup');
                    library = imported;
                    activeDeckId = '';
                    activeDeckName = '';
                    deck = [];
                    saveLibrary();
                    renderFolderControls(DEFAULT_FOLDER_ID);
                    showImportView();
                    processInput();
                    libraryStatus.textContent = 'Backup imported successfully.';
                }
            });
        } catch (error) {
            libraryStatus.textContent = 'That file is not a valid WordNinja backup. Your current library was not changed.';
        } finally {
            backupFileInput.value = '';
        }
    };
    reader.onerror = () => {
        libraryStatus.textContent = 'WordNinja could not read that backup file.';
        backupFileInput.value = '';
    };
    reader.readAsText(file);
}

function renderFolderControls(selectedFolderId = folderSelect.value || DEFAULT_FOLDER_ID) {
    replaceOptions(folderSelect, library.folders.map(folder => ({
        value: folder.id,
        label: folder.name
    })));

    const filterOptions = [{ value: 'all', label: 'All folders' }].concat(library.folders.map(folder => ({
        value: folder.id,
        label: folder.name
    })));
    replaceOptions(libraryFolderFilter, filterOptions);
    renderExistingDeckImportOptions();

    folderSelect.value = library.folders.some(folder => folder.id === selectedFolderId) ? selectedFolderId : DEFAULT_FOLDER_ID;

    if (!filterOptions.some(option => option.value === libraryFolderFilter.value)) {
        libraryFolderFilter.value = 'all';
    }
}

function replaceOptions(select, options) {
    const currentValue = select.value;
    select.textContent = '';
    options.forEach(option => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
    });

    if (options.some(option => option.value === currentValue)) {
        select.value = currentValue;
    }
}

function renderLibrary() {
    const selectedFolderId = libraryFolderFilter.value || 'all';
    const showArchived = showArchivedToggle.checked;
    const visibleDecks = library.decks
        .filter(savedDeck => (showArchived || !savedDeck.archived) && (selectedFolderId === 'all' || savedDeck.folderId === selectedFolderId))
        .sort((a, b) => {
            if (a.archived !== b.archived) return a.archived ? 1 : -1;
            const aDue = getDeckStats(a).dueCards;
            const bDue = getDeckStats(b).dueCards;
            if (aDue !== bDue) return bDue - aDue;
            const aDate = new Date(a.updatedAt || a.createdAt).getTime();
            const bDate = new Date(b.updatedAt || b.createdAt).getTime();
            return bDate - aDate;
        });

    libraryList.textContent = '';

    if (visibleDecks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'flex flex-1 items-center justify-center rounded-[1.5rem] border border-dashed border-white/[0.09] bg-white/[0.025] p-6 text-center text-sm leading-6 text-gray-500';
        empty.textContent = library.decks.length === 0
            ? 'No saved decks yet. Import a study list, add cards manually, or use Load Demo Deck for a quick walkthrough.'
            : showArchived
                ? selectedFolderId === 'all' ? 'No decks match this view.' : `No decks in "${folderName(selectedFolderId)}" yet.`
                : 'No active decks match this view. Turn on Show archived decks to see archived material.';
        libraryList.appendChild(empty);
    } else {
        visibleDecks.forEach(savedDeck => {
            libraryList.appendChild(createDeckRow(savedDeck));
        });
    }

    const stats = getLibraryStats();
    const todayStats = getTodayReviewStats();
    const backupStatus = getBackupStatus();
    const dailyReviewLimit = getDailyReviewLimit();
    const dailySessionCount = dailyReviewLimit === 0
        ? stats.dueCards
        : Math.min(stats.dueCards, dailyReviewLimit);
    folderStat.textContent = String(stats.folders);
    deckStat.textContent = String(stats.decks);
    dueStat.textContent = String(stats.dueCards);
    studyTodayCount.textContent = String(dailySessionCount);
    studyTodayCountLabel.textContent = dailySessionCount < stats.dueCards ? `of ${stats.dueCards} due` : 'due';
    dailyReviewLimitSelect.value = String(dailyReviewLimit);
    studyTodayLimitText.textContent = dailyReviewLimit === 0
        ? 'Review every due card'
        : `Up to ${dailyReviewLimit} oldest due cards`;
    reviewedTodayStat.textContent = String(todayStats.count);
    activeCardStat.textContent = String(stats.activeCards);
    weakCardStat.textContent = String(stats.weakCards);
    suspendedCardStat.textContent = String(stats.suspendedCards);
    studyWeakCardsBtn.disabled = stats.weakCards === 0;
    studyWeakCardsBtn.textContent = stats.weakCards > 0 ? `Review Weak Cards (${stats.weakCards})` : 'No Weak Cards';
    lastBackupStat.textContent = backupStatus.lastBackupAt
        ? `Last backup ${new Date(backupStatus.lastBackupAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'No backup exported yet';
    reviewQualityStat.textContent = todayStats.count
        ? `Today: ${todayStats.againRate}% Again / ${todayStats.hardRate}% Hard`
        : 'No reviews recorded today';
    backupReminderBadge.classList.toggle('hidden', !backupStatus.recommended);
    showArchivedLabel.textContent = stats.archivedDecks > 0
        ? `Show archived decks (${stats.archivedDecks})`
        : 'Show archived decks';
    const selectedFolder = library.folders.find(folder => folder.id === selectedFolderId);
    const selectedFolderDeckCount = selectedFolder
        ? library.decks.filter(savedDeck => savedDeck.folderId === selectedFolder.id).length
        : 0;
    renameFolderBtn.disabled = !selectedFolder;
    deleteFolderBtn.disabled = !selectedFolder || selectedFolder.id === DEFAULT_FOLDER_ID || selectedFolderDeckCount > 0;
    studyTodayBtn.textContent = stats.dueCards > 0
        ? dailySessionCount < stats.dueCards
            ? `Study Next ${dailySessionCount}`
            : 'Study Today'
        : 'All Caught Up';
    studyTodayBtn.className = stats.dueCards > 0
        ? 'primary-button mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold'
        : 'glass-button mt-4 w-full rounded-full border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-gray-300';
    librarySummary.textContent = `${stats.folders} ${stats.folders === 1 ? 'folder' : 'folders'} / ${stats.decks} active ${stats.decks === 1 ? 'deck' : 'decks'} / ${stats.dueCards} due`;
    libraryStatus.textContent = stats.decks === 0
        ? 'Your library is ready. Import cards or load the safe demo deck to begin.'
        : 'Choose Spaced Review for scheduling, or Flashcard Practice and Learn Mode for schedule-free studying.';
    renderExistingDeckImportOptions();
    updateDuplicateImportStatus();
    updateImportButtons();
    renderManualDeckOptions();
}

function createDeckRow(savedDeck) {
    const stats = getDeckStats(savedDeck);
    const row = document.createElement('article');
    row.className = savedDeck.archived
        ? 'deck-row is-archived rounded-[1.35rem] border border-white/[0.07] bg-white/[0.04] p-4'
        : 'deck-row rounded-[1.35rem] border border-white/[0.07] bg-white/[0.04] p-4';

    const topLine = document.createElement('div');
    topLine.className = 'flex items-start justify-between gap-3';

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0';

    const titleLine = document.createElement('div');
    titleLine.className = 'flex min-w-0 items-center gap-2';

    const title = document.createElement('h3');
    title.className = 'min-w-0 flex-1 truncate font-medium text-white';
    title.textContent = savedDeck.name;
    title.title = savedDeck.name;
    titleLine.appendChild(title);

    if (savedDeck.archived) {
        const badge = document.createElement('span');
        badge.className = 'shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400';
        badge.textContent = 'Archived';
        titleLine.appendChild(badge);
    }

    const meta = document.createElement('p');
    meta.className = 'mt-1 text-xs text-gray-500';
    meta.textContent = savedDeck.archived
        ? `${folderName(savedDeck.folderId)} / Archived / ${formatLastStudied(stats.lastStudiedAt)}`
        : `${folderName(savedDeck.folderId)} / ${formatLastStudied(stats.lastStudiedAt)} / ${formatDueDate(stats.nextDueDate)}`;

    textWrap.append(titleLine, meta);

    const icon = document.createElement('span');
    icon.className = savedDeck.archived
        ? 'material-symbols-rounded mt-0.5 text-[19px] text-gray-600'
        : stats.dueCards > 0
        ? 'material-symbols-rounded gemini-sparkle mt-0.5 text-[19px]'
        : 'material-symbols-rounded mt-0.5 text-[19px] text-gray-600';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = savedDeck.archived ? '□' : stats.dueCards > 0 ? '◆' : '✓';

    topLine.append(textWrap, icon);

    const statGrid = document.createElement('div');
    statGrid.className = 'mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5';
    statGrid.append(
        createStatPill('Total', String(stats.totalCards), 'text-white'),
        createStatPill('Active', String(stats.activeCards), 'text-gray-200'),
        createStatPill('Due now', String(stats.dueCards), stats.dueCards > 0 ? 'text-sky-200' : 'text-gray-400'),
        createStatPill('Suspended', String(stats.suspendedCards), stats.suspendedCards > 0 ? 'text-gray-300' : 'text-gray-500'),
        createStatPill('Known', String(stats.knownCards), stats.knownCards > 0 ? 'text-sky-200' : 'text-gray-500')
    );

    const studyActions = document.createElement('div');
    studyActions.className = 'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2';

    const studyButton = document.createElement('button');
    studyButton.type = 'button';
    studyButton.dataset.action = 'study-due';
    studyButton.dataset.deckId = savedDeck.id;
    studyButton.disabled = savedDeck.archived || stats.dueCards === 0;
    studyButton.className = 'primary-button rounded-full px-4 py-2 text-sm font-semibold';
    setStudyActionButtonContent(
        studyButton,
        savedDeck.archived ? 'Archived' : stats.dueCards > 0 ? `Spaced Review (${stats.dueCards})` : 'Nothing Due',
        savedDeck.archived ? 'Restore this deck to study' : stats.dueCards > 0 ? 'Scheduled review with repeats' : 'No scheduled cards right now'
    );

    const reviewButton = document.createElement('button');
    reviewButton.type = 'button';
    reviewButton.dataset.action = 'review-all';
    reviewButton.dataset.deckId = savedDeck.id;
    reviewButton.disabled = savedDeck.archived || stats.activeCards === 0;
    reviewButton.className = 'glass-button rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-gray-200';
    setStudyActionButtonContent(
        reviewButton,
        savedDeck.archived ? 'Restore to Practice' : stats.activeCards > 0 ? 'Flashcard Practice' : 'No Active Cards',
        savedDeck.archived ? 'Restore this deck first' : 'Full deck, no schedule changes'
    );

    const learnButton = document.createElement('button');
    learnButton.type = 'button';
    learnButton.dataset.action = 'learn';
    learnButton.dataset.deckId = savedDeck.id;
    learnButton.disabled = savedDeck.archived || stats.activeCards === 0;
    learnButton.className = 'glass-button rounded-full border border-sky-300/10 bg-sky-300/[0.03] px-4 py-2 text-sm font-medium text-sky-100';
    setStudyActionButtonContent(learnButton, 'Learn Mode', 'Repeat until every card is known');

    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.dataset.action = 'preview';
    previewButton.dataset.deckId = savedDeck.id;
    previewButton.disabled = stats.totalCards === 0;
    previewButton.className = 'glass-button rounded-full border border-sky-300/10 bg-sky-300/[0.03] px-4 py-2 text-sm font-medium text-sky-100';
    setStudyActionButtonContent(previewButton, 'Preview', 'Browse without recording answers');

    const manageButton = document.createElement('button');
    manageButton.type = 'button';
    manageButton.dataset.action = 'manage-deck';
    manageButton.dataset.deckId = savedDeck.id;
    manageButton.className = 'glass-button mt-3 w-full rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-gray-300 hover:text-white';
    manageButton.textContent = 'Manage';
    manageButton.setAttribute('aria-label', `Manage ${savedDeck.name}`);

    studyActions.append(studyButton, learnButton, reviewButton, previewButton);
    row.append(topLine, statGrid, studyActions, manageButton);
    return row;
}

function setStudyActionButtonContent(button, title, subtitle) {
    button.textContent = '';
    button.classList.add('flex', 'min-w-0', 'flex-col', 'items-center', 'justify-center', 'leading-tight');

    const titleEl = document.createElement('span');
    titleEl.className = 'block max-w-full truncate';
    titleEl.textContent = title;

    const subtitleEl = document.createElement('span');
    subtitleEl.className = 'mt-1 block max-w-full truncate text-[9px] font-medium opacity-55';
    subtitleEl.textContent = subtitle;

    button.append(titleEl, subtitleEl);
}

function createStatPill(label, value, valueClass) {
    const pill = document.createElement('div');
    pill.className = 'rounded-2xl border border-white/[0.06] bg-white/[0.035] px-2 py-2';

    const labelEl = document.createElement('p');
    labelEl.className = 'text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500';
    labelEl.textContent = label;

    const valueEl = document.createElement('p');
    valueEl.className = `mt-1 truncate text-xs font-semibold ${valueClass}`;
    valueEl.textContent = value;

    pill.append(labelEl, valueEl);
    return pill;
}

function startStudying() {
    if (deck.length === 0) return;

    currentIndex = 0;
    resetCardFace();
    appHeader.classList.add('hidden');
    importView.classList.add('hidden');
    studyView.classList.remove('hidden');
    renderCard();
    window.setTimeout(() => window.scrollTo(0, 0), 0);
}

function showImportView() {
    resetCardFace();
    studyView.classList.add('hidden');
    importView.classList.remove('hidden');
    appHeader.classList.remove('hidden');
    learnSession = null;
    renderLibrary();
    window.setTimeout(() => window.scrollTo(0, 0), 0);
}

function getCardPrompt(card) {
    return card.front || card.fields?.term || '';
}

function getCardAnswer(card) {
    return card.back || card.fields?.definition || '';
}

function renderCard() {
    if (!deck[currentIndex]) return;

    resetCardFace();

    activeDeckTitle.textContent = activeDeckName || 'Quick Study';
    studyModeLabel.textContent = activeStudyMode === 'due'
        ? 'Spaced Review'
        : activeStudyMode === 'all'
            ? 'Flashcard Practice'
            : activeStudyMode === 'starred'
                ? 'Starred Practice'
            : activeStudyMode === 'preview'
                ? 'Preview'
                : activeStudyMode === 'today'
                    ? "Today's Review"
                    : activeStudyMode === 'learn'
                        ? 'Learn Mode'
                        : activeStudyMode === 'weak'
                            ? 'Weak Cards'
                    : 'Quick Practice';
    cardProgress.textContent = activeStudyMode === 'learn'
        ? `${deck.length} remaining`
        : `${currentIndex + 1} / ${deck.length}`;
    cardFront.textContent = getCardPrompt(deck[currentIndex]);
    cardBack.textContent = getCardAnswer(deck[currentIndex]);

    const isPracticeMode = ['preview', 'all', 'practice', 'starred'].includes(activeStudyMode);
    gradeControls.classList.toggle('is-next-mode', isPracticeMode);

    if (isPracticeMode) {
        gradeControls.querySelectorAll('[data-score]').forEach((button, index) => {
            button.classList.toggle('hidden', index > 0);
            button.textContent = activeStudyMode === 'preview' ? 'Next Preview Card' : 'Next Practice Card';
            button.dataset.previewLabel = 'true';
        });
        hintText.textContent = activeStudyMode === 'preview'
            ? 'Preview mode does not change due dates or review history. Flip the card, then choose Next.'
            : 'Practice mode does not change due dates or review history. Flip the card, then choose Next.';
    } else if (activeStudyMode === 'learn') {
        gradeControls.querySelectorAll('[data-score]').forEach(button => button.classList.remove('hidden'));
        hintText.innerHTML = 'Flip, then choose <span class="text-amber-200">Still Learning</span> or <span class="text-sky-200">Know</span>. Shortcuts: 1 / 2. Swipe left / right.';
    } else {
        const labels = ['Again', 'Hard', 'Good', 'Easy'];
        gradeControls.querySelectorAll('[data-score]').forEach((button, index) => {
            button.classList.remove('hidden');
            setGradeButtonContent(button, labels[index], formatReviewInterval(getSchedulePreview(deck[currentIndex], index + 1).intervalDays));
            delete button.dataset.previewLabel;
        });
        hintText.innerHTML = DEFAULT_HINT_HTML;
    }
}

function resetCardFace() {
    isFlipped = false;
    isFlipAnimating = false;
    suppressCardClick = false;
    clearTimeout(flipAnimationTimer);
    flipAnimationTimer = 0;

    flashcardContent.classList.add('is-resetting');
    flashcardContent.classList.remove('is-flipped');
    flashcardContent.setAttribute('aria-pressed', 'false');
    flashcardContent.setAttribute('aria-label', 'Flashcard. Press Space or Enter to reveal the answer.');
    gradeControls.classList.add('hidden');
    learnControls.classList.add('hidden');
    studyCardActions.classList.add('hidden');
    hintText.classList.remove('hidden');

    window.setTimeout(() => flashcardContent.classList.remove('is-resetting'), 0);
}

function setGradeButtonContent(button, label, interval) {
    button.textContent = '';

    const labelEl = document.createElement('span');
    labelEl.className = 'grade-label';
    labelEl.textContent = label;

    const intervalEl = document.createElement('span');
    intervalEl.className = 'grade-interval';
    intervalEl.textContent = interval;

    button.append(labelEl, intervalEl);
}

function toggleFlip() {
    if (deck.length === 0 || isFlipAnimating) return;

    isFlipped = !isFlipped;
    isFlipAnimating = true;
    clearTimeout(flipAnimationTimer);
    flipAnimationTimer = window.setTimeout(finishFlipAnimation, FLIP_ANIMATION_MS);

    flashcardContent.classList.toggle('is-flipped', isFlipped);
    flashcardContent.setAttribute('aria-pressed', String(isFlipped));
    flashcardContent.setAttribute('aria-label', isFlipped
        ? 'Flashcard answer revealed.'
        : 'Flashcard. Press Space or Enter to reveal the answer.');

    if (isFlipped) {
        gradeControls.classList.add('hidden');
        learnControls.classList.add('hidden');
        studyCardActions.classList.add('hidden');
        hintText.classList.add('hidden');
    } else {
        gradeControls.classList.add('hidden');
        learnControls.classList.add('hidden');
        studyCardActions.classList.add('hidden');
        hintText.classList.remove('hidden');
    }
}

function finishFlipAnimation() {
    isFlipAnimating = false;
    clearTimeout(flipAnimationTimer);
    flipAnimationTimer = 0;

    if (isFlipped) {
        if (activeStudyMode === 'learn') {
            learnControls.classList.remove('hidden');
        } else {
            gradeControls.classList.remove('hidden');
            updateStudyCardActions();
        }
        hintText.classList.add('hidden');
    }
}

function getCurrentStudySourceDeckId() {
    return ['today', 'weak'].includes(activeStudyMode)
        ? activeStudyItems[currentIndex]?.deckId || ''
        : activeDeckId;
}

function getCurrentStudySourceDeck() {
    return findDeck(getCurrentStudySourceDeckId());
}

function updateStudyCardActions() {
    const currentCard = deck[currentIndex];
    const savedDeck = getCurrentStudySourceDeck();
    const canChangeStatus = Boolean(currentCard && savedDeck && !['preview', 'learn'].includes(activeStudyMode));
    studyCardActions.classList.toggle('hidden', !isFlipped || !canChangeStatus);
    suspendCurrentCardBtn.textContent = currentCard?.suspended ? 'Unsuspend Card' : 'Suspend Card';
    markKnownCurrentCardBtn.textContent = currentCard?.known ? 'Known' : 'Mark Known';
    markKnownCurrentCardBtn.disabled = !canChangeStatus || currentCard?.known;
    suspendCurrentCardBtn.disabled = !canChangeStatus;
}

function advanceAfterStudyStatusChange(message) {
    currentIndex++;

    if (currentIndex >= deck.length) {
        showConfirmModal({
            title: activeStudyMode === 'today' ? "Today's Review complete" : 'Session complete',
            message,
            confirmLabel: 'Back to Library',
            onConfirm: showImportView
        });
        return;
    }

    renderCard();
}

function suspendCurrentStudyCard() {
    const currentCard = deck[currentIndex];
    const savedDeck = getCurrentStudySourceDeck();
    if (!currentCard || !savedDeck) return;

    showConfirmModal({
        title: 'Suspend card',
        message: `Suspend "${getCardPrompt(currentCard)}"? It will stay in the deck but will be excluded from due and review sessions until you unsuspend it.`,
        confirmLabel: 'Suspend Card',
        onConfirm: () => {
            setCardSuspended(currentCard, true);
            saveCardStatusChange(savedDeck, true);
            advanceAfterStudyStatusChange('Card suspended. WordNinja preserved it in the deck and removed it from future review sessions.');
        }
    });
}

function markCurrentStudyCardKnown() {
    const currentCard = deck[currentIndex];
    const savedDeck = getCurrentStudySourceDeck();
    if (!currentCard || !savedDeck || currentCard.known) return;

    showConfirmModal({
        title: 'Mark card as known',
        message: `Mark "${getCardPrompt(currentCard)}" as known? It will remain active but will not be due again for about ${KNOWN_INTERVAL_DAYS} days.`,
        confirmLabel: 'Mark Known',
        onConfirm: () => {
            setCardKnown(currentCard);
            saveCardStatusChange(savedDeck, true);
            advanceAfterStudyStatusChange(`Card marked known and scheduled about ${KNOWN_INTERVAL_DAYS} days ahead.`);
        }
    });
}

function gradeLearnCard(choice) {
    if (activeStudyMode !== 'learn' || !isFlipped || isFlipAnimating || !learnSession) return;
    if (!['learning', 'know'].includes(choice)) return;

    const currentCard = deck.shift();
    const currentItem = activeStudyItems.shift();
    if (!currentCard || !currentItem) return;

    learnSession.totalStudied++;
    if (choice === 'know') {
        learnSession.knownCount++;
    } else {
        learnSession.stillLearningCount++;
        deck.push(currentCard);
        activeStudyItems.push(currentItem);
    }

    currentIndex = 0;
    if (deck.length === 0) {
        showConfirmModal({
            title: 'Learn Mode complete',
            message: `Cards known: ${learnSession.knownCount}. Cards still learning: 0. Still Learning choices: ${learnSession.stillLearningCount}. Total studied: ${learnSession.totalStudied}. Your long-term schedule and study history were not changed.`,
            confirmLabel: 'Back to Library',
            onConfirm: showImportView
        });
        return;
    }

    renderCard();
}

function scheduleCard(card, score, now = new Date()) {
    const previousInterval = Math.max(0, numberOr(card.intervalDays, 0));
    const previousReviews = intOr(card.reviews, 0);
    let ease = clamp(numberOr(card.ease, DEFAULT_EASE), MIN_EASE, MAX_EASE);
    let nextIntervalDays = 1;

    if (score === 1) {
        ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
        nextIntervalDays = AGAIN_MINUTES / (24 * 60);
        card.lapses = intOr(card.lapses, 0) + 1;
    } else if (score === 2) {
        ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
        nextIntervalDays = previousReviews === 0 || previousInterval < 1
            ? LEARNING_HARD_MINUTES / (24 * 60)
            : Math.max(1, Math.round(previousInterval * 1.2));
    } else if (score === 3) {
        nextIntervalDays = previousReviews === 0
            ? LEARNING_GOOD_MINUTES / (24 * 60)
            : previousInterval < 1
                ? 1
                : Math.max(2, Math.round(previousInterval * ease));
    } else if (score === 4) {
        ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
        nextIntervalDays = previousReviews === 0
            ? NEW_EASY_INTERVAL_DAYS
            : previousInterval < 1
                ? 5
                : Math.max(4, Math.round(previousInterval * ease * 1.35));
    }

    card.ease = Number(ease.toFixed(2));
    card.intervalDays = Number(nextIntervalDays.toFixed(4));
    card.reviews = previousReviews + 1;
    card.lastReviewedAt = now.toISOString();
    card.dueDate = score === 1
        ? addMinutes(now, AGAIN_MINUTES).toISOString()
        : addDays(now, nextIntervalDays).toISOString();
}

function getSchedulePreview(card, score, now = new Date()) {
    const preview = { ...card };
    scheduleCard(preview, score, now);
    return preview;
}

function formatReviewInterval(intervalDays) {
    const days = Math.max(0, numberOr(intervalDays, 0));
    if (days < 1 / (24 * 60)) {
        return '<1 min';
    }
    if (days < 1 / 24) {
        const minutes = Math.max(1, Math.round(days * 24 * 60));
        return `${minutes} min`;
    }
    if (days < 1) {
        const hours = Math.max(1, Math.round(days * 24));
        return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }
    if (days < 14) {
        const roundedDays = Math.round(days);
        return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'}`;
    }
    if (days < 60) {
        const weeks = Math.max(2, Math.round(days / 7));
        return `${weeks} wk`;
    }
    if (days < 730) {
        const months = Math.max(2, Math.round(days / 30));
        return `${months} mo`;
    }
    const years = Math.max(2, Math.round(days / 365));
    return `${years} yr`;
}

function studyModeUpdatesSchedule() {
    return ['due', 'today', 'weak'].includes(activeStudyMode);
}

function requeueLearningCard(card, studyItem, score, reviewsBefore, intervalBefore) {
    const wasLearning = reviewsBefore === 0 || intervalBefore < 1;
    const shouldRepeat = score === 1 || (score === 2 && wasLearning) || (score === 3 && reviewsBefore === 0);
    if (!shouldRepeat) return;

    const cardsBeforeRepeat = score === 1 ? 2 : score === 2 ? 3 : 4;
    const repeatIndex = Math.min(deck.length, currentIndex + cardsBeforeRepeat + 1);
    deck.splice(repeatIndex, 0, card);
    activeStudyItems.splice(repeatIndex, 0, studyItem);
}

function gradeCard(score) {
    if (isFlipAnimating) return;
    if (activeStudyMode === 'learn') return;
    if (!Number.isInteger(score) || score < 1 || score > 4) return;

    const currentCard = deck[currentIndex];
    if (!currentCard) return;

    const updatesSchedule = studyModeUpdatesSchedule();
    const reviewsBefore = intOr(currentCard.reviews, 0);
    const intervalBefore = Math.max(0, numberOr(currentCard.intervalDays, 0));
    const currentStudyItem = activeStudyItems[currentIndex] || {
        deckId: getCurrentStudySourceDeckId(),
        deckName: activeDeckName,
        card: currentCard
    };
    if (updatesSchedule) {
        scheduleCard(currentCard, score);
        requeueLearningCard(currentCard, currentStudyItem, score, reviewsBefore, intervalBefore);
    }

    const sourceDeckId = getCurrentStudySourceDeckId();

    if (sourceDeckId && updatesSchedule) {
        const savedDeck = library.decks.find(item => item.id === sourceDeckId);
        if (savedDeck) {
            recordReview(currentCard, sourceDeckId, score);
            const now = new Date().toISOString();
            savedDeck.updatedAt = now;
            savedDeck.lastStudiedAt = now;
            saveLibrary();
            renderLibrary();
        }
    }

    currentIndex++;
    if (currentIndex >= deck.length) {
        const isPreview = activeStudyMode === 'preview';
        const isPractice = ['all', 'practice', 'starred'].includes(activeStudyMode);
        const isToday = activeStudyMode === 'today';
        const isWeak = activeStudyMode === 'weak';
        const remainingDue = isToday ? getDueStudyItems().length : 0;
        showConfirmModal({
            title: isPreview ? 'Preview complete' : isPractice ? 'Practice complete' : isToday ? "Today's Review complete" : isWeak ? 'Weak Cards review complete' : 'Session complete',
            message: isPreview
                ? 'Your review schedule was not changed.'
                : isPractice
                    ? 'Practice complete. Your due dates and review history were not changed.'
                : isToday
                    ? remainingDue > 0
                        ? `WordNinja updated each reviewed card. ${remainingDue} cards are still due and ready for another focused session.`
                        : 'WordNinja updated each reviewed card. You are all caught up.'
                    : isWeak
                        ? 'WordNinja updated the review schedule for these weak cards.'
                    : 'WordNinja updated the schedule for this deck.',
            confirmLabel: 'Back to Library',
            onConfirm: showImportView
        });
        return;
    }

    renderCard();
}

document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await loadLibrary();
    renderFolderControls(DEFAULT_FOLDER_ID);
    renderLibrary();
    processInput();
    registerPwa();
    if (intOr(library.metadata?.onboardingVersion, 0) < ONBOARDING_VERSION) {
        window.setTimeout(() => openOnboarding(true), 0);
    }
});

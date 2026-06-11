import { firebaseConfig } from './firebase-config.js';

const FIREBASE_VERSION = '12.14.0';
const CLOUD_STATUS_KEY = 'wordninja_cloud_status_v1';
const MAX_SAFE_SNAPSHOT_BYTES = 900000;

const signInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('cloudSignOutBtn');
const backupBtn = document.getElementById('cloudBackupBtn');
const restoreBtn = document.getElementById('cloudRestoreBtn');
const accountStatus = document.getElementById('cloudAccountStatus');
const connectionBadge = document.getElementById('cloudConnectionBadge');
const lastBackupStat = document.getElementById('lastCloudBackupStat');
const actionStatus = document.getElementById('cloudActionStatus');

let firebaseApi = null;
let auth = null;
let db = null;
let currentUser = null;
let cloudMetadata = readCloudStatus();
let authListenerBound = false;

function isConfigured() {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function readCloudStatus() {
    try {
        return JSON.parse(localStorage.getItem(CLOUD_STATUS_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveCloudStatus(status) {
    cloudMetadata = { ...cloudMetadata, ...status };
    localStorage.setItem(CLOUD_STATUS_KEY, JSON.stringify(cloudMetadata));
}

function formatCloudDate(value) {
    if (!value) return 'No cloud backup found';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No cloud backup found';
    return `Last cloud backup ${date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
}

function setBusy(busy, message = '') {
    signInBtn.disabled = busy;
    signOutBtn.disabled = busy;
    backupBtn.disabled = busy || !currentUser;
    restoreBtn.disabled = busy || !currentUser;
    if (message) actionStatus.textContent = message;
}

function renderCloudUi() {
    const configured = isConfigured();
    const online = navigator.onLine;
    signInBtn.classList.toggle('hidden', Boolean(currentUser));
    signOutBtn.classList.toggle('hidden', !currentUser);
    signInBtn.disabled = !configured || !online;
    backupBtn.disabled = !currentUser || !online;
    restoreBtn.disabled = !currentUser || !online;

    if (!configured) {
        accountStatus.textContent = 'Firebase setup is required before cloud backup can be used.';
        connectionBadge.textContent = 'Setup needed';
        actionStatus.textContent = 'WordNinja remains fully usable in local mode.';
    } else if (!online) {
        accountStatus.textContent = currentUser ? `Signed in as ${currentUser.email || currentUser.displayName}` : 'Local mode active. Sign-in is optional.';
        connectionBadge.textContent = 'Offline';
        actionStatus.textContent = 'Cloud actions will be available when this device reconnects.';
    } else if (currentUser) {
        accountStatus.textContent = `Signed in as ${currentUser.email || currentUser.displayName || 'Google user'}`;
        connectionBadge.textContent = 'Cloud ready';
        actionStatus.textContent = 'Local data changes stay local until you choose Back Up to Cloud.';
    } else {
        accountStatus.textContent = 'Local mode active. Sign-in is optional.';
        connectionBadge.textContent = 'Local only';
        actionStatus.textContent = 'Sign in only when you want cloud backup or restore.';
    }

    lastBackupStat.textContent = currentUser
        ? formatCloudDate(cloudMetadata.lastCloudBackupAt)
        : 'Sign in to check cloud backup';
}

async function loadFirebase() {
    if (firebaseApi) return firebaseApi;
    if (!isConfigured()) throw new Error('Firebase has not been configured yet.');
    if (!navigator.onLine) throw new Error('This device is offline.');

    const [appModule, authModule, firestoreModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    auth = authModule.getAuth(app);
    db = firestoreModule.getFirestore(app);
    firebaseApi = { ...authModule, ...firestoreModule };
    return firebaseApi;
}

function getBridge() {
    const bridge = globalThis.WordNinjaCloudBridge;
    if (!bridge) throw new Error('WordNinja local storage is not ready yet.');
    return bridge;
}

function cloudDocumentRef() {
    return firebaseApi.doc(db, 'users', currentUser.uid, 'library', 'current');
}

async function refreshCloudMetadata() {
    if (!currentUser || !navigator.onLine) return;
    try {
        const snapshot = await firebaseApi.getDoc(cloudDocumentRef());
        if (!snapshot.exists()) {
            saveCloudStatus({ lastCloudBackupAt: '', uid: currentUser.uid });
            return;
        }
        const data = snapshot.data();
        saveCloudStatus({ lastCloudBackupAt: data.backedUpAt || '', uid: currentUser.uid });
    } catch {
        actionStatus.textContent = 'Signed in, but cloud backup details could not be checked.';
    } finally {
        renderCloudUi();
    }
}

async function signIn() {
    try {
        setBusy(true, 'Opening Google sign-in...');
        const api = await loadFirebase();
        await api.signInWithPopup(auth, new api.GoogleAuthProvider());
    } catch (error) {
        actionStatus.textContent = error.code === 'auth/popup-blocked'
            ? 'The browser blocked the sign-in window. Allow popups for WordNinja and try again.'
            : error.message || 'Google sign-in could not finish.';
    } finally {
        setBusy(false);
        renderCloudUi();
    }
}

async function signOutCloud() {
    try {
        setBusy(true, 'Signing out...');
        await firebaseApi.signOut(auth);
    } catch (error) {
        actionStatus.textContent = error.message || 'Sign-out could not finish.';
    } finally {
        setBusy(false);
    }
}

async function backupToCloud() {
    if (!currentUser) return;
    try {
        setBusy(true, 'Preparing encrypted connection and cloud snapshot...');
        const library = getBridge().getLibrarySnapshot();
        const libraryJson = JSON.stringify(library);
        const snapshotBytes = new Blob([libraryJson]).size;
        if (snapshotBytes > MAX_SAFE_SNAPSHOT_BYTES) {
            throw new Error('This library is too large for the simple one-document cloud backup. Export a file backup instead.');
        }

        const backedUpAt = new Date().toISOString();
        await firebaseApi.setDoc(cloudDocumentRef(), {
            libraryJson,
            updatedAt: firebaseApi.serverTimestamp(),
            backedUpAt,
            appVersion: '2',
            snapshotBytes,
            deckCount: library.decks.length,
            folderCount: library.folders.length
        });
        saveCloudStatus({ lastCloudBackupAt: backedUpAt, uid: currentUser.uid });
        actionStatus.textContent = 'Cloud backup completed. Your local library is unchanged.';
    } catch (error) {
        actionStatus.textContent = error.message || 'Cloud backup failed. Your local library is unchanged.';
    } finally {
        setBusy(false);
        renderCloudUi();
    }
}

async function restoreFromCloud() {
    if (!currentUser) return;
    try {
        setBusy(true, 'Checking cloud backup...');
        const snapshot = await firebaseApi.getDoc(cloudDocumentRef());
        if (!snapshot.exists()) throw new Error('No cloud backup exists for this Google account.');
        const data = snapshot.data();
        const cloudLibrary = JSON.parse(String(data.libraryJson || ''));
        const backedUpAt = data.backedUpAt || '';
        getBridge().confirmCloudRestore(cloudLibrary, {
            backedUpAt,
            deckCount: data.deckCount,
            folderCount: data.folderCount
        });
        actionStatus.textContent = 'Review the restore warning before replacing local data.';
    } catch (error) {
        actionStatus.textContent = error.message || 'Cloud restore could not finish. Your local library is unchanged.';
    } finally {
        setBusy(false);
        renderCloudUi();
    }
}

async function initializeCloud() {
    renderCloudUi();
    if (!isConfigured() || !navigator.onLine) return;
    try {
        const api = await loadFirebase();
        if (authListenerBound) return;
        authListenerBound = true;
        api.onAuthStateChanged(auth, user => {
            currentUser = user;
            if (user && cloudMetadata.uid !== user.uid) {
                cloudMetadata = {};
                localStorage.removeItem(CLOUD_STATUS_KEY);
            }
            renderCloudUi();
            if (user) refreshCloudMetadata();
        });
    } catch (error) {
        actionStatus.textContent = 'Cloud setup could not load. WordNinja remains available in local mode.';
    }
}

signInBtn.addEventListener('click', signIn);
signOutBtn.addEventListener('click', signOutCloud);
backupBtn.addEventListener('click', backupToCloud);
restoreBtn.addEventListener('click', restoreFromCloud);
window.addEventListener('online', initializeCloud);
window.addEventListener('offline', renderCloudUi);
initializeCloud();

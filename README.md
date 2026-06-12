# NinjaLearn

NinjaLearn is a local-first study workspace with WordNinja spaced repetition flashcards, a prompt library, structured study imports, reading practice, and listening practice. It runs entirely as a static website with no build step.

Google sign-in and cloud backup are optional. NinjaLearn continues working locally and offline without Firebase. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to enable cloud backup.

The existing WordNinja library remains the primary data model. Existing decks, folders, review history, and schedules remain compatible, while ReadNinja and ListenNinja activities are included in the same local and cloud backup snapshot.

ReadNinja includes resumable sentence-by-sentence reading, difficult-sentence marking, and cloze practice. ListenNinja splits scripts into replayable sentences with previous, repeat, next, speed, and transcript controls.

## Deploy With GitHub Pages

1. Create a new GitHub repository.
2. Push this repository to GitHub.
3. Open the repository's **Settings**.
4. Choose **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select the `main` branch and the `/ (root)` folder, then save.

The site will be available at:

`https://USERNAME.github.io/REPO-NAME/`

GitHub Pages may take a few minutes to publish after the first push.

## Files Used By The Site

- `index.html`
- `wordninja-app.js`
- `ninjalearn-app.js`
- `wordninja.css`
- `lab.css`
- `wordninja-utilities.css`
- `manifest.json`
- `service-worker.js`
- `wordninja-icon.svg`
- `wordninja-icon-192.png`
- `wordninja-icon-512.png`
- `cloud-sync.js`
- `firebase-config.js`
- `firestore.rules`

## Privacy

NinjaLearn stores decks, review history, and module activities inside each browser. Personal study data is not included in this repository. Backup JSON and exported deck files are ignored by Git.

When optional cloud backup is enabled, the signed-in user's complete library snapshot is stored at `users/{uid}/library/current`.

# Optional Firebase Cloud Backup Setup

WordNinja remains fully local-first when Firebase is not configured. These steps enable the optional **Sign in with Google**, **Back Up to Cloud**, and **Restore from Cloud** controls.

## 1. Create Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project.
3. Register a Web app.
4. Copy the web-app configuration into `firebase-config.js`.

## 2. Enable Google Sign-In

1. Open **Authentication** in Firebase Console.
2. Choose **Sign-in method**.
3. Enable **Google**.
4. Add your GitHub Pages domain to **Authorized domains** when needed.

## 3. Create Firestore

1. Open **Firestore Database**.
2. Create the database.
3. Publish the rules from `firestore.rules`.

The rules only allow an authenticated user to read or write:

`users/{their-user-id}/library/current`

## Cloud Backup Behavior

- Cloud actions are manual. There is no automatic or real-time sync.
- The local library remains the source used while studying.
- Restore requires confirmation and creates a local safety snapshot first.
- File-based Export Backup and Import Backup remain available.
- Version 1 stores one JSON snapshot document per user. Firestore documents have a size limit, so very large libraries should continue using file export backups.

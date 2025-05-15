# Conjugame - Language Conjugation Game

Conjugame is a Progressive Web App (PWA) that helps users practice verb conjugations in different languages (currently French, Spanish, and Italian).

## Features

- Practice verb conjugations in French, Spanish, and Italian
- Two game modes: 
  - Identify the verb form (person, mood, and tense)
  - Choose the correct conjugation
- Three difficulty levels
- Language switching with flag icons
- Installable as a Progressive Web App on mobile devices and desktops

## PWA Functionality

The app can be installed on mobile devices and desktops with the following features:
- Home screen icon
- Standalone window (no browser UI)
- Limited offline functionality (previously cached pages will work offline)

### Limitations

The app relies on the external verbe.cc API to get conjugation data, so:
- An internet connection is required for initial data loading
- Only previously cached verbs/conjugations will be available offline

## Installation

As a Progressive Web App, Conjugame can be installed directly from the browser:

1. Visit the app URL in your browser
2. An "Install" banner will appear (or use browser menu options)
3. Follow the prompts to install the app on your device

## Development

### Project Structure

- `index.html`, `identify.html`, `choose.html` - Main pages
- `styles.css` - Styling
- `common.js` - Shared functionality
- `identify.js`, `choose.js` - Game mode specific logic
- `fr.json`, `es.json`, `it.json` - Language files
- `languageFlags.js` - Language switching
- `manifest.webmanifest` - PWA manifest file
- `sw.js` - Service worker for offline functionality
- `pwa-install.js` - Installation prompt handling
- `icon.png` - App icon

## Credits

Verb conjugation data provided by [verbe.cc](http://verbe.cc/)
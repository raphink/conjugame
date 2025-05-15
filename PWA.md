# Conjugame - Progressive Web App

Conjugame is a language learning application that helps users practice verb conjugations in different languages (French, Spanish, Italian).

## PWA Features

This application has been set up as a Progressive Web App (PWA), which means:

1. **Installable**: Users can add it to their home screen on mobile or desktop
2. **Offline Capable**: Works even when offline thanks to service worker caching
3. **Responsive**: Adapts to different screen sizes

## Deployment Instructions

To properly deploy Conjugame as a PWA:

1. Host the application on a secure server (HTTPS is required for PWA features)
2. Ensure all files are accessible, especially:
   - `manifest.webmanifest`
   - `sw.js` (Service Worker)
   - Icons in the `/icons` directory

## Testing Installation

To test the PWA installation:

1. On mobile: 
   - Open the website in Chrome (Android) or Safari (iOS)
   - Look for "Add to Home Screen" option in the browser menu
   - Follow the prompts to install

2. On desktop:
   - Open the website in Chrome, Edge, or other compatible browser
   - Look for the install icon in the address bar
   - Click it and follow the installation prompt

## Development Notes

- The icon SVGs can be replaced with actual PNG icons if needed
- The service worker cache version (`CACHE_NAME`) should be updated whenever files change
- For API call caching, modify the fetch event handler in `sw.js`

## Languages Supported

- French (fr)
- Spanish (es)
- Italian (it)

## Background Support

The app is designed to work offline by caching:

- Static assets (HTML, CSS, JS files)
- Language data files (fr.json, es.json, it.json)
- External dependencies (Bootstrap, jQuery)

API calls to the verb conjugation service will still require an internet connection.

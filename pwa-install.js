// PWA Installation handler
let deferredPrompt;
const installContainer = document.createElement('div');

// Style the install prompt
installContainer.id = 'pwa-install-container';
installContainer.className = 'install-prompt';
installContainer.style.display = 'none';
installContainer.style.position = 'fixed';
installContainer.style.bottom = '20px';
installContainer.style.left = '10px';
installContainer.style.right = '10px';
installContainer.style.backgroundColor = 'white';
installContainer.style.padding = '10px 15px';
installContainer.style.borderRadius = '10px';
installContainer.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
installContainer.style.zIndex = '9999';
installContainer.style.textAlign = 'center';
installContainer.style.maxWidth = '400px';
installContainer.style.margin = '0 auto';

// Create content for the prompt with responsive styling
const promptContent = document.createElement('div');
promptContent.innerHTML = `
  <p style="margin: 0 0 8px 0; font-size: 1rem;"><strong class="install-title">Installez Conjugame</strong></p>
  <p style="margin: 0 0 10px 0; font-size: 0.85rem;" class="install-subtitle">Pour utiliser l'application même sans connexion internet</p>
  <div class="install-buttons">
    <button id="install-btn" class="btn btn-primary btn-sm pwa-install-button" style="margin-right: 10px;">Installer</button>
    <button id="install-later-btn" class="btn btn-outline-secondary btn-sm">Plus tard</button>
  </div>
`;
installContainer.appendChild(promptContent);

// Add the prompt to the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(installContainer);
  
  // Set up button event listeners
  document.getElementById('install-btn').addEventListener('click', async () => {
    installContainer.style.display = 'none';
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      // Clear the deferred prompt
      deferredPrompt = null;
    }
  });
  
  document.getElementById('install-later-btn').addEventListener('click', () => {
    installContainer.style.display = 'none';
    // Store in session storage so we don't show it again in this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  });
});

// Listen for 'beforeinstallprompt' event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default browser install prompt
  e.preventDefault();
  
  // Save the event for later use
  deferredPrompt = e;
  
  // Check if user has dismissed the prompt before in this session
  if (!sessionStorage.getItem('installPromptDismissed')) {
    // Show our custom install prompt
    setTimeout(() => {
      installContainer.style.display = 'block';
    }, 3000); // Wait 3 seconds before showing
  }
});

// Update prompt text based on language
async function updateInstallPrompt() {
  let installBtn = document.getElementById('install-btn');
  let laterBtn = document.getElementById('install-later-btn');
  
  if (installBtn && laterBtn) {
    // Only update if we can get language data
    try {
      const langData = await getLangData();
      
      // If we have translations for the install prompt
      if (langData.translations.installApp) {
        promptContent.querySelector('p:first-child strong').textContent = 
          langData.translations.installApp;
      }
      
      if (langData.translations.installAppDesc) {
        promptContent.querySelector('p:nth-child(2)').textContent = 
          langData.translations.installAppDesc;
      }
      
      if (langData.translations.install) {
        installBtn.textContent = langData.translations.install;
      }
      
      if (langData.translations.later) {
        laterBtn.textContent = langData.translations.later;
      }
    } catch (error) {
      console.error('Error updating install prompt language:', error);
    }
  }
}

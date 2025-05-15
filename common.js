// Default language and configuration
let lang = "fr"; // Default language
let difficulty = "easy"; // Default difficulty
const supportedLanguages = ["fr", "es"]; // Supported languages (French, Spanish)

// Function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Initialize settings from URL parameters
function initializeSettings() {
    // Check URL parameters for language and difficulty
    const urlLang = getUrlParameter('lang');
    const urlDifficulty = getUrlParameter('difficulty');
    
    // Set language if provided in URL
    if (urlLang && supportedLanguages.includes(urlLang)) {
        lang = urlLang;
        updateLanguageSelection();
    }
    
    // Set difficulty if provided in URL
    if (urlDifficulty && ['easy', 'medium', 'hard'].includes(urlDifficulty)) {
        difficulty = urlDifficulty;
        updateDifficultySelector();
    }
    
    // Update API base URL
    updateApiBaseUrl();
}

// Function to update API base URL when language changes
function updateApiBaseUrl() {
    api_base_url = `http://verbe.cc/verbecc/conjugate/${lang}/`;
}

// Function to update language selection in flag icons
function updateLanguageSelection() {
    if ($('.language-flag').length) {
        $('.language-flag').removeClass('active');
        $(`.language-flag[data-lang="${lang}"]`).addClass('active');
    }
}

// Function to update difficulty selector
function updateDifficultySelector() {
    $('.difficulty-btn').removeClass('active');
    $(`.difficulty-btn[data-level="${difficulty}"]`).addClass('active');
}

// Function to change language
async function changeLanguage(newLang) {
    if (newLang && supportedLanguages.includes(newLang)) {
        lang = newLang;
        updateApiBaseUrl();
        
        // Wait for UI translation to complete
        await translateUI();
        
        // If we're in a game, reload the current question
        if (typeof nextQuestion === 'function') {
            nextQuestion();
        }
        
        // Update URL parameters
        updateUrlParameters();
        
        // Update language flag selection
        updateLanguageSelection();
        
        // Make sure navigation links are updated
        updateNavigationLinks();
        
        console.log(`Language changed to ${newLang} - UI updated`);
    }
}

// Function to update URL parameters
function updateUrlParameters() {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    url.searchParams.set('difficulty', difficulty);
    window.history.replaceState({}, '', url);
}

// Function to update all navigation links with current language and difficulty
function updateNavigationLinks() {
    // Update all links to include current parameters
    $('a').each(function() {
        const href = $(this).attr('href');
        // Only update internal links that go to HTML pages
        if (href && href.endsWith('.html')) {
            // Remove any existing parameters
            const baseUrl = href.split('?')[0];
            // Add current language and difficulty parameters
            $(this).attr('href', `${baseUrl}?lang=${lang}&difficulty=${difficulty}`);
        }
    });
}

// Names of persons for display (legacy, will be replaced by translations)
const personnesAbrégées = [
    "1ère (je)", "2ème (tu)", "3ème (il/elle)", "1ère (nous)", "2ème (vous)", "3ème (ils/elles)"
];

const personnesImperatif = ["2ème (tu)", "1ère (nous)", "2ème (vous)"];


// Define available persons by mode (moved from common.js)
const personnesParMode = {
    "indicative": [0, 1, 2, 3, 4, 5],      // all 6 persons
    "subjunctive": [0, 1, 2, 3, 4, 5],     // all 6 persons
    "conditional": [0, 1, 2, 3, 4, 5],   // all 6 persons
    "imperative": [1, 3, 4]                // only 2nd sing, 1st plur, 2nd plur (tu, nous, vous)
};

// Mapping between standard person indices and imperative array indices
const imperative_mapping = {
    // Standard index to array index
    "1": 0,  // tu (2nd person singular) -> position 0 in imperative array
    "3": 1,  // nous (1st person plural) -> position 1 in imperative array
    "4": 2,  // vous (2nd person plural) -> position 2 in imperative array
    
    // Array index to standard index (reverse mapping)
    "array_0": 1,  // position 0 in imperative array -> tu (2nd person singular)
    "array_1": 3,  // position 1 in imperative array -> nous (1st person plural)
    "array_2": 4   // position 2 in imperative array -> vous (2nd person plural)
};

// API configuration
const PROXY_URL = "https://api.allorigins.win/raw?url=";
let api_base_url = `http://verbe.cc/verbecc/conjugate/${lang}/`;

// Function to call the Verbecc API using CORS proxy
async function callAPI(verbe) {
    $('#loading').show();
    $('#verb-display').hide();
    
    const maxAttempts = 3;
    let attempts = 0;
    const baseRetryInterval = 2000; // 2 seconds initial retry interval
    
    while (attempts < maxAttempts) {
        try {
            // Use CORS proxy to access the HTTP API
            const apiUrl = `${PROXY_URL}${encodeURIComponent(api_base_url + encodeURIComponent(verbe))}`;
            
            // fetch from $lang.json with cache
            $.ajaxSetup({ cache: true });
            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                if (options.url === apiUrl) {
                    options.cache = true; // Cache the request
                }
            });
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !data.value) {
                throw new Error("Unexpected data format");
            }
            
            $('#loading').hide();
            $('#verb-display').show();
            return data.value;
            
        } catch (error) {
            attempts++;
            console.error(`Error (attempt ${attempts}/${maxAttempts}):`, error);

            if (attempts >= maxAttempts) {
                // All retry attempts failed
                $('#loading').hide();
                $('#verb-display').show();
                alert("Failed to retrieve data after multiple attempts.");
                return null;
            }
            
            // Calculate backoff time and wait before next attempt
            const retryDelay = baseRetryInterval * Math.pow(2, attempts - 1);
            console.log(`New attempt in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}
// Get language data from JSON file synchronously
async function getLangData() {
    // fetch from $lang.json with cache
    $.ajaxSetup({ cache: true });
    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        if (options.url === `${lang}.json`) {
            options.cache = true; // Cache the request
        }
    });
    const response = await $.getJSON(`${lang}.json`);
    return response;
}

// Get verb list based on difficulty level
async function getVerbList(difficulty) {
    let langData = await getLangData();

    switch(difficulty) {
        case "easy":
            return langData.verbData.verbs.easy;
        case "medium":
            return [...langData.verbData.verbs.easy, ...langData.verbData.verbs.medium];
        case "hard":
            return [...langData.verbData.verbs.easy, ...langData.verbData.verbs.medium, ...langData.verbData.verbs.hard];
        default:
            return langData.verbData.verbs.easy;
    }
}

// Get available forms based on difficulty level
async function getAvailableForms(difficulty) {
    let langData = await getLangData();

    return langData.verbData.moodsTenses[difficulty] || langData.verbData.moodsTenses.easy;
}

// Function to toggle between verify and next question buttons
function toggleActionButtons(showVerify = true) {
    if (showVerify) {
        $('#check-answer').show();
        $('#next-question').hide();
    } else {
        $('#check-answer').hide();
        $('#next-question').show();
    }
}

// Function to get translation for a specific item
async function localize(item) {
    let langData = await getLangData();
    const translation = await langData.translations[item];
    if (translation) {
        return translation;
    } else {
        console.warn(`Translation not found for: ${item}`);
        return item; // Fallback to original item if translation is not found
    }
}

// Function to get the full tense name
async function getFullTenseName(tense) {
    let langData = await getLangData();
    const tenseName = await langData.verbData.tensesNames[tense];
    if (tenseName) {
        return tenseName;
    } else {
        console.warn(`Tense not found: ${tense}`);
        return tense; // Fallback to original tense if not found
    }
}

// Function to get person name
async function getPersonFullName(person) {
    let langData = await getLangData();
    const personName = await langData.verbData.personDisplay.fullNames[person];
    if (personName) {
        return personName;
    } else {
        console.warn(`Person not found: ${person}`);
        return person; // Fallback to original person if not found
    }
}

// Function to translate UI elements
async function translateUI() {
    let langData = await getLangData();

    // Update document title based on current page
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage.includes('identify')) {
        document.title = await localize('gameTitle') + ' - ' + await localize('identifyForm');
    } else if (currentPage.includes('choose')) {
        document.title = await localize('gameTitle') + ' - ' + await localize('chooseForm');
    } else {
        document.title = await localize('gameTitle');
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update all elements with data-translate attribute - using Promise.all for proper async handling
    const translationPromises = [];
    $('[data-translate]').each(function () {
        const element = $(this);
        const key = element.data('translate');
        
        // Create a promise for each translation
        const promise = localize(key).then(translation => {
            if (translation) {
                // Make sure we update the text content properly
                element.html(translation);
            }
        });
        
        translationPromises.push(promise);
    });
    
    // Wait for all translations to complete
    await Promise.all(translationPromises);
    
    // Update language selection
    updateLanguageSelection();
    
    // Update navigation links with current language
    updateNavigationLinks();
}

// Function to get array index for imperative mode
function getImperativeArrayIndex(standardPersonIndex) {
    return imperative_mapping[standardPersonIndex.toString()] !== undefined ? 
        imperative_mapping[standardPersonIndex.toString()] : 0;
}
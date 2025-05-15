
// Names of persons for display
const personnesAbrégées = [
    "1ère (je)", "2ème (tu)", "3ème (il/elle)", "1ère (nous)", "2ème (vous)", "3ème (ils/elles)"
];

const personnesImperatif = ["2ème (tu)", "1ère (nous)", "2ème (vous)"];

// API configuration
const PROXY_URL = "https://api.allorigins.win/raw?url=";
const API_BASE_URL = "http://verbe.cc/verbecc/conjugate/fr/";

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
            const apiUrl = `${PROXY_URL}${encodeURIComponent(API_BASE_URL + encodeURIComponent(verbe))}`;
            
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
    let lang = "fr"; // Default language
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

// Function to translate UI elements
async function translateUI() {
    let langData = await getLangData();

    $('[data-translate]').each(async function () {
        const key = $(this).data('translate');
        const translation = await localize(key);
        if (translation) {
            $(this).text(translation);
        }
    });
}
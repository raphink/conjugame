
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
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !data.value) {
                throw new Error("Format de données inattendu");
            }
            
            $('#loading').hide();
            $('#verb-display').show();
            return data.value;
            
        } catch (error) {
            attempts++;
            console.error(`Erreur (tentative ${attempts}/${maxAttempts}):`, error);
            
            if (attempts >= maxAttempts) {
                // All retry attempts failed
                $('#loading').hide();
                $('#verb-display').show();
                alert("Échec de la récupération des données après plusieurs tentatives.");
                return null;
            }
            
            // Calculate backoff time and wait before next attempt
            const retryDelay = baseRetryInterval * Math.pow(2, attempts - 1);
            console.log(`Nouvelle tentative dans ${retryDelay/1000} secondes...`);
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
    console.log("Lang data loaded:", response);
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

    console.log("Formes disponibles:", langData.verbData.moodsTenses);

    switch (difficulty) {
        case "easy":
            return langData.verbData.moodsTenses.easy;
        case "medium":
            return langData.verbData.moodsTenses.medium;
        case "hard":
            return langData.verbData.moodsTenses.hard;
        default:
            return langData.verbData.moodsTenses.easy;
    }
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


async function translateUI() {
    let langData = await getLangData();

    $('[data-translate]').each(function() {
        const key = $(this).data('translate');
        const translation = langData.translations[key];
        if (translation) {
            $(this).text(translation);
        }
    }
    );

    // Translate UI elements
    $('.infinitive-title').text(langData.verbData.moodsNames.infinitive);

    $('.person-btn [data-person|="0"]').text(langData.verbData.personDisplay.ordinal[0]);
    $('.person-btn [data-person|="1"]').text(langData.verbData.personDisplay.ordinal[1]);
    $('.person-btn [data-person|="2"]').text(langData.verbData.personDisplay.ordinal[2]);
}
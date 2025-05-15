let lang = "fr"; // Default language

// Names of persons for display
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

    $('[data-translate]').each(async function () {
        const key = $(this).data('translate');
        const translation = await localize(key);
        if (translation) {
            $(this).text(translation);
        }
    });
}

// Function to get array index for imperative mode
function getImperativeArrayIndex(standardPersonIndex) {
    return imperative_mapping[standardPersonIndex.toString()] !== undefined ? 
        imperative_mapping[standardPersonIndex.toString()] : 0;
}
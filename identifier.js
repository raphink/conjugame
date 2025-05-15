// Game state
let score = 0;
let totalQuestions = 0;
let streak = 0;
let verbeActuel = "";
let currentConjugation = "";
let verbData = null;
let currentAnswer = {
    personne: null,
    mode: "",
    temps: ""
};
let niveauDifficulte = "facile";
let objectifScore = 10; // Number of correct answers needed to "win"
let availableModes = []; // Array to store available modes for current verb

// Define available persons by mode (moved from common.js)
const personnesParMode = {
    "indicative": [0, 1, 2, 3, 4, 5],      // all 6 persons
    "subjonctive": [0, 1, 2, 3, 4, 5],     // all 6 persons
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

// Get person index from person and number selections
function getPersonneIndex(personSelection, numberSelection) {
    const personInt = parseInt(personSelection);
    const numberInt = parseInt(numberSelection);
    
    if (numberInt === 0) { // Singular
        return personInt;
    } else { // Plural
        return personInt + 3;
    }
}

// Function to get array index for imperative mode
function getImperativeArrayIndex(standardPersonIndex) {
    return imperative_mapping[standardPersonIndex.toString()] !== undefined ? 
        imperative_mapping[standardPersonIndex.toString()] : 0;
}

// Function to get standard person index from imperative array index
function getStandardPersonIndex(imperativeArrayIndex) {
    return imperative_mapping[`array_${imperativeArrayIndex}`] !== undefined ?
        imperative_mapping[`array_${imperativeArrayIndex}`] : 1;
}

// Function to convert person index to person and number components
function convertPersonneIndexToComponents(personneIndex) {
    if (personneIndex < 3) {
        // Singular
        return {
            person: personneIndex.toString(),
            number: "0"
        };
    } else {
        // Plural
        return {
            person: (personneIndex - 3).toString(),
            number: "1"
        };
    }
}

// Function to update tense buttons based on selected mode
function updateTimeButtons(mode) {
    const container = $('#tense-container');
    container.empty();

    if (!mode) return;

    let availableTenses;
    switch (niveauDifficulte) {
        case "facile":
            availableTenses = modesTempsFaciles[mode] || [];
            break;
        case "moyen":
            availableTenses = modesTempsIntermediaires[mode] || [];
            break;
        case "difficile":
            availableTenses = modesTempsAvances[mode] || [];
            break;
        default:
            availableTenses = modesTempsFaciles[mode] || [];
    }

    // Filter tenses that exist for this verb
    if (verbData && verbData.moods[mode]) {
        availableTenses = availableTenses.filter(t => 
            Object.keys(verbData.moods[mode]).includes(t)
        );
    }

    // If only one tense is available, select it automatically
    if (availableTenses.length === 1) {
        const temps = availableTenses[0];
        const nomFrancais = nomsFrancaisTemps[temps] || temps;
        container.append(`<button type="button" class="btn btn-outline-secondary choice-btn active" data-value="${temps}">${nomFrancais}</button>`);
    } else {
        // Otherwise add all available tenses as buttons
        availableTenses.forEach(temps => {
            const nomFrancais = nomsFrancaisTemps[temps] || temps;
            container.append(`<button type="button" class="btn btn-outline-secondary choice-btn" data-value="${temps}">${nomFrancais}</button>`);
        });

        // Add event listeners for new buttons
        $('#tense-container .choice-btn').click(function() {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
        });
    }
}

// Handle person selection based on mode
function handlePersonSelection(mode) {
    // Get available persons for the selected mode
    const availablePersons = personnesParMode[mode] || [0, 1, 2, 3, 4, 5];
    
    // Enable/disable person buttons based on mode
    $('.person-btn').prop('disabled', true); // First disable all
    
    // Then enable only those that are valid for this mode
    availablePersons.forEach(personIndex => {
        const components = convertPersonneIndexToComponents(personIndex);
        
        // Check if this is a valid combination
        if (components.number === "0") {
            // Singular - enable the corresponding person button
            $(`button[data-person="${components.person}"]`).prop('disabled', false);
        } else {
            // Plural - enable the corresponding person button when plural is selected
            if ($('.number-btn.active').data('number') === "1") {
                $(`button[data-person="${components.person}"]`).prop('disabled', false);
            }
        }
    });
    
    // If the currently selected person is not valid for this mode, select a valid one
    const currentPerson = $('.person-btn.active').data('person');
    const currentNumber = $('.number-btn.active').data('number');
    const currentIndex = getPersonneIndex(currentPerson, currentNumber);
    
    if (!availablePersons.includes(currentIndex)) {
        // Current selection is invalid, select the first valid one
        $('.person-btn.active').removeClass('active');
        
        // Find a valid person for the current number
        const validPersonForNumber = availablePersons.find(idx => {
            const comp = convertPersonneIndexToComponents(idx);
            return comp.number === currentNumber.toString();
        });
        
        if (validPersonForNumber !== undefined) {
            // Found a valid person for the current number
            const comp = convertPersonneIndexToComponents(validPersonForNumber);
            $(`button[data-person="${comp.person}"]`).addClass('active');
        } else {
            // No valid person for current number, need to change number too
            $('.number-btn.active').removeClass('active');
            
            // Just pick the first available person
            const firstAvailable = availablePersons[0];
            const comp = convertPersonneIndexToComponents(firstAvailable);
            
            $(`button[data-person="${comp.person}"]`).addClass('active');
            $(`button[data-number="${comp.number}"]`).addClass('active');
        }
    }
    
    // When number changes, reevaluate available persons
    $('.number-btn').off('click.personHandler').on('click.personHandler', function() {
        handlePersonSelection(mode);
    });
}

async function nextQuestion() {
    // Hide feedback
    $('#feedback').hide();
    
    // Reset button state but keep the current selections
    $('.choice-btn').removeClass('disabled');
    
    // Show verify button and hide next question button
    toggleActionButtons(true);
    
    // Re-enable all form elements
    $('.choice-btn').prop('disabled', false);
    
    // Choose a random verb based on difficulty level
    const verbesDisponibles = await getVerbList(niveauDifficulte);
    verbeActuel = verbesDisponibles[Math.floor(Math.random() * verbesDisponibles.length)];
    
    // Get verb data via API
    verbData = await callAPI(verbeActuel);
    
    if (!verbData) {
        // In case of error with the API
        return;
    }
    
    // Handle infinitive display based on level
    $('#infinitive-verb').text(verbData.verb.infinitive);
    if (niveauDifficulte === "facile") {
        $('#infinitive-badge').show();
    } else {
        $('#infinitive-badge').hide();
    }
    
    // Get available forms for the current level
    const availableForms = await getAvailableForms(niveauDifficulte);

    console.log("Available forms:", availableForms);

    console.log(verbData);
    
    // Store and display only buttons for available modes
    let langData = await getLangData();
    availableModes = Object.keys(availableForms).filter(m =>
        Object.keys(verbData.moods).includes(langData.verbData.moodsNames[m].toLowerCase())
    );

    console.log("Available modes:", availableModes);
    
    // Hide all mode buttons first
    $('#mood-group button').hide();
    
    // Then show only available modes
    availableModes.forEach(mode => {
        $(`#mood-group button[data-value="${mode}"]`).show();
    });
    
    // If only one mode is available, select it automatically
    if (availableModes.length === 1) {
        const singleMode = availableModes[0];
        $(`#mood-group button[data-value="${singleMode}"]`).addClass('active');
        updateTimeButtons(singleMode);
    }
    
    // Choose a random mode from those available for this level
    if (availableModes.length === 0) {
        console.warn(`No mode available for this verb and difficulty level`);
        nextQuestion(); // Try another verb
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];

    console.log("Selected mode:", mode);
    const localMode = langData.verbData.moodsNames[mode].toLowerCase();
    console.log("Local mode:", localMode);

    console.log("Available tenses for this mode:", availableForms[mode]);
    
    // Choose a random tense for this mode
    const availableTenses = availableForms[mode].filter(t => 
        Object.keys(verbData.moods[localMode]).includes(t)
    );
    if (availableTenses.length === 0) {
        console.warn(`No tense available for verb ${verbeActuel} in mode ${mode}`);
        nextQuestion(); // Try another verb/mode
        return;
    }
    const temps = availableTenses[Math.floor(Math.random() * availableTenses.length)];
    
    // Check if the tense exists for this verb
    if (!verbData.moods[localMode][temps] || verbData.moods[localMode][temps].length === 0) {
        console.warn(`Tense ${temps} does not exist for verb ${verbeActuel} in mode ${mode}`);
        nextQuestion(); // Try another verb/mode/tense
        return;
    }
    
    // Get available persons for this mode
    const availablePersons = personnesParMode[mode] || [0, 1, 2, 3, 4, 5];
    
    // Choose a random person from the available ones
    const randomPersonIndex = Math.floor(Math.random() * availablePersons.length);
    const selectedPersonIndex = availablePersons[randomPersonIndex];
    
    // Store the correct answer with the standard person index
    currentAnswer = {
        personne: selectedPersonIndex,
        mode: mode,
        temps: temps
    };
    
    // Calculate the correct array index based on mode
    let arrayIndex;
    if (mode === "imperatif") {
        // For imperative, convert from the standard index to the array index
        arrayIndex = getImperativeArrayIndex(selectedPersonIndex);
    } else {
        // For other modes, the standard index is the array index
        arrayIndex = selectedPersonIndex;
    }
    
    // Check if arrayIndex is within bounds
    const maxIndex = verbData.moods[localMode][temps].length - 1;
    if (arrayIndex > maxIndex) {
        arrayIndex = maxIndex;
    }
    
    // Get the actual conjugation
    currentConjugation = verbData.moods[localMode][temps][arrayIndex];
    
    // Display the conjugation
    $('#verb-display').html(`<h2 class="highlight">${currentConjugation}</h2>`);
    
    // Pre-select correct person and number
    const components = convertPersonneIndexToComponents(selectedPersonIndex);
    
    // Reset current selections
    $('.person-btn').removeClass('active');
    $('.number-btn').removeClass('active');
}

function verifyAnswer() {
    if (!verbData) {
        alert("Veuillez d'abord charger un verbe");
        return;
    }

    totalQuestions++;
    $('#total').text(totalQuestions);
    
    // Get person selection from the combination of person and number
    const personSelection = $('.person-btn.active').data('person');
    const numberSelection = $('.number-btn.active').data('number');
    let selectedPerson;
    
    if (personSelection === undefined || numberSelection === undefined) {
        alert("Veuillez sélectionner une personne et un nombre");
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    } else {
        selectedPerson = getPersonneIndex(personSelection, numberSelection);
    }
    
    let selectedMood = $('.mood-btn.active').data('value');
    let selectedTense = $('#tense-container .active').data('value');
    
    // Check that all choices have been made
    if (!selectedMood || !selectedTense) {
        alert("Veuillez sélectionner un mode et un temps");
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    }
    
    // Check if the answer is correct - direct comparison with stored answer
    let isCorrect = 
        selectedPerson === currentAnswer.personne && 
        selectedMood === currentAnswer.mode && 
        selectedTense === currentAnswer.temps;
    
    if (isCorrect) {
        score++;
        streak++;
        $('#score').text(score);
        $('#streak').text(streak);
        
        // Format person name for display
        let personName;
        if (currentAnswer.mode !== "imperatif") {
            personName = personsNames[currentAnswer.personne];
        } else {
            // For imperative, use the custom display format based on the standard person index
            if (currentAnswer.personne === 1) {
                personName = "Tu (2ème personne singulier - impératif)";
            } else if (currentAnswer.personne === 3) {
                personName = "Nous (1ère personne pluriel - impératif)";
            } else if (currentAnswer.personne === 4) {
                personName = "Vous (2ème personne pluriel - impératif)";
            } else {
                // Fallback - should not happen with correct mapping
                personName = personsNames[currentAnswer.personne] + " (impératif)";
            }
        }
        
        $('#feedback').removeClass('incorrect').addClass('correct')
            .html(`<strong>Correct !</strong> "${currentConjugation}" est bien le ${nomsFrancaisTemps[currentAnswer.temps] || currentAnswer.temps} de "${verbeActuel}" au mode ${currentAnswer.mode}, forme ${personName}.`)
            .show();
    } else {
        streak = 0;
        $('#streak').text(streak);
        
        // Format person name for display
        let personName;
        if (currentAnswer.mode !== "imperatif") {
            personName = personsNames[currentAnswer.personne];
        } else {
            // For imperative, use the custom display format based on the standard person index
            if (currentAnswer.personne === 1) {
                personName = "Tu (2ème personne singulier - impératif)";
            } else if (currentAnswer.personne === 3) {
                personName = "Nous (1ère personne pluriel - impératif)";
            } else if (currentAnswer.personne === 4) {
                personName = "Vous (2ème personne pluriel - impératif)";
            } else {
                // Fallback - should not happen with correct mapping
                personName = personsNames[currentAnswer.personne] + " (impératif)";
            }
        }
        
        $('#feedback').removeClass('correct').addClass('incorrect')
            .html(`<strong>Incorrect.</strong> "${currentConjugation}" est le ${nomsFrancaisTemps[currentAnswer.temps] || currentAnswer.temps} de "${verbeActuel}" au mode ${currentAnswer.mode}, forme ${personName}.`)
            .show();
    }
    
    // Disable all form elements to prevent changes after submitting
    $('.choice-btn').prop('disabled', true);
    
    // Toggle buttons: hide verify, show next
    toggleActionButtons(false);
    
    // Update progress bar
    const pourcentage = Math.min(100, (score / objectifScore) * 100);
    $('#progress-bar').css('width', `${pourcentage}%`);
    
    // Check if goal is reached
    if (score >= objectifScore) {
        // Congratulate the user
        const message = `<div class="alert alert-success mt-3">
            <h4>Félicitations !</h4>
            <p>Vous avez atteint votre objectif de ${objectifScore} bonnes réponses !</p>
            <p>Score final : ${score}/${totalQuestions}</p>
            <button class="btn btn-success mt-2" onclick="location.reload()">Recommencer</button>
        </div>`;
        
        $('.game-container').append(message);
        $('#next-question').prop('disabled', true);
        $('#check-answer').prop('disabled', true);
    }
}

// Initialize the game
$(document).ready(function() {
    // Initially hide the next question button
    toggleActionButtons(true);
    
    // Configuration of event handlers
    $('.choice-btn').click(function() {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
    
    $('.difficulty-btn').click(function() {
        $('.difficulty-btn').removeClass('active');
        $(this).addClass('active');
        niveauDifficulte = $(this).data('level');
        
        // Update infinitive display based on level
        if (niveauDifficulte === "facile") {
            $('#infinitive-badge').show();
        } else {
            $('#infinitive-badge').hide();
        }
        
        // Generate a new question for the selected level
        nextQuestion();
    });

    $('.mood-btn').click(function() {
        const mode = $(this).data('value');
        updateTimeButtons(mode);
        handlePersonSelection(mode);
    });
    
    // Handle combination of person and number
    $('.person-btn, .number-btn').click(function() {
        // If imperative mode is selected, handle special cases
        if ($('.mood-btn.active').data('value') === "imperatif") {
            handlePersonSelection("imperatif");
        }
    });

    $('#check-answer').click(verifyAnswer);
    $('#next-question').click(nextQuestion);

    // Select some default values to avoid empty selections
    //$('button[data-person="0"]').addClass('active'); // 1st person
    //$('button[data-number="0"]').addClass('active'); // singular

    // Start the game
    nextQuestion();
});
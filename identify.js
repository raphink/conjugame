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
let objectifScore = 10; // Number of correct answers needed to "win"
let availableModes = []; // Array to store available modes for current verb

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
async function updateTimeButtons(mode) {
    const container = $('#tense-container');
    container.empty();

    if (!mode) return;
    let langData = await getLangData();

    let moodTenses = langData.verbData.moodsTenses[difficulty];
    let availableTenses = moodTenses[mode] || langData.verbData.moodsTenses.easy[mode];

    let localMode = langData.verbData.moodsNames[mode];

    // Filter tenses that exist for this verb
    if (verbData && verbData.moods[localMode]) {
        availableTenses = availableTenses.filter(t => 
            Object.keys(verbData.moods[localMode]).includes(t)
        );
    }

    availableTenses.forEach(async tense => {
        const localName = await getFullTenseName(tense);
        const btn = $(`<button type="button" class="btn btn-selector btn-temps choice-btn" data-value="${tense}">${localName}</button>`);
        btn.click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');

            $(this).parent().parent().find('.selected-option').text($(this).text());
            $('#tense-container').hide();
        });
        container.append(btn);
    });
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

    // Show all option buttons
    $('.selector-buttons').show();
    // Clear all text and classes from selected-option elements
    $('.selected-option').text("")
        .removeClass('correct incorrect');

    // Scroll back to the top of the page
    $('html, body').animate({ scrollTop: 0 }, 500);
    
    // Reset button state but keep the current selections
    $('.choice-btn').removeClass('disabled');
    
    // Show verify button and hide next question button
    toggleActionButtons(true);
    
    // Re-enable all form elements
    $('.choice-btn').prop('disabled', false);
    
    // Choose a random verb based on difficulty level
    const verbesDisponibles = await getVerbList(difficulty);
    verbeActuel = verbesDisponibles[Math.floor(Math.random() * verbesDisponibles.length)];
    
    // Get verb data via API
    verbData = await callAPI(verbeActuel);
    
    if (!verbData) {
        // In case of error with the API
        return;
    }
    
    // Handle infinitive display based on level
    $('#infinitive-verb').text(verbData.verb.infinitive);
    if (difficulty === "easy") {
        $('#infinitive-badge').show();
    } else {
        $('#infinitive-badge').hide();
    }
    
    // Get available forms for the current level
    const availableForms = await getAvailableForms(difficulty);

    // Store and display only buttons for available modes
    let langData = await getLangData();
    availableModes = Object.keys(availableForms).filter(m =>
        Object.keys(verbData.moods).includes(langData.verbData.moodsNames[m])
    );

    // Remove all mode buttons first
    $('#mood-group button').remove();

    // Generate buttons for available modes
    availableModes.forEach(async mode => {
        const localName = await localize(mode);
        const moodBtn = $(`<button type="button" class="btn btn-selector btn-mode choice-btn mood-btn" data-value="${mode}">${localName}</button>`);
        moodBtn.click(function () {
            const mode = $(this).data('value');
            $(this).addClass('active').siblings().removeClass('active');
            updateTimeButtons(mode);
            handlePersonSelection(mode);

            $(this).parent().parent().find('.selected-option').text($(this).text());
            $('#mood-group').hide();
            $('#tense-container').show();
        });
        // If only one mode is available, select it automatically
        if (availableModes.length === 1) {
            moodBtn.addClass('active');
            updateTimeButtons(mode);

            $('#mood-group').hide().parent().find('.selected-option').text(localName);
        }
        $('#mood-group').append(moodBtn);
    });
    
    // Choose a random mode from those available for this level
    if (availableModes.length === 0) {
        console.warn(`No mode available for this verb and difficulty level`);
        nextQuestion(); // Try another verb
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];

    const localMode = langData.verbData.moodsNames[mode] || mode;
    
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
    const availablePersons = personnesParMode[mode];
    
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
    if (mode === "imperative") {
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

async function verifyAnswer() {
    if (!verbData) {
        alert(await localize("loadVerbFirst"));
        return;
    }

    totalQuestions++;
    $('#total').text(totalQuestions);
    
    // Get person selection from the combination of person and number
    const personSelection = $('.person-btn.active').data('person');
    const numberSelection = $('.number-btn.active').data('number');
    let selectedPerson;
    
    if (personSelection === undefined || numberSelection === undefined) {
        alert(await localize("personNumberRequired"));
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
        let err = await localize("moodTenseRequired");
        alert(err);
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    }
    
    // Check if the answer is correct - direct comparison with stored answer
    let isCorrect = 
        selectedPerson === currentAnswer.personne && 
        selectedMood === currentAnswer.mode && 
        selectedTense === currentAnswer.temps;

    let localTenseName = await getFullTenseName(currentAnswer.temps);
    let personName = await getPersonFullName(currentAnswer.personne);
    
    // Add visual feedback to the selected options
    // Decompose the expected person and number from currentAnswer.personne
    const expectedComponents = convertPersonneIndexToComponents(currentAnswer.personne);
    const expectedPerson = expectedComponents.person;
    const expectedNumber = expectedComponents.number;
    
    // Ensure we're comparing the same types (string vs string)
    const personSelectionStr = String(personSelection);
    const numberSelectionStr = String(numberSelection);
    const expectedPersonStr = String(expectedPerson);
    const expectedNumberStr = String(expectedNumber);
    
    // Check if the selected person and number are correct individually
    const isPersonCorrect = personSelectionStr === expectedPersonStr;
    const isNumberCorrect = numberSelectionStr === expectedNumberStr;
    const isMoodCorrect = selectedMood === currentAnswer.mode;
    const isTenseCorrect = selectedTense === currentAnswer.temps;
    
    // Apply correct/incorrect classes to selected options
    // For person and number, if both are correct, then the selectedPerson index matches
    const personNumberCombinationCorrect = selectedPerson === currentAnswer.personne;
    
    // For person, mark as correct if the personNumberCombinationCorrect or just the person part is correct
    $('#person-group').closest('.selector-container').find('.selected-option')
        .addClass(isPersonCorrect ? 'correct' : 'incorrect');
    
    // For number, mark as correct if the personNumberCombinationCorrect or just the number part is correct  
    $('#number-group').closest('.selector-container').find('.selected-option')
        .addClass(isNumberCorrect ? 'correct' : 'incorrect');
    
    $('#mood-group').closest('.selector-container').find('.selected-option')
        .addClass(isMoodCorrect ? 'correct' : 'incorrect');
    
    $('#tense-container').closest('.selector-container').find('.selected-option')
        .addClass(isTenseCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        score++;
        streak++;
        $('#score').text(score);
        $('#streak').text(streak);
        
        
        let correctMsgTemplate = await localize("identifyCorrectMessage");
        let correctMsg = correctMsgTemplate.replace("{0}", currentConjugation)
            .replace("{1}", localTenseName)
            .replace("{2}", verbeActuel)
            .replace("{3}", await localize(currentAnswer.mode))
            .replace("{4}", personName);
        $('#feedback').removeClass('incorrect').addClass('correct')
            .html(correctMsg).show();
    } else {
        streak = 0;
        $('#streak').text(streak);
        
        // Format person name for display
        let incorrectMsgTemplate = await localize("identifyIncorrectMessage");
        let incorrectMsg = incorrectMsgTemplate.replace("{0}", currentConjugation)
            .replace("{1}", localTenseName)
            .replace("{2}", verbeActuel)
            .replace("{3}", await localize(currentAnswer.mode))
            .replace("{4}", personName);
        $('#feedback').removeClass('correct').addClass('incorrect')
            .html(incorrectMsg).show();
    }
    
    // Disable all form elements to prevent changes after submitting
    // but don't remove the active status
    $('.choice-btn').prop('disabled', true);
    
    // Toggle buttons: hide verify, show next
    toggleActionButtons(false);
    
    // Update progress bar
    const pourcentage = Math.min(100, (score / objectifScore) * 100);
    $('#progress-bar').css('width', `${pourcentage}%`);
    
    // Check if goal is reached
    if (score >= objectifScore) {
        // Congratulate the user
        const messageTemplate = await localize("identifyCongratulationsMessage");
        const message = messageTemplate.replace("{0}", objectifScore)
          .replace("{1}", score)
          .replace("{2}", totalQuestions);
        $('#feedback').removeClass('incorrect').addClass('correct')
            .html(message).show();
        
        $('#next-question').prop('disabled', true);
        $('#check-answer').prop('disabled', true);
    }
}

// Initialize the game
$(document).ready(async function() {
    // Initialize settings from URL parameters
    initializeSettings();

    // Initially hide the next question button
    toggleActionButtons(true);

    await translateUI();

    // Configuration of event handlers
    $('.choice-btn').click(function() {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');

        $(this).parent().parent().find('.selected-option').text($(this).text());
        $(this).parent().hide();
    });

    // Show button visibility when clicking on titles
    $('.selector-label').click(function() {
        $(this).parent().find('.selector-buttons').show();
    });
    
    // Language selection is now handled by languageFlags.js
    
    $('.difficulty-btn').click(function() {
        $('.difficulty-btn').removeClass('active');
        $(this).addClass('active');
        difficulty = $(this).data('level');
        
        // Update infinitive display based on level
        if (difficulty === "easy") {
            $('#infinitive-badge').show();
        } else {
            $('#infinitive-badge').hide();
        }
        
        // Update URL parameters with new difficulty
        updateUrlParameters();
        
        // Generate a new question for the selected level
        nextQuestion();
    });
    
    // Handle combination of person and number
    $('.person-btn, .number-btn').click(function() {
        // If imperative mode is selected, handle special cases
        if ($('.mood-btn.active').data('value') === "imperative") {
            handlePersonSelection("imperative");
        }
    });

    $('#check-answer').click(verifyAnswer);
    $('#next-question').click(nextQuestion);

    // Start the game
    nextQuestion();
});

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
let optionsConjugaison = []; // Conjugation options to display
let indexOptionCorrecte = -1; // Index of the correct option

// Function to generate incorrect but plausible options
async function genererOptionsIncorrectes(formeCorrecte, verbData, modeCorrect, tempsCorrect) {
    const options = [];
    const nombreOptions = 3; // Number of incorrect options to generate
    const personneIdx = currentAnswer.personne; // Person for which to generate options

    let langData = await getLangData();
    modeCorrectLocal = langData.verbData.moodsNames[modeCorrect].toLowerCase();
    
    // Strategy 1: Use the same person index but other tenses of the same mode
    const autresTompsMode = Object.keys(verbData.moods[modeCorrectLocal])
        .filter(t => t !== tempsCorrect);
        
    if (autresTompsMode.length > 0) {
        for (const autreTemps of autresTompsMode) {
            if (verbData.moods[modeCorrectLocal][autreTemps] &&
                verbData.moods[modeCorrectLocal][autreTemps].length > personneIdx) {
                const option = verbData.moods[modeCorrectLocal][autreTemps][personneIdx];
                if (option !== formeCorrecte && !options.includes(option) && options.length < nombreOptions) {
                    options.push(option);
                }
            }
        }
    }
    
    // Strategy 2: Use other modes but the same person
    const autresModes = Object.keys(verbData.moods)
        .filter(m => m !== modeCorrectLocal && m !== "participe" && m !== "infinitif");
        
    if (autresModes.length > 0 && options.length < nombreOptions) {
        for (const autreMode of autresModes) {
            const temps = Object.keys(verbData.moods[autreMode]);
            if (temps.length > 0) {
                for (const unTemps of temps) {
                    if (verbData.moods[autreMode][unTemps] && 
                        verbData.moods[autreMode][unTemps].length > personneIdx) {
                        const option = verbData.moods[autreMode][unTemps][personneIdx];
                        if (option !== formeCorrecte && !options.includes(option) && options.length < nombreOptions) {
                            options.push(option);
                        }
                    }
                }
            }
        }
    }

    // If we don't have enough options, create plausible variations
    if (options.length < nombreOptions) {
        // For first group verbs, create typical conjugation errors
        if (verbeActuel.endsWith("er") && !verbeActuel.endsWith("ier")) {
            // Common error: wrong ending
            let variation1 = formeCorrecte;
            if (formeCorrecte.endsWith("e")) {
                variation1 = formeCorrecte.substring(0, formeCorrecte.length - 1) + "es";
            } else if (formeCorrecte.endsWith("es")) {
                variation1 = formeCorrecte.substring(0, formeCorrecte.length - 2) + "e";
            } else if (formeCorrecte.endsWith("ons")) {
                variation1 = formeCorrecte.substring(0, formeCorrecte.length - 3) + "ez";
            } else if (formeCorrecte.endsWith("ez")) {
                variation1 = formeCorrecte.substring(0, formeCorrecte.length - 2) + "ons";
            }
            
            if (variation1 !== formeCorrecte && !options.includes(variation1) && options.length < nombreOptions) {
                options.push(variation1);
            }
        }
        
        // Create generic variations for any type of verb
        while (options.length < nombreOptions) {
            // Change the last vowel or add/remove a letter at the end
            let variation;
            const random = Math.random();
            
            if (random < 0.33 && formeCorrecte.length > 3) {
                // Change a letter in the middle
                const idx = Math.floor(Math.random() * (formeCorrecte.length - 2)) + 1;
                const lettresSubstitution = "aeiouy";
                const lettre = lettresSubstitution.charAt(Math.floor(Math.random() * lettresSubstitution.length));
                variation = formeCorrecte.substring(0, idx) + lettre + formeCorrecte.substring(idx + 1);
            } else if (random < 0.66) {
                // Modify the ending
                if (formeCorrecte.endsWith("s")) {
                    variation = formeCorrecte.substring(0, formeCorrecte.length - 1) + "t";
                } else if (formeCorrecte.endsWith("t")) {
                    variation = formeCorrecte.substring(0, formeCorrecte.length - 1) + "s";
                } else if (formeCorrecte.endsWith("e")) {
                    variation = formeCorrecte.substring(0, formeCorrecte.length - 1) + "és";
                } else {
                    variation = formeCorrecte + "s";
                }
            } else {
                // Double consonant or accent error
                if (formeCorrecte.includes("é")) {
                    variation = formeCorrecte.replace("é", "è");
                } else if (formeCorrecte.includes("è")) {
                    variation = formeCorrecte.replace("è", "é");
                } else {
                    // Find a consonant and double it
                    const consonnes = "bcdfghjklmnpqrstvwxz";
                    for (let i = 0; i < formeCorrecte.length; i++) {
                        if (consonnes.includes(formeCorrecte[i])) {
                            variation = formeCorrecte.substring(0, i + 1) + formeCorrecte[i] + formeCorrecte.substring(i + 1);
                            break;
                        }
                    }
                    
                    // If no consonant found, just add an 's'
                    if (!variation) {
                        variation = formeCorrecte + "s";
                    }
                }
            }
            
            if (variation !== formeCorrecte && !options.includes(variation) && variation.length > 1) {
                options.push(variation);
            } else {
                // If the variation is invalid, just add a simple option
                let fallback = formeCorrecte + "s";
                if (formeCorrecte.endsWith("s")) {
                    fallback = formeCorrecte.substring(0, formeCorrecte.length - 1);
                }
                
                if (fallback !== formeCorrecte && !options.includes(fallback)) {
                    options.push(fallback);
                } else {
                    // Last attempt: swap two letters
                    if (formeCorrecte.length > 3) {
                        const idx = Math.floor(Math.random() * (formeCorrecte.length - 3)) + 1;
                        fallback = formeCorrecte.substring(0, idx) + 
                                 formeCorrecte.charAt(idx + 1) + 
                                 formeCorrecte.charAt(idx) + 
                                 formeCorrecte.substring(idx + 2);
                        
                        if (fallback !== formeCorrecte && !options.includes(fallback)) {
                            options.push(fallback);
                        }
                    }
                }
            }
        }
    }
    
    // Limit options to 3 and return
    return options.slice(0, nombreOptions);
}

// Function to generate a new question
async function nextQuestion() {
    // Hide feedback
    $('#feedback').hide();

    // Scroll back to the top of the page
    $('html, body').animate({ scrollTop: 0 }, 'fast');
    
    // Reset selected options
    $('.verb-option').removeClass('selected');
    
    // Show verify button and hide next question button
    toggleActionButtons(true);
    
    // Re-enable all verb options
    $('.verb-option').prop('disabled', false);
    
    // Choose a random verb based on difficulty level
    const verbesDisponibles = await getVerbList(difficulty);
    verbeActuel = verbesDisponibles[Math.floor(Math.random() * verbesDisponibles.length)];
    
    // Get verb data via API
    verbData = await callAPI(verbeActuel);
    
    if (!verbData) {
        // In case of error with the API
        return;
    }
    
    // Display the verb infinitive
    $('#verb-infinitive').text(verbData.verb.infinitive);
    
    // Get available forms for the current level
    const availableForms = await getAvailableForms(difficulty);

    // Choose a random mode from those available for this level
    let langData = await getLangData();
    const modes = Object.keys(availableForms).filter(m => Object.keys(verbData.moods).includes(langData.verbData.moodsNames[m].toLowerCase()));
    if (modes.length === 0) {
        console.warn(`No mode available for this verb and difficulty level`);
        nextQuestion(); // Try another verb
        return;
    }
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const localMode = langData.verbData.moodsNames[mode].toLowerCase();

    // Choose a random tense for this mode
    const availableTenses = availableForms[mode].filter(t => Object.keys(verbData.moods[localMode]).includes(t));
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
    
    // Store the correct answer
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
    
    // Display information about the requested form
    const verbFormTmpl = await localize("conjugateTo");
    const verbForm = verbFormTmpl.replace("{0}", await getFullTenseName(temps))
        .replace("{1}", await localize(mode))
        .replace("{2}", await getPersonFullName(selectedPersonIndex));
    $('.verb-form-info').html(verbForm);

    // Get the correct conjugation
    currentConjugation = verbData.moods[localMode][temps][arrayIndex];

    // Generate incorrect options
    optionsConjugaison = await genererOptionsIncorrectes(currentConjugation, verbData, mode, temps);
    
    // Shuffle options
    indexOptionCorrecte = Math.floor(Math.random() * (optionsConjugaison.length + 1));
    optionsConjugaison.splice(indexOptionCorrecte, 0, currentConjugation);
    
    // Display options
    const optionsContainer = $('#verb-options');
    optionsContainer.empty();
    
    optionsConjugaison.forEach((option, index) => {
        optionsContainer.append(`
            <div class="verb-option" data-index="${index}">
                ${option}
            </div>
        `);
    });
}

// Function to check the answer
async function verifyAnswer() {
    if (!verbData) {
        let err = await localize("loadVerbFirst");
        alert(err);
        return;
    }

    totalQuestions++;
    $('#total').text(totalQuestions);
    
    const optionSelectionneeIndex = $('.verb-option.selected').data('index');
    
    // Check that an option has been selected
    if (optionSelectionneeIndex === undefined) {
        let err = await localize("chooseConjugation");
        alert(err);
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    }
    
    let isCorrect = optionSelectionneeIndex === indexOptionCorrecte;
    
    if (isCorrect) {
        score++;
        streak++;
        $('#score').text(score);
        $('#streak').text(streak);
        
        let mode =  await localize(currentAnswer.mode);
        let temps = currentAnswer.temps;
        const messageTmpl = await localize("chooseCorrectMessage");
        const message = messageTmpl.replace("{0}", currentConjugation)
            .replace("{1}", verbeActuel)
            .replace("{2}", temps)
            .replace("{3}", mode)
            .replace("{4}", await getPersonFullName(currentAnswer.personne));
        $('#feedback').removeClass('incorrect').addClass('correct')
            .html(message).show();
    } else {
        streak = 0;
        $('#streak').text(streak);
        
        const messageTmpl = await localize("chooseIncorrectMessage");
        const message = messageTmpl.replace("{0}", currentConjugation);
        $('#feedback').removeClass('correct').addClass('incorrect')
            .html(message).show();
    }
    
    // Disable verb options to prevent changes after submitting
    $('.verb-option').prop('disabled', true);
    $('.verb-option').css('pointer-events', 'none');
    
    // Toggle buttons: hide verify, show next
    toggleActionButtons(false);
    
    // Update progress bar
    const pourcentage = Math.min(100, (score / objectifScore) * 100);
    $('#progress-bar').css('width', `${pourcentage}%`);
    
    // Check if goal is reached
    if (score >= objectifScore) {
        // Congratulate the user
        const messageTmpl = await localize("chooseCongratulationsMessage");
        const message = messageTmpl.replace("{0}", objectifScore)
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
    
    // Handle language change
    $('#language-selector').change(function() {
        const selectedLang = $(this).val();
        changeLanguage(selectedLang);
    });
    
    // Difficulty level management
    $('.difficulty-btn').click(function() {
        $('.difficulty-btn').removeClass('active');
        $(this).addClass('active');
        difficulty = $(this).data('level');
        
        // Update URL parameters with new difficulty
        updateUrlParameters();
        
        // Generate a new question for the selected level
        nextQuestion();
    });
    
    // Conjugation options management
    $(document).on('click', '.verb-option', function() {
        $('.verb-option').removeClass('selected');
        $(this).addClass('selected');
    });

    $('#check-answer').click(verifyAnswer);
    $('#next-question').click(nextQuestion);

    // Start the game
    nextQuestion();
});

// Game state
let score = 0;
let totalQuestions = 0;
let streak = 0;
let verbeActuel = "";
let conjugaisonActuelle = "";
let donneesDuVerbe = null;
let reponseActuelle = {
    personne: null,
    mode: "",
    temps: ""
};
let niveauDifficulte = "facile";
let objectifScore = 10; // Number of correct answers needed to "win"
let availableModes = []; // Array to store available modes for current verb

// Function to update tense buttons based on selected mode
function mettreAJourBoutonsTemps(mode) {
    const container = $('#tense-container');
    container.empty();

    if (!mode) return;

    let tempsDisponibles;
    switch (niveauDifficulte) {
        case "facile":
            tempsDisponibles = modesTempsFaciles[mode] || [];
            break;
        case "moyen":
            tempsDisponibles = modesTempsIntermediaires[mode] || [];
            break;
        case "difficile":
            tempsDisponibles = modesTempsAvances[mode] || [];
            break;
        default:
            tempsDisponibles = modesTempsFaciles[mode] || [];
    }

    // Filter tenses that exist for this verb
    if (donneesDuVerbe && donneesDuVerbe.moods[mode]) {
        tempsDisponibles = tempsDisponibles.filter(t => 
            Object.keys(donneesDuVerbe.moods[mode]).includes(t)
        );
    }

    // If only one tense is available, select it automatically
    if (tempsDisponibles.length === 1) {
        const temps = tempsDisponibles[0];
        const nomFrancais = nomsFrancaisTemps[temps] || temps;
        container.append(`
            <button type="button" class="btn btn-selector btn-temps choice-btn active" data-value="${temps}">
                ${nomFrancais}
            </button>
        `);
    } else {
        // Otherwise add all available tenses as buttons
        tempsDisponibles.forEach(temps => {
            const nomFrancais = nomsFrancaisTemps[temps] || temps;
            container.append(`
                <button type="button" class="btn btn-selector btn-temps choice-btn" data-value="${temps}">
                    ${nomFrancais}
                </button>
            `);
        });

        // Add event listeners for new buttons
        $('#tense-container .choice-btn').click(function() {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
        });
    }
}

// Function to convert person and number selections to person index
function getPersonneIndex(personSelection, numberSelection) {
    const personInt = parseInt(personSelection);
    const numberInt = parseInt(numberSelection);
    
    if (numberInt === 0) { // Singular
        return personInt;
    } else { // Plural
        return personInt + 3;
    }
}

// Handle imperative mode which has fewer persons
function handleImperativeMode(isImperative) {
    if (isImperative) {
        // Imperative only has 2nd person singular, 1st plural, and 2nd plural
        // Hide 1st and 3rd person singular, and 3rd person plural
        $('button[data-person="0"]').prop('disabled', true);
        $('button[data-person="2"]').prop('disabled', true);
        
        // Only allow 2nd person singular, 1st & 2nd person plural
        if ($('.person-btn.active').data('person') === "0" || 
            $('.person-btn.active').data('person') === "2") {
            // Reset selection if currently on a disabled person
            $('.person-btn.active').removeClass('active');
            // Select 2nd person by default for imperative
            $('button[data-person="1"]').addClass('active');
        }
        
        // For plural, only allow 1st and 2nd person
        if ($('.number-btn.active').data('number') === "1" && 
            $('.person-btn.active').data('person') === "2") {
            // Reset if 3rd person plural
            $('.person-btn.active').removeClass('active');
            // Default to 1st person plural
            $('button[data-person="0"]').addClass('active');
        }
    } else {
        // Enable all person buttons for non-imperative modes
        $('.person-btn').prop('disabled', false);
    }
}


async function questionSuivante() {
    // Hide feedback
    $('#feedback').hide();
    
    // Reset button state
    $('.choice-btn').removeClass('active');
    
    // Show verify button and hide next question button
    toggleActionButtons(true);
    
    // Re-enable all form elements
    $('.choice-btn').prop('disabled', false);
    
    // Choose a random verb based on difficulty level
    const verbesDisponibles = obtenirListeVerbes(niveauDifficulte);
    verbeActuel = verbesDisponibles[Math.floor(Math.random() * verbesDisponibles.length)];
    
    // Get verb data via API
    donneesDuVerbe = await appelerAPI(verbeActuel);
    
    if (!donneesDuVerbe) {
        // In case of error with the API
        return;
    }
    
    // Handle infinitive display based on level
    $('#infinitive-verb').text(donneesDuVerbe.verb.infinitive);
    if (niveauDifficulte === "facile") {
        $('#infinitive-badge').show();
    } else {
        $('#infinitive-badge').hide();
    }
    
    // Get available forms for the current level
    const formesDisponibles = obtenirFormesDisponibles(niveauDifficulte);
    
    // Store and display only buttons for available modes
    availableModes = Object.keys(formesDisponibles).filter(m => 
        Object.keys(donneesDuVerbe.moods).includes(m)
    );
    
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
        mettreAJourBoutonsTemps(singleMode);
        handleImperativeMode(singleMode === "imperatif");
    }
    
    // Choose a random mode from those available for this level
    if (availableModes.length === 0) {
        console.warn(`No mode available for this verb and difficulty level`);
        questionSuivante(); // Try another verb
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    
    // Choose a random tense for this mode
    const tempsDisponibles = formesDisponibles[mode].filter(t => 
        Object.keys(donneesDuVerbe.moods[mode]).includes(t)
    );
    if (tempsDisponibles.length === 0) {
        console.warn(`No tense available for verb ${verbeActuel} in mode ${mode}`);
        questionSuivante(); // Try another verb/mode
        return;
    }
    const temps = tempsDisponibles[Math.floor(Math.random() * tempsDisponibles.length)];
    
    // Check if the tense exists for this verb
    if (!donneesDuVerbe.moods[mode][temps] || donneesDuVerbe.moods[mode][temps].length === 0) {
        console.warn(`Tense ${temps} does not exist for verb ${verbeActuel} in mode ${mode}`);
        questionSuivante(); // Try another verb/mode/tense
        return;
    }
    
    // Choose a random person (considering that imperative only has 3 persons)
    let maxPersonne = donneesDuVerbe.moods[mode][temps].length - 1;
    let indicePersonne;
    
    if (mode === "imperatif") {
        // Imperative only has 2nd singular, 1st plural, 2nd plural (typically indices 0, 1, 2)
        // Map these to our standard array: tu(1-0), nous(0-1), vous(1-1)
        const availableImperativeIndices = [1, 3, 4]; // 2nd sing, 1st plur, 2nd plur
        indicePersonne = availableImperativeIndices[Math.floor(Math.random() * 3)];
        
        // Adjust if the verb's imperative doesn't follow standard pattern
        if (indicePersonne > maxPersonne) {
            indicePersonne = Math.floor(Math.random() * (maxPersonne + 1));
        }
    } else {
        indicePersonne = Math.floor(Math.random() * (maxPersonne + 1));
    }
    
    // Store the correct answer
    reponseActuelle = {
        personne: indicePersonne,
        mode: mode,
        temps: temps
    };
    
    // Get the correct conjugation
    conjugaisonActuelle = donneesDuVerbe.moods[mode][temps][indicePersonne];
    
    // Display the conjugation
    $('#verb-display').html(`<h2 class="highlight">${conjugaisonActuelle}</h2>`);
    
    // Default selection for person and number
    $('button[data-person="0"]').addClass('active'); // 1st person
    $('button[data-number="0"]').addClass('active'); // singular
}

function verifierReponse() {
    if (!donneesDuVerbe) {
        alert("Veuillez d'abord charger un verbe");
        return;
    }

    totalQuestions++;
    $('#total').text(totalQuestions);
    
    // Get person selection from the combination of person and number
    const personSelection = $('.person-btn.active').data('person');
    const numberSelection = $('.number-btn.active').data('number');
    let personneSelectionnee;
    
    if (personSelection === undefined || numberSelection === undefined) {
        alert("Veuillez sélectionner une personne et un nombre");
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    } else {
        personneSelectionnee = getPersonneIndex(personSelection, numberSelection);
    }
    
    let modeSelectionne = $('.mood-btn.active').data('value');
    let tempsSelectionne = $('#tense-container .active').data('value');
    
    // Check that all choices have been made
    if (!modeSelectionne || !tempsSelectionne) {
        alert("Veuillez sélectionner un mode et un temps");
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    }
    
    let estCorrect = 
        personneSelectionnee === reponseActuelle.personne && 
        modeSelectionne === reponseActuelle.mode && 
        tempsSelectionne === reponseActuelle.temps;
    
    if (estCorrect) {
        score++;
        streak++;
        $('#score').text(score);
        $('#streak').text(streak);
        
        // Format person name for display
        let personneNom = "?";
        if (reponseActuelle.mode !== "imperatif") {
            personneNom = personnesNoms[reponseActuelle.personne];
        } else {
            // For imperative, display is different
            const personnesImperatif = ["Tu", "Nous", "Vous"];
            // Map standard indices to imperative-specific indices
            let imperativeIndex;
            if (reponseActuelle.personne === 1) imperativeIndex = 0;      // tu
            else if (reponseActuelle.personne === 3) imperativeIndex = 1; // nous
            else if (reponseActuelle.personne === 4) imperativeIndex = 2; // vous
            else imperativeIndex = 0; // fallback
            
            personneNom = `${personnesImperatif[imperativeIndex]} (impératif)`;
        }
        
        $('#feedback').removeClass('incorrect').addClass('correct')
            .html(`<strong>Correct !</strong> "${conjugaisonActuelle}" est bien le ${nomsFrancaisTemps[reponseActuelle.temps] || reponseActuelle.temps} de "${verbeActuel}" au mode ${reponseActuelle.mode}, forme ${personneNom}.`)
            .show();
    } else {
        streak = 0;
        $('#streak').text(streak);
        
        // Format person name for display
        let personneNom = "?";
        if (reponseActuelle.mode !== "imperatif") {
            personneNom = personnesNoms[reponseActuelle.personne];
        } else {
            // For imperative, display is different
            const personnesImperatif = ["Tu", "Nous", "Vous"];
            // Map standard indices to imperative-specific indices
            let imperativeIndex;
            if (reponseActuelle.personne === 1) imperativeIndex = 0;      // tu
            else if (reponseActuelle.personne === 3) imperativeIndex = 1; // nous
            else if (reponseActuelle.personne === 4) imperativeIndex = 2; // vous
            else imperativeIndex = 0; // fallback
            
            personneNom = `${personnesImperatif[imperativeIndex]} (impératif)`;
        }
        
        $('#feedback').removeClass('correct').addClass('incorrect')
            .html(`<strong>Incorrect.</strong> "${conjugaisonActuelle}" est le ${nomsFrancaisTemps[reponseActuelle.temps] || reponseActuelle.temps} de "${verbeActuel}" au mode ${reponseActuelle.mode}, forme ${personneNom}.`)
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
            <h4>🎉 Félicitations !</h4>
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
        questionSuivante();
    });

    $('.mood-btn').click(function() {
        const mode = $(this).data('value');
        mettreAJourBoutonsTemps(mode);
        handleImperativeMode(mode === "imperatif");
    });
    
    // Handle combination of person and number
    $('.person-btn, .number-btn').click(function() {
        // If imperative mode is selected, handle special cases
        if ($('.mood-btn.active').data('value') === "imperatif") {
            handleImperativeMode(true);
        }
    });

    $('#check-answer').click(verifierReponse);
    $('#next-question').click(questionSuivante);

    // Start the game
    questionSuivante();
});
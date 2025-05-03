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

    tempsDisponibles.forEach(temps => {
        const nomFrancais = nomsFrancaisTemps[temps] || temps;
        container.append(`<button type="button" class="btn btn-outline-secondary choice-btn" data-value="${temps}">${nomFrancais}</button>`);
    });

    // Add event listeners for new buttons
    $('#tense-container .choice-btn').click(function() {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
}

async function questionSuivante() {
    // Hide feedback
    $('#feedback').hide();
    
    // Reset button state
    $('.choice-btn').removeClass('active');
    
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
    
    // Display only buttons for available modes
    $('#mood-group button').hide(); // Hide all mode buttons
    Object.keys(formesDisponibles).forEach(mode => {
        $(`#mood-group button[data-value="${mode}"]`).show();
    });
    
    // Choose a random mode from those available for this level
    const modes = Object.keys(formesDisponibles).filter(m => Object.keys(donneesDuVerbe.moods).includes(m));
    if (modes.length === 0) {
        console.warn(`No mode available for this verb and difficulty level`);
        questionSuivante(); // Try another verb
        return;
    }
    const mode = modes[Math.floor(Math.random() * modes.length)];
    
    // Choose a random tense for this mode
    const tempsDisponibles = formesDisponibles[mode].filter(t => Object.keys(donneesDuVerbe.moods[mode]).includes(t));
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
    const indicePersonne = Math.floor(Math.random() * (maxPersonne + 1));
    
    // Store the correct answer
    reponseActuelle = {
        personne: indicePersonne,
        mode: mode,
        temps: temps
    };
    
    // Get the correct conjugation
    conjugaisonActuelle = donneesDuVerbe.moods[mode][temps][indicePersonne];
    
    // Display the conjugation
    $('#verb-display').html(`<span class="highlight">${conjugaisonActuelle}</span>`);
}

function verifierReponse() {
    if (!donneesDuVerbe) {
        alert("Veuillez d'abord charger un verbe");
        return;
    }

    totalQuestions++;
    $('#total').text(totalQuestions);
    
    let personneSelectionnee = $('#person-group .active').data('value');
    let modeSelectionne = $('#mood-group .active').data('value');
    let tempsSelectionne = $('#tense-container .active').data('value');
    
    // Check that all choices have been made
    if (personneSelectionnee === undefined || !modeSelectionne || !tempsSelectionne) {
        alert("Veuillez sélectionner une personne, un mode et un temps");
        totalQuestions--; // Cancel the increment
        $('#total').text(totalQuestions);
        return;
    }
    
    // Convert person to number for comparison
    personneSelectionnee = parseInt(personneSelectionnee);
    
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
            personneNom = `${personnesImperatif[reponseActuelle.personne]} (impératif)`;
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
            personneNom = `${personnesImperatif[reponseActuelle.personne]} (impératif)`;
        }
        
        $('#feedback').removeClass('correct').addClass('incorrect')
            .html(`<strong>Incorrect.</strong> "${conjugaisonActuelle}" est le ${nomsFrancaisTemps[reponseActuelle.temps] || reponseActuelle.temps} de "${verbeActuel}" au mode ${reponseActuelle.mode}, forme ${personneNom}.`)
            .show();
    }
    
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

    $('#mood-group .choice-btn').click(function() {
        const mode = $(this).data('value');
        mettreAJourBoutonsTemps(mode);
    });

    $('#check-answer').click(verifierReponse);
    $('#next-question').click(questionSuivante);

    // Start the game
    questionSuivante();
});
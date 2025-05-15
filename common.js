// Verbs by difficulty level
const verbesFaciles = [
    "être", "avoir", "faire", "dire", "aller", "voir", "parler", "aimer", "manger", "finir", "jouer", "venir", "prendre",
    "donner", "appeler", "attendre", "comprendre", "connaître", "croire", "demander", "entendre", "écrire", "étudier",
    "habiter", "lire", "mettre", "montrer", "ouvrir", "penser", "perdre", "porter", "pouvoir", "regarder", "rendre",
    "répondre", "savoir", "sentir", "sortir", "suivre", "travailler", "trouver", "vendre", "vivre", "vouloir",
    "acheter", "arriver", "chanter", "choisir", "commencer", "compter", "courir", "découvrir", "descendre", "dessiner",
    "dormir", "écouter", "envoyer", "espérer", "fermer", "imaginer", "inviter", "laisser", "marcher", "monter",
    "offrir", "oublier", "partir", "passer", "préférer", "préparer", "rentrer", "rester", "revenir", "sembler"
];

const verbesMoyens = [
    "pouvoir", "vouloir", "savoir", "devoir", "croire", "mettre", "lire", "écrire", "comprendre", "attendre",
    "entendre", "partir", "sortir", "sentir", "suivre", "vivre", "boire", "envoyer", "recevoir", "appeler",
    "apercevoir", "apparaître", "apprendre", "atteindre", "combattre", "conduire", "construire", "contenir", "contribuer", "convenir",
    "correspondre", "couvrir", "craindre", "décevoir", "défendre", "définir", "détruire", "disparaître", "distraire", "entretenir",
    "entreprendre", "équivaloir", "établir", "éteindre", "étendre", "fournir", "fuir", "inclure", "inscrire", "interrompre",
    "intervenir", "introduire", "maintenir", "mentir", "obtenir", "offrir", "ouvrir", "paraître", "parcourir", "parvenir",
    "percevoir", "peindre", "permettre", "plaindre", "plaire", "poursuivre", "prévoir", "produire", "promettre", "reconnaître",
    "recourir", "réduire", "rejoindre", "remettre", "remplir", "répandre", "répondre", "résoudre", "retenir", "réunir",
    "revenir", "rompre", "servir", "souffrir", "sourire", "soutenir", "suffire", "surprendre", "survivre", "taire",
    "tendre", "traduire", "transmettre", "valoir", "vendre", "vêtir"
];

const verbesDifficiles = [
    "courir", "mourir", "tenir", "venir", "acquérir", "asseoir", "battre", "connaître", "craindre", "croître",
    "cueillir", "falloir", "joindre", "naître", "plaire", "pleuvoir", "résoudre", "rire", "suffire", "vaincre",
    "abstraire", "accroître", "adjoindre", "advenir", "assaillir", "astreindre", "circonvenir", "clore", "comparaître", "complaire",
    "compromettre", "concevoir", "conclure", "concourir", "conquérir", "convaincre", "découdre", "décrire", "déduire", "défaire",
    "déplaire", "déteindre", "devenir", "disconvenir", "disjoindre", "dissoudre", "distraire", "ébattre", "échoir", "élire",
    "émettre", "émoudre", "enceindre", "enclore", "encourir", "endormir", "enfuir", "enjoindre", "entendre", "entremettre",
    "entrevoir", "entrouvrir", "envahir", "équivaloir", "exclure", "extraire", "faillir", "feindre", "forfaire", "gésir",
    "haïr", "inscrire", "instruire", "interdire", "interjeter", "luire", "malfaire", "médire", "méfaire", "méprendre",
    "mouvoir", "nuire", "occlure", "occire", "omettre", "paître", "paraître", "parfaire", "parvenir", "percevoir",
    "poindre", "pourfendre", "pourvoir", "préconcevoir", "prédire", "prescrire", "prévaloir", "prévoir", "promouvoir", "proscrire",
    "provenir", "rabattre", "rasseoir", "rassortir", "recevoir", "reconquérir", "recoudre", "recourir", "recueillir", "redevenir",
    "redire", "réélire", "rejoindre", "relire", "reluire", "remettre", "remoudre", "renaître", "renvoyer", "repaître",
    "requérir", "resservir", "ressortir", "restreindre", "retenir", "revaloir", "revêtir", "revivre", "saillir", "satisfaire",
    "secourir", "seoir", "soumettre", "sourdre", "soustraire", "subvenir", "surproduire", "surseoir", "survenir", "taire",
    "teindre", "tressaillir", "valoir", "vouloir"
];

// Define available tenses by mode and difficulty level
const modesTempsFaciles = {
    "indicatif": ["présent", "futur-simple", "passé-composé", "imparfait"]
};

const modesTempsIntermediaires = {
    "indicatif": ["présent", "futur-simple", "passé-composé", "imparfait", "plus-que-parfait", "passé-simple"],
    "subjonctif": ["présent"],
    "conditionnel": ["présent"],
    "imperatif": ["imperatif-présent"]
};

const modesTempsAvances = {
    "indicatif": ["présent", "futur-simple", "passé-composé", "imparfait", "plus-que-parfait", "passé-simple", "futur-antérieur", "passé-antérieur"],
    "subjonctif": ["présent", "passé", "imparfait", "plus-que-parfait"],
    "conditionnel": ["présent", "passé"],
    "imperatif": ["imperatif-présent", "imperatif-passé"]
};

// French names of tenses for display
const nomsFrancaisTemps = {
    "présent": "Présent",
    "futur-simple": "Futur simple",
    "passé-composé": "Passé composé",
    "imparfait": "Imparfait",
    "plus-que-parfait": "Plus-que-parfait",
    "passé-simple": "Passé simple",
    "futur-antérieur": "Futur antérieur",
    "passé-antérieur": "Passé antérieur",
    "passé": "Passé",
    "imperatif-présent": "Présent",
    "imperatif-passé": "Passé"
};

// Names of persons for display
const personnesAbrégées = [
    "1ère (je)", "2ème (tu)", "3ème (il/elle)", "1ère (nous)", "2ème (vous)", "3ème (ils/elles)"
];

const personnesImperatif = ["2ème (tu)", "1ère (nous)", "2ème (vous)"];

// Names of persons for result display
const personnesNoms = [
    "Je (1ère personne singulier)",
    "Tu (2ème personne singulier)",
    "Il/Elle (3ème personne singulier)",
    "Nous (1ère personne pluriel)",
    "Vous (2ème personne pluriel)",
    "Ils/Elles (3ème personne pluriel)"
];

// API configuration
const PROXY_URL = "https://api.allorigins.win/raw?url=";
const API_BASE_URL = "http://verbe.cc/verbecc/conjugate/fr/";

// Function to call the Verbecc API using CORS proxy
async function appelerAPI(verbe) {
    $('#loading').show();
    $('#verb-display').hide();
    
    const maxAttempts = 3;
    let attempts = 0;
    const baseRetryInterval = 2000; // 2 seconds initial retry interval
    
    while (attempts < maxAttempts) {
        try {
            // Use CORS proxy to access the HTTP API
            const apiUrl = `${PROXY_URL}${encodeURIComponent(API_BASE_URL + encodeURIComponent(verbe))}`;
            
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

// Get verb list based on difficulty level
function obtenirListeVerbes(niveauDifficulte) {
    switch(niveauDifficulte) {
        case "facile":
            return verbesFaciles;
        case "moyen":
            return [...verbesFaciles, ...verbesMoyens];
        case "difficile":
            return [...verbesFaciles, ...verbesMoyens, ...verbesDifficiles];
        default:
            return verbesFaciles;
    }
}

// Get available forms based on difficulty level
function obtenirFormesDisponibles(niveauDifficulte) {
    switch (niveauDifficulte) {
        case "facile":
            return modesTempsFaciles;
        case "moyen":
            return modesTempsIntermediaires;
        case "difficile":
            return modesTempsAvances;
        default:
            return modesTempsFaciles;
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
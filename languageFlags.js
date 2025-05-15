// Language flag functionality
$(document).ready(function() {
    // Initialize language flags
    updateLanguageSelection();
    
    // Set up event listeners for flag clicks
    $(document).on('click', '.language-flag', function() {
        const selectedLang = $(this).data('lang');
        changeLanguage(selectedLang);
    });
    
    // Update all navigation links with current parameters on page load
    updateNavigationLinks();
});

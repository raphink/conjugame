// Language flag functionality
$(document).ready(function() {
    // Initialize language flags
    updateLanguageSelection();
    
    // Set up event listeners for flag clicks
    $(document).on('click', '.language-flag', async function() {
        const selectedLang = $(this).data('lang');
        
        // First, log the state before the change
        console.log(`Before change - Current language: ${lang}`);
        console.log("Before change - Navigation buttons:");
        $('.game-mode-links a').each(function() {
            const btnText = $(this).text();
            const btnLink = $(this).attr('href');
            console.log(`- Button: "${btnText}" links to ${btnLink}`);
        });
        
        // Change the language (await the async function)
        await changeLanguage(selectedLang);
        
        // After change, log the updated state
        console.log(`After change - Language changed to: ${selectedLang}`);
        console.log("After change - Navigation buttons:");
        $('.game-mode-links a').each(function() {
            const btnText = $(this).text();
            const btnLink = $(this).attr('href');
            console.log(`- Button: "${btnText}" links to ${btnLink}`);
        });
    });
    
    // Initial update of navigation links with current parameters on page load
    updateNavigationLinks();
});

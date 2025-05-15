// Fix for flag-colors visibility on mobile
$(document).ready(function() {
    // Add a non-breaking space to flag-colors div to ensure it's displayed
    if ($('.flag-colors').length && $('.flag-colors').is(':empty')) {
        $('.flag-colors').html('&nbsp;');
        
        // Double-check that the flag-colors div has appropriate height
        if ($('.flag-colors').height() < 8) {
            $('.flag-colors').css({
                'height': '8px',
                'min-height': '8px',
                'display': 'block',
                'visibility': 'visible'
            });
        }
    }
});

/*!
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = "tagInput",
        defaults = {
            allowDuplicates: false,
            typeahead: false,
            typeaheadOptions: {}
        },
        // Lookup variables to make keycode handling more readable
        KEYCODES = {
            ENTER: 13,
            TAB: 9,
            BACKSPACE: 8
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        
        this.options = $.extend({}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    // Remove all entries from an array with a specific value
    var _cleanArray = function(arr, deleteValue) {
        // If no value has been specified, remove all empty strings
        if(typeof deleteValue === 'undefined')
            deleteValue = '';

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == deleteValue) {         
                arr.splice(i, 1);
                i--;
            }
        }

        return arr;
    };

    // Function to create the HTML representing the tag input control
    var _createTagInput = function(input) {
        var tags = _cleanArray(input.val().split('|'));
        var tagLabels = $.map(tags, function(item, index) {
            return '<span class="label label-primary">' + item + ' <span class="glyphicon glyphicon-remove"></span></span>';
        }).join('');

        return $('<div class="mab-jquery-taginput' + ((input.attr('class')) ? ' ' + input.attr('class') : '') + '">' + 
                 tagLabels + 
                 '<input class="mab-jquery-taginput-data" type="hidden" name="' + input.attr('name') + '" id="' + input.attr('name') + '" value="' + input.val() + '">' +
                 '<input class="mab-jquery-taginput-input" type="text" placeholder="' + input.attr('placeholder') + '">' + 
                 '</div>');
    };

    // Shortcut function to clear text from the tag input and close the typeahead
    var _resetTagInput = function(input, usingTypeAhead) {
        if(usingTypeAhead) {
            input.typeahead('val', '');
            input.typeahead('close');
        } else {
            input.val('');
        }
    };

    Plugin.prototype = {

        init: function() {
            // Replace the original input with the tag input HTML
            var originalInput = $(this.element);
            var tagInputContainer = _createTagInput(originalInput);
            originalInput.replaceWith(tagInputContainer);

            // Boolean to determine whether typeahead.js integration is enabled
            var usingTypeAhead = this.options.typeahead;
            // boolean to determine whether the same tag can be added to the input more than once
            var allowDuplicates = this.options.allowDuplicates;
            // The text input element within the tag control
            var tagInput = tagInputContainer.find('.mab-jquery-taginput-input');
            // The hidden input which is used to store selected tag data
            var tagData = tagInputContainer.find('.mab-jquery-taginput-data');
            // Keep hold of the original placeholder text
            var originalPlaceHolder = tagInput.attr('placeholder');

            // Set up the typeahead if specified
            if(usingTypeAhead)
                tagInput.typeahead(null, this.options.typeaheadOptions);
                
            // Handle keydown events on the tag text input
            tagInput.on('keydown', function(e) {
                // Cache the reference to the input
                var input = $(this);
                // If enter is hit, and the input is *not* empty (if the input *is* empty, 
                // we don't want to prevent the default action, which is submitting the form)
                if(e.keyCode == KEYCODES.ENTER && $.trim(input.val()) !== '') {
                    // Stop the form being submitted and prevent event bubbling
                    e.preventDefault();
                    e.stopPropagation();
                    // Don't allow the addition of duplicate tags unless explicitly specified
                    if(allowDuplicates || ($.inArray(input.val(), tagData.val().split('|')) === -1)) {
                        // Insert a new tag span before the hidden input
                        tagData.before('<span class="label label-primary">' + input.val() + ' <span class="glyphicon glyphicon-remove"></span></span>');
                        // Concatenate the existing tag data string with the new tag
                        tagData.val(tagData.val() + '|' + input.val());
                        // Reset the tag input
                        _resetTagInput(input, usingTypeAhead);
                        input.attr('placeholder', '');
                    }
                }
                // If backspace is hit and there's nothing in the input (if the input *isn't* empty, 
                // we don't want to prevent the default action, which is deleting a character)
                if(e.keyCode == KEYCODES.BACKSPACE && $.trim(input.val()) === '') {
                    // Remove the last tag span before the hidden data input
                    tagData.prev('span.label').remove();
                    // Split the data into an array, remove the last element and join it
                    // back together again with pipe characters
                    tagData.val(tagData.val().split('|').slice(0, -1).join('|'));
                    // Reset the tag input
                    _resetTagInput(input, usingTypeAhead);
                    if(tagData.val() === '')
                        input.attr('placeholder', originalPlaceHolder);
                }
            });

            // Handle focus and blur on the text input
            tagInputContainer.on('focus', 'input[type=text]', function(e) {
                // Remove the narrowing class, restoring input to its original width
                tagInputContainer.find('input[type=text]').removeClass('h');
            }).on('blur', 'input[type=text]', function(e) {
                // When the tag text input loses focus, add a class which narrows it
                // to 1px wide (this is to avoid odd visual effects when the tags in 
                // the control wraps onto multiple lines)
                if(tagData.val() !== '')
                    tagInputContainer.find('input[type=text]').addClass('h');
                // Reset the tag input
                _resetTagInput(tagInput, usingTypeAhead);
            });

            // Focus the text input when the control container is clicked, which triggers
            // the show/hide behaviours defined in the handlers above
            tagInputContainer.on('click', function(e) {
                if(usingTypeAhead)
                    tagInputContainer.find('input[type=text].tt-input').focus();
                else
                    tagInputContainer.find('input[type=text]').focus();
            });

            // Handle tag delete icon click
            tagInputContainer.on('click', 'span.glyphicon', function(e) {
                // Don't bubble the click event up to the input container
                // This would cause the text input to be shown by the container's click event
                e.stopPropagation();
                // Get the text of the tag to be removed (parent of this is the label span)
                var tag = $(this).parent();
                var tagText = $.trim(tag.text());
                // Slightly weird code, but basically we tack a pipe char onto the end
                // of the current tag data string (so that our replace works even if the tag is
                // the last in the string), remove the tag and return the new string minus 
                // the final character (which will always be a pipe character)
                tagData.val((tagData.val() + '|').replace(tagText + '|', '').slice(0, -1));
                tag.remove();
            });

            // If the control already has some tags in it
            if(tagData.val() !== '') {
                // Remove the placeholder text
                tagInput.attr('placeholder', '');
                // Initially blur the text input so it's hidden on load
                tagInputContainer.find('input[type=text]').blur();
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
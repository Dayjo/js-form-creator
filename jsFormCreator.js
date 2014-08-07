/**
 * Javascript Form Creator
 * 
 * @param  {Object} conf The config for the form
 * @return {Object}      The form object.
 */
function jsFC( conf ) {
	"use strict";

	// The form object
	var form = {

		default_input: {
			type: "text",
			name: "input",
			label: "",
			id: "",
			// etc
		},

		/**
		 * Function to parse data in a template using mustache style {{variables}}
		 * @param  {String} template The HTML you wish to parse
		 * @param  {Object} replace  An object of key:value pairs to be replaced on the template
		 * @return {String}          The parsed HTML with the completed replacements
		 */
		parse_template: function(template, replace) {
			var regex;

			// Loop through all the replacements
			for ( var find in replace ) {
				regex = new RegExp("{{" + find + "}}", "g");
				template = template.replace(regex, replace[find]);
			}

			// Replace any left over tags with nothing
			template = template.replace(/\{\{[a-zA-Z0-9_-]+\}\}/g, "");

			return template;
		},

		/**
		 * Converts the string markup into a dom element, which we then add the attributes and properties to.
		 * @param  {string} html The htm markup
		 * @return {Array}      Array of the html elements converted
		 */
		html2dom: function( html ) {
			var container = document.createElement('div'); // This will get garbage collected
			container.innerHTML = html;

			// Return an array of the top level elements in the fragment
			return container.children;			
		},

		/**
		 * Specify the markup for the different field types, these could be set dynamically too.
		 * Each type can either be a flat, self closing string i.e. '<input type="text" />'
		 * or for things like <select> elements, an object/array with a start, child and end tags i.e. ['<select>','<option></option>','</select>'], 
		 * @type {Object}
		 */
		markup:  {
			form: '<form class="form"></form>',

			fieldset: '<fieldset></fieldset>',
			legend: '<legend></legend>',

			field: '<label for="{{id}}">{{label}}: </label>{{field-input}}',

			// 'input' is for generic input with a specified 'type', so if the type doesn't have it's own template (text,email,password), it will use this and add type attribute
			input:  '<input class="form-control text-box" type="{{type}}" {{checked}} />',

			// {{name}} and {{input}} in the option represet the option values, used in the select they'll represet the field name and value
			select: ['<select class="form-control select-box">','<option {{selected}} value="{{value}}">{{name}}</option>', '</select>'],
		},

		config: {
			id: "form",
			method: "post",
			action: ""
		},

		// The generated html of the form
		html: "",

		/**
		 * Function to build the form html based on the config
		 * @return {String}  The HTML of the form
		 */
		build: function () {
			var html, form_container, form_tag, form_button, field_html, fieldset, legend, field, field_markup, i, j, k, input, input_type, input_markup, option, type, fld;

			// Merge in the
			this.config = merge_objects( this.config, conf );

			// The container for the form, so we can get the entire form html (this will not be returned)
				form_container = document.createElement("div");

			// The <form> tag
				form_tag = this.html2dom( this.markup.form )[0]; 

			// Set up the form tag's attributes
				form_tag.id 	= this.config.id;
				form_tag.action = this.config.action;
				form_tag.method = this.config.method;

			// Grab all the other properies from the form object
				for ( i in this.config ) {
					if ( this.config.hasOwnProperty(i) ) { 
						if ( !i.match(/(fieldsets|button_text)/g) ) {
							//form_tag.setProperty(i, this.config[i]);
							form_tag[i] = this.config[i];
							var blah;
						}
					}
				}


			// Loop through the fieldsets, and add them to the form
				for ( i in this.config.fieldsets ) {
					fieldset = this.html2dom( this.markup.fieldset )[0];

					// The optional legend for the fieldset
					if ( typeof this.config.fieldsets[i]['legend'] == "string" ) {
						legend = document.createElement('legend');
						legend.innerHTML = this.config.fieldsets[i]['legend'];

						fieldset.appendChild(legend);
					}

				// Loop through the fieldset's fields and add them to the fieldset
					for ( j in this.config.fieldsets[i]['fields'] ) {
						


					// Add the input's settings to the default input array
							input = this.config.fieldsets[i]['fields'][j];
							input = merge_objects( this.default_input, input )

					// Get the actual input type based on the 'stated' type, i.e. text = email = password = input, select = select,
						if ( typeof this.markup[input.type] == "undefined" ) {
						// Use the input markup
							input_type = "input";
						}
						else {
						// Use the chosen mark up type (probably select)
							input_type = input.type;
						}
						
						// Parse the input type's html with the input config to add element properties, classes e.t.c.
							// Parse object based markup, i.e. select has a container and children [container_start, child, container_end]
							if ( typeof this.markup[input_type] == "object" ) {
								// <select> (<container>)
								input['field-input'] = this.parse_template( this.markup[input_type][0], input );

								// the <option> tags (<child>)
								for ( k in input.options ) {
									option = { name: k, value: input.options[k] };
									if ( typeof input.default != "undefined" && typeof input.value == "undefined" ){ 
										if ( option.value == input.default ) {
											option.selected = "selected"; // For selects
										}
									}

									input['field-input'] += this.parse_template( this.markup[input_type][1], option );
								}

								// </select> (</container>)
								input['field-input'] += this.markup[input_type][2];
							}
							// Parse the self closing single string based <input> type
							else if ( typeof this.markup[input_type] == "string" ) {

								if ( typeof input.default != "undefined" && typeof input.value == "undefined" ){ 
									input.value = input.default;
								}

								input['field-input'] = this.parse_template( this.markup[input_type], input );
							}


						// Build the 'field' row html, this could contain the label and other values
							field_markup = this.parse_template( this.markup.field, input );

						// Create the actual field DOM element
							field = this.html2dom( field_markup );
						
						// Loop through each of the elements in the field (label, input etc) and add them to the fieldset element
							for ( k = 0; k < field.length+k; k++ ) {

								// field[0] will always be the current item in the array because appendChild removes it
								if ( typeof field[0] == "object" ) { 

									// If it's the actual input add all the attributes to it
									if ( typeof field[0].type != 'undefined' && field[0].type.replace(/-[a-zA-Z0-9]+/g, "") == input.type )  {
										
										// Loop through each attribute
										for ( var x in input ) {

											// Only add specified attributes, and Don't add some of the formcreator's attributes
											if ( ['field-input','label', 'default', 'options'].indexOf(x) == -1 ) {
												field[0].setAttribute(x, input[x]);
											}
										}
									}

									// Add the field elements (label, input e.t.c.) to the fieldset
									fieldset.appendChild(field[0]);
								}
							}

					}

					// Add the fieldset element to the form element
					form_tag.appendChild( fieldset );
				}

			// Add the button to the form
				form_button = document.createElement('button');
					form_button.type = "submit";
					form_button.innerHTML = this.config.button_text;
				form_tag.appendChild( form_button )


			// Add the form tag to the container
				form_container.appendChild( form_tag );

			// Write the form tag to the html variable
			// This is removing the onsubmit function because i'm setting is as a function rather than a string?
				this.html = form_container.innerHTML; // </form>
				this.form_el = form_tag;

			return this.form_el;
		}
	};

	form.build();

	return form;
}


/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
var merge_objects = function(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { 
    	obj3[attrname] = obj1[attrname];
    }

    for (var attrname in obj2) { 
    	obj3[attrname] = obj2[attrname];
    }
    return obj3;
};
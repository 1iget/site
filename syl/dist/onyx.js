(function (scope, bundled) {
	
	var   enyo     = scope.enyo || (scope.enyo = {})
		, manifest = enyo.__manifest__ || (defineProperty(enyo, '__manifest__', {value: {}}) && enyo.__manifest__)
		, exported = enyo.__exported__ || (defineProperty(enyo, '__exported__', {value: {}}) && enyo.__exported__)
		, require  = enyo.require || (defineProperty(enyo, 'require', {value: enyoRequire}) && enyo.require)
		, local    = bundled()
		, entries;

	// below is where the generated entries list will be assigned if there is one
	entries = null;


	if (local) {
		Object.keys(local).forEach(function (name) {
			var value = local[name];
			if (manifest.hasOwnProperty(name)) {
				if (!value || !(value instanceof Array)) return;
			}
			manifest[name] = value;
		});
	}

	function defineProperty (o, p, d) {
		if (Object.defineProperty) return Object.defineProperty(o, p, d);
		o[p] = d.value;
		return o;
	}
	
	function enyoRequire (target) {
		if (!target || typeof target != 'string') return undefined;
		if (exported.hasOwnProperty(target))      return exported[target];
		var   request = enyo.request
			, entry   = manifest[target]
			, exec
			, map
			, ctx
			, reqs
			, reqr;
		if (!entry) throw new Error('Could not find module "' + target + '"');
		if (!(entry instanceof Array)) {
			if (typeof entry == 'object' && (entry.source || entry.style)) {
				throw new Error('Attempt to require an asynchronous module "' + target + '"');
			} else if (typeof entry == 'string') {
				throw new Error('Attempt to require a bundle entry "' + target + '"');
			} else {
				throw new Error('The shared module manifest has been corrupted, the module is invalid "' + target + '"');
			}
		}
		exec = entry[0];
		map  = entry[1];
		if (typeof exec != 'function') throw new Error('The shared module manifest has been corrupted, the module is invalid "' + target + '"');
		ctx  = {exports: {}};
		if (request) {
			if (map) {
				reqs = function (name) {
					return request(map.hasOwnProperty(name) ? map[name] : name);
				};
				defineProperty(reqs, 'isRequest', {value: request.isRequest});
			} else reqs = request;
		}
		reqr = !map ? require : function (name) {
			return require(map.hasOwnProperty(name) ? map[name] : name);
		};
		exec(
			ctx,
			ctx.exports,
			scope,
			reqr,
			reqs
		);
		return exported[target] = ctx.exports;
	}

	// in occassions where requests api are being used, below this comment that implementation will
	// be injected
	

	// if there are entries go ahead and execute them
	if (entries && entries.forEach) entries.forEach(function (name) { require(name); });
})(this, function () {
	// this allows us to protect the scope of the modules from the wrapper/env code
	return {'onyx':[function (module,exports,global,require,request){
/**
* Features a variety of commonly used widgets, including toolbars, text inputs, checkboxes, groups
* and multiple types of buttons.
*
* @namespace onyx
*/
module.exports.version = "2.7.0";

var dom = require('enyo/dom');
dom.addBodyClass('onyx');

}],'onyx/input':[function (module,exports,global,require,request){
require('onyx');

/**
* Contains the declaration for the {@link module:onyx/Input~Input} kind.
* @module onyx/Input
*/

var
	kind = require('enyo/kind'),
	Input = require('enyo/Input');

/**
* {@link module:onyx/Input~Input} is an Onyx-styled input control, derived from {@link module:enyo/Input~Input}.
* Typically, an `onyx/Input` is placed inside an {@link module:onyx/InputDecorator~InputDecorator}, which
* provides styling, e.g.:
*
* ```javascript
* 	var
* 		kind = require('enyo/kind'),
* 		Input = require('onyx/Input'),
* 		InputDecorator = require('onyx/InputDecorator');
*
* 	{kind: InputDecorator, components: [
* 		{kind: Input, placeholder: 'Enter some text...', onchange: 'inputChange'}
* 	]}
* ```
*
* For more information, see the documentation on
* [Text Fields]{@linkplain $dev-guide/building-apps/controls/text-fields.html}
* in the Enyo Developer Guide.
*
* @class Input
* @extends module:enyo/Input~Input
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:onyx/Input~Input.prototype */ {

	/**
	* @private
	*/
	name: 'onyx.Input',

	/**
	* @private
	*/
	kind: Input,

	/**
	* @private
	*/
	classes: 'onyx-input'
});

}],'onyx/button':[function (module,exports,global,require,request){
require('onyx');

/**
* Contains the declaration for the {@link module:onyx/Button~Button} kind.
* @module onyx/Button
*/

var
	kind = require('enyo/kind'),
	Button = require('enyo/Button');

/**
* {@link module:onyx/Button~Button} is an {@link module:enyo/Button~Button} with Onyx styling applied. The
* color of the button may be customized by specifying a background color.
*
* The `'onyx-affirmative'`, `'onyx-negative'`, and `'onyx-blue'` classes provide
* some built-in presets.
*
* ```javascript
* 	var
* 		kind = require('enyo/kind'),
* 		Button = require('onyx/Button');
*
* 	{kind: Button, content: 'Button'},
* 	{kind: Button, content: 'Affirmative', classes: 'onyx-affirmative'},
* 	{kind: Button, content: 'Negative', classes: 'onyx-negative'},
* 	{kind: Button, content: 'Blue', classes: 'onyx-blue'},
* 	{kind: Button, content: 'Custom', style: 'background-color: purple; color: #F1F1F1;'}
* ```
* For more information, see the documentation on
* [Buttons]{@linkplain $dev-guide/building-apps/controls/buttons.html} in the
* Enyo Developer Guide.
*
* @class Button
* @extends module:enyo/Button~Button
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:onyx/Button~Button.prototype */ {

	/**
	* @private
	*/
	name: 'onyx.Button',

	/**
	* @private
	*/
	kind: Button,

	/**
	* @private
	*/
	classes: 'onyx-button enyo-unselectable',

	/**
	* @private
	*/
	handlers: {
		ondown: 'down',
		onenter: 'enter',
		ondragfinish: 'dragfinish',
		onleave: 'leave',
		onup: 'up'
	},

	/**
	* @private
	*/
	down: function (sender, event) {
		if (this.disabled) {
			return true;
		}
		this.addClass('pressed');
		this._isPressed = true;
	},

	/**
	* @private
	*/
	enter: function (sender, event) {
		if (this.disabled) {
			return true;
		}
		if(this._isPressed) {
			this.addClass('pressed');
		}
	},

	/**
	* @private
	*/
	dragfinish: function (sender, event) {
		if (this.disabled) {
			return true;
		}
		this.removeClass('pressed');
		this._isPressed = false;
	},

	/**
	* @private
	*/
	leave: function (sender, event) {
		if (this.disabled) {
			return true;
		}
		this.removeClass('pressed');
	},

	/**
	* @private
	*/
	up: function (sender, event) {
		if (this.disabled) {
			return true;
		}
		this.removeClass('pressed');
		this._isPressed = false;
	}
});

}]
	};

});
//# sourceMappingURL=onyx.js.map
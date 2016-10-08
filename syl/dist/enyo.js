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
	return {'enyo/options':[function (module,exports,global,require,request){
/*jshint node:true */
'use strict';

/**
* Returns the global enyo options hash
* @module enyo/options
*/

module.exports = (global.enyo && global.enyo.options) || {};

}],'enyo/PathResolverFactory':[function (module,exports,global,require,request){


var PathResolverFactory = module.exports = function() {
	this.paths = {};
	this.pathNames = [];
};

PathResolverFactory.prototype = {
	addPath: function(inName, inPath) {
		this.paths[inName] = inPath;
		this.pathNames.push(inName);
		this.pathNames.sort(function(a, b) {
			return b.length - a.length;
		});
		return inPath;
	},
	addPaths: function(inPaths) {
		if (inPaths) {
			for (var n in inPaths) {
				this.addPath(n, inPaths[n]);
			}
		}
	},
	includeTrailingSlash: function(inPath) {
		return (inPath && inPath.slice(-1) !== "/") ? inPath + "/" : inPath;
	},
	// replace macros of the form $pathname with the mapped value of paths.pathname
	rewrite: function (inPath) {
		var working, its = this.includeTrailingSlash, paths = this.paths;
		var fn = function(macro, name) {
			working = true;
			return its(paths[name]) || '';
		};
		var result = inPath;
		do {
			working = false;
			for (var i=0; i<this.pathNames.length; i++) {
				var regex = new RegExp("\\$(" + this.pathNames[i] + ")(\\/)?", "g");
				result = result.replace(regex, fn);
			}
		} while (working);
		return result;
	}
};

}],'enyo':[function (module,exports,global,require,request){
'use strict';

exports = module.exports = require('./src/options');
exports.version = '2.7.0';

},{'./src/options':'enyo/options'}],'enyo/pathResolver':[function (module,exports,global,require,request){
var PathResolverFactory = require('./PathResolverFactory');

module.exports = new PathResolverFactory();

},{'./PathResolverFactory':'enyo/PathResolverFactory'}],'enyo/ready':[function (module,exports,global,require,request){
require('enyo');

// we need to register appropriately to know when
// the document is officially ready, to ensure that
// client code is only going to execute at the
// appropriate time

var doc = global.document;
var queue = [];
var ready = ("complete" === doc.readyState);
var run;
var init;
var remove;
var add;
var flush;
var flushScheduled = false;

/**
* Registers a callback (and optional `this` context) to run after all the Enyo and library code
* has loaded and the `DOMContentLoaded` event (or equivalent on older browsers) has been sent.
* 
* If called after the system is in a ready state, runs the supplied code asynchronously at the
* earliest opportunity.
*
* @module enyo/ready
* @param {Function} fn - The method to execute when the DOM is ready.
* @param {Object} [context] - The optional context (`this`) under which to execute the
*	callback method.
* @public
*/
module.exports = function (fn, context) {
	queue.push([fn, context]);
	// schedule another queue flush if needed to run new ready calls
	if (ready && !flushScheduled) {
		setTimeout(flush, 0);
		flushScheduled = true;
	}
};

/**
* @private
*/
run = function (fn, context) {
	fn.call(context || global);
};

/**
* @private
*/
init = function (event) {
	// if we're interactive, it should be safe to move
	// forward because the content has been parsed
	if ((ready = ("interactive" === doc.readyState))) {
		if ("DOMContentLoaded" !== event.type && "readystatechange" !== event.type) {
			remove(event.type, init);
			flush();
		}
	}
	// for legacy WebKit (including webOS 3.x and less) and assurance
	if ((ready = ("complete" === doc.readyState || "loaded" === doc.readyState))) {
		remove(event.type, init);
		flush();
	}
};

/**
* @private
*/
add = function (event, fn) {
	doc.addEventListener(event, fn, false);
};

/**
* @private
*/
remove = function (event, fn) {
	doc.removeEventListener(event, fn, false);
};

/**
* @private
*/
flush = function () {
	if (ready && queue.length) {
		while (queue.length) {
			run.apply(global, queue.shift());
		}
	}
	flushScheduled = false;
};

// ok, let's hook this up
add("DOMContentLoaded", init);
add("readystatechange", init);

}],'enyo/utils':[function (module,exports,global,require,request){
require('enyo');

/**
* A collection of utilities
* @module enyo/utils
*/

/**
* A polyfill for platforms that don't yet support
* [bind()]{@glossary Function.prototype.bind}. As explained in the linked article, this
* polyfill handles the general use case but cannot exactly mirror the ECMA-262 version 5
* implementation specification. This is an adaptation of the example promoted
* [here]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind}.
*/
if (!Function.prototype.bind) {
	Function.prototype.bind = function (ctx) {
		// deliberately used here...
		var args = Array.prototype.slice.call(arguments, 1),
			scop = this,
			nop = function () {},
			ret;

		// as-per MDN's explanation of this polyfill we're filling in for the IsCallable
		// internal (we can't access it)
		if (typeof this != 'function') {
			throw new TypeError('Function.prototype.bind called on non-callable object.');
		}

		ret = function () {
			var largs = args.concat(Array.prototype.slice.call(arguments)),
				lctx = this instanceof nop && ctx ? this : ctx;

			return scop.apply(lctx, largs);
		};

		nop.prototype = this.prototype;

		/*jshint -W055 */
		ret.prototype = new nop();
		/*jshint +W055 */

		return ret;
	};
}

/**
* Returns a function that can be extended (via `.extend()`) similar to prototypal inheritance.
* Like {@link module:enyo/kind#inherit}, `extend()` expects as its first argument a factory function
* that returns the new function that will be called instead of the original function. The original
* is available as the first argument to that factory function.
*
* ```javascript
* var
*	utils = require('enyo/utils');
*
* var factor = new utils.Extensible(function (a, b) {
*	return a + b;
* });
* factor(2, 4); // returns 6;
* factor.extend(function (sup) {
*	return function (a, b) {
*		return sup.apply(this, arguments) * b;
*	};
* });
* factor(2, 4) // return 24;
* ```
*
* @param  {Function} fn - Original function that can be extended
* @param {Object} [ctx] - Context on which `fn` will be called. Defaults to the Extensible instance.
* @return {Function} - A wrapped version of `fn` with the `extend()` method added
*
* @public
*/
exports.Extensible = function Extensible (fn) {
	if (!(this instanceof Extensible)) return new Extensible(fn);

	this.fn = fn;
	var f = function () {
		return this.fn.apply(this, arguments);
	}.bind(this);

	f.extend = function (factory) {
		this.fn = factory(this.fn);
	}.bind(this);

	return f;
};

/**
* @private
*/
exports.nop = function () {};

/**
* @private
*/
exports.nob = {};

/**
* @private
*/
exports.nar = [];

/**
* This name is reported in inspectors as the type of objects created via delegate;
* otherwise, we would just use {@link module:enyo/utils#nop}.
*
* @private
*/
var Instance = exports.instance = function () {};

/**
* @private
*/
var setPrototype = exports.setPrototype = function (ctor, proto) {
	ctor.prototype = proto;
};

/**
* Boodman/crockford delegation w/cornford optimization
*
* @private
*/
exports.delegate = function (proto) {
	setPrototype(Instance, proto);
	return new Instance();
};

// ----------------------------------
// General Functions
// ----------------------------------

/**
* Determines whether a variable is defined.
*
* @param {*} target - Anything that can be compared to `undefined`.
* @returns {Boolean} `true` if defined, `false` otherwise.
* @public
*/
var exists = exports.exists = function (target) {
	return (target !== undefined);
};

var uidCounter = 0;

/**
* Creates a unique identifier (with an optional prefix) and returns the identifier as a string.
*
* @param {String} [prefix] - The prefix to prepend to the generated unique id.
* @returns {String} An optionally-prefixed identifier.
* @public
*/
exports.uid = function (prefix) {
	return String((prefix? prefix: '') + uidCounter++);
};

/**
* RFC4122 uuid generator for the browser.
*
* @returns {String} An [RFC4122]{@glossary UUID}-compliant, universally unique identifier.
* @public
*/
exports.uuid = function () {
	// @TODO: Could possibly be faster
	var t, p = (
		(Math.random().toString(16).substr(2,8)) + '-' +
		((t=Math.random().toString(16).substr(2,8)).substr(0,4)) + '-' +
		(t.substr(4,4)) +
		((t=Math.random().toString(16).substr(2,8)).substr(0,4)) + '-' +
		(t.substr(4,4)) +
		(Math.random().toString(16).substr(2,8))
	);
	return p;
};

/**
* Generates a random number using [Math.random]{@glossary Math.random}.
*
* @param {Number} bound - The multiplier used to generate the product.
* @returns {Number} A random number.
* @public
*/
exports.irand = function (bound) {
	return Math.floor(Math.random() * bound);
};

var toString = Object.prototype.toString;

/**
* Determines whether a given variable is a [String]{@glossary String}.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is a [String]{@glossary String};
* otherwise, `false`.
* @public
*/
exports.isString = function (it) {
	return toString.call(it) === '[object String]';
};

/**
* Determines whether a given variable is a [Function]{@glossary Function}.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is a [Function]{@glossary Function};
* otherwise, `false`.
* @public
*/
exports.isFunction = function (it) {
	return toString.call(it) === '[object Function]';
};

/**
* Determines whether a given variable is an [Array]{@glossary Array}.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is an [Array]{@glossary Array};
* otherwise, `false`.
* @method
* @public
*/
var isArray = exports.isArray = Array.isArray || function (it) {
	return toString.call(it) === '[object Array]';
};

/**
* Determines whether a given variable is an [Object]{@glossary Object}.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is an [Object]{@glossary Object};
* otherwise, `false`.
* @method
* @public
*/
exports.isObject = Object.isObject || function (it) {
	return toString.call(it) === '[object Object]';
};

/**
* Determines whether a given variable is an explicit boolean `true`.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is an explicit `true`; otherwise,
* `false`.
* @public
*/
exports.isTrue = function (it) {
	return !(it === 'false' || it === false || it === 0 || it === null || it === undefined);
};

/**
* Determines whether a given variable is a numeric value.
*
* @param {*} it - The variable to be tested.
* @returns {Boolean} `true` if variable is a numeric value; otherwise,
* `false`.
* @public
*/
exports.isNumeric = function (it) {
	// borrowed from jQuery
	return !isArray(it) && (it - parseFloat(it) + 1) >= 0;
};

/**
* Binds the `this` context of any method to a scope and a variable number of provided initial
* parameters.
*
* @param {Object} scope - The `this` context for the method.
* @param {(Function|String)} method - A Function or the name of a method to bind.
* @param {...*} [args] Any arguments that will be provided as the initial arguments to the
*                      enclosed method.
* @returns {Function} The bound method/closure.
* @public
*/
var bind = exports.bind = function (scope, method) {
	if (!method) {
		method = scope;
		scope = null;
	}
	scope = scope || global;
	if (typeof method == 'string') {
		if (scope[method]) {
			method = scope[method];
		} else {
			throw('enyo.bind: scope["' + method + '"] is null (scope="' + scope + '")');
		}
	}
	if (typeof method == 'function') {
		var args = cloneArray(arguments, 2);
		if (method.bind) {
			return method.bind.apply(method, [scope].concat(args));
		} else {
			return function() {
				var nargs = cloneArray(arguments);
				// invoke with collected args
				return method.apply(scope, args.concat(nargs));
			};
		}
	} else {
		throw('enyo.bind: scope["' + method + '"] is not a function (scope="' + scope + '")');
	}
};

/**
* Binds a callback to a scope. If the object has a `destroyed` property that's truthy, then the
* callback will not be run if called. This can be used to implement both
* {@link module:enyo/CoreObject~Object#bindSafely} and {@link module:enyo/CoreObject~Object}-like objects like
* {@link module:enyo/Model~Model} and {@link module:enyo/Collection~Collection}.
*
* @param {Object} scope - The `this` context for the method.
* @param {(Function|String)} method - A Function or the name of a method to bind.
* @param {...*} [args] Any arguments that will be provided as the initial arguments to the
*                      enclosed method.
* @returns {Function} The bound method/closure.
* @public
*/
exports.bindSafely = function (scope, method) {
	if (typeof method == 'string') {
		if (scope[method]) {
			method = scope[method];
		} else {
			throw('enyo.bindSafely: scope["' + method + '"] is null (this="' + this + '")');
		}
	}
	if (typeof method == 'function') {
		var args = cloneArray(arguments, 2);
		return function() {
			if (scope.destroyed) {
				return;
			}
			var nargs = cloneArray(arguments);
			return method.apply(scope, args.concat(nargs));
		};
	} else {
		throw('enyo.bindSafely: scope["' + method + '"] is not a function (this="' + this + '")');
	}
};

/**
* Calls the provided `method` on `scope`, asynchronously.
*
* Uses [window.setTimeout()]{@glossary window.setTimeout} with minimum delay,
* usually around 10ms.
*
* Additional arguments are passed to `method` when it is invoked.
*
* If only a single argument is supplied, will just call that function asynchronously without
* doing any additional binding.
*
* @param {Object} scope - The `this` context for the method.
* @param {(Function|String)} method - A Function or the name of a method to bind.
* @param {...*} [args] Any arguments that will be provided as the initial arguments to the
*                      enclosed method.
* @returns {Number} The `setTimeout` id.
* @public
*/
exports.asyncMethod = function (scope, method) {
	if (!method) {
		// passed just a single argument
		return setTimeout(scope, 1);
	} else {
		return setTimeout(bind.apply(scope, arguments), 1);
	}
};

/**
* Calls the provided `method` ([String]{@glossary String}) on `scope` with optional
* arguments `args` ([Array]{@glossary Array}), if the object and method exist.
*
* @example
* 	utils = require('enyo/utils');
* 	utils.call(myWorkObject, 'doWork', [3, 'foo']);
*
* @param {Object} scope - The `this` context for the method.
* @param {(Function|String)} method - A Function or the name of a method to bind.
* @param {Array} [args] - An array of arguments to pass to the method.
* @returns {*} The return value of the method.
* @public
*/
exports.call = function (scope, method, args) {
	var context = scope || this;
	if (method) {
		var fn = context[method] || method;
		if (fn && fn.apply) {
			return fn.apply(context, args || []);
		}
	}
};

/**
* Returns the current time in milliseconds. On platforms that support it,
* [Date.now()]{@glossary Date.now} will be used; otherwise this will
* be equivalent to [new Date().getTime()]{@glossary Date.getTime}.
*
* @returns {Number} Number of milliseconds representing the current time.
* @method
* @public
*/

var now = exports.now = Date.now || function () {
	return new Date().getTime();
};

/**
* When [window.performance]{@glossary window.performance} is available, supplies
* a high-precision, high-performance monotonic timestamp, which is independent of
* changes to the system clock and thus safer for use in animation, etc. Falls back to
* {@link module:enyo/utils#now} (based on the JavaScript [Date]{@glossary Date} object),
* which is subject to system time changes.
*
* @returns {Number} Number of milliseconds representing the current time or time since
*                   start of application execution as reported by the platform.
* @method
* @public
*/
exports.perfNow = (function () {
	// we have to check whether or not the browser has supplied a valid
	// method to use
	var perf = window.performance || {};
	// test against all known vendor-specific implementations, but use
	// a fallback just in case
	perf.now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow || now;
	return function () {
		return perf.now();
	};
}());

/**
* A fast-path enabled global getter that takes a string path, which may be a full path (from
* context window/Enyo) or a relative path (to the execution context of the method). It knows how
* to check for and call the backwards-compatible generated getters, as well as how to handle
* computed properties. Returns `undefined` if the object at the given path cannot be found. May
* safely be called on non-existent paths.
*
* @param {String} path - The path from which to retrieve a value.
* @returns {*} The value for the given path, or `undefined` if the path could not be
*                  completely resolved.
* @method enyo.getPath
* @public
*/
var getPath = exports.getPath = function (path) {
	// we're trying to catch only null/undefined not empty string or 0 cases
	if (!path && path !== null && path !== undefined) return path;

	var next = this,
		parts,
		part,
		getter,
		prev;

	// obviously there is a severe penalty for requesting get with a path lead
	// by unnecessary relative notation...
	if (path[0] == '.') path = path.replace(/^\.+/, '');

	// here's where we check to make sure we have a truthy string-ish
	if (!path) return;

	parts = path.split('.');
	part = parts.shift();

	do {
		prev = next;
		// for constructors we must check to make sure they are undeferred before
		// looking for static properties
		// for the auto generated or provided published property support we have separate
		// routines that must be called to preserve compatibility
		if (next._getters && ((getter = next._getters[part])) && !getter.generated) next = next[getter]();
		// for all other special cases to ensure we use any overloaded getter methods
		else if (next.get && next !== this && next.get !== getPath) next = next.get(part);
		// and for regular cases
		else next = next[part];
	} while (next && (part = parts.shift()));

	// if necessary we ensure we've undeferred any constructor that we're
	// retrieving here as a final property as well
	return next;
};

/**
* @private
*/
getPath.fast = function (path) {
	// the current context
	var b = this, fn, v;
	if (b._getters && (fn = b._getters[path])) {
		v = b[fn]();
	} else {
		v = b[path];
	}

	return v;
};

/**
* @TODO: Out of date...
* A global setter that takes a string path (relative to the method's execution context) or a
* full path (relative to window). Attempts to automatically retrieve any previously existing
* value to supply to any observers. If the context is an {@link module:enyo/CoreObject~Object} or subkind, the
* {@link module:enyo/ObserverSupport~ObserverSupport.notify} method is used to notify listeners for the path's being
* set. If the previous value is equivalent to the newly set value, observers will not be
* triggered by default. If the third parameter is present and is an explicit boolean true, the
* observers will be triggered regardless. Returns the context from which the method was executed.
*
* @param {String} path - The path for which to set the given value.
* @param {*} is - The value to set.
* @param {Object} [opts] - An options hash.
* @returns {this} Whatever the given context was when executed.
* @method enyo.setPath
* @public
*/
var setPath = exports.setPath = function (path, is, opts) {
	// we're trying to catch only null/undefined not empty string or 0 cases
	if (!path || (!path && path !== null && path !== undefined)) return this;

	var next = this,
		options = {create: true, silent: false, force: false},
		base = next,
		parts,
		part,
		was,
		force,
		create,
		silent,
		comparator;

	if (typeof opts == 'object') opts = mixin({}, [options, opts]);
	else {
		force = opts;
		opts = options;
	}

	if (opts.force) force = true;
	silent = opts.silent;
	create = opts.create;
	comparator = opts.comparator;


	// obviously there is a severe penalty for requesting get with a path lead
	// by unnecessary relative notation...
	if (path[0] == '.') path = path.replace(/^\.+/, '');

	// here's where we check to make sure we have a truthy string-ish
	if (!path) return next;

	parts = path.split('.');
	part = parts.shift();

	do {

		if (!parts.length) was = next.get && next.get !== getPath? next.get(part): next[part];
		else {
			// this allows us to ensure that if we're setting a static property of a constructor we have the
			// correct constructor
			// @TODO: It seems ludicrous to have to check this on every single part of a chain; if we didn't have
			// deferred constructors this wouldn't be necessary and is expensive - unnecessarily so when speed is so important
			if (next !== base && next.set && next.set !== setPath) {
				parts.unshift(part);
				next.set(parts.join('.'), is, opts);
				return base;
			}
			if (next !== base && next.get) next = (next.get !== getPath? next.get(part): next[part]) || (create && (next[part] = {}));
			else next = next[part] || (create && (next[part] = {}));
		}

	} while (next && parts.length && (part = parts.shift()));

	if (!next) return base;

	// now update to the new value
	if (next !== base && next.set && next.set !== setPath) {
		next.set(part, is, opts);
		return base;
	} else next[part] = is;

	// if possible we notify the changes but this change is notified from the immediate
	// parent not the root object (could be the same)
	if (next.notify && !silent && (force || was !== is || (comparator && comparator(was, is)))) next.notify(part, was, is, opts);
	// we will always return the original root-object of the call
	return base;
};

/**
* @private
*/
setPath.fast = function (path, value) {
	// the current context
	var b = this,
		// the previous value and helper variable
		rv, fn;
	// we have to check and ensure that we're not setting a computed property
	// and if we are, do nothing
	if (b._computed && b._computed[path] !== undefined) {
		return b;
	}
	if (b._getters && (fn=b._getters[path])) {
		rv = b[fn]();
	} else {
		rv = b[path];
	}
	// set the new value now that we can
	b[path] = value;

	// this method is only ever called from the context of enyo objects
	// as a protected method
	if (rv !== value) { b.notifyObservers(path, rv, value); }
	// return the context
	return b;
};

// ----------------------------------
// String Functions
// ----------------------------------

/**
* Uppercases a given string. Will coerce to a [String]{@glossary String}
* if possible/necessary.
*
* @param {String} str - The string to uppercase.
* @returns {String} The uppercased string.
* @public
*/
exports.toUpperCase = new exports.Extensible(function (str) {
	if (str != null) {
		return str.toString().toUpperCase();
	}
	return str;
});

/**
* Lowercases a given string. Will coerce to a [String]{@glossary String}
* if possible/necessary.
*
* @param {String} str - The string to lowercase.
* @returns {String} The lowercased string.
* @public
*/
exports.toLowerCase = new exports.Extensible(function (str) {
	if (str != null) {
		return str.toString().toLowerCase();
	}
	return str;
});

/**
* Capitalizes a given string.
*
* @param {String} str - The string to capitalize.
* @returns {String} The capitalized string.
* @public
*/
exports.cap = function (str) {
	return str.slice(0, 1).toUpperCase() + str.slice(1);
};

/**
* Un-capitalizes a given string.
*
* @param {String} str - The string to un-capitalize.
* @returns {String} The un-capitalized string.
* @public
*/
exports.uncap = function (str) {
	return str.slice(0, 1).toLowerCase() + str.slice(1);
};

/**
* Injects an arbitrary number of values, in order, into a template string at
* positions marked by `"%."`.
*
* @param {String} template - The string template to inject with values.
* @param {...String} val The values to inject into the template.
* @returns {String} A copy of the template populated with values.
* @public
*/
exports.format = function (template) {
	var pattern = /\%./g,
		arg = 0,
		tmp = template,
		args = arguments,
		replacer;

	replacer = function () {
		return args[++arg];
	};

	return tmp.replace(pattern, replacer);
};

/**
* @private
*/
String.prototype.trim = String.prototype.trim || function () {
	return this.replace(/^\s+|\s+$/g, '');
};

/**
* Takes a string and trims leading and trailing spaces. Strings with no length,
* non-strings, and falsy values will be returned without modification.
*
* @param {String} str - The string from which to remove whitespace.
* @returns {String} The trimmed string.
* @public
*/
exports.trim = function (str) {
	return (typeof str == 'string' && str.trim()) || str;
};

// ----------------------------------
// Object Functions
// ----------------------------------

/**
* A [polyfill]{@glossary polyfill} for platforms that don't support
* [Object.create()]{@glossary Object.create}.
*/
Object.create = Object.create || (function () {
	var Anon = function () {};
	return function (obj) {
		// in the polyfill we can't support the additional features so we are ignoring
		// the extra parameters
		if (!obj || obj === null || typeof obj != 'object') throw 'Object.create: Invalid parameter';
		Anon.prototype = obj;
		return new Anon();
	};
})();

/**
* A [polyfill]{@glossary polyfill} for platforms that don't support
* [Object.keys()]{@glossary Object.keys}.
*/
Object.keys = Object.keys || function (obj) {
	var results = [];
	var hop = Object.prototype.hasOwnProperty;
	for (var prop in obj) {
		if (hop.call(obj, prop)) {
			results.push(prop);
		}
	}
	return results;
};

/**
* Returns an array of all known enumerable properties found on a given object.
*
* @alias Object.keys.
* @method enyo.keys
* @public
*/
exports.keys = Object.keys;

/**
* Convenience method that takes an [array]{@glossary Array} of properties
* and an [object]{@glossary Object} as parameters. Returns a new object
* with only those properties named in the array that are found to exist on the
* base object. If the third parameter is `true`, falsy values will be ignored.
*
* @param {String[]} properties The properties to include on the returned object.
* @param {Object} object - The object from which to retrieve values for the requested properties.
* @param {Boolean} [ignore=false] Whether or not to ignore copying falsy values.
* @returns {Object} A new object populated with the requested properties and values from
*                     the given object.
* @public
*/
exports.only = function (properties, object, ignore) {
	var ret = {},
		prop,
		len,
		i;

	for (i = 0, len = properties.length >>> 0; i < len; ++i) {
		prop = properties[i];

		if (ignore && (object[prop] === undefined || object[prop] === null)) continue;
		ret[prop] = object[prop];
	}

	return ret;
};

/**
* Convenience method that takes two [objects]{@glossary Object} as parameters.
* For each key from the first object, if the key also exists in the second object,
* a mapping of the key from the first object to the key from the second object is
* added to a result object, which is eventually returned. In other words, the
* returned object maps the named properties of the first object to the named
* properties of the second object. The optional third parameter is a boolean
* designating whether to pass unknown key/value pairs through to the new object.
* If `true`, those keys will exist on the returned object.
*
* @param {Object} map - The object with key/value pairs.
* @param {Object} obj - The object whose values will be used.
* @param {Boolean} [pass=false] Whether or not to pass unnamed properties through
*                               from the given object.
* @returns {Object} A new object whose properties have been mapped.
* @public
*/
exports.remap = function (map, obj, pass) {
	var ret = pass ? clone(obj) : {},
		key;

	for (key in map) {
		if (key in obj) ret[map[key]] = obj.get ? obj.get(key) : obj[key];
	}
	return ret;
};

/**
* Helper method that accepts an [array]{@glossary Array} of
* [objects]{@glossary Object} and returns a hash of those objects indexed
* by the specified `property`. If a `filter` is provided, the filter should
* accept four parameters: the key, the value (object), the current mutable map
* reference, and an immutable copy of the original array of objects for
* comparison.
*
* @param {String} property - The property to index the array by.
* @param {Array} array - An array of property objects.
* @param {Function} [filter] - The filter function to use; accepts four arguments.
* @returns {Object} A hash (object) indexed by the `property` argument
* @public
*/
exports.indexBy = function (property, array, filter) {
	// the return value - indexed map from the given array
	var map = {},
		value,
		len,
		idx = 0;
	// sanity check for the array with an efficient native array check
	if (!exists(array) || !(array instanceof Array)) {
		return map;
	}
	// sanity check the property as a string
	if (!exists(property) || 'string' !== typeof property) {
		return map;
	}
	// the immutable copy of the array
	var copy = clone(array);
	// test to see if filter actually exsits
	filter = exists(filter) && 'function' === typeof filter ? filter : undefined;
	for (len = array.length; idx < len; ++idx) {
		// grab the value from the array
		value = array[idx];
		// make sure that it exists and has the requested property at all
		if (exists(value) && exists(value[property])) {
			if (filter) {
				// if there was a filter use it - it is responsible for
				// updating the map accordingly
				filter(property, value, map, copy);
			} else {
				// use the default behavior - check to see if the key
				// already exists on the map it will be overwritten
				map[value[property]] = value;
			}
		}
	}
	// go ahead and return our modified map
	return map;
};

/**
* Creates and returns a shallow copy of an [Object]{@glossary Object} or an
* [Array]{@glossary Array}. For objects, by default, properties will be scanned and
* copied directly to the clone such that they would pass the
* [hasOwnProperty()]{@glossary Object.hasOwnProperty} test. This is expensive and often not
* required. In this case, the optional second parameter may be used to allow a more efficient
* [copy]{@link Object.create} to be made.
*
* @param {(Object|Array)} base - The [Object]{@glossary Object} or
*                              [Array]{@glossary Array} to be cloned.
* @param {Boolean} [quick] - If `true`, when cloning objects, a faster [copy]{@link Object.create}
*                          method will be used. This parameter has no meaning when cloning arrays.
* @returns {*} A clone of the provided `base` if `base` is of the correct type; otherwise,
*              returns `base` as it was passed in.
* @public
*/
var clone = exports.clone = function (base, quick) {
	if (base) {

		// avoid the overhead of calling yet another internal function to do type-checking
		// just copy the array and be done with it
		if (base instanceof Array) return base.slice();
		else if (base instanceof Object) {
			return quick ? Object.create(base) : mixin({}, base);
		}
	}

	// we will only do this if it is not an array or native object
	return base;
};

var empty = {};
var mixinDefaults = {
	exists: false,
	ignore: false,
	filter: null
};

/**
	@todo Rewrite with appropriate documentation for options parameter (typedef)
	@todo document 'quick' option

	Will take a variety of options to ultimately mix a set of properties
	from objects into single object. All configurations accept a boolean as
	the final parameter to indicate whether or not to ignore _truthy_/_existing_
	values on any _objects_ prior.

	If _target_ exists and is an object, it will be the base for all properties
	and the returned value. If the parameter is used but is _falsy_, a new
	object will be created and returned. If no such parameter exists, the first
	parameter must be an array of objects and a new object will be created as
	the _target_.

	The _source_ parameter may be an object or an array of objects. If no
	_target_ parameter is provided, _source_ must be an array of objects.

	The _options_ parameter allows you to set the _ignore_ and/or _exists_ flags
	such that if _ignore_ is true, it will not override any truthy values in the
	target, and if _exists_ is true, it will only use truthy values from any of
	the sources. You may optionally add a _filter_ method-option that returns a
	true or false value to indicate whether the value should be used. It receives
	parameters in this order: _property_, _source value_, _source values_,
	_target_, _options_. Note that modifying the target in the filter method can
	have unexpected results.

	Setting _options_ to true will set all options to true.

* @method enyo.mixin
* @public
*/
var mixin = exports.mixin = function () {
	var ret = arguments[0],
		src = arguments[1],
		opts = arguments[2],
		val;

	if (!ret) ret = {};
	else if (ret instanceof Array) {
		opts = src;
		src = ret;
		ret = {};
	}

	if (!opts || opts === true) opts = mixinDefaults;

	if (src instanceof Array) for (var i=0, it; (it=src[i]); ++i) mixin(ret, it, opts);
	else {
		for (var key in src) {
			val = src[key];

			// quickly ensure the property isn't a default
			if (empty[key] !== val) {
				if (
					(!opts.exists || val) &&
					(!opts.ignore || !ret[key]) &&
					(opts.filter? opts.filter(key, val, src, ret, opts): true)
				) {
					ret[key] = val;
				}
			}
		}
	}

	return ret;
};

/**
* Returns an [array]{@glossary Array} of the values of all properties in an
* [object]{@glossary Object}.
*
* @param {Object} obj - The [Object]{@glossary Object} to read the values from.
* @returns {Array} An [array]{@glossary Array} with the values from the `obj`.
* @public
*/
exports.values = function (obj) {
	var ret = [];
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) ret.push(obj[key]);
	}
	return ret;
};

// ----------------------------------
// Array Functions
// ----------------------------------

/**
* A [polyfill]{@glossary polyfill} for platforms that don't support
* [Array.findIndex()]{@glossary Array.findIndex}.
*/
Array.prototype.findIndex = Array.prototype.findIndex || function (fn, ctx) {
	for (var i=0, len=this.length >>> 0; i<len; ++i) {
		if (fn.call(ctx, this[i], i, this)) return i;
	}
	return -1;
};

/**
* A [polyfill]{@glossary polyfill} for platforms that don't support
* [Array.find()]{@glossary Array.find}.
*/
Array.prototype.find = Array.prototype.find || function (fn, ctx) {
	for (var i=0, len=this.length >>> 0; i<len; ++i) {
		if (fn.call(ctx, this[i], i, this)) return this[i];
	}
};

/**
* An Enyo convenience method reference to [Array.indexOf()]{@glossary Array.indexOf}.
*
* This also supports the legacy Enyo argument order `el.indexOf(array, offset)` and can
* differentiate between this and the standard `array.indexOf(el, offset)`.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.indexOf = function (array, el, offset) {
	if (!(array instanceof Array)) return el.indexOf(array, offset);
	return array.indexOf(el, offset);
};

/**
* An Enyo convenience method reference to [Array.lastIndexOf()]{@glossary Array.lastIndexOf}.
*
* This also supports the legacy Enyo argument order `el.lastIndexOf(array, offset)` and can
* differentiate between this and the standard `array.lastIndexOf(el, offset)`.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.lastIndexOf = function (array, el, offset) {
	if (!(array instanceof Array)) return el.lastIndexOf(array, offset);
	return array.lastIndexOf(el, offset);
};

/**
* An Enyo convenience method reference to [Array.findIndex()]{@glossary Array.findIndex}.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.findIndex = function (array, fn, ctx) {
	return array.findIndex(fn, ctx);
};

/**
* An Enyo convenience method reference to [Array.find()]{@glossary Array.find}.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @method enyo.find
* @public
*/
var find = exports.find = function (array, fn, ctx) {
	return array.find(fn, ctx);
};

/**
* @alias enyo.find
* @method enyo.where
* @public
*/
exports.where = find;

/**
* An Enyo convenience method reference to [Array.forEach()]{@glossary Array.forEach}.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.forEach = function (array, fn, ctx) {
	return array.forEach(fn, ctx);
};

/**
* An Enyo convenience method reference to [Array.map()]{@glossary Array.map}.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.map = function (array, fn, ctx) {
	return array.map(fn, ctx);
};

/**
* An Enyo convenience method reference to [Array.filter()]{@glossary Array.filter}.
*
* **When possible, you should use the native equivalent.**
*
* This method supports the same arguments as the native version, plus an extra argument at the
* beginning referring to the [array]{@glossary Array} to run this method on.
*
* @public
*/
exports.filter = function (array, fn, ctx) {
	return array.filter(fn, ctx);
};

/**
* When given an [array]{@glossary Array} of [objects]{@glossary Object},
* searches through the array's objects; each object with a property name matching
* `prop` has its value for that property compiled into a result array, which is
* eventually returned. For each array object that doesn't have a matching property,
* an `undefined` placeholder element is added to the result array, such that the
* returned result array has the same length as the passed-in `array` parameter.
*
* @param {Array} array - The [array]{@glossary Array} of [objects]{@glossary Object}
*                      in which the `prop` will be searched for.
* @param {String} prop - A string containing the name of the property to search for.
* @returns {Array} An array of all the values of the named property from
*                     objects contained in the `array`.
* @public
*/
exports.pluck = function (array, prop) {
	if (!(array instanceof Array)) {
		var tmp = array;
		array = prop;
		prop = tmp;
	}

	var ret = [];
	for (var i=0, len=array.length >>> 0; i<len; ++i) {
		ret.push(array[i]? array[i][prop]: undefined);
	}
	return ret;
};

/**
* Concatenates a variable number of [arrays]{@glossary Array}, removing any duplicate
* entries.
*
* @returns {Array} The unique values from all [arrays]{@glossary Array}.
* @public
*/
exports.merge = function (/* _arrays_ */) {
	var ret = [],
		values = Array.prototype.concat.apply([], arguments);
	for (var i=0, len=values.length >>> 0; i<len; ++i) {
		if (!~ret.indexOf(values[i])) ret.push(values[i]);
	}
	return ret;
};

/**
* Clones an existing [Array]{@glossary Array}, or converts an array-like
* object into an Array.
*
* If `offset` is non-zero, the cloning starts from that index in the source
* Array. The clone may be appended to an existing Array by passing in the
* existing Array as `initialArray`.
*
* Array-like objects have `length` properties, and support square-bracket
* notation `([])`. Array-like objects often do not support Array methods
* such as `push()` or `concat()`, and so must be converted to Arrays before
* use.
*
* The special `arguments` variable is an example of an array-like object.
*
* @public
*/
var cloneArray = exports.cloneArray = function (array, offset, initialArray) {
	var ret = initialArray || [];
	for(var i = offset || 0, l = array.length; i<l; i++){
		ret.push(array[i]);
	}
	// Alternate smarter implementation:
	// return Array.prototype.slice.call(array, offset);
	// Array.of
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
	return ret;
};

/**
* @alias cloneArray
* @method enyo.toArray
* @public
*/
exports.toArray = cloneArray;

/**
* Within a given [array]{@glossary Array}, removes the first
* [strictly equal to]{@glossary ===} occurrence of `el`.
* Note that `array` is modified directly.
*
* @param {Array} array - The [Array]{@glossary Array} to look through.
* @param {*} el - The element to search for and remove.
* @public
*/
exports.remove = function (array, el) {
	if (!(array instanceof Array)) {
		var tmp = array;
		array = el;
		el = tmp;
	}

	var i = array.indexOf(el);
	if (-1 < i) array.splice(i, 1);
	return array;
};

/**
* This regex pattern is used by the [isRtl()]{@link module:enyo/utils#isRtl} function.
*
* Arabic: \u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE
* Hebrew: \u0590-\u05FF\uFB1D-\uFB4F
*
* @private
*/
var rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE\u0590-\u05FF\uFB1D-\uFB4F]/;

/**
* Takes content `str` and determines whether or not it is [RTL]{@glossary RTL}.
*
* @param {String} str - A [String]{@glossary String} to check the [RTL]{@glossary RTL}-ness of.
* @return {Boolean} `true` if `str` should be RTL; `false` if not.
* @public
*/
exports.isRtl = function (str) {
	return rtlPattern.test(str);
};
}],'enyo/json':[function (module,exports,global,require,request){
require('enyo');


/**
* [JSON]{@glossary JSON} related methods and wrappers.
*
* @module enyo/json
* @public
*/
module.exports = {
	
	/**
	* Wrapper for [JSON.stringify()]{@glossary JSON.stringify}. Creates a
	* [JSON]{@glossary JSON} [string]{@glossary String} from an
	* [object]{@glossary Object}.
	*
	* @see {@glossary JSON.stringify}
	* @param {Object} value - The [object]{@glossary Object} to convert to a
	*	[JSON]{@glossary JSON} [string]{@glossary String}.
	* @param {(Function|String[])} [replacer] An optional parameter indicating either an
	*	[array]{@glossary Array} of keys to include in the final output or a
	*	[function]{@glossary Function} that will have the opportunity to dynamically return
	*	values to include for keys.
	* @param {(Number|String)} [space] - Determines the spacing (if any) for pretty-printed
	*	output of the JSON string. A [number]{@glossary Number} indicates the number of
	* spaces to use in the output, while a string will be used verbatim.
	* @returns {String} The JSON string for the given object.
	* @public
	*/
	stringify: function(value, replacer, space) {
		return JSON.stringify(value, replacer, space);
	},
	
	/**
	* Wrapper for [JSON.parse()]{@glossary JSON.parse}. Parses a valid
	* [JSON]{@glossary JSON} [string]{@glossary String} and returns an
	* [object]{@glossary Object}, or `null` if the parameters are invalid.
	*
	* @see {@glossary JSON.parse}
	* @param {String} json - The [JSON]{@glossary JSON} [string]{@glossary String} to
	*	parse into an [object]{@glossary Object}.
	* @param {Function} [reviver] - The optional [function]{@glossary Function} to use to
	*	parse individual keys of the return object.
	* @returns {(Object|null)} If parameters are valid, an [object]{@glossary Object}
	* is returned; otherwise, `null`.
	* @public
	*/
	parse: function(json, reviver) {
		return json ? JSON.parse(json, reviver) : null;
	}
};

}],'enyo/AjaxProperties':[function (module,exports,global,require,request){
require('enyo');

/**
* The available options used by {@link module:enyo/Ajax~Ajax} and {@link module:enyo/WebService~WebService}. You will not
* generally want to access this module directly.
*
* @module enyo/AjaxProperties
* @public
*/
module.exports = {
	
	/**
	* When `true`, appends a random number as a parameter for `GET` requests to try to
	* force a new fetch of the resource instead of reusing a local cache.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	cacheBust: true,
	
	/**
	* The URL for the service. This may be a relative URL if used to fetch resources bundled
	* with the application.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	url: '',
	
	/**
	* The HTTP method to use for the request; defaults to `'GET'`.  Supported values include
	* `'GET'`, `'POST'`, `'PUT'`, and `'DELETE'`.
	*
	* @type {String}
	* @default 'GET'
	* @public
	*/
	method: 'GET', // {value: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE']}
	
	/**
	* How the response will be handled. Supported values are `'json'`, `'text'`, and `'xml'`.
	*
	* @type {String}
	* @default 'json'
	* @public
	*/
	handleAs: 'json', // {value: 'json', options: ['text', 'json', 'xml']}
	
	/**
	* The `Content-Type` header for the request as a String.
	*
	* @type {String}
	* @default 'application/x-www-form-urlencoded'
	* @public
	*/
	contentType: 'application/x-www-form-urlencoded',
	
	/**
	* If `true`, makes a synchronous (blocking) call, if supported.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	sync: false,
	
	/**
	* Optional additional request headers as a [hash]{@glossary Object}, or `null`.
	
	* ```javascript
	* { 'X-My-Header': 'My Value', 'Mood': 'Happy' }
	* ```
	*
	* @type {Object}
	* @default null
	* @public
	*/
	headers: null,
	
	/**
	* The content for the request body for `POST/PUT` methods. When `postBody` is a
	* [buffer]{@glossary Buffer} or a [string]{@glossary String}, it is passed
	* verbatim in the request body. When it is a [hash]{@glossary Object}, the way it is
	* encoded depends on the `contentType`:
	*
	* - `'application/json'` => [JSON.stringify()]{@glossary JSON.stringify}
	* - `'application/x-www-urlencoded'` => url-encoded parameters
	* - `'multipart/form-data'` => passed as fields in {@link module:enyo/FormData} (XHR2 emulation)
	*
	* @type {(String|Buffer|Object)}
	* @default ''
	* @public
	*/
	postBody: '',

	/**
	* The optional username to use for authentication purposes.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	username: '',
	
	/**
	* The optional password to use for authentication purposes.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	password: '',
	
	/**
	* Optional [hash]{@glossary Object} with fields to pass directly to the underlying XHR
	* object. One example is the `withCredentials` flag used for cross-origin requests.
	*
	* @type {Object}
	* @default null
	* @public
	*/
	xhrFields: null,
	
	/**
	* Optional [string]{@glossary String} to override the `MIME-Type` header.
	*
	* @type {String}
	* @default null
	* @public
	*/
	mimeType: null
};

}],'enyo/roots':[function (module,exports,global,require,request){
require('enyo');

/**
* @module enyo/roots
*/

/**
* @private
*/
var callbacks = [],
	roots = [];

/**
* Registers a single callback to be executed whenever a root view is rendered.
* 
* @name enyo.rendered
* @method
* @param {Function} method - The callback to execute.
* @param {Object} [context=enyo.global] The context under which to execute the callback.
* @public
*/
exports.rendered = function (method, context) {
	callbacks.push({method: method, context: context || global});
};

/**
* @private
*/
exports.roots = roots;

/**
* Invokes all known callbacks (if any) against the root view once it has been rendered.
* This method is not likely to be executed very often.
* 
* @private
*/
function invoke (root) {
	callbacks.forEach(function (ln) {
		ln.method.call(ln.context, root);
	});
}

/**
* @private
*/
exports.addToRoots = function (view) {
	var rendered,
		destroy;
	
	// since it is possible to call renderInto more than once on a given view we ensure we
	// don't register it twice unnecessarily
	if (roots.indexOf(view) === -1) {
		
		roots.push(view);
		
		// hijack the rendered method
		rendered = view.rendered;
		
		// hijack the destroy method
		destroy = view.destroy;
		
		// supply our rendered hook
		view.rendered = function () {
			// we call the original first
			rendered.apply(this, arguments);
			
			// and now we invoke the known callbacks against this root
			invoke(this);
		};
		
		// supply our destroy hook
		view.destroy = function () {
			var idx = roots.indexOf(this);
			
			// remove it from the roots array
			if (idx > -1) roots.splice(idx, 1);
			
			// now we can call the original
			destroy.apply(this, arguments);
		};
	}
};

}],'enyo/job':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains methods for dealing with jobs.
* @module enyo/job
*/
var _jobs = {};

/**
* Runs a job after a specified amount of time has elapsed
* since a job with the same name has run.
* 
* Jobs can be used to throttle behaviors.  If some event may occur one time or
* multiple times, but we want a response to occur only once every `n` seconds,
* we can use a job.
*
* ```
* onscroll: function() {
* 	// updateThumb will be called, but only when 1 second has elapsed since the
* 	// last onscroll
* 	exports("updateThumb", this.bindSafely("updateThumb"), 1000);
* }
* ```
*
* @param {String} nom - The name of the job to throttle.
* @param {(Function|String)} job - Either the name of a method or a [function]{@glossary Function}
*                                to execute as the requested job.
* @param {Number} wait - The number of milliseconds to wait before executing the job again.
* @function
* @public
*/
exports = module.exports = function (nom, job, wait) {
	exports.stop(nom);
	_jobs[nom] = setTimeout(function() {
		exports.stop(nom);
		job();
	}, wait);
};

/**
* Cancels the named job, if it has not already fired.
*
* @param {String} nom - The name of the job to cancel.
* @static
* @public
*/
exports.stop = function (nom) {
	if (_jobs[nom]) {
		clearTimeout(_jobs[nom]);
		delete _jobs[nom];
	}
};

/**
* Immediately invokes the job and prevents any other calls
* to `exports.throttle()` with the same job name from running for the
* specified amount of time.
* 
* This is used for throttling user events when you want to provide an
* immediate response, but later invocations might just be noise if they arrive
* too often.
* 
* @param {String} nom - The name of the job to throttle.
* @param {(Function|String)} job - Either the name of a method or a [function]{@glossary Function}
*                                to execute as the requested job.
* @param {Number} wait - The number of milliseconds to wait before executing the
*                      job again.
* @static
* @public
*/
exports.throttle = function (nom, job, wait) {
	// if we still have a job with this name pending, return immediately
	if (_jobs[nom]) {
		return;
	}
	job();
	_jobs[nom] = setTimeout(function() {
		exports.stop(nom);
	}, wait);
};

}],'enyo/platform':[function (module,exports,global,require,request){
require('enyo');

var utils = require('./utils');

/**
* Determines OS versions of platforms that need special treatment. Can have one of the following
* properties:
*
* * android
* * androidChrome (Chrome on Android, standard starting in 4.1)
* * androidFirefox
* * ie
* * edge
* * ios
* * webos
* * windowsPhone
* * blackberry
* * tizen
* * safari (desktop version)
* * chrome (desktop version)
* * firefox (desktop version)
* * firefoxOS
*
* If the property is defined, its value will be the major version number of the platform.
*
* Example:
* ```javascript
* // android 2 does not have 3d css
* if (enyo.platform.android < 3) {
* 	t = 'translate(30px, 50px)';
* } else {
* 	t = 'translate3d(30px, 50px, 0)';
* }
* this.applyStyle('-webkit-transform', t);
* ```
*
* @module enyo/platform
*/
exports = module.exports = {
	/**
	* `true` if the platform has native single-finger [events]{@glossary event}.
	* @public
	*/
	touch: Boolean(('ontouchstart' in window) || window.navigator.msMaxTouchPoints || (window.navigator.msManipulationViewsEnabled && window.navigator.maxTouchPoints)),
	/**
	* `true` if the platform has native double-finger [events]{@glossary event}.
	* @public
	*/
	gesture: Boolean(('ongesturestart' in window) || ('onmsgesturestart' in window && (window.navigator.msMaxTouchPoints > 1 || window.navigator.maxTouchPoints > 1)))

	/**
	* The name of the platform that was detected or `undefined` if the platform
	* was unrecognized. This value is the key name for the major version of the
	* platform on the exported object.
	* @member {String} platformName
	* @public
	*/

};

var ua = navigator.userAgent;
var ep = exports;
var platforms = [
	// Windows Phone 7 - 10
	{platform: 'windowsPhone', regex: /Windows Phone (?:OS )?(\d+)[.\d]+/},
	// Android 4+ using Chrome
	{platform: 'androidChrome', regex: /Android .* Chrome\/(\d+)[.\d]+/},
	// Android 2 - 4
	{platform: 'android', regex: /Android(?:\s|\/)(\d+)/},
	// Kindle Fire
	// Force version to 2, (desktop mode does not list android version)
	{platform: 'android', regex: /Silk\/1./, forceVersion: 2, extra: {silk: 1}},
	// Kindle Fire HD (Silk versions 2 or 3)
	// Force version to 4
	{platform: 'android', regex: /Silk\/2./, forceVersion: 4, extra: {silk: 2}},
	{platform: 'android', regex: /Silk\/3./, forceVersion: 4, extra: {silk: 3}},
	// IE 8 - 10
	{platform: 'ie', regex: /MSIE (\d+)/},
	// IE 11
	{platform: 'ie', regex: /Trident\/.*; rv:(\d+)/},
	// Edge
	{platform: 'edge', regex: /Edge\/(\d+)/},
	// iOS 3 - 5
	// Apple likes to make this complicated
	{platform: 'ios', regex: /iP(?:hone|ad;(?: U;)? CPU) OS (\d+)/},
	// webOS 1 - 3
	{platform: 'webos', regex: /(?:web|hpw)OS\/(\d+)/},
	// webOS 4 / OpenWebOS
	{platform: 'webos', regex: /WebAppManager|Isis|webOS\./, forceVersion: 4},
	// Open webOS release LuneOS
	{platform: 'webos', regex: /LuneOS/, forceVersion: 4, extra: {luneos: 1}},
	// desktop Safari
	{platform: 'safari', regex: /Version\/(\d+)[.\d]+\s+Safari/},
	// desktop Chrome
	{platform: 'chrome', regex: /Chrome\/(\d+)[.\d]+/},
	// Firefox on Android
	{platform: 'androidFirefox', regex: /Android;.*Firefox\/(\d+)/},
	// FirefoxOS
	{platform: 'firefoxOS', regex: /Mobile;.*Firefox\/(\d+)/},
	// desktop Firefox
	{platform: 'firefox', regex: /Firefox\/(\d+)/},
	// Blackberry Playbook
	{platform: 'blackberry', regex: /PlayBook/i, forceVersion: 2},
	// Blackberry 10+
	{platform: 'blackberry', regex: /BB1\d;.*Version\/(\d+\.\d+)/},
	// Tizen
	{platform: 'tizen', regex: /Tizen (\d+)/}
];
for (var i = 0, p, m, v; (p = platforms[i]); i++) {
	m = p.regex.exec(ua);
	if (m) {
		if (p.forceVersion) {
			v = p.forceVersion;
		} else {
			v = Number(m[1]);
		}
		ep[p.platform] = v;
		if (p.extra) {
			utils.mixin(ep, p.extra);
		}
		ep.platformName = p.platform;
		break;
	}
}

},{'./utils':'enyo/utils'}],'enyo/FormData':[function (module,exports,global,require,request){
require('enyo');

var
	utils = require('./utils');

/**
* An [XHR2]{@linkplain http://www.w3.org/TR/XMLHttpRequest/} FormData implementation.
* It is used to send `multipart/form-data` [Ajax]{@glossary ajax} requests. The
* internal [enyo/Blob]{@link module:enyo/Blob} [kind]{@glossary kind} is the
* content provider for file-parts.
*
* Note that in Internet Explorer < 10, both `enyo/FormData` and `enyo/Blob` are
* limited to [string]{@glossary String} content and `enyo/Blob` may only be
* instantiated using an [array]{@glossary Array} of [strings]{@glossary String}.
*
* This implementation is inspired by
* [html5-formdata]{@linkplain https://github.com/francois2metz/html5-formdata/blob/master/formdata.js}.
*
* ```
* Emulate FormData for some browsers
* MIT License
* (c) 2010 Francois de Metz
* ```
*
* @module enyo/FormData
* @public
*/
exports = null;

if (typeof FormData != 'undefined') {
	try {
		new FormData();
		
		exports = module.exports = FormData;
	// Android Chrome 18 will throw an error trying to create this
	} catch (e) {}
}

if (!exports) {

	/*jshint -W082 */
	function FormData() {
		this.fake = true;
		this._fields = [];
		// This generates a 50 character boundary similar to
		// those used by Firefox.  They are optimized for
		// boyer-moore parsing.
		this.boundary = '--------------------------';
		for (var i = 0; i < 24; i++) {
			this.boundary += Math.floor(Math.random() * 10).toString(16);
		}
	}
	FormData.prototype.getContentType = function() {
		return "multipart/form-data; boundary=" + this.boundary;
	};
	FormData.prototype.append = function(key, value, filename) {
		this._fields.push([key, value, filename]);
	};
	FormData.prototype.toString = function() {
		var boundary = this.boundary;
		var body = "";
		utils.forEach(this._fields, function(field) {
			body += "--" + boundary + "\r\n";
			if (field[2] || field[1].name) {
				// file upload
				var file = field[1], filename = field[2] || file.name;
				body += "Content-Disposition: form-data; name=\""+ field[0] +"\"; filename=\""+ filename +"\"\r\n";
				body += "Content-Type: "+ file.type +"\r\n\r\n";
				body += file.getAsBinary() + "\r\n";
			} else {
				// key-value field
				body += "Content-Disposition: form-data; name=\""+ field[0] +"\";\r\n\r\n";
				body += field[1] + "\r\n";
			}
		});
		body += "--" + boundary +"--";
		return body;
	};
	/*jshint +W082 */
	
	module.exports = FormData;
}

},{'./utils':'enyo/utils'}],'enyo/logger':[function (module,exports,global,require,request){
require('enyo');

var
	json = require('./json'),
	utils = require('./utils'),
	platform = require('./platform');

/**
* These platforms only allow one argument for [console.log()]{@glossary console.log}:
*
* * android
* * ios
* * webos
*
* @ignore
*/
var dumbConsole = Boolean(platform.android || platform.ios || platform.webos);

/**
* Internally used methods and properties associated with logging.
*
* @module enyo/logger
* @public
*/
exports = module.exports = {

	/**
	* The log level to use. Can be a value from -1 to 99, where -1 disables all
	* logging, 0 is 'error', 10 is 'warn', and 20 is 'log'. It is preferred that
	* this value be set using the [setLogLevel()]{@link module:enyo/logger#setLogLevel}
	* method.
	*
	* @type {Number}
	* @default 99
	* @public
	*/
	level: 99,

	/**
	* The known levels.
	*
	* @private
	*/
	levels: {log: 20, warn: 10, error: 0},

	/**
	* @private
	*/
	shouldLog: function (fn) {
		var ll = parseInt(this.levels[fn], 0);
		return (ll <= this.level);
	},

	/**
	* @private
	*/
	validateArgs: function (args) {
		// gracefully handle and prevent circular reference errors in objects
		for (var i=0, l=args.length, item; (item=args[i]) || i<l; i++) {
			try {
				if (typeof item === 'object') {
					args[i] = json.stringify(item);
				}
			} catch (e) {
				args[i] = 'Error: ' + e.message;
			}
		}
	},

	/**
	* @private
	*/
	_log: function (fn, args) {
		// avoid trying to use console on IE instances where the object hasn't been
		// created due to the developer tools being unopened
		var console = global.console;
		if (typeof console === 'undefined') {
            return;
        }
		//var a$ = utils.logging.formatArgs(fn, args);
		var a$ = utils.isArray(args) ? args : utils.cloneArray(args);
		if (platform.androidFirefox) {
			// Firefox for Android's console does not handle objects with circular references
			this.validateArgs(a$);
		}
		if (dumbConsole) {
			// at least in early versions of webos, console.* only accept a single argument
			a$ = [a$.join(' ')];
		}
		var fn$ = console[fn];
		if (fn$ && fn$.apply) {
			// some consoles support 'warn', 'info', and so on
			fn$.apply(console, a$);
		} else if (console.log.apply) {
			// some consoles support console.log.apply
			console.log.apply(console, a$);
		} else {
			// otherwise, do our own formatting
			console.log(a$.join(' '));
		}
	},

	/**
	* This is exposed elsewhere.
	*
	* @private
	*/
	log: function (fn, args) {

		if (fn != 'log' && fn != 'warn' && fn != 'error') {
			args = Array.prototype.slice.call(arguments);
			fn = 'log';
		}

		var console = global.console;
		if (typeof console !== 'undefined') {
			if (this.shouldLog(fn)) {
				this._log(fn, args);
			}
		}
	}
};

/**
* Sets the log level to the given value. This will restrict the amount of output depending on
* the settings. The higher the value, the more output that will be allowed. The default is
* 99. The value, -1, would silence all logging, even 'error' (0).
* Without the 'see': {@link module:enyo/logger#log}.
*
* @see module:enyo/logger#level
* @see module:enyo/logger#log
* @see module:enyo/logger#warn
* @see module:enyo/logger#error
* @param {Number} level - The level to set logging to.
*/
exports.setLogLevel = function (level) {
	var ll = parseInt(level, 0);
	if (isFinite(ll)) {
		this.level = ll;
	}
};

/**
* A wrapper for [console.log()]{@glossary console.log}, compatible
* across supported platforms. Will output only if the current
* [log level]{@link module:enyo/logger#level} allows it. [Object]{@glossary Object}
* parameters will be serialized via [JSON.stringify()]{@glossary JSON.stringify}
* automatically.
*
* @utility
* @see {@glossary console.log}
* @param {...*} - The arguments to be logged.
* @public
*/

/**
* A wrapper for [console.warn()]{@glossary console.warn}, compatible
* across supported platforms. Will output only if the current
* [log level]{@link module:enyo/logger#level} allows it. [Object]{@glossary Object}
* parameters will be serialized via [JSON.stringify()]{@glossary JSON.stringify}
* automatically.
*
* @utility
* @see {@glossary console.warn}
* @param {...*} - The arguments to be logged.
* @public
*/
exports.warn = function () {
	this.log('warn', arguments);
};

/**
* A wrapper for [console.error()]{@glossary console.error}, compatible
* across supported platforms. Will output only if the current
* [log level]{@link module:enyo/logger#level} allows it. [Object]{@glossary Object}
* parameters will be serialized via [JSON.stringify()]{@glossary JSON.stringify}
* automatically.
*
* @utility
* @see {@glossary console.error}
* @param {...*} - The arguments to be logged.
* @public
*/
exports.error = function () {
	this.log('error', arguments);
};

},{'./json':'enyo/json','./utils':'enyo/utils','./platform':'enyo/platform'}],'enyo/dom':[function (module,exports,global,require,request){
/**
* Contains methods for working with DOM
* @module enyo/dom
*/
require('enyo');

var
	roots = require('./roots'),
	utils = require('./utils'),
	platform = require('./platform');

var dom = module.exports = {

	/**
	* Shortcut for `document.getElementById()` if `id` is a string; otherwise,
	* returns `id`. Uses `global.document` unless a document is specified in the
	* (optional) `doc` parameter.
	*
	* ```javascript
	* var
	* 	dom = require('enyo/dom');
	*
	* // find 'node' if it's a string id, or return it unchanged if it's already a node reference
	* var domNode = dom.byId(node);
	* ```
	*
	* @param {String} id - The document element ID to get.
	* @param {Node} [doc] - A [node]{@glossary Node} to search in. Default is the whole
	*	document.
	* @returns {Element} A reference to a DOM element.
	* @public
	*/
	byId: function(id, doc){
		return (typeof id == 'string') ? (doc || document).getElementById(id) : id;
	},

	/**
	* Returns a string with ampersand, less-than, and greater-than characters replaced with HTML
	* entities, e.g.,
	* ```
	* '&lt;code&gt;'This &amp; That'&lt;/code&gt;'
	* ```
	* becomes
	* ```
	* '&amp;lt;code&amp;gt;'This &amp;amp; That'&amp;lt;/code&amp;gt;'
	* ```
	*
	* @param {String} text - A string with entities you'd like to escape/convert.
	* @returns {String} A string that is properly escaped (the above characters.)
	* @public
	*/
	escape: function(text) {
		return text !== null ? String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
	},

	/**
	* Returns an object describing the geometry of this node.
	*
	* @param {Node} n - The [node]{@glossary Node} to measure.
	* @returns {Object} An object containing the properties `top`, `left`,
	* `height`, and `width`.
	* @public
	*/
	getBounds: function(n) {
		if (n) {
			return {left: n.offsetLeft, top: n.offsetTop, width: n.offsetWidth, height: n.offsetHeight};
		}
		else {
			return null;
		}
	},

	/**
	* @private
	*/
	getComputedStyle: function(node) {
		return global.getComputedStyle && node && global.getComputedStyle(node, null);
	},

	/**
	* @private
	*/
	getComputedStyleValue: function(node, property, computedStyle) {
		var s   = computedStyle || this.getComputedStyle(node),
			nIE = platform.ie;

		s = s ? s.getPropertyValue(property) : null;

		if (nIE) {
			var oConversion = {
				'thin'   : '2px',
				'medium' : '4px',
				'thick'  : '6px',
				'none'   : '0'
			};
			if (typeof oConversion[s] != 'undefined') {
				s = oConversion[s];
			}

			if (s == 'auto') {
				switch (property) {
				case 'width':
					s = node.offsetWidth;
					break;
				case 'height':
					s = node.offsetHeight;
					break;
				}
			}
		}

		return s;
	},

	/**
	* @private
	*/
	getFirstElementByTagName: function(tagName) {
		var e = document.getElementsByTagName(tagName);
		return e && e[0];
	},

	/**
	* @private
	*/
	applyBodyFit: function() {
		var h = this.getFirstElementByTagName('html');
		if (h) {
			this.addClass(h, 'enyo-document-fit');
		}
		dom.addBodyClass('enyo-body-fit');
		dom.bodyIsFitting = true;
	},

	/**
	* @private
	*/
	getWindowWidth: function() {
		if (global.innerWidth) {
			return global.innerWidth;
		}
		if (document.body && document.body.offsetWidth) {
			return document.body.offsetWidth;
		}
		if (document.compatMode=='CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetWidth ) {
			return document.documentElement.offsetWidth;
		}
		return 320;
	},

	/**
	* @private
	*/
	getWindowHeight: function() {
		if (global.innerHeight) {
			return global.innerHeight;
		}
		if (document.body && document.body.offsetHeight) {
			return document.body.offsetHeight;
		}
		if (document.compatMode=='CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetHeight ) {
			return document.documentElement.offsetHeight;
		}
		return 480;
	},

	/**
	* The proportion by which the `body` tag differs from the global size, in both X and Y
	* dimensions. This is relevant when we need to scale the whole interface down from 1920x1080
	* (1080p) to 1280x720 (720p), for example.
	*
	* @private
	*/
	_bodyScaleFactorY: 1,
	_bodyScaleFactorX: 1,
	updateScaleFactor: function() {
		var bodyBounds = this.getBounds(document.body);
		this._bodyScaleFactorY = bodyBounds.height / this.getWindowHeight();
		this._bodyScaleFactorX = bodyBounds.width / this.getWindowWidth();
	},

	/**
	* @private
	*/
	getComputedBoxValue: function(node, prop, boundary, computedStyle) {
		var s = computedStyle || this.getComputedStyle(node);
		if (s) {
			var p = s.getPropertyValue(prop + '-' + boundary);
			return p === 'auto' ? 0 : parseInt(p, 10);
		}
		return 0;
	},

	/**
	* Gets the boundaries of a [node's]{@glossary Node} `margin` or `padding` box.
	*
	* @param {Node} node - The [node]{@glossary Node} to measure.
	* @param {Node} box - The boundary to measure from ('padding' or 'margin').
	* @returns {Object} An object containing the properties `top`, `right`, `bottom`, and
	*	`left`.
	* @public
	*/
	calcBoxExtents: function(node, box) {
		var s = this.getComputedStyle(node);
		return {
			top: this.getComputedBoxValue(node, box, 'top', s),
			right: this.getComputedBoxValue(node, box, 'right', s),
			bottom: this.getComputedBoxValue(node, box, 'bottom', s),
			left: this.getComputedBoxValue(node, box, 'left', s)
		};
	},

	/**
	* Gets the calculated padding of a node. Shortcut for
	* {@link module:enyo/dom#calcBoxExtents}.
	*
	* @param {Node} node - The [node]{@glossary Node} to measure.
	* @returns {Object} An object containing the properties `top`, `right`, `bottom`, and
	*	`left`.
	* @public
	*/
	calcPaddingExtents: function(node) {
		return this.calcBoxExtents(node, 'padding');
	},

	/**
	* Gets the calculated margin of a node. Shortcut for
	* {@link module:enyo/dom#calcBoxExtents}.
	*
	* @param {Node} node - The [node]{@glossary Node} to measure.
	* @returns {Object} An object containing the properties `top`, `right`, `bottom`, and
	*	`left`.
	* @public
	*/
	calcMarginExtents: function(node) {
		return this.calcBoxExtents(node, 'margin');
	},
	/**
	* Returns an object like `{top: 0, left: 0, bottom: 100, right: 100, height: 10, width: 10}`
	* that represents the object's position relative to `relativeToNode` (suitable for absolute
	* positioning within that parent node). Negative values mean part of the object is not
	* visible. If you leave `relativeToNode` as `undefined` (or it is not a parent element), then
	* the position will be relative to the viewport and suitable for absolute positioning in a
	* floating layer.
	*
	* @param {Node} node - The [node]{@glossary Node} to measure.
	* @param {Node} relativeToNode - The [node]{@glossary Node} to measure the distance from.
	* @returns {Object} An object containing the properties `top`, `right`, `bottom`, `left`,
	*	`height`, and `width`.
	* @public
	*/
	calcNodePosition: function(targetNode, relativeToNode) {
		// Parse upward and grab our positioning relative to the viewport
		var top = 0,
			left = 0,
			node = targetNode,
			width = node.offsetWidth,
			height = node.offsetHeight,
			transformProp = dom.getStyleTransformProp(),
			xregex = /translateX\((-?\d+)px\)/i,
			yregex = /translateY\((-?\d+)px\)/i,
			borderLeft = 0, borderTop = 0,
			totalHeight = 0, totalWidth = 0,
			offsetAdjustLeft = 0, offsetAdjustTop = 0;

		if (relativeToNode) {
			totalHeight = relativeToNode.offsetHeight;
			totalWidth = relativeToNode.offsetWidth;
		} else {
			totalHeight = (document.body.parentNode.offsetHeight > this.getWindowHeight() ? this.getWindowHeight() - document.body.parentNode.scrollTop : document.body.parentNode.offsetHeight);
			totalWidth = (document.body.parentNode.offsetWidth > this.getWindowWidth() ? this.getWindowWidth() - document.body.parentNode.scrollLeft : document.body.parentNode.offsetWidth);
		}

		if (node.offsetParent) {
			do {
				// Adjust the offset if relativeToNode is a child of the offsetParent
				if (relativeToNode && relativeToNode.compareDocumentPosition(node.offsetParent) & Node.DOCUMENT_POSITION_CONTAINS) {
					offsetAdjustLeft = relativeToNode.offsetLeft;
					offsetAdjustTop = relativeToNode.offsetTop;
				}
				// Ajust our top and left properties based on the position relative to the parent
				left += node.offsetLeft - (node.offsetParent ? node.offsetParent.scrollLeft : 0) - offsetAdjustLeft;
				if (transformProp && xregex.test(node.style[transformProp])) {
					left += parseInt(node.style[transformProp].replace(xregex, '$1'), 10);
				}
				top += node.offsetTop - (node.offsetParent ? node.offsetParent.scrollTop : 0) - offsetAdjustTop;
				if (transformProp && yregex.test(node.style[transformProp])) {
					top += parseInt(node.style[transformProp].replace(yregex, '$1'), 10);
				}
				// Need to correct for borders if any exist on parent elements
				if (node !== targetNode) {
					if (global.getComputedStyle) {
						borderLeft = parseInt(global.getComputedStyle(node, '').getPropertyValue('border-left-width'), 10);
						borderTop = parseInt(global.getComputedStyle(node, '').getPropertyValue('border-top-width'), 10);
					} else {
						// No computed style options, so try the normal style object (much less robust)
						borderLeft = parseInt(node.style.borderLeftWidth, 10);
						borderTop = parseInt(node.style.borderTopWidth, 10);
					}
					if (borderLeft) {
						left += borderLeft;
					}
					if (borderTop) {
						top += borderTop;
					}
				}
				// Continue if we have an additional offsetParent, and either don't have a relativeToNode or the offsetParent is contained by the relativeToNode (if offsetParent contains relativeToNode, then we have already calculated up to the node, and can safely exit)
			} while ((node = node.offsetParent) && (!relativeToNode || relativeToNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY));
		}
		return {
			'top': top,
			'left': left,
			'bottom': totalHeight - top - height,
			'right': totalWidth - left - width,
			'height': height,
			'width': width
		};
	},

	/**
	* Removes a node from the DOM.
	*
	* @param {Node} node - The [node]{@glossary Node} to remove.
	* @public
	*/
	removeNode: function (node) {
		if (node.parentNode) node.parentNode.removeChild(node);
	},

	/**
	* Sets the `innerHTML` property of the specified `node` to `html`.
	*
	* @param {Node} node - The [node]{@glossary Node} to set.
	* @param {String} html - An HTML string.
	* @public
	*/
	setInnerHtml: function(node, html) {
		node.innerHTML = html;
	},

	/**
	* Checks a [DOM]{@glossary Node} [node]{@glossary Node} for a specific CSS class.
	*
	* @param {Node} node - The [node]{@glossary Node} to set.
	* @param {String} s - The class name to check for.
	* @returns {(Boolean|undefined)} `true` if `node` has the `s` class; `undefined`
	* if there is no `node` or it has no `className` property.
	* @public
	*/
	hasClass: function(node, s) {
		if (!node || !s || !node.className) { return; }
		return (' ' + node.className + ' ').indexOf(' ' + s + ' ') >= 0;
	},

	/**
	* Uniquely adds a CSS class to a DOM node.
	*
	* @param {Node} node - The [node]{@glossary Node} to set.
	* @param {String} s - The class name to add.
	* @public
	*/
	addClass: function(node, s) {
		if (node && s && !this.hasClass(node, s)) {
			var ss = node.className;
			node.className = (ss + (ss ? ' ' : '') + s);
		}
	},

	/**
	* Removes a CSS class from a DOM node if it exists.
	*
	* @param {Node} node - The [node]{@glossary Node} from which to remove the class.
	* @param {String} s - The class name to remove from `node`.
	* @public
	*/
	removeClass: function(node, s) {
		if (node && s && this.hasClass(node, s)) {
			var ss = node.className;
			node.className = (' ' + ss + ' ').replace(' ' + s + ' ', ' ').slice(1, -1);
		}
	},

	/**
	* Adds a class to `document.body`. This defers the actual class change if nothing has been
	* rendered into `body` yet.
	*
	* @param {String} s - The class name to add to the document's `body`.
	* @public
	*/
	addBodyClass: function(s) {
		if (!utils.exists(roots.roots) || roots.roots.length === 0) {
			if (dom._bodyClasses) {
				dom._bodyClasses.push(s);
			} else {
				dom._bodyClasses = [s];
			}
		}
		else {
			dom.addClass(document.body, s);
		}
	},

	/**
	* Removes a class from `document.body`. This defers the actual class change if nothing has been
	* rendered into `body` yet.
	*
	* @param {String} s - The class name to remove from the document's `body`.
	* @public
	*/
	removeBodyClass: function(s) {
		if (!utils.exists(roots.roots) || roots.roots.length === 0) {
			if (dom._bodyClasses) {
				dom._bodyClasses = dom._bodyClasses.filter(function (cl) {
					return (cl !== s);
				});
			}
		}
		else {
			dom.removeClass(document.body, s);
		}
	},

	/**
	* Returns an object describing the absolute position on the screen, relative to the top left
	* corner of the screen. This function takes into account account absolute/relative
	* `offsetParent` positioning, `scroll` position, and CSS transforms (currently
	* `translateX`, `translateY`, and `matrix3d`).
	*
	* ```javascript
	* {top: ..., right: ..., bottom: ..., left: ..., height: ..., width: ...}
	* ```
	*
	* Values returned are only valid if `hasNode()` is truthy. If there's no DOM node for the
	* object, this returns a bounds structure with `undefined` as the value of all fields.
	*
	* @param {Node} n - The [node]{@glossary Node} to measure.
	* @returns {Object} An object containing the properties `top`, `right`, `bottom`, `left`,
	*	`height`, and `width`.
	* @public
	*/
	getAbsoluteBounds: function(targetNode) {
		return utils.clone(targetNode.getBoundingClientRect());
	},

	/**
	* @private
	*/
	flushBodyClasses: function() {
		if (dom._bodyClasses) {
			for (var i = 0, c; (c=dom._bodyClasses[i]); ++i) {
				dom.addClass(document.body, c);
			}
			dom._bodyClasses = null;
		}
	},

	/**
	* @private
	*/
	_bodyClasses: null,

	/**
	* Convert to various unit formats. Useful for converting pixels to a resolution-independent
	* measurement method, like "rem". Other units are available if defined in the
	* {@link module:enyo/dom#unitToPixelFactors} object.
	*
	* ```javascript
	* var
	* 	dom = require('enyo/dom');
	*
	* // Do calculations and get back the desired CSS unit.
	* var frameWidth = 250,
	*     frameWithMarginInches = dom.unit( 10 + frameWidth + 10, 'in' ),
	*     frameWithMarginRems = dom.unit( 10 + frameWidth + 10, 'rem' );
	* // '2.8125in' == frameWithMarginInches
	* // '22.5rem' == frameWithMarginRems
	* ```
	*
	* @param {(String|Number)} pixels - The the pixels or math to convert to the unit.
	*	("px" suffix in String format is permitted. ex: `'20px'`)
	* @param {(String)} toUnit - The name of the unit to convert to.
	* @returns {(Number|undefined)} Resulting conversion, in case of malformed input, `undefined`
	* @public
	*/
	unit: function (pixels, toUnit) {
		if (!toUnit || !this.unitToPixelFactors[toUnit]) return;
		if (typeof pixels == 'string' && pixels.substr(-2) == 'px') pixels = parseInt(pixels.substr(0, pixels.length - 2), 10);
		if (typeof pixels != 'number') return;

		return (pixels / this.unitToPixelFactors[toUnit]) + '' + toUnit;
	},

	/**
	* Object that stores all of the pixel conversion factors to each keyed unit.
	*
	* @public
	*/
	unitToPixelFactors: {
		'rem': 12,
		'in': 96
	}
};

// override setInnerHtml for Windows 8 HTML applications
if (typeof global.MSApp !== 'undefined' && typeof global.MSApp.execUnsafeLocalFunction !== 'undefined') {
	dom.setInnerHtml = function(node, html) {
		global.MSApp.execUnsafeLocalFunction(function() {
			node.innerHTML = html;
		});
	};
}

// use faster classList interface if it exists
if (document.head && document.head.classList) {
	dom.hasClass = function(node, s) {
		if (node) {
			return node.classList.contains(s);
		}
	};
	dom.addClass = function(node, s) {
		if (node) {
			return node.classList.add(s);
		}
	};
	dom.removeClass = function (node, s) {
		if (node) {
			return node.classList.remove(s);
		}
	};
}

/**
* Allows bootstrapping in environments that do not have a global object right away.
*
* @param {Function} func - The function to run
* @public
*/
dom.requiresWindow = function(func) {
	func();
};


var cssTransformProps = ['transform', '-webkit-transform', '-moz-transform', '-ms-transform', '-o-transform'],
	styleTransformProps = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'OTransform'];

/**
* @private
*/
dom.calcCanAccelerate = function() {
	/* Android 2 is a liar: it does NOT support 3D transforms, even though Perspective is the best check */
	if (platform.android <= 2) {
		return false;
	}
	var p$ = ['perspective', 'WebkitPerspective', 'MozPerspective', 'msPerspective', 'OPerspective'];
	for (var i=0, p; (p=p$[i]); i++) {
		if (typeof document.body.style[p] != 'undefined') {
			return true;
		}
	}
	return false;
};
/**
* @private
*/
dom.getCssTransformProp = function() {
	if (this._cssTransformProp) {
		return this._cssTransformProp;
	}
	var i = utils.indexOf(this.getStyleTransformProp(), styleTransformProps);
	this._cssTransformProp = cssTransformProps[i];
	return this._cssTransformProp;
};

/**
* @private
*/
dom.getStyleTransformProp = function() {
	if (this._styleTransformProp || !document.body) {
		return this._styleTransformProp;
	}
	for (var i = 0, p; (p = styleTransformProps[i]); i++) {
		if (typeof document.body.style[p] != 'undefined') {
			this._styleTransformProp = p;
			return this._styleTransformProp;
		}
	}
};

/**
* @private
*/
dom.domTransformsToCss = function(inTransforms) {
	var n, v, text = '';
	for (n in inTransforms) {
		v = inTransforms[n];
		if ((v !== null) && (v !== undefined) && (v !== '')) {
			text +=  n + '(' + v + ') ';
		}
	}
	return text;
};

/**
* @private
*/
dom.transformsToDom = function(control) {
	var css = this.domTransformsToCss(control.domTransforms),
		styleProp;

	if (control.hasNode()) {
		styleProp = this.getStyleTransformProp();
	} else {
		styleProp = this.getCssTransformProp();
	}

	if (styleProp) control.applyStyle(styleProp, css);
};

/**
* Returns `true` if the platform supports CSS3 Transforms.
*
* @returns {Boolean} `true` if platform supports CSS `transform` property;
* otherwise, `false`.
* @public
*/
dom.canTransform = function() {
	return Boolean(this.getStyleTransformProp());
};

/**
* Returns `true` if platform supports CSS3 3D Transforms.
*
* Typically used like this:
* ```
* if (dom.canAccelerate()) {
* 	dom.transformValue(this.$.slidingThing, 'translate3d', x + ',' + y + ',' + '0')
* } else {
* 	dom.transformValue(this.$.slidingThing, 'translate', x + ',' + y);
* }
* ```
*
* @returns {Boolean} `true` if platform supports CSS3 3D Transforms;
* otherwise, `false`.
* @public
*/
dom.canAccelerate = function() {
	return (this.accelerando !== undefined) ? this.accelerando : document.body && (this.accelerando = this.calcCanAccelerate());
};

/**
* Applies a series of transforms to the specified {@link module:enyo/Control~Control}, using
* the platform's prefixed `transform` property.
*
* **Note:** Transforms are not commutative, so order is important.
*
* Transform values are updated by successive calls, so
* ```javascript
* dom.transform(control, {translate: '30px, 40px', scale: 2, rotate: '20deg'});
* dom.transform(control, {scale: 3, skewX: '-30deg'});
* ```
*
* is equivalent to:
* ```javascript
* dom.transform(control, {translate: '30px, 40px', scale: 3, rotate: '20deg', skewX: '-30deg'});
* ```
*
* When applying these transforms in a WebKit browser, this is equivalent to:
* ```javascript
* control.applyStyle('-webkit-transform', 'translate(30px, 40px) scale(3) rotate(20deg) skewX(-30deg)');
* ```
*
* And in Firefox, this is equivalent to:
* ```javascript
* control.applyStyle('-moz-transform', 'translate(30px, 40px) scale(3) rotate(20deg) skewX(-30deg)');
* ```
*
* @param {module:enyo/Control~Control} control - The {@link module:enyo/Control~Control} to transform.
* @param {Object} transforms - The set of transforms to apply to `control`.
* @public
*/
dom.transform = function(control, transforms) {
	var d = control.domTransforms = control.domTransforms || {};
	utils.mixin(d, transforms);
	this.transformsToDom(control);
};

/**
* Applies a single transform to the specified {@link module:enyo/Control~Control}.
*
* Example:
* ```
* tap: function(inSender, inEvent) {
* 	var c = inEvent.originator;
* 	var r = c.rotation || 0;
* 	r = (r + 45) % 360;
* 	c.rotation = r;
* 	dom.transformValue(c, 'rotate', r);
* }
* ```
*
* This will rotate the tapped control by 45 degrees clockwise.
*
* @param {module:enyo/Control~Control} control - The {@link module:enyo/Control~Control} to transform.
* @param {String} transform - The name of the transform function.
* @param {(String|Number)} value - The value to apply to the transform.
* @public
*/
dom.transformValue = function(control, transform, value) {
	var d = control.domTransforms = control.domTransforms || {};
	d[transform] = value;
	this.transformsToDom(control);
};

/**
* Applies a transform that should trigger GPU compositing for the specified
* {@link module:enyo/Control~Control}. By default, the acceleration is only
* applied if the browser supports it. You may also optionally force-set `value`
* directly, to be applied to `translateZ(value)`.
*
* @param {module:enyo/Control~Control} control - The {@link module:enyo/Control~Control} to accelerate.
* @param {(String|Number)} [value] - An optional value to apply to the acceleration transform
*	property.
* @public
*/
dom.accelerate = function(control, value) {
	var v = value == 'auto' ? this.canAccelerate() : value;
	this.transformValue(control, 'translateZ', v ? 0 : null);
};


/**
 * The CSS `transition` property name for the current browser/platform, e.g.:
 *
 * * `-webkit-transition`
 * * `-moz-transition`
 * * `transition`
 *
 * @type {String}
 * @private
 */
dom.transition = (platform.ios || platform.android || platform.chrome || platform.androidChrome || platform.safari)
	? '-webkit-transition'
	: (platform.firefox || platform.firefoxOS || platform.androidFirefox)
		? '-moz-transition'
		: 'transition';

},{'./roots':'enyo/roots','./utils':'enyo/utils','./platform':'enyo/platform'}],'enyo/xhr':[function (module,exports,global,require,request){
require('enyo');

/**
* An internally-used module for XHR-related methods and wrappers.
*
* @module enyo/xhr
* @private
*/

var
	utils = require('./utils'),
	platform = require('./platform'),
	path = require('./pathResolver');

/**
* Parameters and options for the [enyo/xhr.request()]{@link module:enyo/xhr#request} method.
*
* @typedef {Object} requestOptions
* @property {String} url - The URL to request (required).
* @property {String} method - One of `'GET'`, `'POST'`, `'DELETE'`, `'UPDATE'`, or
* custom methods; defaults to `'GET'`.
* @property {Function} callback - Optional callback method to fire when complete.
* @property {Object} body - Optional serializable body for `POST` requests.
* @property {Object} headers - Optional header overrides; defaults to `null`.
* @property {String} username - Optional username to provide for authentication purposes.
* @property {String} password - Optional password to provide for authentication purposes.
* @property {Object} xhrFields - Optional key/value pairs to apply directly to the request.
* @property {String} mimeType - Optional specification for the `MIME-Type` of the request.
* @property {Boolean} mozSystem - Optional boolean to create cross-domain XHR (Firefox OS only).
* @property {Boolean} mozAnon - Optional boolean to create anonymous XHR that does not send
*	cookies or authentication headers (Firefox OS only).
* @private
*/

module.exports = {
	
	/**
	* Internally-used method to execute XHR requests.
	*
	* Note that we explicitly add a `'cache-control: no-cache'` header for iOS 6 for any
	* non-`GET` requests to work around a system bug causing non-cachable requests to be
	* cached. To disable this, use the `header` property to specify an object where
	* `cache-control` is set to `null`.
	*
	* @param {module:enyo/xhr~requestOptions} params - The options and properties for this XHR request.
	* @returns {XMLHttpRequest} The XHR request object.
	* @private
	*/
	request: function (params) {
		var xhr = this.getXMLHttpRequest(params);
		var url = this.simplifyFileURL(path.rewrite(params.url));
		//
		var method = params.method || 'GET';
		var async = !params.sync;
		//
		if (params.username) {
			xhr.open(method, url, async, params.username, params.password);
		} else {
			xhr.open(method, url, async);
		}
		//
		utils.mixin(xhr, params.xhrFields);
		// only setup handler when we have a callback
		if (params.callback) {
			this.makeReadyStateHandler(xhr, params.callback);
		}
		//
		params.headers = params.headers || {};
		// work around iOS 6.0 bug where non-GET requests are cached
		// see http://www.einternals.com/blog/web-development/ios6-0-caching-ajax-post-requests
		if (method !== 'GET' && platform.ios && platform.ios == 6) {
			if (params.headers['cache-control'] !== null) {
				params.headers['cache-control'] = params.headers['cache-control'] || 'no-cache';
			}
		}
		// user-set headers override any platform-default
		if (xhr.setRequestHeader) {
			for (var key in params.headers) {
				if (params.headers[key]) {
					xhr.setRequestHeader(key, params.headers[key]);
				}
			}
		}
		//
		if((typeof xhr.overrideMimeType == 'function') && params.mimeType) {
			xhr.overrideMimeType(params.mimeType);
		}
		//
		xhr.send(params.body || null);
		if (!async && params.callback) {
			xhr.onreadystatechange(xhr);
		}
		return xhr;
	},
	
	/**
	* Removes any callbacks that might be set from Enyo code for an existing XHR
	* and stops the XHR from completing (if possible).
	*
	* @param {XMLHttpRequest} The - request to cancel.
	* @private
	*/
	cancel: function (xhr) {
		if (xhr.onload) {
			xhr.onload = null;
		}
		if (xhr.onreadystatechange) {
			xhr.onreadystatechange = null;
		}
		if (xhr.abort) {
			xhr.abort();
		}
	},
	
	/**
	* @private
	*/
	makeReadyStateHandler: function (inXhr, inCallback) {
		if (global.XDomainRequest && inXhr instanceof global.XDomainRequest) {
			inXhr.onload = function() {
				var data;
				if (inXhr.responseType === 'arraybuffer') {
					data = inXhr.response;
				} else if (typeof inXhr.responseText === 'string') {
					data = inXhr.responseText;
				}
				inCallback.apply(null, [data, inXhr]);
				inXhr = null;
			};
		} else {
			inXhr.onreadystatechange = function() {
				if (inXhr && inXhr.readyState == 4) {
					var data;
					if (inXhr.responseType === 'arraybuffer') {
						data = inXhr.response;
					} else if (typeof inXhr.responseText === 'string') {
						data = inXhr.responseText;
					}
					inCallback.apply(null, [data, inXhr]);
					inXhr = null;
				}
			};
		}
	},
	
	/**
	* @private
	*/
	inOrigin: function (url) {
		var a = document.createElement('a'), result = false;
		a.href = url;
		// protocol is ':' for relative URLs
		if (a.protocol === ':' ||
				(a.protocol === global.location.protocol &&
					a.hostname === global.location.hostname &&
					a.port === (global.location.port ||
						(global.location.protocol === 'https:' ? '443' : '80')))) {
			result = true;
		}
		return result;
	},
	
	/**
	* @private
	*/
	simplifyFileURL: function (url) {
		var a = document.createElement('a');
		a.href = url;
		// protocol is ':' for relative URLs
		if (a.protocol === 'file:' ||
			a.protocol === ':' && global.location.protocol === 'file:') {
			// leave off search and hash parts of the URL
			// and work around a bug in webOS 3 where the app's host has a domain string
			// in it that isn't resolved as a path
			var host = (platform.webos < 4) ? '' : a.host;
			return a.protocol + '//' + host + a.pathname;
		} else if (a.protocol === ':' && global.location.protocol === 'x-wmapp0:') {
			// explicitly return absolute URL for Windows Phone 8, as an absolute path is required for local files
			return global.location.protocol + '//' + global.location.pathname.split('/')[0] + '/' + a.host + a.pathname;
		} else {
			return url;
		}
	},
	
	/**
	* @private
	*/
	getXMLHttpRequest: function (params) {
		try {
			// only use XDomainRequest when it exists, no extra headers were set, and the
			// target URL maps to a domain other than the document origin.
			if (platform.ie < 10 && global.XDomainRequest && !params.headers &&
				!this.inOrigin(params.url) && !/^file:\/\//.test(global.location.href)) {
				return new global.XDomainRequest();
			}
		} catch(e) {}
		try {

			if (platform.firefoxOS) {
				var shouldCreateNonStandardXHR = false; // flag to decide if we're creating the xhr or not
				var xhrOptions = {};

				// mozSystem allows you to do cross-origin requests on Firefox OS
				// As seen in:
				//   https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
				if (params.mozSystem) {
					xhrOptions.mozSystem = true;
					shouldCreateNonStandardXHR = true;
				}

				// mozAnon allows you to send a request without cookies or authentication headers
				// As seen in:
				//   https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
				if (params.mozAnon) {
					xhrOptions.mozAnon = true;
					shouldCreateNonStandardXHR = true;
				}

				if (shouldCreateNonStandardXHR) {
					return new XMLHttpRequest(xhrOptions);
				}
			}

			return new XMLHttpRequest();
		} catch(e) {}
		return null;
	}
};

},{'./utils':'enyo/utils','./platform':'enyo/platform','./pathResolver':'enyo/pathResolver'}],'enyo/animation':[function (module,exports,global,require,request){
/**
* Contains methods useful for animations.
* @module enyo/animation
*/

require('enyo');

var
	platform = require('./platform'),
	utils = require('./utils');

var ms = Math.round(1000/60),
	prefix = ['', 'webkit', 'moz', 'ms', 'o'],
	rAF = 'requestAnimationFrame',
	cRAF = 'cancelRequestAnimationFrame',
	cAF = 'cancelAnimationFrame',
	i, pl, p, wcRAF, wrAF, wcAF,
	_requestFrame, _cancelFrame, cancelFrame;

/*
* Fallback on setTimeout
*
* @private
*/
_requestFrame = function(callback) {
	return global.setTimeout(callback, ms);
};

/*
* Fallback on clearTimeout
*
* @private
*/
_cancelFrame = function(id) {
	return global.clearTimeout(id);
};

for (i = 0, pl = prefix.length; (p = prefix[i]) || i < pl; i++) {
	// if we're on ios 6 just use setTimeout, requestAnimationFrame has some kinks
	if (platform.ios === 6) {
		break;
	}

	// if prefixed, becomes Request and Cancel
	wrAF = p ? (p + utils.cap(rAF)) : rAF;
	wcRAF = p ? (p + utils.cap(cRAF)) : cRAF;
	wcAF = p ? (p + utils.cap(cAF)) : cAF;

	// Test for cancelRequestAnimationFrame, because some browsers (Firefix 4-10) have a request without a cancel
	cancelFrame = global[wcAF] || global[wcRAF];
	if (cancelFrame) {
		_cancelFrame = cancelFrame;
		_requestFrame = global[wrAF];
		if (p == 'webkit') {
			/*
				Note: In Chrome, the first return value of webkitRequestAnimationFrame is 0.
				We make 1 bogus call so the first used return value of webkitRequestAnimationFrame is > 0, as the spec requires.
				This makes it so that the requestId is always truthy.
				(we choose to do this rather than wrapping the native function to avoid the overhead)
			*/
			_cancelFrame(_requestFrame(utils.nop));
		}
		break;
	}
}
/**
* Requests an animation callback.
*
* On compatible browsers, if `node` is defined, the [callback]{@glossary callback} will
* fire only if `node` is visible.
*
* @param {Function} callback - A [callback]{@glossary callback} to be executed on the
*                            animation frame.
* @param {Node} node - The DOM node to request the animation frame for.
* @returns {Object} A request id to be used with
*                     {@link module:enyo/animation#cancelRequestAnimationFrame}.
* @public
*/
exports.requestAnimationFrame = function(callback, node) {
	return _requestFrame(callback, node);
};
/**
* Cancels a requested animation callback with the specified id.
*
* @param {Number} id - The identifier of an animation request we wish to cancel.
* @deprecated since 2.7.0
* @public
*/
exports.cancelRequestAnimationFrame = function(id) {
	return _cancelFrame(id);
};
/**
* Cancels a requested animation callback with the specified id.
*
* @param {Number} id - The identifier of an animation request we wish to cancel.
* @public
*/
exports.cancelAnimationFrame = function(id) {
	return _cancelFrame(id);
};

/**
* A set of interpolation functions for animations, similar in function to CSS3
* transitions.
*
* These are intended for use with {@link module:enyo/animation#easedLerp}. Each easing function
* accepts one (1) [Number]{@glossary Number} parameter and returns one (1)
* [Number]{@glossary Number} value.
*
* @public
*/
exports.easing = /** @lends module:enyo/animation~easing.prototype */ {
	/**
	* cubicIn
	*
	* @public
	*/
	cubicIn: function(n) {
		return Math.pow(n, 3);
	},
	/**
	* cubicOut
	*
	* @public
	*/
	cubicOut: function(n) {
		return Math.pow(n - 1, 3) + 1;
	},
	/**
	* expoOut
	*
	* @public
	*/
	expoOut: function(n) {
		return (n == 1) ? 1 : (-1 * Math.pow(2, -10 * n) + 1);
	},
	/**
	* quadInOut
	*
	* @public
	*/
	quadInOut: function(n) {
		n = n * 2;
		if (n < 1) {
			return Math.pow(n, 2) / 2;
		}
		return -1 * ((--n) * (n - 2) - 1) / 2;
	},
	/**
	* linear
	*
	* @public
	*/
	linear: function(n) {
		return n;
	}
};

/**
* Gives an interpolation of an animated transition's distance from 0 to 1.
*
* Given a start time (`t0`) and an animation duration (`duration`), this
* method applies the `easing` function to the percentage of time elapsed
* divided by duration, capped at 100%.
*
* @param {Number} t0 - Start time.
* @param {Number} duration - Duration in milliseconds.
* @param {Function} easing - An easing [function]{@glossary Function} reference from
*	{@link module:enyo/animation#easing}.
* @param {Boolean} reverse - Whether the animation will run in reverse.
* @returns {Number} The resulting position, capped at a maximum of 100%.
* @public
*/
exports.easedLerp = function(t0, duration, easing, reverse) {
	var lerp = (utils.perfNow() - t0) / duration;
	if (reverse) {
		return lerp >= 1 ? 0 : (1 - easing(1 - lerp));
	} else {
		return lerp >= 1 ? 1 : easing(lerp);
	}
};

/**
* Gives an interpolation of an animated transition's distance from
* `startValue` to `valueChange`.
*
* Applies the `easing` function with a wider range of variables to allow for
* more complex animations.
*
* @param {Number} t0 - Start time.
* @param {Number} duration - Duration in milliseconds.
* @param {Function} easing - An easing [function]{@glossary Function} reference from
*	{@link module:enyo/animation#easing}.
* @param {Boolean} reverse - Whether the animation will run in reverse.
* @param {Number} time
* @param {Number} startValue - Starting value.
* @param {Number} valueChange
* @returns {Number} The resulting position, capped at a maximum of 100%.
* @public
*/
exports.easedComplexLerp = function(t0, duration, easing, reverse, time, startValue, valueChange) {
	var lerp = (utils.perfNow() - t0) / duration;
	if (reverse) {
		return easing(1 - lerp, time, startValue, valueChange, duration);
	} else {
		return easing(lerp, time, startValue, valueChange, duration);
	}
};

},{'./platform':'enyo/platform','./utils':'enyo/utils'}],'enyo/kind':[function (module,exports,global,require,request){
require('enyo');

var
	logger = require('./logger'),
	utils = require('./utils');

var defaultCtor = null;

/**
* Creates a JavaScript {@glossary constructor} function with
* a prototype defined by `props`. **All constructors must have a unique name.**
*
* `kind()` makes it easy to build a constructor-with-prototype (like a
* class) that has advanced features like prototype-chaining
* ({@glossary inheritance}).
*
* A plug-in system is included for extending the abilities of the
* {@glossary kind} generator, and constructors are allowed to
* perform custom operations when subclassed.
*
* If you make changes to `enyo/kind`, be sure to add or update the appropriate
* [unit tests](@link https://github.com/enyojs/enyo/tree/master/tools/test/core/tests).
*
* For more information, see the documentation on
* [Kinds]{@linkplain $dev-guide/key-concepts/kinds.html} in the Enyo Developer Guide.
*
* @module enyo/kind
* @param {Object} props - A [hash]{@glossary Object} of properties used to define and create
*	the {@glossary kind}
* @public
*/
/*jshint -W120*/
var kind = exports = module.exports = function (props) {
/*jshint +W120*/
	// extract 'name' property
	var name = props.name || '';
	delete props.name;
	// extract 'kind' property
	var hasKind = ('kind' in props);
	var kindName = props.kind;
	delete props.kind;
	// establish base class reference
	var base = constructorForKind(kindName);
	var isa = base && base.prototype || null;
	// if we have an explicit kind property with value undefined, we probably
	// tried to reference a kind that is not yet in scope
	if (hasKind && kindName === undefined || base === undefined) {
		var problem = kindName === undefined ? 'undefined kind' : 'unknown kind (' + kindName + ')';
		throw 'enyo.kind: Attempt to subclass an ' + problem + '. Check dependencies for [' + (name || '<unnamed>') + '].';
	}
	// make a boilerplate constructor
	var ctor = kind.makeCtor();
	// semi-reserved word 'constructor' causes problems with Prototype and IE, so we rename it here
	if (props.hasOwnProperty('constructor')) {
		props._constructor = props.constructor;
		delete props.constructor;
	}
	// create our prototype
	//ctor.prototype = isa ? enyo.delegate(isa) : {};
	utils.setPrototype(ctor, isa ? utils.delegate(isa) : {});
	// there are special cases where a base class has a property
	// that may need to be concatenated with a subclasses implementation
	// as opposed to completely overwriting it...
	kind.concatHandler(ctor, props);

	// put in our props
	utils.mixin(ctor.prototype, props);
	// alias class name as 'kind' in the prototype
	// but we actually only need to set this if a new name was used,
	// not if it is inheriting from a kind anonymously
	if (name) {
		ctor.prototype.kindName = name;
	}
	// this is for anonymous constructors
	else {
		ctor.prototype.kindName = base && base.prototype? base.prototype.kindName: '';
	}
	// cache superclass constructor
	ctor.prototype.base = base;
	// reference our real constructor
	ctor.prototype.ctor = ctor;
	// support pluggable 'features'
	utils.forEach(kind.features, function(fn){ fn(ctor, props); });
	
	if (name) kindCtors[name] = ctor;
	
	return ctor;
};

exports.setDefaultCtor = function (ctor) {
	defaultCtor = ctor;
};

var getDefaultCtor = exports.getDefaultCtor = function () {
	return defaultCtor;
};

/**
* @private
*/
var concatenated = exports.concatenated = [];

/**
* Creates a singleton of a given {@glossary kind} with a given
* definition. **The `name` property will be the instance name of the singleton
* and must be unique.**
*
* ```javascript
* var
* 	kind = require('enyo/kind'),
* 	Control = require('enyo/Control');
*
* module.exports = singleton({
* 	kind: Control,
* 	name: 'app.MySingleton',
* 	published: {
* 		value: 'foo'
* 	},
* 	makeSomething: function() {
* 		//...
* 	}
* });
*
* app.MySingleton.makeSomething();
* app.MySingleton.setValue('bar');
*```
*
* @public
*/
exports.singleton = function (conf) {
	// extract 'name' property (the name of our singleton)
	delete(conf.name);
	// create an unnamed kind and save its constructor's function
	var Kind = kind(conf);
	var inst = new Kind();
	return inst;
};

/**
* @name module:enyo/kind.makeCtor
* @method
* @private
*/
kind.makeCtor = function () {
	var enyoConstructor = function () {
		if (!(this instanceof enyoConstructor)) {
			throw 'enyo.kind: constructor called directly, not using "new"';
		}

		// two-pass instantiation
		var result;
		if (this._constructor) {
			// pure construction
			result = this._constructor.apply(this, arguments);
		}
		// defer initialization until entire constructor chain has finished
		if (this.constructed) {
			// post-constructor initialization
			this.constructed.apply(this, arguments);
		}

		if (result) {
			return result;
		}
	};
	return enyoConstructor;
};

/**
* Feature hooks for the oop system
*
* @name module:enyo/kind.features
* @private
*/
kind.features = [];

/**
* Used internally by several mechanisms to allow safe and normalized handling for extending a
* [kind's]{@glossary kind} super-methods. It can take a
* [constructor]{@glossary constructor}, a [prototype]{@glossary Object.prototype}, or an
* instance.
*
* @name module:enyo/kind.extendMethods
* @method
* @private
*/
kind.extendMethods = function (ctor, props, add) {
	var proto = ctor.prototype || ctor,
		b = proto.base;
	if (!proto.inherited && b) {
		proto.inherited = kind.inherited;
	}
	// rename constructor to _constructor to work around IE8/Prototype problems
	if (props.hasOwnProperty('constructor')) {
		props._constructor = props.constructor;
		delete props.constructor;
	}
	// decorate function properties to support inherited (do this ex post facto so that
	// ctor.prototype is known, relies on elements in props being copied by reference)
	for (var n in props) {
		var p = props[n];
		if (isInherited(p)) {
			// ensure that if there isn't actually a super method to call, it won't
			// fail miserably - while this shouldn't happen often, it is a sanity
			// check for mixin-extensions for kinds
			if (add) {
				p = proto[n] = p.fn(proto[n] || utils.nop);
			} else {
				p = proto[n] = p.fn(b? (b.prototype[n] || utils.nop): utils.nop);
			}
		}
		if (utils.isFunction(p)) {
			if (add) {
				proto[n] = p;
				p.displayName = n + '()';
			} else {
				p._inherited = b? b.prototype[n]: null;
				// FIXME: we used to need some extra values for inherited, then inherited got cleaner
				// but in the meantime we used these values to support logging in Object.
				// For now we support this legacy situation, by suppling logging information here.
				p.displayName = proto.kindName + '.' + n + '()';
			}
		}
	}
};
kind.features.push(kind.extendMethods);

/**
* Called by {@link module:enyo/CoreObject~Object} instances attempting to access super-methods
* of a parent class ([kind]{@glossary kind}) by calling
* `this.inherited(arguments)` from within a kind method. This can only be done
* safely when there is known to be a super class with the same method.
*
* @name module:enyo/kind.inherited
* @method
* @private
*/
kind.inherited = function (originals, replacements) {
	// one-off methods are the fast track
	var target = originals.callee;
	var fn = target._inherited;

	// regardless of how we got here, just ensure we actually
	// have a function to call or else we throw a console
	// warning to notify developers they are calling a
	// super method that doesn't exist
	if ('function' === typeof fn) {
		var args = originals;
		if (replacements) {
			// combine the two arrays, with the replacements taking the first
			// set of arguments, and originals filling up the rest.
			args = [];
			var i = 0, l = replacements.length;
			for (; i < l; ++i) {
				args[i] = replacements[i];
			}
			l = originals.length;
			for (; i < l; ++i) {
				args[i] = originals[i];
			}
		}
		return fn.apply(this, args);
	} else {
		logger.warn('enyo.kind.inherited: unable to find requested ' +
			'super-method from -> ' + originals.callee.displayName + ' in ' + this.kindName);
	}
};

// dcl inspired super-inheritance

var Inherited = function (fn) {
	this.fn = fn;
};

/**
* When defining a method that overrides an existing method in a [kind]{@glossary kind}, you
* can wrap the definition in this function and it will decorate it appropriately for inheritance
* to work.
*
* The older `this.inherited(arguments)` method still works, but this version results in much
* faster code and is the only one supported for kind [mixins]{@glossary mixin}.
*
* @param {Function} fn - A [function]{@glossary Function} that takes a single
*   argument (usually named `sup`) and returns a function where
*   `sup.apply(this, arguments)` is used as a mechanism to make the
*   super-call.
* @public
*/
exports.inherit = function (fn) {
	return new Inherited(fn);
};

/**
* @private
*/
var isInherited = exports.isInherited = function (fn) {
	return fn && (fn instanceof Inherited);
};


//
// 'statics' feature
//
kind.features.push(function(ctor, props) {
	// install common statics
	if (!ctor.subclass) {
		ctor.subclass = kind.statics.subclass;
	}
	if (!ctor.extend) {
		ctor.extend = kind.statics.extend;
	}
	if (!ctor.kind) {
		ctor.kind = kind.statics.kind;
	}
	// move props statics to constructor
	if (props.statics) {
		utils.mixin(ctor, props.statics);
		delete ctor.prototype.statics;
	}
	// also support protectedStatics which won't interfere with defer
	if (props.protectedStatics) {
		utils.mixin(ctor, props.protectedStatics);
		delete ctor.prototype.protectedStatics;
	}
	// allow superclass customization
	var base = ctor.prototype.base;
	while (base) {
		base.subclass(ctor, props);
		base = base.prototype.base;
	}
});

/**
* @private
*/
kind.statics = {

	/**
	* A [kind]{@glossary kind} may set its own `subclass()` method as a
	* static method for its [constructor]{@glossary constructor}. Whenever
	* it is subclassed, the constructor and properties will be passed through
	* this method for special handling of important features.
	*
	* @name module:enyo/kind.subclass
	* @method
	* @param {Function} ctor - The [constructor]{@glossary constructor} of the
	*	[kind]{@glossary kind} being subclassed.
	* @param {Object} props - The properties of the kind being subclassed.
	* @public
	*/
	subclass: function (ctor, props) {},

	/**
	* Allows for extension of the current [kind]{@glossary kind} without
	* creating a new kind. This method is available on all
	* [constructors]{@glossary constructor}, although calling it on a
	* [deferred]{@glossary deferred} constructor will force it to be
	* resolved at that time. This method does not re-run the
	* {@link module:enyo/kind.features} against the constructor or instance.
	*
	* @name module:enyo/kind.extend
	* @method
	* @param {Object|Object[]} props A [hash]{@glossary Object} or [array]{@glossary Array}
	*	of [hashes]{@glossary Object}. Properties will override
	*	[prototype]{@glossary Object.prototype} properties. If a
	*	method that is being added already exists, the new method will
	*	supersede the existing one. The method may call
	*	`this.inherited()` or be wrapped with `kind.inherit()` to call
	*	the original method (this chains multiple methods tied to a
	*	single [kind]{@glossary kind}).
	* @param {Object} [target] - The instance to be extended. If this is not specified, then the
	*	[constructor]{@glossary constructor} of the
	*	[object]{@glossary Object} this method is being called on will
	*	be extended.
	* @returns {Object} The constructor of the class, or specific
	*	instance, that has been extended.
	* @public
	*/
	extend: function (props, target) {
		var ctor = this
			, exts = utils.isArray(props)? props: [props]
			, proto, fn;

		fn = function (key, value) {
			return !(typeof value == 'function' || isInherited(value)) && concatenated.indexOf(key) === -1;
		};

		proto = target || ctor.prototype;
		for (var i=0, ext; (ext=exts[i]); ++i) {
			kind.concatHandler(proto, ext, true);
			kind.extendMethods(proto, ext, true);
			utils.mixin(proto, ext, {filter: fn});
		}

		return target || ctor;
	},

	/**
	* Creates a new sub-[kind]{@glossary kind} of the current kind.
	*
	* @name module:enyo/kind.kind
	* @method
	* @param  {Object} props A [hash]{@glossary Object} of properties used to define and create
	*	the [kind]{@glossary kind}
	* @return {Function} Constructor of the new kind
	* @public
	*/
	kind: function (props) {
		if (props.kind && props.kind !== this) {
			logger.warn('Creating a different kind from a constructor\'s kind() method is not ' +
				'supported and will be replaced with the constructor.');
		}
		props.kind = this;
		return kind(props);
	}
};

/**
* @method
* @private
*/
exports.concatHandler = function (ctor, props, instance) {
	var proto = ctor.prototype || ctor
		, base = proto.ctor;

	while (base) {
		if (base.concat) base.concat(ctor, props, instance);
		base = base.prototype.base;
	}
};

var kindCtors =
/**
* Factory for [kinds]{@glossary kind} identified by [strings]{@glossary String}.
*
* @type Object
* @deprecated Since 2.6.0
* @private
*/
	exports._kindCtors = {};

/**
* @method
* @private
*/
var constructorForKind = exports.constructorForKind = function (kind) {
	if (kind === null) {
		return kind;
	} else if (kind === undefined) {
		return getDefaultCtor();
	}
	else if (utils.isFunction(kind)) {
		return kind;
	}
	logger.warn('Creating instances by name is deprecated. Name used:', kind);
	// use memoized constructor if available...
	var ctor = kindCtors[kind];
	if (ctor) {
		return ctor;
	}
	// otherwise look it up and memoize what we find
	//
	// if kind is an object in enyo, say "Control", then ctor = enyo["Control"]
	// if kind is a path under enyo, say "Heritage.Button", then ctor = enyo["Heritage.Button"] || enyo.Heritage.Button
	// if kind is a fully qualified path, say "enyo.Heritage.Button", then ctor = enyo["enyo.Heritage.Button"] || enyo.enyo.Heritage.Button || enyo.Heritage.Button
	//
	// Note that kind "Foo" will resolve to enyo.Foo before resolving to global "Foo".
	// This is important so "Image" will map to built-in Image object, instead of enyo.Image control.
	ctor = Theme[kind] || (global.enyo && global.enyo[kind]) || utils.getPath.call(global, 'enyo.' + kind) || global[kind] || utils.getPath.call(global, kind);

	// If what we found at this namespace isn't a function, it's definitely not a kind constructor
	if (!utils.isFunction(ctor)) {
		throw '[' + kind + '] is not the name of a valid kind.';
	}
	kindCtors[kind] = ctor;
	return ctor;
};

/**
* Namespace for current theme (`enyo.Theme.Button` references the Button specialization for the
* current theme).
*
* @deprecated Since 2.6.0
* @private
*/
var Theme = exports.Theme = {};

/**
* @method
* @deprecated Since 2.6.0
* @private
*/
exports.registerTheme = function (ns) {
	utils.mixin(Theme, ns);
};

/**
* @method
* @private
*/
exports.createFromKind = function (nom, param) {
	var Ctor = nom && constructorForKind(nom);
	if (Ctor) {
		return new Ctor(param);
	}
};

},{'./logger':'enyo/logger','./utils':'enyo/utils'}],'enyo/HTMLStringDelegate':[function (module,exports,global,require,request){
require('enyo');

var
	Dom = require('./dom');

var selfClosing = {img: 1, hr: 1, br: 1, area: 1, base: 1, basefont: 1, input: 1, link: 1,
	meta: 1, command: 1, embed: 1, keygen: 1, wbr: 1, param: 1, source: 1, track: 1, col: 1};

/**
* This is the default render delegate used by {@link module:enyo/Control~Control}. It
* generates the HTML [string]{@glossary String} content and correctly inserts
* it into the DOM. A string-concatenation technique is used to perform DOM
* insertion in batches.
*
* @module enyo/HTMLStringDelegate
* @public
*/
module.exports = {
	
	/**
	* @private
	*/
	invalidate: function (control, item) {
		switch (item) {
		case 'content':
			this.renderContent(control);
			break;
		default:
			control.tagsValid = false;
			break;
		}
	},
	
	/**
	* @private
	*/
	render: function (control) {
		if (control.parent) {
			control.parent.beforeChildRender(control);
			
			if (!control.parent.generated) return;
			if (control.tag === null) return control.parent.render();
		}
		
		if (!control.hasNode()) this.renderNode(control);
		if (control.hasNode()) {
			this.renderDom(control);
			if (control.generated) control.rendered();
		}
	},
	
	/**
	* @private
	*/
	renderInto: function (control, parentNode) {
		parentNode.innerHTML = this.generateHtml(control);
		
		if (control.generated) control.rendered();
	},
	
	/**
	* @private
	*/
	renderNode: function (control) {
		this.teardownRender(control);
		control.node = document.createElement(control.tag);
		control.addNodeToParent();
		control.set('generated', true);
	},
	
	/**
	* @private
	*/
	renderDom: function (control) {
		this.renderAttributes(control);
		this.renderStyles(control);
		this.renderContent(control);
	},
	
	/**
	* @private
	*/
	renderStyles: function (control) {
		var style = control.style;
		
		// we can safely do this knowing it will synchronize properly without a double
		// set in the DOM because we're flagging the internal property
		if (control.hasNode()) {
			control.node.style.cssText = style;
			// retrieve the parsed value for synchronization
			control.cssText = style = control.node.style.cssText;
			// now we set it knowing they will be synchronized and everybody that is listening
			// will also be updated to know about the change
			control.set('style', style);
		}
	},
	
	/**
	* @private
	*/
	renderAttributes: function (control) {
		var attrs = control.attributes,
			node = control.hasNode(),
			key,
			val;
		
		if (node) {
			for (key in attrs) {
				val = attrs[key];
				if (val === null || val === false || val === "") {
					node.removeAttribute(key);
				} else {
					node.setAttribute(key, val);
				}
			}
		}
	},
	
	/**
	* @private
	*/
	renderContent: function (control) {
		if (control.generated) this.teardownChildren(control);
		if (control.hasNode()) control.node.innerHTML = this.generateInnerHtml(control);
	},
	
	/**
	* @private
	*/
	generateHtml: function (control) {
		var content,
			html;
		
		if (control.canGenerate === false) {
			return '';
		}
		// do this first in case content generation affects outer html (styles or attributes)
		content = this.generateInnerHtml(control);
		// generate tag, styles, attributes
		html = this.generateOuterHtml(control, content);
		// NOTE: 'generated' is used to gate access to findNodeById in
		// hasNode, because findNodeById is expensive.
		// NOTE: we typically use 'generated' to mean 'created in DOM'
		// but that has not actually happened at this point.
		// We set 'generated = true' here anyway to avoid having to walk the
		// control tree a second time (to set it later).
		// The contract is that insertion in DOM will happen synchronously
		// to generateHtml() and before anybody should be calling hasNode().
		control.set('generated', true);
		return html;
	},
	
	/**
	* @private
	*/
	generateOuterHtml: function (control, content) {
		if (!control.tag) return content;
		if (!control.tagsValid) this.prepareTags(control);
		return control._openTag + content + control._closeTag;
	},
	
	/**
	* @private
	*/
	generateInnerHtml: function (control) {
		var allowHtml = control.allowHtml,
			content;
		
		// flow can alter the way that html content is rendered inside
		// the container regardless of whether there are children.
		control.flow();
		if (control.children.length) return this.generateChildHtml(control);
		else {
			content = control.get('content');
			return allowHtml ? content : Dom.escape(content);
		}
	},
	
	/**
	* @private
	*/
	generateChildHtml: function (control) {
		var child,
			html = '',
			i = 0,
			delegate;
		
		for (; (child = control.children[i]); ++i) {
			delegate = child.renderDelegate || this;
			html += delegate.generateHtml(child);
		}
		
		return html;
	},
	
	/**
	* @private
	*/
	prepareTags: function (control) {
		var html = '';
		
		// open tag
		html += '<' + control.tag + (control.style ? ' style="' + control.style + '"' : '');
		html += this.attributesToHtml(control.attributes);
		if (selfClosing[control.tag]) {
			control._openTag = html + '/>';
			control._closeTag = '';
		} else {
			control._openTag = html + '>';
			control._closeTag = '</' + control.tag + '>';
		}
		
		control.tagsValid = true;
	},
	
	/**
	* @private
	*/
	attributesToHtml: function(attrs) {
		var key,
			val,
			html = '';
			
		for (key in attrs) {
			val = attrs[key];
			if (val != null && val !== false && val !== '') {
				html += ' ' + key + '="' + this.escapeAttribute(val) + '"';
			}
		}
		
		return html;
	},
	
	/**
	* @private
	*/
	escapeAttribute: function (text) {
		if (typeof text != 'string') return text;
	
		return String(text).replace(/&/g, '&amp;').replace(/\"/g, '&quot;');
	},
	
	/**
	* @private
	*/
	teardownRender: function (control, cache) {
		if (control.generated) {
			if (typeof control.beforeTeardown === 'function') {
				control.beforeTeardown();
			}
			this.teardownChildren(control, cache);
		}
			
		control.node = null;
		control.set('generated', false);
	},
	
	/**
	* @private
	*/
	teardownChildren: function (control, cache) {
		var child,
			i = 0;

		for (; (child = control.children[i]); ++i) {
			child.teardownRender(cache);
		}
	}
};

},{'./dom':'enyo/dom'}],'enyo/gesture/util':[function (module,exports,global,require,request){
var
	dom = require('../dom'),
	platform = require('../platform'),
	utils = require('../utils');

/**
* Used internally by {@link module:enyo/gesture}
*
* @module enyo/gesture/util
* @private
*/
module.exports = {

	/**
	* @private
	*/
	eventProps: ['target', 'relatedTarget', 'clientX', 'clientY', 'pageX', 'pageY',
		'screenX', 'screenY', 'altKey', 'ctrlKey', 'metaKey', 'shiftKey',
		'detail', 'identifier', 'dispatchTarget', 'which', 'srcEvent'],

	/**
	* Creates an {@glossary event} of type `type` and returns it.
	* `evt` should be an event [object]{@glossary Object}.
	*
	* @param {String} type - The type of {@glossary event} to make.
	* @param {(Event|Object)} evt - The event you'd like to clone or an object that looks like it.
	* @returns {Object} The new event [object]{@glossary Object}.
	* @public
	*/
	makeEvent: function(type, evt) {
		var e = {};
		e.type = type;
		for (var i=0, p; (p=this.eventProps[i]); i++) {
			e[p] = evt[p];
		}
		e.srcEvent = e.srcEvent || evt;
		e.preventDefault = this.preventDefault;
		e.disablePrevention = this.disablePrevention;

		if (dom._bodyScaleFactorX !== 1 || dom._bodyScaleFactorY !== 1) {
			// Intercept only these events, not all events, like: hold, release, tap, etc,
			// to avoid doing the operation again.
			if (e.type == 'move' || e.type == 'up' || e.type == 'down' || e.type == 'enter' || e.type == 'leave') {
				e.clientX *= dom._bodyScaleFactorX;
				e.clientY *= dom._bodyScaleFactorY;
			}
		}
		//
		// normalize event.which and event.pageX/event.pageY
		// Note that while 'which' works in IE9, it is broken for mousemove. Therefore,
		// in IE, use global.event.button
		if (platform.ie < 10) {
			var b = global.event && global.event.button;
			if (b) {
				// multi-button not supported, priority: left, right, middle
				// (note: IE bitmask is 1=left, 2=right, 4=center);
				e.which = b & 1 ? 1 : (b & 2 ? 2 : (b & 4 ? 3 : 0));
			}
		} else if (platform.webos || global.PalmSystem) {
			// Temporary fix for owos: it does not currently supply 'which' on move events
			// and the user agent string doesn't identify itself so we test for PalmSystem
			if (e.which === 0) {
				e.which = 1;
			}
		}
		return e;
	},

	/**
	* Installed on [events]{@glossary event} and called in event context.
	*
	* @private
	*/
	preventDefault: function() {
		if (this.srcEvent) {
			this.srcEvent.preventDefault();
		}
	},

	/**
	* @private
	*/
	disablePrevention: function() {
		this.preventDefault = utils.nop;
		if (this.srcEvent) {
			this.srcEvent.preventDefault = utils.nop;
		}
	}
};

},{'../dom':'enyo/dom','../platform':'enyo/platform','../utils':'enyo/utils'}],'enyo/MultipleDispatchSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/MultipleDispatchSupport~MultipleDispatchSupport} mixin.
* @module enyo/MultipleDispatchSupport
*/

require('enyo');

var
	kind = require('./kind'),
	utils = require('./utils');

/**
* A collection of methods to allow a single {@link module:enyo/Component~Component} to
* [dispatch]{@link module:enyo/Component~Component#dispatchEvent} a single {@glossary event} to
* multiple targets. The events are synchronously propagated in the order in
* which the targets are encountered. Note that this {@glossary mixin} is
* already applied to a base [kind]{@glossary kind},
* {@link module:enyo/MultipleDispatchComponent~MultipleDispatchComponent}.
*
* @mixin
* @public
*/
var MultipleDispatchSupport = {
	
	/**
	* @private
	*/
	name: 'MultipleDispatchSupport',
	
	/**
	* Adds a target for dispatching.
	*
	* @param {module:enyo/Component~Component} component - The {@link module:enyo/Component~Component} to add as a dispatch target.
	* @public
	*/
	addDispatchTarget: function (component) {
		var dt = this._dispatchTargets;
		if (component && !~utils.indexOf(component, dt)) {
			dt.push(component);
		}
	},
	/**
	* Removes a target from dispatching.
	*
	* @param {module:enyo/Component~Component} component - The {@link module:enyo/Component~Component} to remove as a dispatch
	*	target.
	* @public
	*/
	removeDispatchTarget: function (component) {
		var dt = this._dispatchTargets, i;
		i = utils.indexOf(component, dt);
		if (i > -1) {
			dt.splice(i, 1);
		}
	},
	
	/**
	* @private
	*/
	bubbleUp: kind.inherit(function (sup) {
		return function (name, event, sender) {
			if (this._dispatchDefaultPath) {
				sup.apply(this, arguments);
			}
			var dt = this._dispatchTargets;
			for (var i=0, t; (t=dt[i]); ++i) {
				if (t && !t.destroyed) {
					t.dispatchBubble(name, event, sender);
				}
			}
		};
	}),
	
	/**
	* @private
	*/
	ownerChanged: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			var o = this.owner;
			this._dispatchDefaultPath = !! o;
		};
	}),
	
	/**
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			this._dispatchTargets = [];
			return sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			this._dispatchTargets = null;
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	_dispatchDefaultPath: false
};

module.exports = MultipleDispatchSupport;

},{'./kind':'enyo/kind','./utils':'enyo/utils'}],'enyo/ApplicationSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/ApplicationSupport~ApplicationSupport} mixin.
* @module enyo/ApplicationSupport
*/

require('enyo');

var kind = require('./kind');

/**
* An internally-used support {@glossary mixin} that is applied to all
* [components]{@link module:enyo/Component~Component} of an {@link module:enyo/Application~Application} instance
* (and to their components, recursively). This mixin adds an `app` property to
* each component -- a local reference to the `Application` instance that
* the component belongs to.
* 
* @mixin
* @protected
*/
var ApplicationSupport = {

	/**
	* @private
	*/
	name: 'ApplicationSupport',

	/**
	* @private
	*/
	adjustComponentProps: kind.inherit(function (sup) {
		return function (props) {
			props.app = props.app || this.app;
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			// release the reference to the application
			this.app = null;
			sup.apply(this, arguments);
		};
	})

};

module.exports = ApplicationSupport;

},{'./kind':'enyo/kind'}],'enyo/ComponentBindingSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/ComponentBindingSupport~ComponentBindingSupport} mixin.
* @module enyo/ComponentBindingSupport
*/

require('enyo');

var
	kind = require('./kind');

/**
* An internally-used {@glossary mixin} applied to {@link module:enyo/Component~Component}
* instances to better support [bindings]{@link module:enyo/Binding~Binding}.
*
* @mixin
* @protected
*/
var ComponentBindingSupport = {
	
	/**
	* @private
	*/
	name: 'ComponentBindingSupport',
	
	/**
	* @private
	*/
	adjustComponentProps: kind.inherit(function (sup) {
		return function (props) {
			sup.apply(this, arguments);
			props.bindingTransformOwner || (props.bindingTransformOwner = this.getInstanceOwner());
		};
	})
};

module.exports = ComponentBindingSupport;

},{'./kind':'enyo/kind'}],'enyo/Layout':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Layout~Layout} kind.
* @module enyo/Layout
*/

var
	kind = require('./kind');

/**
* {@link module:enyo/Layout~Layout} is the base [kind]{@glossary kind} for layout
* kinds. Layout kinds are used by {@link module:enyo/UiComponent~UiComponent}-based
* [controls]{@link module:enyo/Control~Control} to allow for arranging of child controls by
* setting the [layoutKind]{@link module:enyo/UiComponent~UiComponent#layoutKind} property.
* 
* Derived kinds will usually provide their own
* [layoutClass]{@link module:enyo/Layout~Layout#layoutClass} property to affect the CSS
* rules used, and may also implement the [flow()]{@link module:enyo/Layout~Layout#flow}
* and [reflow()]{@link module:enyo/Layout~Layout#reflow} methods. `flow()` is called
* during control rendering, while `reflow()` is called when the associated
* control is resized.
*
* @class Layout
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Layout~Layout.prototype */ {

	name: 'enyo.Layout',

	/**
	* @private
	*/
	kind: null,

	/** 
	* CSS class that's added to the [control]{@link module:enyo/Control~Control} using this 
	* [layout]{@link module:enyo/Layout~Layout} [kind]{@glossary kind}.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	layoutClass: '',
	
	/**
	* @private
	*/
	constructor: function (container) {
		this.container = container;
		if (container) {
			container.addClass(this.layoutClass);
		}
	},

	/**
	* @private
	*/
	destroy: function () {
		if (this.container) {
			this.container.removeClass(this.layoutClass);
		}
	},
	
	/**
	* Called during static property layout (i.e., during rendering).
	*
	* @public
	*/
	flow: function () {
	},

	/** 
	* Called during dynamic measuring layout (i.e., during a resize).
	*
	* May short-circuit and return `true` if the layout needs to be
	* redone when the associated Control is next shown. This is useful
	* for cases where the Control itself has `showing` set to `true`
	* but an ancestor is hidden, and the layout is therefore unable to
	* get accurate measurements of the Control or its children.
	*
	* @public
	*/
	reflow: function () {
	}
});

},{'./kind':'enyo/kind'}],'enyo/Control/floatingLayer':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/Control/floatingLayer~FloatingLayer} singleton instance.
* @module enyo/Control/floatingLayer
*/

var
	kind = require('../kind'),
	platform = require('../platform');

module.exports = function (Control) {
	/**
	* {@link module:enyo/Control/floatingLayer~FloatingLayer} is a
	* [control]{@link module:enyo/Control~Control} that provides a layer for controls that should be
	* displayed above an [application]{@link module:enyo/Application~Application}. The `floatingLayer`
	* singleton can be set as a control's parent to have the control float above the application, e.g.:
	*
	* ```
	* var floatingLayer = require('enyo/floatingLayer');
	* ...
	* create: kind.inherit(function (sup) {
	*	return function() {
	*		sup.apply(this, arguments);
	*		this.setParent(floatingLayer);
	*	}
	* });
	* ```
	*
	* Note: `FloatingLayer` is not meant to be instantiated by users.
	*
	* @class FloatingLayer
	* @extends module:enyo/Control~Control
	* @ui
	* @protected
	*/
	var FloatingLayer = kind(
		/** @lends module:enyo/Control/floatingLayer~FloatingLayer.prototype */ {

		/**
		* @private
		*/
		kind: Control,

		/**
		* @private
		*/
		classes: 'enyo-fit enyo-clip enyo-untouchable',

		/**
		* @private
		*/
		accessibilityPreventScroll: true,

		/**
		* @method
		* @private
		*/
		create: kind.inherit(function (sup) {
			return function() {
				sup.apply(this, arguments);
				this.setParent(null);

				if (platform.ie < 11) {
					this.removeClass('enyo-fit');
				}
			};
		}),

		/**
		* Detects when [node]{@glossary Node} is detatched due to `document.body` being stomped.
		*
		* @method
		* @private
		*/
		hasNode: kind.inherit(function (sup) {
			return function() {
				sup.apply(this, arguments);
				if (this.node && !this.node.parentNode) {
					this.teardownRender();
				}
				return this.node;
			};
		}),

		/**
		* @method
		* @private
		*/
		render: kind.inherit(function (sup) {
			return function() {
				this.parentNode = document.body;
				return sup.apply(this, arguments);
			};
		}),

		/**
		* @private
		*/
		generateInnerHtml: function () {
			return '';
		},

		/**
		* @private
		*/
		beforeChildRender: function () {
			if (!this.hasNode()) {
				this.render();
			}
		},

		/**
		* @private
		*/
		teardownChildren: function () {
		}
	});

	return FloatingLayer;
};
},{'../kind':'enyo/kind','../platform':'enyo/platform'}],'enyo/MixinSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/MixinSupport~MixinSupport} mixin.
* @module enyo/MixinSupport
*/

require('enyo');


var
	utils = require('./utils'),
	kind = require('./kind'),
	logger = require('./logger');

kind.concatenated.push('mixins');

var sup = kind.statics.extend;

var extend = kind.statics.extend = function extend (args, target) {
	if (utils.isArray(args)) return utils.forEach(args, function (ln) { extend.call(this, ln, target); }, this);
	if (typeof args == 'string') apply(target || this.prototype, args);
	else {
		if (args.mixins) feature(target || this, args);
	
		// this allows for mixins to apply mixins which...is less than ideal but possible
		if (args.name) apply(target || this.prototype, args);
		else sup.apply(this, arguments);
	}
};

/*
* Applies, with safeguards, a given mixin to an object.
*/
function apply (proto, props) {
	var applied = proto._mixins? (proto._mixins = proto._mixins.slice()): (proto._mixins = [])
		, name = utils.isString(props)? props: props.name
		, idx = utils.indexOf(name, applied);
	if (idx < 0) {
		name == props && (props = utils.getPath(name));
		// if we could not resolve the requested mixin (should never happen)
		// we throw a simple little error
		// @TODO: Normalize error format
		!props && logger.error('Could not find the mixin ' + name);
		
		// it should be noted that this ensures it won't recursively re-add the same mixin but
		// since it is possible for mixins to apply mixins the names will be out of order
		// this name is pushed on but the nested mixins are applied before this one
		name && applied.push(name);
		
		props = utils.clone(props);
		
		// we need to temporarily move the constructor if it has one so it
		// will override the correct method - this is a one-time permanent
		// runtime operation so subsequent additions of the mixin don't require
		// it again
		if (props.hasOwnProperty('constructor')) {
			props._constructor = props.constructor;
			delete props.constructor;
		}
		
		delete props.name;
		extend(props, proto);
		
		// now put it all back the way it was
		props.name = name;
	}
}

function feature (ctor, props) {
	if (props.mixins) {
		var proto = ctor.prototype || ctor
			, mixins = props.mixins;
		
		// delete props.mixins;
		// delete proto.mixins;
		
		proto._mixins && (proto._mixins = proto._mixins.slice());
		utils.forEach(mixins, function (ln) { apply(proto, ln); });
	}
}

kind.features.push(feature);

/**
* An internally-used support {@glossary mixin} that adds API methods to aid in
* using and applying mixins to [kinds]{@glossary kind}.
*
* @mixin
* @protected
*/
var MixinSupport = {
	
	/**
	* @private
	*/
	name: 'MixinSupport',
	
	/**
	* Extends the instance with the given properties.
	*
	* @param {Object} props - The property [hash]{@glossary Object} from which to extend
	*	the callee.
	*/
	extend: function (props) {
		props && apply(this, props);
	},
	
	/**
	* @private
	*/
	importProps: kind.inherit(function (sup) {
		return function (props) {
			props && props.mixins && feature(this, props);
			
			sup.apply(this, arguments);
		};
	})
};

module.exports = MixinSupport;

},{'./utils':'enyo/utils','./kind':'enyo/kind','./logger':'enyo/logger'}],'enyo/ComputedSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/ComputedSupport~ComputedSupport} mixin.
* @module enyo/ComputedSupport
*/

require('enyo');

var
	kind = require('./kind'),
	utils = require('./utils');

var extend = kind.statics.extend;
	
kind.concatenated.push('computed');

function getComputedValue (obj, path) {
	var cache = obj._getComputedCache(path)
		, isCached = obj._isComputedCached(path);
	
	// in the end, for efficiency and completeness in other situations
	// it is better to know the returned value of all computed properties
	// but in cases where they are set as cached we will sometimes use
	// that value
	if (cache.dirty || cache.dirty === undefined) {
		isCached && (cache.dirty = false);
		cache.previous = cache.value;
		cache.value = obj[path]();
	}
	
	return cache.value;
}

function queueComputed (obj, path) {
	var queue = obj._computedQueue || (obj._computedQueue = [])
		, deps = obj._computedDependencies[path];
		
	if (deps) {
		for (var i=0, dep; (dep=deps[i]); ++i) {
			if (!queue.length || -1 == queue.indexOf(dep)) queue.push(dep);
		}
	}
}

function flushComputed (obj) {
	var queue = obj._computedQueue;
	obj._computedQueue = null;
	if (queue && obj.isObserving()) {
		for (var i=0, ln; (ln=queue[i]); ++i) {
			obj.notify(ln, obj._getComputedCache(ln).value, getComputedValue(obj, ln));
		}
	}
}

/**
* A {@glossary mixin} that adds API methods to support
* [computed properties]{@glossary computed_property}. Unlike other support mixins,
* this mixin does not need to be explicitly included by a [kind]{@glossary kind}. If the
* `computed` [array]{@glossary Array} is found in a kind definition, this mixin will
* automatically be included.
*
* @mixin
* @public
*/
var ComputedSupport = {
	/**
	* @private
	*/
	name: 'ComputedSuport',
	
	/**
	* @private
	*/
	_computedRecursion: 0,
	
	/**
	* Primarily intended for internal use, this method determines whether the
	* given path is a known [computed property]{@glossary computed_property}.
	*
	* @param {String} path - The property or path to test.
	* @returns {Boolean} Whether or not the `path` is a
	*	[computed property]{@glossary computed_property}.
	* @public
	*/
	isComputed: function (path) {
		// if it exists it will be explicitly one of these cases and it is cheaper than hasOwnProperty
		return this._computed && (this._computed[path] === true || this._computed[path] === false);
	},
	
	/**
	* Primarily intended for internal use, this method determines whether the
	* given path is a known dependency of a
	* [computed property]{@glossary computed_property}.
	*
	* @param {String} path - The property or path to test.
	* @returns {Boolean} Whether or not the `path` is a dependency of a
	*	[computed property]{@glossary computed_property}.
	* @public
	*/
	isComputedDependency: function (path) {
		return !! (this._computedDependencies? this._computedDependencies[path]: false);
	},
	
	/**
	* @private
	*/
	get: kind.inherit(function (sup) {
		return function (path) {
			return this.isComputed(path)? getComputedValue(this, path): sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	set: kind.inherit(function (sup) {
		return function (path) {
			// we do not accept parameters for computed properties
			return this.isComputed(path)? this: sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	notifyObservers: function () {
		return this.notify.apply(this, arguments);
	},
	
	/**
	* @private
	*/
	notify: kind.inherit(function (sup) {
		return function (path, was, is) {
			this.isComputedDependency(path) && queueComputed(this, path);
			this._computedRecursion++;
			sup.apply(this, arguments);
			this._computedRecursion--;
			this._computedQueue && this._computedRecursion === 0 && flushComputed(this);
			return this;
		};
	}),
	
	/**
	* @private
	*/
	_isComputedCached: function (path) {
		return this._computed[path];
	},
	
	/**
	* @private
	*/
	_getComputedCache: function (path) {
		var cache = this._computedCache || (this._computedCache = {});
		return cache[path] || (cache[path] = {});
	}
};

module.exports = ComputedSupport;

/*
* Hijack the original so we can add additional default behavior.
*/
var sup = kind.concatHandler;

// @NOTE: It seems like a lot of work but it really won't happen that much and the more
// we push to kind-time the better for initialization time

/**
* @private
*/
kind.concatHandler = function (ctor, props, instance) {

	sup.call(this, ctor, props, instance);

	// only matters if there are computed properties to manage
	if (props.computed) {
		
		var proto = ctor.prototype || ctor
			, computed = proto._computed? Object.create(proto._computed): {}
			, dependencies = proto._computedDependencies? Object.create(proto._computedDependencies): {};
		
		// if it hasn't already been applied we need to ensure that the prototype will
		// actually have the computed support mixin present, it will not apply it more
		// than once to the prototype
		extend(ComputedSupport, proto);
	
		// @NOTE: This is the handling of the original syntax provided for computed properties in 2.3.ish...
		// All we do here is convert it to a structure that can be used for the other scenario and preferred
		// computed declarations format
		if (!props.computed || !(props.computed instanceof Array)) {
			(function () {
				var tmp = [], deps, name, conf;
				// here is the slow iteration over the properties...
				for (name in props.computed) {
					// points to the dependencies of the computed method
					deps = props.computed[name];
					/*jshint -W083 */
					conf = deps && deps.find(function (ln) {
						// we deliberately remove the entry here and forcibly return true to break
						return typeof ln == 'object'? (utils.remove(deps, ln) || true): false;
					});
					/*jshint +W083 */
					// create a single entry now for the method/computed with all dependencies
					tmp.push({method: name, path: deps, cached: conf? conf.cached: null});
				}
				
				// note that we only do this one so even for a mixin that is evaluated several
				// times this would only happen once
				props.computed = tmp;
			}());
		}
		
		var addDependency = function (path, dep) {
			// its really an inverse look at the original
			var deps;
			
			if (dependencies[path] && !dependencies.hasOwnProperty(path)) dependencies[path] = dependencies[path].slice();
			deps = dependencies[path] || (dependencies[path] = []);
			deps.push(dep);
		};
		
		// now we handle the new computed properties the way we intended to
		for (var i=0, ln; (ln=props.computed[i]); ++i) {
			// if the entry already exists we are merely updating whether or not it is
			// now cached
			computed[ln.method] = !! ln.cached;
			// we must now look to add an entry for any given dependencies and map them
			// back to the computed property they will trigger
			/*jshint -W083 */
			if (ln.path && ln.path instanceof Array) ln.path.forEach(function (dep) { addDependency(dep, ln.method); });
			/*jshint +W083 */
			else if (ln.path) addDependency(ln.path, ln.method);
		}
		
		// arg, free the key from the properties so it won't be applied later...
		// delete props.computed;
		// make sure to reassign the correct items to the prototype
		proto._computed = computed;
		proto._computedDependencies = dependencies;
	}
};

},{'./kind':'enyo/kind','./utils':'enyo/utils'}],'enyo/Binding':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Binding~Binding} kind.
* @module enyo/Binding
*/

var
	kind = require('./kind'),
	utils = require('./utils');

var bindings = [];

var DIRTY_FROM = 0x01
	, DIRTY_TO = 0x02;

/**
* Used to determine if an {@link module:enyo/Binding~Binding} is actually ready.
*
* @private
*/
function ready (binding) {
	var rdy = binding.ready;
	
	if (!rdy) {
		
		var from = binding.from || '',
			to = binding.to || '',
			source = binding.source,
			target = binding.target,
			owner = binding.owner,
			twoWay = !binding.oneWay,
			toTarget;
		
		if (typeof from != 'string') from = '';
		if (typeof to != 'string') to = '';
		
		if (!source) {
			
			// the worst case scenario here is for backward compatibility purposes
			// we have to at least be able to derive the source via the from string
			if (from[0] == '^') {
				
				// this means we're reaching for a global
				var fromParts = from.split('.');
				from = fromParts.pop();
				source = utils.getPath.call(global, fromParts.join('.').slice(1));
				
			} else {
				source = owner;
			}
			
		}
		
		if (!target) {
			
			// same worst case as above, for backwards compatibility purposes
			// we have to at least be able to derive the target via the to string
			if (to[0] == '^') {
				
				// this means we're reaching for a global
				var toParts = to.split('.');
				to = toParts.pop();
				target = utils.getPath.call(global, toParts.join('.').slice(1));
			} else {
				target = owner;
			}
		}
		
		// we do this so we don't overwrite the originals in case we need to reset later
		binding._target = target;
		binding._source = source;
		binding._from = from[0] == '.'? from.slice(1): from;
		binding._to = to[0] == '.'? to.slice(1): to;
		
		if (!twoWay) {
			toTarget = binding._to.split('.');
			if (toTarget.length > 2) {
				toTarget.pop();
				binding._toTarget = toTarget.join('.');
			}
		}
		
		// now our sanitization
		rdy = !! (
			(source && (typeof source == 'object')) &&
			(target && (typeof target == 'object')) &&
			(from) &&
			(to)
		);
	}
	
	/*jshint -W093 */
	return (binding.ready = rdy);
	/*jshint +W093 */
}


/**
* @class PassiveBinding
* @public
*/
var PassiveBinding = kind(
	/** @lends module:enyo/Binding~PassiveBinding.prototype */ {
	
	name: 'enyo.PassiveBinding',
	
	/**
	* @private
	*/
	kind: null,
	
	/**
	* This property is used extensively for various purposes within a
	* [binding]{@link module:enyo/Binding~Binding}. One primary purpose is to serve as a root
	* [object]{@glossary Object} from which to	search for the binding's ends (the
	* [source]{@link module:enyo/Binding~Binding#source} and/or [target]{@link module:enyo/Binding~Binding#target}).
	* If the owner created the binding, it will also be responsible for destroying 
	* it (automatically).
	*
	* @type {module:enyo/CoreObject~Object}
	* @default null
	* @public
	*/
	owner: null,
	
	/**
	* Set this only to a reference for an [object]{@glossary Object} to use
	* as the source for the [binding]{@link module:enyo/Binding~Binding}. If this is not a
	* [bindable]{@link module:enyo/BindingSupport~BindingSupport} object, the source will be derived
	* from the [from]{@link module:enyo/Binding~Binding#from} property during initialization.
	* 
	* @type {Object}
	* @default null
	* @public
	*/
	source: null,
	
	/**
	* Set this only to a reference for an [object]{@glossary Object} to use
	* as the target for the [binding]{@link module:enyo/Binding~Binding}. If this is not a
	* [bindable]{@link module:enyo/BindingSupport~BindingSupport} object, the target will will be
	* derived from the [to]{@link module:enyo/Binding~Binding#to} property during initialization.
	* 
	* @type {Object}
	* @default null
	* @public
	*/
	target: null,
	
	/**
	* A path in which the property of the [source]{@link module:enyo/Binding~Binding#source} to
	* bind from may be found. If the source is explicitly provided and the path
	* is relative (i.e., it begins with a `"."`), it is relative to the source;
	* otherwise, it is relative to the [owner]{@link module:enyo/Binding~Binding#owner} of the
	* [binding]{@link module:enyo/Binding~Binding}. To have a binding be evaluated from the
	* global scope, prefix the path with a `"^"`. If the source and the `"^"`
	* are used in tandem, the `"^"` will be ignored and the path will be assumed
	* to be relative to the provided source.
	* 
	* @type {String}
	* @default null
	* @public
	*/
	from: null,
	
	/**
	* A path in which the property of the [target]{@link module:enyo/Binding~Binding#target} to
	* bind from may be found. If the target is explicitly provided and the path
	* is relative (i.e., it begins with a `"."`), it is relative to the target;
	* otherwise, it is relative to the owner of the [binding]{@link module:enyo/Binding~Binding}.
	* To have a binding be evaluated from the global scope, prefix the path with
	* a `"^"`. If the target and the `"^"` are used in tandem, the `"^"` will be
	* ignored and the path will be assumed to be relative to the provided target.
	* 
	* @type {String}
	* @default null
	* @public
	*/
	to: null,

	/**
	* Set this to a [function]{@glossary Function} or the name of a method on
	* the [owner]{@link module:enyo/Binding~Binding#owner} of this [binding]{@link module:enyo/Binding~Binding}.
	* The transform is used to programmatically modify the value being synchronized.
	* See {@link module:enyo/Binding~Binding~Transform} for detailed information on the parameters
	* that are available to `transform`.
	* 
	* @type {module:enyo/Binding~Binding~Transform}
	* @default null
	* @public
	*/
	transform: null,
	
	/**
	* Indicates whether the [binding]{@link module:enyo/Binding~Binding} is actually ready.
	* 
	* @returns {Boolean} `true` if ready; otherwise, `false`.
	* @public
	*/
	isReady: function () {
		return this.ready || ready(this);
	},
	
	/**
	* Causes a single propagation attempt to fail. Typically not called outside
	* the scope of a [transform]{@link module:enyo/Binding~Binding#transform}.
	* 
	* @public
	*/
	stop: function () {
		this._stop = true;
	},
	
	/**
	* Resets all properties to their original state.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	reset: function () {
		this.ready = null;
		this._source = this._target = this._to = this._from = this._toTarget = null;
		return this;
	},
	
	/**
	* Rebuilds the entire [binding]{@link module:enyo/Binding~Binding} and synchronizes
	* the value from the [source]{@link module:enyo/Binding~Binding#source} to the
	* [target]{@link module:enyo/Binding~Binding#target}.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	rebuild: function () {
		return this.reset().sync();
	},
	
	/**
	* Synchronizes values from the [source]{@link module:enyo/Binding~Binding#source} to the
	* [target]{@link module:enyo/Binding~Binding#target}. This usually will not need to be called manually.
	* [Two-way bindings]{@link module:enyo/Binding~Binding#oneWay} will automatically synchronize from the
	* target end once they are connected.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	sync: function () {
		var source, target, from, to, xform, val;

		if (this.isReady()) {
			source = this._source;
			target = this._target;
			from = this._from;
			to = this._to;
			xform = this.getTransform();
			val = utils.getPath.apply(source, [from]);

			if (xform) val = xform.call(this.owner || this, val, DIRTY_FROM, this);
			if (!this._stop) utils.setPath.apply(target, [to, val, {create: false}]);
		}
		
		return this;
	},
	
	/**
	* Releases all of the [binding's]{@link module:enyo/Binding~Binding} parts. Typically, this method will
	* not need to be called directly unless the binding was created without an
	* [owner]{@link module:enyo/Binding~Binding#owner}.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	destroy: function () {
		var owner = this.owner,
			idx;
		
		this.owner = null;
		this.source = this._source = null;
		this.target = this._target = null;
		this.ready = null;
		this.destroyed = true;
		
		// @todo: remove me or postpone operation?
		idx = bindings.indexOf(this);
		if (idx > -1) bindings.splice(idx, 1);
		
		if (owner && !owner.destroyed) owner.removeBinding(this);
		
		return this;
	},
	
	/**
	* @private
	*/
	getTransform: function () {
		return this._didInitTransform ? this.transform : (function (bnd) {
			bnd._didInitTransform = true;
			
			var xform = bnd.transform,
				owner = bnd.owner,
				xformOwner = owner && owner.bindingTransformOwner;
			
			if (xform) {
				if (typeof xform == 'string') {
					if (xformOwner && xformOwner[xform]) {
						xform = xformOwner[xform];
					} else if (owner && owner[xform]) {
						xform = owner[xform];
					} else {
						xform = utils.getPath.call(global, xform);
					}
				}
				
				/*jshint -W093 */
				return (bnd.transform = (typeof xform == 'function' ? xform : null));
				/*jshint +W093 */
			}
		})(this);
	},
	
	/**
	* @private
	*/
	constructor: function (props) {
		bindings.push(this);
		
		if (props) utils.mixin(this, props);
		
		if (!this.euid) this.euid = utils.uid('b');

		this.sync();
	}
});

/**
* The details for an {@link module:enyo/Binding~Binding#transform} [function]{@glossary Function},
* including the available parameters and how they can be used.
* 
* @callback module:enyo/Binding~Binding~Transform
* @param {*} value - The value being synchronized.
* @param {Number} direction - The direction of synchronization; will be either
* 	1 (source value has changed and will be written to target) or 2 (target
* 	value has changed and will be written to source).
* @param {Object} binding - A reference to the associated [binding]{@link module:enyo/Binding~Binding}. In cases 
* 	where the binding should be interrupted and not propagate the synchronization at all, call
* 	the [stop()]{@link module:enyo/Binding~Binding#stop} method on the passed-in binding reference.
*/

/**
* {@link module:enyo/Binding~Binding} is a mechanism used to keep properties synchronized. A 
* binding may be used to link two properties on different
* [objects]{@glossary Object}, or even two properties on the same object.
* Once a binding has been established, it will wait for change notifications;
* when a notification arrives, the binding will synchronize the value between
* the two ends. Note that bindings may be either
* [one-way]{@link module:enyo/Binding~Binding#oneWay} (the default) or
* [two-way]{@link module:enyo/Binding~Binding#oneWay}.
* 
* Usually, you will not need to create Binding objects arbitrarily, but will
* instead rely on the public [BindingSupport API]{@link module:enyo/BindingSupport~BindingSupport},
* which is applied to [Object]{@link module:enyo/CoreObject~Object} and so is available on
* all of its [subkinds]{@glossary subkind}.
* 
* @class Binding
* @public
*/
exports = module.exports = kind(
	/** @lends module:enyo/Binding~Binding.prototype */ {
	
	name: 'enyo.Binding',
	
	/**
	* @private
	*/
	kind: PassiveBinding,
	
	/**
	* If a [binding]{@link module:enyo/Binding~Binding} is one-way, this flag should be `true` (the default). 
	* If this flag is set to `false`, the binding will be two-way.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	oneWay: true,
	
	/**
	* If the [binding]{@link module:enyo/Binding~Binding} was able to resolve both ends (i.e., its 
	* [source]{@link module:enyo/Binding~Binding#source} and [target]{@link module:enyo/Binding~Binding#target} 
	* [objects]{@glossary Object}), this value will be `true`. Setting this manually will
	* have undesirable effects.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	connected: false,
	
	/**
	* By default, a [binding]{@link module:enyo/Binding~Binding} will attempt to connect to both ends 
	* ([source]{@link module:enyo/Binding~Binding#source} and [target]{@link module:enyo/Binding~Binding#target}). If this 
	* process should be deferred, set this flag to `false`.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	autoConnect: true,
	
	/**
	* By default, a [binding]{@link module:enyo/Binding~Binding} will attempt to synchronize its values from 
	* its [source]{@link module:enyo/Binding~Binding#source} to its [target]{@link module:enyo/Binding~Binding#target}. If 
	* this process should be deferred, set this flag to `false`.
	* 
	* @type {Boolean}
	* @default true
	* @public
	*/
	autoSync: true,
	
	/**
	* The `dirty` property represents the changed value state of both the property designated by
	* the [from]{@link module:enyo/Binding~Binding#from} path and the property designated by the 
	* [to]{@link module:enyo/Binding~Binding#to} path.
	*
	* @type {Number}
	* @default module:enyo/Binding#DIRTY_FROM
	* @public
	*/
	dirty: DIRTY_FROM,
	
	/**
	* Indicates whether the [binding]{@link module:enyo/Binding~Binding} is currently connected.
	*
	* @returns {Boolean} `true` if connected; otherwise, `false`.
	* @public
	*/
	isConnected: function () {
		var from = this._from,
			to = this.oneWay ? (this._toTarget || this._to) : this._to,
			source = this._source,
			target = this._target,
			toChain,
			fromChain;
			
		if (from && to && source && target) {
			if (!this.oneWay || this._toTarget) toChain = target.getChains()[to];
			fromChain = source.getChains()[from];
			
			return this.connected
				&& (fromChain ? fromChain.isConnected() : true)
				&& (toChain ? toChain.isConnected() : true);
		}
		
		return false;
	},
	
	/**
	* Resets all properties to their original state.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	reset: function () {
		this.disconnect();
		return PassiveBinding.prototype.reset.apply(this, arguments);
	},
	
	/**
	* Rebuilds the entire [binding]{@link module:enyo/Binding~Binding}. Will synchronize if it is able to 
	* connect and the [autoSync]{@link module:enyo/Binding~Binding#autoSync} flag is `true`.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	rebuild: function () {
		return this.reset().connect();
	},
	
	/**
	* Connects the ends (i.e., the [source]{@link module:enyo/Binding~Binding#source} and
	* [target]{@link module:enyo/Binding~Binding#target}) of the [binding]{@link module:enyo/Binding~Binding}. While you
	* typically won't need to call this method, it is safe to call even when the ends are
	* already established. Note that if one or both of the ends does become connected and the
	* [autoSync]{@link module:enyo/Binding~Binding#autoSync} flag is `true`, the ends will automatically be
	* synchronized.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	connect: function () {
		if (!this.isConnected()) {
			if (this.isReady()) {
				this._source.observe(this._from, this._sourceChanged, this, {priority: true});
				
				// for two-way bindings we register to observe changes
				// from the target
				if (!this.oneWay) this._target.observe(this._to, this._targetChanged, this);
				else if (this._toTarget) {
					this._target.observe(this._toTarget, this._toTargetChanged, this, {priority: true});
				}
				
				// we flag it as having been connected
				this.connected = true;
				if (this.isConnected() && this.autoSync) this.sync(true);
			}
		}
		
		return this;
	},
	
	/**
	* Disconnects from the ends (i.e., the [source]{@link module:enyo/Binding~Binding#source} and 
	* [target]{@link module:enyo/Binding~Binding#target}) if a connection exists at either end. This method 
	* will most likely not need to be called directly.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	disconnect: function () {
		if (this.isConnected()) {
			this._source.unobserve(this._from, this._sourceChanged, this);
			
			// for two-way bindings we unregister the observer from
			// the target as well
			if (!this.oneWay) this._target.unobserve(this._to, this._targetChanged, this);
			else if (this._toTarget) {
				this._target.unobserve(this._toTarget, this._toTargetChanged, this);
			}
			
			this.connected = false;
		}
		
		return this;
	},
	
	/**
	* Synchronizes values from the [source]{@link module:enyo/Binding~Binding#source} to the
	* [target]{@link module:enyo/Binding~Binding#target}. This usually will not need to be called manually.
	* [Two-way bindings]{@link module:enyo/Binding~Binding#oneWay} will automatically synchronize from the
	* target end once they are connected.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	sync: function (force) {
		var source = this._source,
			target = this._target,
			from = this._from,
			to = this._to,
			xform = this.getTransform(),
			val;
		
		if (this.isReady() && this.isConnected()) {
				
			switch (this.dirty || (force && DIRTY_FROM)) {
			case DIRTY_TO:
				val = target.get(to);
				if (xform) val = xform.call(this.owner || this, val, DIRTY_TO, this);
				if (!this._stop) source.set(from, val, {create: false});
				break;
			case DIRTY_FROM:
				
			// @TODO: This should never need to happen but is here just in case
			// it is ever arbitrarily called not having been dirty?
			// default:
				val = source.get(from);
				if (xform) val = xform.call(this.owner || this, val, DIRTY_FROM, this);
				if (!this._stop) target.set(to, val, {create: false});
				break;
			}
			this.dirty = null;
			this._stop = null;
		}
		
		return this;
	},
	
	/**
	* Releases all of the [binding's]{@link module:enyo/Binding~Binding} parts and unregisters its 
	* [observers]{@link module:enyo/ObserverSupport~ObserverSupport}. Typically, this method will not need to be called 
	* directly unless the binding was created without an [owner]{@link module:enyo/Binding~Binding#owner}.
	* 
	* @returns {this} The callee for chaining.
	* @public
	*/
	destroy: function () {
		this.disconnect();

		return PassiveBinding.prototype.destroy.apply(this, arguments);
	},
	
	/**
	* @private
	*/
	constructor: function (props) {
		bindings.push(this);
		
		if (props) utils.mixin(this, props);
		
		if (!this.euid) this.euid = utils.uid('b');
		if (this.autoConnect) this.connect();
	},
	
	/**
	* @private
	*/
	_sourceChanged: function (was, is, path) {
		// @TODO: Should it...would it benefit from using these passed in values?
		this.dirty = this.dirty == DIRTY_TO ? null : DIRTY_FROM;
		return this.dirty == DIRTY_FROM && this.sync();
	},
	
	/**
	* @private
	*/
	_targetChanged: function (was, is, path) {
		// @TODO: Same question as above, it seems useful but would it affect computed
		// properties or stale values?
		this.dirty = this.dirty == DIRTY_FROM ? null : DIRTY_TO;
		return this.dirty == DIRTY_TO && this.sync();
	},
	
	/**
	* @private
	*/
	_toTargetChanged: function (was, is, path) {
		this.dirty = DIRTY_FROM;
		this.reset().connect();
	}
});

/**
* Retrieves a [binding]{@link module:enyo/Binding~Binding} by its global id.
*
* @param {String} euid - The [Enyo global id]{@glossary EUID} by which to retrieve a 
*	[binding]{@link module:enyo/Binding~Binding}.
* @returns {module:enyo/Binding~Binding|undefined} A reference to the binding if the id
*	is found; otherwise, it will return [undefined]{@glossary undefined}.
* 
* @static
* @public
*/
exports.find = function (euid) {
	return bindings.find(function (ln) {
		return ln.euid == euid;
	});
};

/**
* All {@link module:enyo/Binding~Binding} instances are stored in this list and may be retrieved via the
* {@link module:enyo/Binding.find} method using an {@link module:enyo/Binding~Binding#id} identifier.
*
* @type {module:enyo/Binding~Binding[]}
* @default []
* @public
*/
exports.bindings = bindings;

/**
* Possible value of the [dirty]{@link module:enyo/Binding~Binding#dirty} property, indicating that the value 
* of the [binding source]{@link module:enyo/Binding~Binding#source} has changed.
* 
* @static
* @public
*/
exports.DIRTY_FROM = DIRTY_FROM;

/**
* Possible value of the [dirty]{@link module:enyo/Binding~Binding#dirty} property, indicating that the value
* of the [binding target]{@link module:enyo/Binding~Binding#target} has changed.
* 
* @static
* @public
*/
exports.DIRTY_TO = DIRTY_TO;

/**
* The default [kind]{@glossary kind} that provides [binding]{@link module:enyo/Binding~Binding} 
* functionality.
* 
* @static
* @public
*/
exports.defaultBindingKind = exports;

/**
* The kind declaration for the [PassiveBinding]{@link module:enyo/Binding~PassiveBinding} kind
* @public
*/
exports.PassiveBinding = PassiveBinding;

},{'./kind':'enyo/kind','./utils':'enyo/utils'}],'enyo/LinkedListNode':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/LinkedListNode~LinkedListNode} kind.
* @module enyo/LinkedListNode
*/

var
	kind = require('./kind'),
	utils = require('./utils');

/**
* An abstract linked-list node.
*
* @class LinkedListNode
* @private
*/
module.exports = kind(
	/** @lends module:enyo/LinkedListNode~LinkedListNode.prototype */ {
	
	/**
	* @private
	*/
	kind: null,
	
	/**
	* @private
	*/

	
	/**
	* @private
	*/
	prev: null,
	
	/**
	* @private
	*/
	next: null,
	
	/**
	* @private
	*/
	copy: function () {
		var cpy = new this.ctor();
		cpy.prev = this.prev;
		cpy.next = this.next;
		return cpy;
	},
	
	/**
	* @private
	*/
	constructor: function (props) {
		props && utils.mixin(this, props);
	},
	
	/**
	* @private
	*/
	destroy: function () {
		// clear reference to previous node
		this.prev = null;
		
		// if we have a reference to our next node
		// we continue down the chain
		this.next && this.next.destroy();
		
		// clear our reference to the next node
		this.next = null;
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils'}],'enyo/BindingSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/BindingSupport~BindingSupport} mixin
* @module enyo/BindingSupport
*/

require('enyo');

var
	kind = require('./kind'),
	utils = require('./utils');

var
	Binding = require('./Binding');

kind.concatenated.push('bindings');

/**
* An internally-used {@glossary mixin} that is added to {@link module:enyo/CoreObject~Object}
* and its [subkinds]{@glossary subkind}. It includes public and protected API
* methods for working with [bindings]{@link module:enyo/Binding~Binding}.
*
* @mixin
* @protected
*/
var BindingSupport = {
	
	/**
	* @private
	*/
	name: 'BindingSupport',
	
	/**
	* @private
	*/
	_bindingSupportInitialized: false,
	
	/**
	* Imperatively creates a [binding]{@link module:enyo/Binding~Binding}. Merges a variable
	* number of [hashes]{@glossary Object} and instantiates a binding that
	* will have its [owner]{@link module:enyo/Binding~Binding#owner} property set to the callee
	* (the current {@link module:enyo/CoreObject~Object}). Bindings created in this way will be
	* [destroyed]{@link module:enyo/Binding~Binding#destroy} when their `owner` is
	* [destroyed]{@link module:enyo/CoreObject~Object#destroy}.
	*
	* @param {...Object} props A variable number of [hashes]{@glossary Object} that will
	*	be merged into the properties applied to the {@link module:enyo/Binding~Binding} instance.
	* @returns {this} The callee for chaining.
	* @public
	*/
	binding: function () {
		var args = utils.toArray(arguments)
			, props = utils.mixin(args)
			, bindings = this.bindings || (this.bindings = [])
			, passiveBindings = this.passiveBindings || (this.passiveBindings = [])
			, PBCtor = Binding.PassiveBinding
			, Ctor, bnd;
			
		props.owner = props.owner || this;
		Ctor = props.kind = props.kind || this.defaultBindingKind || Binding.defaultBindingKind;
		
		if (this._bindingSupportInitialized) {
			utils.isString(Ctor) && (Ctor = props.kind = kind.constructorForKind(Ctor));
			bnd = new Ctor(props);
			bindings.push(bnd);
			if (Ctor === PBCtor) {
				passiveBindings.push(bnd);
			}
			return bnd;
		} else bindings.push(props);
		
		return this;
	},
	
	/**
	* Removes and [destroys]{@link module:enyo/Binding~Binding#destroy} all of, or a subset of,
	* the [bindings]{@link module:enyo/Binding~Binding} belonging to the callee.
	*
	* @param {module:enyo/Binding~Binding[]} [subset] - The optional [array]{@glossary Array} of
	*	[bindings]{@link module:enyo/Binding~Binding} to remove.
	* @returns {this} The callee for chaining.
	* @public
	*/
	clearBindings: function (subset) {
		var bindings = subset || (this.bindings && this.bindings.slice());
		bindings.forEach(function (bnd) {
			bnd.destroy();
		});
		
		return this;
	},

	syncBindings: function (opts) {
		var all = opts && opts.all,
			force = opts && opts.force,
			bindings = all ? this.bindings : this.passiveBindings;

		bindings.forEach(function (b) {
			b.sync(force);
		});
	},
	
	/**
	* Removes a single {@link module:enyo/Binding~Binding} from the callee. (This does not
	* [destroy]{@link module:enyo/Binding~Binding#destroy} the binding.) Also removes the
	* [owner]{@link module:enyo/Binding~Binding#owner} reference if it is the callee.
	*
	* It should be noted that when a binding is destroyed, it is automatically
	* removed from its owner.
	*
	* @param {module:enyo/Binding~Binding} binding - The {@link module:enyo/Binding~Binding} instance to remove.
	* @returns {this} The callee for chaining.
	* @public
	*/
	removeBinding: function (binding) {
		utils.remove(binding, this.bindings);
		if (binding.ctor === Binding.PassiveBinding) {
			utils.remove(binding, this.passiveBindings);
		}
		
		if (binding.owner === this) binding.owner = null;
		
		return this;
	},
	
	/**
	* @private
	*/
	constructed: kind.inherit(function (sup) {
		return function () {
			var bindings = this.bindings;
			this._bindingSupportInitialized = true;
			if (bindings) {
				this.bindings = [];
				this.passiveBindings = [];
				bindings.forEach(function (def) {
					this.binding(def);
				}, this);
			}
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.bindings && this.bindings.length && this.clearBindings();
			this.bindings = null;
			this.passiveBindings = null;
		};
	})
};

module.exports = BindingSupport;

/**
	Hijack the original so we can add additional default behavior.
*/
var sup = kind.concatHandler
	, flags = {ignore: true};

/**
* @private
*/
kind.concatHandler = function (ctor, props, instance) {
	var proto = ctor.prototype || ctor
		, kind = props && (props.defaultBindingKind || Binding.defaultBindingKind)
		, defaults = props && props.bindingDefaults;
	
	sup.call(this, ctor, props, instance);
	if (props.bindings) {
		props.bindings.forEach(function (bnd) {
			defaults && utils.mixin(bnd, defaults, flags);
			bnd.kind || (bnd.kind = kind); 
		});
		
		proto.bindings = proto.bindings? proto.bindings.concat(props.bindings): props.bindings;
		delete props.bindings;
	}
};

},{'./kind':'enyo/kind','./utils':'enyo/utils','./Binding':'enyo/Binding'}],'enyo/LinkedList':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/LinkedList~LinkedList} kind.
* @module enyo/LinkedList
*/

var
	kind = require('./kind');

var
	LinkedListNode = require('./LinkedListNode');

/**
* An abstract linked-list.
*
* @class LinkedList
* @private
*/
module.exports = kind(
	/** @lends module:enyo/LinkedList~LinkedList.prototype */ {

	/**
	* @private
	*/
	kind: null,

	/**
	* @private
	*/
	nodeKind: LinkedListNode,

	/**
	* @private
	*/
	head: null,

	/**
	* @private
	*/
	tail: null,

	/**
	* @private
	*/
	length: 0,

	/**
	* @private
	*/
	clear: function () {
		if (this.head) {
			// this will trigger a chain event down the list
			this.head.destroy();
		}
		this.head = null;
		this.tail = null;
		this.length = 0;
	},

	/**
	* @private
	*/
	slice: function (fromNode, toNode) {
		var node = fromNode || this.head
			, list = new this.ctor()
			, cpy;

		// ensure we have a final node or our tail
		toNode = toNode || this.tail;

		if (node && node !== toNode) {
			do {
				cpy = node.copy();
				list.appendNode(cpy);
			} while ((node = node.next) && node !== toNode);
		}

		return list;
	},

	/**
	* @private
	*/
	destroy: function () {
		this.clear();
		this.destroyed = true;
	},

	/**
	* @private
	*/
	createNode: function (props) {
		return new this.nodeKind(props);
	},

	/**
	* @private
	*/
	deleteNode: function (node) {
		this.removeNode(node);

		// can't chain destruct because we removed its chain references
		node.destroy();
		return this;
	},

	/**
	* @private
	*/
	removeNode: function (node) {
		var prev = node.prev
			, next = node.next;

		prev && (prev.next = next);
		next && (next.prev = prev);
		this.length--;
		node.next = node.prev = null;
		return this;
	},

	/**
	* @private
	*/
	appendNode: function (node, targetNode) {
		targetNode = targetNode || this.tail;

		if (targetNode) {
			if (targetNode.next) {
				node.next = targetNode.next;
			}

			targetNode.next = node;
			node.prev = targetNode;

			if (targetNode === this.tail) {
				this.tail = node;
			}

			this.length++;
		} else {

			this.head = this.tail = node;
			node.prev = node.next = null;
			this.length = 1;
		}
		return this;
	},

	/**
	* @private
	*/
	find: function (fn, ctx, targetNode) {
		var node = targetNode || this.head;
		if (node) {
			do {
				if (fn.call(ctx || this, node, this)) {
					return node;
				}
			} while ((node = node.next));
		}
		// if no node qualified it returns false
		return false;
	},

	/**
	* @private
	*/
	forward: function (fn, ctx, targetNode) {
		var node = targetNode || this.head;
		if (node) {
			do {
				if (fn.call(ctx || this, node, this)) {
					break;
				}
			} while ((node = node.next));
		}
		// returns the last node (if any) that was processed in the chain
		return node;
	},

	/**
	* @private
	*/
	backward: function (fn, ctx, targetNode) {
		var node = targetNode || this.tail;
		if (node) {
			do {
				if (fn.call(ctx || this, node, this)) {
					break;
				}
			} while ((node = node.prev));
		}
		// returns the last node (if any) that was processed in the chain
		return node;
	},

	/**
	* @private
	*/
	constructor: function () {
		this.nodeType = kind.constructorForKind(this.nodeType);
	}
});

},{'./kind':'enyo/kind','./LinkedListNode':'enyo/LinkedListNode'}],'enyo/ObserverChainNode':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ObserverChainNode~ObserverChainNode} kind.
* @module enyo/ObserverChainNode
*/

var
	kind = require('./kind');

var
	LinkedListNode = require('./LinkedListNode');

function get (base, prop) {
	return base && /*isObject(base)*/ (typeof base == 'object')? (
		base.get? base.get(prop): base[prop]
	): undefined;
}

/**
* An internally used {@glossary kind}.
*
* @class ObserverChainNode
* @extends module:enyo/LinkedListNode~LinkedListNode
* @private
*/
module.exports = kind(
	/** @lends module:enyo/ObserverChainNode~ObserverChainNode.prototype */ {

	/**
	* @private
	*/
	kind: LinkedListNode,

	/**
	* @private
	*/

	
	/**
	* @method
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.connect();
		};
	}),
	
	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			this.disconnect();
			sup.apply(this, arguments);
			this.observer = null;
			this.list = null;
			this.object = null;
		};
	}),
	
	/**
	* @private
	*/
	connect: function () {
		var obj = this.object
			, obs = this._changed
			, prop = this.property;
		if (obj) {
			if (obj.observe) obj.observe(prop, obs, this, {noChain: true, priority: true});
			this.connected = true;
			this.list.connected++;
		}
	},
	
	/**
	* @private
	*/
	disconnect: function () {
		var obj = this.object
			, obs = this._changed
			, prop = this.property
			, was = this.connected;
		obj && obj.unobserve && obj.unobserve(prop, obs, this);
		this.connected = null;
		if (was) this.list.connected--;
	},
	
	/**
	* @private
	*/
	setObject: function (object) {
		var cur = this.object
			, prop = this.property
			, was, is;
		
		if (cur !== object) {
			this.disconnect();
			this.object = object;
			this.connect();
			
			if (this.list.tail === this) {
				was = get(cur, prop);
				is = get(object, prop);
				// @TODO: It would be better to somehow cache values
				// such that it could intelligently derive the difference
				// without needing to continuously look it up with get
				was !== is && this.list.observed(this, was, is);
			}
		}
	},
	
	/**
	* @private
	*/
	_changed: function (was, is) {
		this.list.observed(this, was, is);
	}
});

},{'./kind':'enyo/kind','./LinkedListNode':'enyo/LinkedListNode'}],'enyo/ObserverChain':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ObserverChain~ObserverChain} kind.
* @module enyo/ObserverChain
*/

var
	kind = require('./kind');

var
	LinkedList = require('./LinkedList'),
	ObserverChainNode = require('./ObserverChainNode');

function get (base, prop) {
	return base && /*isObject(base)*/ (typeof base == 'object')? (
		base.get? base.get(prop): base[prop]
	): undefined;
}

/**
* An internally used {@glossary kind}.
*
* @class ObserverChain
* @extends module:enyo/LinkedList~LinkedList
* @private
*/
module.exports = kind(
	/** @lends module:enyo/ObserverChain~ObserverChain.prototype */ {

	/**
	* @private
	*/
	kind: LinkedList,

	/**
	* @private
	*/
	nodeKind: ObserverChainNode,

	/**
	* @private
	*/

	
	/**
	* @private
	*/
	connected: 0,
	
	/**
	* @method
	* @private
	*/
	constructor: function (path, object) {
		this.object = object;
		this.path = path;
		this.parts = path.split('.');
		this.createChain();
	},
	
	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.object = null;
			this.parts = null;
			this.path = null;
		};
	}),
	
	/**
	* @private
	*/
	rebuild: function (target) {
		if (!this.rebuilding) {
			this.rebuilding = true;
			this.forward(function (node) {
				if (node !== this.head) {
					var src = node.prev.object
						, prop = node.prev.property;
					node.setObject(get(src, prop));
				}
			}, this, target);
			this.rebuilding = false;
		}
	},
	
	/**
	* @private
	*/
	isConnected: function () {
		return !! (this.connected === this.length && this.length);
	},
	
	/**
	* @private
	*/
	buildPath: function (target) {
		var str = '';
		
		this.backward(function (node) {
			str = node.property + (str? ('.' + str): str);
		}, this, target);
		
		return str;
	},
	
	/**
	* @private
	*/
	createChain: function () {
		var parts = this.parts
			, next = this.object
			, $ = false
			, node, prop;
			
		for (var i=0; (prop=parts[i]); ++i) {
			
		// forEach(parts, function (prop, idx) {
			// we create a special case for the $ hash property
			if (prop == '$') {
				$ = true;
			} else {
				// in cases where the chain has the $ property we arbitrarily
				// force it onto our current nodes property and let the special handling
				// in ObserverChainNode and ObserverSupport handle the rest
				$ && (prop = '$.' + prop);
				node = this.createNode({property: prop, object: next, list: this});
				this.appendNode(node);
				next = get(next, prop);
				$ = false;
			}
		// }, this);
		}
	},
	
	/**
	* @private
	*/
	observed: function (node, was, is) {
		this.object.stopNotifications();
		// @NOTE: About the following two cases, they are mutually exclusive and this seems perfect
		// that we don't see double notifications
		// @TODO: Only notify if it was the full property path? This is far more efficient after
		// testing but not as flexible...
		node === this.tail /*&& was !== is*/ && this.object.notify(this.buildPath(node), was, is);
		// @TODO: It seems the same case across the board that the rebuild only needs to take place
		// from the beginning to the second-to-last elem
		node !== this.tail && was !== is && this.rebuild(node);
		this.object.startNotifications();
	}
});

},{'./kind':'enyo/kind','./LinkedList':'enyo/LinkedList','./ObserverChainNode':'enyo/ObserverChainNode'}],'enyo/ObserverSupport':[function (module,exports,global,require,request){
/**
* Exports the {@link module:enyo/ObserverSupport~ObserverSupport} mixin
* @module enyo/ObserverSupport
*/
require('enyo');

var
	kind = require('./kind'),
	utils = require('./utils');

var
	ObserverChain = require('./ObserverChain');

var observerTable = {};
	
kind.concatenated.push("observers");

/**
* Responds to changes in one or more properties.
* [Observers]{@link module:enyo/ObserverSupport~ObserverSupport#observers} may be registered in
* several different ways. See the {@link module:enyo/ObserverSupport} documentation
* for more details. Also note that, while observers should not be called
* directly, if defined on a [kind]{@glossary kind}, they may be
* overloaded for special behavior.
*
* @see {@link module:enyo/ObserverSupport}
* @see {@link module:enyo/ObserverSupport~ObserverSupport#observe}
* @callback module:enyo/ObserverSupport~ObserverSupport~Observer
* @param {*} was - The previous value of the property that has changed.
* @param {*} is - The current value of the property that has changed.
* @param {String} prop - The name of the property that has changed.
* @public
*/

function addObserver (path, fn, ctx, opts) {
	
	var observers = this.getObservers(),
		chains = this.getChains(),
		parts = path.split('.'),
		prio = opts && opts.priority,
		entries,
		noChain;
		
	noChain = (opts && opts.noChain) ||
			chains[path] ||
			parts.length < 2 ||
			(parts.length === 2 && path[0] == '$');
	
	if (observers[path] && !observers.hasOwnProperty(path)) {
		observers[path] = observers[path].slice();
	}
	
	entries = observers[path] || (observers[path] = []);
	entries[prio ? 'unshift' : 'push']({method: fn, ctx: ctx || this});
	
	if (!noChain) {
		this.getChains()[path] = new ObserverChain(path, this);
	}
	
	return this;
}

function removeObserver (obj, path, fn, ctx) {
	var observers = obj.getObservers(path)
		, chains = obj.getChains()
		, idx, chain;
		
	if (observers && observers.length) {
		idx = observers.findIndex(function (ln) {
			return ln.method === fn && (ctx? ln.ctx === ctx: true);
		});
		idx > -1 && observers.splice(idx, 1);
	}
	
	if ((chain = chains[path]) && !observers.length) {
		chain.destroy();
	}
	
	return obj;
}

function notifyObservers (obj, path, was, is, opts) {
	if (obj.isObserving()) {
		var observers = obj.getObservers(path);
		
		if (observers && observers.length) {
			for (var i=0, ln; (ln=observers[i]); ++i) {
				if (typeof ln.method == "string") obj[ln.method](was, is, path, opts);
				else ln.method.call(ln.ctx || obj, was, is, path, opts);
			}
		}
	} else enqueue(obj, path, was, is, opts);
	
	return obj;
}

function enqueue (obj, path, was, is, opts) {
	if (obj._notificationQueueEnabled) {
		var queue = obj._notificationQueue || (obj._notificationQueue = {})
			, ln = queue[path] || (queue[path] = {});
	
		ln.was = was;
		ln.is = is;
		ln.opts = opts;
	}
}

function flushQueue (obj) {
	var queue = obj._notificationQueue
		, path, ln;
	
	if (queue) {
		obj._notificationQueue = null;
		
		for (path in queue) {
			ln = queue[path];
			obj.notify(path, ln.was, ln.is, ln.opts);
		}
	}
}
	
/**
* Adds support for notifications on property changes. Most
* [kinds]{@glossary kind} (including all kinds that inherit from
* {@link module:enyo/CoreObject~Object}) already have this {@glossary mixin} applied.
* This allows for
* [observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} to be
* [declared]{@link module:enyo/ObserverSupport~ObserverSupport#observers} or "implied" (see below).
*
* Implied observers are not declared, but derived from their `name`. They take
* the form `<property>Changed`, where `<property>` is the property to
* [observe]{@link module:enyo/ObserverSupport~ObserverSupport#observe}. For example:
*
* ```javascript
* var
* 	kind = require('enyo/kind');
*
* module.exports = kind({
* 	name: 'MyKind',
*
* 	// some local property
* 	value: true,
*
* 	// and the implied observer of that property
* 	valueChanged: function (was, is) {
* 		// do something now that it has changed
* 		enyo.log('value was "' + was + '" but now it is "' + is + '"');
* 	}
* });
*
* var mine = new MyKind();
* mine.set('value', false); // -> value was "true" but now it is "false"
* ```
*
* Using the `observers` property for its declarative syntax, an observer may
* observe any property (or properties), regardless of its `name`. For example:
*
* ```javascript
* var
* 	kind = require('enyo/kind');
*
* module.exports = kind({
* 	name: 'MyKind',
*
* 	// some local property
* 	value: true,
*
* 	// another local property
* 	count: 1,
*
* 	// declaring the observer
* 	observers: [
* 		// the path can be a single string or an array of strings
* 		{method: 'myObserver', path: ['value', 'count']}
* 	],
*
* 	// now this observer will be notified of changes to both properties
* 	myObserver: function (was, is, prop) {
* 		// do something now that it changed
* 		enyo.log(prop + ' was "' + was + '" but now it is "' + is + '"');
* 	}
* });
*
* var mine = new MyKind();
* mine.set('value', false); // -> value was "true" but now it is "false"
* mine.set('count', 2); // -> count was "1" but now it is "2"
* ```
*
* While observers may be [notified]{@link module:enyo/ObserverSupport~ObserverSupport#notify} of
* changes to multiple properties, this is not a typical use case for implied
* observers, since, by convention, they are only registered for the named
* property.
*
* There is one additional way to use observers, if necessary. You may use the
* API methods [observe()]{@link module:enyo/ObserverSupport~ObserverSupport#observe} and
* [unobserve()]{@link module:enyo/ObserverSupport~ObserverSupport#unobserve} to dynamically
* register and unregister observers as needed. For example:
*
* ```javascript
* var
* 	Object = require('enyo/CoreObject').Object;
*
* var object = new Object({value: true});
* var observer = function (was, is) {
* 	enyo.log('value was "' + was + '" but now it is "' + is + '"');
* };
*
* object.observe('value', observer);
* object.set('value', false); // -> value was "true" but now it is "false"
* object.unobserve('value', observer);
* object.set('value', true); // no output because there is no observer
* ```
*
* Be sure to read the documentation for these API methods; proper usage of
* these methods is important for avoiding common pitfalls and memory leaks.
*
* @mixin
* @public
*/
var ObserverSupport = {
	
	/**
	* @private
	*/
	name: "ObserverSupport",
	
	/**
	* @private
	*/
	_observing: true,
	
	/**
	* @private
	*/
	_observeCount: 0,
	
	/**
	* @private
	*/
	_notificationQueue: null,
	
	/**
	* @private
	*/
	_notificationQueueEnabled: true,
	
	/**
	* Determines whether `_observing` is enabled. If
	* [stopNotifications()]{@link module:enyo/ObserverSupport~ObserverSupport#stopNotifications} has
	* been called, then this will return `false`.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#stopNotifications}
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#startNotifications}
	* @returns {Boolean} Whether or not the callee is observing.
	*/
	isObserving: function () {
		return this._observing;
	},
	
	/**
	* Returns an immutable list of [observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer}
	* for the given `path`, or all observers for the callee.
	*
	* @param {String} [path] - Path or property path for which
	* [observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} will be returned. If not
	* specified, all observers for the callee will be returned.
	*
	* @returns {module:enyo/ObserverSupport~ObserverSupport~Observer[]} The immutable
	* [array]{@glossary Array} of observers.
	* @public
	*/
	getObservers: function (path) {
		var euid = this.euid || (this.euid = utils.uid('o')),
			ret,
			loc;
			
		loc = observerTable[euid] || (observerTable[euid] = (
			this._observers? Object.create(this._observers): {}
		));
		
		if (!path) return loc;
		
		ret = loc[path];
		
		// if the special property exists...
		if (loc['*']) ret = ret ? ret.concat(loc['*']) : loc['*'].slice();
		return ret;
	},
	
	/**
	* @private
	*/
	getChains: function () {
		return this._observerChains || (this._observerChains = {});
	},
	
	/**
	* @deprecated
	* @alias {@link module:enyo/ObserverSupport~ObserverSupport#observe}
	* @public
	*/
	addObserver: function () {
		// @NOTE: In this case we use apply because of internal variable use of parameters
		return addObserver.apply(this, arguments);
	},
	
	/**
	* Registers an [observer]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} to be
	* [notified]{@link module:enyo/ObserverSupport~ObserverSupport#notify} when the given property has
	* been changed. It is important to note that it is possible to register the
	* same observer multiple times (although this is never the intention), so
	* care should be taken to avoid that scenario. It is also important to
	* understand how observers are stored and unregistered
	* ([unobserved]{@link module:enyo/ObserverSupport~ObserverSupport#unobserve}). The `ctx` (context)
	* parameter is stored with the observer reference. **If used when
	* registering, it should also be used when unregistering.**
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#unobserve}
	* @param {String} path - The property or property path to observe.
	* @param {module:enyo/ObserverSupport~ObserverSupport~Observer} fn - The
	*	[observer]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} method that responds to changes.
	* @param {*} [ctx] - The `this` (context) under which to execute the observer.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	observe: function () {
		// @NOTE: In this case we use apply because of internal variable use of parameters
		return addObserver.apply(this, arguments);
	},
	
	/**
	* @deprecated
	* @alias {@link module:enyo/ObserverSupport~ObserverSupport#unobserve}
	* @public
	*/
	removeObserver: function (path, fn, ctx) {
		return removeObserver(this, path, fn);
	},
	
	/**
	* Unregisters an [observer]{@link module:enyo/ObserverSupport~ObserverSupport~Observer}. If a `ctx`
	* (context) was supplied to [observe()]{@link module:enyo/ObserverSupport~ObserverSupport#observe},
	* then it should also be supplied to this method.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#observe}
	* @param {String} path - The property or property path to unobserve.
	* @param {module:enyo/ObserverSupport~ObserverSupport~Observer} fn - The
	*	[observer]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} method that responds to changes.
	* @param {*} [ctx] - The `this` (context) under which to execute the observer.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	unobserve: function (path, fn, ctx) {
		return removeObserver(this, path, fn, ctx);
	},
	
	/**
	* Removes all [observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} from the
	* callee. If a `path` parameter is provided, observers will only be removed
	* from that path (or property).
	*
	* @param {String} [path] - A property or property path from which to remove all
	*	[observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer}.
	* @returns {this} The callee for chaining.
	*/
	removeAllObservers: function (path) {
		var euid = this.euid
			, loc = euid && observerTable[euid];
		
		if (loc) {
			if (path) {
				loc[path] = null;
			} else {
				delete observerTable[euid];
			}
		}
		
		return this;
	},
	
	/**
	* @deprecated
	* @alias module:enyo/ObserverSupport~ObserverSupport#notify
	* @public
	*/
	notifyObservers: function (path, was, is, opts) {
		return notifyObservers(this, path, was, is, opts);
	},
	
	/**
	* Triggers any [observers]{@link module:enyo/ObserverSupport~ObserverSupport~Observer} for the
	* given `path`. The previous and current values must be supplied. This
	* method is typically called automatically, but it may also be called
	* forcibly by [setting]{@link module:enyo/CoreObject~Object#set} a value with the
	* `force` option.
	*
	* @param {String} path - The property or property path to notify.
	* @param {*} was - The previous value.
	* @param {*} is - The current value.
	* @returns {this} The callee for chaining.
	*/
	notify: function (path, was, is, opts) {
		return notifyObservers(this, path, was, is, opts);
	},
	
	/**
	* Stops all [notifications]{@link module:enyo/ObserverSupport~ObserverSupport#notify} from
	* propagating. By default, all notifications will be queued and flushed once
	* [startNotifications()]{@link module:enyo/ObserverSupport~ObserverSupport#startNotifications}
	* has been called. Setting the optional `noQueue` flag will also disable the
	* queue, or you can use the
	* [disableNotificationQueue()]{@link module:enyo/ObserverSupport~ObserverSupport#disableNotificationQueue} and
	* [enableNotificationQueue()]{@link module:enyo/ObserverSupport~ObserverSupport#enableNotificationQueue}
	* API methods. `startNotifications()` will need to be called the same number
	* of times that this method has been called.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#startNotifications}
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#disableNotificationQueue}
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#enableNotificationQueue}
	* @param {Boolean} [noQueue] - If `true`, this will also disable the notification queue.
	* @returns {this} The callee for chaining.
	*/
	stopNotifications: function (noQueue) {
		this._observing = false;
		this._observeCount++;
		noQueue && this.disableNotificationQueue();
		return this;
	},
	
	/**
	* Starts [notifications]{@link module:enyo/ObserverSupport~ObserverSupport#notify} if they have
	* been [disabled]{@link module:enyo/ObserverSupport~ObserverSupport#stopNotifications}. If the
	* notification queue was not disabled, this will automatically flush the
	* queue of all notifications that were encountered while stopped. This
	* method must be called the same number of times that
	* [stopNotifications()]{@link module:enyo/ObserverSupport~ObserverSupport#stopNotifications} was
	* called.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#stopNotifications}
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#disableNotificationQueue}
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#enableNotificationQueue}
	* @param {Boolean} [queue] - If `true` and the notification queue is disabled,
	* the queue will be re-enabled.
	* @returns {this} The callee for chaining.
	*/
	startNotifications: function (queue) {
		this._observeCount && this._observeCount--;
		this._observeCount === 0 && (this._observing = true);
		queue && this.enableNotificationQueue();
		this.isObserving() && flushQueue(this);
		return this;
	},
	
	/**
	* Re-enables the notification queue, if it was disabled.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#disableNotificationQueue}
	* @returns {this} The callee for chaining.
	*/
	enableNotificationQueue: function () {
		this._notificationQueueEnabled = true;
		return this;
	},
	
	/**
	* If the notification queue is enabled (the default), it will be disabled
	* and any notifications in the queue will be removed.
	*
	* @see {@link module:enyo/ObserverSupport~ObserverSupport#enableNotificationQueue}
	* @returns {this} The callee for chaining.
	*/
	disableNotificationQueue: function () {
		this._notificationQueueEnabled = false;
		this._notificationQueue = null;
		return this;
	},
	
	/**
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			var chains, chain, path, entries, i;
			
			// if there are any observers that need to create dynamic chains
			// we look for and instance those now
			if (this._observerChains) {
				chains = this._observerChains;
				this._observerChains = {};
				for (path in chains) {
					entries = chains[path];
					for (i = 0; (chain = entries[i]); ++i) this.observe(path, chain.method);
				}
			}
			
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			var chains = this._observerChains,
				path,
				chain;
			
			sup.apply(this, arguments);

			this.removeAllObservers();
			if (chains) {
				for (path in chains) {
					chain = chains[path];
					chain.destroy();
				}
				
				this._observerChains = null;
			}
		};
	})
	
};

module.exports = ObserverSupport;

/**
* Hijack the original so we can add additional default behavior.
*
* @private
*/
var sup = kind.concatHandler;

// @NOTE: It seems like a lot of work but it really won't happen that much and the more
// we push to kind-time the better for initialization time

/** @private */
kind.concatHandler = function (ctor, props, instance) {
	
	sup.call(this, ctor, props, instance);
	
	if (props === ObserverSupport) return;

	var proto = ctor.prototype || ctor
		, observers = proto._observers? Object.create(proto._observers): null
		, incoming = props.observers
		, chains = proto._observerChains && Object.create(proto._observerChains);
		
	if (!observers) {
		if (proto.kindName) observers = {};
		else return;
	}
		
	if (incoming && !(incoming instanceof Array)) {
		(function () {
			var tmp = [], deps, name;
			// here is the slow iteration over the properties...
			for (name in props.observers) {
				// points to the dependencies of the computed method
				deps = props.observers[name];
				// create a single entry now for the method/computed with all dependencies
				tmp.push({method: name, path: deps});
			}
			incoming = tmp;
		}());
		// we need to ensure we don't modify the fixed array of a mixin or reused object
		// because it could wind up inadvertantly adding the same entry multiple times
	} else if (incoming) incoming = incoming.slice();
	
	// this scan is required to figure out what auto-observers might be present
	for (var key in props) {
		if (key.slice(-7) == "Changed") {
			incoming || (incoming = []);
			incoming.push({method: key, path: key.slice(0, -7)});
		}
	}
	
	var addObserverEntry = function (path, method) {
		var obs;
		// we have to make sure that the path isn't a chain because if it is we add it
		// to the chains instead
		if (path.indexOf(".") > -1) {
			if (!chains) chains = {};
			obs = chains[path] || (chains[path] = []);
			obs.push({method: method});
		} else {
			if (observers[path] && !observers.hasOwnProperty(path)) observers[path] = observers[path].slice();
			obs = observers[path] || (observers[path] = []);
			if (!obs.find(function (ln) { return ln.method == method; })) obs.push({method: method});
		}
	};
	
	if (incoming) {
		incoming.forEach(function (ln) {
			// first we determine if the path itself is an array of paths to observe
			if (ln.path && ln.path instanceof Array) ln.path.forEach(function (en) { addObserverEntry(en, ln.method); });
			else addObserverEntry(ln.path, ln.method);
		});
	}
	
	// we clear the key so it will not be added to the prototype
	// delete props.observers;
	// we update the properties to whatever their new values may be
	proto._observers = observers;
	proto._observerChains = chains;
};

},{'./kind':'enyo/kind','./utils':'enyo/utils','./ObserverChain':'enyo/ObserverChain'}],'enyo/CoreObject':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/CoreObject~Object} kind.
* @module enyo/CoreObject
*/

var
	kind = require('./kind'),
	logger = require('./logger'),
	utils = require('./utils');

var
	MixinSupport = require('./MixinSupport'),
	ObserverSupport = require('./ObserverSupport'),
	BindingSupport = require('./BindingSupport');

// ComputedSupport is applied to all kinds at creation time but must be require()'d somewhere to be
// included in builds. This is that somewhere.
require('./ComputedSupport');

/**
* Used by all [objects]{@link module:enyo/CoreObject~Object} and [subkinds]{@glossary subkind} when using the
* {@link module:enyo/CoreObject~Object#log}, {@link module:enyo/CoreObject~Object#warn} and {@link module:enyo/CoreObject~Object#error} methods.
*
* @private
*/
function log (method, args) {
	if (logger.shouldLog(method)) {
		try {
			throw new Error();
		} catch(err) {
			logger._log(method, [args.callee.caller.displayName + ': ']
				.concat(utils.cloneArray(args)));
			logger.log(err.stack);
		}
	}
}

/**
* {@link module:enyo/CoreObject~Object} lies at the heart of the Enyo framework's implementations of property
* publishing, computed properties (via the [ComputedSupport]{@link module:enyo/ComputedSupport}
* {@glossary mixin}), and data binding (via the {@link module:enyo/BindingSupport~BindingSupport} mixin and
* {@link module:enyo/Binding~Binding} object). It also provides several utility [functions]{@glossary Function}
* for its [subkinds]{@glossary subkind}.
*
* @class Object
* @mixes module:enyo/MixinSupport
* @mixes module:enyo/ObserverSupport
* @mixes module:enyo/BindingSupport
* @public
*/
var CoreObject = module.exports = kind(
	/** @lends module:enyo/CoreObject~Object.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Object',

	/**
	* @private
	*/
	kind: null,

	/**
	* @private
	*/


	/**
	* Will be `true` if the [destroy()]{@link module:enyo/CoreObject~Object#destroy} method has been called;
	* otherwise, `false`.
	*
	* @readonly
	* @type {Boolean}
	* @default false
	* @public
	*/
	destroyed: false,

	/**
	* @private
	*/
	mixins: [MixinSupport, ObserverSupport, BindingSupport],

	/**
	* @private
	*/
	constructor: function (props) {
		this.importProps(props);
	},

	/**
	* Imports the values from the given [object]{@glossary Object}. Automatically called
	* from the [constructor]{@link module:enyo/CoreObject~Object#constructor}.
	*
	* @param {Object} props - If provided, the [object]{@glossary Object} from which to
	*	retrieve [keys/values]{@glossary Object.keys} to mix in.
	* @returns {this} The callee for chaining.
	* @public
	*/
	importProps: function (props) {
		var key;

		if (props) {
			kind.concatHandler(this, props, true);
			// if props is a default hash this is significantly faster than
			// requiring the hasOwnProperty check every time
			if (!props.kindName) {
				for (key in props) {
					kind.concatenated.indexOf(key) === -1 && (this[key] = props[key]);
				}
			} else {
				for (key in props) {
					if (kind.concatenated.indexOf(key) === -1 && props.hasOwnProperty(key)) {
						this[key] = props[key];
					}
				}
			}
		}
		
		return this;
	},
	
	/**
	* Calls the [destroy()]{@link module:enyo/CoreObject~Object#destroy} method for the named {@link module:enyo/CoreObject~Object} 
	* property.
	*
	* @param {String} name - The name of the property to destroy, if possible.
	* @returns {this} The callee for chaining.
	* @public
	*/
	destroyObject: function (name) {
		if (this[name] && this[name].destroy) {
			this[name].destroy();
		}
		this[name] = null;
		
		return this;
	},
	
	/**
	* Sends a log message to the [console]{@glossary console}, prepended with the name
	* of the {@glossary kind} and method from which `log()` was invoked. Multiple
	* {@glossary arguments} are coerced to {@glossary String} and
	* [joined with spaces]{@glossary Array.join}.
	*
	* ```javascript
	* var kind = require('enyo/kind'),
	*     Object = require('enyo/CoreObject');
	* kind({
	*	name: 'MyObject',
	*	kind: Object,
	*	hello: function() {
	*		this.log('says', 'hi');
	*		// shows in the console: MyObject.hello: says hi
	*	}
	* });
	* ```
	* @public
	*/
	log: function () {
		var acc = arguments.callee.caller,
			nom = ((acc ? acc.displayName : '') || '(instance method)') + ':',
			args = Array.prototype.slice.call(arguments);
		args.unshift(nom);
		logger.log('log', args);
	},
	
	/**
	* Same as [log()]{@link module:enyo/CoreObject~Object#log}, except that it uses the 
	* console's [warn()]{@glossary console.warn} method (if it exists).
	*
	* @public
	*/
	warn: function () {
		log('warn', arguments);
	},
	
	/**
	* Same as [log()]{@link module:enyo/CoreObject~Object#log}, except that it uses the 
	* console's [error()]{@glossary console.error} method (if it exists).
	*
	* @public
	*/
	error: function () {
		log('error', arguments);
	},

	/**
	* Retrieves the value for the given path. The value may be retrieved as long as the given 
	* path is resolvable relative to the given {@link module:enyo/CoreObject~Object}. See
	* [getPath()]{@link module:enyo/utils#getPath} for complete details.
	*
	* This method is backwards-compatible and will automatically call any existing getter
	* method that uses the "getProperty" naming convention. (Moving forward, however, Enyo code
	* should use [computed properties]{@link module:enyo/ComputedSupport} instead of relying on the
	* getter naming convention.)
	*
	* @param {String} path - The path from which to retrieve a value.
	* @returns {*} The value for the given path or [undefined]{@glossary undefined} if 
	*	the path could not be completely resolved.
	* @public
	*/
	get: function () {
		return utils.getPath.apply(this, arguments);
	},
	
	/**
	* Updates the value for the given path. The value may be set as long as the
	* given path is resolvable relative to the given {@link module:enyo/CoreObject~Object}. See
	* [setPath()]{@link module:enyo/utils#setPath} for complete details.
	*
	* @param {String} path - The path for which to set the given value.
	* @param {*} value - The value to set.
	* @param {Object} [opts] - An options hash.
	* @returns {this} The callee for chaining.
	* @public
	*/
	set: function () {
		return utils.setPath.apply(this, arguments);
	},

	/**
	* Binds a [callback]{@glossary callback} to this [object]{@link module:enyo/CoreObject~Object}.
	* If the object has been destroyed, the bound method will be aborted cleanly,
	* with no value returned.
	*
	* This method should generally be used instead of {@link module:enyo/utils#bind} for running
	* code in the context of an instance of {@link module:enyo/CoreObject~Object} or one of its
	* [subkinds]{@glossary subkind}.
	*
	* @public
	*/
	bindSafely: function () {
		var args = Array.prototype.slice.call(arguments);
		args.unshift(this);
		return utils.bindSafely.apply(null, args);
	},
	
	/**
	* An abstract method (primarily) that sets the [destroyed]{@link module:enyo/CoreObject~Object#destroyed} 
	* property to `true`.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	destroy: function () {
		
		// Since JS objects are never truly destroyed (GC'd) until all references are
		// gone, we might have some delayed action on this object that needs access
		// to this flag.
		// Using this.set to make the property observable
		return this.set('destroyed', true);
	}
});

/**
* @private
*/
CoreObject.concat = function (ctor, props) {
	var pubs = props.published,
		cpy,
		prop;
		
	if (pubs) {
		cpy = ctor.prototype || ctor;
		for (prop in pubs) {
			// need to make sure that even though a property is 'published'
			// it does not overwrite any computed properties
			if (props[prop] && typeof props[prop] == 'function') continue;
			addGetterSetter(prop, pubs[prop], cpy);
		}
	}
};

/**
* This method creates a getter/setter for a published property of an {@link module:enyo/CoreObject~Object}, but is
* deprecated. It is maintained for purposes of backwards compatibility. The preferred method is 
* to mark public and protected (private) methods and properties using documentation or other 
* means and rely on the [get]{@link module:enyo/CoreObject~Object#get} and [set]{@link module:enyo/CoreObject~Object#set} methods of
* {@link module:enyo/CoreObject~Object} instances.
*
* @private
*/
function addGetterSetter (prop, value, proto) {
	
	// so we don't need to re-execute this over and over and over...
	var cap = utils.cap(prop),
		getName = 'get' + cap,
		setName = 'set' + cap,
		getters = proto._getters || (proto._getters = {}),
		setters = proto._setters || (proto._setters = {}),
		fn;
	
	// we assign the default value from the published block to the prototype
	// so it will be initialized properly
	proto[prop] = value;
	
	// check for a supplied getter and if there isn't one we create one otherwise
	// we mark the supplied getter in the tracking object so the global getPath will
	// know about it
	if (!(fn = proto[getName]) || typeof fn != 'function') {
		fn = proto[getName] = function () {
			return utils.getPath.fast.call(this, prop);
		};
		
		// and we mark it as generated
		fn.generated = true;
	} else if (fn && typeof fn == 'function' && !fn.generated) getters[prop] = getName;
	
	// we need to do the same thing for the setters
	if (!(fn = proto[setName]) || typeof fn != 'function') {
		fn = proto[setName] = function (val) {
			return utils.setPath.fast.call(this, prop, val);
		};
		
		// and we mark it as generated
		fn.generated = true;
	} else if (fn && typeof fn == 'function' && !fn.generated) setters[prop] = setName;
}

},{'./kind':'enyo/kind','./logger':'enyo/logger','./utils':'enyo/utils','./MixinSupport':'enyo/MixinSupport','./ObserverSupport':'enyo/ObserverSupport','./BindingSupport':'enyo/BindingSupport','./ComputedSupport':'enyo/ComputedSupport'}],'enyo/Async':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Async~Async} kind.
* @module enyo/Async
*/

var
	kind = require('./kind'),
	utils = require('./utils');

var
	CoreObject = require('./CoreObject');

/**
* An abstract [kind]{@glossary kind} designed to aid in handling asynchronous operations.
* It represents a task that has not yet completed. Callback functions may be registered to be
* notified when the task is complete.
*
* For more information, see the documentation on [Consuming Web
* Services]{@linkplain $dev-guide/building-apps/managing-data/consuming-web-services.html}
* in the Enyo Developer Guide.
*
* @class Async
* @extends module:enyo/CoreObject~Object
* @public
*/
var Async = module.exports = kind(
	/** @lends module:enyo/Async~Async.prototype */ {
	
	name: 'enyo.Async',
	
	/**
	* @private
	*/
	kind: CoreObject,
	
	/**
	* @private
	*/
	published: {
		
		/**
		* The number of milliseconds to wait after [execution]{@link module:enyo/Async~Async#go} begins
		* before failing with a timeout error. If set to `0` (the default), will not
		* automatically throw a timeout error.
		*
		* @type {Number}
		* @default 0
		* @memberof module:enyo/Aysnc~Async.prototype
		* @public
		*/
		timeout: 0
	},
	
	/**
	* Will be `true` if an error has occurred and a handler calls the
	* [fail()]{@link module:enyo/Async~Async#fail} method. Can be cleared using
	* [recover()]{@link module:enyo/Async~Async#recover}.
	*
	* @readonly
	* @type {Boolean}
	* @default false
	* @public
	*/
	failed: false,
	
	/**
	* @private
	*/
	context: null,
	
	/**
	* @method
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.responders = [];
			this.errorHandlers = [];
			this.progressHandlers = [];
		};
	}),
	
	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			if (this.timeoutJob) {
				this.clearTimeout();
			}
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	accumulate: function (array, fn, ctx) {
		var tmp;
		
		// to preserve backward compatibility we have to accept that the order of the arguments
		// might be different
		if (ctx && typeof ctx == 'function') {
			tmp = fn;
			fn = ctx;
			ctx = tmp;
		}
		
		// we go ahead and bind the method to its context to preserve the original
		// implementation
		if (ctx) {
			if (typeof ctx == "string") {
				fn = utils.bind(fn, ctx);
			} else {
				fn = fn.bind(ctx);
			}
		}
		
		// now store it for use later
		array.push(fn);
	},
	
	/**
	* Registers a [function]{@glossary Function} to be fired when
	* [execution]{@link module:enyo/Async~Async#go} is completed successfully. Parameters may be
	* in any order, to preserve backward compatibility.
	*
	* @param {Function} fn - The callback to register.
	* @param {Object} [ctx] - The optional context under which to execute the callback.
	* @returns {this} The callee for chaining.
	* @public
	*/
	response: function (fn, ctx) {
		this.accumulate(this.responders, fn, ctx);
		return this;
	},
	
	/**
	* Registers a [function]{@glossary Function} to be fired when
	* [execution]{@link module:enyo/Async~Async#go} completes with an error. Parameters may be
	* in any order, to preserve backward compatibility.
	*
	* @param {Function} fn - The callback to register.
	* @param {Object} [ctx] - The optional context under which to execute the callback.
	* @returns {this} The callee for chaining.
	* @public
	*/
	error: function (fn, ctx) {
		this.accumulate(this.errorHandlers, fn, ctx);
		return this;
	},
	
	/**
	* Registers a [function]{@glossary Function} to be fired on progress events.
	* Parameters may be in any order, to preserve backward compatibility.
	*
	* @param {Function} fn - The callback to register.
	* @param {Object} [ctx] - The optional context under which to execute the callback.
	* @returns {this} The callee for chaining.
	* @public
	*/
	progress: function (fn, ctx) {
		this.accumulate(this.progressHandlers, fn, ctx);
		return this;
	},
	
	/**
	* @private
	*/
	route: function (async, value) {
		var r = this.bindSafely('respond');
		async.response(function (sender, value) {
			r(value);
		});
		var f = this.bindSafely('fail');
		async.error(function (sender, value) {
			f(value);
		});
		async.go(value);
	},
	
	/**
	* @private
	*/
	handle: function (value, handlers) {
		var r = handlers.shift();
		if (r) {
			if (r instanceof Async) {
				this.route(r, value);
			} else {
				// handler can return a new 'value'
				var v = utils.call(this.context || this, r, [this, value]);
				// ... but only if it returns something other than undefined
				v = (v !== undefined) ? v : value;
				// next handler
				(this.failed ? this.fail : this.respond).call(this, v);
			}
		}
	},
	
	/**
	* @private
	*/
	startTimer: function () {
		this.startTime = utils.perfNow();
		if (this.timeout) {
			this.timeoutJob = setTimeout(this.bindSafely('timeoutComplete'), this.timeout);
		}
	},
	
	/**
	* @private
	*/
	endTimer: function () {
		if (this.timeoutJob) {
			this.endTime = utils.perfNow();
			clearTimeout(this.timeoutJob);
			this.timeoutJob = null;
			this.latency = this.endTime - this.startTime;
		}
	},
	
	/**
	* @private
	*/
	timeoutComplete: function () {
		this.timedout = true;
		this.fail('timeout');
	},
	
	/**
	* Triggers the handler chain for valid outcomes.
	*
	* @private
	*/
	respond: function (value) {
		this.failed = false;
		this.endTimer();
		this.handle(value, this.responders);
	},

	/**
	* Fails the [task]{@link module:enyo/Async~Async} and triggers the error chain. May be called from any
	* handler.
	* 
	* @param {*} err - The error value to pass to error handlers.
	* @returns {this} The callee for chaining.
	* @public
	*/
	fail: function (err) {
		this.failed = true;
		this.endTimer();
		this.handle(err, this.errorHandlers);
		
		return this;
	},
	
	/**
	* Clears the error condition ([failed]{@link module:enyo/Async~Async#failed}) by setting it to `false`.
	* If called while responding to handlers, it will continue.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	recover: function () {
		this.failed = false;
		return this;
	},
	
	/**
	* @private
	*/
	sendProgress: function(current, min, max, sourceEvent) {
		var event = utils.mixin({}, sourceEvent);
		event.type = 'progress';
		event.current = current;
		event.min = min;
		event.max = max;
		for (var i = 0; i < this.progressHandlers.length; i++) {
			utils.call(this.context || this, this.progressHandlers[i], [this, event]);
		}
	},
	
	/**
	* Initiates the asynchronous routine, supplying the given value if it completes
	* successfully. This method is usually overloaded in [subkinds]{@glossary subkind}.
	*
	* @virtual
	* @param {*} - value The value to pass to responders.
	* @returns {this} The callee for chaining.
	* @public
	*/
	go: function(value) {
		this.sendProgress(0, 0, 1);
		utils.asyncMethod(this, function() {
			this.sendProgress(1, 0, 1);
			this.respond(value);
		});
		return this;
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./CoreObject':'enyo/CoreObject'}],'enyo/jobs':[function (module,exports,global,require,request){
require('enyo');

var
	utils = require('./utils'),
	kind = require('./kind');
	
var CoreObject = require('./CoreObject');

/**
* The {@link module:enyo/jobs} singleton provides a mechanism for queueing tasks
* (i.e., functions) for execution in order of priority. The execution of the
* current job stack may be blocked programmatically by setting a priority
* level (run level) below which no jobs are executed.
*
* At the moment, only {@link module:enyo/Animator~Animator} uses this interface, setting a
* priority of 4, which blocks all low priority tasks from executing during
* animations. To maintain backward compatibility, jobs are assigned a priority
* of 5 by default; thus they are not blocked by animations.
*
* Normally, application code will not use `enyo/jobs` directly, but will
* instead use the [job()]{@link module:enyo/Component~Component#job} method of
* {@link module:enyo/Component~Component}.
*
* @module enyo/jobs
* @public
*/
module.exports = kind.singleton(
	/** @lends module:enyo/jobs */ {
	
	kind: CoreObject,
	
	/**
	* @private
	*/
	published: /** @lends module:enyo/jobs~jobs */ {
		
		/**
		* The current priority level.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		priorityLevel: 0
	},
	
	/**
	* Prioritized by index.
	*
	* @private
	*/
	_jobs: [ [], [], [], [], [], [], [], [], [], [] ],
	
	/**
	* @private
	*/
	_priorities: {},
	
	/**
	* @private
	*/
	_namedJobs: {},
	
	/**
	* @private
	*/
	_magicWords: {
		'low': 3,
		'normal': 5,
		'high': 7
	},
	
	/**
	* Adds a [job]{@link module:enyo/job} to the job queue. If the current priority
	* level is higher than this job's priority, this job gets deferred until the
	* job level drops; if it is lower, this job is run immediately.
	*
	* @param {Function} job - The actual {@glossary Function} to execute as the
	* [job]{@link module:enyo/job}.
	* @param {Number} priority - The priority of the job.
	* @param {String} nom - The name of the job for later reference.
	* @public
	*/
	add: function (job, priority, nom) {
		priority = priority || 5;

		// magic words: low = 3, normal = 5, high = 7
		priority = utils.isString(priority) ? this._magicWords[priority] : priority;

		// if a job of the same name exists, remove it first (replace it)
		if(nom){
			this.remove(nom);
			this._namedJobs[nom] = priority;
		}

		// if the job is of higher priority than the current priority level then
		// there's no point in queueing it
		if(priority >= this.priorityLevel){
			job();
		} else {
			this._jobs[priority - 1].push({fkt: job, name: nom});
		}
	},
	
	/**
	* Will remove the named [job]{@link module:enyo/job} from the queue.
	*
	* @param {String} nom - The name of the [job]{@link module:enyo/job} to remove.
	* @returns {Array} An {@glossary Array} that will contain the removed job if
	* it was found, or empty if it was not found.
	* @public
	*/
	remove: function (nom) {
		var jobs = this._jobs[this._namedJobs[nom] - 1];
		if(jobs){
			for(var j = jobs.length-1; j >= 0; j--){
				if(jobs[j].name === nom){
					return jobs.splice(j, 1);
				}
			}
		}
	},
	
	/**
	* Adds a new priority level at which jobs will be executed. If it is higher than the
	* highest current priority, the priority level rises. Newly added jobs below that priority
	* level are deferred until the priority is removed (i.e., unregistered).
	*
	* @param {Number} priority - The priority value to register.
	* @param {String} id - The name of the priority.
	* @public
	*/
	registerPriority: function(priority, id) {
		this._priorities[id] = priority;
		this.setPriorityLevel( Math.max(priority, this.priorityLevel) );
	},
	
	/**
	* Removes a priority level. If the removed priority was previously the
	* highest priority, the priority level drops to the next highest priority
	* and queued jobs with a higher priority are executed.
	*
	* @param {String} id - The name of the priority level to remove.
	* @public
	*/
	unregisterPriority: function (id) {
		var highestPriority = 0;

		// remove priority
		delete this._priorities[id];

		// find new highest current priority
		for( var i in this._priorities ){
			highestPriority = Math.max(highestPriority, this._priorities[i]);
		}

		this.setPriorityLevel( highestPriority );
	},
	
	/**
	* Tries to run next job if priority level has dropped.
	*
	* @type {module:enyo/ObserverSupport~ObserverSupport~Observer}
	* @private
	*/
	priorityLevelChanged: function (was) {
		if(was > this.priorityLevel){
			this._doJob();
		}
	},
	
	/**
	* Finds and executes the job of highest priority; in this way, all jobs with priority
	* greater than or equal to the current level are run, in order of their priority (highest
	* to lowest).
	*
	* @private
	*/
	_doJob: function () {
		var job;
		// find the job of highest priority above the current priority level
		// and remove from the job list
		for (var i = 9; i >= this.priorityLevel; i--){
			if (this._jobs[i].length) {
				job = this._jobs[i].shift();
				break;
			}
		}

		// allow other events to pass through
		if (job) {
			job.fkt();
			delete this._namedJobs[job.name];
			setTimeout(utils.bind(this, '_doJob'), 10);
		}
	}
});

},{'./utils':'enyo/utils','./kind':'enyo/kind','./CoreObject':'enyo/CoreObject'}],'enyo/Ajax':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Ajax~Ajax} kind.
* @module enyo/Ajax
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	json = require('./json'),
	logger = require('./logger');

var
	AjaxProperties = require('./AjaxProperties'),
	Async = require('./Async'),
	/*jshint -W079*/
	// this defaults to providing the native FormData if it exists
	FormData = require('./FormData'),
	/*jshint +W079*/
	Xhr = require('./xhr');
	

/**
* A cache of response properties set on the {@link module:enyo/Ajax~Ajax} instance once it has completed
* its request.
*
* @typedef {Object} module:enyo/Ajax~Ajax~xhrResponseType
* @property {Number} status - The response status.
* @property {Object} headers - The headers used for the request.
* @property {String} body - The request body.
* @public
*/

/**
* A [kind]{@glossary kind} designed to expose the native
* [XMLHttpRequest]{@glossary XMLHttpRequest} API. Available configuration options
* are exposed by [enyo/AjaxProperties]{@link module:enyo/AjaxProperties}.
*
* This kind does not extend {@link module:enyo/Component~Component} and cannot be used
* in the [components block]{@link module:enyo/Component~Component#components}.
*
* For more information, see the documentation on [Consuming Web
* Services]{@linkplain $dev-guide/building-apps/managing-data/consuming-web-services.html}
* in the Enyo Developer Guide.
*
* @class Ajax
* @extends module:enyo/Async~Async
* @public
*/
var Ajax = module.exports = kind(
	/** @lends module:enyo/Ajax~Ajax.prototype */ {
	
	name: 'enyo.Ajax',
	
	/**
	* @private
	*/
	kind: Async,
	
	/**
	* @private
	*/
	published: AjaxProperties,
	
	/**
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function (inParams) {
			utils.mixin(this, inParams);
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			// explicilty release any XHR refs
			this.xhr = null;
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* This will be set once a request has completed (successfully or unsuccessfully).
	* It is a cache of the response values.
	*
	* @type module:enyo/Ajax~Ajax~xhrResponseType
	* @default null
	* @public
	*/
	xhrResponse: null,
	
	/**
	* Executes the request with the given options. The parameter may be a
	* [hash]{@glossary Object} of properties or a [string]{@glossary String}. Both
	* represent the query string, with the hash being serialized and the string
	* being used directly.
	*
	* ```javascript
	* var query = {q: 'searchTerm'}; // -> "?q=searchTerm"
	* ```
	*
	* To provide a `POST` body, see {@link module:enyo/AjaxProperties#postBody}.
	*
	* When the request is completed, it will set the
	* [xhrResponse]{@link module:enyo/Ajax~Ajax#xhrResponse} property.
	*
	* @see module:enyo/AjaxProperties
	* @see module:enyo/Ajax~Ajax~xhrResponse
	* @param {(Object|String)} [params] - A [string]{@glossary String} or
	*	[hash]{@glossary Object} to be used as the query string.
	* @returns {this} The callee for chaining.
	* @public
	*/
	go: function (params) {
		this.failed = false;
		this.startTimer();
		this.request(params);
		return this;
	},
	
	/**
	* @private
	*/
	request: function (params) {
		var parts = this.url.split('?');
		var uri = parts.shift() || '';
		var args = parts.length ? (parts.join('?').split('&')) : [];
		//
		var query = null;
		//
		if(utils.isString(params)){
			//If params parameter is a string, use it as request body
			query = params;
		}
		else{
			//If params parameter is not a string, build a query from it
			if(params){
				query = Ajax.objectToQuery(params);
			}
		}
		//
		if (query) {
			args.push(query);
			query = null;
		}
		if (this.cacheBust) {
			args.push(Math.random());
		}
		//
		var url = args.length ? [uri, args.join('&')].join('?') : uri;
		//
		var xhr_headers = {};
		var body;
		if (this.method != 'GET') {
			body = this.postBody;
			if (this.method === 'POST' && body instanceof FormData) {
				if (body.fake) {
					xhr_headers['Content-Type'] = body.getContentType();
					body = body.toString();
				} else {
					// Nothing to do as the
					// content-type will be
					// automagically set according
					// to the FormData
				}
			} else {
				xhr_headers['Content-Type'] = this.contentType;
				if (body instanceof Object) {
					if (this.contentType.match(/^application\/json(;.*)?$/) !== null) {
						body = JSON.stringify(body);
					} else if (this.contentType === 'application/x-www-form-urlencoded') {
						body = Ajax.objectToQuery(body);
					}
					else {
						body = body.toString();
					}
				}
			}
		}
		utils.mixin(xhr_headers, this.headers);
		// don't pass in headers structure if there are no headers defined as this messes
		// up CORS code for IE9
		if (utils.keys(xhr_headers).length === 0) {
			xhr_headers = undefined;
		}
		//
		try {
			this.xhr = Xhr.request({
				url: url,
				method: this.method,
				callback: this.bindSafely('receive'),
				body: body,
				headers: xhr_headers,
				sync: this.sync,
				username: this.username,
				password: this.password,
				xhrFields: utils.mixin({onprogress: this.bindSafely(this.updateProgress)}, this.xhrFields),
				mimeType: this.mimeType
			});
		}
		catch (e) {
			// IE can throw errors here if the XHR would fail CORS checks,
			// so catch and turn into a failure.
			this.fail(e);
		}
	},
	
	/**
	* @private
	*/
	receive: function (inText, inXhr) {
		if (!this.failed && !this.destroyed) {
			var body;
			if (inXhr.responseType === 'arraybuffer') {
				body = inXhr.response;
			} else if (typeof inXhr.responseText === 'string') {
				body = inXhr.responseText;
			} else {
				// IE carrying a binary
				body = inXhr.responseBody;
			}
			this.xhrResponse = {
				status: inXhr.status,
				headers: Ajax.parseResponseHeaders(inXhr),
				body: body
			};
			if (this.isFailure(inXhr)) {
				this.fail(inXhr.status);
			} else {
				this.respond(this.xhrToResponse(inXhr));
			}
		}
	},
	
	/**
	* @private
	*/
	fail: kind.inherit(function (sup) {
		return function (inError) {
			// on failure, explicitly cancel the XHR to prevent
			// further responses.  cancellation also resets the
			// response headers & body,
			if (this.xhr) {
				Xhr.cancel(this.xhr);
				this.xhr = null;
			}
			sup.apply(this, arguments);
		};
	}),
	
	/**
	* @private
	*/
	xhrToResponse: function (inXhr) {
		if (inXhr) {
			return this[(this.handleAs || 'text') + 'Handler'](inXhr);
		}
	},
	
	/**
	* @private
	*/
	isFailure: function (inXhr) {
		// if any exceptions are thrown while checking fields in the xhr,
		// assume a failure.
		try {
			if (inXhr.responseType === 'arraybuffer') {
				// if we are loading binary data, don't try to access inXhr.responseText
				// because that throws an exception on webkit. Instead, just look for
				// the response.
				if (inXhr.status === 0 && !inXhr.response) {
					return true;
				}
			} else {
				var text = '';
				// work around IE9 bug where accessing responseText will thrown error
				// for binary requests.
				if (typeof inXhr.responseText === 'string') {
					text = inXhr.responseText;
				}
				// Follow same failure policy as jQuery's Ajax code
				// CORS failures on FireFox will have status 0 and no responseText,
				// so treat that as failure.
				if (inXhr.status === 0 && text === '') {
					return true;
				}
			}
			// Otherwise, status 0 may be good for local file access.  We treat the range
			// 1-199 and 300+ as failure (only 200-series code are OK).
			return (inXhr.status !== 0) && (inXhr.status < 200 || inXhr.status >= 300);
		}
		catch (e) {
			return true;
		}
	},
	
	/**
	* @private
	*/
	xmlHandler: function (inXhr) {
		return inXhr.responseXML;
	},
	
	/**
	* @private
	*/
	textHandler: function (inXhr) {
		return inXhr.responseText;
	},
	
	/**
	* @private
	*/
	jsonHandler: function (inXhr) {
		var r = inXhr.responseText;
		try {
			return r && json.parse(r);
		} catch (x) {
			logger.warn('Ajax request set to handleAs JSON but data was not in JSON format');
			return r;
		}
	},
	
	/**
	* @private
	*/
	binaryHandler: function (inXhr) {
		return inXhr.response;
	}, 
	
	/**
	* @private
	*/
	updateProgress: function (event) {
		// filter out 'input' as it causes exceptions on some Firefox versions
		// due to unimplemented internal APIs
		var ev = {};
		for (var k in event) {
			if (k !== 'input') {
				ev[k] = event[k];
			}
		}
		this.sendProgress(event.loaded, 0, event.total, ev);
	},
	
	/**
	* @private
	*/
	statics: /** @lends module:enyo/Ajax~Ajax */ {
		/**
		* Takes an object and converts it to an encoded URI string. NOTE: It does not traverse into
		* objects or arrays, so nested objects will be rendered as the string 'object Object', which
		* is not terribly useful.
		* @public
		*/
		objectToQuery: function (/*Object*/ map) {
			var enc = encodeURIComponent;
			var pairs = [];
			var backstop = {};
			for (var name in map){
				var value = map[name];
				if (value != backstop[name]) {
					var assign = enc(name) + '=';
					if (utils.isArray(value)) {
						for (var i=0; i < value.length; i++) {
							pairs.push(assign + enc(value[i]));
						}
					} else {
						pairs.push(assign + enc(value));
					}
				}
			}
			return pairs.join('&');
		}
	},
	
	/**
	* @private
	*/
	protectedStatics: {
		parseResponseHeaders: function (xhr) {
			var headers = {};
			var headersStr = [];
			if (xhr.getAllResponseHeaders) {
				headersStr = xhr.getAllResponseHeaders().split(/\r?\n/);
			}
			for (var i = 0; i < headersStr.length; i++) {
				var headerStr = headersStr[i];
				var index = headerStr.indexOf(': ');
				if (index > 0) {
					var key = headerStr.substring(0, index).toLowerCase();
					var val = headerStr.substring(index + 2);
					headers[key] = val;
				}
			}
			return headers;
		}
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./json':'enyo/json','./logger':'enyo/logger','./AjaxProperties':'enyo/AjaxProperties','./Async':'enyo/Async','./FormData':'enyo/FormData','./xhr':'enyo/xhr'}],'enyo/Component':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Component~Component} kind.
* @module enyo/Component
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	logger = require('./logger');

var
	CoreObject = require('./CoreObject'),
	ApplicationSupport = require('./ApplicationSupport'),
	ComponentBindingSupport = require('./ComponentBindingSupport'),
	Jobs = require('./jobs');

var
	kindPrefix = {},
	unnamedCounter = 0;
	
/**
* @callback module:enyo/Component~Component~EventHandler
* @param {module:enyo/Component~Component} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @param {Object} event - An [object]{@glossary Object} containing
*	event information.
* @returns {Boolean} A value indicating whether the event has been
*	handled or not. If `true`, then bubbling is stopped.
*/

/**
* A [hash]{@glossary Object} of references to all the [components]{@link module:enyo/Component~Component}
* owned by this component. This property is updated whenever a new
* component is added; the new component may be accessed via its
* [name]{@link module:enyo/Component~Component#name} property. We may also observe changes on
* properties of components referenced by the `$` property.
*
* Component access via the `$` hash:
* ```javascript
* var Component = require('enyo/Component');
* var c = new Component({
*	name: 'me',
*	components: [
*		{kind: Component, name: 'other'}
*	]
* });
*
* // We can now access 'other' on the $ hash of 'c', via c.$.other
* ```
*
* Observing changes on a component referenced by the `$` property:
* ```javascript
* var c = new Component({
*	name: 'me',
*	components: [
*		{kind: Component, name: 'other'}
*	]
* });
*
* c.addObserver('$.other.active', function() {
*	// do something to respond to the "active" property of "other" changing
* })
*
* c.$.other.set('active', true); // this will trigger the observer to run its callback
* ```
*
* @name $
* @type {Object}
* @default null
* @memberof module:enyo/Component~Component.prototype
* @readonly
* @public
*/

/**
* If `true`, this [component's]{@link module:enyo/Component~Component} [owner]{@link module:enyo/Component~Component#owner} will
* have a direct name reference to the owned component.
*
* @example
* var Component = require('enyo/Component');
* var c = new Component({
*	name: 'me',
*	components: [
*		{kind: Component, name: 'other', publish: true}
*	]
* });
*
* // We can now access 'other' directly, via c.other
*
* @name publish
* @type {Boolean}
* @default undefined
* @memberOf module:enyo/Component~Component.prototype
* @public
*/

/**
* If `true`, the [layout]{@glossary layout} strategy will adjust the size of this
* [component]{@link module:enyo/Component~Component} to occupy the remaining available space.
*
* @name fit
* @type {Boolean}
* @default undefined
* @memberOf module:enyo/Component~Component.prototype
* @public
*/

/**
* {@link module:enyo/Component~Component} is the fundamental building block for Enyo applications.
* Components are designed to fit together, allowing complex behaviors to
* be fashioned from smaller bits of functionality.
*
* Component [constructors]{@glossary constructor} take a single
* argument (sometimes called a [component configuration]{@glossary configurationBlock}),
* a JavaScript [object]{@glossary Object} that defines various properties to be initialized on the
* component.  For example:
*
* ```javascript
* // create a new component, initialize its name property to 'me'
* var Component = require('enyo/Component');
* var c = new Component({
*	name: 'me'
* });
* ```
*
* When a component is instantiated, items configured in its
* `components` property are instantiated, too:
*
* ```javascript
* // create a new component, which itself has a component
* var c = new Component({
*	name: 'me',
*	components: [
*		{kind: Component, name: 'other'}
*	]
* });
* ```
*
* In this case, when `me` is created, `other` is also created, and we say that `me` owns `other`.
* In other words, the [owner]{@link module:enyo/Component~Component#owner} property of `other` equals `me`.
* Notice that you can specify the [kind]{@glossary kind} of `other` explicitly in its
* configuration block, to tell `me` what constructor to use to create `other`.
*
* To move a component, use the `setOwner()` method to change the
* component's owner. If you want a component to be unowned, use `setOwner(null)`.
*
* If you make changes to `Component`, be sure to add or update the appropriate
* {@linkplain https://github.com/enyojs/enyo/tree/master/tools/test/core/tests unit tests}.
*
* For more information, see the documentation on
* [Components]{@linkplain $dev-guide/key-concepts/components.html} in the
* Enyo Developer Guide.
*
* @class Component
* @extends module:enyo/CoreObject~Object
* @mixes module:enyo/ApplicationSupport~ApplicationSupport
* @mixes module:enyo/ComponentBindingSupport~ComponentBindingSupport
* @public
*/
var Component = module.exports = kind(
	/** @lends module:enyo/Component~Component.prototype */ {

	name: 'enyo.Component',

	/**
	* @private
	*/
	kind: CoreObject,

	/**
	* @private
	*/


	/**
	* @private
	*/
	cachedBubble: true,

	/**
	* @private
	*/
	cachePoint: false,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Component~Component.prototype */ {

		/**
		* A unique name for the [component]{@link module:enyo/Component~Component} within its
		* [owner]{@link module:enyo/Component~Component#owner}. This is used to set the access name in the
		* owner's [$ hash]{@link module:enyo/Component~Component#$}. If not
		* specified, a default name will be provided based on the name of the
		* [object's]{@link module:enyo/CoreObject~Object} [kind]{@glossary kind}, with a numeric
		* suffix appended if more than one instance exists in the owner.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		name: '',

		/**
		* A unique id for the [component]{@link module:enyo/Component~Component}, usually automatically generated
		* based on its position within the component hierarchy, although
		* it may also be directly specified. {@link module:enyo/Control~Control} uses this `id` value for the
		* DOM [id]{@link module:enyo/Control~Control#id} attribute.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		id: '',

		/**
		* The [component]{@link module:enyo/Component~Component} that owns this component.
		* It is usually defined implicitly at creation time based on the
		* [createComponent()]{@link module:enyo/Component~Component#createComponent} call or
		* the `components` hash.
		*
		* @type {module:enyo/Component~Component}
		* @default null
		* @public
		*/
		owner: null,

		/**
		* This can be a [hash]{@glossary Object} of features to apply to
		* [chrome]{@glossary chrome} [components]{@link module:enyo/Component~Component} of the base
		* [kind]{@glossary kind}. They are matched by [name]{@link module:enyo/Component~Component#name}
		* (if the component you wish to modify does not have a name, this will not work).
		* You can modify any properties of the component except for methods. Setting a
		* value for `componentOverrides` at runtime will have no effect.
		*
		* @type {Object}
		* @default null
		* @public
		*/
		componentOverrides: null
	},

	/**
	* @private
	*/
	handlers: {},

	/**
	* @private
	*/
	mixins: [ApplicationSupport, ComponentBindingSupport],

	/**
	* @private
	*/
	toString: function () {
		return this.id + ' [' + this.kindName + ']';
	},

	/**
	* @method
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function (props) {
			// initialize instance objects
			this._componentNameMap = {};
			this.$ = {};
			this.cachedBubbleTarget = {};
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	constructed: kind.inherit(function (sup) {
		return function (props) {
			// perform initialization
			this.create(props);
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	create: function () {
		// stop and queue all of the notifications happening synchronously to allow
		// responders to only do single passes on work traversing the tree
		this.stopNotifications();
		this.ownerChanged();
		this.initComponents();
		// release the kraken!
		this.startNotifications();
	},

	/**
	* @private
	*/
	initComponents: function () {
		// The _components_ property in kind declarations is renamed to
		// _kindComponents_ by the Component subclass mechanism.  This makes it
		// easy for the developer to distinguish kindComponents from the components
		// in _this.components_, without having to worry about the actual difference.
		//
		// Specifically, the difference is that kindComponents are constructed as
		// owned by this control (whereas components in _this.components_ are not).
		// In addition, kindComponents are marked with the _isChrome: true_ flag.
		this.createChrome(this.kindComponents);
		this.createClientComponents(this.components);
	},

	/**
	* @private
	*/
	createChrome: function (comps) {
		this.createComponents(comps, {isChrome: true});
	},

	/**
	* @private
	*/
	createClientComponents: function (comps) {
		this.createComponents(comps, {owner: this.getInstanceOwner()});
	},

	/**
	* @private
	*/
	getInstanceOwner: function () {
		return (!this.owner || this.owner.notInstanceOwner) ? this : this.owner;
	},

	/**
	* Removes this [component]{@link module:enyo/Component~Component} from its
	* [owner]{@link module:enyo/Component~Component#owner} (setting `owner` to `null`)
	* and does any necessary cleanup. The component is flagged with
	* `destroyed: true`. Usually, the component will be suitable for garbage
	* collection after being destroyed, unless user code keeps a reference
	* to it.
	*
	* @returns {this} The callee for chaining.
	* @method
	* @public
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			this.destroyComponents();
			this.setOwner(null);
			sup.apply(this, arguments);
			this.stopAllJobs();
			return this;
		};
	}),

	/**
	* Destroys all owned [components]{@link module:enyo/Component~Component}.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	destroyComponents: function () {
		var comps = this.getComponents(),
			comp,
			i;

		for (i = 0; i < comps.length; ++i) {
			comp = comps[i];
			// @todo: previous comment said list might be stale and ownership may have caused
			// components to be destroyed as a result of some inner-container...look into this
			// because that seems incorrect or avoidable
			if (!comp.destroyed) comp.destroy();
		}

		return this;
	},

	/**
	* @private
	*/
	makeId: function() {
		var delim = '_', pre = this.owner && this.owner.getId(),
			baseName = this.name || ('@@' + (++unnamedCounter));
		return (pre ? pre + delim : '') + baseName;
	},

	/**
	* @private
	*/
	ownerChanged: function (was) {
		if (was && was.removeComponent) was.removeComponent(this);
		if (this.owner && this.owner.addComponent) this.owner.addComponent(this);
		if (!this.id) this.id = this.makeId();
	},

	/**
	* @private
	*/
	nameComponent: function (comp) {
		var pre = prefixFromKindName(comp.kindName),
			last = this._componentNameMap[pre] || 0,
			nom;

		do {
			nom = pre + (++last > 1 ? String(last) : '');
		} while (this.$[nom]);

		this._componentNameMap[pre] = Number(last);
		/*jshint -W093 */
		return (comp.name = nom);
	},

	/**
	* Adds a [component]{@link module:enyo/Component~Component} to the list of components
	* owned by the current component (i.e., [this.$]{@link module:enyo/Component~Component#$}).
	*
	* @param {module:enyo/Component~Component} comp - The [component]{@link module:enyo/Component~Component} to add.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addComponent: function (comp) {
		var nom = comp.get('name');

		// if there is no name we have to come up with a generic name
		if (!nom) nom = this.nameComponent(comp);

		// if there already was a component by that name we issue a warning
		// @todo: if we're going to name rules being violated we need to normalize this approach
		// and ensure we have one for every warning/error we throw
		if (this.$[nom]) this.warn(
			'Duplicate component name ' + nom + ' in owner ' + this.id + ' violates ' +
			'unique-name-under-owner rule, replacing existing component in the hash and ' +
			'continuing, but this is an error condition and should be fixed.'
		);

		this.$[nom] = comp;
		this.notify('$.' + nom, null, comp);

		// if the component has the `publish` true property then we also create a reference to
		// it directly on the owner (this)
		if (comp.publish) {
			this[nom] = comp;

			// and to ensure that bindings are aware we have to notify them as well
			this.notify(nom, null, comp);
		}

		return this;
	},

	/**
	* Removes the passed-in [component]{@link module:enyo/Component~Component} from those known
	* to be owned by this component. The component will be removed from the
	* [$ hash]{@link module:enyo/Component~Component#$}, and from the [owner]{@link module:enyo/Component~Component#owner}
	* directly if [publish]{@link module:enyo/Component~Component#publish} is set to `true`.
	*
	* @param {module:enyo/Component~Component} comp - The component to remove.
	* @returns {this} The callee for chaining.
	* @public
	*/
	removeComponent: function (comp) {
		var nom = comp.get('name');

		// remove it from the hash if it existed
		delete this.$[nom];

		// if it was published remove it from the component proper
		if (comp.publish) delete this[nom];

		return this;
	},

	/**
	* Returns an [array]{@glossary Array} of owned [components]{@link module:enyo/Component~Component}; in
	* other words, converts the [$ hash]{@link module:enyo/Component~Component#$} into an array
	* and returns the array.
	*
	* @returns {module:enyo/Component~Component[]} The [components]{@link module:enyo/Component~Component} found in the
	*	[$ hash]{@link module:enyo/Component~Component#$}.
	* @public
	*/
	getComponents: function () {
		return utils.values(this.$);
	},

	/**
	* @private
	*/
	adjustComponentProps: function (props) {
		if (this.defaultProps) utils.mixin(props, this.defaultProps, {ignore: true});
		props.kind = props.kind || props.isa || this.defaultKind;
		props.owner = props.owner || this;
	},

	/**
	* @private
	*/
	_createComponent: function (props, ext) {
		var def = ext ? utils.mixin({}, [ext, props]) : utils.clone(props);

		// always adjust the properties according to the needs of the kind and parent kinds
		this.adjustComponentProps(def);

		// pass along for the final stage
		return Component.create(def);
	},

	/**
	* Creates and returns a [component]{@link module:enyo/Component~Component} as defined by the combination of
	* a base and an additional property [hash]{@glossary Object}. The properties provided
	* in the standard property hash override those provided in the
	* additional property hash.
	*
	* The created component passes through initialization machinery
	* provided by the creating component, which may supply special
	* handling. Unless the [owner]{@link module:enyo/Component~Component#owner} is explicitly specified, the new
	* component will be owned by the instance on which this method is called.
	*
	* @example
	* // Create a new component named 'dynamic', owned by 'this'
	* // (will be available as this.$.dynamic).
	* this.createComponent({name: 'dynamic'});
	*
	* @example
	* // Create a new component named 'another' owned by 'other'
	* // (will be available as other.$.another).
	* this.createComponent({name: 'another'}, {owner: other});
	*
	* @param {Object} props - The declarative [kind]{@glossary kind} definition.
	* @param {Object} ext - Additional properties to be applied (defaults).
	* @returns {module:enyo/Component~Component} The instance created with the given parameters.
	* @public
	*/
	createComponent: function (props, ext) {
		// createComponent and createComponents both delegate to the protected method
		// (_createComponent), allowing overrides to customize createComponent and
		// createComponents separately.
		return this._createComponent(props, ext);
	},

	/**
	* Creates [components]{@link module:enyo/Component~Component} as defined by the [arrays]{@glossary Array}
	* of base and additional property [hashes]{@glossary Object}. The standard and
	* additional property hashes are combined as described in
	* [createComponent()]{@link module:enyo/Component~Component#createComponent}.
	*
	* @example
	* // ask foo to create components 'bar' and 'zot', but set the owner of
	* // both components to 'this'.
	* this.$.foo.createComponents([
	*	{name: 'bar'},
	*	{name: 'zot'}
	* ], {owner: this});
	*
	* @param {Object[]} props The array of {@link module:enyo/Component~Component} definitions to be created.
	* @param {Object} ext - Additional properties to be supplied as defaults for each.
	* @returns {module:enyo/Component~Component[]} The array of [components]{@link module:enyo/Component~Component} that were
	*	created.
	* @public
	*/
	createComponents: function (props, ext) {
		var comps = [],
			comp,
			i;

		if (props) {
			for (i = 0; i < props.length; ++i) {
				comp = props[i];
				comps.push(this._createComponent(comp, ext));
			}
		}

		return comps;
	},

	/**
	* @private
	*/
	getBubbleTarget: function (nom, event) {
		if (event.delegate) return this.owner;
		else {
			return (
				this.bubbleTarget
				|| (this.cachedBubble && this.cachedBubbleTarget[nom])
				|| this.owner
			);
		}
	},

	/**
	* Bubbles an {@glossary event} up an [object]{@glossary Object} chain,
	* starting with `this`.
	*
	* A handler for an event may be specified. See {@link module:enyo/Component~Component~EventHandler}
	* for complete details.
	*
	* @param {String} nom - The name of the {@glossary event} to bubble.
	* @param {Object} [event] - The event [object]{@glossary Object} to be passed along
	* while bubbling.
	* @param {module:enyo/Component~Component} [sender=this] - The {@link module:enyo/Component~Component} responsible for
	*	bubbling the event.
	* @returns {Boolean} `false` if unhandled or uninterrupted; otherwise, `true`.
	* @public
	*/
	bubble: function (nom, event, sender) {
		if (!this._silenced) {
			event = event || {};
			event.lastHandledComponent = null;
			event.bubbling = true;
			// deliberately done this way
			if (event.originator == null) event.originator = sender || this;
			return this.dispatchBubble(nom, event, sender || this);
		}
		return false;
	},

	/**
	* Bubbles an {@glossary event} up an [object]{@glossary Object} chain,
	* starting **above** `this`.
	*
	* A handler for an event may be specified. See {@link module:enyo/Component~Component~EventHandler}
	* for complete details.
	*
	* @param {String} nom - The name of the {@glossary event}.
	* @param {Object} [event] - The event properties to pass along while bubbling.
	* @returns {Boolean} `false` if unhandled or uninterrupted; otherwise, `true`.
	* @public
	*/
	bubbleUp: function (nom, event) {
		var next;

		if (!this._silenced) {
			event = event || {};
			event.bubbling = true;
			next = this.getBubbleTarget(nom, event);
			if (next) {
				// use delegate as sender if it exists to preserve illusion
				// that event is dispatched directly from that, but we still
				// have to bubble to get decorations
				return next.dispatchBubble(nom, event, event.delegate || this);
			}
		}
		return false;
	},

	/**
	* Sends an {@glossary event} to a named [delegate]{@glossary delegate}.
	* This [object]{@glossary Object} may dispatch an event to
	* itself via a [handler]{@link module:enyo/Component~Component~EventHandler}, or to its
	* [owner]{@link module:enyo/Component~Component#owner} via an event property, e.g.:
	*
	*	handlers {
	*		// 'tap' events dispatched to this.tapHandler
	*		ontap: 'tapHandler'
	*	}
	*
	*	// 'tap' events dispatched to 'tapHandler' delegate in this.owner
	*	ontap: 'tapHandler'
	*
	* @private
	*/
	dispatchEvent: function (nom, event, sender) {
		var delegate,
			ret;

		if (!this._silenced) {
			// if the event has a delegate associated with it we grab that
			// for reference
			// NOTE: This is unfortunate but we can't use a pooled object here because
			// we don't know where to release it
			delegate = (event || (event = {})).delegate;

			// bottleneck event decoration w/ optimization to avoid call to empty function
			if (this.decorateEvent !== Component.prototype.decorateEvent) {
				this.decorateEvent(nom, event, sender);
			}

			// first, handle any delegated events intended for this object
			if (delegate && delegate.owner === this) {
				// the most likely case is that we have a method to handle this
				if (this[nom] && 'function' === typeof this[nom]) {
					return this.dispatch(nom, event, sender);
				}
				// but if we don't, just stop the event from going further
				return false;
			}

			// for non-delgated events, try the handlers block if possible
			if (!delegate) {
				var bHandler = this.handlers && this.handlers[nom];
				var bDelegatedFunction = this[nom] && utils.isString(this[nom]);
				var cachePoint = this.cachePoint || bHandler || bDelegatedFunction || this.id === "master" ;

				if (event.bubbling) {
					if (event.lastHandledComponent && cachePoint) {
						event.lastHandledComponent.cachedBubbleTarget[nom] = this;
						event.lastHandledComponent = null;
					}
					if (!event.lastHandledComponent && this.id !== "master") {
						event.lastHandledComponent = this;
					}
				}
				if (bHandler && this.dispatch(bHandler, event, sender)) {
					return true;
				}
				if (bDelegatedFunction) {
					// we dispatch it up as a special delegate event with the
					// component that had the delegation string property stored in
					// the 'delegate' property
					event.delegate = this;
					ret = this.bubbleUp(this[nom], event, sender);
					delete event.delegate;
					return ret;
				}
			}
		}
		return false;
	},

	/**
	* Internal - try dispatching {@glossary event} to self; if that fails,
	* [bubble it up]{@link module:enyo/Component~Component#bubbleUp} the tree.
	*
	* @private
	*/
	dispatchBubble: function (nom, event, sender) {
		if (!this._silenced) {
			// Try to dispatch from here, stop bubbling on truthy return value
			if (this.dispatchEvent(nom, event, sender)) {
				return true;
			}
			// Bubble to next target
			return this.bubbleUp(nom, event, sender);
		}
		return false;
	},

	/**
	* @private
	*/
	decorateEvent: function (nom, event, sender) {
		// an event may float by us as part of a dispatchEvent chain
		// both call this method so intermediaries can decorate inEvent
	},

	/**
	* @private
	*/
	stopAllJobs: function () {
		var job;

		if (this.__jobs) for (job in this.__jobs) this.stopJob(job);
	},

	/**
	* Dispatches the {@glossary event} to named [delegate]{@glossary delegate} `nom`,
	* if it exists. [Subkinds]{@glossary subkind} may re-route dispatches. Note that
	* both 'handlers' events and events delegated from owned controls arrive here.
	* If you need to handle these types of events differently, you may also need to
	* override [dispatchEvent()]{@link module:enyo/Component~Component#dispatchEvent}.
	*
	* @param {String} nom - The method name to dispatch the {@glossary event}.
	* @param {Object} [event] - The event [object]{@glossary Object} to pass along.
	* @param {module:enyo/Component~Component} [sender=this] - The originator of the event.
	* @public
	*/
	dispatch: function (nom, event, sender) {
		var fn;

		if (!this._silenced) {
			fn = nom && this[nom];
			if (fn && typeof fn == 'function') {
				// @todo: deprecate sender
				return fn.call(this, sender || this, event);
			}
		}
		return false;
	},

	/**
	* Triggers the [handler]{@link module:enyo/Component~Component~EventHandler} for a given
	* {@glossary event} type.
	*
	* @example
	* myControl.triggerHandler('ontap');
	*
	* @param {String} nom - The name of the {@glossary event} to trigger.
	* @param {Object} [event] - The event object to pass along.
	* @param {module:enyo/Component~Component} [sender=this] - The originator of the event.
	* @returns {Boolean} `false` if unhandled or uninterrupted, `true` otherwise.
	* @public
	*/
	triggerHandler: function () {
		return this.dispatchEvent.apply(this, arguments);
	},

	/**
	* Sends a message to myself and all of my [components]{@link module:enyo/Component~Component}.
	* You can stop a waterfall into components owned by a receiving object
	* by returning a truthy value from the {@glossary event}
	* [handler]{@link module:enyo/Component~Component~EventHandler}.
	*
	* @param {String} nom - The name of the {@glossary event} to waterfall.
	* @param {Object} [event] - The event [object]{@glossary Object} to pass along.
	* @param {module:enyo/Component~Component} [sender=this] - The originator of the event.
	* @returns {this} The callee for chaining.
	* @public
	*/
	waterfall: function(nom, event, sender) {
		if (!this._silenced) {
			event = event || {};
			event.bubbling = false;

			// give the locals an opportunity to interrupt the event
			if (this.dispatchEvent(nom, event, sender)) return true;

			// otherwise carry on
			this.waterfallDown(nom, event, sender || this);
		}

		return this;
	},

	/**
	* Sends a message to all of my [components]{@link module:enyo/Component~Component}, but not myself. You can
	* stop a [waterfall]{@link module:enyo/Component~Component#waterfall} into [components]{@link module:enyo/Component~Component}
	* owned by a receiving [object]{@glossary Object} by returning a truthy value from the
	* {@glossary event} [handler]{@link module:enyo/Component~Component~EventHandler}.
	*
	* @param {String} nom - The name of the {@glossary event}.
	* @param {Object} [event] - The event [object]{@glossary Object} to pass along.
	* @param {module:enyo/Component~Component} [sender=this] - The event originator.
	* @returns {this} The callee for chaining.
	* @public
	*/
	waterfallDown: function(nom, event, sender) {
		var comp;
		event = event || {};
		event.bubbling = false;

		if (!this._silenced) {
			for (comp in this.$) this.$[comp].waterfall(nom, event, sender || this);
		}

		return this;
	},

	/**
	* @private
	*/
	_silenced: false,

	/**
	* @private
	*/
	_silenceCount: 0,

	/**
	* Sets a flag that disables {@glossary event} propagation for this
	* [component]{@link module:enyo/Component~Component}. Also increments an internal counter that tracks
	* the number of times the [unsilence()]{@link module:enyo/Component~Component#unsilence} method must
	* be called before event propagation will continue.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	silence: function () {
		this._silenced = true;
		this._silenceCount += 1;

		return this;
	},

	/**
	* Determines if the [object]{@glossary Object} is currently
	* [silenced]{@link module:enyo/Component~Component#_silenced}, which will prevent propagation of
	* [events]{@glossary event} (of any kind).
	*
	* @returns {Boolean} `true` if silenced; otherwise, `false`.
	* @public
	*/
	isSilenced: function () {
		return this._silenced;
	},

	/**
	* Allows {@glossary event} propagation for this [component]{@link module:enyo/Component~Component}
	* if the internal silence counter is `0`; otherwise, decrements the counter by one.
	* For event propagation to resume, this method must be called one time each call to
	* [silence()]{@link module:enyo/Component~Component#silence}.
	*
	* @returns {Boolean} `true` if the {@link module:enyo/Component~Component} is now unsilenced completely;
	*	`false` if it remains silenced.
	* @public
	*/
	unsilence: function () {
		if (0 !== this._silenceCount) --this._silenceCount;
		if (0 === this._silenceCount) this._silenced = false;
		return !this._silenced;
	},

	/**
	* Creates a new [job]{@link module:enyo/job} tied to this instance of the
	* [component]{@link module:enyo/Component~Component}. If the component is
	* [destroyed]{@link module:enyo/Component~Component#destroy}, any jobs associated with it
	* will be stopped.
	*
	* If you start a job with the same name as a pending job,
	* the original job will be stopped; this can be useful for resetting
	* timeouts.
	*
	* You may supply a priority level (1-10) at which the job should be
	* executed. The default level is `5`. Setting the priority lower than `5` (or setting it to
	* the string `"low"`) will defer the job if an animation is in progress,
	* which can help to avoid stuttering.
	*
	* @param {String} nom - The name of the [job]{@link module:enyo/job} to start.
	* @param {(Function|String)} job - Either the name of a method or a
	*	[function]{@glossary Function} to execute as the requested job.
	* @param {Number} wait - The number of milliseconds to wait before starting
	*	the job.
	* @param {Number} [priority=5] The priority value to be associated with this
	*	job.
	* @returns {this} The callee for chaining.
	* @public
	*/
	startJob: function (nom, job, wait, priority) {
		var jobs = (this.__jobs = this.__jobs || {});
		priority = priority || 5;
		// allow strings as job names, they map to local method names
		if (typeof job == 'string') job = this[job];
		// stop any existing jobs with same name
		this.stopJob(nom);
		jobs[nom] = setTimeout(this.bindSafely(function() {
			Jobs.add(this.bindSafely(job), priority, nom);
		}), wait);

		return this;
	},

	/**
	* Stops a [component]{@link module:enyo/Component~Component}-specific [job]{@link module:enyo/job} before it has
	* been activated.
	*
	* @param {String} nom - The name of the [job]{@link module:enyo/job} to be stopped.
	* @returns {this} The callee for chaining.
	* @public
	*/
	stopJob: function (nom) {
		var jobs = (this.__jobs = this.__jobs || {});
		if (jobs[nom]) {
			clearTimeout(jobs[nom]);
			delete jobs[nom];
		}
		Jobs.remove(nom);
	},

	/**
	* Executes the specified [job]{@link module:enyo/job} immediately, then prevents
	* any other calls to `throttleJob()` with the same job name from running for
	* the specified amount of time.
	*
	* @param {String} nom - The name of the [job]{@link module:enyo/job} to throttle.
	* @param {(Function|String)} job - Either the name of a method or a
	*	[function]{@glossary Function} to execute as the requested job.
	* @param {Number} wait - The number of milliseconds to wait before executing the
	*	job again.
	* @returns {this} The callee for chaining.
	* @public
	*/
	throttleJob: function (nom, job, wait) {
		var jobs = (this.__jobs = this.__jobs || {});
		// if we still have a job with this name pending, return immediately
		if (!jobs[nom]) {
			// allow strings as job names, they map to local method names
			if (typeof job == 'string') job = this[job];
			job.call(this);
			jobs[nom] = setTimeout(this.bindSafely(function() {
				this.stopJob(nom);
			}), wait);
		}
		return this;
	}
});

Component.prototype.defaultKind = Component;

/**
* @private
*/
kind.setDefaultCtor(Component);

/**
* Creates new instances from [config]{@glossary configurationBlock}
* [objects]{@glossary Object}. This method looks up the proper
* [constructor]{@glossary constructor} based on the provided [kind]{@glossary kind}
* attribute.
*
* @name module:enyo/Compoment~Component.create
* @param {Object} props - The properties that define the [kind]{@glossary kind}.
* @returns {*} An instance of the requested [kind]{@glossary kind}.
* @public
*/
Component.create = function (props) {
	var theKind,
		Ctor;

	if (!props.kind && props.hasOwnProperty('kind')) throw new Error(
		'enyo.create: Attempt to create a null kind. Check dependencies for [' + props.name + ']'
	);

	theKind = props.kind || props.isa || kind.getDefaultCtor();
	Ctor = kind.constructorForKind(theKind);

	if (!Ctor) {
		logger.error('No constructor found for kind ' + theKind);
		Ctor = Component;
	}

	return new Ctor(props);
};

/**
* @name module:enyo/Component~Component.subclass
* @static
* @private
*/
Component.subclass = function (ctor, props) {
	// Note: To reduce API surface area, sub-components are declared only as
	// 'components' in both kind and instance declarations.
	//
	// However, 'components' from kind declarations must be handled separately
	// at creation time.
	//
	// We rename the property here to avoid having
	// to interrogate the prototype at creation time.
	//
	var proto = ctor.prototype;
	//
	if (props.components) {
		proto.kindComponents = props.components;
		delete proto.components;
	} else {
		// Feature to mixin overrides of super-kind component properties from named hash
		// (only applied when the sub-kind doesn't supply its own components block)
		if (props.componentOverrides) {
			proto.kindComponents = Component.overrideComponents(
				proto.kindComponents,
				props.componentOverrides,
				proto.defaultKind
			);
		}
	}
};

/**
* @name module:enyo/Component~Component.concat
* @static
* @private
*/
Component.concat = function (ctor, props) {
	var proto = ctor.prototype || ctor,
		handlers;
	if (props.handlers) {
		handlers = proto.handlers ? utils.clone(proto.handlers) : {};
		proto.handlers = utils.mixin(handlers, props.handlers);
		delete props.handlers;
	}
	if (props.events) Component.publishEvents(proto, props);
};

/**
* @name module:enyo/Component~Component.overrideComponents
* @static
* @private
*/
Component.overrideComponents = function (components, overrides, defaultKind) {
	var omitMethods = function (k, v) {
		var isMethod = 
			// If it's a function, then it's a method (unless it's
			// a constructor passed as value for 'kind')
			(utils.isFunction(v) && (k !== 'kind')) ||
			// If it isInherited(), then it's also a method (since
			// Inherited is an object wrapper for a function)
			kind.isInherited(v);

		return !isMethod;
	};
	components = utils.clone(components);
	for (var i=0; i<components.length; i++) {
		var c = utils.clone(components[i]);
		var o = overrides[c.name];
		var ctor = kind.constructorForKind(c.kind || defaultKind);
		if (o) {

			// NOTE: You cannot overload mixins, observers or computed properties from
			// component overrides
			kind.concatHandler(c, o);
			var b = (c.kind && ((typeof c.kind == 'string' && utils.getPath(c.kind)) || (typeof c.kind == 'function' && c.kind))) || kind.getDefaultCtor();
			while (b) {
				if (b.concat) { b.concat(c, o, true); }
				b = b.prototype.base;
			}
			// All others just mix in
			utils.mixin(c, o, {filter: omitMethods});
		}
		if (c.components) {
			c.components = Component.overrideComponents(c.components, overrides, ctor.prototype.defaultKind);
		}
		components[i] = c;
	}
	return components;
};

/**
* @name module:enyo/Component~Component.publishEvents
* @static
* @private
*/
Component.publishEvents = function (ctor, props) {
	var events = props.events,
		event,
		proto;
	if (events) {
		proto = ctor.prototype || ctor;
		for (event in events) Component.addEvent(event, events[event], proto);
	}
};

/**
* @name module:enyo/Component~Component.addEvent
* @static
* @private
*/
Component.addEvent = function (nom, val, proto) {
	var v, fn;
	if (!utils.isString(val)) {
		v = val.value;
		fn = val.caller;
	} else {
		if (nom.slice(0, 2) != 'on') {
			logger.warn('enyo/Component.addEvent: event names must start with "on". ' + proto.kindName + ' ' +
				'event "' + nom + '" was auto-corrected to "on' + nom + '".');
			nom = 'on' + nom;
		}
		v = val;
		fn = 'do' + utils.cap(nom.slice(2));
	}
	proto[nom] = v;
	if (!proto[fn]) {
		proto[fn] = function(payload, other) {
			// bubble this event

			// if the second parameter exists then we use that - this is for a single case
			// where a named event delegates happent to point to an auto generated event
			// bubbler like this one - in that case the first parameter is actually the
			// sender
			var e = other || payload;
			if (!e) {
				e = {};
			}
			var d = e.delegate;
			// delete payload.delegate;
			e.delegate = undefined;
			if (!utils.exists(e.type)) {
				e.type = nom;
			}
			this.bubble(nom, e);
			if (d) {
				e.delegate = d;
			}
		};
	}
};

/**
* @private
*/
function prefixFromKindName (nom) {
	var pre = kindPrefix[nom],
		last;

	if (!pre) {
		last = nom.lastIndexOf('.');
		pre = (last >= 0) ? nom.slice(last+1) : nom;
		pre = pre.charAt(0).toLowerCase() + pre.slice(1);
		kindPrefix[nom] = pre;
	}

	return pre;
}

},{'./kind':'enyo/kind','./utils':'enyo/utils','./logger':'enyo/logger','./CoreObject':'enyo/CoreObject','./ApplicationSupport':'enyo/ApplicationSupport','./ComponentBindingSupport':'enyo/ComponentBindingSupport','./jobs':'enyo/jobs'}],'enyo/MultipleDispatchComponent':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/MultipleDispatchComponent~MultipleDispatchComponent} kind.
* @module enyo/MultipleDispatchComponent
*/

var
	kind = require('./kind');

var
	Component = require('./Component'),
	MultipleDispatchSupport = require('./MultipleDispatchSupport');

/**
* {@link module:enyo/MultipleDispatchComponent~MultipleDispatchComponent} is a purely abstract
* {@glossary kind} that simply provides a common ancestor for
* {@link module:enyo/Component~Component} [objects]{@glossary Object} that need 
* the [MultipleDispatchSupport]{@link module:enyo/MultipleDispatchSupport~MultipleDispatchSupport}
* {@glossary mixin}.
*
* @class MultipleDispatchComponent
* @extends module:enyo/Component~Component
* @mixes module:enyo/MultipleDispatchSupport~MultipleDispatchSupport
* @public
*/
module.exports = kind(
	/** @lends module:enyo/MultipleDispatchComponent~MultipleDispatchComponent */ {

	/**
	* @private
	*/
	kind: Component,

	/**
	* @private
	*/
	mixins: [MultipleDispatchSupport]
});

},{'./kind':'enyo/kind','./Component':'enyo/Component','./MultipleDispatchSupport':'enyo/MultipleDispatchSupport'}],'enyo/Signals':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Signals~Signals} kind.
* @module enyo/Signals
*/

var
	kind = require('./kind'),
	utils = require('./utils');

var
	Component = require('./Component');

/**
* {@link module:enyo/Signals~Signals} is a [component]{@link module:enyo/Component~Component} used to listen
* to global messages.
* 
* An object with a Signals component can listen to messages sent from anywhere
* by declaring handlers for them.
* 
* DOM [events]{@glossary event} that have no node targets are broadcast as
* signals. These events include Window events, such as `onload` and
* `onbeforeunload`, as well as events that occur directly on `document`, such
* as `onkeypress` if `document` has the focus.
* 
* For more information, see the documentation on [Event
* Handling]{@linkplain $dev-guide/key-concepts/event-handling.html} in the
* Enyo Developer Guide.
*
* @class Signals
* @extends module:enyo/Component~Component
* @public
*/
var Signals = module.exports = kind(
	/** @lends module:enyo/Signals~Signals.prototype */ {

	name: 'enyo.Signals',

	/**
	* @private
	*/
	kind: Component,

	/**
	* Needed because of early calls to bind DOM {@glossary event} listeners
	* to the [enyo.Signals.send()]{@link module:enyo/Signals~Signals#send} call.
	* 
	* @private
	*/


	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			Signals.addListener(this);
		};
	}),

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			Signals.removeListener(this);
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	notify: function (msg, load) {
		this.dispatchEvent(msg, load);
	},

	/**
	* @private
	*/
	protectedStatics: {
		listeners: [],
		addListener: function(listener) {
			this.listeners.push(listener);
		},
		removeListener: function(listener) {
			utils.remove(listener, this.listeners);
		}
	},

	/**
	* @private
	*/
	statics: 
		/** @lends module:enyo/Signals~Signals.prototype */ {

		/**
		* Broadcasts a global message to be consumed by subscribers.
		* 
		* @param {String} msg - The message to send; usually the name of the
		*	{@glossary event}.
		* @param {Object} load - An [object]{@glossary Object} containing any
		*	associated event properties to be accessed by subscribers.
		* @public
		*/
		send: function (msg, load) {
			utils.forEach(this.listeners, function(l) {
				l.notify(msg, load);
			});
		}
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./Component':'enyo/Component'}],'enyo/Animator':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Animator~Animator} kind.
* @module enyo/Animator
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	animation = require('./animation');

var
	Component = require('./Component'),
	Jobs = require('./jobs');

/**
* Fires when an animation step occurs.
*
* @event module:enyo/Animator~Animator#onStep
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when the animation finishes normally.
*
* @event module:enyo/Animator~Animator#onEnd
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when the animation is prematurely stopped.
*
* @event module:enyo/Animator~Animator#onStop
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/Animator~Animator} is a basic animation [component]{@link module:enyo/Component~Component}.  Call
* [play()]{@link module:enyo/Animator~Animator#play} to start the animation. The animation will run for
* the period (in milliseconds) specified by its [duration]{@link module:enyo/Animator~Animator#duration}
* property. [onStep]{@link module:enyo/Animator~Animator#onStep} [events]{@glossary event} will
* fire in quick succession and should be handled to do something based on the
* [value]{@link module:enyo/Animator~Animator#value} property.
*
* The `value` property will progress from [startValue]{@link module:enyo/Animator~Animator#startValue}
* to [endValue]{@link module:enyo/Animator~Animator#endValue} during the animation, based on the
* [function]{@glossary Function} referenced by the
* [easingFunction]{@link module:enyo/Animator~Animator#easingFunction} property.
*
* Event handlers may be specified as functions. If specified, the handler function will
* be used to handle the event directly, without sending the event to its
* [owner]{@link module:enyo/Component~Component#owner} or [bubbling]{@link module:enyo/Component~Component#bubble} it.
* The [context]{@link module:enyo/Animator~Animator#context} property may be used to call the supplied
* event functions in a particular `this` context.
*
* During animation, an {@link module:enyo/jobs} priority of 5 is registered to defer low priority
* tasks.
*
* @class Animator
* @extends module:enyo/Component~Component
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Animator~Animator.prototype */ {

	/**
	* A context in which to run the specified {@glossary event} handlers. If this is
	* not specified or is falsy, then the [global object]{@glossary global} is used.
	*
	* @name context
	* @type {Object}
	* @default undefined
	* @memberOf module:enyo/Animator~Animator.prototype
	* @public
	*/

	name: 'enyo.Animator',

	/**
	* @private
	*/
	kind: Component,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Animator~Animator.prototype */ {

		/**
		* Animation duration in milliseconds
		*
		* @type {Number}
		* @default 350
		* @public
		*/
		duration: 350,

		/**
		* Value of [value]{@link module:enyo/Animator~Animator#value} property at the beginning of an animation.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		startValue: 0,

		/**
		* Value of [value]{@link module:enyo/Animator~Animator#value} property at the end of an animation.
		*
		* @type {Number}
		* @default 1
		* @public
		*/
		endValue: 1,

		/**
		* Node that must be visible in order for the animation to continue. This reference is
		* destroyed when the animation ceases.
		*
		* @type {Object}
		* @default null
		* @public
		*/
		node: null,

		/**
		* [Function]{@glossary Function} that determines how the animation progresses from
		* [startValue]{@link module:enyo/Animator~Animator#startValue} to [endValue]{@link module:enyo/Animator~Animator#endValue}.
		*
		* @type {Function}
		* @default module:enyo/easing~easing.cubicOut
		* @public
		*/
		easingFunction: animation.easing.cubicOut
	},

	/*
	* @private
	*/
	events: {
		onStep: '',
		onEnd: '',
		onStop: ''
	},

	/**
	* @method
	* @private
	*/
	constructed: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this._next = this.bindSafely('next');
		};
	}),

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			this.stop();
			sup.apply(this, arguments);
		};
	}),

	/**
	* Plays the animation.
	*
	* @param {Object} props - As a convenience, this [hash]{@glossary Object} will be mixed
	*	directly into this [object]{@glossary Object}.
	* @public
	*/
	play: function (props) {
		this.stop();
		this.reversed = false;
		if (props) {
			utils.mixin(this, props);
		}
		this.t0 = this.t1 = utils.perfNow();
		this.value = this.startValue;

		// register this jobPriority to block less urgent tasks from executing
		Jobs.registerPriority(5, this.id);

		this.job = true;
		this.next();
		return this;
	},

	/**
	* Stops the animation and fires the associated {@glossary event}.
	*
	* @fires module:enyo/Animator~Animator#onStop
	* @returns {this} The callee for chaining.
	* @public
	*/
	stop: function () {
		if (this.isAnimating()) {
			this.cancel();
			this.fire('onStop');
			return this;
		}
	},

	/**
	* Stops the animation after a final step
	*
	* @returns {this} The callee for chaining
	* @public
	*/
	complete: function () {
		if (this.isAnimating()) {
			// set the start time such that the delta will always be greater than the duration
			// causing the animation to complete immediately
			this.t0 = -this.duration - 1;
			this.next();
		}

		return this;
	},

	/**
	* Reverses the direction of a running animation.
	*
	* @return {this} The callee for chaining.
	* @public
	*/
	reverse: function () {
		if (this.isAnimating()) {
			this.reversed = !this.reversed;
			var now = this.t1 = utils.perfNow();
			// adjust start time (t0) to allow for animation done so far to replay
			var elapsed = now - this.t0;
			this.t0 = now + elapsed - this.duration;
			// swap start and end values
			var startValue = this.startValue;
			this.startValue = this.endValue;
			this.endValue = startValue;
			return this;
		}
	},

	/**
	* Determines whether an animation is in progress.
	*
	* @returns {Boolean} `true` if there is an animation currently running; otherwise, `false`.
	* @private
	*/
	isAnimating: function () {
		return Boolean(this.job);
	},

	/**
	* @private
	*/
	requestNext: function () {
		this.job = animation.requestAnimationFrame(this._next, this.node);
	},

	/**
	* @private
	*/
	cancel: function () {
		animation.cancelAnimationFrame(this.job);
		this.node = null;
		this.job = null;

		// unblock job queue
		Jobs.unregisterPriority(this.id);
	},

	/**
	* @private
	*/
	shouldEnd: function () {
		return (this.dt >= this.duration);
	},

	/**
	* Runs the next step of the animation.
	*
	* @fires module:enyo/Animator~Animator#onStep
	* @fires module:enyo/Animator~Animator#onEnd
	* @private
	*/
	next: function () {
		this.t1 = utils.perfNow();
		this.dt = this.t1 - this.t0;
		var args = this.easingFunction.length;
		var f;

		if (args === 1) {
			// time independent
			f = this.fraction = animation.easedLerp(this.t0, this.duration, this.easingFunction, this.reversed);
			this.value = this.startValue + f * (this.endValue - this.startValue);
		} else {
			this.value = animation.easedComplexLerp(this.t0, this.duration, this.easingFunction, this.reversed,
				this.dt, this.startValue, (this.endValue - this.startValue));
		}
		if (((f >= 1) && (args === 1)) || this.shouldEnd()) {
			this.value = this.endValue;
			this.fraction = 1;
			this.fire('onStep');
			this.cancel();
			utils.asyncMethod(this.bindSafely(function() {
				this.fire('onEnd');
			}));
		} else {
			this.fire('onStep');
			this.requestNext();
		}
	},

	/**
	* @private
	*/
	fire: function (nom) {
		var fn = this[nom];
		if (utils.isString(fn)) {
			this.bubble(nom);
		} else if (fn) {
			fn.call(this.context || global, this);
		}
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./animation':'enyo/animation','./Component':'enyo/Component','./jobs':'enyo/jobs'}],'enyo/Selection':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Selection~Selection} kind.
* @module enyo/Selection
*/

var
	kind = require('./kind');
var
	Component = require('./Component');

/**
* The extended {@glossary event} [object]{@glossary Object} that is provided
* when the [onSelect]{@link module:enyo/Selection~Selection#onSelect} and
* [onDeselect]{@link module:enyo/Selection~Selection#onDeselect} events are fired.
*
* @typedef {Object} module:enyo/Selection~Selection~SelectionEvent
* @property {Number|String} key The key that was used to register the
*	[selection]{@link module:enyo/Selection~Selection} (usually a row index).
* @property {Object} data - References data registered with the key by the code
* that made the original selection.
*/

/**
* Fires when an item is selected.
* 
* ```javascript
* var
* 	kind = require('enyo/kind'),
* 	Selection = require('enyo/Selection');
*
* {kind: Selection, onSelect: 'selectRow', ... }
*
* selectRow: function(inSender, inEvent) {
* 	...
* }
* ```
*
* @event module:enyo/Selection~Selection#onSelect
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Selection~Selection~SelectionEvent} event - An [object]{@glossary Object}
*	containing event information.
* @public
*/

/**
* Fires when an item is deselected.
* 
* ```javascript
* var
* 	kind = require('enyo/kind'),
* 	Selection = require('enyo/Selection');
*
* {kind: Selection, onSelect: 'deselectRow', ... }
*
* deselectRow: function(inSender, inEvent) {
* 	...
* }
* ```
*
* @event module:enyo/Selection~Selection#onDeselect
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Selection~Selection~SelectionEvent} event - An [object]{@glossary Object}
*	containing event information.
* @public
*/

/**
* Fires when selection changes (but not when selection is cleared).
*
* @event module:enyo/Selection~Selection#onChange
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/Selection~Selection} is used to manage row selection state for lists. It provides
* selection state management for both single-select and multi-select lists.
*
* ```javascript
* // The following code is excerpted from layout/FlyweightRepeater.
*
* var
* 	kind = require('enyo/kind'),
* 	Selection = require('enyo/Selection');
*
* module.exports = kind({
* 	components: [
* 		{kind: Selection, onSelect: 'selectDeselect', onDeselect: 'selectDeselect'},
* 		...
* 	],
* 	tap: function(inSender, inEvent) {
* 		...
* 		if (this.toggleSelected) {
* 			this.$.selection.toggle(event.index);
* 		} else {
* 			this.$.selection.select(event.index);
* 		}
* 	},
* 	selectDeselect: function(inSender, inEvent) {
* 		// this is where a row selection highlight might be applied
* 		this.renderRow(inEvent.key);
* 	}
* 	...
* });
* ```
*
* @class Selection
* @extends module:enyo/Component~Component
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Selection~Selection.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Selection',

	/**
	* @private
	*/
	kind: Component,

	/**
	* @private
	*/
	published: 
		/** @lends module:enyo/Selection~Selection.prototype */ {

		/**
		* If `true`, multiple selections are allowed.
		* 
		* @type {Boolean}
		* @default false
		* @public
		*/
		multi: false
	},

	/**
	* @private
	*/
	events: {
		onSelect: '',
		onDeselect: '',
		onChange: ''
	},
	
	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			this.clear();
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	multiChanged: function () {
		if (!this.multi) {
			this.clear();
		}
		this.doChange();
	},

	/**
	* @private
	*/
	highlander: function () {
		if (!this.multi) {
			this.deselect(this.lastSelected);
		}
	},

	/**
	* Removes all selections.
	* 
	* @public
	*/
	clear: function () {
		this.selected = {};
	},

	/**
	* Determines whether a particular row is selected.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @returns {Boolean} `true` if the specified row is selected; otherwise, `false`.
	* @public
	*/
	isSelected: function (key) {
		return this.selected[key];
	},

	/**
	* Manually sets a row's state to selected or unselected.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @param {Boolean} sel - `true` if the row should be selected; `false` if the row
	* should be unselected.
	* @param {Object} [data] - An optional data [object]{@glossary Object} to store
	*	in the selection for the key that will be sent with the
	*	[onSelect]{@link module:enyo/Selection~Selection#onSelect} or
	*	[onDeselect]{@link module:enyo/Selection~Selection#onDeselect} {@glossary event}. If
	*	not used, the `data` will be set to `true`.
	* @fires module:enyo/Selection~Selection#onChange
	* @public
	*/
	setByKey: function (key, sel, data) {
		if (sel) {
			this.selected[key] = (data || true);
			this.lastSelected = key;
			this.doSelect({key: key, data: this.selected[key]});
		} else {
			var was = this.isSelected(key);
			delete this.selected[key];
			this.doDeselect({key: key, data: was});
		}
		this.doChange();
	},

	/**
	* Deselects a row.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @public
	*/
	deselect: function (key) {
		if (this.isSelected(key)) {
			this.setByKey(key, false);
		}
	},

	/**
	* Selects a row. If the [multi]{@link module:enyo/Selection~Selection#multi} property is set to `false`,
	* this will also deselect the previous [selection]{@link module:enyo/Selection~Selection}.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @param {Object} [data] - An optional data [object]{@glossary Object} to store
	* in the selection for the key that will be sent with the
	*	[onSelect]{@link module:enyo/Selection~Selection#onSelect} or
	*	[onDeselect]{@link module:enyo/Selection~Selection#onDeselect} {@glossary event}. If
	*	not used, the `data` will be set to `true`.
	* @public
	*/
	select: function (key, data) {
		if (this.multi) {
			this.setByKey(key, !this.isSelected(key), data);
		} else if (!this.isSelected(key)) {
			this.highlander();
			this.setByKey(key, true, data);
		}
	},

	/**
	* Toggles [selection]{@link module:enyo/Selection~Selection} state for a row. If the
	* [multi]{@link module:enyo/Selection~Selection#multi} property is set to `false`, toggling a
	* selection "on" will deselect the previous selection.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @param {Object} [data] - An optional data [object]{@glossary Object} to store
	* in the selection for the key that will be sent with the
	*	[onSelect]{@link module:enyo/Selection~Selection#onSelect} or
	*	[onDeselect]{@link module:enyo/Selection~Selection#onDeselect} {@glossary event}. If
	*	not used, the `data` will be set to `true`.
	* @public
	*/
	toggle: function (key, data) {
		if (!this.multi && this.lastSelected != key) {
			this.deselect(this.lastSelected);
		}
		this.setByKey(key, !this.isSelected(key), data);
	},

	/**
	* Retrieves the current [selection]{@link module:enyo/Selection~Selection}.
	*
	* @returns {Object} The selection as a [hash]{@glossary Object} in which each
	* selected item has a value; unselected items are [undefined]{@glossary undefined}.
	* @public
	*/
	getSelected: function () {
		return this.selected;
	},

	/**
	* Removes a row that's included in the [selection]{@link module:enyo/Selection~Selection} set.
	* If this row is selected, it will be unselected.  Any rows above this row
	* will have their keys value reduced by one.
	*
	* @param {Number|String} key - The unique identifier of the row.
	* @public
	*/
	remove: function (key) {
		var newSelected = {};
		for (var row in this.selected) {
			if (row < key) {
				newSelected[row] = this.selected[row];
			} else if (row > key) {
				newSelected[row - 1] = this.selected[row];
			}
		}
		this.selected = newSelected;
	}
});

},{'./kind':'enyo/kind','./Component':'enyo/Component'}],'enyo/ScrollMath':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ScrollMath~ScrollMath} kind.
* @module enyo/ScrollMath
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	platform = require('./platform'),
	animation = require('./animation');

var
	Component = require('./Component');

/**
* Fires when a scrolling action starts.
*
* @event module:enyo/ScrollMath~ScrollMath#onScrollStart
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Scroller~Scroller~ScrollEvent} event - An [object]{@glossary Object} containing
*	event information.
* @private
*/

/**
* Fires while a scrolling action is in progress.
*
* @event module:enyo/ScrollMath~ScrollMath#onScroll
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Scroller~Scroller~ScrollEvent} event - An [object]{@glossary Object} containing
*	event information.
* @private
*/

/**
* Fires when a scrolling action stops.
*
* @event module:enyo/ScrollMath~ScrollMath#onScrollStop
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Scroller~Scroller~ScrollEvent} event - An [object]{@glossary Object} containing
*	event information.
* @private
*/

/**
* {@link module:enyo/ScrollMath~ScrollMath} implements a scrolling dynamics simulation. It is a
* helper [kind]{@glossary kind} used by other [scroller]{@link module:enyo/Scroller~Scroller}
* kinds, such as {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy}.
*
* `enyo/ScrollMath` is not typically created in application code.
*
* @class ScrollMath
* @protected
*/
module.exports = kind(
	/** @lends module:enyo/ScrollMath~ScrollMath.prototype */ {

	name: 'enyo.ScrollMath',

	/**
	* @private
	*/
	kind: Component,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/ScrollMath~ScrollMath.prototype */ {

		/**
		* Set to `true` to enable vertical scrolling.
		*
		* @type {Boolean}
		* @default true
		* @private
		*/
		vertical: true,

		/**
		* Set to `true` to enable horizontal scrolling.
		*
		* @type {Boolean}
		* @default true
		* @private
		*/
		horizontal: true
	},

	/**
	* @private
	*/
	events: {
		onScrollStart: '',
		onScroll: '',
		onScrollStop: '',
		onStabilize: ''
	},

	/**
	* "Spring" damping returns the scroll position to a value inside the boundaries. Lower
	* values provide faster snapback.
	*
	* @private
	*/
	kSpringDamping: 0.93,

	/**
	* "Drag" damping resists dragging the scroll position beyond the boundaries. Lower values
	* provide more resistance.
	*
	* @private
	*/
	kDragDamping: 0.5,

	/**
	* "Friction" damping reduces momentum over time. Lower values provide more friction.
	*
	* @private
	*/
	kFrictionDamping: 0.97,

	/**
	* Additional "friction" damping applied when momentum carries the viewport into overscroll.
	* Lower values provide more friction.
	*
	* @private
	*/
	kSnapFriction: 0.9,

	/**
	* Scalar applied to `flick` event velocity.
	*
	* @private
	*/
	kFlickScalar: 15,

	/**
	* Limits the maximum allowable flick. On Android > 2, we limit this to prevent compositing
	* artifacts.
	*
	* @private
	*/
	kMaxFlick: platform.android > 2 ? 2 : 1e9,

	/**
	* The value used in [friction()]{@link module:enyo/ScrollMath~ScrollMath#friction} to determine if the delta
	* (e.g., y - y0) is close enough to zero to consider as zero.
	*
	* @private
	*/
	kFrictionEpsilon: platform.webos >= 4 ? 1e-1 : 1e-2,

	/**
	* Top snap boundary, generally `0`.
	*
	* @private
	*/
	topBoundary: 0,

	/**
	* Right snap boundary, generally `(viewport width - content width)`.
	*
	* @private
	*/
	rightBoundary: 0,

	/**
	* Bottom snap boundary, generally `(viewport height - content height)`.
	*
	* @private
	*/
	bottomBoundary: 0,

	/**
	* Left snap boundary, generally `0`.
	*
	* @private
	*/
	leftBoundary: 0,

	/**
	* Animation time step.
	*
	* @private
	*/
	interval: 20,

	/**
	* Flag to enable frame-based animation; if `false`, time-based animation is used.
	*
	* @private
	*/
	fixedTime: true,

	/**
	* Simulation state.
	*
	* @private
	*/
	x0: 0,

	/**
	* Simulation state.
	*
	* @private
	*/
	x: 0,

	/**
	* Simulation state.
	*
	* @private
	*/
	y0: 0,

	/**
	* Simulation state.
	*
	* @private
	*/
	y: 0,

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.boundarySnapshot = {};
		};
	}),

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			this.stop();
			sup.apply(this, arguments);
		};
	}),

	/**
	* Simple Verlet integrator for simulating Newtonian motion.
	*
	* @private
	*/
	verlet: function () {
		var x = this.x;
		this.x += x - this.x0;
		this.x0 = x;
		//
		var y = this.y;
		this.y += y - this.y0;
		this.y0 = y;
	},

	/**
	* Boundary damping function. Returns damped `value` based on `coeff` on one side of
	* `origin`.
	*
	* @private
	*/
	damping: function (val, origin, coeff, sign) {
		var kEpsilon = 0.5;
		//
		// this is basically just value *= coeff (generally, coeff < 1)
		//
		// 'sign' and the conditional is to force the damping to only occur
		// on one side of the origin.
		//
		var dv = val - origin;
		// Force close-to-zero to zero
		if (Math.abs(dv) < kEpsilon) {
			return origin;
		}
		return val*sign > origin*sign ? coeff * dv + origin : val;
	},

	/**
	* Dual-boundary damping function. Returns damped `value` based on `coeff` when exceeding
	* either boundary.
	*
	* @private
	*/
	boundaryDamping: function (val, aBoundary, bBoundary, coeff) {
		return this.damping(this.damping(val, aBoundary, coeff, 1), bBoundary, coeff, -1);
	},

	/**
	* Simulation constraints (spring damping occurs here).
	*
	* @private
	*/
	constrain: function () {
		var b = this.getDampingBoundaries(),
			y = this.boundaryDamping(this.y, b.top, b.bottom, this.kSpringDamping),
			x = this.boundaryDamping(this.x, b.left, b.right, this.kSpringDamping);

		if (y != this.y) {
			// ensure snapping introduces no velocity, add additional friction
			this.y0 = y - (this.y - this.y0) * this.kSnapFriction;
			this.y = y;
		}

		if (x != this.x) {
			this.x0 = x - (this.x - this.x0) * this.kSnapFriction;
			this.x = x;
		}
	},

	/**
	* The friction function.
	*
	* @private
	*/
	friction: function (ex, ex0, coeff) {
		// implicit velocity
		var dp = this[ex] - this[ex0];
		// let close-to-zero collapse to zero (i.e. smaller than epsilon is considered zero)
		var c = Math.abs(dp) > this.kFrictionEpsilon ? coeff : 0;
		// reposition using damped velocity
		this[ex] = this[ex0] + c * dp;
	},

	/**
	* One unit of time for simulation.
	*
	* @private
	*/
	frame: 10,
	// piece-wise constraint simulation
	simulate: function (t) {
		while (t >= this.frame) {
			t -= this.frame;
			if (!this.dragging) {
				this.constrain();
			}
			this.verlet();
			this.friction('y', 'y0', this.kFrictionDamping);
			this.friction('x', 'x0', this.kFrictionDamping);
		}
		return t;
	},

	/**
	* @method
	* @private
	*/
	getDampingBoundaries: function() {
		return this.haveBoundarySnapshot ?
			this.boundarySnapshot :
			{
				top : this.topBoundary,
				bottom : this.bottomBoundary,
				left : this.leftBoundary,
				right : this.rightBoundary
			};
	},

	/**
	* @method
	* @private
	*/
	takeBoundarySnapshot: function () {
		var s;

		if (!this.haveBoundarySnapshot) {
			s = this.boundarySnapshot;

			s.top = this.topBoundary;
			s.bottom = this.bottomBoundary;
			s.left = this.leftBoundary;
			s.right = this.rightBoundary;

			this.haveBoundarySnapshot = true;
		}
	},

	/**
	* @method
	* @private
	*/
	discardBoundarySnapshot: function() {
		this.haveBoundarySnapshot = false;
	},

	/**
	* @fires module:enyo/ScrollMath~ScrollMath#onScrollStop
	* @private
	*/
	animate: function () {
		this.stop();
		// time tracking
		var t0 = utils.perfNow(), t = 0;
		// delta tracking
		var x0, y0;
		// animation handler
		var fn = this.bindSafely(function() {
			// wall-clock time
			var t1 = utils.perfNow();
			// schedule next frame
			this.job = animation.requestAnimationFrame(fn);
			// delta from last wall clock time
			var dt = t1 - t0;
			// record the time for next delta
			t0 = t1;
			// user drags override animation
			if (this.dragging) {
				this.y0 = this.y = this.uy;
				this.x0 = this.x = this.ux;
				this.endX = this.endY = null;
			}
			// frame-time accumulator
			// min acceptable time is 16ms (60fps)
			t += Math.max(16, dt);
			// prevent snapping to originally desired scroll position if we are in overscroll
			if (this.isInOverScroll()) {
				this.endX = null;
				this.endY = null;

				this.takeBoundarySnapshot();
			}
			else {
				this.discardBoundarySnapshot();

				// alternate fixed-time step strategy:
				if (this.fixedTime) {
					t = this.interval;
				}
			}
			// consume some t in simulation
			t = this.simulate(t);
			// scroll if we have moved, otherwise the animation is stalled and we can stop
			if (y0 != this.y || x0 != this.x) {
				this.scroll();
			} else if (!this.dragging) {
				// set final values
				if (this.endX != null) {
					this.x = this.x0 = this.endX;
				}
				if (this.endY != null) {
					this.y = this.y0 = this.endY;
				}

				this.stop();
				this.scroll();
				this.doScrollStop();

				this.endX = null;
				this.endY = null;
			}
			y0 = this.y;
			x0 = this.x;
		});
		this.job = animation.requestAnimationFrame(fn);
	},

	/**
	* @private
	*/
	start: function () {
		if (!this.job) {
			this.doScrollStart();
			this.animate();
		}
	},

	/**
	* @private
	*/
	stop: function (fire) {
		var job = this.job;
		if (job) {
			this.job = animation.cancelAnimationFrame(job);
		}
		if (fire) {
			this.doScrollStop();

			this.endX = undefined;
			this.endY = undefined;
		}
	},

	/**
	* Adjusts the scroll position to be valid, if necessary (e.g., after the scroll contents
	* have changed).
	*
	* @private
	*/
	stabilize: function (opts) {
		var fire = !opts || opts.fire === undefined || opts.fire;
		var y = Math.min(this.topBoundary, Math.max(this.bottomBoundary, this.y));
		var x = Math.min(this.leftBoundary, Math.max(this.rightBoundary, this.x));
		if (y != this.y || x != this.x) {
			this.y = this.y0 = y;
			this.x = this.x0 = x;
			if (fire) {
				this.doStabilize();
			}
		}
	},

	/**
	* @private
	*/
	startDrag: function (e) {
		this.dragging = true;
		//
		this.my = e.pageY;
		this.py = this.uy = this.y;
		//
		this.mx = e.pageX;
		this.px = this.ux = this.x;
	},

	/**
	* @private
	*/
	drag: function (e) {
		var dy, dx, v, h;
		if (this.dragging) {
			v = this.canScrollY();
			h = this.canScrollX();

			dy = v ? e.pageY - this.my : 0;
			this.uy = dy + this.py;
			// provides resistance against dragging into overscroll
			this.uy = this.boundaryDamping(this.uy, this.topBoundary, this.bottomBoundary, this.kDragDamping);
			//
			dx = h ? e.pageX - this.mx : 0;
			this.ux = dx + this.px;
			// provides resistance against dragging into overscroll
			this.ux = this.boundaryDamping(this.ux, this.leftBoundary, this.rightBoundary, this.kDragDamping);
			//
			this.start();
			return true;
		}
	},

	/**
	* @private
	*/
	dragDrop: function () {
		if (this.dragging && !window.PalmSystem) {
			var kSimulatedFlickScalar = 0.5;
			this.y = this.uy;
			this.y0 = this.y - (this.y - this.y0) * kSimulatedFlickScalar;
			this.x = this.ux;
			this.x0 = this.x - (this.x - this.x0) * kSimulatedFlickScalar;
		}
		this.dragFinish();
	},

	/**
	* @private
	*/
	dragFinish: function () {
		this.dragging = false;
	},

	/**
	* @private
	*/
	flick: function (e) {
		var v;
		if (this.canScrollY()) {
			v = e.yVelocity > 0 ? Math.min(this.kMaxFlick, e.yVelocity) : Math.max(-this.kMaxFlick, e.yVelocity);
			this.y = this.y0 + v * this.kFlickScalar;
		}
		if (this.canScrollX()) {
			v = e.xVelocity > 0 ? Math.min(this.kMaxFlick, e.xVelocity) : Math.max(-this.kMaxFlick, e.xVelocity);
			this.x = this.x0 + v * this.kFlickScalar;
		}
		this.start();
	},

	/**
	* TODO: Refine and test newMousewheel, remove this
	* @private
	*/
	mousewheel: function (e) {
		var dy = this.vertical ? e.wheelDeltaY || (!e.wheelDeltaX ? e.wheelDelta : 0) : 0,
			dx = this.horizontal ? e.wheelDeltaX : 0,
			shouldScroll = false;
		if ((dy > 0 && this.y < this.topBoundary) || (dy < 0 && this.y > this.bottomBoundary)) {
			this.y = this.y0 = this.y0 + dy;
			shouldScroll = true;
		}
		if ((dx > 0 && this.x < this.leftBoundary) || (dx < 0 && this.x > this.rightBoundary)) {
			this.x = this.x0 = this.x0 + dx;
			shouldScroll = true;
		}
		this.stop(!shouldScroll);
		if (shouldScroll) {
			this.start();
			return true;
		}
	},

	/**
	* @private
	*/
	newMousewheel: function (e, opts) {
		var rtl = opts && opts.rtl,
			wdY = (e.wheelDeltaY === undefined) ? e.wheelDelta : e.wheelDeltaY,
			dY = wdY,
			dX = rtl ? -e.wheelDeltaX : e.wheelDeltaX,
			canY = this.canScrollY(),
			canX = this.canScrollX(),
			shouldScroll = false,
			m = 2,
			// TODO: Figure out whether we need to port the configurable
			// max / multiplier feature from Moonstone's implementation,
			// and (if so) how
			// max = 100,
			scr = this.isScrolling(),
			ovr = this.isInOverScroll(),
			refY = (scr && this.endY !== null) ? this.endY : this.y,
			refX = (scr && this.endX !== null) ? this.endX : this.x,
			tY = refY,
			tX = refX;

		if (ovr) {
			return true;
		}

		// If we're getting strictly vertical mousewheel events over a scroller that
		// can only move horizontally, the user is probably using a one-dimensional
		// mousewheel and would like us to scroll horizontally instead
		if (dY && !dX && canX && !canY) {
			dX = dY;
			dY = 0;
		}

		if (dY && canY) {
			tY = -(refY + (dY * m));
			shouldScroll = true;
		}
		if (dX && canX) {
			tX = -(refX + (dX * m));
			shouldScroll = true;
		}

		if (shouldScroll) {
			this.scrollTo(tX, tY, {allowOverScroll: true});
			return true;
		}
	},

	/**
	* @fires module:enyo/ScrollMath~ScrollMath#onScroll
	* @private
	*/
	scroll: function () {
		this.doScroll();
	},

	// NOTE: Yip/Orvell method for determining scroller instantaneous velocity
	// FIXME: incorrect if called when scroller is in overscroll region
	// because does not account for additional overscroll damping.

	/**
	* Scrolls to the specified position.
	*
	* @param {Number} x - The `x` position in pixels.
	* @param {Number} y - The `y` position in pixels.
	* @param {Object} opts - TODO: Document. When behavior == 'instant', we skip animation.
	* @private
	*/
	scrollTo: function (x, y, opts) {
		var animate = !opts || opts.behavior !== 'instant',
			xSnap = this.xSnapIncrement,
			ySnap = this.ySnapIncrement,
			allowOverScroll = opts && opts.allowOverScroll,
			maxX = Math.abs(Math.min(0, this.rightBoundary)),
			maxY = Math.abs(Math.min(0, this.bottomBoundary));

		if (typeof xSnap === 'number') {
			x = xSnap * Math.round(x / xSnap);
		}

		if (typeof ySnap === 'number') {
			y = ySnap * Math.round(y / ySnap);
		}

		if (!animate || !allowOverScroll) {
			x = Math.max(0, Math.min(x, maxX));
			y = Math.max(0, Math.min(y, maxY));
		}

		if (-x == this.x && -y == this.y) return;

		if (!animate) {
			this.doScrollStart();
			this.setScrollX(-x);
			this.setScrollY(-y);
			this.doScroll();
			this.doScrollStop();
		}
		else {
			if (y !== null) {
				this.endY = -y;
				this.y = this.y0 - (y + this.y0) * (1 - this.kFrictionDamping);
			}
			if (x !== null) {
				this.endX = -x;
				this.x = this.x0 - (x + this.x0) * (1 - this.kFrictionDamping);
			}
			this.start();
		}
	},

	/**
	* Sets the scroll position along the x-axis.
	*
	* @param {Number} x - The x-axis scroll position in pixels.
	* @method
	* @private
	*/
	setScrollX: function (x) {
		this.x = this.x0 = x;
	},

	/**
	* Sets the scroll position along the y-axis.
	*
	* @param {Number} y - The y-axis scroll position in pixels.
	* @method
	* @private
	*/
	setScrollY: function (y) {
		this.y = this.y0 = y;
	},

	/**
	* Sets the scroll position; defaults to setting this position along the y-axis.
	*
	* @param {Number} pos - The scroll position in pixels.
	* @method
	* @private
	*/
	setScrollPosition: function (pos) {
		this.setScrollY(pos);
	},

	canScrollX: function() {
		return this.horizontal && this.rightBoundary < 0;
	},

	canScrollY: function() {
		return this.vertical && this.bottomBoundary < 0;
	},


	/**
	* Determines whether or not the [scroller]{@link module:enyo/Scroller~Scroller} is actively moving.
	*
	* @return {Boolean} `true` if actively moving; otherwise, `false`.
	* @private
	*/
	isScrolling: function () {
		return Boolean(this.job);
	},

	/**
	* Determines whether or not the [scroller]{@link module:enyo/Scroller~Scroller} is in overscroll.
	*
	* @return {Boolean} `true` if in overscroll; otherwise, `false`.
	* @private
	*/
	isInOverScroll: function () {
		return this.job && (this.x > this.leftBoundary || this.x < this.rightBoundary ||
			this.y > this.topBoundary || this.y < this.bottomBoundary);
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./platform':'enyo/platform','./animation':'enyo/animation','./Component':'enyo/Component'}],'enyo/Controller':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Controller~Controller} kind.
* @module enyo/Controller
*/

var
	kind = require('./kind'),
	utils = require('./utils');

var
	MultipleDispatchComponent = require('./MultipleDispatchComponent');

/**
* {@link module:enyo/Controller~Controller} is the base [kind]{@glossary kind} for all
* controllers in Enyo. An abstract kind, `enyo/Controller` is a
* [delegate]{@glossary delegate}/[component]{@link module:enyo/Component~Component} that
* is designed to be a proxy for information.
*
* @class Controller
* @extends module:enyo/MultipleDispatchComponent~MultipleDispatchComponent
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Controller~Controller.prototype */ {

	name: 'enyo.Controller',

	/**
	* @private
	*/
	kind: MultipleDispatchComponent,

	/**
	* Set this flag to `true` to make this [controller]{@link module:enyo/Controller~Controller}
	* available globally, when instanced. When set to `true`, even the
	* [owner]{@link module:enyo/Component~Component#owner} (if any) cannot
	* [destroy]{@link module:enyo/Component~Component#destroy} it.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	global: false,

	/**
	* The default source of information for all instances of {@link module:enyo/Controller~Controller}
	* and its [subkinds]{@glossary subkind}. In some cases, this will be a
	* [computed property]{@link module:enyo/ComputedSupport} to facilitate overloading.
	* It may contain any type of data.
	*
	* @type {*}
	* @default null
	* @public
	*/
	data: null,

	/**
	* @method
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			// don't attempt to set a controller globally without a name
			if (this.global && this.name) {
				utils.setPath.call(global, this.name, this);
			}
		};
	}),
	_isController: true
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./MultipleDispatchComponent':'enyo/MultipleDispatchComponent'}],'enyo/master':[function (module,exports,global,require,request){
require('enyo');

var
	utils = require('./utils');
var
	Component = require('./Component'),
	Signals = require('./Signals');

/**
* Default owner assigned to ownerless [UiComponents]{@link module:enyo/UiComponent~UiComponent},
* to allow such UiComponents to be notified of important system events like window resize.
*
* NOTE: Ownerless [UiComponents]{@link module:enyo/UiComponent~UiComponent} will not be garbage collected unless 
* explicitly destroyed, as they will be referenced by `master`.
*
* @module enyo/master
* @private
*/
var master = module.exports = new Component({
	name: 'master',
	notInstanceOwner: true,
	eventFlags: {showingOnly: true}, // don't waterfall these events into hidden controls
	getId: function () {
		return '';
	},
	isDescendantOf: utils.nop,
	bubble: function (nom, event) {
		//enyo.log('master event: ' + nom);
		if (nom == 'onresize') {
			// Resize is special; waterfall this message.
			// This works because master is a Component, so it waterfalls
			// to its owned Components (i.e., master has no children).
			master.waterfallDown('onresize', this.eventFlags);
			master.waterfallDown('onpostresize', this.eventFlags);
		} else {
			// All other top-level events are sent only to interested Signal
			// receivers.
			Signals.send(nom, event);
		}
	}
});

},{'./utils':'enyo/utils','./Component':'enyo/Component','./Signals':'enyo/Signals'}],'enyo/dispatcher':[function (module,exports,global,require,request){
/**
* Contains dispatcher methods
* @module enyo/dispatcher
* @private
*/
require('enyo');

var
	logger = require('./logger'),
	master = require('./master'),
	utils = require('./utils');

var
	Dom = require('./dom');

/**
 * An [object]{@glossary Object} describing the the last known coordinates of the cursor or
 * user-interaction point in touch environments.
 *
 * @typedef {Object} module:enyo/dispatcher~CursorCoordinates
 * @property {Number} clientX - The horizontal coordinate within the application's client area.
 * @property {Number} clientY - The vertical coordinate within the application's client area.
 * @property {Number} pageX - The X coordinate of the cursor relative to the viewport, including any
 *   scroll offset.
 * @property {Number} pageY - The Y coordinate of the cursor relative to the viewport, including any
 *   scroll offset.
 * @property {Number} screenX - The X coordinate of the cursor relative to the screen, not including
 *   any scroll offset.
 * @property {Number} screenY - The Y coordinate of the cursor relative to the screen, not including
 *   any scroll offset.
 */

/**
* @private
*/
var dispatcher = module.exports = dispatcher = {

	$: {},

	/**
	* These events come from document
	*
	* @private
	*/
	events: ['mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove', 'mousewheel',
		'click', 'dblclick', 'change', 'keydown', 'keyup', 'keypress', 'input',
		'paste', 'copy', 'cut', 'webkitTransitionEnd', 'transitionend', 'webkitAnimationEnd', 'animationend',
		'webkitAnimationStart', 'animationstart', 'webkitAnimationIteration', 'animationiteration'],

	/**
	* These events come from window
	*
	* @private
	*/
	windowEvents: ['resize', 'load', 'unload', 'message', 'hashchange', 'popstate', 'focus', 'blur'],

	/**
	* Feature plugins (aka filters)
	*
	* @private
	*/
	features: [],

	/**
	* @private
	*/
	connect: function() {
		var d = dispatcher, i, n;
		for (i=0; (n=d.events[i]); i++) {
			d.listen(document, n);
		}
		for (i=0; (n=d.windowEvents[i]); i++) {
			// Chrome Packaged Apps don't like "unload"
			if(n === 'unload' &&
				(typeof global.chrome === 'object') &&
				global.chrome.app) {
				continue;
			}

			d.listen(window, n);
		}
	},

	/**
	* @private
	*/
	listen: function(inListener, inEventName, inHandler) {
		inListener.addEventListener(inEventName, inHandler || dispatch, false);
	},

	/**
	* @private
	*/
	stopListening: function(inListener, inEventName, inHandler) {
		inListener.removeEventListener(inEventName, inHandler || dispatch, false);
	},

	/**
	* Fires an event for Enyo to listen for.
	*
	* @private
	*/
	dispatch: function(e) {
		// Find the control who maps to e.target, or the first control that maps to an ancestor of e.target.
		var c = this.findDispatchTarget(e.target) || this.findDefaultTarget();
		// Cache the original target
		e.dispatchTarget = c;
		// support pluggable features return true to abort immediately or set e.preventDispatch to avoid processing.
		for (var i=0, fn; (fn=this.features[i]); i++) {
			if (fn.call(this, e) === true) {
				return;
			}
		}
		if (c && !e.preventDispatch) {
			return this.dispatchBubble(e, c);
		}
	},

	/**
	* Takes an event target and finds the corresponding Enyo control.
	*
	* @private
	*/
	findDispatchTarget: function(inNode) {
		var t, n = inNode;
		// FIXME: Mozilla: try/catch is here to squelch "Permission denied to access property xxx from a non-chrome context"
		// which appears to happen for scrollbar nodes in particular. It's unclear why those nodes are valid targets if
		// it is illegal to interrogate them. Would like to trap the bad nodes explicitly rather than using an exception block.
		try {
			while (n) {
				if ((t = this.$[n.id])) {
					// there could be multiple nodes with this id, the relevant node for this event is n
					// we don't push this directly to t.node because sometimes we are just asking what
					// the target 'would be' (aka, calling findDispatchTarget from handleMouseOverOut)
					t.eventNode = n;
					break;
				}
				n = n.parentNode;
			}
		} catch(x) {
			logger.log(x, n);
		}
		return t;
	},

	/**
	* Returns the default Enyo control for events.
	*
	* @private
	*/
	findDefaultTarget: function() {
		return master;
	},

	/**
	* @private
	*/
	dispatchBubble: function(e, c) {
		var type = e.type;
		type = e.customEvent ? type : 'on' + type;
		return c.bubble(type, e, c);
	}
};

/**
* Called in the context of an event.
*
* @name module:enyo/dispatcher.iePreventDefault
* @static
* @method
* @private
*/
dispatcher.iePreventDefault = function() {
	try {
		this.returnValue = false;
	}
	catch(e) {
		// do nothing
	}
};

/**
* @private
*/
function dispatch (inEvent) {
	return dispatcher.dispatch(inEvent);
}

/**
* @name module:enyo/dispatcher.bubble
* @static
* @method
* @private
*/
dispatcher.bubble = function(inEvent) {
	if (inEvent) {
		dispatcher.dispatch(inEvent);
	}
};

// This string is set on event handlers attributes for DOM elements that
// don't normally bubble (like onscroll) so that they can participate in the
// Enyo event system.
dispatcher.bubbler = 'enyo.bubble(arguments[0])';

// The code below helps make Enyo compatible with Google Packaged Apps
// Content Security Policy(http://developer.chrome.com/extensions/contentSecurityPolicy.html),
// which, among other things, forbids the use of inline scripts.
// We replace online scripting with equivalent means, leaving dispatcher.bubbler
// for backward compatibility.
(function() {
	var bubbleUp = function() {
		dispatcher.bubble(arguments[0]);
	};

	/**
	* Makes given events bubble on a specified Enyo control.
	*
	* @name: module:enyo/dispatcher.makeBubble
	* @method
	* @private
	*/
	dispatcher.makeBubble = function() {
		var args = Array.prototype.slice.call(arguments, 0),
			control = args.shift();

		if((typeof control === 'object') && (typeof control.hasNode === 'function')) {
			utils.forEach(args, function(event) {
				if(this.hasNode()) {
					dispatcher.listen(this.node, event, bubbleUp);
				}
			}, control);
		}
	};

	/**
	* Removes the event listening and bubbling initiated by
	* [makeBubble()]{@link module:enyo/dispatcher.makeBubble} on a specific control.
	*
	* @name: module:enyo/dispatcher.unmakeBubble
	* @method
	* @private
	*/
	dispatcher.unmakeBubble = function() {
		var args = Array.prototype.slice.call(arguments, 0),
			control = args.shift();

		if((typeof control === 'object') && (typeof control.hasNode === 'function')) {
			utils.forEach(args, function(event) {
				if(this.hasNode()) {
					dispatcher.stopListening(this.node, event, bubbleUp);
				}
			}, control);
		}
	};
})();

/**
* @private
*/
// FIXME: we need to create and initialize dispatcher someplace else to allow overrides
Dom.requiresWindow(dispatcher.connect);

/**
* Generates a tapped event for a raw-click event.
*
* @private
*/
dispatcher.features.push(
	function (e) {
		if ('click' === e.type) {
			if (e.clientX === 0 && e.clientY === 0 && !e.detail) {
				// this allows the click to dispatch as well
				// but note the tap event will fire first
				var cp = utils.clone(e);
				cp.type = 'tap';
				cp.preventDefault = utils.nop;
				dispatcher.dispatch(cp);
			}
		}
	}
);

/**
* Instead of having multiple `features` pushed and handled in separate methods
* for these events, we handle them uniformly here to expose the last known
* interaction coordinates as accurately as possible.
*
* @private
*/
var _xy = {};
dispatcher.features.push(
	function (e) {
		if (
			(e.type == 'mousemove')  ||
			(e.type == 'tap')        ||
			(e.type == 'click')      ||
			(e.type == 'touchmove')
		) {
			var evt = (e.type == 'touchmove') ? e.touches[0] : e;
			_xy.clientX = evt.clientX;
			_xy.clientY = evt.clientY;
			// note only ie8 does not support pageX/pageY
			_xy.pageX   = evt.pageX;
			_xy.pageY   = evt.pageY;
			// note ie8 and opera report these values incorrectly
			_xy.screenX = evt.screenX;
			_xy.screenY = evt.screenY;
		}
	}
);

/**
* Retrieves the last known coordinates of the cursor or user-interaction point
* in touch environments. Returns an immutable object with the `clientX`,
* `clientY`, `pageX`, `pageY`, `screenX`, and `screenY` properties. It is
* important to note that IE8 and Opera have improper reporting for the
* `screenX` and `screenY` properties (they both use CSS pixels as opposed to
* device pixels).
*
* @returns {module:enyo/dispatcher~CursorCoordinates} An [object]{@glossary Object} describing the
*	the last known coordinates of the cursor or user-interaction point in touch environments.
* @public
*/
dispatcher.getPosition = function () {
	return utils.clone(_xy);
};


/**
* Key mapping feature: Adds a `keySymbol` property to key [events]{@glossary event},
* based on a global key mapping. Use
* [registerKeyMap()]{@link module:enyo/dispatcher.registerKeyMap} to add
* keyCode-to-keySymbol mappings via a simple hash. This method may be called
* multiple times from different libraries to mix different maps into the global
* mapping table; if conflicts arise, the last-in wins.
*
* ```
* dispatcher.registerKeyMap({
* 	415 : 'play',
* 	413 : 'stop',
* 	19  : 'pause',
* 	412 : 'rewind',
* 	417 : 'fastforward'
* });
* ```
*
* @private
*/
dispatcher.features.push(function(e) {
	if ((e.type === 'keydown') || (e.type === 'keyup') || (e.type === 'keypress')) {
		e.keySymbol = this.keyMap[e.keyCode];
		// Dispatch key events to be sent via Signals
		var c = this.findDefaultTarget();
		if (e.dispatchTarget !== c) {
			this.dispatchBubble(e, c);
		}
	}
});

utils.mixin(dispatcher, {
	keyMap: {},
	registerKeyMap: function(map) {
		utils.mixin(this.keyMap, map);
	}
});


/**
* Event modal capture feature. Capture events to a specific control via
* [capture(inControl, inShouldForward)]{@linkcode module:enyo/dispatcher.capture};
* release events via [release()]{@link module:enyo/dispatcher.release}.
*
* @private
*/
dispatcher.features.push(function(e) {
	if (this.captureTarget) {
		var c = e.dispatchTarget;
		var eventName = (e.customEvent ? '' : 'on') + e.type;
		var handlerName = this.captureEvents[eventName];
		var handlerScope = this.captureHandlerScope || this.captureTarget;
		var handler = handlerName && handlerScope[handlerName];
		var shouldCapture = handler && !(c && c.isDescendantOf && c.isDescendantOf(this.captureTarget));
		if (shouldCapture) {
			var c1 = e.captureTarget = this.captureTarget;
			// NOTE: We do not want releasing capture while an event is being processed to alter
			// the way the event propagates. Therefore decide if the event should forward
			// before the capture target receives the event (since it may release capture).
			e.preventDispatch = handler && handler.apply(handlerScope, [c1, e]) && !this.autoForwardEvents[e.type];
		}
	}
});

//
//        NOTE: This object is a plug-in; these methods should
//        be called on `enyo/dispatcher`, and not on the plug-in itself.
//
utils.mixin(dispatcher, {

	/**
	* @private
	*/
	autoForwardEvents: {leave: 1, resize: 1},

	/**
	* @private
	*/
	captures: [],

	/**
	* Captures [events]{@glossary event} for `inTarget`, where `inEvents` is specified as a
	* hash of event names mapped to callback handler names to be called on `inTarget` (or,
	* optionally, `inScope`). The callback is called when any of the captured events are
	* dispatched outside of the capturing control. Returning `true` from the callback stops
	* dispatch of the event to the original `dispatchTarget`.
	*
	* @private
	*/
	capture: function(inTarget, inEvents, inScope) {
		var info = {target: inTarget, events: inEvents, scope: inScope};
		this.captures.push(info);
		this.setCaptureInfo(info);
	},

	/**
	* Removes the specified target from the capture list.
	*
	* @private
	*/
	release: function(inTarget) {
		for (var i = this.captures.length - 1; i >= 0; i--) {
			if (this.captures[i].target === inTarget) {
				this.captures.splice(i,1);
				this.setCaptureInfo(this.captures[this.captures.length-1]);
				break;
			}
		}
	},

	/**
	* Sets the information for a captured {@glossary event}.
	*
	* @private
	*/
	setCaptureInfo: function(inInfo) {
		this.captureTarget = inInfo && inInfo.target;
		this.captureEvents = inInfo && inInfo.events;
		this.captureHandlerScope = inInfo && inInfo.scope;
	}
});


(function () {
	/**
	* Dispatcher preview feature
	*
	* Allows {@link module:enyo/Control~Control} ancestors of the {@glossary event} target
	* a chance (eldest first) to react by implementing `previewDomEvent`.
	*
	* @todo Revisit how/if we document this
	* @private
	*/
	var fn = 'previewDomEvent';
	var preview = {

		feature: function(e) {
			preview.dispatch(e, e.dispatchTarget);
		},

		/*
		* @returns {(Boolean|undefined)} Handlers return `true` to abort preview and prevent default
		*	event processing.
		*/
		dispatch: function(evt, control) {
			var i, l,
			lineage = this.buildLineage(control);
			for (i=0; (l=lineage[i]); i++) {
				if (l[fn] && l[fn](evt) === true) {
					evt.preventDispatch = true;
					return;
				}
			}
		},

		/*
		* We ascend, making a list of Enyo [controls]{@link module:enyo/Control~Control}.
		*
		* Note that a control is considered to be its own ancestor.
		*/
		buildLineage: function(control) {
			var lineage = [],
				c = control;
			while (c) {
				lineage.unshift(c);
				c = c.parent;
			}
			return lineage;
		}
	};

	dispatcher.features.push(preview.feature);
})();

},{'./logger':'enyo/logger','./master':'enyo/master','./utils':'enyo/utils','./dom':'enyo/dom'}],'enyo/UiComponent':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/UiComponent~UiComponent} kind.
* @module enyo/UiComponent
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	master = require('./master');

var
	Component = require('./Component');

/**
* The configurable options used by {@link module:enyo/UiComponent~UiComponent} when updating
* components.
*
* @typedef {Object} enyo/UiComponent~UiComponent~UpdateComponentsOptions
* @property {Boolean} [silent] - If `true`, component properties will be updated silently i.e. they
*	will be set directly, rather than via the generic `set` method.
*/

/**
* {@link module:enyo/UiComponent~UiComponent} implements a container strategy suitable for presentation layers.
*
* `UiComponent` itself is abstract. Concrete [subkinds]{@glossary subkind} include
* {@link module:enyo/Control~Control} (for HTML/DOM) and
* {@link module:canvas/Control~Control} (for Canvas contexts).
*
* @class UiComponent
* @extends module:enyo/Component~Component
* @public
*/
var UiComponent = module.exports = kind(
	/** @lends module:enyo/UiComponent~UiComponent.prototype */ {

	name: 'enyo.UiComponent',

	/**
	* @private
	*/
	kind: Component,

	statics:
		/** @lends module:enyo/UiComponent~UiComponent */ {

		/**
		* The default set of keys which are effectively "ignored" when determining whether or not
		* the this control has changed in such a way that warrants a complete re-render. When
		* {@link module:enyo/UiComponent~UiComponent#updateComponents} is invoked on a parent
		* component, this set of stateful keys is utilized by default, if no stateful keys are
		* provided by us.
		*
		* @type {String[]}
		* @default ['content', active', 'disabled']
		* @private
		*/
		statefulKeys: [
			'content',
			'active',
			'disabled'
		],

		/**
		* Finds static properties by walking up the inheritance chain, until the property is found.
		* By default this will return the property from {@link module:enyo/UiComponent} if the
		* property is not found anywhere along the chain.
		*
		* @param {module:enyo/kind} kind - The kind which we are attempting to retrieve the property
		*	from; if the property is not found on this kind, its parent kind will be examined.
		* @param {String} prop - The property we are trying to retrieve.
		* @returns {String[]} The array of stateful key strings.
		* @public
		*/
		findStatic: function (kind, prop) {
			if (kind) {
				if (kind[prop]) return kind[prop];
				return UiComponent.findStatic(kind.kind, prop);
			} else {
				return UiComponent[prop];
			}
		}
	},

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/UiComponent~UiComponent.prototype */ {

		/**
		* The [UiComponent]{@link module:enyo/UiComponent~UiComponent} that physically contains this
		* [component]{@link module:enyo/Component~Component} in the DOM.
		*
		* @type {module:enyo/UiComponent~UiComponent}
		* @default null
		* @public
		*/
		container: null,

		/**
		* The [UiComponent]{@link module:enyo/UiComponent~UiComponent} that owns this
		* [component]{@link module:enyo/Component~Component} for purposes of {@glossary event}
		* propagation.
		*
		* @type {module:enyo/UiComponent~UiComponent}
		* @default null
		* @public
		*/
		parent: null,

		/**
		* The [UiComponent]{@link module:enyo/UiComponent~UiComponent} that will physically contain new items added
		* by calls to [createComponent()]{@link module:enyo/UiComponent~UiComponent#createComponent}.
		*
		* @type {String}
		* @default 'client'
		* @public
		*/
		controlParentName: 'client',

		/**
		* A {@glossary kind} used to manage the size and placement of child
		* [components]{@link module:enyo/Component~Component}.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		layoutKind: ''
	},

	/**
	* @private
	*/
	handlers: {
		onresize: 'handleResize'
	},

	/**
	* When set, provides a [control]{@link module:enyo/Control~Control} reference used to indicate where a
	* newly-created [component]{@link module:enyo/Component~Component} should be added in the
	* [UiComponent's]{@link module:enyo/UiComponent~UiComponent} [array]{@glossary Array} of children. This is
	* typically used when creating children dynamically (rather than at design time). If set
	* to `null`, the new control will be added at the beginning of the array; if set to a
	* specific existing control, the new control will be added before the specified
	* control. If left as `undefined`, the default behavior is to add the new control
	* at the end of the array.
	*
	* @type {module:enyo/Control~Control}
	* @default undefined
	* @public
	*/
	addBefore: undefined,

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			this.controls = this.controls || [];
			this.children = this.children || [];
			this.containerChanged();
			sup.apply(this, arguments);
			this.layoutKindChanged();
		};
	}),

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			// Destroys all non-chrome controls (regardless of owner).
			this.destroyClientControls();
			// Removes us from our container.
			this.setContainer(null);
			// Destroys chrome controls owned by this.
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	importProps: kind.inherit(function (sup) {
		return function(inProps) {
			sup.apply(this, arguments);
			if (!this.owner) {
				this.owner = master;
			}
		};
	}),

	/**
	* Creates [components]{@link module:enyo/Component~Component} as defined by the [arrays]{@glossary Array}
	* of base and additional property [hashes]{@glossary Object}. The standard and
	* additional property hashes are combined as described in
	* {@link module:enyo/Component~Component#createComponent}.
	*
	* ```
	* // ask foo to create components 'bar' and 'zot', but set the owner of
	* // both components to 'this'.
	* this.$.foo.createComponents([
	*	{name: 'bar'},
	*	{name: 'zot'}
	* ], {owner: this});
	* ```
	*
	* As implemented, [controlParentName]{@link module:enyo/UiComponent~UiComponent#controlParentName} only works
	* to identify an owned control created via `createComponents()`
	* (i.e., usually in our `components` block). To attach a `controlParent` via other means,
	* one must call [discoverControlParent()]{@link module:enyo/UiComponent~UiComponent#discoverControlParent} or
	* set `controlParent` directly.
	*
	* We could call `discoverControlParent()` in
	* [addComponent()]{@link module:enyo/Component~Component#addComponent}, but that would
	* cause a lot of useless checking.
	*
	* @param {Object[]} props The array of {@link module:enyo/Component~Component} definitions to be created.
	* @param {Object} ext - Additional properties to be supplied as defaults for each.
	* @returns {module:enyo/Component~Component[]} The array of components that were created.
	* @method
	* @public
	*/
	//
	createComponents: kind.inherit(function (sup) {
		return function() {
			var results = sup.apply(this, arguments);
			this.discoverControlParent();
			return results;
		};
	}),

	/**
	* An alternative component update path that attempts to intelligently update only the
	* relevant portions of the component which have changed.
	*
	* @param {Object[]} props - An array of kind definitions to be set as the child components of
	*	this component.
	* @param {Object} [ext] - Additional properties to be supplied as defaults for components, when
	*	being created or recreated. These properties have no bearing on the diff computation of the
	*	child components.
	* @param {module:enyo/UiComponent~UpdateComponentsOptions} [opts] - Additional options for how
	*	the update operation should behave.
	* @returns {Boolean} - Whether or not the component should be re-rendered.
	* @wip
	* @public
	*/
	updateComponents: function (props, ext, opts) {
		var allStatefulKeys = {},
			isChanged = this.computeComponentsDiff(props, allStatefulKeys),
			prop, controls, control, keys, key, idxKey, idxProp, kind;

		if (isChanged) {
			this.destroyClientControls();
			this.createComponents(props, ext);
			return true;
		} else {
			controls = this.getClientControls();
			for (idxProp = 0; idxProp < props.length; idxProp++) {
				prop = props[idxProp];
				control = controls[idxProp];
				kind = prop.kind || this.defaultKind;
				keys = allStatefulKeys[idxProp];

				for (idxKey = 0; idxKey < keys.length; idxKey++) { // for each key, determine if there is a change
					key = keys[idxKey];
					if (prop[key] != control[key]) {
						if (opts && opts.silent) control[key] = prop[key];
						else control.set(key, prop[key]);
					}
				}
			}
		}

		return false;
	},

	/**
	* @private
	*/
	computeComponentsDiff: function (comps, allStatefulKeys) {
		var hash = this.computeComponentsHash(comps, allStatefulKeys),
			isChanged = false;

		if (this._compHash) isChanged = this._compHash != hash;
		else isChanged = true;

		this._compHash = hash;

		return isChanged;
	},

	/**
	* @private
	*/
	computeComponentsHash: function (comps, allStatefulKeys) {
		var keyCount = 0,
			hash, str, filtered, chr, len, idx;

		// http://jsperf.com/json-parse-and-iteration-vs-array-map
		filtered = comps.map(this.bindSafely(function (comp, itemIdx) {
			var kind = comp.kind || this.defaultKind,
				keys = UiComponent.findStatic(kind, 'statefulKeys'),
				objKeys = Object.keys(comp),
				obj = {},
				idx, key, value;

			allStatefulKeys[itemIdx] = keys; // cache statefulKeys

			for (idx = 0; idx < objKeys.length; idx++) {
				key = objKeys[idx];

				if (keys.indexOf(key) == -1) { // ignore stateful keys
					value = comp[key];
					if (typeof value == 'function') value = (value.prototype && value.prototype.kindName) || value.toString();
					obj[key] = value;
					keyCount++;
				}

			}

			return obj;
		}));

		// Adapted from http://stackoverflow.com/a/7616484
		str = JSON.stringify(filtered) + keyCount;
		hash = 0;

		for (idx = 0, len = str.length; idx < len; idx++) {
			chr = str.charCodeAt(idx);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}

		return hash;
	},

	/**
	* Determines and sets the current [control's]{@link module:enyo/Control~Control} parent.
	*
	* @protected
	*/
	discoverControlParent: function () {
		this.controlParent = this.$[this.controlParentName] || this.controlParent;
	},

	/**
	* @method
	* @private
	*/
	adjustComponentProps: kind.inherit(function (sup) {
		return function(inProps) {
			// Components we create have us as a container by default.
			inProps.container = inProps.container || this;
			sup.apply(this, arguments);
		};
	}),

	/**
	* Containment
	*
	* @method
	* @private
	*/
	containerChanged: function (container) {
		if (container) {
			container.removeControl(this);
		}
		if (this.container) {
			this.container.addControl(this, this.addBefore);
		}
	},

	/**
	* Parentage
	*
	* @method
	* @private
	*/
	parentChanged: function (oldParent) {
		if (oldParent && oldParent != this.parent) {
			oldParent.removeChild(this);
		}
	},

	/**
	* Determines whether the [control]{@link module:enyo/Control~Control} is a descendant of
	* another control.
	*
	* Note: Oddly, a control is considered to be a descendant of itself.
	*
	* @method
	* @param {module:enyo/Control~Control} ancestor - The [control]{@link module:enyo/Control~Control} whose lineage
	*	will be checked to determine whether the current control is a descendant.
	* @public
	*/
	isDescendantOf: function (ancestor) {
		var p = this;
		while (p && p!=ancestor) {
			p = p.parent;
		}
		return ancestor && (p === ancestor);
	},

	/**
	* Returns all controls.
	*
	* @method
	* @returns {module:enyo/Control~Control[]} An [array]{@glossary Array} of [controls]{@link module:enyo/Control~Control}.
	* @public
	*/
	getControls: function () {
		return this.controls;
	},

	/**
	* Returns all non-chrome controls.
	*
	* @method
	* @returns {module:enyo/Control~Control[]} An [array]{@glossary Array} of [controls]{@link module:enyo/Control~Control}.
	* @public
	*/
	getClientControls: function () {
		var results = [];
		for (var i=0, cs=this.controls, c; (c=cs[i]); i++) {
			if (!c.isChrome) {
				results.push(c);
			}
		}
		return results;
	},

	/**
	* Destroys "client controls", the same set of [controls]{@link module:enyo/Control~Control} returned by
	* [getClientControls()]{@link module:enyo/UiComponent~UiComponent#getClientControls}.
	*
	* @method
	* @public
	*/
	destroyClientControls: function () {
		var c$ = this.getClientControls();
		for (var i=0, c; (c=c$[i]); i++) {
			c.destroy();
		}
	},

	/**
	* @method
	* @private
	*/
	addControl: function (ctl, before) {
		// Called to add an already created control to the object's control list. It is
		// not used to create controls and should likely not be called directly.
		// It can be overridden to detect when controls are added.
		if (before !== undefined) {
			var idx = (before === null) ? 0 : this.indexOfControl(before);
			this.controls.splice(idx, 0, ctl);
		} else {
			this.controls.push(ctl);
		}
		// When we add a Control, we also establish a parent.
		this.addChild(ctl, before);
	},

	/**
	* @method
	* @private
	*/
	removeControl: function (ctl) {
		// Called to remove a control from the object's control list. As with addControl it
		// can be overridden to detect when controls are removed.
		// When we remove a Control, we also remove it from its parent.
		ctl.setParent(null);
		return utils.remove(ctl, this.controls);
	},

	/**
	* @method
	* @private
	*/
	indexOfControl: function (ctl) {
		return utils.indexOf(ctl, this.controls);
	},

	/**
	* @method
	* @private
	*/
	indexOfClientControl: function (ctl) {
		return utils.indexOf(ctl, this.getClientControls());
	},

	/**
	* @method
	* @private
	*/
	indexInContainer: function () {
		return this.container.indexOfControl(this);
	},

	/**
	* @method
	* @private
	*/
	clientIndexInContainer: function () {
		return this.container.indexOfClientControl(this);
	},

	/**
	* @method
	* @private
	*/
	controlAtIndex: function (idx) {
		return this.controls[idx];
	},

	/**
	* Determines what the following sibling [control]{@link module:enyo/Control~Control} is for the current
	* [control]{@link module:enyo/Control~Control}.
	*
	* @method
	* @returns {module:enyo/Control~Control | null} The [control]{@link module:enyo/Control~Control} that is the] following
	*	sibling. If no following sibling exists, we return `null`.
	* @public
	*/
	getNextControl: function () {
		var comps = this.getParent().children,
			comp,
			sibling,
			i;

		for (i = comps.length - 1; i >= 0; i--) {
			comp = comps[i];
			if (comp === this) return sibling ? sibling : null;
			if (comp.generated) sibling = comp;
		}

		return null;
	},

	/**
	* Children
	*
	* @method
	* @private
	*/
	addChild: function (child, before) {
		// if before is undefined, add to the end of the child list.
		// If it's null, add to front of list, otherwise add before the
		// specified control.
		//
		// allow delegating the child to a different container
		if (this.controlParent /*&& !child.isChrome*/) {
			// this.controlParent might have a controlParent, and so on; seek the ultimate parent
			this.controlParent.addChild(child, before);
		} else {
			// NOTE: addChild drives setParent.
			// It's the opposite for setContainer, where containerChanged (in Containable)
			// drives addControl.
			// Because of the way 'parent' is derived from 'container', this difference is
			// helpful for implementing controlParent.
			// By the same token, since 'parent' is derived from 'container', setParent is
			// not intended to be called by client code. Therefore, the lack of parallelism
			// should be private to this implementation.
			// Set the child's parent property to this
			child.setParent(this);
			// track in children array
			if (before !== undefined) {
				var idx = (before === null) ? 0 : this.indexOfChild(before);
				this.children.splice(idx, 0, child);
			} else {
				this.children.push(child);
			}
		}
	},

	/**
	* @method
	* @private
	*/
	removeChild: function (child) {
		return utils.remove(child, this.children);
	},

	/**
	* @method
	* @private
	*/
	indexOfChild: function (child) {
		return utils.indexOf(child, this.children);
	},

	/**
	* @method
	* @private
	*/
	layoutKindChanged: function () {
		if (this.layout) {
			this.layout.destroy();
		}
		this.layout = kind.createFromKind(this.layoutKind, this);
		if (this.generated) {
			this.render();
		}
	},

	/**
	* @method
	* @private
	*/
	flow: function () {
		if (this.layout) {
			this.layout.flow();
		}
	},

	/**
	* CAVEAT: currently we use the entry point for both post-render layout work *and*
	* post-resize layout work.
	* @method
	* @private
	*/
	reflow: function () {
		if (this.layout) {
			this.layout.reflow();
		}
	},

	/**
	* Call after this [control]{@link module:enyo/Control~Control} has been resized to allow it to process the
	* size change. To respond to a resize, override `handleResize()` instead. Acts as syntactic
	* sugar for `waterfall('onresize')`.
	*
	* @method
	* @public
	*/
	resize: function () {
		this.waterfall('onresize');
		this.waterfall('onpostresize');
	},

	/**
	* @method
	* @private
	*/
	handleResize: function () {
		// FIXME: once we are in the business of reflowing layouts on resize, then we have an
		// inside/outside problem: some scenarios will need to reflow before child
		// controls reflow, and some will need to reflow after. Even more complex scenarios
		// have circular dependencies, and can require multiple passes or other resolution.
		// When we can rely on CSS to manage reflows we do not have these problems.
		this.reflow();
	},

	/**
	* Sends a message to all of my descendants, but not myself. You can stop a
	* [waterfall]{@link module:enyo/Component~Component#waterfall} into [components]{@link module:enyo/Component~Component}
	* owned by a receiving [object]{@glossary Object} by returning a truthy value from the
	* {@glossary event} [handler]{@link module:enyo/Component~Component~EventHandler}.
	*
	* @method
	* @param {String} nom - The name of the {@glossary event}.
	* @param {Object} [event] - The event object to pass along.
	* @param {module:enyo/Component~Component} [sender=this] - The event's originator.
	* @returns {this} The callee for chaining.
	* @public
	*/
	waterfallDown: function (nom, event, sender) {
		event = event || {};
		// Note: Controls will generally be both in a $ hash and a child list somewhere.
		// Attempt to avoid duplicated messages by sending only to components that are not
		// UiComponent, as those components are guaranteed not to be in a child list.
		// May cause a problem if there is a scenario where a UiComponent owns a pure
		// Component that in turn owns Controls.
		//
		// waterfall to all pure components
		for (var n in this.$) {
			if (!(this.$[n] instanceof UiComponent)) {
				this.$[n].waterfall(nom, event, sender);
			}
		}
		// waterfall to my children
		for (var i=0, cs=this.children, c; (c=cs[i]); i++) {
			c.waterfall(nom, event, sender);
		}
	},

	/**
	* @method
	* @private
	*/
	getBubbleTarget: function (nom, event) {
		if (event.delegate) return this.owner;
		else {
			return (
				this.bubbleTarget
				|| (this.cachedBubble && this.cachedBubbleTarget[nom])
				|| this.parent
				|| this.owner
			);
		}
	},

	/**
	* @method
	* @private
	*/
	bubbleTargetChanged: function (was) {
		if (was && this.cachedBubble && this.cachedBubbleTarget) {
			for (var n in this.cachedBubbleTarget) {
				if (this.cachedBubbleTarget[n] === was) delete this.cachedBubbleTarget[n];
			}
		}
	}
});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./master':'enyo/master','./Component':'enyo/Component'}],'enyo/History':[function (module,exports,global,require,request){
/**
* The enyo/History singleton is a specialized application history manager.
* It is built on top of the standard HTML5 History API and centrally manages
* interactions with that API to reduce the likelihood that "competing" uses
* of the API within a single app will conflict, causing unpredictable behavior.
*
* CAUTION: This API is experimental. It is likely to change or to be removed
* altogether in a future release.
*
* @module enyo/History
* @wip
*/

/**
* Passed to {@link module:enyo/History#push} to add a new history entry and passed as the first
* argument to {@link module:enyo/History~HistoryEntry#handler} when the entry is popped. Additional
* properties beyond those defined here may be included to provide additional data to the handler.
*
* @example
* var
* 	EnyoHistory = require('enyo/History');
*
* EnyoHistory.push({
* 	handler: function (entry) {
* 		console.log('Entry added at ', entry.time, 'and popped at', Date.now());
* 	},
* 	time: Date.now()
* });
*
* @typedef {Object} module:enyo/History~HistoryEntry
* @property {Function|String} handler - Function called when this history entry is popped. May
* 	either be a Function or the name of a function on `context`.
* @property {Object} [context] - Context on which `handler` is bound
* @property {String} [location] - When {@link module:enyo/History#isSupported} is `true`, updates
* 	the displayed URL. Must be within the same origin.
*/

var
	dispatcher = require('enyo/dispatcher'),
	kind = require('enyo/kind'),
	utils = require('enyo/utils'),
	Component = require('enyo/Component'),
	Signals = require('enyo/Signals');

var
	// App history, ordered from oldest to newest.
	_history = [],

	// History actions that were queued because a back operation was in progress. These will be
	// dequeued when the next popstate event is handled
	_queue = [],

	// Indicates the number of steps 'back' in history requested
	_popQueueCount = 0,

	// `true` if a push action has been enqueued
	_pushQueued = false,

	// Track if we're in the midst of handling a pop
	_processing = false,

	// If history were disabled or clear called during processing, we can't continue to process the
	// queue which will need to resume after the clear processes.
	_abortQueueProcessing = false,

	// `true` if the platform support the HTML5 History API
	_supports = !!global.history.pushState;

var EnyoHistory = module.exports = kind.singleton(
	/** @lends module:enyo/History~History.prototype */ {

	/**
	* @private
	*/
	kind: Component,

	/**
	* When enabled, enyo/History will handle onpopstate events and notify controls when their
	* history entry is popped.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	enabled: true,

	/**
	* When true, the browser's history will be updated when history entries are added or removed. If
	* the platform does not support this feature, the value will always be false. The default is
	* true if supported by the platform and false otherwise.
	*
	* @type {Boolean}
	* @private
	*/
	updateHistory: _supports,

	/**
	* @private
	*/
	components: [
		{kind: Signals,  onkeyup: 'handleKeyUp'}
	],

	/**
	* @private
	*/
	enabledChanged: function () {
		// reset private members
		if (!this.enabled) this.clear();
	},

	/**
	* Resets the value to false if the platform does not support the History API
	*
	* @private
	*/
	updateHistoryChanged: function () {
		this.updateHistory = this.updateHistory && _supports;
	},

	// Public methods

	/**
	* Adds a new history entry
	*
	* @param  {module:enyo/History~HistoryEntry} entry Object describing the history entry
	*
	* @public
	*/
	push: function (entry) {
		if (this.enabled) {
			if (_popQueueCount) {
				this.enqueuePush(entry);
			} else {
				this.pushEntry(entry);
			}
		}
	},

	/**
	* Asynchronously removes `count` entries from the history invoking the callback for each if it
	* exists.
	*
	* @param  {Number} count Number of entries to remove
	*
	* @oublic
	*/
	pop: function (count) {
		if (!this.enabled) return;
		this.enqueuePop('pop', count);
	},

	/**
	* Asynchronously removes `count` entries from the history without invoking the callbacks for
	* each.
	*
	* @param  {Number} count Number of entries to remove
	*
	* @public
	*/
	drop: function (count) {
		if (!this.enabled) return;
		this.enqueuePop('drop', count);
	},

	/**
	* Returns the latest history entry without removing it.
	*
	* @return {module:enyo/History~HistoryEntry}
	* @public
	*/
	peek: function () {
		return _history[_history.length - 1];
	},

	/**
	* Clears all history entries without calling their respective handlers. When the
	* entries are popped, the internal history will be empty and the browser history will be
	* reset to the state when this module started tracking the history.
	*
	* @public
	*/
	clear: function () {
		var ql = _queue.length,
			hl = _history.length;

		_popQueueCount = 0;
		_pushQueued = false;
		_abortQueueProcessing = _processing;
		_processing = false;
		if (ql) _queue.splice(0, ql);
		if (hl) this.drop(hl);
	},

	/**
	* Returns `true` when enyo/History is currently handling a popstate event and invoking the
	* callbacks for any popped entries.
	*
	* @return {Boolean}
	* @public
	*/
	isProcessing: function () {
		return _processing;
	},

	/**
	* Returns `true` when the HTML5 history API is supported by the platform
	*
	* @return {Boolean}
	* @public
	*/
	isSupported: function () {
		return _supports;
	},

	// Private methods

	/**
	* Handles flushing the history action queus and processing each entry. When the queues are
	* empty and a popstate event occurs, this pops the next entry and processes it.
	*
	* @param  {Object} state Value of the state member of the PopStateEvent
	*
	* @private
	*/
	processState: function (state) {
		_processing = true;
		if (_queue.length) {
			this.processQueue();
		} else if (_history.length) {
			this.processPopEntry(_history.pop());
		}
		_processing = false;
	},

	/**
	* Processes any queued actions
	*
	* @private
	*/
	processQueue: function () {
		var next, i, entries;

		this.silencePushEntries();

		while (_queue.length && !_abortQueueProcessing) {
			next = _queue.shift();

			if (next.type === 'push') {
				this.pushEntry(next.entry, next.silenced);
			} else {
				_popQueueCount -= next.count;
				entries = _history.splice(_history.length - next.count, next.count);
				// if a 'pop' was requested
				if (next.type == 'pop') {
					// iterate the requested number of history entries
					for (i = entries.length - 1; i >= 0; --i) {
						// and call each handler if it exists
						this.processPopEntry(entries[i]);
					}
				}
				// otherwise we just drop the entries and do nothing
			}
		}
		if (_abortQueueProcessing) {
			_abortQueueProcessing = false;
		} else {
			_popQueueCount = 0;
			_pushQueued = false;
		}
	},

	/**
	* Marks any queued push entries as silenced that would be popped by a subsequent queued pop or
	* drop entry.
	*
	* @private
	*/
	silencePushEntries: function () {
		var i, next,
			silence = 0;

		for (i = _queue.length - 1; i >= 0; --i) {
			next = _queue[i];
			if (next.type == 'push') {
				if (silence) {
					silence -= 1;
					next.silenced = true;
				} else {
					next.silenced = false;
				}
			} else {
				silence += next.count;
			}
		}
	},

	/**
	* Invokes the callback for a pop entry
	*
	* @param  {module:enyo/History~HistoryEntry} entry
	*
	* @private
	*/
	processPopEntry: function (entry) {
		if (entry.handler) {
			utils.call(entry.context, entry.handler, [entry]);
		}
	},

	/**
	* Adds an pop or drop entry to the history queue
	*
	* @param  {String} type  History action type ('pop' or 'drop')
	* @param  {Number} [count] Number of actions to invoke. Defaults to 1.
	*
	* @private
	*/
	enqueuePop: function (type, count) {
		count = count || 1;
		this.addToQueue({type: type, count: count});
		// if we've only queued pop/drop events, we need to increment the number of entries to go
		// back. once a push is queued, the history must be managed in processState.
		if (!_pushQueued) {
			_popQueueCount += count;
		}
		if (_queue.length === 1) {
			// defer the actual 'back' action so pop() or drop() can be called multiple times in the
			// same frame. Otherwise, only the first go() would be observed.
			this.startJob('history.go', function () {
				// If we are able to and supposed to update history and there are pending pops
				if (this.updateHistory && _popQueueCount > 0) {
					// go back that many entries
					global.history.go(-_popQueueCount);
				} else {
					// otherwise we'll start the processing
					this.handlePop({
						state: this.peek()
					});
				}
			});
		}
	},

	/**
	* Adds a push entry to the history queue
	*
	* @param  {module:enyo/History~HistoryEntry} entry
	*
	* @private
	*/
	enqueuePush: function (entry) {
		_pushQueued = true;
		this.addToQueue({type: 'push', entry: entry});
	},

	/**
	* When entries are added while processing the queue, the new entries should be added at the top
	* of the queue rather than the end because the queue is processed FIFO and the assumption of
	* adding them mid-process is that they are being added at the point in the queue processing in
	* which they are called.
	*
	* @private
	*/
	addToQueue: function (entry) {
		if (_processing) {
			_queue.unshift(entry);
			this.silencePushEntries();
		} else {
			_queue.push(entry);
		}
	},

	/**
	* Adds an new entry to the _history and pushes the new state to global.history (if supported)
	*
	* @param  {module:enyo/History~HistoryEntry} entry
	* @param  {Boolean} silenced Prevents pushing the state onto history when `true`
	*
	* @private
	*/
	pushEntry: function (entry, silenced) {
		var id = entry.context && entry.context.id || 'anonymous',
			location = entry.location || '';
		_history.push(entry);
		if (this.updateHistory && !silenced) {
			global.history.pushState({id: id}, '', location);
		}
	},

	/**
	* onpopstate handler
	*
	* @private
	*/
	handlePop: function (event) {
		if (this.enabled) {
			this.processState(event.state);
		}
	},

	/**
	* onkeyup handler
	*
	* @private
	*/
	handleKeyUp: function (sender, event) {
		var current = this.peek();
		if (event.keySymbol == 'back' && current && current.context.getShowing()) {
			this.pop();
		}
		return true;
	}

});

dispatcher.listen(global, 'popstate', EnyoHistory.handlePop.bind(EnyoHistory));
}],'enyo/resolution':[function (module,exports,global,require,request){
require('enyo');

var
	dispatcher = require('./dispatcher'),
	util = require('./utils'),
	Dom = require('./dom');

var _baseScreen,
	_orientation,
	_riRatio,
	_screenType,
	_screenTypes = [ {name: 'standard', pxPerRem: 16, width: global.innerWidth,  height: global.innerHeight, aspectRatioName: 'standard', base: true} ],	// Assign one sane value in case defineScreenTypes is never run.
	_screenTypeObject,
	_oldOrientation,
	_oldScreenTypeObject,
	configDefaults = {
		orientationHandling: 'normal'
	};


var getScreenTypeObject = function (type) {
	type = type || _screenType;
	if (_screenTypeObject && _screenTypeObject.name == type) {
		return _screenTypeObject;
	}
	return _screenTypes.filter(function (elem) {
		return (type == elem.name);
	})[0];
};

/**
* Resolution independence methods
* @module enyo/resolution
*/
var ri = module.exports = {
	config: {},

	/**
	* Sets up screen resolution scaling capabilities by defining an array of all the screens
	* being used. These should be listed in order from smallest to largest, according to
	* width.
	*
	* The `name`, `pxPerRem`, `width`, and `aspectRatioName` properties are required for
	* each screen type in the array. Setting `base: true` on a screen type marks it as the
	* default resolution, upon which everything else will be based.
	*
	* Executing this method also initializes the rest of the resolution-independence code.
	*
	* ```
	* var resolution = require('enyo/resolution');
	*
	* resolution.defineScreenTypes([
	* 	{name: 'vga',     pxPerRem: 8,  width: 640,  height: 480,  aspectRatioName: 'standard'},
	* 	{name: 'xga',     pxPerRem: 16, width: 1024, height: 768,  aspectRatioName: 'standard'},
	* 	{name: 'hd',      pxPerRem: 16, width: 1280, height: 720,  aspectRatioName: 'hdtv'},
	* 	{name: 'fhd',     pxPerRem: 24, width: 1920, height: 1080, aspectRatioName: 'hdtv', base: true},
	* 	{name: 'uw-uxga', pxPerRem: 24, width: 2560, height: 1080, aspectRatioName: 'cinema'},
	* 	{name: 'uhd',     pxPerRem: 48, width: 3840, height: 2160, aspectRatioName: 'hdtv'}
	* ]);
	* ```
	*
	* @param {Array} types - An array of objects containing screen configuration data, as in the
	* preceding example.
	* @public
	*/
	defineScreenTypes: function (types) {
		_screenTypes = types;
		for (var i = 0; i < _screenTypes.length; i++) {
			if (_screenTypes[i]['base']) _baseScreen = _screenTypes[i];
		}
		ri.init();
	},

	/**
	* Fetches the name of the screen type that best matches the current screen size. The best
	* match is defined as the screen type that is the closest to the screen resolution without
	* going over. ("The Price is Right" style.)
	*
	* @param {Object} [rez] - Optional measurement scheme. Must include `height` and `width` properties.
	* @returns {String} Screen type (e.g., `'fhd'`, `'uhd'`, etc.)
	* @public
	*/
	getScreenType: function (rez) {
		rez = rez || {
			height: global.innerHeight,
			width: global.innerWidth
		};
		var i,
			types = _screenTypes,
			bestMatch = types[types.length - 1].name,
			swap;

		_orientation = 'landscape';

		if (rez.height > rez.width) {
			_orientation = 'portrait';
			swap = rez.width;
			rez.width = rez.height;
			rez.height = swap;
		}

		// loop thorugh resolutions
		for (i = types.length - 1; i >= 0; i--) {
			// find the one that matches our current size or is smaller. default to the first.
			if (rez.width <= types[i].width) {
				bestMatch = types[i].name;
			}
		}
		// return the name of the resolution if we find one.
		return bestMatch;
	},

	/**
	* @private
	*/
	updateScreenBodyClasses: function (type) {
		type = type || _screenType;
		if (_oldOrientation) {
			Dom.removeBodyClass('enyo-orientation-' + _oldOrientation);
		}
		if (_oldScreenTypeObject) {
			Dom.removeBodyClass('enyo-res-' + _oldScreenTypeObject.name.toLowerCase());
			if (_oldScreenTypeObject.aspectRatioName) {
				Dom.removeBodyClass('enyo-aspect-ratio-' + _oldScreenTypeObject.aspectRatioName.toLowerCase());
			}
		}
		if (_orientation) {
			Dom.addBodyClass('enyo-orientation-' + _orientation);
		}
		if (type) {
			Dom.addBodyClass('enyo-res-' + type.toLowerCase());
			var scrObj = getScreenTypeObject(type);
			if (scrObj.aspectRatioName) {
				Dom.addBodyClass('enyo-aspect-ratio-' + scrObj.aspectRatioName.toLowerCase());
			}
			return type;
		}
	},

	/**
	* @private
	*/
	updateBaseFontSize: function (size) {
		document.documentElement.style.fontSize = size;
	},

	/**
	* @private
	*/
	getRiRatio: function (type) {
		type = type || _screenType;
		if (type && _baseScreen) {
			var ratio = this.getUnitToPixelFactors(type) / this.getUnitToPixelFactors(_baseScreen.name);
			if (type == _screenType) {
				// cache this if it's for our current screen type.
				_riRatio = ratio;
			}
			return ratio;
		}
		return 1;
	},

	/**
	* @private
	*/
	getUnitToPixelFactors: function (type) {
		type = type || _screenType;
		if (type) {
			return getScreenTypeObject(type).pxPerRem;
		}
		return 1;
	},

	/**
	* Calculates the aspect ratio of the specified screen type. If no screen type is provided,
	* the current screen type is used.
	*
	* @param {String} type - Screen type whose aspect ratio will be calculated. If no screen
	* type is provided, the current screen type is used.
	* @returns {Number} The calculated screen ratio (e.g., `1.333`, `1.777`, `2.333`, etc.)
	* @public
	*/
	getAspectRatio: function (type) {
		var scrObj = getScreenTypeObject(type);
		if (scrObj.width && scrObj.height) {
			return (scrObj.width / scrObj.height);
		}
		return 1;
	},

	/**
	* Returns the name of the aspect ratio for a specified screen type, or for the default
	* screen type if none is provided.
	*
	* @param {String} type - Screen type whose aspect ratio name will be returned. If no
	* screen type is provided, the current screen type will be used.
	* @returns {String} The name of the screen type's aspect ratio
	* @public
	*/
	getAspectRatioName: function (type) {
		var scrObj = getScreenTypeObject(type);
		 return scrObj.aspectRatioName || 'standard';
	},

	/**
	* Takes a provided pixel value and performs a scaling operation based on the current
	* screen type.
	*
	* @param {Number} px - The quantity of standard-resolution pixels to scale to the
	* current screen resolution.
	* @returns {Number} The scaled value based on the current screen scaling factor
	* @public
	*/
	scale: function (px) {
		return (_riRatio || this.getRiRatio()) * px;
	},

	/**
	* The default configurable [options]{@link module:enyo/resolution.selectSrc#options}.
	*
	* @typedef {Object} module:enyo/resolution.selectSrcSrc
	* @property {String} hd - HD / 720p Resolution image asset source URI/URL
	* @property {String} fhd - FHD / 1080p Resolution image asset source URI/URL
	* @property {String} uhd - UHD / 4K Resolution image asset source URI/URL
	*/

	/**
	* Selects the ideal image asset from a set of assets, based on various screen
	* resolutions: HD (720p), FHD (1080p), UHD (4k). When a `src` argument is
	* provided, `selectSrc()` will choose the best image with respect to the current
	* screen resolution. `src` may be either the traditional string, which will pass
	* straight through, or a hash/object of screen types and their asset sources
	* (keys:screen and values:src). The image sources will be used when the screen
	* resolution is less than or equal to the provided screen types.
	*
	* ```
	* // Take advantage of the multi-res mode
	* var
	* 	kind = require('enyo/kind'),
	* 	Image = require('enyo/Image');
	*
	* {kind: Image, src: {
	* 	'hd': 'http://lorempixel.com/64/64/city/1/',
	* 	'fhd': 'http://lorempixel.com/128/128/city/1/',
	* 	'uhd': 'http://lorempixel.com/256/256/city/1/'
	* }, alt: 'Multi-res'},
	*
	* // Standard string `src`
	* {kind: Image, src: http://lorempixel.com/128/128/city/1/', alt: 'Large'},
	* ```
	*
	* @param {(String|module:enyo/resolution~selectSrcSrc)} src - A string containing
	* a single image source or a key/value hash/object containing keys representing screen
	* types (`'hd'`, `'fhd'`, `'uhd'`, etc.) and values containing the asset source for
	* that target screen resolution.
	* @returns {String} The chosen source, given the string or hash provided
	* @public
	*/
	selectSrc: function (src) {
		if (typeof src != 'string' && src) {
			var i, t,
				newSrc = src.fhd || src.uhd || src.hd,
				types = _screenTypes;

			// loop through resolutions
			for (i = types.length - 1; i >= 0; i--) {
				t = types[i].name;
				if (_screenType == t && src[t]) newSrc = src[t];
			}

			src = newSrc;
		}
		return src;
	},

	/**
	* Calculate the base rem font size. This is how the magic happens. This accepts an
	* optional screenType name. If one isn't provided, the currently detected screen type is used.
	* This uses the config option "orientationHandling", which when set to "scale" and the screen is
	* in portrait orientation, will dynamically calculate what the base font size should be, if the
	* width were proportionally scaled down to fit in the portrait space.
	*
	* To use, put the following in your application code:
	* ```
	* 	var RI = require('moonstone/resolution');
	*
	* 	RI.config.orientationHandling = 'scale';
	* 	RI.init();
	* ```
	*
	* This has no effect if the screen is in landscape, or if orientationHandling is unset.
	*
	* @param {String} type - Screen type to base size the calculation on. If no
	*     screen type is provided, the current screen type will be used.
	* @returns {String} The calculated pixel size (with unit suffix. Ex: "24px").
	* @public
	*/
	calculateFontSize: function (type) {
		var size,
			scrObj = getScreenTypeObject(type);

		if (_orientation == 'portrait' && this.config.orientationHandling == 'scale') {
			size = scrObj.height / scrObj.width * scrObj.pxPerRem;
		} else {
			size = scrObj.pxPerRem;
		}
		return size + 'px';
	},

	/**
	* This will need to be re-run any time the screen size changes, so all the values can be
	* re-cached.
	*
	* @public
	*/
	// Later we can wire this up to a screen resize event so it doesn't need to be called manually.
	init: function () {
		_oldScreenTypeObject = _screenTypeObject;
		_oldOrientation = _orientation;
		_screenType = this.getScreenType();
		_screenTypeObject = getScreenTypeObject();
		this.updateScreenBodyClasses();
		Dom.unitToPixelFactors.rem = this.getUnitToPixelFactors();
		_riRatio = this.getRiRatio();
		this.updateBaseFontSize(this.calculateFontSize());
	}
};

ri.config = util.clone(configDefaults);
ri.init();

// We need to re-initialize the resolution config before any components receive their resize event
// and calculate any resolution-dependent values. There's currently no means in dispatcher to jump
// the line before enyo/master other than features.
dispatcher.features.push(function (ev) {
	if (ev.type === 'resize') {
		ri.init();
	}
});

},{'./dispatcher':'enyo/dispatcher','./utils':'enyo/utils','./dom':'enyo/dom'}],'enyo/AccessibilitySupport':[function (module,exports,global,require,request){
/**
* Mixin for adding WAI-ARIA attributes to controls
*
* @module enyo/AccessibilitySupport
*/

var
	dispatcher = require('../dispatcher'),
	kind = require('../kind'),
	platform = require('../platform'),
	utils = require('../utils');

var defaultObservers = [
	{from: 'accessibilityDisabled', method: function () {
		this.setAriaAttribute('aria-hidden', this.accessibilityDisabled ? 'true' : null);
	}},
	{from: 'accessibilityLive', method: function () {
		var live = this.accessibilityLive === true && 'assertive' || this.accessibilityLive || null;
		this.setAriaAttribute('aria-live', live);
	}},
	{path: ['accessibilityAlert', 'accessibilityRole'], method: function () {
		var role = this.accessibilityAlert && 'alert' || this.accessibilityRole || null;
		this.setAriaAttribute('role', role);
	}},
	{path: ['content', 'accessibilityHint', 'accessibilityLabel', 'tabIndex'], method: function () {
		var focusable = this.accessibilityLabel || this.content || this.accessibilityHint || false,
			prefix = this.accessibilityLabel || this.content || null,
			label = this.accessibilityHint && prefix && (prefix + ' ' + this.accessibilityHint) ||
					this.accessibilityHint ||
					this.accessibilityLabel ||
					null;

		this.setAriaAttribute('aria-label', label);

		// A truthy or zero tabindex will be set directly
		if (this.tabIndex || this.tabIndex === 0) {
			this.setAriaAttribute('tabindex', this.tabIndex);
		}
		// The webOS browser will only read nodes with a non-null tabindex so if the node has
		// readable content, make it programmably focusable.
		else if (focusable && this.tabIndex === undefined && platform.webos) {
			this.setAriaAttribute('tabindex', -1);
		}
		// Otherwise, remove it
		else {
			this.setAriaAttribute('tabindex', null);
		}
	}}
];

/**
* Prevents browser-initiated scrolling of contained controls into view when
* those controls are explicitly focused.
*
* @private
*/
function preventScroll (node, rtl) {
	if (node) {
		dispatcher.listen(node, 'scroll', function () {
			node.scrollTop = 0;
			// TODO: This probably won't work cross-browser, as the different
			// browser engines appear to treat scrollLeft differently in RTL.
			// See ENYO-2841.
			node.scrollLeft = rtl ? node.scrollWidth : 0;
		});
	}
}

function updateAriaAttributes (all) {
	var i, l, obs;

	for (i = 0, l = this._ariaObservers.length; i < l; i++) {
		obs = this._ariaObservers[i];
		if ((all || obs.pending) && obs.method) {
			obs.method();
			obs.pending = false;
		}
	}
}

function registerAriaUpdate (obj) {
	var fn;
	if (!obj.pending) {
		obj.pending = true;
		fn = this.bindSafely(updateAriaAttributes);
		if (!this.accessibilityDefer) {
			fn();
		} else {
			this.startJob('updateAriaAttributes', fn, 16);
		}
	}
}

function toAriaAttribute (from, to) {
	var value = this[from];
	this.setAriaAttribute(to, value === undefined ? null : value);
}

function staticToAriaAttribute (to, value) {
	this.setAriaAttribute(to, value);
}

function initAriaObservers (control) {
	var conf = control._ariaObservers,
		i, l, fn;

	control._ariaObservers = [];
	for (i = 0, l = defaultObservers.length; i < l; i++) {
		initAriaObserver(control, defaultObservers[i]);
	}
	if (conf) {
		for (i = 0, l = conf.length; i < l; i++) {
			initAriaObserver(control, conf[i]);
		}
	}

	// setup disabled observer and kickoff first run of observers
	fn = updateAriaAttributes.bind(control, true);
	control.addObserver('accessibilityDisabled', fn);
	fn();
}

function initAriaObserver (control, c) {
	var
		// path can either source from 'path' or 'from' (for binding-style configs)
		path = c.path || c.from,

		// method is either:
		// 		'method', if it exists, or
		// 		staticToAriaAttribute if 'to' and 'value' exist - static binding-style config, or
		// 		toAriaAttribute if a 'to' path exists - binding-style config
		method = c.method && control.bindSafely(c.method) ||
				!path && c.to && c.value !== undefined && control.bindSafely(staticToAriaAttribute, c.to, c.value) ||
				c.to && control.bindSafely(toAriaAttribute, path, c.to) ||
				null,

		// import the relevant and pre-validated parts into the instance-level config
		config = {
			path: path,
			method: method,
			pending: false
		},

		// pre-bind the register method as it's used multiple times when 'path' is an array
		fn = registerAriaUpdate.bind(control, config),

		// iterator
		l;

	control._ariaObservers.push(config);
	if (utils.isArray(path)) {
		for (l = path.length - 1; l >= 0; --l) {
			control.addObserver(path[l], fn);
		}
	}
	else if (path) {
		control.addObserver(path, fn);
	}
}

/**
* @mixin
*/
var AccessibilitySupport = {

	/**
	* @private
	*/
	name: 'enyo.AccessibilitySupport',

	/**
	* `accessibilityLabel` is used for accessibility voice readout. If
	* `accessibilityLabel` is set, the screen reader will read the label when the
	* control is focused.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	accessibilityLabel: '',

	/**
	* `accessibilityHint` is used to provide additional information regarding the
	* control. If `accessibilityHint` is set, the screen reader will read the
	* hint content when the control is focused.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	accessibilityHint: '',

	/**
	* The `role` of the control. May be superseded by a truthy `accessibilityAlert` value.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	accessibilityRole: '',

	/**
	* `accessibilityAlert` affects the handling of alert message or page
	* description content. If `true`, aria role will be set to "alert" and the
	* screen reader will automatically read the content of `accessibilityLabel`,
	* regardless of focus state; if `false` (the default), the label will be read
	* when the control receives focus. Note that if you use `accessibilityAlert`,
	* the previous role will be replaced with "alert" role.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	accessibilityAlert: false,

	/**
	* `accessibilityLive` affects the handling of dynamic content that updates
	* without a page reload. If `true`, the screen reader will read the content of
	* `accessibilityLabel` when the content changes; if `false` (the default), the
	* label will be read when the control gains focus.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	accessibilityLive: false,

	/**
	* `accessibilityDisabled` is used to prevent voice readout. If `true`, the
	* screen reader will not read the label for the control. Note that this is not
	* working on HTML form elements which can get focus without tabindex.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	accessibilityDisabled: false,

	/**
	* When `true`, `onscroll` events will be observed and scrolling will be
	* prevented by resetting the node's `scrollTop` and `scrollLeft` values. This
	* prevents inadvertent layout issues introduced by the browser's scrolling
	* contained controls into view when focused.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	accessibilityPreventScroll: false,

	/**
	* The `tabindex` of the control. When `undefined` on webOS, it will be set to
	* `-1` to enable screen reading. A value of `null` (or `undefined` on
	* non-webOS) ensures that no `tabindex` will be set.
	*
	* @type {Number}
	* @default undefined
	* @public
	*/

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function (props) {
			sup.apply(this, arguments);
			initAriaObservers(this);
		};
	}),

	/**
	* If `accessibilityDisabled` is `false`, sets the specified node attribute;
	* otherwise, removes it.
	*
	* @param {String} name  Attribute name
	* @param {String} value Attribute value
	* @public
	*/
	setAriaAttribute: function (name, value) {
		// if the control is disabled, don't set any aria properties except aria-hidden
		if (this.accessibilityDisabled && name != 'aria-hidden') {
			value = null;
		}
		// if the value is defined and non-null, cast it to a String
		else if (value !== undefined && value !== null) {
			value = String(value);
		}
		// prevent invalidating attributes unnecessarily by checking current value first. avoids
		// resetting values on alert-able properties (e.g. aria-valuenow).
		if (this.getAttribute(name) !== value) {
			this.setAttribute(name, value);
		}
	},

	/**
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			if (this.accessibilityPreventScroll) {
				preventScroll(this.hasNode(), this.rtl);
			}
		};
	})
};

var sup = kind.concatHandler;
kind.concatHandler = function (ctor, props, instance) {
	sup.call(this, ctor, props, instance);

	var proto = ctor.prototype || ctor,
		ariaObservers = proto._ariaObservers && proto._ariaObservers.slice(),
		incoming = props.ariaObservers;

	if (incoming && incoming instanceof Array) {
		if (ariaObservers) {
			ariaObservers.push.apply(ariaObservers, incoming);
		} else {
			ariaObservers = incoming.slice();
		}
	}

	proto._ariaObservers = ariaObservers;
};

module.exports = AccessibilitySupport;
},{'../dispatcher':'enyo/dispatcher','../kind':'enyo/kind','../platform':'enyo/platform','../utils':'enyo/utils'}],'enyo/Control/fullscreen':[function (module,exports,global,require,request){
var
	dispatcher = require('../dispatcher'),
	utils = require('../utils'),
	ready = require('../ready'),
	Signals = require('../Signals');

/**
* Normalizes and provides fullscreen support for [controls]{@link module:enyo/Control~Control},
* based on the [fullscreen]{@glossary fullscreen} API.
*
* @module enyo/Control/fullscreen
* @public
*/
module.exports = function (Control) {
	var floatingLayer = Control.floatingLayer;
	var fullscreen = {
		
		/**
		* Reference to the current fullscreen [control]{@link module:enyo/Control~Control}.
		*
		* @private
		*/
		fullscreenControl: null,

		/**
		* Reference to the current fullscreen element (fallback for platforms
		* without native support).
		*
		* @private
		*/
		fullscreenElement: null,

		/** 
		* Reference to that [control]{@link module:enyo/Control~Control} that requested fullscreen.
		* 
		* @private
		*/
		requestor: null,

		/** 
		* Native accessor used to get reference to the current fullscreen element.
		*
		* @private
		*/
		elementAccessor:
			('fullscreenElement' in document) ? 'fullscreenElement' :
			('mozFullScreenElement' in document) ? 'mozFullScreenElement' :
			('webkitFullscreenElement' in document) ? 'webkitFullscreenElement' :
			null,

		/** 
		* Native accessor used to request fullscreen.
		*
		* @private
		*/
		requestAccessor:
			('requestFullscreen' in document.documentElement) ? 'requestFullscreen' :
			('mozRequestFullScreen' in document.documentElement) ? 'mozRequestFullScreen' :
			('webkitRequestFullscreen' in document.documentElement) ? 'webkitRequestFullscreen' :
			null,

		/** 
		* Native accessor used to cancel fullscreen.
		*
		* @private
		*/
		cancelAccessor:
			('cancelFullScreen' in document) ? 'cancelFullScreen' :
			('mozCancelFullScreen' in document) ? 'mozCancelFullScreen' :
			('webkitCancelFullScreen' in document) ? 'webkitCancelFullScreen' :
			null,

		/**
		* Determines whether the platform supports the [fullscreen]{@glossary fullscreen} API.
		* 
		* @returns {Boolean} Returns `true` if platform supports all of the 
		*	[fullscreen]{@glossary fullscreen} API, `false` otherwise.
		* @public
		*/
		nativeSupport: function() {
			return (this.elementAccessor !== null && this.requestAccessor !== null && this.cancelAccessor !== null);
		},

		/** 
		* Normalizes `getFullscreenElement()`.
		*
		* @public
		*/
		getFullscreenElement: function() {
			return (this.nativeSupport()) ? document[this.elementAccessor] : this.fullscreenElement;
		},

		/** 
		* Returns current fullscreen [control]{@link module:enyo/Control~Control}.
		*
		* @public
		*/
		getFullscreenControl: function() {
			return this.fullscreenControl;
		},

		/**
		* Normalizes `requestFullscreen()`.
		*
		* @public
		*/
		requestFullscreen: function(ctl) {
			if (this.getFullscreenControl() || !(ctl.hasNode())) {
				return false;
			}

			this.requestor = ctl;

			// Only use native request if platform supports all of the API
			if (this.nativeSupport()) {
				ctl.hasNode()[this.requestAccessor]();
			} else {
				this.fallbackRequestFullscreen();
			}

			return true;
		},

		/** 
		* Normalizes `cancelFullscreen()`.
		*
		* @public
		*/
		cancelFullscreen: function() {
			if (this.nativeSupport()) {
				document[this.cancelAccessor]();
			} else {
				this.fallbackCancelFullscreen();
			}
		},

		/** 
		* Fallback support for setting fullscreen element (done by browser on platforms with
		* native support).
		*
		* @private
		*/
		setFullscreenElement: function(node) {
			this.fullscreenElement = node;
		},

		/** 
		* Sets current fullscreen [control]{@link module:enyo/Control~Control}.
		*
		* @private
		*/
		setFullscreenControl: function(ctl) {
			this.fullscreenControl = ctl;
		},

		/** 
		* Fallback fullscreen request for platforms without fullscreen support.
		*
		* @private
		*/
		fallbackRequestFullscreen: function() {
			var control = this.requestor;

			if (!control) {
				return;
			}

			// Get before node to allow us to exit floating layer to the proper position
			control.prevAddBefore = control.parent.controlAtIndex(control.indexInContainer() + 1);

			// Render floating layer if we need to
			if (!floatingLayer.hasNode()) {
				floatingLayer.render();
			}

			control.addClass('enyo-fullscreen');
			control.appendNodeToParent(floatingLayer.hasNode());
			control.resize();

			this.setFullscreenControl(control);
			this.setFullscreenElement(control.hasNode());
		},

		/** 
		* Fallback cancel fullscreen for platforms without fullscreen support.
		*
		* @private
		*/
		fallbackCancelFullscreen: function() {
			var control = this.fullscreenControl,
				beforeNode,
				parentNode
			;

			if (!control) {
				return;
			}

			// Find beforeNode based on _this.addBefore_ and _this.prevAddBefore_
			beforeNode = (control.prevAddBefore) ? control.prevAddBefore.hasNode() : null;
			parentNode = control.parent.hasNode();
			control.prevAddBefore = null;

			control.removeClass('enyo-fullscreen');

			if (!beforeNode) {
				control.appendNodeToParent(parentNode);
			} else {
				control.insertNodeInParent(parentNode, beforeNode);
			}

			control.resize();

			this.setFullscreenControl(null);
			this.setFullscreenElement(null);
		},

		/** 
		* Listens for fullscreen change {@glossary event} and broadcasts it as a
		* normalized event.
		*
		* @private
		*/
		detectFullscreenChangeEvent: function() {
			this.setFullscreenControl(this.requestor);
			this.requestor = null;

			// Broadcast change
			Signals.send('onFullscreenChange');
		}
	};

	/**
	* Normalizes platform-specific fullscreen change [events]{@glossary event}.
	*
	* @private
	*/
	ready(function() {
		document.addEventListener('webkitfullscreenchange', utils.bind(fullscreen, 'detectFullscreenChangeEvent'), false);
		document.addEventListener('mozfullscreenchange',    utils.bind(fullscreen, 'detectFullscreenChangeEvent'), false);
		document.addEventListener('fullscreenchange',       utils.bind(fullscreen, 'detectFullscreenChangeEvent'), false);
	});

	/**
	* If this platform doesn't have native support for fullscreen, add an escape handler to mimic 
	* native behavior.
	*/
	if(!fullscreen.nativeSupport()) {
		dispatcher.features.push(
			function(e) {
				if (e.type === 'keydown' && e.keyCode === 27) {
					fullscreen.cancelFullscreen();
				}
			}
		);
	}

	return fullscreen;
};
},{'../dispatcher':'enyo/dispatcher','../utils':'enyo/utils','../ready':'enyo/ready','../Signals':'enyo/Signals'}],'enyo/gesture/drag':[function (module,exports,global,require,request){
var
	dispatcher = require('../dispatcher'),
	utils = require('../utils');

var
	gestureUtil = require('./util');

/**
* Enyo supports a cross-platform set of drag [events]{@glossary event}. These
* events allow users to write a single set of event handlers for applications
* that run on both mobile and desktop platforms.
*
* The following events are provided:
*
* * 'dragstart'
* * 'dragfinish'
* * 'drag'
* * 'drop'
* * 'dragover'
* * 'dragout'
* * 'hold'
* * 'release'
* * 'holdpulse'
* * 'flick'
*
* For more information on these events, see the documentation on
* [Event Handling]{@linkplain $dev-guide/key-concepts/event-handling.html} in
* the Enyo Developer Guide.
*
* Used internally by {@link module:enyo/gesture}
*
* @module enyo/gesture/drag
* @public
*/
module.exports = {

	/**
	* @private
	*/
	holdPulseDefaultConfig: {
		frequency: 200,
		events: [{name: 'hold', time: 200}],
		resume: false,
		preventTap: false,
		moveTolerance: 16,
		endHold: 'onMove'
	},

	/**
	* Call this method to specify the framework's 'holdPulse' behavior, which
	* determines the nature of the events generated when a user presses and holds
	* on a user interface element.
	*
	* By default, an `onhold` event fires after 200 ms. After that, an `onholdpulse`
	* event fires every 200 ms until the user stops holding, at which point a
	* `onrelease` event fires.
	*
	* To change the default behavior, call this method and pass it a holdPulse
	* configuration object. The holdPulse configuration object has a number of
	* properties.
	*
	* You can specify a set of custom hold events by setting the `events` property
	* to an array containing one or more objects. Each object specifies a custom
	* hold event, in the form of a `name` / `time` pair. Notes:
	*
	*  * Your custom event names should not include the 'on' prefix; that will be
	*    added automatically by the framework.
	*
	*  * Times should be specified in milliseconds.
	*
	*  * Your `events` array overrides the framework defaults entirely, so if you
	*    want the standard `hold` event to fire at 200 ms (in addition to whatever
	*    custom events you define), you'll need to redefine it yourself as part of
	*    your `events` array.
	*
	* Regardless of how many custom hold events you define, `onholdpulse` events
	* will start firing after the first custom hold event fires, and continue until
	* the user stops holding. Likewise, only one `onrelease` event will fire,
	* regardless of how many custom hold events you define.
	*
	* The`frequency` parameter determines not only how often `holdpulse` events are
	* sent, but the frequency with which the hold duration is measured. This means
	* that the value you set for `frequency` should always be a common factor of the
	* times you set for your custom hold events, to ensure accurate event timing.
	*
	* You can use the `endHold` property to specify the circumstances under which a
	* hold is considered to end. Set `endHold` to `onMove` (the default) if you want
	* the hold to end as soon as the user's finger or pointer moves. Set `endHold`
	* to `onLeave` if you want the hold to end only when the finger or pointer
	* leaves the element altogether. When specifying `onMove`, you can also provide
	* a `moveTolerance` value (default: `16`) that determines how tolerant you want
	* to be of small movements when deciding whether a hold has ended. The higher
	* the value, the further a user's finger or pointer may move without causing
	* the hold to end.
	*
	* The `resume` parameter (default: `false`) specifies whether a hold
	* that has ended due to finger / pointer movement should be resumed if the
	* user's finger or pointer moves back inside the tolerance threshold (in the
	* case of `endHold: onMove`) or back over the element (in the case of
	* `endHold: onLeave`).
	*
	* Finally, the `preventTap` paramenter (default: `false`) allows you to prevent
	* an `ontap` event from firing when the hold is released.
	*
	* Here is an example:
	*
	* ```
	* gesture.drag.configureHoldPulse({
	*     frequency: 100,
	*     events: [
	*         {name: 'hold', time: 200},
	*         {name: 'longpress', time: 500}
	*     ],
	*     endHold: 'onLeave',
	*     resume: true,
	*     preventTap: true
	* });
	* ```
	* For comparison, here are the out-of-the-box defaults:
	*
	* ```
	* gesture.drag.configureHoldPulse({
	*     frequency: 200,
	*     events: [
	*         {name: 'hold', time: 200}
	*     ],
	*     endHold: 'onMove',
	*     moveTolerance: 16,
	*     resume: false,
	*     preventTap: false
	* });
	* ```
	*
	* The settings you provide via this method will be applied globally, affecting
	* every Control. Note that you can also override the defaults on a case-by-case
	* basis by handling the `down` event for any Control and calling the
	* `configureHoldPulse` method exposed by the event itself. That method works
	* exactly like this one, except that the settings you provide will apply only to
	* holds on that particular Control.
	*
	* @public
	*/
	configureHoldPulse: function (config) {
		// TODO: Might be nice to do some validation, error handling

		// _holdPulseConfig represents the current, global `holdpulse` settings, if the default
		// settings have been overridden in some way.
		this._holdPulseConfig = this._holdPulseConfig || utils.clone(this.holdPulseDefaultConfig, true);
		utils.mixin(this._holdPulseConfig, config);
	},

	/**
	* Resets the `holdPulse` behavior to the default settings.
	*
	* @public
	*/
	resetHoldPulseConfig: function () {
		this._holdPulseConfig = null;
	},

	/**
	* @private
	*/
	holdPulseConfig: {},

	/**
	* @private
	*/
	trackCount: 5,

	/**
	* @private
	*/
	minFlick: 0.1,

	/**
	* @private
	*/
	minTrack: 8,

	/**
	* @private
	*/
	down: function(e) {
		// tracking if the mouse is down
		//enyo.log('tracking ON');
		// Note: 'tracking' flag indicates interest in mousemove, it's turned off
		// on mouseup
		// make sure to stop dragging in case the up event was not received.
		this.stopDragging(e);
		this.target = e.target;
		this.startTracking(e);
	},

	/**
	* @private
	*/
	move: function(e) {
		if (this.tracking) {
			this.track(e);
			// If the mouse is not down and we're tracking a drag, abort.
			// this error condition can occur on IE/Webkit after interaction with a scrollbar.
			if (!e.which) {
				this.stopDragging(e);
				this.endHold();
				this.tracking = false;
				//enyo.log('gesture.drag: mouse must be down to drag.');
				return;
			}
			if (this.dragEvent) {
				this.sendDrag(e);
			} else if (this.holdPulseConfig.endHold === 'onMove') {
				if (this.dy*this.dy + this.dx*this.dx >= this.holdPulseConfig.moveTolerance) { // outside of target
					if (this.holdJob) { // only stop/cancel hold job if it currently exists
						if (this.holdPulseConfig.resume) { // pause hold to potentially resume later
							this.suspendHold();
						} else { // completely cancel hold
							this.endHold();
							this.sendDragStart(e);
						}
					}
				} else if (this.holdPulseConfig.resume && !this.holdJob) { // when moving inside target, only resume hold job if it was previously paused
					this.resumeHold();
				}
			}
		}
	},

	/**
	* @private
	*/
	up: function(e) {
		this.endTracking(e);
		this.stopDragging(e);
		this.endHold();
		this.target = null;
	},

	/**
	* @private
	*/
	enter: function(e) {
		// resume hold when re-entering original target when using 'onLeave' endHold value
		if (this.holdPulseConfig.resume && this.holdPulseConfig.endHold === 'onLeave' && this.target && e.target === this.target) {
			this.resumeHold();
		}
	},

	/**
	* @private
	*/
	leave: function(e) {
		if (this.dragEvent) {
			this.sendDragOut(e);
		} else if (this.holdPulseConfig.endHold === 'onLeave') {
			if (this.holdPulseConfig.resume) { // pause hold to potentially resume later
				this.suspendHold();
			} else { // completely cancel hold
				this.endHold();
				this.sendDragStart(e);
			}
		}
	},

	/**
	* @private
	*/
	stopDragging: function(e) {
		if (this.dragEvent) {
			this.sendDrop(e);
			var handled = this.sendDragFinish(e);
			this.dragEvent = null;
			return handled;
		}
	},

	/**
	* @private
	*/
	makeDragEvent: function(inType, inTarget, inEvent, inInfo) {
		var adx = Math.abs(this.dx), ady = Math.abs(this.dy);
		var h = adx > ady;
		// suggest locking if off-axis < 22.5 degrees
		var l = (h ? ady/adx : adx/ady) < 0.414;
		var e = {};
		// var e = {
		e.type = inType;
		e.dx = this.dx;
		e.dy = this.dy;
		e.ddx = this.dx - this.lastDx;
		e.ddy = this.dy - this.lastDy;
		e.xDirection = this.xDirection;
		e.yDirection = this.yDirection;
		e.pageX = inEvent.pageX;
		e.pageY = inEvent.pageY;
		e.clientX = inEvent.clientX;
		e.clientY = inEvent.clientY;
		e.horizontal = h;
		e.vertical = !h;
		e.lockable = l;
		e.target = inTarget;
		e.dragInfo = inInfo;
		e.ctrlKey = inEvent.ctrlKey;
		e.altKey = inEvent.altKey;
		e.metaKey = inEvent.metaKey;
		e.shiftKey = inEvent.shiftKey;
		e.srcEvent = inEvent.srcEvent;
		// };
		e.preventDefault = gestureUtil.preventDefault;
		e.disablePrevention = gestureUtil.disablePrevention;
		return e;
	},

	/**
	* @private
	*/
	sendDragStart: function(e) {
		//enyo.log('dragstart');
		this.dragEvent = this.makeDragEvent('dragstart', this.target, e);
		dispatcher.dispatch(this.dragEvent);
	},

	/**
	* @private
	*/
	sendDrag: function(e) {
		//enyo.log('sendDrag to ' + this.dragEvent.target.id + ', over to ' + e.target.id);
		// send dragOver event to the standard event target
		var synth = this.makeDragEvent('dragover', e.target, e, this.dragEvent.dragInfo);
		dispatcher.dispatch(synth);
		// send drag event to the drag source
		synth.type = 'drag';
		synth.target = this.dragEvent.target;
		dispatcher.dispatch(synth);
	},

	/**
	* @private
	*/
	sendDragFinish: function(e) {
		//enyo.log('dragfinish');
		var synth = this.makeDragEvent('dragfinish', this.dragEvent.target, e, this.dragEvent.dragInfo);
		synth.preventTap = function() {
			if (e.preventTap) {
				e.preventTap();
			}
		};
		dispatcher.dispatch(synth);
	},

	/**
	* @private
	*/
	sendDragOut: function(e) {
		var synth = this.makeDragEvent('dragout', e.target, e, this.dragEvent.dragInfo);
		dispatcher.dispatch(synth);
	},

	/**
	* @private
	*/
	sendDrop: function(e) {
		var synth = this.makeDragEvent('drop', e.target, e, this.dragEvent.dragInfo);
		synth.preventTap = function() {
			if (e.preventTap) {
				e.preventTap();
			}
		};
		dispatcher.dispatch(synth);
	},

	/**
	* @private
	*/
	startTracking: function(e) {
		this.tracking = true;
		// note: use clientX/Y to be compatible with ie8
		this.px0 = e.clientX;
		this.py0 = e.clientY;
		// this.flickInfo = {startEvent: e, moves: []};
		this.flickInfo = {};
		this.flickInfo.startEvent = e;
		// FIXME: so we're trying to reuse objects where possible, should
		// do the same in scenarios like this for arrays
		this.flickInfo.moves = [];
		this.track(e);
	},

	/**
	* @private
	*/
	track: function(e) {
		this.lastDx = this.dx;
		this.lastDy = this.dy;
		this.dx = e.clientX - this.px0;
		this.dy = e.clientY - this.py0;
		this.xDirection = this.calcDirection(this.dx - this.lastDx, 0);
		this.yDirection = this.calcDirection(this.dy - this.lastDy, 0);
		//
		var ti = this.flickInfo;
		ti.moves.push({
			x: e.clientX,
			y: e.clientY,
			t: utils.perfNow()
		});
		// track specified # of points
		if (ti.moves.length > this.trackCount) {
			ti.moves.shift();
		}
	},

	/**
	* @private
	*/
	endTracking: function() {
		this.tracking = false;
		var ti = this.flickInfo;
		var moves = ti && ti.moves;
		if (moves && moves.length > 1) {
			// note: important to use up time to reduce flick
			// velocity based on time between move and up.
			var l = moves[moves.length-1];
			var n = utils.perfNow();
			// take the greatest of flick between each tracked move and last move
			for (var i=moves.length-2, dt=0, x1=0, y1=0, x=0, y=0, sx=0, sy=0, m; (m=moves[i]); i--) {
				// this flick (this move - last move) / (this time - last time)
				dt = n - m.t;
				x1 = (l.x - m.x) / dt;
				y1 = (l.y - m.y) / dt;
				// establish flick direction
				sx = sx || (x1 < 0 ? -1 : (x1 > 0 ? 1 : 0));
				sy = sy || (y1 < 0 ? -1 : (y1 > 0 ? 1 : 0));
				// if either axis is a greater flick than previously recorded use this one
				if ((x1 * sx > x * sx) || (y1 * sy > y * sy)) {
					x = x1;
					y = y1;
				}
			}
			var v = Math.sqrt(x*x + y*y);
			if (v > this.minFlick) {
				// generate the flick using the start event so it has those coordinates
				this.sendFlick(ti.startEvent, x, y, v);
			}
		}
		this.flickInfo = null;
	},

	/**
	* @private
	*/
	calcDirection: function(inNum, inDefault) {
		return inNum > 0 ? 1 : (inNum < 0 ? -1 : inDefault);
	},

	/**
	* Translate the old format for holdPulseConfig to the new one, to
	* preserve backward compatibility.
	*
	* @private
	*/
	normalizeHoldPulseConfig: function (oldOpts) {
		var nOpts = utils.clone(oldOpts);
		nOpts.frequency = nOpts.delay;
		nOpts.events = [{name: 'hold', time: nOpts.delay}];
		return nOpts;
	},

	/**
	* Method to override holdPulseConfig for a given gesture. This method isn't
	* accessed directly from gesture.drag, but exposed by the `down` event.
	* See `prepareHold()`.
	*
	* @private
	*/
	_configureHoldPulse: function(opts) {
		var nOpts = (opts.delay === undefined) ?
			opts :
			this.normalizeHoldPulseConfig(opts);
		utils.mixin(this.holdPulseConfig, nOpts);
	},

	/**
	* @private
	*/
	prepareHold: function(e) {
		// quick copy as the prototype of the new overridable config
		this.holdPulseConfig = utils.clone(this._holdPulseConfig || this.holdPulseDefaultConfig, true);

		// expose method for configuring holdpulse options
		e.configureHoldPulse = this._configureHoldPulse.bind(this);
	},

	/**
	* @private
	*/
	beginHold: function(e) {
		var ce;
		// cancel any existing hold since it's possible in corner cases to get a down without an up
		this.endHold();
		this.holdStart = utils.perfNow();
		this._holdJobFunction = utils.bind(this, 'handleHoldPulse');
		// clone the event to ensure it stays alive on IE upon returning to event loop
		ce = this._holdJobEvent = utils.clone(e);
		ce.srcEvent = utils.clone(e.srcEvent);
		ce.downEvent = e;
		this._pulsing = false;
		this._unsent = utils.clone(this.holdPulseConfig.events);
		this._unsent.sort(this.sortEvents);
		this._next = this._unsent.shift();
		if (this._next) {
			this.holdJob = setInterval(this._holdJobFunction, this.holdPulseConfig.frequency);
		}
	},

	/**
	* @private
	*/
	resumeHold: function() {
		this.handleHoldPulse();
		this.holdJob = setInterval(this._holdJobFunction, this.holdPulseConfig.frequency);
	},

	/**
	* @private
	*/
	sortEvents: function(a, b) {
			if (a.time < b.time) return -1;
			if (a.time > b.time) return 1;
			return 0;
	},

	/**
	* @private
	*/
	endHold: function() {
		var e = this._holdJobEvent;
		this.suspendHold();
		if (e && this._pulsing) {
			this.sendRelease(e);
		}
		this._pulsing = false;
		this._unsent = null;
		this._holdJobFunction = null;
		this._holdJobEvent = null;
		this._next = null;
	},

	/**
	* @private
	*/
	suspendHold: function() {
		clearInterval(this.holdJob);
		this.holdJob = null;
	},

	/**
	* @private
	*/
	handleHoldPulse: function() {
		var holdTime = utils.perfNow() - this.holdStart,
			hje = this._holdJobEvent,
			e;
		this.maybeSendHold(hje, holdTime);
		if (this._pulsing) {
			e = gestureUtil.makeEvent('holdpulse', hje);
			e.holdTime = holdTime;
			dispatcher.dispatch(e);
		}
	},

	/**
	* @private
	*/
	maybeSendHold: function(inEvent, inHoldTime) {
		var n = this._next;
		while (n && n.time <= inHoldTime) {
			var e = gestureUtil.makeEvent(n.name, inEvent);
			if (!this._pulsing && this.holdPulseConfig.preventTap) {
				inEvent.downEvent.preventTap();
			}
			this._pulsing = true;
			dispatcher.dispatch(e);
			n = this._next = this._unsent && this._unsent.shift();
		}
	},

	/**
	* @private
	*/
	sendRelease: function(inEvent) {
		var e = gestureUtil.makeEvent('release', inEvent);
		dispatcher.dispatch(e);
	},

	/**
	* @private
	*/
	sendFlick: function(inEvent, inX, inY, inV) {
		var e = gestureUtil.makeEvent('flick', inEvent);
		e.xVelocity = inX;
		e.yVelocity = inY;
		e.velocity = inV;
		dispatcher.dispatch(e);
	}
};

},{'../dispatcher':'enyo/dispatcher','../utils':'enyo/utils','./util':'enyo/gesture/util'}],'enyo/gesture/touchGestures':[function (module,exports,global,require,request){
var
	dispatcher = require('../dispatcher'),
	utils = require('../utils');

/**
* The extended {@glossary event} [object]{@glossary Object} that is provided when we
* emulate iOS multitouch gesture events on non-iOS devices.
*
* @typedef {Object} module:enyo/gesture/touchGestures~EmulatedGestureEvent
* @property {Number} pageX - The x-coordinate of the center point between fingers.
* @property {Number} pageY - The y-coordinate of the center point between fingers.
* @property {Number} rotation - The degrees of rotation from the beginning of the gesture.
* @property {Number} scale - The percent change of distance between fingers.
*/

/**
* @module enyo/gesture/touchGestures
* @private
*/
module.exports = {

	/**
	* @private
	*/
	orderedTouches: [],

	/**
	* @private
	*/
	gesture: null,

	/**
	* @private
	*/
	touchstart: function (e) {
		// some devices can send multiple changed touches on start and end
		var i,
			changedTouches = e.changedTouches,
			length = changedTouches.length;

		for (i = 0; i < length; i++) {
			var id = changedTouches[i].identifier;

			// some devices can send multiple touchstarts
			if (utils.indexOf(id, this.orderedTouches) < 0) {
				this.orderedTouches.push(id);
			}
		}

		if (e.touches.length >= 2 && !this.gesture) {
			var p = this.gesturePositions(e);

			this.gesture = this.gestureVector(p);
			this.gesture.angle = this.gestureAngle(p);
			this.gesture.scale = 1;
			this.gesture.rotation = 0;
			var g = this.makeGesture('gesturestart', e, {vector: this.gesture, scale: 1, rotation: 0});
			dispatcher.dispatch(g);
		}
	},

	/**
	* @private
	*/
	touchend: function (e) {
		// some devices can send multiple changed touches on start and end
		var i,
			changedTouches = e.changedTouches,
			length = changedTouches.length;

		for (i = 0; i < length; i++) {
			utils.remove(changedTouches[i].identifier, this.orderedTouches);
		}

		if (e.touches.length <= 1 && this.gesture) {
			var t = e.touches[0] || e.changedTouches[e.changedTouches.length - 1];

			// gesture end sends last rotation and scale, with the x/y of the last finger
			dispatcher.dispatch(this.makeGesture('gestureend', e, {vector: {xcenter: t.pageX, ycenter: t.pageY}, scale: this.gesture.scale, rotation: this.gesture.rotation}));
			this.gesture = null;
		}
	},

	/**
	* @private
	*/
	touchmove: function (e) {
		if (this.gesture) {
			var g = this.makeGesture('gesturechange', e);
			this.gesture.scale = g.scale;
			this.gesture.rotation = g.rotation;
			dispatcher.dispatch(g);
		}
	},

	/**
	* @private
	*/
	findIdentifiedTouch: function (touches, id) {
		for (var i = 0, t; (t = touches[i]); i++) {
			if (t.identifier === id) {
				return t;
			}
		}
	},

	/**
	* @private
	*/
	gesturePositions: function (e) {
		var first = this.findIdentifiedTouch(e.touches, this.orderedTouches[0]);
		var last = this.findIdentifiedTouch(e.touches, this.orderedTouches[this.orderedTouches.length - 1]);
		var fx = first.pageX, lx = last.pageX, fy = first.pageY, ly = last.pageY;
		// center the first touch as 0,0
		var x = lx - fx, y = ly - fy;
		var h = Math.sqrt(x*x + y*y);
		return {x: x, y: y, h: h, fx: fx, lx: lx, fy: fy, ly: ly};
	},

	/**
	* Finds rotation angle.
	* 
	* @private
	*/
	gestureAngle: function (positions) {
		var p = positions;
		// yay math!, rad -> deg
		var a = Math.asin(p.y / p.h) * (180 / Math.PI);
		// fix for range limits of asin (-90 to 90)
		// Quadrants II and III
		if (p.x < 0) {
			a = 180 - a;
		}
		// Quadrant IV
		if (p.x > 0 && p.y < 0) {
			a += 360;
		}
		return a;
	},

	/**
	* Finds bounding box.
	* 
	* @private
	*/
	gestureVector: function (positions) {
		// the least recent touch and the most recent touch determine the bounding box of the gesture event
		var p = positions;
		// center the first touch as 0,0
		return {
			magnitude: p.h,
			xcenter: Math.abs(Math.round(p.fx + (p.x / 2))),
			ycenter: Math.abs(Math.round(p.fy + (p.y / 2)))
		};
	},

	/**
	* @private
	*/
	makeGesture: function (type, e, cache) {
		var vector, scale, rotation;
		if (cache) {
			vector = cache.vector;
			scale = cache.scale;
			rotation = cache.rotation;
		} else {
			var p = this.gesturePositions(e);
			vector = this.gestureVector(p);
			scale = vector.magnitude / this.gesture.magnitude;
			// gestureEvent.rotation is difference from the starting angle, clockwise
			rotation = (360 + this.gestureAngle(p) - this.gesture.angle) % 360;
		}
		var event = utils.clone(e);
		return utils.mixin(event, {
			type: type,
			scale: scale,
			pageX: vector.xcenter,
			pageY: vector.ycenter,
			rotation: rotation
		});
	}
};

},{'../dispatcher':'enyo/dispatcher','../utils':'enyo/utils'}],'enyo/Router':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Router~Router} kind.
* @module enyo/Router
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	ready = require('./ready'),
	dispatcher = require('./dispatcher');

var
	Controller = require('./Controller'),
	EnyoHistory = require('./History');

/**
* Any instance of a router will be referenced here for the global hash change handler.
*
* @private
*/
var listeners = [];

/**
* This is the intended global `window.hashchange` event handler. If another handler is
* arbitrarily registered for this event, then it will not fire.
*
* @private
*/
var hashDidChange = function (hash) {
	var list = listeners;
	var len = list.length;
	var idx = 0;
	for (; idx < len; ++idx) {
		list[idx]._hashChanged(hash);
	}
};

/*
* @private
*/
var token = /\:[a-zA-Z0-9]*/g;

/*
* @private
*/
var prepare = function (str) {
	return str[0] === '#'? str.slice(1): str;
};

/**
* All of our actively-supported browsers support this method of registering
* for `hashchange` events.
*
* @private
*/
ready(function () {
	dispatcher.listen(global, 'hashchange', hashDidChange);
});

/**
* {@link module:enyo/Router~Router} is a controller with the ability to interpret changes in
* the URL and make changes to the URL in a manner that is compatible across
* browsers. With defined route handling, the application state can be managed
* more closely with respect to the location state of the browser. There may be
* multiple router instances active at any one time. Routers only interact with
* the hash portion of the browser location and will not force a reload of the
* current page.
*
* [Routes]{@link module:enyo/Router~Router#routes} may be defined in several ways and
* may be added at startup or [added programmatically]{@link module:enyo/Router~Router#addRoute}
* at a later time.
*
* A route is a declarative hash with the following structure:
*
* ```
* {path: 'some/path', handler: 'function', context: 'context'}
* ```
*
* The `path` is a string that may be static (explicitly matched) or dynamic
* (matched based on dynamic placeholders). Dynamic paths may name elements to
* be matched, e.g.:
*
* ```
* {path: ':user/:id'}
* ```
*
* In this case, `handler` would be called with two parameters filled with
* the values matched by that structure. It is important to note that a dynamic
* route will apply the first match it finds, so care must be taken to ensure
* that the correct route is matched (e.g., `/users/:user/:id` is more exact
* because it includes the static `users` portion of the path).
*
* `handler` may be a function reference or a string that will be mapped to a
* function. A check for the function's existence is conducted first on the
* router, then on any provided context, and finally in the global scope. If a
* context is provided, the function will be executed under that context
* regardless of where the function was found.
*
* The `context` property may be an object, an instance, or a string that will
* be mapped to an object, if possible.
*
* Note that, currently, only letters and numbers are supported in dynamic routes.
* 
* @class Router
* @extends module:enyo/Controller~Controller
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Router~Router.prototype */ {

	name: 'enyo.Router',

	// ...........................
	// PUBLIC PROPERTIES

	/**
	* If `true`, the router will respond to hash changes or internal events. If this flag is set
	* to `false`, it will stop responding. This may be changed at any time.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	listening: true,

	/**
	* If `true`, the router will neither respond to hash changes in the browser
	* nor be able to trigger them. Instead, the router may be used internally to
	* maintain or trigger state changes in an application without changing
	* location.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	internalOnly: false,

	/**
	* Set this to `true` to force the current browser location to a particular
	* path on startup. This flag will be ignored if
	* [triggerOnStart]{@link module:enyo/Router~Router#triggerOnStart} is `false`.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	defaultPathOnStart: false,

	/**
	* The `defaultRoute` should have the same structure as a normal route (hash). It may be
	* arbitrarily assigned to this property or mixed into the
	* [routes]{@link module:enyo/Router~Router#routes} array with a special `default: true` flag set. For
	* any unmatched hash changes, this route will be executed and passed the path that was not
	* matched.
	*
	* @type {Object}
	* @default null
	* @public
	*/
	defaultRoute: null,

	/**
	* By default, when a router is created, it will attempt to trigger the correct route for the
	* current browser location. Set this flag to `false` to prevent this behavior.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	triggerOnStart: true,

	/**
	* The router will attempt to track history based on the events that have been generated
	* through it. This allows the usage of the browser's 'Back' and 'Forward' buttons.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	useHistory: false,

	/**
	* The `routes` [array]{@glossary Array} specifies the handlers for
	* the current Router instance. Routes are string paths, static or dynamic,
	* that route particular `hashchange` events. They are defined in an array of
	* [hashes]{@glossary Object} with a `handler` (function name), `path`
	* (for static and dynamic paths), an optional `context` (for the `handler`),
	* or a `default` Boolean `true`|`false` value indicating whether the handler
	* should be used when no other route can handle the `hashchange` event.
	*
	* @example
	* routes: [
	*     {path: 'users/:userName', handler: 'loadUser'},
	*     {path: 'users', handler: 'usersIndex'},
	*     {path: 'about/moreDetail', handler: 'detailedAboutScreen'},
	*     {path: 'about', handler: 'aboutScreen'},
	*     {path: 'home', handler: 'homeScreen', default: true},
	*     {path: '', handler: 'handleBlankRoute'}
	* ]
	*
	* @type {Array}
	* @public
	*/
	routes: null,

	// ...........................
	// PROTECTED PROPERTIES

	/*
	* @private
	*/
	kind: Controller,

	/*
	* @private
	*/
	_staticRoutes: null,

	/*
	* @private
	*/
	_dynamicRoutes: null,

	/*
	* @private
	*/
	_current: '',

	// ...........................
	// COMPUTED PROPERTIES

	computed: [
		{method: 'location', path: '_current', config: {cached: true}},
		{method: 'defaultPath'}
	],

	/**
	* A computed property that returns the location as known by this router. This property
	* will be synchronized with [window.location.hash]{@glossary window.location}
	* unless the [internalOnly]{@link module:enyo/Router~Router#internalOnly} flag is set to `true`.
	* Passing a string to this property via `_set('location', 'mylocation')` will update the
	* inner location known by this router.
	*
	* @public
	*/
	location: function (loc) {
		if (loc) {
			loc = prepare(loc);
			if (!this.internalOnly) {
				utils.asyncMethod(this, 'trigger', {location: loc, change: true});
			} else {
				this.set('_current', loc);
			}
		} else {
			return prepare(this.get('_current'));
		}
	},

	/**
	* Returns the string for the default path, or an empty string if no default
	* path exists.
	*
	* @public
	*/
	defaultPath: function () {
		return this.defaultRoute ? this.defaultRoute.path: '';
	},

	// ...........................
	// PUBLIC METHODS

	/**
	* Triggers a change without necessarily requiring a change to occur. If
	* called without a parameter, it will force the route that matches the
	* current browser location to fire. If a string is passed in, this method
	* will trigger an internal-only event (i.e., the browser location will not
	* be changed). If it is passed a hash, the method will try to use a
	* `location` property while looking for optional `change` and `global`
	* properties.
	*
	* If the `change` property is present and `true`, it will force a
	* [location.hash]{@glossary window.location} change in the
	* browser (this is always global). If the `global` property is present and
	* `true` and `change` is not present or `false`, it will trigger an internal
	* event that all routers will respond to (not just this instance).
	*
	* @public
	*/
	trigger: function (params) {
		if (!params) {
			params = {location: this.get('_current')};
		} else if ('string' === typeof params) {
			params = {location: params};
		}
		var loc = params.location;
		var isGlobal = params.global;
		var change = params.change;
		var current = this.get('location');
		if (change) {
			if (current !== loc) {
				if (EnyoHistory.isSupported()) {
					this.addHistory(loc);
					this._hashChanged(loc);
				} else {
					global.location.hash = loc;
				}
			} else {
				this._hashChanged(loc);
			}
		} else {
			if (isGlobal) {
				hashDidChange(loc);
			} else {
				this._hashChanged(loc);
			}
		}
	},

	/**
	* In very rare circumstances, it may be useful to pass a path to the
	* [routes]{@link module:enyo/Router~Router#routes} without using
	* [trigger()]{@link module:enyo/Router~Router#trigger} or global hash changes with
	* `path` being a string that will be evaluated against the routes owned by
	* this router.
	*
	* @param {String} path - A path to test against this router's
	*	[routes]{@link module:enyo/Router~Router#routes}.
	* @public
	*/
	handle: function (path) {
		// fast track is to check against static routes first
		if (this._handleStatic(path)) {
			return;
		}
		// then we check against dynamic paths in this simple scheme
		else if (this._handleDynamic(path)) {
			/* do nothing */
		}
		else {
			this._handleDefault(path);
		}
	},

	/**
	* If history is enabled and some history exists, attempts to revert the
	* current known location to the previous one in the stack.
	*
	* @public
	*/
	back: function () {
		if (this.useHistory) {
			EnyoHistory.pop();
		}
	},

	/**
	* Arbitrarily adds history at the lowest (first) position in the stack. Returns callee for
	* chaining.
	*
	* @param {String} location - The location string to add to the history.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addHistory: function (location) {
		if (this.useHistory) {
			if (location[0] !== '#') location = '#' + location;
			EnyoHistory.push({context: this, handler: '_handlePopHistory', location: location});
		}
		return this;
	},

	/**
	* Clears any history the router has stored. Returns callee for chaining.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	clearHistory: function () {
		EnyoHistory.clear();
		return this;
	},

	/**
	* May be used to programmatically add [routes]{@link module:enyo/Router~Router#routes}
	* to the router. `route` is a hash as described by the
	* [routes]{@link module:enyo/Router~Router#routes} array. Returns callee for chaining.
	*
	* @param {Object} route - The route to add.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addRoute: function (route) {
		var statics = this._staticRoutes;
		var dynamic = this._dynamicRoutes;
		var regex;
		if (true === route['default']) {
			this.defaultRoute = route;
		}
		else if (token.test(route.path)) {
			token.lastIndex = 0;
			// regex = new RegExp(route.path.replace(token, '([a-zA-Z0-9-]*)'));
			regex = new RegExp(route.path.replace(token, '([a-zA-Z0-9-.]*)'));
			route.regex = regex;
			dynamic.push(route);
		} else {
			statics[route.path] = route;
		}
		return this;
	},

	// ...........................
	// PROTECTED METHODS

	/*
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			this._staticRoutes = {};
			this._dynamicRoutes = [];
			this.routes = this.routes || [];
			sup.apply(this, arguments);
		};
	}),

	/*
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			// make sure to initialize our routes prior
			// to registering for events
			this._setupRoutes();
			// make sure we're up to date
			this.set('_current', prepare(window.location.hash));
			// ok, register for events
			listeners.push(this);
			// ok, if we need to go ahead and route our current
			// location, lets do it, but let create finish first
			if (this.triggerOnStart) {
				if (this.defaultPathOnStart) {
					utils.asyncMethod(this, 'trigger', {change: true, location: this.get('defaultPath')});
				} else {
					utils.asyncMethod(this, 'trigger');

				}
			}
		};
	}),

	/*
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			var idx = utils.indexOf(this, listeners);
			if (!~idx) {
				listeners.splice(idx, 1);
			}
			sup.apply(this, arguments);
		};
	}),

	/*
	* @private
	*/
	_hashChanged: function (hash) {
		var $hash = (function (prop) {
			if (!utils.isString(prop)) {
				// some browsers do not support the newUrl property
				// so we're forced to look at the current hash
				prop = prop.newUrl || global.location.hash;
			}
			return prepare(prop);
		})(hash);
		if (this.listening) {
			this.set('_current', $hash);
			this.handle($hash);
		}
	},

	/**
	* @private
	*/
	_handlePopHistory: function (entry) {
		if (this.listening) {
			var location = prepare(entry.location);
			this.handle(location);
		}
	},

	/*
	* @private
	*/
	_execHandler: function (context, handler, args, route) {
		var $fn = handler;
		var $ctx = 'string' === typeof context? utils.getPath.call(this, context): context;
		// if the handler is defined as a string, we need to determine if it is relative to the
		// router, relative to the owner, relative to the context, or a named function in the
		// global scope
		if ('string' === typeof handler) {
			if (typeof this[handler] === 'function') {
				$fn = this[handler];
				$ctx = $ctx || this;
			} else if (typeof this.owner[handler] === 'function') {
				$fn = this.owner[handler];
				$ctx = $ctx || this.owner;
			} else if (typeof $ctx[handler] === 'function') {
				$fn = $ctx[handler];
			}
			if ('function' === typeof $fn) {
				// in case we actually found it, let's not go hunting
				// next time
				route.handler = $fn;
				route.context = $ctx;
			}
		}
		// if we have an actual handler, let's execute it now
		if ($fn && 'function' === typeof $fn) {
			$fn.apply($ctx, args);
			return true;
		}
		// otherwise we couldn't determine what we were supposed to
		// do here
		return false;
	},

	/*
	* @private
	*/
	_handleStatic: function (path) {
		var statics = this._staticRoutes;
		var route;
		var handler;
		var context;
		if ((route = statics[path])) {
			handler = route.handler;
			context = route.context;
			return this._execHandler(context, handler, [path], route);
		}
		return false;
	},

	/*
	* @private
	*/
	_handleDynamic: function (path) {
		var dynamic = this._dynamicRoutes;
		var regex;
		var route;
		var handler;
		var context;
		var matches;
		var idx = 0;
		var len = dynamic.length;
		for (; idx < len; ++idx) {
			route = dynamic[idx];
			regex = route.regex;
			if ((matches = regex.exec(path))) {
				// we need to strip off the full match so we can
				// use the other matches as parameters
				matches = matches.slice(1);
				handler = route.handler;
				context = route.context;
				return this._execHandler(context, handler, matches, route);
			}
		}
		return false;
	},

	/*
	* @private
	*/
	_handleDefault: function (path) {
		var route = this.defaultRoute || {};
		var context = route.context;
		var handler = route.handler;
		return this._execHandler(context, handler, [path], route);
	},

	/*
	* @private
	*/
	_setupRoutes: function () {
		var routes = this.routes;
		var idx = 0;
		var len = routes.length;
		var route;
		for (; idx < len; ++idx) {
			route = routes[idx];
			if (!route) {
				continue;
			}
			this.addRoute(route);
		}
	},

	_currentChanged: function (was, is) {
		this.log(was, is);
	}

});

},{'./kind':'enyo/kind','./utils':'enyo/utils','./ready':'enyo/ready','./dispatcher':'enyo/dispatcher','./Controller':'enyo/Controller','./History':'enyo/History'}],'enyo/gesture':[function (module,exports,global,require,request){
/**
* @module enyo/gesture
*/


var
	dispatcher = require('../dispatcher'),
	dom = require('../dom'),
	platform = require('../platform'),
	utils = require('../utils');

var
	drag = require('./drag'),
	touchGestures = require('./touchGestures'),
	gestureUtil = require('./util');

/**
* Enyo supports a set of normalized events that work similarly across all supported platforms.
* These events are provided so that users can write a single set of event handlers for
* applications that run on both mobile and desktop platforms. They are needed because desktop
* and mobile platforms handle basic input differently.
*
* For more information on normalized input events and their associated properties, see the
* documentation on [Event Handling]{@linkplain $dev-guide/key-concepts/event-handling.html}
* in the Enyo Developer Guide.
*
* @public
*/
var gesture = module.exports = {
	/**
	* Handles "down" [events]{@glossary event}, including `mousedown` and `keydown`. This is
	* responsible for the press-and-hold key repeater.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	down: function(evt) {
		var e = gestureUtil.makeEvent('down', evt);

		// prepare for hold
		drag.prepareHold(e);

		// enable prevention of tap event
		e.preventTap = function() {
			e._tapPrevented = true;
		};

		dispatcher.dispatch(e);
		this.downEvent = e;

		// start hold, now that control has had a chance
		// to override the holdPulse configuration
		drag.beginHold(e);
	},

	/**
	* Handles `mousemove` [events]{@glossary event}.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	move: function(evt) {
		var e = gestureUtil.makeEvent('move', evt);
		// include delta and direction v. down info in move event
		e.dx = e.dy = e.horizontal = e.vertical = 0;
		if (e.which && this.downEvent) {
			e.dx = evt.clientX - this.downEvent.clientX;
			e.dy = evt.clientY - this.downEvent.clientY;
			e.horizontal = Math.abs(e.dx) > Math.abs(e.dy);
			e.vertical = !e.horizontal;
		}
		dispatcher.dispatch(e);
	},

	/**
	* Handles "up" [events]{@glossary event}, including `mouseup` and `keyup`.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	up: function(evt) {
		var e = gestureUtil.makeEvent('up', evt);

		// We have added some logic to synchronize up and down events in certain scenarios (i.e.
		// clicking multiple buttons with a mouse) and to generally guard against any potential
		// asymmetry, but a full solution would be to maintain a map of up/down events as an
		// ideal solution, for future work.
		e._tapPrevented = this.downEvent && this.downEvent._tapPrevented && this.downEvent.which == e.which;
		e.preventTap = function() {
			e._tapPrevented = true;
		};

		dispatcher.dispatch(e);
		if (!e._tapPrevented && this.downEvent && this.downEvent.which == 1) {
			var target = this.findCommonAncestor(this.downEvent.target, evt.target);

			// the common ancestor of the down/up events is the target of the tap
			if(target) {
				if(this.supportsDoubleTap(target)) {
					this.doubleTap(e, target);
				} else {
					this.sendTap(e, target);
				}
			}
		}
		if (this.downEvent && this.downEvent.which == e.which) {
			this.downEvent = null;
		}
	},

	/**
	* Handles `mouseover` [events]{@glossary event}.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	over: function(evt) {
		var e = gestureUtil.makeEvent('enter', evt);
		dispatcher.dispatch(e);
	},

	/**
	* Handles `mouseout` [events]{@glossary event}.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	out: function(evt) {
		var e = gestureUtil.makeEvent('leave', evt);
		dispatcher.dispatch(e);
	},

	/**
	* Generates `tap` [events]{@glossary event}.
	*
	* @param {Event} evt - The standard {@glossary event} [object]{glossary Object}.
	* @public
	*/
	sendTap: function(evt, target) {
		var e = gestureUtil.makeEvent('tap', evt);
		e.target = target;
		dispatcher.dispatch(e);
	},

	/**
	* @private
	*/
	tapData: {
		id: null,
		timer: null,
		start: 0
	},

	/**
	* Global configuration for double tap support. If this is true, all tap events for Controls
	* that do not have {@link module:enyo/Control~Control#doubleTapEnabled} explicitly set to false will be
	* delayed by the {@link module:enyo/Control~Control#doubleTapInterval}.
	*
	* @type {Boolean}
	* @default  false
	* @public
	*/
	doubleTapEnabled: false,

	/**
	* Determines if the provided target node supports double tap events
	*
	* @param {Node} target
	* @return {Boolean}
	* @private
	*/
	supportsDoubleTap: function(target) {
		var obj = dispatcher.findDispatchTarget(target);

		if(obj) {
			// Control.doubleTapEnabled is a tri-value property. The default is 'inherit'
			// which takes its cue from gesture's doubleTapEnabled. Values of true or false
			// override the default. So, if the global is true, any truthy value on Control
			// results in true. If the global is false, only an explicit true on Control
			// results in true.
			return this.doubleTapEnabled? !!obj.doubleTapEnabled : obj.doubleTapEnabled === true;
		} else {
			return false;
		}
	},

	/**
	* @private
	*/
	doubleTap: function(evt, t) {
		var obj = dispatcher.findDispatchTarget(t);

		if(this.tapData.id !== obj.id) {	// this is the first tap
			this.resetTapData(true);

			this.tapData.id = obj.id;
			this.tapData.event = evt;
			this.tapData.target = t;
			this.tapData.timer = setTimeout(utils.bind(this, "resetTapData", true), obj.doubleTapInterval);
			this.tapData.start = utils.perfNow();
		} else {							// this is the double tap
			var e2 = gestureUtil.makeEvent('doubletap', evt);
			e2.target = t;
			e2.tapInterval = utils.perfNow() - this.tapData.start;
			this.resetTapData(false);
			dispatcher.dispatch(e2);
		}
	},

	resetTapData: function(sendTap) {
		var data = this.tapData;

		if(sendTap && data.id) {
			this.sendTap(data.event, data.target);
		}

		clearTimeout(data.timer);
		data.id = data.start = data.event = data.target = data.timer = null;
	},

	/**
	* Given two [DOM nodes]{@glossary Node}, searches for a shared ancestor (looks up
	* the hierarchic [DOM]{@glossary DOM} tree of [nodes]{@glossary Node}). The shared
	* ancestor node is returned.
	*
	* @param {Node} controlA - Control one.
	* @param {Node} controlB - Control two.
	* @returns {(Node|undefined)} The shared ancestor.
	* @public
	*/
	findCommonAncestor: function(controlA, controlB) {
		var p = controlB;
		while (p) {
			if (this.isTargetDescendantOf(controlA, p)) {
				return p;
			}
			p = p.parentNode;
		}
	},

	/**
	* Given two controls, returns `true` if the `child` is inside the `parent`.
	*
	* @param {Node} child - The child to search for.
	* @param {Node} parent - The expected parent.
	* @returns {(Boolean|undefined)} `true` if the `child` is actually a child of `parent`.
	*/
	isTargetDescendantOf: function(child, parent) {
		var c = child;
		while(c) {
			if (c == parent) {
				return true;
			}
			c = c.parentNode;
		}
	},

	/**
	* @todo I'd rather refine the public API of gesture rather than simply forwarding the internal
	*   drag module but this will work in the interim. - ryanjduffy
	*
	* Known Consumers:
	*  - Spotlight.onAcceleratedKey - (prepare|begin|end)Hold()
	*  - Moonstone - configureHoldPulse()
	*/
	drag: drag
};

/**
* Contains various methods for gesture events.
*
* @type {object}
* @public
*/
module.exports.events = {
	/**
	* Shortcut to [gesture.down()]{@link module:enyo/gesture#down}.
	*
	* @memberof! module:enyo/gesture#
	* @method events.mousedown
	* @public
	*/
	mousedown: function(e) {
		gesture.down(e);
	},

	/**
	* Shortcut to [gesture.up()]{@link module:enyo/gesture#up}.
	*
	* @memberof! module:enyo/gesture#
	* @method events.mouseup
	* @public
	*/
	mouseup: function(e) {
		gesture.up(e);
	},

	/**
	* Shortcut to [gesture.move()]{@link module:enyo/gesture#move}.
	*
	* @memberof! module:enyo/gesture#
	* @method events.mousemove
	* @public
	*/
	mousemove:  function(e) {
		gesture.move(e);
	},

	/**
	* Shortcut to [gesture.over()]{@link module:enyo/gesture#over}.
	*
	* @memberof! module:enyo/gesture#
	* @method events.mouseover
	* @public
	*/
	mouseover:  function(e) {
		gesture.over(e);
	},

	/**
	* Shortcut to [gesture.out()]{@link module:enyo/gesture#out}.
	*
	* @memberof! module:enyo/gesture#
	* @method events.mouseout
	* @public
	*/
	mouseout:  function(e) {
		gesture.out(e);
	}
};

// Firefox mousewheel handling
dom.requiresWindow(function() {
	if (document.addEventListener) {
		document.addEventListener('DOMMouseScroll', function(inEvent) {
			var e = utils.clone(inEvent),
				isVertical = e.VERTICAL_AXIS == e.axis,
				wheelDelta;
			e.preventDefault = function() {
				inEvent.preventDefault();
			};
			e.type = 'mousewheel';

			wheelDelta = e.detail * -40;
			e.wheelDeltaY = isVertical ? wheelDelta : 0;
			e.wheelDeltaX = isVertical ? 0 : wheelDelta;

			dispatcher.dispatch(e);
		}, false);
	}
});

/**
* @private
*/
var handlers = {
	touchstart: true,
	touchmove: true,
	touchend: true
};

/**
* @private
*/
dispatcher.features.push(function (e) {
	var type = e.type;

	// NOTE: beware of properties in gesture.events and drag inadvertently mapped to event types
	if (gesture.events[type]) {
		gesture.events[type](e);
	}
	if (!platform.gesture && platform.touch && handlers[type]) {
		touchGestures[type](e);
	}
	if (drag[type]) {
		drag[type](e);
	}
});

},{'../dispatcher':'enyo/dispatcher','../dom':'enyo/dom','../platform':'enyo/platform','../utils':'enyo/utils','./drag':'enyo/gesture/drag','./touchGestures':'enyo/gesture/touchGestures','./util':'enyo/gesture/util'}],'enyo/Control':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Control~Control} kind.
* @module enyo/Control
*/

var
	kind = require('../kind'),
	utils = require('../utils'),
	platform = require('../platform'),
	dispatcher = require('../dispatcher'),
	options = require('../options'),
	roots = require('../roots');

var
	AccessibilitySupport = require('../AccessibilitySupport'),
	UiComponent = require('../UiComponent'),
	HTMLStringDelegate = require('../HTMLStringDelegate'),
	Dom = require('../dom');

var
	fullscreen = require('./fullscreen'),
	FloatingLayer = require('./floatingLayer');

// While the namespace isn't needed here, gesture is required for ontap events for which Control
// has a handler. Bringing them all in now for the time being.
require('../gesture');

var nodePurgatory;

/**
* Called by `Control.teardownRender()`. In certain circumstances,
* we need to temporarily keep a DOM node around after tearing down
* because we're still acting on a stream of touch events emanating
* from the node. See `Control.retainNode()` for more information.
*
* @private
*/
function storeRetainedNode (control) {
	var p = getNodePurgatory(),
		n = control._retainedNode;
	if (n) {
		p.appendChild(n);
	}
	control._retainedNode = null;
}

/**
* Called (via a callback) when it's time to release a DOM node
* that we've retained.
*
* @private
*/
function releaseRetainedNode (retainedNode) {
	var p = getNodePurgatory();
	if (retainedNode) {
		p.removeChild(retainedNode);
	}
}

/**
* Lazily add a hidden `<div>` to `document.body` to serve as a
* container for retained DOM nodes.
*
* @private
*/
function getNodePurgatory () {
	var p = nodePurgatory;
	if (!p) {
		p = nodePurgatory = document.createElement("div");
		p.id = "node_purgatory";
		p.style.display = "none";
		document.body.appendChild(p);
	}
	return p;
}

/**
* {@link module:enyo/Control~Control} is a [component]{@link module:enyo/UiComponent~UiComponent} that controls
* a [DOM]{@glossary DOM} [node]{@glossary Node} (i.e., an element in the user
* interface). Controls are generally visible and the user often interacts with
* them directly. While things like buttons and input boxes are obviously
* controls, in Enyo, a control may be as simple as a text item or as complex
* as an entire application. Both inherit the same basic core capabilities from
* this kind.
*
* For more information, see the documentation on
* [Controls]{@linkplain $dev-guide/key-concepts/controls.html} in the
* Enyo Developer Guide.
*
* **If you make changes to `enyo/Control`, be sure to add or update the
* appropriate unit tests.**
*
* @class Control
* @extends module:enyo/UiComponent~UiComponent
* @ui
* @public
*/
var Control = module.exports = kind(
	/** @lends module:enyo/Control~Control.prototype */ {

	name: 'enyo.Control',

	/**
	* @private
	*/
	kind: UiComponent,

	/**
	* @private
	*/
	mixins: options.accessibility ? [AccessibilitySupport] : null,

	/**
	* @type {String}
	* @default 'module:enyo/Control~Control'
	* @public
	*/
	defaultKind: null, // set after the fact

	/**
	* The [DOM node]{@glossary DOM} tag name that should be created.
	*
	* @type {String}
	* @default 'div'
	* @public
	*/
	tag: 'div',

	/**
	* A [hash]{@glossary Object} of attributes to be applied to the created
	* [DOM]{@glossary DOM} node.
	*
	* @type {Object}
	* @default null
	* @public
	*/
	attributes: null,

	/**
	* [Boolean]{@glossary Boolean} flag indicating whether this element should
	* "fit", or fill its container's size.
	*
	* @type {Boolean}
	* @default null
	* @public
	*/
	fit: null,

	/**
	* [Boolean]{@glossary Boolean} flag indicating whether HTML is allowed in
	* this control's [content]{@link module:enyo/Control~Control#content} property. If `false`
	* (the default), HTML will be encoded into [HTML entities]{@glossary entity}
	* (e.g., `&lt;` and `&gt;`) for literal visual representation.
	*
	* @type {Boolean}
	* @default null
	* @public
	*/
	allowHtml: false,

	/**
	* Mimics the HTML `style` attribute.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	style: '',

	/**
	* @private
	*/
	kindStyle: '',

	/**
	* Mimics the HTML `class` attribute.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	classes: '',

	/**
	* @private
	*/
	kindClasses: '',

	/**
	* [Classes]{@link module:enyo/Control~Control#classes} that are applied to all controls.
	*
	* @type {String}
	* @default ''
	* @public
	*/
	controlClasses: '',

	/**
	* The text-based content of the Control. If the [allowHtml]{@link module:enyo/Control~Control#allowHtml}
	* flag is set to `true`, you may set this property to an HTML string.
	* @public
	*/
	content: '',

	/**
	* If true or 'inherit' and enyo/gesture#doubleTabEnabled == true, will fire a doubletap
	* event, and will temporarily suppress a single tap while waiting for a double tap.
	*
	* @type {String|Boolean}
	* @default 'inherit'
	* @public
	*/
	doubleTapEnabled: 'inherit',

	/**
	* Time in milliseconds to wait to detect a double tap
	*
	* @type {Number}
	* @default 300
	* @public
	*/
	doubleTapInterval: 300,

	/**
	* If set to `true`, the [control]{@link module:enyo/Control~Control} will not be rendered until its
	* [showing]{@link module:enyo/Control~Control#showing} property has been set to `true`. This can be used
	* directly or is used by some widgets to control when children are rendered.
	*
	* It is important to note that setting this to `true` will _force_
	* [canGenerate]{@link module:enyo/Control~Control#canGenerate} and [showing]{@link module:enyo/Control~Control#showing}
	* to be `false`. Arbitrarily modifying the values of these properties prior to its initial
	* render may have unexpected results.
	*
	* Once a control has been shown/rendered with `renderOnShow` `true` the behavior will not
	* be used again.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	renderOnShow: false,

	/**
	* @todo Find out how to document "handlers".
	* @public
	*/
	handlers: {
		ontap: 'tap',
		onShowingChanged: 'showingChangedHandler'
	},

	/**
	* @private
	*/
	strictlyInternalEvents: {onenter: 1, onleave: 1},

	/**
	* @private
	*/
	isInternalEvent: function (event) {
		var rdt = dispatcher.findDispatchTarget(event.relatedTarget);
		return rdt && rdt.isDescendantOf(this);
	},

	// .................................
	// DOM NODE MANIPULATION API

	/**
	* Gets the bounds for this control. The `top` and `left` properties returned
	* by this method represent the control's positional distance in pixels from
	* either A) the first parent of this control that is absolutely or relatively
	* positioned, or B) the `document.body`.
	*
	* This is a shortcut convenience method for {@link module:enyo/dom#getBounds}.
	*
	* @returns {Object} An [object]{@glossary Object} containing `top`, `left`,
	* `width`, and `height` properties.
	* @public
	*/
	getBounds: function () {
		var node = this.hasNode(),
			bounds = node && Dom.getBounds(node);

		return bounds || {left: undefined, top: undefined, width: undefined, height: undefined};
	},

	/**
	* Sets the absolute/relative position and/or size for this control. Values
	* of `null` or `undefined` for the `bounds` properties will be ignored. You
	* may optionally specify a `unit` (i.e., a valid CSS measurement unit) as a
	* [string]{@glossary String} to be applied to each of the position/size
	* assignments.
	*
	* @param {Object} bounds - An [object]{@glossary Object}, optionally
	* containing one or more of the following properties: `width`, `height`,
	* `top`, `right`, `bottom`, and `left`.
	* @param {String} [unit='px']
	* @public
	*/
	setBounds: function (bounds, unit) {
		var newStyle = '',
			extents = ['width', 'height', 'left', 'top', 'right', 'bottom'],
			i = 0,
			val,
			ext;

		// if no unit is supplied, we default to pixels
		unit = unit || 'px';

		for (; (ext = extents[i]); ++i) {
			val = bounds[ext];
			if (val || val === 0) {
				newStyle += (ext + ':' + val + (typeof val == 'string' ? '' : unit) + ';');
			}
		}

		this.set('style', this.style + newStyle);
	},

	/**
	* Gets the bounds for this control. The `top` and `left` properties returned
	* by this method represent the control's positional distance in pixels from
	* `document.body`. To get the bounds relative to this control's parent(s),
	* use [getBounds()]{@link module:enyo/Control~Control#getBounds}.
	*
	* This is a shortcut convenience method for {@link module:enyo/dom#getAbsoluteBounds}.
	*
	* @returns {Object} An [object]{@glossary Object} containing `top`, `left`,
	* `width`, and `height` properties.
	* @public
	*/
	getAbsoluteBounds: function () {
		var node = this.hasNode(),
			bounds = node && Dom.getAbsoluteBounds(node);

		return bounds || {
			left: undefined,
			top: undefined,
			width: undefined,
			height: undefined,
			bottom: undefined,
			right: undefined
		};
	},

	/**
	* Shortcut method to set [showing]{@link module:enyo/Control~Control#showing} to `true`.
	*
	* @public
	*/
	show: function () {
		this.set('showing', true);
	},

	/**
	* Shortcut method to set [showing]{@link module:enyo/Control~Control#showing} to `false`.
	*
	* @public
	*/
	hide: function () {
		this.set('showing', false);
	},

	/**
	* Sets this control to be [focused]{@glossary focus}.
	*
	* @public
	*/
	focus: function () {
		if (this.hasNode()) this.node.focus();
	},

	/**
	* [Blurs]{@glossary blur} this control. (The opposite of
	* [focus()]{@link module:enyo/Control~Control#focus}.)
	*
	* @public
	*/
	blur: function () {
		if (this.hasNode()) this.node.blur();
	},

	/**
	* Determines whether this control currently has the [focus]{@glossary focus}.
	*
	* @returns {Boolean} Whether this control has focus. `true` if the control
	* has focus; otherwise, `false`.
	* @public
	*/
	hasFocus: function () {
		if (this.hasNode()) return document.activeElement === this.node;
	},

	/**
	* Determines whether this control's [DOM node]{@glossary Node} has been created.
	*
	* @returns {Boolean} Whether this control's [DOM node]{@glossary Node} has
	* been created. `true` if it has been created; otherwise, `false`.
	* @public
	*/
	hasNode: function () {
		return this.generated && (this.node || this.findNodeById());
	},

	/**
	* Gets the requested property (`name`) from the control's attributes
	* [hash]{@glossary Object}, from its cache of node attributes, or, if it has
	* yet to be cached, from the [node]{@glossary Node} itself.
	*
	* @param {String} name - The attribute name to get.
	* @returns {(String|null)} The value of the requested attribute, or `null`
	* if there isn't a [DOM node]{@glossary Node} yet.
	* @public
	*/
	getAttribute: function (name) {
		var node;

		// TODO: This is a fixed API assuming that no changes will happen to the DOM that
		// do not use it...original implementation of this method used the node's own
		// getAttribute method every time it could but we really only need to do that if we
		// weren't the ones that set the value to begin with -- in slow DOM situations this
		// could still be faster but it needs to be verified
		if (this.attributes.hasOwnProperty(name)) return this.attributes[name];
		else {
			node = this.hasNode();

			// we store the value so that next time we'll know what it is
			/*jshint -W093 */
			return (this.attributes[name] = (node ? node.getAttribute(name) : null));
			/*jshint +W093 */
		}
	},

	/**
	* Assigns an attribute to a control's [node]{@glossary Node}. Assigning
	* `name` a value of `null`, `false`, or the empty string `("")` will remove
	* the attribute from the node altogether.
	*
	* @param {String} name - Attribute name to assign/remove.
	* @param {(String|Number|null)} value - The value to assign to `name`
	* @returns {this} Callee for chaining.
	* @public
	*/
	setAttribute: function (name, value) {
		var attrs = this.attributes,
			node = this.hasNode(),
			delegate = this.renderDelegate || Control.renderDelegate;

		if (name) {
			attrs[name] = value;

			if (node) {
				if (value == null || value === false || value === '') {
					node.removeAttribute(name);
				} else node.setAttribute(name, value);
			}

			delegate.invalidate(this, 'attributes');
		}

		return this;
	},

	/**
	* Reads the `name` property directly from the [node]{@glossary Node}. You
	* may provide a default (`def`) to use if there is no node yet.
	*
	* @param {String} name - The [node]{@glossary Node} property name to get.
	* @param {*} def - The default value to apply if there is no node.
	* @returns {String} The value of the `name` property, or `def` if the node
	* was not available.
	* @public
	*/
	getNodeProperty: function (name, def) {
		return this.hasNode() ? this.node[name] : def;
	},

	/**
	* Sets the value of a property (`name`) directly on the [node]{@glossary Node}.
	*
	* @param {String} name - The [node]{@glossary Node} property name to set.
	* @param {*} value - The value to assign to the property.
	* @returns {this} The callee for chaining.
	* @public
	*/
	setNodeProperty: function (name, value) {
		if (this.hasNode()) this.node[name] = value;
		return this;
	},

	/**
	* Appends additional content to this control.
	*
	* @param {String} content - The new string to add to the end of the `content`
	* property.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addContent: function (content) {
		return this.set('content', this.get('content') + content);
	},

	// .................................

	// .................................
	// STYLE/CLASS API

	/**
	* Determines whether this control has the class `name`.
	*
	* @param {String} name - The name of the class (or classes) to check for.
	* @returns {Boolean} Whether the control has the class `name`.
	* @public
	*/
	hasClass: function (name) {
		return name && (' ' + this.classes + ' ').indexOf(' ' + name + ' ') > -1;
	},

	/**
	* Adds the specified class to this control's list of classes.
	*
	* @param {String} name - The name of the class to add.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addClass: function (name) {
		var classes = this.classes || '';

		// NOTE: Because this method accepts a string and for efficiency does not wish to
		// parse it to determine if it is actually multiple classes we later pull a trick
		// to keep it normalized and synchronized with our attributes hash and the node's
		if (name && !this.hasClass(name)) {

			// this is hooked
			this.set('classes', classes + (classes ? (' ' + name) : name));
		}

		return this;
	},

	/**
	* Removes the specified class from this control's list of classes.
	*
	* **Note: It is not advisable to pass a string of multiple, space-delimited
	* class names into this method. Instead, call the method once for each class
	* name that you want to remove.**
	*
	* @param {String} name - The name of the class to remove.
	* @returns {this} The callee for chaining.
	* @public
	*/
	removeClass: function (name) {
		var classes = this.classes;

		if (name) {
			this.set('classes', (' ' + classes + ' ').replace(' ' + name + ' ', ' ').trim());
		}

		return this;
	},

	/**
	* Adds or removes the specified class conditionally, based on the state
	* of the `add` argument.
	*
	* @param {String} name - The name of the class to add or remove.
	* @param {Boolean} add - If `true`, `name` will be added as a class; if
	* `false`, it will be removed.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addRemoveClass: function (name, add) {
		return name ? this[add ? 'addClass' : 'removeClass'](name) : this;
	},

	/**
	* @private
	*/
	classesChanged: function () {
		var classes = this.classes,
			node = this.hasNode(),
			attrs = this.attributes,
			delegate = this.renderDelegate || Control.renderDelegate;

		if (node) {
			if (classes || this.kindClasses) {
				node.setAttribute('class', classes || this.kindClasses);
			} else node.removeAttribute('class');

			this.classes = classes = node.getAttribute('class');
		}

		// we need to update our attributes.class value and flag ourselves to be
		// updated
		attrs['class'] = classes;

		// we want to notify the delegate that the attributes have changed in case it wants
		// to handle this is some special way
		delegate.invalidate(this, 'attributes');
	},

	/**
	* Applies a CSS style directly to the control. Use the `prop` argument to
	* specify the CSS property name you'd like to set, and `value` to specify
	* the desired value. Setting `value` to `null` will remove the CSS property
	* `prop` altogether.
	*
	* @param {String} prop - The CSS property to assign.
	* @param {(String|Number|null|undefined)} value - The value to assign to
	* `prop`. Setting a value of `null`, `undefined`, or the empty string `("")`
	* will remove the property `prop` from the control.
	* @returns {this} Callee for chaining.
	* @public
	*/
	applyStyle: function (prop, value) {

		// NOTE: This method deliberately avoids calling set('style', ...) for performance
		// as it will have already been parsed by the browser so we pass it on via the
		// notification system which is the same

		// TODO: Wish we could delay this potentially...
		// if we have a node we render the value immediately and update our style string
		// in the process to keep them synchronized
		var node = this.hasNode(),
			style = this.style,
			delegate = this.renderDelegate || Control.renderDelegate;

		// FIXME: This is put in place for a Firefox bug where setting a style value of a node
		// via its CSSStyleDeclaration object (by accessing its node.style property) does
		// not work when using a CSS property name that contains one or more dash, and requires
		// setting the property via the JavaScript-style property name. This fix should be
		// removed once this issue has been resolved in the Firefox mainline and its variants
		// (it is currently resolved in the 36.0a1 nightly):
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1083457
		if (node && (platform.firefox < 35 || platform.firefoxOS || platform.androidFirefox)) {
			prop = prop.replace(/-([a-z])/gi, function(match, submatch) {
				return submatch.toUpperCase();
			});
		}

		if (value !== null && value !== '' && value !== undefined) {
			// update our current cached value
			if (node) {
				node.style[prop] = value;

				// cssText is an internal property used to help know when to sync and not
				// sync with the node in styleChanged
				this.style = this.cssText = node.style.cssText;

				// otherwise we have to try and prepare it for the next time it is rendered we
				// will need to update it because it will not be synchronized
			} else this.set('style', style + (' ' + prop + ':' + value + ';'));
		} else {

			// in this case we are trying to clear the style property so if we have the node
			// we let the browser handle whatever the value should be now and otherwise
			// we have to parse it out of the style string and wait to be rendered

			if (node) {
				node.style[prop] = '';
				this.style = this.cssText = node.style.cssText;

				// we need to invalidate the style for the delegate
				delegate.invalidate(this, 'style');
			} else {

				// this is a rare case to nullify the style of a control that is not
				// rendered or does not have a node
				style = style.replace(new RegExp(
					// This looks a lot worse than it is. The complexity stems from needing to
					// match a url container that can have other characters including semi-
					// colon and also that the last property may/may-not end with one
					'\\s*' + prop + '\\s*:\\s*[a-zA-Z0-9\\ ()_\\-\'"%,]*(?:url\\(.*\\)\\s*[a-zA-Z0-9\\ ()_\\-\'"%,]*)?\\s*(?:;|;?$)',
					'gi'
				),'');
				this.set('style', style);
			}
		}
		// we need to invalidate the style for the delegate -- regardless of whether or
		// not the node exists to ensure that the tag is updated properly the next time
		// it is rendered
		delegate.invalidate(this, 'style');

		return this;
	},

	/**
	* Allows the addition of several CSS properties and values at once, via a
	* single string, similar to how the HTML `style` attribute works.
	*
	* @param {String} css - A string containing one or more valid CSS styles.
	* @returns {this} The callee for chaining.
	* @public
	*/
	addStyles: function (css) {
		var key,
			newStyle = '';

		if (typeof css == 'object') {
			for (key in css) newStyle += (key + ':' + css[key] + ';');
		} else newStyle = css || '';

		this.set('style', this.style + newStyle);
	},

	/**
	* @private
	*/
	styleChanged: function () {
		var delegate = this.renderDelegate || Control.renderDelegate;

		// if the cssText internal string doesn't match then we know style was set directly
		if (this.cssText !== this.style) {

			// we need to render the changes and synchronize - this means that the style
			// property was set directly so we will reset it prepending it with the original
			// style (if any) for the kind and keeping whatever the browser is keeping
			if (this.hasNode()) {
				this.node.style.cssText = this.kindStyle + (this.style || '');
				// now we store the parsed version
				this.cssText = this.style = this.node.style.cssText;
			}

			// we need to ensure that the delegate has an opportunity to handle this change
			// separately if it needs to
			delegate.invalidate(this, 'style');
		}
	},

	/**
	* Retrieves a control's CSS property value. This doesn't just pull the
	* assigned value of `prop`; it returns the browser's understanding of `prop`,
	* the "computed" value. If the control isn't been rendered yet, and you need
	* a default value (such as `0`), include it in the arguments as `def`.
	*
	* @param {String} prop - The property name to get.
	* @param {*} [def] - An optional default value, in case the control isn't
	* rendered yet.
	* @returns {(String|Number)} The computed value of `prop`, as the browser
	* sees it.
	* @public
	*/
	getComputedStyleValue: function (prop, def) {
		return this.hasNode() ? Dom.getComputedStyleValue(this.node, prop) : def;
	},

	/**
	* @private
	*/
	findNodeById: function () {
		return this.id && (this.node = Dom.byId(this.id));
	},

	/**
	* @private
	*/
	idChanged: function (was) {
		if (was) Control.unregisterDomEvents(was);
		if (this.id) {
			Control.registerDomEvents(this.id, this);
			this.setAttribute('id', this.id);
		}
	},

	/**
	* @private
	*/
	contentChanged: function () {
		var delegate = this.renderDelegate || Control.renderDelegate;
		delegate.invalidate(this, 'content');
	},

	/**
	* If the control has been generated, re-flows the control.
	*
	* @public
	*/
	beforeChildRender: function () {
		// if we are generated, we should flow before rendering a child;
		// if not, the render context isn't ready anyway
		if (this.generated) this.flow();
	},

	/**
	* @private
	*/
	showingChanged: function (was) {
		var nextControl;
		// if we are changing from not showing to showing we attempt to find whatever
		// our last known value for display was or use the default
		if (!was && this.showing) {
			this.applyStyle('display', this._display || '');

			// note the check for generated and canGenerate as changes to canGenerate will force
			// us to ignore the renderOnShow value so we don't undo whatever the developer was
			// intending
			if (!this.generated && !this.canGenerate && this.renderOnShow) {
				nextControl = this.getNextControl();
				if (nextControl && !this.addBefore) this.addBefore = nextControl;
				this.set('canGenerate', true);
				this.render();
			}

			this.sendShowingChangedEvent(was);
		}

		// if we are supposed to be hiding the control then we need to cache our current
		// display state
		else if (was && !this.showing) {
			this.sendShowingChangedEvent(was);
			// we can't truly cache this because it _could_ potentially be set to multiple
			// values throughout its lifecycle although that seems highly unlikely...
			this._display = this.hasNode() ? this.node.style.display : '';
			this.applyStyle('display', 'none');
		}

	},

	/**
	* @private
	*/
	renderOnShowChanged: function () {
		// ensure that the default value assigned to showing is actually a boolean
		// and that it is only true if the renderOnShow is also false
		this.showing = ((!!this.showing) && !this.renderOnShow);
		// we want to check and make sure that the canGenerate value is correct given
		// the state of renderOnShow
		this.canGenerate = (this.canGenerate && !this.renderOnShow);
	},

	/**
	* @private
	*/
	sendShowingChangedEvent: function (was) {
		var waterfall = (was === true || was === false),
			parent = this.parent;

		// make sure that we don't trigger the waterfall when this method
		// is arbitrarily called during _create_ and it should only matter
		// that it changed if our parent's are all showing as well
		if (waterfall && (parent ? parent.getAbsoluteShowing(true) : true)) {
			this.waterfall('onShowingChanged', {originator: this, showing: this.showing});
		}
	},

	/**
	* Returns `true` if this control and all parents are showing.
	*
	* @param {Boolean} ignoreBounds - If `true`, it will not force a layout by retrieving
	*	computed bounds and rely on the return from [showing]{@link module:enyo/Control~Control#showing}
	* exclusively.
	* @returns {Boolean} Whether the control is showing (visible).
	* @public
	*/
	getAbsoluteShowing: function (ignoreBounds) {
		var bounds = !ignoreBounds ? this.getBounds() : null,
			parent = this.parent;

		if (!this.generated || this.destroyed || !this.showing || (bounds &&
			bounds.height === 0 && bounds.width === 0)) {
			return false;
		}

		if (parent && parent.getAbsoluteShowing) {

			// we actually don't care what the parent says if it is the floating layer
			if (!this.parentNode || (this.parentNode !== Control.floatingLayer.hasNode())) {
				return parent.getAbsoluteShowing(ignoreBounds);
			}
		}

		return true;
	},

	/**
	* Handles the `onShowingChanged` event that is waterfalled by controls when
	* their `showing` value is modified. If the control is not showing itself
	* already, it will not continue the waterfall. Overload this method to
	* provide additional handling for this event.
	*
	* @private
	*/
	showingChangedHandler: function (sender, event) {
		// If we have deferred a reflow, do it now...
		if (this.showing && this._needsReflow) {
			this.reflow();
		}

		// Then propagate `onShowingChanged` if appropriate
		return sender === this ? false : !this.showing;
	},

	/**
	* Overriding reflow() so that we can take `showing` into
	* account and defer reflowing accordingly.
	*
	* @private
	*/
	reflow: function () {
		if (this.layout) {
			this._needsReflow = this.showing ? this.layout.reflow() : true;
		}
	},

	/**
	* @private
	*/
	fitChanged: function () {
		this.parent.reflow();
	},

	/**
	* Determines whether we are in fullscreen mode or not.
	*
	* @returns {Boolean} Whether we are currently in fullscreen mode.
	* @public
	*/
	isFullscreen: function () {
		return (this.hasNode() && this.node === Control.Fullscreen.getFullscreenElement());
	},

	/**
	* Requests that this control be displayed fullscreen (like a video
	* container). If the request is granted, the control fills the screen and
	* `true` is returned; if the request is denied, the control is not resized
	* and `false` is returned.
	*
	* @returns {Boolean} `true` on success; otherwise, `false`.
	* @public
	*/
	requestFullscreen: function () {
		if (!this.hasNode()) return false;

		if (Control.Fullscreen.requestFullscreen(this)) {
			return true;
		}

		return false;
	},

	/**
	* Ends fullscreen mode for this control.
	*
	* @returns {Boolean} If the control was in fullscreen mode before this
	* method was called, it is taken out of that mode and `true` is returned;
	* otherwise, `false` is returned.
	* @public
	*/
	cancelFullscreen: function() {
		if (this.isFullscreen()) {
			Control.Fullscreen.cancelFullscreen();
			return true;
		}

		return false;
	},

	// .................................

	// .................................
	// RENDER-SCHEME API

	/**
	* Indicates whether the control is allowed to be generated, i.e., rendered
	* into the [DOM]{@glossary DOM} tree.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	canGenerate: true,

	/**
	* Indicates whether the control is visible.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	showing: true,

	/**
	* The [node]{@glossary Node} that this control will be rendered into.
	*
	* @type {module:enyo/Control~Control}
	* @default null
	* @public
	*/
	renderDelegate: null,

	/**
	* Indicates whether the control has been generated yet.
	*
	* @type {Boolean}
	* @default false
	* @private
	*/
	generated: false,

	/**
	* Forces the control to be rendered. You should use this sparingly, as it
	* can be costly, but it may be necessary in cases where a control or its
	* contents have been updated surreptitiously.
	*
	* @returns {this} The callee for chaining.
	* @public
	*/
	render: function () {

		// prioritize the delegate set for this control otherwise use the default
		var delegate = this.renderDelegate || Control.renderDelegate;

		// the render delegate acts on the control
		delegate.render(this);

		return this;
	},

	/**
	* Takes this control and drops it into a (new/different)
	* [DOM node]{@glossary Node}. This will replace any existing nodes in the
	* target `parentNode`.
	*
	* @param {Node} parentNode - The new parent of this control.
	* @param {Boolean} preventRooting - If `true`, this control will not be treated as a root
	*	view and will not be added to the set of roots.
	* @returns {this} The callee for chaining.
	* @public
	*/
	renderInto: function (parentNode, preventRooting) {
		var delegate = this.renderDelegate || Control.renderDelegate,
			noFit = this.fit === false;

		// attempt to retrieve the parentNode
		parentNode = Dom.byId(parentNode);

		// teardown in case of previous render
		delegate.teardownRender(this);

		if (parentNode == document.body && !noFit) this.setupBodyFitting();
		else if (this.fit) this.addClass('enyo-fit enyo-clip');

		// for IE10 support, we want full support over touch actions in enyo-rendered areas
		this.addClass('enyo-no-touch-action');

		// add css to enable hw-accelerated scrolling on non-android platforms
		// ENYO-900, ENYO-901
		this.setupOverflowScrolling();

		// if there are unflushed body classes we flush them now...
		Dom.flushBodyClasses();

		// we inject this as a root view because, well, apparently that is just an assumption
		// we've been making...
		if (!preventRooting) {
			roots.addToRoots(this);
		}

		// now let the delegate render it the way it needs to
		delegate.renderInto(this, parentNode);

		Dom.updateScaleFactor();

		return this;
	},

	/**
	* A function that fires after the control has rendered. This performs a
	* reflow.
	*
	* @public
	*/
	rendered: function () {
		var child,
			i = 0;

		// CAVEAT: Currently we use one entry point ('reflow') for
		// post-render layout work *and* post-resize layout work.
		this.reflow();

		for (; (child = this.children[i]); ++i) {
			if (child.generated) child.rendered();
		}
	},

	/**
	* You should generally not need to call this method in your app code.
	* It is used internally by some Enyo UI libraries to handle a rare
	* issue that sometimes arises when using a virtualized list or repeater
	* on a touch device.
	*
	* This issue occurs when a gesture (e.g. a drag) originates with a DOM
	* node that ends up being destroyed in mid-gesture as the list updates.
	* When the node is destroyed, the stream of DOM events representing the
	* gesture stops, causing the associated action to stop or otherwise
	* fail.
	*
	* You can prevent this problem from occurring by calling `retainNode`
	* on the {@link module:enyo/Control~Control} from which the gesture originates. Doing
	* so will cause Enyo to keep the DOM node around (hidden from view)
	* until you explicitly release it. You should call `retainNode` in the
	* event handler for the event that starts the gesture.
	*
	* `retainNode` returns a function that you must call when the gesture
	* ends to release the node. Make sure you call this function to avoid
	* "leaking" the DOM node (failing to remove it from the DOM).
	*
	* @param {Node} node - Optional. Defaults to the node associated with
	* the Control (`Control.node`). You can generally omit this parameter
	* when working with {@link module:enyo/DataList~DataList} or {@link module:enyo/DataGridList~DataGridList},
	* but should generally pass in the event's target node (`event.target`)
	* when working with {@link module:layout/List~List}. (Because {@link module:layout/List~List} is
	* based on the Flyweight pattern, the event's target node is often not
	* the node currently associated with the Control at the time the event
	* occurs.)
	* @returns {Function} Keep a reference to this function and call it
	* to release the node when the gesture has ended.
	* @public
	*/
	retainNode: function(node) {
		var control = this,
			retainedNode = this._retainedNode = (node || this.hasNode());
		return function() {
			if (control && (control._retainedNode == retainedNode)) {
				control._retainedNode = null;
			} else {
				releaseRetainedNode(retainedNode);
			}
		};
	},

	/**
	* If a Control needs to do something before it and its children's DOM nodes
	* are torn down, it can implement this lifecycle method, which is called automatically
	* by the framework and takes no arguments.
	*
	* @type {Function}
	* @protected
	*/
	beforeTeardown: null,

	/**
	* @param {Boolean} [cache] - Whether or not we are tearing down as part of a destroy
	*	operation, or if we are just caching. If `true`, the `showing` and `canGenerate`
	*	properties of the control will not be reset.
	* @private
	*/
	teardownRender: function (cache) {
		var delegate = this.renderDelegate || Control.renderDelegate;

		if (this._retainedNode) {
			storeRetainedNode(this);
		}

		delegate.teardownRender(this, cache);

		// if the original state was set with renderOnShow true then we need to reset these
		// values as well to coordinate the original intent
		if (this.renderOnShow && !cache) {
			this.set('showing', false);
			this.set('canGenerate', false);
		}
	},

	/**
	* @private
	*/
	teardownChildren: function () {
		var delegate = this.renderDelegate || Control.renderDelegate;

		delegate.teardownChildren(this);
	},

	/**
	* @private
	*/
	addNodeToParent: function () {
		var pn;

		if (this.node) {
			pn = this.getParentNode();
			if (pn) {
				if (this.addBefore !== undefined) {
					this.insertNodeInParent(pn, this.addBefore && this.addBefore.hasNode());
				} else this.appendNodeToParent(pn);
			}
		}
	},

	/**
	* @private
	*/
	appendNodeToParent: function(parentNode) {
		parentNode.appendChild(this.node);
	},

	/**
	* @private
	*/
	insertNodeInParent: function(parentNode, beforeNode) {
		parentNode.insertBefore(this.node, beforeNode || parentNode.firstChild);
	},

	/**
	* @private
	*/
	removeNodeFromDom: function() {
		var node = this.hasNode();
		if (node) {
			Dom.removeNode(node);
		}
	},

	/**
	* @private
	*/
	getParentNode: function () {
		return this.parentNode || (this.parent && (
			this.parent.hasNode() || this.parent.getParentNode())
		);
	},

	// .................................

	/**
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function (props) {
			var attrs = props && props.attributes;

			// ensure that we both keep an instance copy of defined attributes but also
			// update the hash with any additional instance definitions at runtime
			this.attributes = this.attributes ? utils.clone(this.attributes) : {};
			if (attrs) {
				utils.mixin(this.attributes, attrs);
				delete  props.attributes;
			}

			return sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function (props) {
			var classes;

			// initialize the styles for this instance
			this.style = this.kindStyle + this.style;

			// set initial values based on renderOnShow
			this.renderOnShowChanged();

			// super initialization
			sup.apply(this, arguments);

			// ensure that if we aren't showing -> true then the correct style
			// is applied - note that there might be issues with this because we are
			// trying not to have to parse out any other explicit display value during
			// initialization and we can't check because we haven't rendered yet
			if (!this.showing) this.style += ' display: none;';

			// try and make it so we only need to call the method once during
			// initialization and only then when we have something to add
			classes = this.kindClasses;
			if (classes && this.classes) classes += (' ' + this.classes);
			else if (this.classes) classes = this.classes;

			// if there are known classes needed to be applied from the kind
			// definition and the instance definition (such as a component block)
			this.classes = this.attributes['class'] = classes ? classes.trim() : classes;

			// setup the id for this control if we have one
			this.idChanged();
			this.contentChanged();
		};
	}),

	/**
	* Destroys the control and removes it from the [DOM]{@glossary DOM}. Also
	* removes the control's ability to receive bubbled events.
	*
	* @public
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			// if the control has been rendered we ensure it is removed from the DOM
			this.removeNodeFromDom();

			// ensure no other bubbled events can be dispatched to this control
			dispatcher.$[this.id] = null;
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	dispatchEvent: kind.inherit(function (sup) {
		return function (name, event, sender) {
			// prevent dispatch and bubble of events that are strictly internal (e.g.
			// enter/leave)
			if (this.strictlyInternalEvents[name] && this.isInternalEvent(event)) {
				return true;
			}
			return sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	addChild: kind.inherit(function (sup) {
		return function (control) {
			control.addClass(this.controlClasses);
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	removeChild: kind.inherit(function (sup) {
		return function (control) {
			sup.apply(this, arguments);
			control.removeClass(this.controlClasses);
		};
	}),

	/**
	* @private
	*/
	set: kind.inherit(function (sup) {
		return function (path, value, opts) {
			// this should be updated if a better api for hooking becomes available but for
			// now we just do this directly to ensure that the showing value is actually
			// a boolean
			if (path == 'showing') {
				return sup.call(this, path, !! value, opts);
			} else return sup.apply(this, arguments);
		};
	}),

	// .................................
	// BACKWARDS COMPATIBLE API, LEGACY METHODS AND PUBLIC PROPERTY
	// METHODS OR PROPERTIES THAT PROBABLY SHOULD NOT BE HERE BUT ARE ANYWAY

	/**
	* Apparently used by Ares 2 still but we have the property embedded in the kind...
	*
	* @deprecated
	* @private
	*/
	isContainer: false,

	/**
	* @private
	*/
	rtl: false,

	/**
	* @private
	*/
	setupBodyFitting: function () {
		Dom.applyBodyFit();
		this.addClass('enyo-fit enyo-clip');
	},

	/*
	* If the platform is Android or Android-Chrome, don't include the css rule
	* `-webkit-overflow-scrolling: touch`, as it is not supported in Android and leads to
	* overflow issues (ENYO-900 and ENYO-901). Similarly, BB10 has issues repainting
	* out-of-viewport content when `-webkit-overflow-scrolling` is used (ENYO-1396).
	*
	* @private
	*/
	setupOverflowScrolling: function () {
		if(platform.android || platform.androidChrome || platform.blackberry) {
			return;
		}
		Dom.addBodyClass('webkitOverflowScrolling');
	},

	/**
	* Sets the control's directionality based on its content, or an optional `stringInstead`.
	*
	* @param {String} [stringInstead] An alternate string for consideration may be sent instead,
	*	in-case the string to test the directionality of the control is stored in `this.value`,
	*	or some other property, for example.
	* @private
	*/
	detectTextDirectionality: function (stringInstead) {
		// If an argument was supplied at all, use it, even if it's undefined.
		// Values that are null or undefined, or are numbers, arrays, and some objects are safe
		// to be tested.
		var str = (arguments.length) ? stringInstead : this.content;
		if (str || str === 0) {
			this.rtl = utils.isRtl(str);
			this.applyStyle('direction', this.rtl ? 'rtl' : 'ltr');
		} else {
			this.applyStyle('direction', null);
		}

	},

	// .................................

	// .................................
	// DEPRECATED

	/**
	* @deprecated
	* @public
	*/
	getTag: function () {
		return this.tag;
	},

	/**
	* @deprecated
	* @public
	*/
	setTag: function (tag) {
		var was = this.tag;

		if (tag && typeof tag == 'string') {
			this.tag = tag;
			if (was !== tag) this.notify('tag', was, tag);
		}
		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getAttributes: function () {
		return this.attributes;
	},

	/**
	* @deprecated
	* @public
	*/
	setAttributes: function (attrs) {
		var was = this.attributes;

		if (typeof attrs == 'object') {
			this.attributes = attrs;
			if (attrs !== was) this.notify('attributes', was, attrs);
		}

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getClasses: function () {
		return this.classes;
	},

	/**
	* @deprecated
	* @public
	*/
	setClasses: function (classes) {
		var was = this.classes;

		this.classes = classes;
		if (was != classes) this.notify('classes', was, classes);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getStyle: function () {
		return this.style;
	},

	/**
	* @deprecated
	* @public
	*/
	setStyle: function (style) {
		var was = this.style;

		this.style = style;
		if (was != style) this.notify('style', was, style);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getContent: function () {
		return this.content;
	},

	/**
	* @deprecated
	* @public
	*/
	setContent: function (content) {
		var was = this.content;
		this.content = content;

		if (was != content) this.notify('content', was, content);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getShowing: function () {
		return this.showing;
	},

	/**
	* @deprecated
	* @public
	*/
	setShowing: function (showing) {
		var was = this.showing;

		// force the showing property to always be a boolean value
		this.showing = !! showing;

		if (was != showing) this.notify('showing', was, showing);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getAllowHtml: function () {
		return this.allowHtml;
	},

	/**
	* @deprecated
	* @public
	*/
	setAllowHtml: function (allow) {
		var was = this.allowHtml;
		this.allowHtml = !! allow;

		if (was !== allow) this.notify('allowHtml', was, allow);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getCanGenerate: function () {
		return this.canGenerate;
	},

	/**
	* @deprecated
	* @public
	*/
	setCanGenerate: function (can) {
		var was = this.canGenerate;
		this.canGenerate = !! can;

		if (was !== can) this.notify('canGenerate', was, can);

		return this;
	},

	/**
	* @deprecated
	* @public
	*/
	getFit: function () {
		return this.fit;
	},

	/**
	* @deprecated
	* @public
	*/
	setFit: function (fit) {
		var was = this.fit;
		this.fit = !! fit;

		if (was !== fit) this.notify('fit', was, fit);

		return this;
	},

	/**
	* @ares
	* @deprecated
	* @public
	*/
	getIsContainer: function () {
		return this.isContainer;
	},

	/**
	* @ares
	* @deprecated
	* @public
	*/
	setIsContainer: function (isContainer) {
		var was = this.isContainer;
		this.isContainer = !! isContainer;

		if (was !== isContainer) this.notify('isContainer', was, isContainer);

		return this;
	}

	// .................................

});

/**
* @static
* @public
*/
kind.setDefaultCtor(Control);

/**
* @static
* @public
*/
Control.renderDelegate = HTMLStringDelegate;

/**
* @private
*/
Control.registerDomEvents = function (id, control) {
	dispatcher.$[id] = control;
};

/**
* @private
*/
Control.unregisterDomEvents = function (id) {
	dispatcher.$[id] = null;
};

/**
* @private
*/
Control.normalizeCssStyleString = function (style) {
	return style ? (
		(";" + style)
		// add a semi-colon if it's not the last character (also trim possible unnecessary whitespace)
		.replace(/([^;])\s*$/, "$1;")
		// ensure we have one space after each colon or semi-colon
		.replace(/\s*;\s*([\w-]+)\s*:\s*/g, "; $1: ")
		// remove first semi-colon and space
		.substr(2).trim()
	) : "";
};

/**
* @private
*/
Control.concat = function (ctor, props, instance) {
	var proto = ctor.prototype || ctor,
		attrs,
		str;

	if (props.classes) {
		if (instance) {
			str = (proto.classes ? (proto.classes + ' ') : '') + props.classes;
			proto.classes = str;
		} else {
			str = (proto.kindClasses || '') + (proto.classes ? (' ' + proto.classes) : '');
			proto.kindClasses = str;
			proto.classes = props.classes;
		}
		delete props.classes;
	}

	if (props.style) {
		if (instance) {
			str = (proto.style ? proto.style : '') + props.style;
			proto.style = Control.normalizeCssStyleString(str);
		} else {
			str = proto.kindStyle ? proto.kindStyle : '';
			str += proto.style ? (';' + proto.style) : '';
			str += props.style;

			// moved it all to kindStyle so that it will be available whenever instanced
			proto.kindStyle = Control.normalizeCssStyleString(str);
		}
		delete props.style;
	}

	if (props.attributes) {
		attrs = proto.attributes;
		proto.attributes = attrs ? utils.mixin({}, [attrs, props.attributes]) : props.attributes;
		delete props.attributes;
	}
};

Control.prototype.defaultKind = Control;

// Control has to be *completely* set up before creating the floating layer setting up the
// fullscreen object because fullscreen depends on floating layer which depends on Control.

/**
* @static
* @public
*/
Control.FloatingLayer = FloatingLayer(Control);

/**
* @static
* @public
*/
Control.floatingLayer = new Control.FloatingLayer({id: 'floatingLayer'});

/**
* @static
* @public
*/
Control.Fullscreen = fullscreen(Control);

},{'../kind':'enyo/kind','../utils':'enyo/utils','../platform':'enyo/platform','../dispatcher':'enyo/dispatcher','../options':'enyo/options','../roots':'enyo/roots','../AccessibilitySupport':'enyo/AccessibilitySupport','../UiComponent':'enyo/UiComponent','../HTMLStringDelegate':'enyo/HTMLStringDelegate','../dom':'enyo/dom','./fullscreen':'enyo/Control/fullscreen','./floatingLayer':'enyo/Control/floatingLayer','../gesture':'enyo/gesture'}],'enyo/touch':[function (module,exports,global,require,request){
/**
* This module has no exports. It merely extends {@link module:enyo/gesture} to enable touch events.
*
* @private
* @module enyo/touch
*/
require('enyo');

var
	utils = require('./utils'),
	gesture = require('./gesture'),
	dispatcher = require('./dispatcher'),
	platform = require('./platform');

var
	Dom = require('./dom'),
	Job = require('./job');

function dispatch (e) {
	return dispatcher.dispatch(e);
}

/**
* @private
*/
Dom.requiresWindow(function() {

	/**
	* Add touch-specific gesture feature
	* 
	* @private
	*/

	/**
	* @private
	*/
	var oldevents = gesture.events;
	
	/**
	* @ignore
	*/
	gesture.events.touchstart = function (e) {
		// for duration of this touch, only handle touch events.  Old event
		// structure will be restored during touchend.
		gesture.events = touchGesture;
		gesture.events.touchstart(e);
	};
	
	/**
	* @ignore
	*/
	var touchGesture = {

		/**
		* @ignore
		* @private
		*/
		_touchCount: 0,

		/**
		* @ignore
		* @private
		*/
		touchstart: function (e) {
			this._touchCount += e.changedTouches.length;
			this.excludedTarget = null;
			var event = this.makeEvent(e);
			//store the finger which generated the touchstart event
			this.currentIdentifier = event.identifier;
			gesture.down(event);
			// generate a new event object since over is a different event
			event = this.makeEvent(e);
			this.overEvent = event;
			gesture.over(event);
		},

		/**
		* @ignore
		* @private
		*/
		touchmove: function (e) {
			Job.stop('resetGestureEvents');
			// NOTE: allow user to supply a node to exclude from event
			// target finding via the drag event.
			var de = gesture.drag.dragEvent;
			this.excludedTarget = de && de.dragInfo && de.dragInfo.node;
			var event = this.makeEvent(e);
			// do not generate the move event if this touch came from a different
			// finger than the starting touch
			if (this.currentIdentifier !== event.identifier) {
				return;
			}
			gesture.move(event);
			// prevent default document scrolling if enyo.bodyIsFitting == true
			// avoid window scrolling by preventing default on this event
			// note: this event can be made unpreventable (native scrollers do this)
			if (Dom.bodyIsFitting) {
				e.preventDefault();
			}
			// synthesize over and out (normally generated via mouseout)
			if (this.overEvent && this.overEvent.target != event.target) {
				this.overEvent.relatedTarget = event.target;
				event.relatedTarget = this.overEvent.target;
				gesture.out(this.overEvent);
				gesture.over(event);
			}
			this.overEvent = event;
		},

		/**
		* @ignore
		* @private
		*/
		touchend: function (e) {
			gesture.up(this.makeEvent(e));
			// NOTE: in touch land, there is no distinction between
			// a pointer enter/leave and a drag over/out.
			// While it may make sense to send a leave event when a touch
			// ends, it does not make sense to send a dragout.
			// We avoid this by processing out after up, but
			// this ordering is ad hoc.
			gesture.out(this.overEvent);
			// reset the event handlers back to the mouse-friendly ones after
			// a short timeout. We can't do this directly in this handler
			// because it messes up Android to handle the mouseup event.
			// FIXME: for 2.1 release, conditional on platform being
			// desktop Chrome, since we're seeing issues in PhoneGap with this
			// code.
			this._touchCount -= e.changedTouches.length;
		},

		/**
		* Use `mouseup()` after touches are done to reset {@glossary event} handling 
		* back to default; this works as long as no one did a `preventDefault()` on
		* the touch events.
		* 
		* @ignore
		* @private
		*/
		mouseup: function () {
			if (this._touchCount === 0) {
				this.sawMousedown = false;
				gesture.events = oldevents;
			}
		},

		/**
		* @ignore
		* @private
		*/
		makeEvent: function (e) {
			var event = utils.clone(e.changedTouches[0]);
			event.srcEvent = e;
			event.target = this.findTarget(event);
			// normalize "mouse button" info
			event.which = 1;
			//enyo.log("target for " + inEvent.type + " at " + e.pageX + ", " + e.pageY + " is " + (e.target ? e.target.id : "none"));
			return event;
		},

		/**
		* @ignore
		* @private
		*/
		calcNodeOffset: function (node) {
			if (node.getBoundingClientRect) {
				var o = node.getBoundingClientRect();
				return {
					left: o.left,
					top: o.top,
					width: o.width,
					height: o.height
				};
			}
		},

		/**
		* @ignore
		* @private
		*/
		findTarget: function (e) {
			return document.elementFromPoint(e.clientX, e.clientY);
		},

		/**
		* NOTE: Will find only 1 element under the touch and will fail if an element is 
		* positioned outside the bounding box of its parent.
		* 
		* @ignore
		* @private
		*/
		findTargetTraverse: function (node, x, y) {
			var n = node || document.body;
			var o = this.calcNodeOffset(n);
			if (o && n != this.excludedTarget) {
				var adjX = x - o.left;
				var adjY = y - o.top;
				//enyo.log("test: " + n.id + " (left: " + o.left + ", top: " + o.top + ", width: " + o.width + ", height: " + o.height + ")");
				if (adjX>0 && adjY>0 && adjX<=o.width && adjY<=o.height) {
					//enyo.log("IN: " + n.id + " -> [" + adjX + "," + adjY + " in " + o.width + "x" + o.height + "] (children: " + n.childNodes.length + ")");
					var target;
					for (var n$=n.childNodes, i=n$.length-1, c; (c=n$[i]); i--) {
						target = this.findTargetTraverse(c, x, y);
						if (target) {
							return target;
						}
					}
					return n;
				}
			}
		},

		/**
		* @ignore
		* @private
		*/
		connect: function () {
			utils.forEach(['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'], function(e) {
				// on iOS7 document.ongesturechange is never called
				document.addEventListener(e, dispatch, false);
			});

			if (platform.androidChrome <= 18 || platform.silk === 2) {
				// HACK: on Chrome for Android v18 on devices with higher density displays,
				// document.elementFromPoint expects screen coordinates, not document ones
				// bug also appears on Kindle Fire HD
				this.findTarget = function(e) {
					return document.elementFromPoint(e.screenX, e.screenY);
				};
			} else if (!document.elementFromPoint) {
				this.findTarget = function(e) {
					return this.findTargetTraverse(null, e.clientX, e.clientY);
				};
			}
		}
	};
	
	touchGesture.connect();
});

},{'./utils':'enyo/utils','./gesture':'enyo/gesture','./dispatcher':'enyo/dispatcher','./platform':'enyo/platform','./dom':'enyo/dom','./job':'enyo/job'}],'enyo/image':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Image~Image} kind.
* @module enyo/Image
*/

var
	kind = require('../kind'),
	ri = require('../resolution'),
	dispatcher = require('../dispatcher'),
	path = require('../pathResolver');
var
	Control = require('../Control');

/**
* Fires when the [image]{@link module:enyo/Image~Image} has loaded.
*
* @event module:enyo/Image~Image#onload
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when there has been an error while loading the [image]{@link module:enyo/Image~Image}.
*
* @event module:enyo/Image~Image#onerror
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/Image~Image} implements an HTML [&lt;img&gt;]{@glossary img} element and, optionally,
* [bubbles]{@link module:enyo/Component~Component#bubble} the [onload]{@link module:enyo/Image~Image#onload} and
* [onerror]{@link module:enyo/Image~Image#onerror} [events]{@glossary event}. Image dragging is suppressed by
* default, so as not to interfere with touch interfaces.
*
* When [sizing]{@link module:enyo/Image~Image#sizing} is used, the control will not have a natural size and must be
* manually sized using CSS `height` and `width`. Also, when [placeholder]{@link module:enyo/Image~Image#placeholder} is used
* without `sizing`, you may wish to specify the size, as the image will not have a
* natural size until the image loads, causing the placeholder to not be visible.
*
* {@link module:enyo/Image~Image} also has support for multi-resolution images. If you are developing assets
* for specific screen sizes, HD (720p), FHD (1080p), UHD (4k), for example, you may provide
* specific image assets in a hash/object format to the `src` property, instead of the usual
* string. The image sources will be used automatically when the screen resolution is less than
* or equal to those screen types. For more informaton on our resolution support, and how to
* enable this feature, see the documentation for {@link module:enyo/resolution}.
*
* ```
* // Take advantage of the multi-rez mode
* var
* 	kind = require('enyo/kind'),
* 	Image = require('enyo/Image');
*
* {kind: Image, src: {
*	'hd': 'http://lorempixel.com/64/64/city/1/',
*	'fhd': 'http://lorempixel.com/128/128/city/1/',
*	'uhd': 'http://lorempixel.com/256/256/city/1/'
* }, alt: 'Multi-rez'},
*
* // Standard string `src`
* {kind: Image, src: 'http://lorempixel.com/128/128/city/1/', alt: 'Large'}
* ```
*
* @class Image
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Image~Image.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Image',

	/**
	* @private
	*/
	kind: Control,

	/**
	* When `true`, no [onload]{@link module:enyo/Image~Image#onload} or
	* [onerror]{@link module:enyo/Image~Image#onerror} {@glossary event} handlers will be
	* created.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	noEvents: false,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Image~Image.prototype */ {

		/**
		* Maps to the `src` attribute of an [&lt;img&gt; tag]{@glossary img}. This also supports
		* a multi-resolution hash object. For more details and examples, see the description of
		* {@link module:enyo/Image~Image} above, or the documentation for {@link module:enyo/resolution}.
		*
		* @type {String|module:enyo/resolution#selectSrc~src}
		* @default ''
		* @public
		*/
		src: '',

		/**
		* Maps to the `alt` attribute of an [&lt;img&gt; tag]{@glossary img}.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		alt: '',

		/**
		* By default, the [image]{@link module:enyo/Image~Image} is rendered using an `<img>` tag.
		* When this property is set to `'cover'` or `'constrain'`, the image will be
		* rendered using a `<div>`, utilizing `background-image` and `background-size`.
		*
		* Set this property to `'contain'` to letterbox the image in the available
		* space, or `'cover'` to cover the available space with the image (cropping the
		* larger dimension).  Note that when `sizing` is set, the control must be
		* explicitly sized.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		sizing: '',

		/**
		* When [sizing]{@link module:enyo/Image~Image#sizing} is used, this property sets the positioning of
		* the [image]{@link module:enyo/Image~Image} within the bounds, corresponding to the
		* [`background-position`]{@glossary backgroundPosition} CSS property.
		*
		* @type {String}
		* @default 'center'
		* @public
		*/
		position: 'center',

		/**
		* Provides a default image displayed while the URL specified by `src` is loaded or when that
		* image fails to load.
		*
		* Note that the placeholder feature is not designed for use with images that contain transparent
		* or semi-transparent pixels. Specifically, for performance reasons, the placeholder image is not
		* removed when the image itself loads, but is simply covered by the image. This means that the
		* placeholder will show through any transparent or semi-transparent pixels in the image.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		placeholder: ''
	},

	/**
	* @private
	*/
	tag: 'img',

	/**
	* @private
	*/
	classes: 'enyo-image',

	/**
	* `src` copied here to avoid overwriting the user-provided value when loading values
	*
	* @private
	*/
	_src: null,

	/**
	* @type {Object}
	* @property {Boolean} draggable - This attribute will take one of the following
	*	[String]{@glossary String} values: 'true', 'false' (the default), or 'auto'.
	* Setting Boolean `false` will remove the attribute.
	* @public
	*/
	attributes: {
		draggable: 'false'
	},

	/**
	* @private
	*/
	handlers: {
		onerror: 'handleError'
	},

	/**
	* @private
	*/
	observers: [
		{method: 'updateSource', path: ['_src', 'placeholder']}
	],

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function () {
			if (this.noEvents) {
				delete this.attributes.onload;
				delete this.attributes.onerror;
			}
			sup.apply(this, arguments);
			this.altChanged();
			this.sizingChanged();
			this.srcChanged();
			this.positionChanged();
		};
	}),

	/**
	* Cache the value of user-provided `src` value in `_src`
	*
	* @private
	*/
	srcChanged: function () {
		this.set('_src', this.src);
	},

	/**
	* @private
	*/
	altChanged: function () {
		this.setAttribute('alt', this.alt);
	},

	/**
	* @private
	*/
	sizingChanged: function (was) {
		this.tag = this.sizing ? 'div' : 'img';
		this.addRemoveClass('sized', !!this.sizing);
		if (was) {
			this.removeClass(was);
		}
		if (this.sizing) {
			this.addClass(this.sizing);
		}
		this.updateSource();
		if (this.generated) {
			this.render();
		}
	},

	/**
	* @private
	*/
	positionChanged: function () {
		if (this.sizing) {
			this.applyStyle('background-position', this.position);
		}
	},

	/**
	* @private
	*/
	handleError: function () {
		if (this.placeholder) {
			this.set('_src', null);
		}
	},

	/**
	* Updates the Image's src or background-image based on the values of _src and placeholder
	*
	* @private
	*/
	updateSource: function (was, is, prop) {
		var src = ri.selectSrc(this._src),
			srcUrl = src ? 'url(\'' + path.rewrite(src) + '\')' : null,
			plUrl = this.placeholder ? 'url(\'' + path.rewrite(this.placeholder) + '\')' : null,
			url;

		if (this.sizing) {
			// use either both urls, src, placeholder, or 'none', in that order
			url = srcUrl && plUrl && (srcUrl + ',' + plUrl) || srcUrl || plUrl || 'none';
			this.applyStyle('background-image', url);
		} else {
			// when update source
			if (!prop || prop == 'placeholder') {
				this.applyStyle('background-image', plUrl);
			}
			this.setAttribute('src', src);
		}
	},

	/**
	* @fires module:enyo/Image~Image#onload
	* @fires module:enyo/Image~Image#onerror
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this, 'load', 'error');
		};
	}),

	/**
	* @lends module:enyo/Image~Image
	* @private
	*/
	statics: {
		/**
		* A globally accessible data URL that describes a simple
		* placeholder image that may be used in samples and applications
		* until final graphics are provided. As an SVG image, it will
		* expand to fill the desired width and height set in the style.
		*
		* @type {String}
		* @public
		*/
		placeholder:
			'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
			'9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cmVjdCB3aWR0aD0iMTAw' +
			'JSIgaGVpZ2h0PSIxMDAlIiBzdHlsZT0ic3Ryb2tlOiAjNDQ0OyBzdHJva2Utd2lkdGg6IDE7IGZpbGw6ICNhYW' +
			'E7IiAvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEwMCUiIHkyPSIxMDAlIiBzdHlsZT0ic3Ryb2tlOiAjNDQ0' +
			'OyBzdHJva2Utd2lkdGg6IDE7IiAvPjxsaW5lIHgxPSIxMDAlIiB5MT0iMCIgeDI9IjAiIHkyPSIxMDAlIiBzdH' +
			'lsZT0ic3Ryb2tlOiAjNDQ0OyBzdHJva2Utd2lkdGg6IDE7IiAvPjwvc3ZnPg=='
	},

	// Accessibility

	/**
	* @default img
	* @type {String}
	* @see enyo/AccessibilitySupport~AccessibilitySupport#accessibilityRole
	* @public
	*/
	accessibilityRole: 'img'
});

},{'../kind':'enyo/kind','../resolution':'enyo/resolution','../dispatcher':'enyo/dispatcher','../pathResolver':'enyo/pathResolver','../Control':'enyo/Control'}],'enyo/Input':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Input~Input} kind.
* @module enyo/Input
*/

var
	kind = require('../kind'),
	utils = require('../utils'),
	dispatcher = require('../dispatcher'),
	platform = require('../platform');
var
	Control = require('../Control');

/**
* Fires immediately when the text changes.
*
* @event module:enyo/Input~Input#oninput
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when the text has changed and the [input]{@link module:enyo/Input~Input} subsequently loses
* focus.
*
* @event module:enyo/Input~Input#onchange
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when the [input]{@link module:enyo/Input~Input} is disabled or enabled.
*
* @event module:enyo/Input~Input#onDisabledChange
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/Input~Input} implements an HTML [&lt;input&gt;]{@glossary input} element
* with cross-platform support for change [events]{@glossary event}.
*
* You may listen for [oninput]{@link module:enyo/Input~Input#oninput} and
* [onchange]{@link module:enyo/Input~Input#onchange} [DOM events]{@glossary DOMEvent} from
* this [control]{@link module:enyo/Control~Control} to know when the text inside has been modified.
*
* For more information, see the documentation on
* [Text Fields]{@linkplain $dev-guide/building-apps/controls/text-fields.html}
* in the Enyo Developer Guide.
*
* @class Input
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Input~Input.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Input',

	/**
	* @private
	*/
	kind: Control,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Input~Input.prototype */ {

		/**
		* Value of the [input]{@link module:enyo/Input~Input}. Use this property only to initialize the
		* value. Call `getValue()` and `setValue()` to manipulate the value at runtime.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		value: '',

		/**
		* Text to display when the [input]{@link module:enyo/Input~Input} is empty
		*
		* @type {String}
		* @default ''
		* @public
		*/
		placeholder: '',

		/**
		* Type of [input]{@link module:enyo/Input~Input}; if not specified, it's treated as `'text'`.
		* This may be anything specified for the `type` attribute in the HTML
		* specification, including `'url'`, `'email'`, `'search'`, or `'number'`.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		type: '',

		/**
		* When `true`, prevents input into the [control]{@link module:enyo/Control~Control}. This maps
		* to the `disabled` DOM attribute.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		disabled: false,

		/**
		* When `true`, the contents of the [input]{@link module:enyo/Input~Input} will be selected
		* when the input gains focus.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		selectOnFocus: false
	},

	/**
	* @private
	*/
	events: {
		onDisabledChange: ''
	},

	/**
	* Set to `true` to focus this [control]{@link module:enyo/Control~Control} when it is rendered.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	defaultFocus: false,

	/**
	* @private
	*/
	tag: 'input',

	/**
	* @private
	*/
	classes: 'enyo-input',

	/**
	* @private
	*/
	handlers: {
		onfocus: 'focused',
		oninput: 'input',
		onclear: 'clear',
		ondragstart: 'dragstart'
	},

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			if (platform.ie) {
				this.handlers.onkeyup = 'iekeyup';
			}
			if (platform.windowsPhone) {
				this.handlers.onkeydown = 'iekeydown';
			}
			sup.apply(this, arguments);
			this.placeholderChanged();
			// prevent overriding a custom attribute with null
			if (this.type) {
				this.typeChanged();
			}
		};
	}),

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this, 'focus', 'blur');
			this.disabledChanged();
			if (this.defaultFocus) {
				this.focus();
			}
		};
	}),

	/**
	* @private
	*/
	typeChanged: function () {
		this.setAttribute('type', this.type);
	},

	/**
	* @private
	*/
	placeholderChanged: function () {
		this.setAttribute('placeholder', this.placeholder);
		this.valueChanged();
	},

	/**
	* @fires module:enyo/Input~Input#onDisabledChange
	* @private
	*/
	disabledChanged: function () {
		this.setAttribute('disabled', this.disabled);
		this.bubble('onDisabledChange');
	},

	/**
	* @private
	*/
	valueChanged: function () {
		var node = this.hasNode(),
			attrs = this.attributes;
		if (node) {
			if (node.value !== this.value) {
				node.value = this.value;
			}
			// we manually update the cached value so that the next time the
			// attribute is requested or the control is re-rendered it will
			// have the correct value - this is because calling setAttribute()
			// in some cases does not receive an appropriate response from the
			// browser
			attrs.value = this.value;
		} else {
			this.setAttribute('value', this.value);
		}
		this.detectTextDirectionality((this.value || this.value === 0) ? this.value : this.get('placeholder'));
	},

	/**
	* @private
	*/
	iekeyup: function (sender, e) {
		var ie = platform.ie, kc = e.keyCode;
		// input event fails to fire on backspace and delete keys in ie 9
		if (ie == 9 && (kc == 8 || kc == 46)) {
			this.bubble('oninput', e);
		}
	},

	/**
	* @private
	*/
	iekeydown: function (sender, e) {
		var wp = platform.windowsPhone, kc = e.keyCode, dt = e.dispatchTarget;
		// onchange event fails to fire on enter key for Windows Phone 8, so we force blur
		if (wp <= 8 && kc == 13 && this.tag == 'input' && dt.hasNode()) {
			dt.node.blur();
		}
	},

	/**
	* @private
	*/
	clear: function () {
		this.setValue('');
	},

	// note: we disallow dragging of an input to allow text selection on all platforms
	/**
	* @private
	*/
	dragstart: function () {
		return this.hasFocus();
	},

	/**
	* @private
	*/
	focused: function () {
		if (this.selectOnFocus) {
			utils.asyncMethod(this, 'selectContents');
		}
	},

	/**
	* @private
	*/
	selectContents: function () {
		var n = this.hasNode();

		if (n && n.setSelectionRange) {
			n.setSelectionRange(0, n.value.length);
		} else if (n && n.createTextRange) {
			var r = n.createTextRange();
			r.expand('textedit');
			r.select();
		}
	},

	/**
	* @private
	*/
	input: function () {
		var val = this.getNodeProperty('value');
		this.setValue(val);
	},

	// Accessibility

	/**
	* @default textbox
	* @type {String}
	* @see enyo/AccessibilitySupport~AccessibilitySupport#accessibilityRole
	* @public
	*/
	accessibilityRole: 'textbox',

	/**
	* @private
	*/
	ariaObservers: [
		{path: 'disabled', to: 'aria-disabled'}
	]
});

},{'../kind':'enyo/kind','../utils':'enyo/utils','../dispatcher':'enyo/dispatcher','../platform':'enyo/platform','../Control':'enyo/Control'}],'enyo/Image':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Image~Image} kind.
* @module enyo/Image
*/

var
	kind = require('../kind'),
	ri = require('../resolution'),
	dispatcher = require('../dispatcher'),
	path = require('../pathResolver');
var
	Control = require('../Control');

/**
* Fires when the [image]{@link module:enyo/Image~Image} has loaded.
*
* @event module:enyo/Image~Image#onload
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* Fires when there has been an error while loading the [image]{@link module:enyo/Image~Image}.
*
* @event module:enyo/Image~Image#onerror
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/Image~Image} implements an HTML [&lt;img&gt;]{@glossary img} element and, optionally,
* [bubbles]{@link module:enyo/Component~Component#bubble} the [onload]{@link module:enyo/Image~Image#onload} and
* [onerror]{@link module:enyo/Image~Image#onerror} [events]{@glossary event}. Image dragging is suppressed by
* default, so as not to interfere with touch interfaces.
*
* When [sizing]{@link module:enyo/Image~Image#sizing} is used, the control will not have a natural size and must be
* manually sized using CSS `height` and `width`. Also, when [placeholder]{@link module:enyo/Image~Image#placeholder} is used
* without `sizing`, you may wish to specify the size, as the image will not have a
* natural size until the image loads, causing the placeholder to not be visible.
*
* {@link module:enyo/Image~Image} also has support for multi-resolution images. If you are developing assets
* for specific screen sizes, HD (720p), FHD (1080p), UHD (4k), for example, you may provide
* specific image assets in a hash/object format to the `src` property, instead of the usual
* string. The image sources will be used automatically when the screen resolution is less than
* or equal to those screen types. For more informaton on our resolution support, and how to
* enable this feature, see the documentation for {@link module:enyo/resolution}.
*
* ```
* // Take advantage of the multi-rez mode
* var
* 	kind = require('enyo/kind'),
* 	Image = require('enyo/Image');
*
* {kind: Image, src: {
*	'hd': 'http://lorempixel.com/64/64/city/1/',
*	'fhd': 'http://lorempixel.com/128/128/city/1/',
*	'uhd': 'http://lorempixel.com/256/256/city/1/'
* }, alt: 'Multi-rez'},
*
* // Standard string `src`
* {kind: Image, src: 'http://lorempixel.com/128/128/city/1/', alt: 'Large'}
* ```
*
* @class Image
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Image~Image.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Image',

	/**
	* @private
	*/
	kind: Control,

	/**
	* When `true`, no [onload]{@link module:enyo/Image~Image#onload} or
	* [onerror]{@link module:enyo/Image~Image#onerror} {@glossary event} handlers will be
	* created.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	noEvents: false,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Image~Image.prototype */ {

		/**
		* Maps to the `src` attribute of an [&lt;img&gt; tag]{@glossary img}. This also supports
		* a multi-resolution hash object. For more details and examples, see the description of
		* {@link module:enyo/Image~Image} above, or the documentation for {@link module:enyo/resolution}.
		*
		* @type {String|module:enyo/resolution#selectSrc~src}
		* @default ''
		* @public
		*/
		src: '',

		/**
		* Maps to the `alt` attribute of an [&lt;img&gt; tag]{@glossary img}.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		alt: '',

		/**
		* By default, the [image]{@link module:enyo/Image~Image} is rendered using an `<img>` tag.
		* When this property is set to `'cover'` or `'constrain'`, the image will be
		* rendered using a `<div>`, utilizing `background-image` and `background-size`.
		*
		* Set this property to `'contain'` to letterbox the image in the available
		* space, or `'cover'` to cover the available space with the image (cropping the
		* larger dimension).  Note that when `sizing` is set, the control must be
		* explicitly sized.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		sizing: '',

		/**
		* When [sizing]{@link module:enyo/Image~Image#sizing} is used, this property sets the positioning of
		* the [image]{@link module:enyo/Image~Image} within the bounds, corresponding to the
		* [`background-position`]{@glossary backgroundPosition} CSS property.
		*
		* @type {String}
		* @default 'center'
		* @public
		*/
		position: 'center',

		/**
		* Provides a default image displayed while the URL specified by `src` is loaded or when that
		* image fails to load.
		*
		* Note that the placeholder feature is not designed for use with images that contain transparent
		* or semi-transparent pixels. Specifically, for performance reasons, the placeholder image is not
		* removed when the image itself loads, but is simply covered by the image. This means that the
		* placeholder will show through any transparent or semi-transparent pixels in the image.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		placeholder: ''
	},

	/**
	* @private
	*/
	tag: 'img',

	/**
	* @private
	*/
	classes: 'enyo-image',

	/**
	* `src` copied here to avoid overwriting the user-provided value when loading values
	*
	* @private
	*/
	_src: null,

	/**
	* @type {Object}
	* @property {Boolean} draggable - This attribute will take one of the following
	*	[String]{@glossary String} values: 'true', 'false' (the default), or 'auto'.
	* Setting Boolean `false` will remove the attribute.
	* @public
	*/
	attributes: {
		draggable: 'false'
	},

	/**
	* @private
	*/
	handlers: {
		onerror: 'handleError'
	},

	/**
	* @private
	*/
	observers: [
		{method: 'updateSource', path: ['_src', 'placeholder']}
	],

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function () {
			if (this.noEvents) {
				delete this.attributes.onload;
				delete this.attributes.onerror;
			}
			sup.apply(this, arguments);
			this.altChanged();
			this.sizingChanged();
			this.srcChanged();
			this.positionChanged();
		};
	}),

	/**
	* Cache the value of user-provided `src` value in `_src`
	*
	* @private
	*/
	srcChanged: function () {
		this.set('_src', this.src);
	},

	/**
	* @private
	*/
	altChanged: function () {
		this.setAttribute('alt', this.alt);
	},

	/**
	* @private
	*/
	sizingChanged: function (was) {
		this.tag = this.sizing ? 'div' : 'img';
		this.addRemoveClass('sized', !!this.sizing);
		if (was) {
			this.removeClass(was);
		}
		if (this.sizing) {
			this.addClass(this.sizing);
		}
		this.updateSource();
		if (this.generated) {
			this.render();
		}
	},

	/**
	* @private
	*/
	positionChanged: function () {
		if (this.sizing) {
			this.applyStyle('background-position', this.position);
		}
	},

	/**
	* @private
	*/
	handleError: function () {
		if (this.placeholder) {
			this.set('_src', null);
		}
	},

	/**
	* Updates the Image's src or background-image based on the values of _src and placeholder
	*
	* @private
	*/
	updateSource: function (was, is, prop) {
		var src = ri.selectSrc(this._src),
			srcUrl = src ? 'url(\'' + path.rewrite(src) + '\')' : null,
			plUrl = this.placeholder ? 'url(\'' + path.rewrite(this.placeholder) + '\')' : null,
			url;

		if (this.sizing) {
			// use either both urls, src, placeholder, or 'none', in that order
			url = srcUrl && plUrl && (srcUrl + ',' + plUrl) || srcUrl || plUrl || 'none';
			this.applyStyle('background-image', url);
		} else {
			// when update source
			if (!prop || prop == 'placeholder') {
				this.applyStyle('background-image', plUrl);
			}
			this.setAttribute('src', src);
		}
	},

	/**
	* @fires module:enyo/Image~Image#onload
	* @fires module:enyo/Image~Image#onerror
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this, 'load', 'error');
		};
	}),

	/**
	* @lends module:enyo/Image~Image
	* @private
	*/
	statics: {
		/**
		* A globally accessible data URL that describes a simple
		* placeholder image that may be used in samples and applications
		* until final graphics are provided. As an SVG image, it will
		* expand to fill the desired width and height set in the style.
		*
		* @type {String}
		* @public
		*/
		placeholder:
			'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
			'9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cmVjdCB3aWR0aD0iMTAw' +
			'JSIgaGVpZ2h0PSIxMDAlIiBzdHlsZT0ic3Ryb2tlOiAjNDQ0OyBzdHJva2Utd2lkdGg6IDE7IGZpbGw6ICNhYW' +
			'E7IiAvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEwMCUiIHkyPSIxMDAlIiBzdHlsZT0ic3Ryb2tlOiAjNDQ0' +
			'OyBzdHJva2Utd2lkdGg6IDE7IiAvPjxsaW5lIHgxPSIxMDAlIiB5MT0iMCIgeDI9IjAiIHkyPSIxMDAlIiBzdH' +
			'lsZT0ic3Ryb2tlOiAjNDQ0OyBzdHJva2Utd2lkdGg6IDE7IiAvPjwvc3ZnPg=='
	},

	// Accessibility

	/**
	* @default img
	* @type {String}
	* @see enyo/AccessibilitySupport~AccessibilitySupport#accessibilityRole
	* @public
	*/
	accessibilityRole: 'img'
});

},{'../kind':'enyo/kind','../resolution':'enyo/resolution','../dispatcher':'enyo/dispatcher','../pathResolver':'enyo/pathResolver','../Control':'enyo/Control'}],'enyo/ScrollStrategy':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ScrollStrategy~ScrollStrategy} kind.
* @module enyo/ScrollStrategy
*/

var
	kind = require('./kind'),
	dispatcher = require('./dispatcher');

var
	Control = require('./Control');

/**
* {@link module:enyo/ScrollStrategy~ScrollStrategy} is a helper [kind]{@glossary kind} that implements a default 
* scrolling strategy for an {@link module:enyo/Scroller~Scroller}.
* 
* `enyo/ScrollStrategy` is not typically created in application code. Instead, it is specified 
* as the value of the [strategyKind]{@link module:enyo/Scroller~Scroller#strategyKind} property of an
* `enyo/Scroller` or {@link module:layout/List~List}, or is used by the framework implicitly.
*
* @class ScrollStrategy
* @protected
*/
module.exports = kind(
	/** @lends module:enyo/ScrollStrategy~ScrollStrategy.prototype */ {

	name: 'enyo.ScrollStrategy',

	kind: Control,

	/**
	* @private
	*/
	tag: null,

	/**
	* @private
	*/
	published: 
		/** @lends module:enyo/ScrollStrategy~ScrollStrategy.prototype */ {
		
		/**
		* Specifies how to vertically scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		* 
		* @type {String}
		* @default 'default'
		* @public
		*/
		vertical: 'default',
		
		/**
		* Specifies how to horizontally scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		* 
		* @type {String}
		* @default 'default'
		* @public
		*/
		horizontal: 'default',
		
		/**
		* The horizontal scroll position.
		* 
		* @type {Number}
		* @default 0
		* @public
		*/
		scrollLeft: 0,
		
		/**
		* The vertical scroll position.
		* 
		* @type {Number}
		* @default 0
		* @public
		*/
		scrollTop: 0,
		
		/**
		* Maximum height of the scroll content.
		* 
		* @type {Number}
		* @default null
		* @public
		*/
		maxHeight: null,
		
		/**
		* Indicates whether mouse wheel may be used to move the [scroller]{@link module:enyo/Scroller~Scroller}.
		* 
		* @type {Boolean}
		* @default true
		* @public
		*/
		useMouseWheel: true
	},
	
	/**
	* @private
	*/
	events: {
		onScrollStart: '',
		onScrollStop: ''
	},

	/**
	* @private
	*/
	handlers: {
		ondragstart: 'dragstart',
		ondragfinish: 'dragfinish',
		ondown: 'down',
		onmove: 'move',
		onmousewheel: 'mousewheel',
		onscroll: 'domScroll'
	},

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.horizontalChanged();
			this.verticalChanged();
			this.maxHeightChanged();
		};
	}),

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this.container, 'scroll');
			this.scrollNode = this.calcScrollNode();
		};
	}),

	/**
	* @method
	* @private
	*/
	teardownRender: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.scrollNode = null;
		};
	}),

	/**
	* @private
	*/
	calcScrollNode: function () {
		return this.container.hasNode();
	},

	/**
	* @private
	*/
	horizontalChanged: function () {
		this.container.applyStyle('overflow-x', this.horizontal == 'default' ? 'auto' : this.horizontal);
	},

	/**
	* @private
	*/
	verticalChanged: function () {
		this.container.applyStyle('overflow-y', this.vertical == 'default' ? 'auto' : this.vertical);
	},

	/**
	* @private
	*/
	maxHeightChanged: function () {
		this.container.applyStyle('max-height', this.maxHeight);
	},

	/** 
	* Scrolls to the specified position.
	*
	* @param {Number} x - The `x` position in pixels.
	* @param {Number} y - The `y` position in pixels.
	* @public
	*/
	scrollTo: function (x, y) {
		if (this.scrollNode) {
			this.setScrollLeft(x);
			this.setScrollTop(y);
		}
	},

	/** 
	* Ensures that the given node is visible in the [scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	*
	* @param {Node} node - The node to make visible in the [scroller's]{@link module:enyo/Scroller~Scroller}
	*	viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top of the
	*	scroller.
	* @public
	*/
	scrollToNode: function (node, alignWithTop) {
		if (this.scrollNode) {
			var sb = this.getScrollBounds();
			var n = node;
			var b = {height: n.offsetHeight, width: n.offsetWidth, top: 0, left: 0};
			while (n && n.parentNode && n.id != this.scrollNode.id) {
				b.top += n.offsetTop;
				b.left += n.offsetLeft;
				n = n.parentNode;
			}
			// By default, the element is scrolled to align with the top of the scroll area.
			this.setScrollTop(Math.min(sb.maxTop, alignWithTop === false ? b.top - sb.clientHeight + b.height : b.top));
			this.setScrollLeft(Math.min(sb.maxLeft, alignWithTop === false ? b.left - sb.clientWidth + b.width : b.left));
		}
	},

	/**
	* Scrolls the given [control]{@link module:enyo/Control~Control} into view.
	*
	* @param {module:enyo/Control~Control} ctl - The [control]{@link module:enyo/Control~Control} to make visible in the
	*	[scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top of the
	*	scroller.
	* @public
	*/
	scrollIntoView: function (ctl, alignWithTop) {
		if (ctl.hasNode()) {
			ctl.node.scrollIntoView(alignWithTop);
		}
	},
	isInView: function(inNode) {
		var sb = this.getScrollBounds();
		var ot = inNode.offsetTop;
		var oh = inNode.offsetHeight;
		var ol = inNode.offsetLeft;
		var ow = inNode.offsetWidth;
		return (ot >= sb.top && ot + oh <= sb.top + sb.clientHeight) && (ol >= sb.left && ol + ow <= sb.left + sb.clientWidth);
	},

	/**
	* Sets the vertical scroll position.
	*
	* @param {Number} top - The vertical scroll position in pixels.
	* @public
	*/
	setScrollTop: function (top) {
		this.scrollTop = top;
		if (this.scrollNode) {
			this.scrollNode.scrollTop = this.scrollTop;
		}
	},

	/**
	* Sets the horizontal scroll position.
	*
	* @param {Number} left - The horizontal scroll position in pixels.
	* @public
	*/
	setScrollLeft: function (left) {
		this.scrollLeft = left;
		if (this.scrollNode) {
			this.scrollNode.scrollLeft = this.scrollLeft;
		}
	},

	/**
	* Retrieves the horizontal scroll position.
	*
	* @returns {Number} The horizontal scroll position in pixels.
	* @public
	*/
	getScrollLeft: function () {
		return this.scrollNode ? this.scrollNode.scrollLeft : this.scrollLeft;
	},

	/**
	* Retrieves the vertical scroll position.
	*
	* @returns {Number} The vertical scroll position in pixels.
	* @private
	*/
	getScrollTop: function () {
		return this.scrollNode ? this.scrollNode.scrollTop : this.scrollTop;
	},

	/**
	* @private
	*/
	_getScrollBounds: function () {
		var s = this.getScrollSize(), cn = this.container.hasNode();
		var b = {
			left: this.getScrollLeft(),
			top: this.getScrollTop(),
			clientHeight: cn ? cn.clientHeight : 0,
			clientWidth: cn ? cn.clientWidth : 0,
			height: s.height,
			width: s.width
		};
		b.maxLeft = Math.max(0, b.width - b.clientWidth);
		b.maxTop = Math.max(0, b.height - b.clientHeight);
		return b;
	},

	/**
	* @private
	*/
	getScrollSize: function () {
		var n = this.scrollNode;
		return {width: n ? n.scrollWidth : 0, height: n ? n.scrollHeight : 0};
	},

	/**
	* Retrieves the scroll boundaries of the [scroller]{@link module:enyo/Scroller~Scroller}.
	* 
	* @returns {module:enyo/Scroller~Scroller~BoundaryObject} An [object]{@glossary Object} describing the
	*	scroll boundaries.
	* @public
	*/
	getScrollBounds: function () {
		return this._getScrollBounds();
	},

	/**
	* @private
	*/
	calcStartInfo: function () {
		var sb = this.getScrollBounds();
		var y = this.getScrollTop(), x = this.getScrollLeft();
		this.canVertical = sb.maxTop > 0 && this.vertical != 'hidden';
		this.canHorizontal = sb.maxLeft > 0 && this.horizontal != 'hidden';
		this.startEdges = {
			top: y === 0,
			bottom: y === sb.maxTop,
			left: x === 0,
			right: x === sb.maxLeft
		};
	},

	// NOTE: down, move, and drag handlers are needed only for native touch scrollers

	/**
	* @private
	*/
	shouldDrag: function (e) {
		var requestV = e.vertical;
		return (requestV && this.canVertical  || !requestV && this.canHorizontal) /*&& !this.isOobVerticalScroll(event)*/;
	},

	/**
	* @private
	*/
	dragstart: function (sender, e) {
		this.dragging = this.shouldDrag(e);
		if (this.dragging) {
			return this.preventDragPropagation;
		}
	},

	/**
	* @private
	*/
	dragfinish: function (sender, e) {
		if (this.dragging) {
			this.dragging = false;
			e.preventTap();
		}
	},

	/**
	* Avoid allowing scroll when starting at a vertical boundary to prevent iOS from window 
	* scrolling.
	* 
	* @private
	*/
	down: function (sender, e) {
		if (this.isScrolling()) {
			e.preventTap();
		}
		this.calcStartInfo();
	},

	/**
	* NOTE: Mobile native [scrollers]{@link module:enyo/Scroller~Scroller} need `touchmove`. Indicate this by 
	* setting the `requireTouchmove` property to `true`.
	* 
	* @private
	*/
	move: function (sender, e) {
		if (e.which && (this.canVertical && e.vertical || this.canHorizontal && e.horizontal)) {
			e.disablePrevention();
		}
	},

	/**
	* @private
	*/
	mousewheel: function (sender, e) {
		//* We disable mouse wheel scrolling by preventing the default
		if (!this.useMouseWheel) {
			e.preventDefault();
		}
	},

	/**
	* @private
	*/
	domScroll: function(sender, e) {
		if (!this._scrolling) {
			this.doScrollStart();
		}
		this._scrolling = true;
		this.startJob('stopScrolling', function() {
			this._scrolling = false;
			this.doScrollStop();
		}, 100);
	},

	/**
	* @public
	*/
	isScrolling: function() {
		return this._scrolling;
	}
});

},{'./kind':'enyo/kind','./dispatcher':'enyo/dispatcher','./Control':'enyo/Control'}],'enyo/ScrollThumb':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ScrollThumb~ScrollThumb} kind.
* @module enyo/ScrollThumb
*/

var
	kind = require('../kind');

var
	Control = require('../Control'),
	Dom = require('../dom');

/**
* {@link module:enyo/ScrollThumb~ScrollThumb} is a helper [kind]{@glossary kind} used by 
* {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy} and {@link module:enyo/TranslateScrollStrategy~TranslateScrollStrategy} to
* display a small visual scroll indicator.
* 
* `enyo/ScrollThumb` is not typically created in application code.
*
* @class ScrollThumb
* @protected
*/
module.exports = kind(
	/** @lends module:enyo/ScrollThumb~ScrollThumb.prototype */ {
	
	name: 'enyo.ScrollThumb',
	
	kind: Control,

	/**
	* The orientation of the scroll indicator bar; 'v' for vertical or 'h' for horizontal.
	* 
	* @type {String}
	* @default 'v'
	* @public
	*/
	axis: 'v',

	/**
	* Minimum size of the indicator.
	* 
	* @private
	*/
	minSize: 4,

	/**
	* Size of the indicator's corners.
	* 
	* @private
	*/
	cornerSize: 6,

	/**
	* @private
	*/
	classes: 'enyo-thumb',

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			var v = this.axis == 'v';
			this.dimension = v ? 'height' : 'width';
			this.offset = v ? 'top' : 'left';
			this.translation = v ? 'translateY' : 'translateX';
			this.positionMethod = v ? 'getScrollTop' : 'getScrollLeft';
			this.sizeDimension = v ? 'clientHeight' : 'clientWidth';
			this.addClass('enyo-' + this.axis + 'thumb');
			this.transform = Dom.canTransform();
			if (Dom.canAccelerate()) {
				Dom.transformValue(this, 'translateZ', 0);
			}
		};
	}),

	/** 
	* Syncs the scroll indicator bar to the [scroller]{@link module:enyo/Scroller~Scroller} size and position,
	* as determined by the passed-in scroll strategy.
	*
	* @param {module:enyo/ScrollStrategy~ScrollStrategy} strategy - The scroll strategy to be synced with.
	* @public
	*/
	sync: function (strategy) {
		this.scrollBounds = strategy._getScrollBounds();
		this.update(strategy);
	},

	/**
	* Updates the scroll indicator bar based on the scroll bounds of the strategy, the available
	* scroll area, and whether there is overscrolling. If the scroll indicator bar is not
	* needed, it will be not be displayed.
	* 
	* @param {module:enyo/ScrollStrategy~ScrollStrategy} strategy - The scroll strategy to update from.
	* @public
	*/
	update: function (strategy) {
		if (this.showing) {
			var d = this.dimension, o = this.offset;
			var bd = this.scrollBounds[this.sizeDimension], sbd = this.scrollBounds[d];
			var overs = 0, overp = 0, over = 0;
			if (bd >= sbd) {
				this.hide();
				return;
			}
			if (strategy.isOverscrolling()) {
				over = strategy.getOverScrollBounds()['over' + o];
				overs = Math.abs(over);
				overp = Math.max(over, 0);
			}
			var sbo = strategy[this.positionMethod]() - over;
			// calc size & position
			var bdc = bd - this.cornerSize;
			var s = Math.floor((bd * bd / sbd) - overs);
			s = Math.max(this.minSize, s);
			var p = Math.floor((bdc * sbo / sbd) + overp);
			p = Math.max(0, Math.min(bdc - this.minSize, p));
			// apply thumb styling
			this.needed = s < bd;
			if (this.needed && this.hasNode()) {
				if (this._pos !== p) {
					this._pos = p;
					if(!this.transform) {
						//adjust top/left for browsers that don't support translations
						if(this.axis=='v') {
							this.setBounds({top:p + 'px'});
						} else {
							this.setBounds({left:p + 'px'});
						}
					} else {
						Dom.transformValue(this, this.translation, p + 'px');
					}
				}
				if (this._size !== s) {
					this._size = s;
					this.applyStyle(d, s + 'px');
				}
			} else {
				this.hide();
			}
		}
	},

	/**
	* We implement `setShowing()` and cancel the [delayHide()]{@link module:enyo/ScrollThumb~ScrollThumb#delayHide} 
	* because [showing]{@link module:enyo/Control~Control#showing} is not changed while we execute
	* `delayHide()`.
	*
	* @param {Boolean} showing - If `true`, displays the {@link module:enyo/ScrollThumb~ScrollThumb} if appropriate;
	*	otherwise, hides the ScrollThumb.
	* @public
	*/
	setShowing: function (showing) {
		if (showing && showing != this.showing) {
			if (this.scrollBounds[this.sizeDimension] >= this.scrollBounds[this.dimension]) {
				return;
			}
		}
		if (this.hasNode()) {
			this.cancelDelayHide();
		}
		if (showing != this.showing) {
			var last = this.showing;
			this.showing = showing;
			this.showingChanged(last);
		}
	},

	/**
	* Delays automatic hiding of the {@link module:enyo/ScrollThumb~ScrollThumb}.
	*
	* @param {Number} delay - The number of milliseconds to delay hiding of the
	*	{@link module:enyo/ScrollThumb~ScrollThumb}.
	* @public
	*/
	delayHide: function (delay) {
		if (this.showing) {
			this.startJob('hide', this.hide, delay || 0);
		}
	},

	/**
	* Cancels any pending [delayHide()]{@link module:enyo/ScrollThumb~ScrollThumb#delayHide} jobs.
	* 
	* @public
	*/
	cancelDelayHide: function () {
		this.stopJob('hide');
	}
});

},{'../kind':'enyo/kind','../Control':'enyo/Control','../dom':'enyo/dom'}],'enyo/GroupItem':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/GroupItem~GroupItem} kind.
* @module enyo/GroupItem
*/

var
	kind = require('./kind');
var
	Control = require('./Control');

/**
* Fires when the [active state]{@link module:enyo/GroupItem~GroupItem#active} has changed.
*
* @event module:enyo/GroupItem~GroupItem#onActivate
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing event information.
* @public
*/

/**
* {@link module:enyo/GroupItem~GroupItem} is the base [kind]{@glossary kind} for the
* [Grouping]{@link module:enyo/Group~Group} API. It manages the
* [active state]{@link module:enyo/GroupItem~GroupItem#active} of the [component]{@link module:enyo/Component~Component}
* (or the [inheriting]{@glossary subkind} component). A subkind may call `setActive()` 
* to set the [active]{@link module:enyo/GroupItem~GroupItem#active} property to the desired state; this
* will additionally [bubble]{@link module:enyo/Component~Component#bubble} an 
* [onActivate]{@link module:enyo/GroupItem~GroupItem#onActivate} {@glossary event}, which may
* be handled as needed by the containing components. This is useful for creating
* groups of items whose state should be managed collectively.
*
* For an example of how this works, see the {@link module:enyo/Group~Group} kind, which enables the
* creation of radio groups from arbitrary components that	support the Grouping API.
*
* @class GroupItem
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Groupitem~Groupitem.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.GroupItem',

	/**
	* @private
	*/
	kind: Control,

	/**
	* @private
	*/
	published: 
		/** @lends module:enyo/Groupitem~Groupitem.prototype */ {

		/**
		* Will be `true` if the item is currently selected.
		* 
		* @type {Boolean}
		* @default false
		* @public
		*/
		active: false
	},
	
	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.activeChanged();
		};
	}),

	/**
	* @fires module:enyo/GroupItem~GroupItem#onActivate
	* @private
	*/
	activeChanged: function () {
		this.bubble('onActivate');
	}
});

},{'./kind':'enyo/kind','./Control':'enyo/Control'}],'enyo/TouchScrollStrategy':[function (module,exports,global,require,request){
require('enyo');
require('./touch');

/**
* Contains the declaration for the {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy} kind.
* @module enyo/TouchScrollStrategy
*/

var
	kind = require('./kind'),
	utils = require('./utils'),
	dispatcher = require('./dispatcher'),
	platform = require('./platform');

var
	ScrollMath = require('./ScrollMath'),
	ScrollStrategy = require('./ScrollStrategy'),
	ScrollThumb = require('./ScrollThumb'),
	Dom = require('./dom');

/**
* Fires when dragging has started, allowing drags to propagate to parent
* [scrollers]{@link module:enyo/Scroller~Scroller}.
*
* @event module:enyo/TouchScrollStrategy~TouchScrollStrategy#onShouldDrag
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Scroller~ScrollEvent} event - An [object]{@glossary Object} containing
*	event information.
* @private
*/

/**
* {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy} is a helper [kind]{@glossary kind} for implementing a
* touch-based [scroller]{@link module:enyo/Scroller~Scroller}. It integrates the scrolling simulation provided
* by {@link module:enyo/ScrollMath~ScrollMath} into an `enyo/Scroller`.
*
* `enyo/TouchScrollStrategy` is not typically created in application code. Instead, it is
* specified as the value of the [strategyKind]{@link module:enyo/Scroller~Scroller#strategyKind} property
* of an `enyo/Scroller` or {@link module:layout/List~List}, or is used by the framework implicitly.
*
* @class TouchScrollStrategy
* @extends module:enyo/ScrollStrategy~ScrollStrategy
* @protected
*/
module.exports = kind(
	/** @lends module:enyo/TouchScrollStrategy~TouchScrollStrategy.prototype */ {

	name: 'enyo.TouchScrollStrategy',

	/**
	* @private
	*/
	kind: ScrollStrategy,

	/**
		If `true` (the default), the scroller will overscroll and bounce back at the edges.
	*/
	overscroll: true,

	/**
		If `true` (the default), the scroller will not propagate `dragstart`
		events that cause it to start scrolling.
	*/
	preventDragPropagation: true,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/TouchScrollStrategy~TouchScrollStrategy.prototype */ {

		/**
		* Specifies how to vertically scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		*
		* @type {String}
		* @default 'default'
		* @public
		*/
		vertical: 'default',

		/**
		* Specifies how to horizontally scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		*
		* @type {String}
		* @default 'default'
		* @public
		*/
		horizontal: 'default',

		/**
		* Set to `true` to display a scroll thumb.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		thumb: true,

		/**
		* Set to `true` to display a transparent overlay while scrolling. This can help improve
		* performance of complex, large scroll regions on some platforms (e.g., Android).
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		scrim: false,

		/**
		* Indicates whether to allow drag [events]{@glossary event} to be sent while gesture
		* events are happening simultaneously.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		dragDuringGesture: true,

		/**
		* Facades animation time step from [ScrollMath]{@link module:enyo/ScrollMath~ScrollMath}.
		*
		* @type {Number}
		* @default 20
		* @public
		*/
		interval: 20,

		/**
		* Facades animation interval type from [ScrollMath]{@link module:enyo/ScrollMath~ScrollMath}.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		fixedTime: true,

		/**
		* Facades one unit of time for simulation from [ScrollMath]{@link module:enyo/ScrollMath~ScrollMath}.
		*
		* @type {Number}
		* @default 10
		* @public
		*/
		frame: 10,

		/**
		* Indicates whether default [events]{@glossary event} (e.g., native scrolling
		* events) should be suppressed.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		preventDefault: true
	},

	/**
	* @private
	*/
	events: {
		onShouldDrag: ''
	},

	/**
	* @private
	*/
	handlers: {
		onflick: 'flick',
		onShouldDrag: 'shouldDrag',
		ondrag: 'drag'
	},

	/**
	* @private
	*/
	tools: [
		{kind: ScrollMath, onScrollStart: 'scrollMathStart', onScroll: 'scrollMathScroll', onScrollStop: 'scrollMathStop', onStabilize: 'scrollMathStabilize'},
		{name: 'vthumb', kind: ScrollThumb, axis: 'v', showing: false},
		{name: 'hthumb', kind: ScrollThumb, axis: 'h', showing: false}
	],

	/**
	* @private
	*/
	scrimTools: [{name: 'scrim', classes: 'enyo-fit', style: 'z-index: 1;', showing: false}],

	/**
	* @private
	*/
	components: [
		{name: 'client', classes: 'enyo-touch-scroller enyo-touch-scroller-client'}
	],

	/**
	* Flag indicating whether the list is currently reordering.
	*
	* @readonly
	* @public
	*/
	listReordering: false,

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.transform = Dom.canTransform();
			if(!this.transform) {
				if(this.overscroll) {
					//so we can adjust top/left if browser can't handle translations
					this.$.client.applyStyle('position', 'relative');
				}
			}
			this.accel = Dom.canAccelerate();
			var containerClasses = 'enyo-touch-strategy-container';
			// note: needed for ios to avoid incorrect clipping of thumb
			// and need to avoid on Android as it causes problems hiding the thumb
			if (platform.ios && this.accel) {
				containerClasses += ' enyo-composite';
			}
			this.scrimChanged();
			this.intervalChanged();
			this.fixedTimeChanged();
			this.frameChanged();
			this.container.addClass(containerClasses);
			this.translation = this.accel ? 'translate3d' : 'translate';
		};
	}),

	/**
	* @method
	* @private
	*/
	initComponents: kind.inherit(function (sup) {
		return function() {
			this.createChrome(this.tools);
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function() {
			this.container.removeClass('enyo-touch-strategy-container');
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this.$.client, 'scroll');
			this.calcBoundaries();
			this.syncScrollMath();
			if (this.thumb) {
				this.alertThumbs();
			}
		};
	}),

	/**
	* @private
	*/
	scrimChanged: function () {
		if (this.scrim && !this.$.scrim) {
			this.makeScrim();
		}
		if (!this.scrim && this.$.scrim) {
			this.$.scrim.destroy();
		}
	},

	/**
	* @private
	*/
	makeScrim: function () {
		// reset control parent so scrim doesn't go into client.
		var cp = this.controlParent;
		this.controlParent = null;
		this.createChrome(this.scrimTools);
		this.controlParent = cp;
		var cn = this.container.hasNode();
		// render scrim in container, strategy has no dom.
		if (cn) {
			this.$.scrim.parentNode = cn;
			this.$.scrim.render();
		}
	},

	/**
	* Determines whether or not the scroller is actively moving.
	*
	* @return {Boolean} `true` if actively moving; otherwise, `false`.
	* @public
	*/
	isScrolling: function () {
		var m = this.$.scrollMath;
		return m ? m.isScrolling() : this.scrolling;
	},

	/**
	* Determines whether or not the scroller is in overscroll.
	*
	* @return {Boolean} `true` if in overscroll; otherwise, `false`.
	* @public
	*/
	isOverscrolling: function () {
		var m = this.$.scrollMath || this;
		return (this.overscroll) ? Boolean(m.isInOverScroll()) : false;
	},

	/**
	* @private
	*/
	domScroll: function () {
		if (!this.isScrolling()) {
			this.calcBoundaries();
			this.syncScrollMath();
			if (this.thumb) {
				this.alertThumbs();
			}
		}
	},

	/**
	* @private
	*/
	horizontalChanged: function () {
		this.$.scrollMath.horizontal = (this.horizontal != 'hidden');
	},

	/**
	* @private
	*/
	verticalChanged: function () {
		this.$.scrollMath.vertical = (this.vertical != 'hidden');
	},

	/**
	* @private
	*/
	maxHeightChanged: function () {
		this.$.client.applyStyle('max-height', this.maxHeight);
		// note: previously used enyo-fit here but IE would reset scroll position when the scroll thumb
		// was hidden; in general IE resets scrollTop when there are 2 abs position siblings, one has
		// scrollTop and the other is hidden.
		this.$.client.addRemoveClass('enyo-scrollee-fit', !this.maxHeight);
	},

	/**
	* @private
	*/
	thumbChanged: function () {
		this.hideThumbs();
	},

	/**
	* @private
	*/
	intervalChanged: function () {
		if (this.$.scrollMath) {
			this.$.scrollMath.interval = this.interval;
		}
	},

	/**
	* @private
	*/
	fixedTimeChanged: function () {
		if (this.$.scrollMath) {
			this.$.scrollMath.fixedTime = this.fixedTime;
		}
	},

	/**
	* @private
	*/
	frameChanged: function () {
		if (this.$.scrollMath) {
			this.$.scrollMath.frame = this.frame;
		}
	},

	/**
	* Stops any active scroll movement.
	*
	* @todo Doc update made while merging, need official documentation update!
	*
	* @param {Boolean} emit - Whether or not to fire the `onScrollStop` event.
	* @public
	*/
	stop: function (emit) {
		if (this.isScrolling()) {
			this.$.scrollMath.stop(emit);
		}
	},

	/**
	* Adjusts the scroll position to be valid, if necessary (e.g., after the scroll contents
	* have changed).
	*
	* @public
	*/
	stabilize: function () {
		if(this.$.scrollMath) {
			this.$.scrollMath.stabilize();
		}
	},

	/**
	* Scrolls to a specific position within the scroll area.
	*
	* @param {Number} x - The `x` position in pixels.
	* @param {Number} y - The `y` position in pixels.
	* @public
	*/
	scrollTo: function (x, y) {
		this.stop(true);
		this.$.scrollMath.scrollTo(x, y || y === 0 ? y : null);
	},

	/**
	* Scrolls the given [control]{@link module:enyo/Control~Control} into view.
	*
	* @param {module:enyo/Control~Control} ctl - The [control]{@link module:enyo/Control~Control} to make visible in the
	*	[scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top of the
	*	scroller.
	* @method
	* @public
	*/
	scrollIntoView: kind.inherit(function (sup) {
		return function() {
			this.stop(true);
			sup.apply(this, arguments);
		};
	}),

	/**
	* Sets the horizontal scroll position.
	*
	* @param {Number} left - The horizontal scroll position in pixels.
	* @method
	* @public
	*/
	setScrollLeft: kind.inherit(function (sup) {
		return function() {
			this.stop(true);
			sup.apply(this, arguments);
		};
	}),

	/**
	* Sets the vertical scroll position.
	*
	* @param {Number} top - The vertical scroll position in pixels.
	* @method
	* @public
	*/
	setScrollTop: kind.inherit(function (sup) {
		return function(top) {
			this.stop(true);
			sup.apply(this, arguments);
		};
	}),

	/**
	* Retrieves the horizontal scroll position.
	*
	* @returns {Number} The horizontal scroll position in pixels.
	* @method
	* @public
	*/
	getScrollLeft: kind.inherit(function (sup) {
		return function() {
			return this.isScrolling() ? this.scrollLeft : sup.apply(this, arguments);
		};
	}),

	/**
	* Retrieves the vertical scroll position.
	*
	* @returns {Number} The vertical scroll position in pixels.
	* @method
	* @private
	*/
	getScrollTop: kind.inherit(function (sup) {
		return function() {
			return this.isScrolling() ? this.scrollTop : sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	calcScrollNode: function () {
		return this.$.client.hasNode();
	},

	/**
	* @private
	*/
	calcAutoScrolling: function () {
		var v = (this.vertical == 'auto');
		var h = (this.horizontal == 'auto') || (this.horizontal == 'default');
		if ((v || h) && this.scrollNode) {
			var b = this.getScrollBounds();
			if (v) {
				this.$.scrollMath.vertical = b.height > b.clientHeight;
			}
			if (h) {
				this.$.scrollMath.horizontal = b.width > b.clientWidth;
			}
		}
	},

	/**
	* @private
	*/
	shouldDrag: function (sender, e) {
		this.calcAutoScrolling();
		var requestV = e.vertical;
		var canH = this.$.scrollMath.horizontal && !requestV;
		var canV = this.$.scrollMath.vertical && requestV;
		var down = e.dy < 0, right = e.dx < 0;
		var oobV = (!down && this.startEdges.top || down && this.startEdges.bottom);
		var oobH = (!right && this.startEdges.left || right && this.startEdges.right);
		// we would scroll if not at a boundary
		if (!e.boundaryDragger && (canH || canV)) {
			e.boundaryDragger = this;
		}
		// include boundary exclusion
		if ((!oobV && canV) || (!oobH && canH)) {
			e.dragger = this;
			return true;
		}
	},

	/**
	* @private
	*/
	flick: function (sender, e) {
		var onAxis = Math.abs(e.xVelocity) > Math.abs(e.yVelocity) ? this.$.scrollMath.horizontal : this.$.scrollMath.vertical;
		if (onAxis && this.dragging) {
			this.$.scrollMath.flick(e);
			return this.preventDragPropagation;
		}
	},

	/**
	* @private
	*/
	down: kind.inherit(function (sup) {
		return function (sender, e) {
			if (!this.isOverscrolling()) {
				sup.apply(this, arguments);
			}
		};
	}),

	/**
	* @private
	*/
	move: function (sender, e) {
	},

	// Special synthetic DOM events served up by the Gesture system

	/**
	* @fires module:enyo/TouchScrollStrategy~TouchScrollStrategy#onShouldDrag
	* @private
	*/
	dragstart: function (sender, e) {
		// Ignore drags sent from multi-touch events
		if(!this.dragDuringGesture && e.srcEvent.touches && e.srcEvent.touches.length > 1) {
			return true;
		}
		// note: allow drags to propagate to parent scrollers via data returned in the shouldDrag event.
		this.doShouldDrag(e);
		this.dragging = (e.dragger == this || (!e.dragger && e.boundaryDragger == this));
		if (this.dragging) {
			if(this.preventDefault){
				e.preventDefault();
			}
			// note: needed because show/hide changes
			// the position so sync'ing is required when
			// dragging begins (needed because show/hide does not trigger onscroll)
			this.syncScrollMath();
			this.$.scrollMath.startDrag(e);
			if (this.preventDragPropagation) {
				return true;
			}
		}
	},

	/**
	* @private
	*/
	drag: function (sender, e) {
		// if the list is doing a reorder, don't scroll
		if(this.listReordering) {
			return false;
		}
		if (this.dragging) {
			if(this.preventDefault){
				e.preventDefault();
			}
			this.$.scrollMath.drag(e);
			if (this.scrim) {
				this.$.scrim.show();
			}
		}
	},
	dragfinish: function (sender, e) {
		if (this.dragging) {
			e.preventTap();
			this.$.scrollMath.dragFinish();
			this.dragging = false;
			if (this.scrim) {
				this.$.scrim.hide();
			}
		}
	},

	/**
	* @private
	*/
	mousewheel: function (sender, e) {
		if (!this.dragging && this.useMouseWheel) {
			this.calcBoundaries();
			this.syncScrollMath();
			this.stabilize();
			if (this.$.scrollMath.mousewheel(e)) {
				e.preventDefault();
				return true;
			}
		}
	},

	/**
	* @private
	*/
	scrollMathStart: function () {
		if (this.scrollNode && !this.isScrolling()) {
			this.scrolling = true;
			if (!this.isOverscrolling()) {
				this.calcBoundaries();
			}
		}
	},

	/**
	* @private
	*/
	scrollMathScroll: function (sender) {
		if(!this.overscroll) {
			//don't overscroll past edges
			this.effectScroll(-Math.min(sender.leftBoundary, Math.max(sender.rightBoundary, sender.x)),
					-Math.min(sender.topBoundary, Math.max(sender.bottomBoundary, sender.y)));
		} else {
			this.effectScroll(-sender.x, -sender.y);
		}
		if (this.thumb) {
			this.showThumbs();
			this.delayHideThumbs(100);
		}
	},

	/**
	* @private
	*/
	scrollMathStop: function () {
		this.scrolling = false;
		this.effectScrollStop();
		if (this.thumb) {
			this.delayHideThumbs(100);
		}
	},

	/**
	* @private
	*/
	scrollMathStabilize: function (sender) {
		this.effectScroll(-sender.x, -sender.y);
		if (this.thumb) {
			this.showThumbs();
			this.delayHideThumbs(100);
		}
		return true;
	},

	/**
	* @private
	*/
	calcBoundaries: function () {
		var s = this.$.scrollMath || this, b = this._getScrollBounds();
		s.bottomBoundary = b.clientHeight - b.height;
		s.rightBoundary = b.clientWidth - b.width;
	},

	/**
	* @private
	*/
	syncScrollMath: function () {
		var m = this.$.scrollMath;
		if(m) {
			m.setScrollX(-this.getScrollLeft());
			m.setScrollY(-this.getScrollTop());
		}
	},

	/**
	* @private
	*/
	effectScroll: function (x, y) {
		if (this.scrollNode) {
			this.scrollLeft = this.scrollNode.scrollLeft = x;
			this.scrollTop = this.scrollNode.scrollTop = y;
			this.effectOverscroll(x !== null? Math.round(x): x, y !== null? Math.round(y): y);
		}
	},

	/**
	* @private
	*/
	effectScrollStop: function () {
		this.effectOverscroll(null, null);
	},

	/**
	* @private
	*/
	effectOverscroll: function (x, y) {
		var n = this.scrollNode;
		var xt = '0', yt = '0', zt = this.accel ? ',0' : '';
		if (y !== null && Math.abs(y - n.scrollTop) > 1) {
			yt = (n.scrollTop - y);
		}
		if (x !== null && Math.abs(x - n.scrollLeft) > 1) {
			xt = (n.scrollLeft - x);
		}
		if(!this.transform) {
			//adjust top/left if browser can't handle translations
			this.$.client.setBounds({left:xt + 'px', top:yt + 'px'});
		} else {
			Dom.transformValue(this.$.client, this.translation, xt + 'px, ' + yt + 'px' + zt);
		}
	},

	/**
	* Retrieves the overscroll boundaries of the [scroller]{@link module:enyo/Scroller~Scroller}.
	*
	* @returns {module:enyo/Scroller~OverscrollBoundaryObject} An [object]{@glossary Object}
	*	describing the overscroll boundaries.
	* @public
	*/
	getOverScrollBounds: function () {
		var m = this.$.scrollMath || this;
		return {
			overleft: Math.min(m.leftBoundary - m.x, 0) || Math.max(m.rightBoundary - m.x, 0),
			overtop: Math.min(m.topBoundary - m.y, 0) || Math.max(m.bottomBoundary - m.y, 0)
		};
	},

	/**
	* @method
	* @private
	*/
	_getScrollBounds: kind.inherit(function (sup) {
		return function() {
			var r = sup.apply(this, arguments);
			utils.mixin(r, this.getOverScrollBounds());
			return r;
		};
	}),

	/**
	* Retrieves the scroll boundaries of the [scroller]{@link module:enyo/Scroller~Scroller}.
	*
	* @returns {module:enyo/Scroller~BoundaryObject} An [object]{@glossary Object} describing the
	*	scroll boundaries.
	* @method
	* @public
	*/
	getScrollBounds: kind.inherit(function (sup) {
		return function() {
			this.stop(true);
			return sup.apply(this, arguments);
		};
	}),

	/**
	* This method exists primarily to support an internal use case for
	* [enyo/DataList]{@link module:enyo/DataList~DataList}. It is intended to be called by the
	* [scroller]{@link module:enyo/Scroller~Scroller} that owns this strategy.
	*
	* Triggers a remeasurement of the scroller's metrics (specifically, the
	* size of its viewport, the size of its contents and the difference between
	* the two, which determines the extent to which the scroller may scroll).
	*
	* @public
	*/
	remeasure: function () {
		this.calcBoundaries();
		if (this.thumb) {
			this.syncThumbs();
		}
		this.stabilize();
	},

	/**
	* Displays the scroll indicators and sets the auto-hide timeout.
	*
	* @public
	*/
	alertThumbs: function () {
		this.showThumbs();
		this.delayHideThumbs(500);
	},

	/**
	* Syncs the vertical and horizontal scroll indicators.
	*
	* @public
	*/
	syncThumbs: function () {
		this.$.vthumb.sync(this);
		this.$.hthumb.sync(this);
	},
	updateThumbs: function () {
		this.$.vthumb.update(this);
		this.$.hthumb.update(this);
	},

	/**
	* Syncs and shows both the vertical and horizontal scroll indicators. We only sync after we
	* have checked if the vertical and/or horizontal scroll indicators are to be shown, so that
	* {@link module:enyo/ScrollThumb~ScrollThumb#update} accurately makes calculations when the indicators are
	* visible.
	*
	* @public
	*/
	showThumbs: function () {
		if (this.horizontal != 'hidden') {
			this.$.hthumb.show();
		}
		if (this.vertical != 'hidden') {
			this.$.vthumb.show();
		}
		this.syncThumbs();
	},

	/**
	* Hides the vertical and horizontal scroll indicators.
	*
	* @public
	*/
	hideThumbs: function () {
		this.$.vthumb.hide();
		this.$.hthumb.hide();
	},

	/**
	* Hides the vertical and horizontal scroll indicators asynchronously.
	*
	* @public
	*/
	delayHideThumbs: function (delay) {
		this.$.vthumb.delayHide(delay);
		this.$.hthumb.delayHide(delay);
	}
});

},{'./touch':'enyo/touch','./kind':'enyo/kind','./utils':'enyo/utils','./dispatcher':'enyo/dispatcher','./platform':'enyo/platform','./ScrollMath':'enyo/ScrollMath','./ScrollStrategy':'enyo/ScrollStrategy','./ScrollThumb':'enyo/ScrollThumb','./dom':'enyo/dom'}],'enyo/ToolDecorator':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/ToolDecorator~ToolDecorator} kind.
* @module enyo/ToolDecorator
*/



var
	kind = require('../kind');
var
	GroupItem = require('../GroupItem');

/**
* {@link module:enyo/ToolDecorator~ToolDecorator} lines up [components]{@link module:enyo/Component~Component} in a row,
* centered vertically.
*
* @class ToolDecorator
* @extends module:enyo/GroupItem~GroupItem
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/ToolDecorator~ToolDecorator.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.ToolDecorator',

	/**
	* @private
	*/
	kind: GroupItem,

	/**
	* @private
	*/
	classes: 'enyo-tool-decorator'
});

},{'../kind':'enyo/kind','../GroupItem':'enyo/GroupItem'}],'enyo/TranslateScrollStrategy':[function (module,exports,global,require,request){
require('enyo');

/**
 * Contains the declaration for the {@link module:enyo/TranslateScrollStrategy~TranslateScrollStrategy} kind.
 * @module enyo/TranslateScrollStrategy
 */

var
	kind = require('./kind'),
	dispatcher = require('./dispatcher');

var
	TouchScrollStrategy = require('./TouchScrollStrategy'),
	Dom = require('./dom');

/**
* {@link module:enyo/TranslateScrollStrategy~TranslateScrollStrategy} is a helper [kind]{@glossary kind} that extends
* {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy}, optimizing it for scrolling environments in which effecting
* scroll changes with transforms using CSS translations is fastest.
* 
* `TranslateScrollStrategy` is not typically created in application code. Instead, it is
* specified as the value of the [strategyKind]{@link module:enyo/Scroller~Scroller#strategyKind} property of
* an {@link module:enyo/Scroller~Scroller} or {@link module:layout/List~List}, or is used by the framework implicitly.
*
* @class TranslateScrollStrategy
* @extends module:enyo/TouchScrollStrategy~TouchScrollStrategy
* @protected
*/
module.exports = kind(
	/** @lends module:enyo/TranslateScrollStrategy~TranslateScrollStrategy.prototype */ {

	name: 'enyo.TranslateScrollStrategy',

	/**
	* @private
	*/
	kind: TouchScrollStrategy,

	/** 
	* Set to `true` to optimize the strategy to only use translation to scroll; this increases
	* fluidity of scrolling animation. It should not be used when the
	* [scroller]{@link module:enyo/Scroller~Scroller} contains [controls]{@link module:enyo/Control~Control} that require
	* keyboard input. This is because when `translateOptimized` is `true`, it is possible to
	* position inputs such that they will not become visible when focused.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	translateOptimized: false,

	/**
	* @private
	*/
	components: [
		{name: 'clientContainer', classes: 'enyo-touch-scroller', components: [
			{name: 'client', classes: 'enyo-touch-scroller-client'}
		]}
	],

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this.$.clientContainer, 'scroll');
			if (this.translateOptimized) {
				// on render, the start positions should be 0 for translateOptimized because the
				// scrollNode's scrollTop/Left will always be 0 and therefore offsetting the
				// translate to account for a non-zero scrollTop/Left isn't necessary.
				this.setStartPosition(true);
			}
		};
	}),

	/**
	* Sets the start position for scrolling.
	*
	* @param {Boolean} [reset] When true, resets the start position to 0 rather than the current
	* 	scrollTop and scrollLeft.
	* @private
	*/
	setStartPosition: function (reset) {
		if (reset) {
			this.startX = this.startY = 0;
		} else {
			this.startX = this.getScrollLeft();
			this.startY = this.getScrollTop();
		}
	},

	/**
	* @private
	*/
	getScrollSize: function () {
		var n = this.$.client.hasNode();
		return {width: n ? n.scrollWidth : 0, height: n ? n.scrollHeight : 0};
	},

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			// apply initial transform so we're always composited
			Dom.transformValue(this.$.client, this.translation, '0,0,0');
		};
	}),

	/**
	* @private
	*/
	calcScrollNode: function () {
		return this.$.clientContainer.hasNode();
	},

	/**
	* @private
	*/
	maxHeightChanged: function () {
		// content should cover scroller at a minimum if there's no max-height.
		this.$.client.applyStyle('min-height', this.maxHeight ? null : '100%');
		this.$.client.applyStyle('max-height', this.maxHeight);
		this.$.clientContainer.addRemoveClass('enyo-scrollee-fit', !this.maxHeight);
	},

	/**
	* @method
	* @private
	*/
	shouldDrag: kind.inherit(function (sup) {
		return function(inEvent) {
			// stop and update drag info before checking drag status
			this.stop();
			this.calcStartInfo();
			return sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	syncScrollMath: kind.inherit(function (sup) {
		return function() {
			if (!this._translated) {
				sup.apply(this, arguments);
			}
		};
	}),

	/**
	* Sets the horizontal scroll position.
	*
	* @param {Number} left - The horizontal scroll position in pixels.
	* @method
	* @public
	*/
	setScrollLeft: kind.inherit(function (sup) {
		return function(inLeft) {
			var m, p;
			if (this.translateOptimized) {
				p = this.scrollLeft;
				m = this.$.scrollMath;
				this.stop(true);
				m.setScrollX(-inLeft);
				m.stabilize();
				if (p != -m.x) {
					// We won't get a native scroll event,
					// so need to make one ourselves
					m.doScroll();
					this.delayHideThumbs(100);
				}
			} else {
				sup.apply(this, arguments);
			}
		};
	}),

	/**
	* Sets the vertical scroll position.
	*
	* @param {Number} top - The vertical scroll position in pixels.
	* @method
	* @public
	*/
	setScrollTop: kind.inherit(function (sup) {
		return function(inTop) {
			var m, p;
			if (this.translateOptimized) {
				p = this.scrollTop;
				m = this.$.scrollMath;
				this.stop(true);
				m.setScrollY(-inTop);
				m.stabilize();
				if (p != -m.y) {
					// We won't get a native scroll event,
					// so need to make one ourselves
					m.doScroll();
					this.delayHideThumbs(100);
				}
			} else {
				sup.apply(this, arguments);
			}
		};
	}),

	/**
	* Retrieves the horizontal scroll position.
	*
	* @returns {Number} The horizontal scroll position in pixels.
	* @method
	* @public
	*/
	getScrollLeft: kind.inherit(function (sup) {
		return function() {
			return this._translated ? this.scrollLeft: sup.apply(this, arguments);
		};
	}),

	/**
	* Retrieves the vertical scroll position.
	*
	* @returns {Number} The vertical scroll position in pixels.
	* @method
	* @private
	*/
	getScrollTop: kind.inherit(function (sup) {
		return function() {
			return this._translated ? this.scrollTop : sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	calcBoundaries: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			if (this.translateOptimized && !this.isScrolling()) this.stabilize();
		};
	}),

	/**
	* @method
	* @private
	*/
	handleResize: function() {
		if (this.translateOptimized) {
			this.stabilize();
		}
	},

	/**
	* @method
	* @private
	*/
	scrollMathStart: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			if (!this._translated) {
				this.setStartPosition();
			}
		};
	}),

	/**
	* @private
	*/
	scrollMathScroll: function (sender) {
		if(!this.overscroll) { //don't overscroll past edges
			this.scrollLeft = -Math.min(sender.leftBoundary, Math.max(sender.rightBoundary, sender.x));
			this.scrollTop = -Math.min(sender.topBoundary, Math.max(sender.bottomBoundary, sender.y));
		} else {
			this.scrollLeft = -sender.x;
			this.scrollTop = -sender.y;
		}
		this.effectScroll(this.scrollLeft, this.scrollTop);
		if (this.thumb) {
			this.showThumbs();
		}
	},

	/**
	* @private
	*/
	scrollMathStabilize: kind.inherit(function (sup) {
		return function (sender) {
			if (this._translated) {
				this.scrollLeft = -sender.x;
				this.scrollTop = -sender.y;
				this.effectScroll(-sender.x, -sender.y);
				return true;
			} else {
				return sup.apply(this, arguments);
			}
		};
	}),

	/**
	* While moving, scroller uses translate.
	*
	* @private
	*/
	effectScroll: kind.inherit(function (sup) {
		return function (x, y) {
			var o;
			if (this.translateOptimized || this.isScrolling()) {
				x = this.startX - x;
				y = this.startY - y;
				o = x + 'px, ' + y + 'px' + (this.accel ? ',0' : '');
				Dom.transformValue(this.$.client, this.translation, o);
				this._translated = true;
			} else {
				sup.apply(this, arguments);
			}
		};
	}),

	/**
	* When stopped, we use `scrollLeft/scrollTop` (makes cursor positioning automagic).
	*
	* @private
	*/
	effectScrollStop: function () {
		if (!this.translateOptimized) {
			var t = '0,0' + (this.accel ? ',0' : '');
			// FIXME: normally translate3d changes not effect scrollHeight; however
			// there appear to be some dom changes (e.g. showing a node inside the scroller,
			// which do cause the scrollHeight to be changed from the translate3d.
			// In this case setting the translate3d back to 0 does not restore scrollHeight.
			// This causes a problem because setting scrollTop can produced an unexpected result if
			// scrollHeight is less than expected.
			// We detect this fault by validating scroll bounds and (1) un-apply the translate3d,
			// (2) update scrollTop/Left, and (3) re-apply a 0,0,0 translate3d to ensure compositing.
			// Luckily this corrects the problem (which appears to be a webkit bug). Note that
			// it's important to maintain a composited state (translate3d 0,0,0) or Android 4 is
			// slow to start scrolling.
			var m = this.$.scrollMath, sb = this._getScrollBounds();
			var needsBoundsFix = Boolean((sb.maxTop + m.bottomBoundary) || (sb.maxLeft + m.rightBoundary));
			Dom.transformValue(this.$.client, this.translation, needsBoundsFix ? null : t);
			// note: this asynchronously triggers dom scroll event
			this.setScrollLeft(this.scrollLeft);
			this.setScrollTop(this.scrollTop);
			if (needsBoundsFix) {
				Dom.transformValue(this.$.client, this.translation, t);
			}
			this._translated = false;
		}
	},

	/**
	* FIXME: we can fix scrolling artifacts BUGS on Android 4.04 with this heinous incantation.
	*
	* @private
	*/
	twiddle: function () {
		if (this.translateOptimized && this.scrollNode) { // this.scrollNode is not always defined and makes Motorola XOOM crash
			this.scrollNode.scrollTop = 1;
			this.scrollNode.scrollTop = 0;
		}
	}
});

},{'./kind':'enyo/kind','./dispatcher':'enyo/dispatcher','./TouchScrollStrategy':'enyo/TouchScrollStrategy','./dom':'enyo/dom'}],'enyo/Button':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Button~Button} kind.
* @module enyo/Button
*/

var
	kind = require('../kind');
var
	ToolDecorator = require('../ToolDecorator');

/**
* {@link module:enyo/Button~Button} implements an HTML [button]{@glossary button}, with support
* for grouping using {@link module:enyo/Group~Group}.
*
* For more information, see the documentation on
* [Buttons]{@linkplain $dev-guide/building-apps/controls/buttons.html} in the
* Enyo Developer Guide.
*
* @class Button
* @extends module:enyo/ToolDecorator~ToolDecorator
* @ui
* @public
*/
module.exports = kind(
	/** @lends module:enyo/Button~Button.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Button',
	
	/**
	* @private
	*/
	kind: ToolDecorator,

	/**
	* @private
	*/
	tag: 'button',

	/**
	* @private
	*/
	attributes: {
		/**
		 * Set to `'button'`; otherwise, the default value would be `'submit'`, which
		 * can cause unexpected problems when [controls]{@link module:enyo/Control~Control} are used
		 * inside of a [form]{@glossary form}.
		 * 
		 * @type {String}
		 * @private
		 */
		type: 'button'
	},
	
	/**
	* @private
	*/
	published: 
		/** @lends module:enyo/Button~Button.prototype */ {
		
		/**
		 * When `true`, the [button]{@glossary button} is shown as disabled and does not 
		 * generate tap [events]{@glossary event}.
		 * 
		 * @type {Boolean}
		 * @default false
		 * @public
		 */
		disabled: false
	},
	
	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.disabledChanged();
		};
	}),

	/**
	* @private
	*/
	disabledChanged: function () {
		this.setAttribute('disabled', this.disabled);
	},

	/**
	* @private
	*/
	tap: function () {
		if (this.disabled) {
			// work around for platforms like Chrome on Android or Opera that send
			// mouseup to disabled form controls
			return true;
		} else {
			this.setActive(true);
		}
	},

	// Accessibility

	/**
	* @default button
	* @type {String}
	* @see enyo/AccessibilitySupport~AccessibilitySupport#accessibilityRole
	* @public
	*/
	accessibilityRole: 'button',

	/**
	* When `true`, `aria-pressed` will reflect the state of
	* {@link module:enyo/GroupItem~GroupItem#active}
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	accessibilityPressed: false,

	/**
	* @private
	*/
	ariaObservers: [
		{from: 'disabled', to: 'aria-disabled'},
		{path: ['active', 'accessibilityPressed'], method: function () {
			this.setAriaAttribute('aria-pressed', this.accessibilityPressed ? String(this.active) : null);
		}},
		{from: 'accessibilityRole', to: 'role'}
	]
});

},{'../kind':'enyo/kind','../ToolDecorator':'enyo/ToolDecorator'}],'enyo/Scroller':[function (module,exports,global,require,request){
require('enyo');

/**
* Contains the declaration for the {@link module:enyo/Scroller~Scroller} kind.
* @module enyo/Scroller
*/



var
	kind = require('../kind'),
	platform = require('../platform');

var
	Control = require('../Control'),
	ScrollStrategy = require('../ScrollStrategy'),
	TouchScrollStrategy = require('../TouchScrollStrategy'),
	TranslateScrollStrategy = require('../TranslateScrollStrategy');

/**
* An [object]{@glossary Object} representing the scroll boundaries.
*
* @typedef {Object} module:enyo/Scroller~Scroller~BoundaryObject
* @property {Number} left - The left scroll position.
* @property {Number} top - The top scroll position.
* @property {Number} maxLeft - Maximum value for the left scroll position (minimum is always 0).
* @property {Number} maxTop - Maximum value for the top scroll position (minimum is always 0).
* @property {Number} clientHeight - The vertical size of the [scroller]{@link module:enyo/Scroller~Scroller} on
*	screen.
* @property {Number} clientWidth - The horizontal size of the [scroller]{@link module:enyo/Scroller~Scroller} on
*	screen.
* @property {Number} width - The horizontal size of the full area of the scrolled region.
* @property {Number} height - The vertical size of the full area of the scrolled region.
* @property {Number} xDir - Either `1`, `-1`, or `0`, indicating positive movement along the
*	x-axis, negative movement, or no movement, respectively.
* @property {Number} yDir - Either `1`, `-1`, or `0`, indicating positive movement along the
*	y-axis, negative movement, or no movement, respectively.
*/


/**
* An [object]{@glossary Object} representing the overscroll boundaries.
*
* @typedef {Object} module:enyo/Scroller~Scroller~OverscrollBoundaryObject
* @property {Number} overleft - The left overscroll position.
* @property {Number} overtop - The top overscroll position.
*/

/**
* The extended {@glossary event} [object]{@glossary Object} that is provided
* when a scroll event is fired.
*
* @typedef {Object} module:enyo/Scroller~Scroller~ScrollEvent
* @property {module:enyo/Scroller~Scroller~BoundaryObject} bounds - Current values of scroller bounds.
*/

/**
* Fires when a scrolling action starts.
*
* @event module:enyo/Scroller~Scroller#onScrollStart
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {module:enyo/Scroller~Scroller~ScrollEvent} event - An [object]{@glossary Object} containing
*	event information.
* @public
*/

/**
* Fires while a scrolling action is in progress.
*
* @event module:enyo/Scroller~Scroller#onScroll
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing
*	event information.
* @public
*/

/**
* Fires when a scrolling action stops.
*
* @event module:enyo/Scroller~Scroller#onScrollStop
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the {@glossary event}.
* @property {Object} event - An [object]{@glossary Object} containing
*	event information.
* @public
*/

/**
* {@link module:enyo/Scroller~Scroller} is a scroller suitable for use in both desktop and mobile
* applications.
*
* In some mobile environments, a default scrolling solution is not implemented for
* DOM elements. In such cases, `enyo/Scroller` implements a touch-based scrolling
* solution, which may be opted into either globally (by setting
* [touchScrolling]{@link module:enyo/Scroller~Scroller#touchScrolling} to `true`) or on a
* per-instance basis (by specifying a [strategyKind]{@link module:enyo/Scroller~Scroller#strategyKind}
* of `'TouchScrollStrategy'`).
*
* For more information, see the documentation on
* [Scrollers]{@linkplain $dev-guide/building-apps/layout/scrollers.html} in the
* Enyo Developer Guide.
*
* @class Scroller
* @public
*/
var Scroller = module.exports = kind(
	/** @lends module:enyo/Scroller~Scroller.prototype */ {

	name: 'enyo.Scroller',

	kind: Control,

	/**
	* @private
	*/
	published:
		/** @lends module:enyo/Scroller~Scroller.prototype */ {

		/**
		* Specifies how to horizontally scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		*
		* @type {String}
		* @default 'default'
		* @public
		*/
		horizontal: 'default',

		/**
		* Specifies how to vertically scroll.  Acceptable values are `'scroll'`, `'auto'`,
		* `'hidden'`, and `'default'`. The precise effect of the setting is determined by the
		* scroll strategy.
		*
		* @type {String}
		* @default 'default'
		* @public
		*/
		vertical: 'default',

		/**
		* The vertical scroll position.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		scrollTop: 0,

		/**
		* The horizontal scroll position.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		scrollLeft: 0,

		/**
		* Maximum height of the scroll content.
		*
		* @type {Number}
		* @default null
		* @memberof enyo/Scroller~Scroller.prototype
		* @public
		*/
		maxHeight: null,

		/**
		* Set to `true` to make this [scroller]{@link module:enyo/Scroller~Scroller} select a
		* platform-appropriate touch-based scrolling strategy. Note that if you specify a value
		* for [strategyKind]{@link module:enyo/Scroller~Scroller#strategyKind}, that will take precedence over
		* this setting.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		touch: false,
		/**
		* Specifies a type of scrolling. The [scroller]{@link module:enyo/Scroller~Scroller} will attempt to
		* automatically select a strategy compatible with the runtime environment. Alternatively,
		* you may choose to use a specific strategy:
		*
		* - [ScrollStrategy]{@link module:enyo/ScrollStrategy~ScrollStrategy} is the default and implements no
		*	scrolling, relying instead on the environment to scroll properly.
		* - [TouchScrollStrategy]{@link module:enyo/TouchScrollStrategy~TouchScrollStrategy} implements a touch scrolling
		*	mechanism.
		* - [TranslateScrollStrategy]{@link module:enyo/TranslateScrollStrategy~TranslateScrollStrategy} implements a touch
		*	scrolling mechanism using translations; it is currently recommended only for Android
		*	3+, iOS 5+ and Windows Phone 8.
		* - [TransitionScrollStrategy]{@link module:enyo/TransitionScrollStrategy~TransitionScrollStrategy} implements a touch
		*	scrolling mechanism using CSS transitions;
		*
		* @type {Object}
		* @default module:enyo/ScrollStrategy~ScrollStrategy
		* @public
		*/
		strategyKind: ScrollStrategy,

		/**
		* Set to `true` to display a scroll thumb in touch [scrollers]{@link module:enyo/Scroller~Scroller}.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		thumb: true,

		/**
		* If `true`, mouse wheel may be used to move the [scroller]{@link module:enyo/Scroller~Scroller}.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		useMouseWheel: true
	},

	/**
	* @private
	*/
	events: {
		onScrollStart: '',
		onScroll: '',
		onScrollStop: ''
	},

	/**
	* If `true`, enables touch scrolling globally.
	*
	* @name touchScrolling
	* @type {Boolean}
	* @default undefined
	* @memberof enyo/Scroller~Scroller.prototype
	* @public
	*/

	/**
	* If `true` and this is a touch [scroller]{@link module:enyo/Scroller~Scroller}, the scroller
	* will overscroll and bounce back at the edges.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	touchOverscroll: true,

	/**
	* If `true`, the [scroller]{@link module:enyo/Scroller~Scroller} will not propagate `dragstart`
	* [events]{@glossary event} that cause it to start scrolling.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	preventDragPropagation: true,

	/**
	* If `true`, the [scroller]{@link module:enyo/Scroller~Scroller} will not propagate scroll
	* [events]{@glossary event}.
	*
	* @type {Boolean}
	* @default true
	* @public
	*/
	preventScrollPropagation: true,

	/**
	* Needed to allow global mods to `enyo/Scroller.touchScrolling`.
	*
	* @private
	*/


	/**
	* @private
	*/
	handlers: {
		onscroll: 'domScroll',
		onScrollStart: 'scrollStart',
		onScroll: 'scroll',
		onScrollStop: 'scrollStop'
	},

	/**
	* @private
	*/
	classes: 'enyo-scroller',

	/**
	* @lends module:enyo/Scroller~Scroller
	* @private
	*/
	statics: {
		/**
		* @private
		*/
		osInfo: [
			{os: 'android', version: 3},
			{os: 'androidChrome', version: 18},
			{os: 'androidFirefox', version: 16},
			{os: 'firefoxOS', version: 16},
			{os: 'ios', version: 5},
			{os: 'webos', version: 1e9},
			{os: 'blackberry', version:1e9},
			{os: 'tizen', version: 2}
		],
		/** Returns true if platform should have touch events. */
		hasTouchScrolling: function() {
			for (var i=0, t; (t=this.osInfo[i]); i++) {
				if (platform[t.os]) {
					return true;
				}
			}
			// special detection for IE10+ on touch devices
			if ((platform.ie >= 10 || platform.windowsPhone >= 8) && platform.touch) {
				return true;
			}
		},
		/**
		* Returns true if the platform has native div scrollers (desktop
		* browsers always have them).
		*/
		hasNativeScrolling: function() {
			for (var i=0, t; (t=this.osInfo[i]); i++) {
				if (platform[t.os] < t.version) {
					return false;
				}
			}
			return true;
		},
		/**
		* @private
		*/
		getTouchStrategy: function() {
			return (platform.androidChrome >= 27) || (platform.android >= 3) || (platform.ios >= 5) || (platform.windowsPhone === 8) || (platform.webos >= 4)
				? TranslateScrollStrategy
				: TouchScrollStrategy;
		}
	},

	/**
	* @private
	*/
	controlParentName: 'strategy',

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.horizontalChanged();
			this.verticalChanged();
			this.useMouseWheelChanged();
		};
	}),

	/**
	* @method
	* @private
	*/
	importProps: kind.inherit(function (sup) {
		return function(inProps) {
			sup.apply(this, arguments);
			// allow global overriding of strategy kind
			if (inProps && inProps.strategyKind === undefined && (Scroller.touchScrolling || this.touch)) {
				this.strategyKind = Scroller.getTouchStrategy();
			}
		};
	}),

	/**
	* @method
	* @private
	*/
	initComponents: kind.inherit(function (sup) {
		return function() {
			this.strategyKindChanged();
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.syncStrategy();
		};
	}),

	/**
	* @method
	* @private
	*/
	syncStrategy: function() {
		this.$.strategy.setScrollLeft(this.scrollLeft);
		this.$.strategy.setScrollTop(this.scrollTop);
	},

	/**
	* @private
	*/
	strategyKindChanged: function () {
		if (this.$.strategy) {
			this.$.strategy.destroy();
			this.controlParent = null;
		}
		// note: createComponents automatically updates controlParent.
		this.createStrategy();
		if (this.hasNode()) {
			this.render();
		}
	},

	/**
	* @private
	*/
	createStrategy: function () {
		this.createComponents([{name: 'strategy', maxHeight: this.maxHeight,
			kind: this.strategyKind, thumb: this.thumb,
			preventDragPropagation: this.preventDragPropagation,
			overscroll:this.touchOverscroll, isChrome: true}]);
	},

	/**
	* @private
	*/
	getStrategy: function () {
		return this.$.strategy;
	},

	/**
	* @private
	*/
	maxHeightChanged: function () {
		this.$.strategy.setMaxHeight(this.maxHeight);
	},

	/**
	* @method
	* @private
	*/
	showingChanged: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			if (this.showing) {
				this.syncStrategy();
			}
		};
	}),

	/**
	* @private
	*/
	showingChangedHandler: kind.inherit(function(sup) {
		return function(sender, event) {
			if (this.showing && event.showing) {
				this.syncStrategy();
			}
		};
	}),

	/**
	* @private
	*/
	thumbChanged: function () {
		this.$.strategy.setThumb(this.thumb);
	},

	/**
	* @private
	*/
	horizontalChanged: function () {
		this.$.strategy.setHorizontal(this.horizontal);
	},

	/**
	* @private
	*/
	verticalChanged: function () {
		this.$.strategy.setVertical(this.vertical);
	},

	// FIXME: these properties are virtual; property changed methods are fired only if
	// property value changes, not if getter changes.

	/**
	* Sets the horizontal scroll position.
	*
	* @param {Number} left - The horizontal scroll position in pixels.
	* @public
	*/
	setScrollLeft: function (left) {
		this.$.strategy.setScrollLeft(left);
	},

	/**
	* Sets the vertical scroll position.
	*
	* @param {Number} top - The vertical scroll position in pixels.
	* @public
	*/
	setScrollTop: function (top) {
		this.$.strategy.setScrollTop(top);
	},

	/**
	* Retrieves the horizontal scroll position.
	*
	* @returns {Number} The horizontal scroll position in pixels.
	* @public
	*/
	getScrollLeft: function () {
		// sync our internal property
		this.scrollLeft = this.$.strategy.getScrollLeft();
		return this.scrollLeft;
	},

	/**
	* Retrieves the vertical scroll position.
	*
	* @returns {Number} The vertical scroll position in pixels.
	* @public
	*/
	getScrollTop: function () {
		// sync our internal property
		this.scrollTop = this.$.strategy.getScrollTop();
		return this.scrollTop;
	},

	/**
	* Retrieves the scroll boundaries of the [scroller]{@link module:enyo/Scroller~Scroller}.
	*
	* @returns {module:enyo/Scroller~BoundaryObject} An [object]{@glossary Object} describing the
	*	scroll boundaries.
	* @public
	*/
	getScrollBounds: function () {
		var bounds  = this.$.strategy.getScrollBounds();
		if (
			(bounds.xDir !== -1 && bounds.xDir !== 0 && bounds.xDir !== 1) ||
			(bounds.yDir !== -1 && bounds.yDir !== 0 && bounds.yDir !== 1)
		) {
			this.decorateBounds(bounds);
		}
		// keep our properties synchronized always and without extra calls
		this.scrollTop  = bounds.top;
		this.scrollLeft = bounds.left;
		return bounds;
	},

	/**
	* Trigger a remeasurement of the scroller's metrics (specifically, the
	* size of its viewport, the size of its contents and the difference between
	* the two, which determines the extent to which the scroller may scroll).
	*
	* You should generally not need to call this from application code, as the
	* scroller usually remeasures automatically whenever needed. This method
	* exists primarily to support an internal use case for
	* [enyo/DataList]{@link module:enyo/DataList~DataList}.
	*
	* @public
	*/
	remeasure: function() {
		var s = this.$.strategy;
		if (s.remeasure) s.remeasure();
	},

	/**
	* Scrolls the given [control]{@link module:enyo/Control~Control} into view.
	*
	* @param {module:enyo/Control~Control} ctl - The control to make visible in the
	*	[scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top
	* of the scroller.
	* @public
	*/
	scrollIntoView: function (ctl, alignWithTop) {
		this.$.strategy.scrollIntoView(ctl, alignWithTop);
	},

	/**
	* Scrolls to the specified position.
	*
	* @param {Number} x - The `x` position in pixels.
	* @param {Number} y - The `y` position in pixels.
	* @public
	*/
	scrollTo: function (x, y) {
		this.$.strategy.scrollTo(x, y);
	},

	/**
	* Ensures that the given [control]{@link module:enyo/Control~Control} is visible in the
	* [scroller's]{@link module:enyo/Scroller~Scroller} viewport. Unlike
	* [scrollIntoView()]{@link module:enyo/Scroller~Scroller#scrollIntoView}, which uses DOM's
	* [scrollIntoView()]{@glossary scrollIntoView}, this only affects the current
	* scroller.
	*
	* @param {module:enyo/Control~Control} ctl - The [control]{@link module:enyo/Control~Control} to make visible in the
	*	[scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top of the
	*	scroller.
	* @public
	*/
	scrollToControl: function (ctl, alignWithTop) {
		this.scrollToNode(ctl.hasNode(), alignWithTop);
	},

	/**
	* Ensures that the given node is visible in the [scroller's]{@link module:enyo/Scroller~Scroller} viewport.
	*
	* @param {Node} node - The node to make visible in the [scroller's]{@link module:enyo/Scroller~Scroller}
	*	viewport.
	* @param {Boolean} alignWithTop - If `true`, the node is aligned with the top of the
	*	scroller.
	* @public
	*/
	scrollToNode: function (node, alignWithTop) {
		this.$.strategy.scrollToNode(node, alignWithTop);
	},

	/**
	* Stops the scroller if it is currently animating.
	*
	* @public
	*/
	stop: function() {
		if (typeof this.$.strategy.stop == 'function') {
			this.$.strategy.stop(true);
		}
	},

	/**
	* Adds current values of `getScrollBounds()` to {@glossary event}.
	*
	* @private
	*/
	decorateScrollEvent: function (e) {
		var bounds = e.scrollBounds = e.scrollBounds || this.$.strategy._getScrollBounds();
		// in the off chance that the event already had scrollBounds then we need
		// to make sure they are decorated
		if (
			(bounds.xDir !== -1 && bounds.xDir !== 0 && bounds.xDir !== 1) ||
			(bounds.yDir !== -1 && bounds.yDir !== 0 && bounds.yDir !== 1)
		) {
			this.decorateBounds(bounds);
		}
		// keep our properties synchronized always and without extra calls
		this.scrollTop  = bounds.top;
		this.scrollLeft = bounds.left;
	},

	/**
	* @private
	*/
	decorateBounds: function (bounds) {
		var x       = this.scrollLeft - bounds.left,
			y       = this.scrollTop  - bounds.top;
		bounds.xDir = (x < 0? 1: x > 0? -1: 0);
		bounds.yDir = (y < 0? 1: y > 0? -1: 0);
		// we update our current bounds properties so we don't have to unnecessarily
		// call getScrollTop/getScrollLeft because we already have the current data
		this.scrollLeft = bounds.left;
		this.scrollTop  = bounds.top;
	},

	/**
	* Normalizes scroll {@glossary event} to `onScroll`.
	*
	* @fires module:enyo/Scroller~Scroller#onScroll
	* @private
	*/
	domScroll: function (sender, e) {
		// if a scroll event originated here, pass it to our strategy to handle
		if (this.$.strategy.domScroll && e.originator == this) {
			this.$.strategy.domScroll(sender, e);
		}
		this.decorateScrollEvent(e);
		this.doScroll(e);
		return true;
	},

	/**
	* @returns {Boolean} `true` if the current scroll {@glossary event} should
	* be stopped; `false` if it should be allowed to propagate.
	* @private
	*/
	shouldStopScrollEvent: function (e) {
		return (this.preventScrollPropagation &&
			e.originator.owner != this.$.strategy);
	},

	/**
	* Calls [shouldStopScrollEvent()]{@link module:enyo/Scroller~Scroller#shouldStopScrollEvent} to
	* determine whether current scroll {@glossary event} should be stopped.
	*
	* @private
	*/
	scrollStart: function (sender, e) {
		if (!this.shouldStopScrollEvent(e)) {
			this.decorateScrollEvent(e);
			return false;
		}
		return true;
	},

	/**
	* Either propagates or stops the current scroll {@glossary event}.
	*
	* @private
	*/
	scroll: function (sender, e) {
		// note: scroll event can be native dom or generated.
		var stop;
		if (e.dispatchTarget) {
			// allow a dom event if it orignated with this scroller or its strategy
			stop = this.preventScrollPropagation && !(e.originator == this ||
				e.originator.owner == this.$.strategy);
		} else {
			stop = this.shouldStopScrollEvent(e);
		}
		if (!stop) {
			this.decorateScrollEvent(e);
			return false;
		}
		return true;
	},

	/**
	* Calls [shouldStopScrollEvent()]{@link module:enyo/Scroller~Scroller#shouldStopScrollEvent} to
	* determine whether current scroll {@glossary event} should be stopped.
	*
	* @private
	*/
	scrollStop: function (sender, e) {
		if (!this.shouldStopScrollEvent(e)) {
			this.decorateScrollEvent(e);
			return false;
		}
		return true;
	},

	/**
	* Scrolls to the top of the scrolling region.
	*
	* @public
	*/
	scrollToTop: function () {
		this.setScrollTop(0);
	},

	/**
	* Scrolls to the bottom of the scrolling region.
	*
	* @public
	*/
	scrollToBottom: function () {
		this.setScrollTop(this.getScrollBounds().maxTop);
	},

	/**
	* Scrolls to the right edge of the scrolling region.
	*
	* @public
	*/
	scrollToRight: function () {
		this.setScrollLeft(this.getScrollBounds().maxLeft);
	},

	/**
	* Scrolls to the left edge of the scrolling region.
	*
	* @public
	*/
	scrollToLeft: function () {
		this.setScrollLeft(0);
	},

	/**
	* Ensures scroll position is in bounds.
	*
	* @public
	*/
	stabilize: function () {
		var s = this.getStrategy();
		if (s.stabilize) {
			s.stabilize();
		}
	},

	/**
	* Sends the [useMouseWheel]{@link module:enyo/Scroller~Scroller#useMouseWheel} property to the scroll
	* strategy.
	*
	* @private
	*/
	useMouseWheelChanged: function () {
		this.$.strategy.setUseMouseWheel(this.useMouseWheel);
	},

	/**
	* @private
	*/
	resize: kind.inherit(function (sup) {
		return function () {
			if (this.getAbsoluteShowing(true)) {
				sup.apply(this, arguments);
			}
		};
	})
});

// provide a touch scrolling solution by default when the environment is mobile
if (Scroller.hasTouchScrolling()) {
	Scroller.prototype.strategyKind = Scroller.getTouchStrategy();
}

},{'../kind':'enyo/kind','../platform':'enyo/platform','../Control':'enyo/Control','../ScrollStrategy':'enyo/ScrollStrategy','../TouchScrollStrategy':'enyo/TouchScrollStrategy','../TranslateScrollStrategy':'enyo/TranslateScrollStrategy'}]
	};

});
//# sourceMappingURL=enyo.js.map
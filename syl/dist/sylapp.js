(function (scope, bundled) {
	
	var   enyo     = scope.enyo || (scope.enyo = {})
		, manifest = enyo.__manifest__ || (defineProperty(enyo, '__manifest__', {value: {}}) && enyo.__manifest__)
		, exported = enyo.__exported__ || (defineProperty(enyo, '__exported__', {value: {}}) && enyo.__exported__)
		, require  = enyo.require || (defineProperty(enyo, 'require', {value: enyoRequire}) && enyo.require)
		, local    = bundled()
		, entries;

	// below is where the generated entries list will be assigned if there is one
	entries = ['index'];


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
	return {'src/splash':[function (module,exports,global,require,request){
var
	kind = require('enyo/kind');

var
	FittableRows = require('layout/FittableRows');
module.exports = kind({
	name: 'enyo.sample.PanelsFlickrSample',
	kind: FittableRows,
	classes: 'panels-sample-flickr-panels enyo-unselectable enyo-fit',
	components: [
        {fit: true, content:'Syllabus App Splash Screen'}
	]
});
}],'src/schools':[function (module,exports,global,require,request){
var
	kind = require('enyo/kind'),
	json = require('enyo/json');

var
	CollapsingArranger = require('layout/CollapsingArranger'),
	FittableColumns = require('layout/FittableColumns'),
	FittableRows = require('layout/FittableRows'),
	List = require('layout/List'),
	Panels = require('layout/Panels'),
	Ajax = require('enyo/Ajax');

module.exports = kind({
	name: 'enyo.sample.PanelsFlickrSample',
	kind: FittableRows,
	classes: 'panels-sample-flickr-panels enyo-unselectable enyo-fit',
    events: {
        'onSchoolSelected':''
    },
	components: [
        {kind: List, fit: true, touch: true, onSetupItem: 'setupItem', components: [
            {name: 'item', style: 'padding: 10px;',  ontap: 'itemTap', components: [
                {name: 'title', classes:'panels-sample-flickr-title'}
            ]}
        ]}
	],
	rendered: kind.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			
			var req = new Ajax({url: '../data/schools.json', handleAs: 'text'})
				.response(this, 'processResponse')
				.go({});
		};
	}),
	processResponse: function (sender, res) {
		this.schools = JSON.parse(res);
		this.$.list.setCount(this.schools.length);
		this.$.list.refresh();
	},
	setupItem: function (sender, ev) {
		var i = ev.index;
		var item = this.schools[i];
		this.$.title.setContent(item.name || 'Untitled');
		return true;
	},

	itemTap: function (sender, ev) {
		var item = this.schools[ev.index];
		this.doSchoolSelected(item);
	},
});
}],'index':[function (module,exports,global,require,request){
// This is the default "main" file, specified from the root package.json file
// The ready function is excuted when the DOM is ready for usage.

var ready = require('enyo/ready');
var kind = require('enyo/kind');

var schools = require('./src/schools');
var splash = require('./src/splash');

ready(function() {
	var app = kind({
		components:[
			{
				name: 'splash',
				kind: splash
			},
			{
				name:'schoolSelector', 
				kind: schools, 
				events: {
					'onSchoolSelected': 'handleOnSchoolSelected'
				}
			}
		],
		create: kind.inherit(function (sup) {
			return function() {
				sup.apply(this, arguments);
				this.$.schoolSelector.hide();
			};
		}),
		rendered: kind.inherit(function (sup) {
			return function() {
				sup.apply(this, arguments);

				setTimeout(function(){
					this.$.splash.hide();
					this.$.schoolSelector.render();
					this.$.schoolSelector.show();
				}.bind(this), 1000);
			};
		}),
		handleOnSchoolSelected: function(event, sender) {
			this.$.schoolSelector.hide();
			alert('you selected: ' + sender.name)
		}
	});
	var App = new app();
	App.renderInto(document.body);
});

},{'./src/schools':'src/schools','./src/splash':'src/splash'}]
	};

});
//# sourceMappingURL=sylapp.js.map
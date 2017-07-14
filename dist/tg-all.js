(function() {

	if (this.tgmodule && this.require) {
		return;
	}

	var stack = [];
	var pathstack = ['./'];

	tgmodule = {
		'start': function(name) {
			stack.push(name);
		},
		'end': function(name) {
			if (stack[stack.length - 1] === name) {
				stack.pop();
			}
		},
		'setpath': function(path) {
			pathstack.push(path === './' ? '.' : path);
		},
		'unsetpath': function() {
			pathstack.pop();
		},
		'list': function() {
			var rv = [];
			for (var k in require.cache) {
				rv.push(k);
			}
			return rv;
		},
		'd': function(p,n,f) {
			var module = {};
			this.setpath(p);
			this.start(n);
			var src = stack[stack.length - 1];
			typeof(f) === 'function' ? f(module) : module.exports = f;
			require.cache[src] = module;
			this.end(n);
			this.unsetpath();
		}
	};

	require = function(src) {
		var m = require.cache[require.resolve(src)];
		if (!m) { throw "`" + src + "` does not exist."; }
		return m.exports;
	};

	require.cache = {};

	require.resolve = function(src) {
		var path = src.split(/\//);
		var wcpath = pathstack[pathstack.length - 1].split(/\//);
		while (path[0] == '..') {
			path.shift();
			wcpath.pop();
		}
		while (path[0] == '.') {
			path.shift();
		}
		return wcpath.join('/') + '/' + path.join('/');
	}; // resolve()

})();


tgmodule.d('./','./tg-upon.js',function(module){
upon = function(test, fn) {
	if (typeof(test) == 'function' && test()) {
		fn();
	} else if (typeof(test) == 'string' && window[test]) {
		fn();
	} else {
		setTimeout(function() { upon(test, fn); }, 50);
	}
}; // upon()

});

tgmodule.d('./','./tg-namespace.js',function(module){
TG = this.TG || {};
TG.API = TG.API || {};
TG.Data = TG.Data || {};
TG.UI = TG.UI || {};
});

tgmodule.d('./','./tg-upon.js',function(module){
});

tgmodule.d('./','./tg-dom.js',function(module){
require('tg-namespace.js');
require('tg-upon.js');

this.console = this.console || {
	log_items: [],
	log: function () {
		for (var i = 0; i < arguments.length; i++) {
			this.log_items.push(arguments[i]);
		}
	}
} // console


this.Element = this.Element || function () { return true; };
this.Node = this.window.Node || this.Element;


this.getTypeId = function(t) {
	var id = t;
	if (typeof(t) == 'function') {
		var bound = Bind.getBindings(t);
		if (bound.length > 0) {
			id = bound[0];
		} else {
			id = t.name || t.toString();
		}
	}
	return id;
}; // getTypeId()


this.setType = function (o, constructor) {
	o.__types = o.__types || {};
	var t = this.getTypeId(constructor);
	if (t && o.__types[t] == null) {
		var v = 0;
		for (var i in o.__types) {
			v = Math.max(v, o.__types[i]);
		}
		v += 1;
		o.__types[t] = v;
	}
}; // setType()
this.registerType = setType;


this.isa = function (o, constructor) {
	var oT = typeof(o);
	var cT = typeof(constructor);

	if (oT === 'string') {
		return constructor === String;
	}
	if (oT === 'number') {
		return constructor === Number;
	}
	if (o === undefined || o === null) {
		return cT === oT;
	}
	if (oT === 'boolean') {
		return oT == cT;
	}

	if (cT === 'string' || cT === 'function') {
		o.__types = o.__types || {};
		if (constructor && o.__types[this.getTypeId(constructor)]) {
			return true;
 		}
	}

	if (
		constructor === Element
		|| constructor === Node
		|| constructor === NodeList
		|| cT  === 'function'
	) {
		return o instanceof constructor;
	}
	return o === constructor;
}; // isa()


TG.Event = function (singleFire, o, a) {

	this.target = o;
	this.action = a;
	this.subscribers = [];
	this.interceptors = [];
	this.fired = 0;
	this.singleFire = singleFire || false;
	this.args = [];

	this.register = function (fn) {
		if (this.singleFire && this.fired > 0) {
			fn();
		} else {
			this.subscribers.push(fn);
		}
		return this;
	}; // register()

	this.then = this.register;
	this.and = this.then;

	this.fire = function (arg1, arg2, etc) {
	    this.args = arguments;
	    this.fireWithInterception();
		return this;
	}; // fire()

	this.fireOnce = function(arg1, arg2, etc) {
		this.singleFire = true;
		return this.fire.apply(this, arguments);
	}; // fireOnce()

	this.fireWithInterception = function (i) {
		var i = i || 0;

		if (typeof (this.interceptors[i]) == 'function') {
			var _t = this;
			this.interceptors[i]({
			    /* include other/all properties of _t as necessary */
                arguments: _t.args,
				resume: function () {
				    _t.fireWithInterception(i + 1);
				}
			});
			return;
		}

		this.fired += 1;
		var firedFns = [];

		while (this.subscribers.length > 0) {
			var fn = this.subscribers.pop();
			fn.apply(null, this.args);
			firedFns.push(fn);
		}

		if (!this.singleFire) {
			this.subscribers = firedFns;
		}
	}; // fire()

	this.intercept = function (fn) {
		if (typeof (fn) === 'function') {
			this.interceptors.push(fn);
		}
	}; // intercept()

	setType(this, 'TG.Event');
}; // TG.Event()

TG.Event.events = [];
TG.Event.events.getWaiting = function () {
	return TG.Event.events.filter(function (e) { return e.fired == 0; });
};

TG.Event.registries = [];
TG.Event.registries.getWaiting = function () {
	return (TG.Event.registries
		.filter(function (r) { return r.fired < r.count; })
	);
};

this.on = function (o, a, f, sf) {
	var eventName = "__TGEvent_on" + a;

	var singleFire = sf || false;

	// todo: add other enumerable types:
	if (isa(o, Array) || isa(o, NodeList)) {
		var _o = [];
		for (var i = 0; i < o.length; i++) {
			if (isa(o[i], Object) && (isa(o[i], Element) || !isa(o[i], Node))) {
				_o.push(o[i]);
			}
		}
		var registry = {
			count: _o.length,
			fired: 0,
			fn: f,
			singleFire: singleFire,
			fire: function () {
				this.fired++;
				if (this.fired >= this.count) {
					f();
					// what was this for? :
					// TG.Event.registries.splice(TG.Event.registries.indexOf(this), 1);
				}
			},

			// for debugging and/or monitoring
			objects: _o,
			eventName: eventName

		};

		if (_o.length > 0) {
			for (var i = 0; i < _o.length; i++) {
				on(_o[i], a, function () { registry.fire(); }, singleFire);
			}
		} else {
			registry.fire();
		}

		TG.Event.registries.push(registry);
		return registry;
	}

	if (typeof (o[eventName]) === 'undefined') {
		o[eventName] = new TG.Event(singleFire, o, eventName);
	} else if (!isa(o[eventName], 'TG.Event')) {
		throw eventName + " already exists as a non-TG.Event on the target object.";
	}

	if (typeof(f) == 'function') {
		o[eventName].register(f);
	}

	return o[eventName];
};
// on()


this.onready = function (o, f) {
	return on(o, 'ready', f, true);
};
// onready()


TG.StringSet = function(v) {
	var _d = {};

	this.add = function(v) {
		if (v instanceof Array) {
			for (var i = 0; i < v.length; i++) {
				this.add(v[i]);
			}
		} else {
			_d[v] = true;
		}
	}; // add()

	this.remove = function(v) {
		delete _d[v];
	}; // remove()

	this.toArray = function() {
		var rv = [];
		for (var i in _d) {
			rv.push(i);
		}
		return rv;
	}; // toArray()

	if (v) {
		this.add(v);
	}
}; // StringSet


TG.getClassnames = function(node) {
	return (new TG.StringSet(node.className.split(/\s+/))).toArray();
}; // getClassnames()


TG.addClassname = function(node, classname) {
	var classes = new TG.StringSet(node.className.split(/\s+/));
	classes.add(classname);
	node.className = classes.toArray().join(' ');
}; // addClassname()


TG.removeClassname = function(node, classname) {
	var classes = new TG.StringSet(node.className.split(/\s+/));
	classes.remove(classname);
	node.className = classes.toArray().join(' ');
}; // removeClassname()


this.currentStyle = function(node, key) {
	return node.currentStyle ? node.currentStyle[key]
		: document.defaultView.getComputedStyle(node, '')[key];
}; // currentStyle()


TG.CopyStyle = function(f, t, asComputed) {
	if (asComputed instanceof Array) {
		for (var i = 0; i < asComputed.length; i++) {
			t.style[asComputed[i]] = currentStyle(f, asComputed[i]);
		}
	} else {
		for (var i in f.style) {
			t.style[i] = asComputed ? currentStyle(f, i) : f.style[i];
		}
	}
	var c = TG.getClassnames(f);
	for (var i = 0; i < c.length; i++) {
		TG.addClassname(t, c[i]);
	}
}; // getStyles()


if (!this.Bind) {

	this.DomClass = function(template, constructor) {
		constructor = constructor || function() {};
		constructor.template = template;
		Bind(constructor);
		var f = function(arg) {
			return New(constructor, arg);
		}; 
		f.apply = function(_t, _a) { return constructor.apply(_t, _a); };
		f.call = function() {
			var _t = Array.prototype.shift.apply(arguments);
			return constructor.call(_t, arguments);
		};
		f.__constructor = constructor;
		return f;
	}; // DomClass()

	this.Bind = function (constructor, binding, scope) {
		if (typeof (constructor) == 'function') {
			var binding = Bind.addBinding(constructor, binding);
			constructor.binding = binding;
			var nodes = getNodes(isa(scope, Node) ? scope : document, binding);
			Bind.Apply(constructor, nodes);
			return nodes.length;
		} else if (isa(constructor, Node)) {
			Bind.BindExistingConstructors(constructor);
		}
	}; // Bind()

	Bind.BindExistingConstructors = function(node, f) {
		var deps = [];
		var bindings = (f && f.dependencies) || Bind.Classes;
		for (var binding in bindings) {
			if (Bind(Bind.Classes[binding], binding, node) > 0) {
				deps[binding] = 1;
			}
		}
		(f && !f.dependencies) ? (f.dependencies = deps) : null;
	}; // this.Bind.BindExistingConstructors()

	Bind.Apply = function(constructor, nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var n = nodes[i];
			if (!n.__AlreadyBound) {
				Bind.importParameters(n);
				Bind.ApplyClone(constructor, n);
				Bind.ApplyConstructor(constructor, n);
				n.__AlreadyBound = true;
			}
		}
	}; // Apply()

	Bind.ApplyTemplate = function (constructor, node) {
		var template = constructor.template
			|| constructor.markup
			|| constructor.templateMarkup
		;
		if (template) {
			node.innerHTML = template;
		}
	}; // ApplyTemplate()

	Bind.ApplyClone = function(constructor, node) {
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}
		var clone = Bind.getClone(constructor);
		if (clone.childNodes.length == 0) clone = node.__holdingDiv;
		while (clone.firstChild) {
			node.appendChild(clone.removeChild(clone.firstChild));
		}
	}; // ApplyClone

	Bind.ApplyConstructor = function(constructor, node) {
		Bind.BindExistingConstructors(node, constructor);
		setType(node, constructor);
		Bind.attachIdentifiedChildren(node);
		Bind.applyParameters(node);
		constructor.apply(node);
	}; // ApplyConstructor()

	Bind.applyProperties = function(node, obj) {
		var o = typeof(obj) == 'object' ? obj : {};
		for (var i in o) {
			if (o.hasOwnProperty(i)) node[i] = o[i];
		}
	}; // applyProperties()


	Bind.originalCreateElement = document.createElement;
	Bind.createNode = function(constructor, tag) {
		tag = tag || constructor.binding;
		var container = Bind.originalCreateElement.call(document, 'div');
		if (tag.indexOf(':') == 0) { tag = tag.substr(1); }
		if (tag.indexOf('.') == 0) {
			var className = tag.substr(1);
			tag = 'tg:element';
		}
		container.innerHTML = '<' + tag + '></' + tag + '>';
		var rv = container.firstChild;
		rv.className = className || '';
		return rv;
	}; // createNode()

	Bind.Classes = {};


	document.createElement = function (tag, o) {
		var constructor = Bind.getConstructor(tag);
		if (constructor) {
			var node = Bind.getClone(constructor);
			Bind.applyProperties(node, o);
			Bind.ApplyConstructor(constructor, node);
			node.__AlreadyBound = true;
		} else {
			var node = Bind.originalCreateElement.call(this, tag);
			Bind.applyProperties(node, o);
		}
		return node;
	}; // document.createElement()

	Bind.getClone = function(constructor) {
		if (!constructor.templateNode) {
			constructor.templateNode = Bind.createNode(constructor);
			Bind.ApplyTemplate(constructor, constructor.templateNode);
		}
		return constructor.templateNode.cloneNode(true);
	}; 

	Bind.addBinding = function(constructor, binding) {
		if (!binding) {
			binding = Bind.bindingQueryFromConstructor(constructor);
		}
		Bind.Classes[binding] = constructor;
		return binding;
	}; // addBinding()


	Bind.bindingQueryFromConstructor = function(constructor) {
		var sample = document.createElement('div');
		sample.innerHTML = constructor.template
			|| constructor.markup
			|| constructor.templateMarkup
		;
		for (var i = 0; i < sample.childNodes.length; i++) {
			var binding = Bind.bindingQueryFromNode(sample.childNodes[i]);
			constructor.template = sample.childNodes[i].innerHTML;
			if (binding) { return binding; }
		}
		throw "Could not bind " + constructor;
	}; // bindingQueryFromConstructor()


	Bind.bindingQueryFromNode = function(node) {
		if (node.tagName) {
			if (!node.className || node.tagName.match(/\:/)) {
				return node.tagName.toLowerCase();
			} else {
				return node.className;
			}
		}
		return null;
	}; // bindingQueryFromNode


	Bind.getConstructor = function(binding) {
		return Bind.Classes[binding];
	}; // getConstructor()


	Bind.getBindings = function (constructor) {
		var rv = [];
		for (var i in Bind.Classes) {
			if (Bind.Classes[i] === constructor
				|| Bind.Classes[i] === constructor.__constructor
			) {
				rv.push(i);
			}
		}
		return rv;
	}; // getBindings()

	Bind.makeNodeFrom = function(o, collectionType) {
		if (isa(o, Node) || isa(o, Element)) {
			// if (o.nodeType == 3) {
			// 	// to satisfy IE's inability to work with pre-existing TextNodes ... 
			// 	return document.createTextNode(o.data);
			// } else {
			// 	if (o.parentNode) o.parentNode.removeChild(o);
				return o;
			// }
		}

		if (isa(o, Array)) {
			var rv = document.createElement('div');
			Bind.addArrayAsChildren(rv, o);
			return rv;
		}

		if (typeof(o) != 'object') {
			var rv = document.createElement('div');
			rv.innerHTML = o;
			return rv;
		}

		var constructor = null;
		if (collectionType) {
			constructor = Bind.getConstructor(collectionType);
		}

		if (typeof(o.__types) == 'object') {
			var types = TG.getTypeArray(o);
			for (var i = 0; i < types.length; i++) {
				constructor = Bind.getConstructor(types[i]);
			}
		}

		if (constructor) {
			return New(constructor, o);
		}

		var node = document.createElement('div');
		node.innerHTML = o;
		return node;
	}; 

	Bind.addArrayAsChildren = function(node, values, collectionType) {
		while (node.firstChild) node.removeChild(node.firstChild);
		for (var i = 0; i < values.length; i++ ) {
			values[i] = Bind.makeNodeFrom(values[i], collectionType);
			if (values[i].parentNode) values[i].parentNode.removeChild(values[i]);
			node.appendChild(values[i]);
		};
	}; // addArrayAsChildren()

	Bind.childNodeArray = function(node) {
		var rv = [];
		rv.events = {};

		var collectionType = node['data-collection'] || node.getAttribute('data-collection');

		rv.render = function() {
			// todo: optimize / apply delta
			Bind.addArrayAsChildren(node, rv);
		};

		rv.loadFromDOM = function() {
			var childNodes = [];

			var childType = node['data-collection']
				|| node.getAttribute('data-collection');

			if (childType) {
				childNodes = getNodes(node, childType);
			} else {
				childNodes = Array.prototype.slice.call(node.childNodes);
			}

			rv.length = 0;

			childNodes.forEach(function(child) {
				rv.push(child);
			});
		}; 

		rv.push = function(v) {
			var n = Bind.makeNodeFrom(v, collectionType);
			node.appendChild(n);
			return Array.prototype.push.call(rv, n);
		};

		rv.pop = function() {
			node.removeChild(n);
			return Array.prototype.pop.apply(rv);
		};

		rv.shift = function() {
			node.removeChild(n);
			return Array.prototype.shift.apply(rv);
		};

		rv.unshift = function(v) {
			var n = Bind.makeNodeFrom(v, collectionType);
			node.insertBefore(n, node.firstChild);
			return Array.prototype.unshift.call(rv, n);
		};

		rv.splice = function() {
			var params = Array.prototype.slice.call(arguments, 0);
			var index = params.shift();
			var count = params.shift() || rv.length;
			var newItems = params || [];

			for (var i = index; i < index + count; i++) {
				var n = rv[i];
				node.removeChild(n);
			}

			var insertBeforeNode = rv[i];
			newItems.forEach(function(item) {
				node.insertBefore(item, insertBeforeNode);
			});

			return Array.prototype.splice.apply(rv, arguments);
		};

		var modifiers = [
			// 'push', 'pop', 'shift', 'unshift',
			// 'slice'
			// 'splice',
			'reverse', 'sort'
		];

		for (var i = 0; i < modifiers.length; i++) { (function() {
			var m = modifiers[i];
			rv[m] = function() {
				var r = Array.prototype[m].apply(rv, arguments);
				rv.render();
				return r;
			}
		})(); }

		rv.loadFromDOM();

		return rv;
	}; // childNodeArray()

	Bind.defineAccessors = function(node, obj, id) {
		var descriptor = Object.getOwnPropertyDescriptor(obj, id);
		if (descriptor && descriptor.configurable == false) {
			return;
		}

		if (node.__accessorDefined) {
			return;
		}
		Object.defineProperty(node, '__accessorDefined', {
			get: function() { return true; },
			enumerable: false
		});

		var existing_value = obj[id];

		var default_property = 'innerHTML';
		if (typeof(node.value) == 'string') {
			default_property = 'value';
		}
		var target_property = node.getAttribute('data-property');
		var last_set = target_property;
		var childCollection = Bind.childNodeArray(node);

		obj.__dom = obj.__dom || {};
		obj.__dom[id] = node;

		Object.defineProperty(obj, '__dom', {
			enumerable: false
		});

		var enumerable = true;
		if (node['data-ignore'] || node.getAttribute('data-ignore')) {
			enumerable = false;
		}

		Object.defineProperty(obj, id, {
			get: function() {
				if (target_property == 'children'
					|| last_set == 'children'
					|| node['data-collection']
					|| node.getAttribute('data-collection')
				) {
					return childCollection;
				} else if (target_property) {
					return node[target_property];
				} else if (last_set) {
					return node[last_set];
				} else {
					return node;
				}
			},
			set: function(v) {
				var setThisValue = function(vv) {
					if (isa(vv, Array)) {
						Bind.addArrayAsChildren(node, vv);
						last_set = 'children';
					} else if (target_property) {
						node[target_property] = vv;
						last_set = target_property;
					} else if (isa(vv, Node)) {
						if (node.parentNode) node.parentNode.replaceChild(vv, node);
						node = vv;
						last_set = null;
					} else if (isa(vv, Object)) {
						for (var vv_k in vv) {
							node[vv_k] = vv[vv_k];
						}
						last_set = null;
					} else {
						node[default_property] = vv;
						last_set = default_property;
					}
				}; // setThisValue()

				if (isa(v, 'TG.Value')) {
					on(v, 'change', function() {
						setThisValue(v.valueOf());
					});
				}

				setThisValue(v.valueOf());
				childCollection.loadFromDOM();
			},
			enumerable: enumerable,
			configurable: false
		});

	}; // defineAccessors()

	// attach nodes with a data-id to the object ... o.{data-id}
	Bind.attachIdentifiedChildren = function (o, node) {
		var nodes = (node || o).querySelectorAll('[data-id]');
		nodes = Array.prototype.slice.call(nodes, 0);
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].getAttribute('data-id');
			var initial_value = o[id];
			Bind.defineAccessors(nodes[i], o, id);
			if (initial_value) {
				o[id] = initial_value;
			}
		};
	}; // Bind.attachIdentifiedChildren()


	Bind.importAttributes = function (o, node) {
		var node = node || o;
		if (!o.__attributes_imported
			&& node.attributes && node.attributes.length
		) {
			for (var i = 0; i < node.attributes.length; i++) {
				var a = node.attributes[i];
				if (!o[a.name]) {
					o[a.name] = a.value;
				}
			}
		}
		o.__attributes_imported = true;
	}; // importAttributes()


	Bind.importParameters = function (o, node) {
		var node = node || o;
		if (!o.__parameters_imported && node.childNodes) {
			o.parameters = [];

			for (var i = 0; i < node.childNodes.length; i++) {
				var n = node.childNodes[i];
				if (n.nodeType && n.nodeType == 3 && n.data && n.data.replace(/\s/g, '')) {
					// special treatment for IE 8 text nodes
					var _n = document.createElement('span');
					_n.innerHTML = n.data;
					n = _n;
				} else {
					Bind.importAttributes(n);
				}
				o.parameters.push(n);
			}

			o.__holdingDiv = document.createElement('div');
			o.__holdingDiv.style.display = 'none';
			document.body.appendChild(o.__holdingDiv);
			for (var i = 0; i < o.parameters.length; i++) {
				o.__holdingDiv.appendChild(o.parameters[i]);
			}

			// not 100% sure why parameters aren't being bound
			// during the regular Bind() calls, but in some cases they're not:
			Bind(o.__holdingDiv);
		}
		o.__parameters_imported = true;
	}; // importParameters()


	Bind.applyParameters = function (o) {
		if (!o.parameters || !isa(o.parameters, Array)) { return; }
		var nodes = o.parameters;
		for (var i = nodes.length - 1; i >= 0; i--) {
			var id = nodes[i]['data-id'];
			if (id) {
				o[id] = nodes[i];
			}
		}
		o.__holdingDiv.parentNode.removeChild(o.__holdingDiv);
		delete o.__holdingDiv;
	}; // applyParameters()


	Bind.getChildren = function (o, query) {
		if (!o.childNodes) {
			return [];
		}

		var rv = [];

		// not the most efficient solution. but an easy one!
		var _rv = getNodes(o, query);
		for (var i = 0; i < _rv.length; i++) {
			if (_rv[i].parentNode === o) {
				rv.push(_rv[i]);
			}
		}

		return rv;
	}; // getChildren()


	Bind.Box = function(x, y, w, h, mt, mr, mb, ml) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = w || 0;
		this.height = h || 0;
		this.marginTop = mt || 0;
		this.marginRight = mr || 0;
		this.marginBottom = mb || 0;
		this.marginLeft = ml || 0;

		this.contains = function(x, y) {
			var ex = this.x - Math.ceil(this.marginLeft/2);
			var ey = this.y - Math.ceil(this.marginTop/2);
			var eright = this.x + this.width - Math.ceil(this.marginRight/2);
			var ebottom = this.y + this.height - Math.ceil(this.marginBottom/2);
			if (x >= ex && x <= eright && y >= ey && y <= ebottom) {
				return true;
			} else {
				return false;
			}
		}; // contains()

		this.getBottom = function() {
			return this.y + this.height;
		}; // getCorners()

		this.getRight = function() {
			return this.x + this.width;
		}; // getCorners()

		this.rangeOverlaps = function(aMin, aMax, bMin, bMax) {
			return aMin <= bMax && bMin <= aMax;
		}; // lineOverlaps()

		this.xOverlaps = function(box) {
			return this.rangeOverlaps(
				this.x, this.getRight(), box.x, box.getRight()
			);
		}; // xOverlaps()

		this.yOverlaps = function(box) {
			return this.rangeOverlaps(
				this.y, this.getBottom(), box.y, box.getBottom()
			);
		}; // yOverlaps()

		this.overlaps = function(box) {
			return this.xOverlaps(box) && this.yOverlaps(box);
		}; // overlaps()

	}; // Bind.Box()


	Bind.NodeBox = function(n) {
		this.x = n.offsetLeft;
		this.y = n.offsetTop;

		var temp = n;
		while (temp = temp.offsetParent) {
			this.x += temp.offsetLeft;
			this.y += temp.offsetTop;
		}

		this.left = this.x;
		this.top = this.y;
		this.width = n.offsetWidth;
		this.height = n.offsetHeight;
		this.right = this.x + this.width;
		this.bottom = this.x + this.height;

		var style = {
			marginLeft: '', marginRight: '', marginTop: '', marginBottom: ''
		};

		this.marginLeft = parseInt(style.marginLeft.replace(/[^0-9]/g, '') || '0');
		this.marginRight = parseInt(style.marginRight.replace(/[^0-9]/g, '') || '0');
		this.marginTop = parseInt(style.marginTop.replace(/[^0-9]/g, '') || '0');
		this.marginBottom = parseInt(style.marginBottom.replace(/[^0-9]/g, '') || '0');
	}; // getCoordinates()
	Bind.NodeBox.prototype = new Bind.Box();


	// TG.MouseCoords
	// Determines and stores the Coordinates for a mouse event
	TG.MouseCoords = function (event) {
		var e = event || window.event;
		if (e.changedTouches) {
			this.x = e.changedTouches[0].pageX;
			this.y = e.changedTouches[0].pageY;
		} else if (e.pageX || e.pageY) {
			this.x = e.pageX;
			this.y = e.pageY;
		} else if (e.clientX || e.clientY) {
			this.x = e.clientX + document.body.scrollLeft;
			this.y = e.clientY + document.body.scrollTop;
		}
	}; // TG.MouseCoords


	window.getNodes = window.getNodes || function (n, q) {
		var rv;

		if (typeof (q) == 'function') {
			rv = [];
			var bindings = Bind.getBindings(q);
			for (var i = 0; i < bindings.length; i++) {
				var _rv = getNodes(n, bindings[i]);
				for (var ii = 0; ii < _rv.length; ii++) {
					rv.push(_rv[ii]);
				}
			}
			return rv;
		}

		q = q.replace(/:/g, '\\:');
		rv = n.querySelectorAll(q);

		for (var i = 0; i < rv.length; i++) {
			Bind.importAttributes(rv[i]);
		}

		return Array.prototype.slice.call(rv, 0);
	}; // getNodes()

} // Bind


this.Build = function (constructor, o) {
	var _o = o || {};
	var n = null;

	for (var i in Bind.Classes) {
		if (Bind.Classes[i] === constructor) {
			n = document.createElement(i, _o);
			break;
		}
	}

	if (n === null) {
		n = o;
		constructor.apply(n);
	}

	return n;
} // Build()
this.New = Build;

console.log('Loaded Bind.');

upon(function() { return document.body; }, function() {
	this._bindq = window._bindq || {};
	this._bindq.push = function(c,b) { Bind(c,b); };
	if (this._bindq instanceof Array) {
		for (var i = 0; i < this._bindq.length; i += 2) {
			Bind(this._bindq[i], this._bindq[i+1]);
		}
	}
});
});

tgmodule.d('./','./tg-namespace.js',function(module){
});

tgmodule.d('./','./tg-upon.js',function(module){
});

tgmodule.d('./','./tg-api.js',function(module){
require('tg-namespace.js');
require('tg-upon.js');

TG.API.longPolls = TG.API.longPolls || [];
TG.API.requests = TG.API.requests || {};
TG.API.APIs = TG.API.APIs || [];

TG.addSlashes = function(s) {
	s = String(s);
	s = s.replace(/\\/g, "\\\\");
	s = s.replace(/\"/g, "\\\"");
	s = s.replace(/\'/g, "\\\'");
	return s;
}; // TG.addSlashes()


TG.jsonEscape = function(s) {
	s = String(s);
	s = s.replace(/\\/g, "\\\\");
	s = s.replace(/\"/g, "\\\"");
	s = s.replace(/\//g, "\\/");
	s = s.replace(/[\b]/g, "\\b");
	s = s.replace(/\f/g, "\\f");
	s = s.replace(/\n/g, "\\n");
	s = s.replace(/\r/g, "\\r");
	s = s.replace(/\t/g, "\\t");
	s = s.replace(/[^\u0020-\u007d]/g, function(s) {
			return '\\u' + ('0000' + s.charCodeAt(0).toString(16)).slice(-4);
		}
	);
	return s;
}; // TG.jsonEscape()


TG.jsonAddSlashes = function(s) {
	return TG.jsonEscape(s);
}; // TG.jsonAddSlashes()


TG.stringify = function (o, depth, stringify_instance, make_refs) {
	var d = typeof(depth) == 'number' ? depth : 128;
	if (d < 1) {
		return undefined;
	}

	var instance = stringify_instance || Math.random();
	if (o && o.__stringify_instance && o.__stringify_instance == instance) {
		delete o.__stringify_instance;
		return undefined;
	} else if (o) {
		o.__stringify_instance = instance;
	}

	var rv;

	if (typeof(o) === 'undefined') {
		rv = undefined;
	} else if (o === null) {
		rv = 'null';
	} else if (o instanceof Array) {
		var _rv = [];
		for (var i = 0; i < o.length; i++) {
			var v = TG.stringify(o[i], d - 1, instance, make_refs);
			if (v !== null) _rv.push(v);
		}
		rv = '[' + _rv.join(',') + ']';
	} else if (typeof(o) === 'boolean') {
		rv = o ? 'true' : 'false';
	} else if (make_refs && stringify_instance && isa(o, 'TG.DataObject')) {
		var _make_refs = false;
		rv = TG.stringify(
			new TG.DataObjectReference(o),
			d - 1,
			instance,
			_make_refs	
		);
	} else if (typeof(o) === 'object') {
		var _rv = [];
		var props_written = 0;

		for (var i in o) {
			var omissions = {};
			omissions.__stringify_instance = 1;
			omissions.__parameters_imported = 1;
			omissions.__attributes_imported = 1;
			omissions.__AlreadyBound = 1;
			if (!omissions[i] && o.hasOwnProperty(i) && !i.match(/__TG/)) {
				var v = TG.stringify(o[i], d - 1, instance, make_refs);
				var k = TG.stringify(i, d - 1, instance, make_refs);
				if (k && typeof(v) == 'string') {
					props_written += 1;
					_rv.push(k + ':' + v);
				}
			}

			/*
			if (i == 'childNodes' && o[i].length > 0) {
				var v = TG.stringify(
					Array.prototype.slice.apply(o[i]),
					d - 1,
					instance,
					make_refs
				);
				_rv.push(i + ':' + v);
			}
			*/

			/*
			if (i == 'innerHTML' && o.innerHTML.length > 0) {
				_rv.push(i + ':' + TG.stringify(o.innerHTML));
			}
			*/
		}

		/*
		if (props_written == 0 && o.childNodes) {
			// _rv.push('"innerHTML":' + TG.stringify(o.innerHTML));
			var v = TG.stringify(
				Array.prototype.slice.apply(o.childNodes),
				d - 1,
				instance,
				make_refs
			);
			_rv.push('"childNodes":' + v);
		}
		*/

		rv = '{' + _rv.join(',') + '}';
	} else if (typeof(o) === 'number') {
		rv = String(o);
	} else if (typeof(o) === 'function') {
		// TODO: if the function is registered with Bind(), look for its
		// bound name(s) and put 'em here.
		rv = undefined;
	} else {
		rv = "\"" + TG.jsonEscape(o) + "\"";
	}

	if (o && o.__stringify_instance) {
		delete o.__stringify_instance;
	}

	return rv;
}; // TG.stringify()


TG.argumentsArray = function(args) {
	var rv = [];
	for (var i = 0; i < args.length; i++) {
		rv.push(args[i]);
	}
	return rv;
}; // TG.argumentsArray()


TG.API.multijsonp = function(api, actions, longpoll) {

	if (!TG.API.APIs[api]) {
		TG.API.APIs[api] = {};
	}

	upon(
		function() { return TG.API.poll; },
		function() {
			// prepare callback function
			var token_rand = Math.floor(100000 + Math.random() * 100000);
			var token_date = (new Date()).getTime();
			var token = token_date.toString(36) + token_rand.toString(36);

			TG.API.requests[token] = actions;
			TG.API.requests[token].longpoll = longpoll;

			// prepare request parameters; // upon()
			var actions_json = encodeURIComponent(TG.stringify(actions));

			var formdata;
			if (longpoll) {
				formdata = "tg-t=" + token + "&tg-w=" + actions_json;
			} else {
				formdata = "tg-t=" + token + "&tg-a=" + actions_json;
			}

			// send request
			var xml = window.MockXMLHttpRequest||window.XMLHttpRequest||null;
			var r = xml ? new xml() : new ActiveXObject("Microsoft.XMLHTTP");

			r.open('post', api, true);
			r.setRequestHeader(
				"Content-type", "application/x-www-form-urlencoded"
			);
			r.onreadystatechange = function() {
				if (r.readyState == 4) {
					if (r.status == 200) {
						eval(r.responseText);
					} else {
						console.log('TG.mulijsonp() Error or Abort', r);
					}
					delete TG.API.requests[token];
					if (longpoll) {
						delete TG.API.APIs[api].longPoll;
						if (r.status == 0 || r.responseText == '') {
							TG.API.disconnect(api, token);
						} else {
							TG.API.poll(api);
						}
					}
				}
			}
			r.send(formdata);

			if (longpoll) {
				TG.API.APIs[api].longPoll = r;
			}
		}
	);
	
}; // TG.multijsonp()


TG.API.jsonp = function(api, fn, params) {
	var cb = new TG.API.Callback();
	if (!(params instanceof Array)) { params = [params] }
	var action = {
		f: fn, p: params, c: cb
	};

	var j = TG.API.jsonp;
	j.pending = j.pending || {};

	var b = j.buffer;
	b[api] = b[api] || [];
	b[api].push(action);

	if (fn.match(/^tg-api/)) {
		// TG API control requests must fire immediately.
		TG.API.multijsonp(api, b[api]);
	} else if (typeof(j.pending[api]) == 'undefined') {
		j.pending[api] = setTimeout(function() {
			TG.API.multijsonp(api, b[api]);
			b[api] = [];
			delete j.pending[api];
		}, 15);
	}

	return cb;
}; // TG.jsonp()

TG.API.jsonp.buffer = {};

TG.API.getPolls = function(api, fn, params) {
	var rv = [];
	for (var i = 0; i < TG.API.longPolls.length; i++) {
		var p = TG.API.longPolls[i];
		if (p.api == api
			&& fn == null || p.f == fn
			&& params == null || p.p == params) {
			rv.push(p);
		}
	}
	return rv;
}; // TG.API.getPolls()

TG.API.poll = function(api) {
	var poll = TG.API.poll;
	poll.pending = poll.pending || {};
	if (typeof(poll.pending[api]) == 'undefined') {
		poll.pending[api] = setTimeout(function() {
			if (TG.API.APIs[api] && TG.API.APIs[api].longPoll) {
				TG.API.APIs[api].longPoll.abort();
			}

			var actions = TG.API.getPolls(api);

			if (actions.length == 0) {
				return;
			}

			TG.API.multijsonp(api, actions, true);

			delete poll.pending[api];
		}, 50);
	}
}; // TG.API.poll()

TG.API.restartPolls = function() {
	var t = TG.API;
	if (t.APIs) {
		for (var i = 0; i < t.APIs.length; i++) {
			var a = TG.API.APIs[i];
			if (t[a] && t[a].longPoll === undefined) {
				var acts = TG.API.getPolls(a);
				if (acts.length > 0) {
					if (t[a].longPollBroken) {
						console.log("Connection to " + a + " is broken. Retrying ...");
						TG.API.poll(a);
					} else {
						t[a].longPollBroken = true;
					}
				}
			} else if (t[a]) {
				t[a].longPollBroken = false;
			}
		}
	}
}; // restartPolls()

TG.API.poll.monitor = setInterval(TG.API.restartPolls, 5000);


TG.API.start = function(api, fn, params) {
	var existing = TG.API.getPolls(api, fn, params);
	if (existing.length > 0) {
		return;
	}

	var cb = new TG.API.Callback();
	var new_action = { 'api': api, 'f': fn, 'p': params, 'c': cb };
	cb.action = new_action;
	TG.API.longPolls.push(new_action);
	TG.API.poll(api);

	return cb;
}; // TG.APi.start()


TG.API.stop = function(t, i, m) {
	if (typeof(t) == 'object') {
		var to_remove = t;
		var m = m || i;
	} else {
		var to_remove = TG.API.requests[t][i];
	}

	var api = to_remove.api;

	if (m) {
		console.log(m);
	}

	var restart = false;
	if (TG.API.APIs[api] && TG.API.APIs[api].longPoll) {
		TG.API.APIs[api].longPoll.abort();

		// note to my future confused self -- this restarts the *general* poll
		// for the whole API, after removing the stop()ed fn().
		restart = true;
	}

	for (var i = 0; i < TG.API.longPolls.length; i++) {
		var p = TG.API.longPolls[i];
		if (p === to_remove) {
			delete p.c; // callback
			TG.API.longPolls.splice(i);
		}
	}

	if (restart) {
		TG.API.poll(api);
	}
}; // TG.API.stop()


TG.API.disconnect = function(api, t) {
	TG.API.jsonp(api, 'tg-api-disconnect', t);
}; // TG.API.disconnect()


TG.API.Callback = function() {

	var proxy = function(rv) {
		proxy.value.push(rv);
		doCallback();
	}; 

	setType(proxy, 'TG.API.Callback');

	proxy.returns = [];
	proxy.value = [];
	proxy.exception = null;
	proxy.chainlink = null;

	proxy.callback = function(fn) {
		proxy.chainlink = new TG.API.Callback();

		if (typeof(fn) === 'string') {
			var methodName = fn;
			var fn = function(p) {
				return p[methodName]();
			}
		}

		proxy.returns.push(fn);
		doCallback();
		return proxy.chainlink;
	};

	var doCallback = function() {
		if (proxy.value.length > 0) {
			var rv = proxy.value.shift();
			var returnToFn = proxy.returns[0];
			if (typeof(returnToFn) == 'function') {
				var rvToChain = returnToFn(rv);
				if (typeof(rvToChain) == 'function' && proxy.chainlink) {
					rvToChain.returnTo(proxy.chainlink);
				} else {
					// if a step in the chain simply returns a non-promise-like value,
					// forward the value down to the next chainlink immediately.
					proxy.chainlink(rvToChain);
				}
			}
		}
	}; // doCallback()

	proxy.stop = function() {
		if (proxy.action) {
			return TG.API.stop(proxy.action);
		}
		return null;
	};

	proxy.fail = function(e) {
		proxy.failure = e;
		if (typeof(proxy.failToFn) == 'function') {
			proxy.failToFn(e);
		}
		if (proxy.chainlink) {
			proxy.chainlink.fail(e);
		}
	};

	proxy.failTo = function(fn) {
		proxy.failToFn = fn;
		if (proxy.failure) {
			fn(proxy.failure);
		}
	};
	proxy.or = proxy.failTo;

	// callback() aliases.
	var r = ['returnTo','and'];
	for (var i = 0; i < r.length; i++) {
		proxy[r[i]] = proxy.callback;
	}


	// TODO? make .log() break the rules a little, so that it does not "consume"
	// a "step" in a returnTo() chain; but is more like an additional monitoring
	// option -- maybe introduce an additional monitor() or logTo() function?

	proxy.log = function() {
		proxy.returnTo(function(o) { console.log(o); });
	}; // log()

	proxy.logJSON = function() {
		proxy.returnTo(function(o) { console.log(TG.stringify(o)); });
	}; // logJSON()

	return proxy;

}; // TG.API.Callback()


TG.API.cb = function(t, i, rv) {
	if (TG.API.requests[t].longpoll) {
		if (rv === null || (typeof(rv.length) != 'undefined' && rv.length == 0)) {
			return;
		}
	}

	var o;
	if (rv === null) {
		o = null;
	} else if (typeof(rv) == 'object') {
		o = new rv.constructor;
	} else {
		o = rv;
	}
	TG.copy(rv, o);

	if (o && o['tg-api-error']) {
		var m = console.error || console.log;
		o.message = o['tg-api-error'];
		m(o['tg-api-error'] + "\n", o['tg-api-trace']);
		TG.API.requests[t][i].c.fail(o);
	} else {
		TG.API.requests[t][i].c(o);
	}

}; // TG.API.cb()


TG.API.alter = function(t, i, r) {
	TG.API.requests[t][i].p = r;
}; // TG.API.alter()


TG.API.requestToken = function(api) {
	var tf = document.createElement('iframe');
	tf.src = api + "?tg-tr=1";
	tf.style.display = 'none';
	document.body.appendChild(tf);
}; // TG.API.requestToken()


TG.findGlobal = function(s) {
	var parts = s.split('.');
	var rv = window;
	for (var i = 0; i < parts.length; i++) {
		var part = rv[parts[i]];
		if (part) {
			rv = part;
		} else {
			return null;
		}
	}
	return rv;
}; // TG.findGlobal()


TG.getTypeArray = function(ta_o) {
	var rv = [];
	for (var i in ta_o.__types) {
		rv.push(i);
	}
	rv.sort(function(a, b) {
		return ta_o.__types[a] > ta_o.__types[b];
	});
	return rv;
}; // TG.getTypeArray()


TG.applyTypesFrom = function(atf_source, atf_target) {
	var rv = null;

	if (
		atf_source !== null && atf_target !== null
		&& typeof(atf_target) === 'object'
		&& typeof(atf_source) === 'object'
		&& typeof(atf_source.__types) === 'object'
	) {

		var types = TG.getTypeArray(atf_source);

		for (var i = 0; i < types.length; i++) {
			var t = types[i];
			if (!isa(atf_target, t)) {
				var c = TG.findGlobal(t);
				if (typeof(c) == 'function') {
					rv = c.call(atf_target);
					if (rv) {
						atf_target = rv;
					}
				}
			}
		}
	}

	return rv;
}; // TG.applyTypesFrom()


TG.copy = function(cc_source, cc_target) {
	if (cc_source === null || typeof(cc_source) !== 'object'
		|| cc_target === null || typeof(cc_target) !== 'object'
	) {
		return;
	}

	var crv = TG.applyTypesFrom(cc_source, cc_target);

	var do_return = false;
	if (crv) {
		do_return = true;
	} else {
		crv = cc_target;
	}

	for (var i in cc_source) {
		if (i === '__types') {
			// ignore
		} else if (typeof(crv[i]) === 'function') {
			// ignore
		} else if (isa(crv[i], 'TG.Internal')) {
			// ignore
		} else if (isa(cc_source[i], Array)) {
			if (!isa(crv[i], Array)) {
				crv[i] = cc_source[i];
			}
			for (var ai = 0; ai < crv[i].length; ai++) {
				TG.copy(cc_source[i][ai], crv[i][ai]);
			}	
		} else if (typeof(cc_source[i]) === 'object') {
			if (typeof(crv[i]) !== 'object') {
				crv[i] = {};
			}
			var inner_crv = TG.copy(cc_source[i], crv[i]);
			if (inner_crv) {
				crv[i] = inner_crv;
			}
		} else if (typeof(crv[i]) !== 'object') {
			// a scalar, presumably
			crv[i] = cc_source[i];
		}
	}

	if (do_return) {
		return crv;
	}
}; // TG.copy()


TG.BaseObject = function(o) {
	for (var i in o) {
		this[i] = o[i];
	}
	setType(this, 'TG.BaseObject');
}; // TG.BaseObject


TG.Internal = function(o) {
	var _t = this;
	if (typeof(o) == 'function') {
		_t = o;
	}
	TG.BaseObject.apply(_t, arguments);
	setType(_t, 'TG.Internal');
	return _t;
}; // TG.Internal


// an object upon which server methods can be called
TG.ServerObject = function() {
	TG.BaseObject.apply(this, arguments);
	setType(this, 'TG.ServerObject');
}; // TG.ServerObject


// an object upon which CRUD ops can occur
TG.DataObject = function() {
	TG.ServerObject.apply(this, arguments);
	setType(this, 'TG.DataObject');
}; // TG.BaseObject


TG.DataObjectReference = function() {
	TG.ServerObject.apply(this, arguments);
	setType(this, 'TG.DataObjectReference');
}; // TG.DataObjectReference


TG.FunctionReference = function() {
	var rv = function() {
		var method;
		var runner = rv.isEvent ? TG.API.start : TG.API.jsonp;
		var args = TG.argumentsArray(arguments);
		for (var i in this) {
			if (this[i] === rv) {
				method = rv.target;
				break;
			}
		}
		return runner(
			rv.api,
			method,
			args
		);
	};
	setType(rv, 'TG.FunctionReference');
	return rv;
}; // TG.FunctionReference()

TG.Value = function(v) {

	var value = undefined;

	this.valueOf = function() {
		return value;
	}; // valueOf()

	this.set = function(v) {
		value = v;
		on(this, 'change').fire();
	}; // set()

	if (v) {
		this.set(v);
	}

	setType(this, 'TG.Value');

}; // TG.Value()
});

tgmodule.d('./','./tg-namespace.js',function(module){
});

tgmodule.d('./','./tg-mainloop.js',function(module){
require('tg-namespace.js');

//
// TG namespace
//

TG.MainLoop = function() {
	// for computing "utilization"
	var _S = new Date();
	var _o = TG.MainLoop.objects;
	var f = TG.MainLoop.functions;


	// remove "dead" objects
	var o = [];
	for (var i in _o) {
		if (_o[i].dead == false) {
			o.push(_o[i]);
		}
	}
	TG.MainLoop.objects = o;

	// step loop
	for (var i in o) {
		o[i].step();
	}
	
	// draw loop
	for (var i in o) {
		o[i].draw();
	}

	
	// run plugins
	for (var i in f) {
		if (typeof(f[i]) == 'function') {
			f[i]();
		}
	}


	//
	// benchmarking / utilization guesstimating.
	// this is highly inaccurate at the moment. may have to introduce
	// a multiplier to estimate CPU time used outside MainLoop ... or
	// just find a way to track CPU time outside MainLoop.
	//

	var stats = document.getElementById('__stats');
	if (stats) {
		var ml = TG.MainLoop;
		var _E1 = ml.__endLastRun;
		var _E1_t = _E1.getTime();
		var _E2 = new Date();
		var _E2_t = _E2.getTime();

		var _period = ml.__period + _E2_t - _E1_t;
		if (_S.getTime() - ml.__startLastRun.getTime() > 1000 / ml.__fps) {
			var _runtime = ml.__runtime + (_E2_t - _E1_t)/2;
		} else {
			var _runtime = ml.__runtime + (_E2_t - _S.getTime());
		}

		if (_period >= 1000) {
			var _util = _runtime / Math.max(1, _period);
			stats.innerHTML = _runtime + "/" + _period + " = " + String(Math.round(_util * 100)) + "%";
			_runtime = 0;
			_period = 0;
		}

		ml.__period = _period;
		ml.__runtime = _runtime;
		ml.__endLastRun = _E2;
		ml.__startLastRun = _S;
	}
} // TG.MainLoop()
TG.MainLoop.__fps = 30;
TG.MainLoop.__interval = null;
TG.MainLoop.__startLastRun = new Date();
TG.MainLoop.__endLastRun = new Date();
TG.MainLoop.__period = 0;
TG.MainLoop.__runtime = 0;
TG.MainLoop.objects = [];
TG.MainLoop.functions = [];

TG.MainLoop.running = function() {
	return TG.MainLoop.__interval;
} // TG.MainLoop.running()

TG.MainLoop.addFunction = function(f) {
	if (typeof(f) == 'function') {
		var m = TG.MainLoop;
		var mf = m.functions;
		for (var i in mf) {
			if (f == mf[i]) {
				return true;
			}
		}
		mf.push(f);
		m.start();
		return true;
	} else {
		return false;
	}
} // TG.MainLoop.addFunction()

TG.MainLoop.addObject = function(o) {
	if (typeof(o) == 'object'
		&& o['step'] && typeof(o['step']) == 'function'
		&& o['draw'] && typeof(o['draw']) == 'function'
	) {
		var m = TG.MainLoop;
		var mo = m.objects;
		for (var i in mo) {
			if (o == mo[i]) {
				return true;
			}
		}
		mo.push(o);
		m.start();
		return true;
	} else {
		return false;
	}
} // TG.MainLoop.addObject()

TG.MainLoop.removeFunction = function(f) {
	var mf = TG.MainLoop.functions;
	for (var i = 0; i < mf.length; i++) {
		if (mf[i] == f) {
			mf.splice(i, 1);
			return;
		}
	}
} // TG.MainLoop.removeFunction()

TG.MainLoop.removeObject = function(o) {
	var mo = TG.MainLoop.objects;
	for (var i = 0; i < mo.length; i++) {
		if (mo[i] == o) {
			mo.splice(i, 1);
			return;
		}
	}
} // TG.MainLoop.removeObject()

TG.MainLoop.start = function(fps) {
	if (!TG.MainLoop.__interval) {
		TG.MainLoop.__fps = fps || TG.MainLoop.__fps;
		TG.MainLoop.__interval = setInterval(function() { TG.MainLoop(); }, 1000 / TG.MainLoop.__fps);
	}
} // TG.MainLoop.start()

TG.MainLoop.stop = function() {
	TG.MainLoop.__interval = clearInterval(TG.MainLoop.__interval);
} // TG.MainLoop.stop()

TG.MainLoop.pause = function() {
	return TG.MainLoop.stop();
} // TG.MainLoop.pause()


var insertAfter = function(new_node, existing_node) {
	if (existing_node.nextSibling) {
		existing_node.parentNode.insertBefore(new_node, existing_node.nextSibling);
	} else {
		existing_node.parentNode.appendChild(new_node);
	}
} // insertAfter()


// process the run-queue, if there is one
if (this['__tgq']) {
	this['__tgq'].push = function (f) {
		if (typeof(f) == 'function') {
			f();
		}
	}
	for (var i in this['__tgq']) {
		if (typeof(this['__tgq'][i]) == 'function') {
			this['__tgq'][i]();
		}
	}
} else {
	this['__tgq'] = {
		push : function (f) {
			f();
		}
	}
}
});

tgmodule.setpath('.');
require('tg-upon.js');
require('tg-dom.js');
require('tg-api.js');
require('tg-mainloop.js');
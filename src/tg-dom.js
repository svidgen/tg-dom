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

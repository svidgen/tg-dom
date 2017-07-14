(function(){if(!this.tgmodule||!this.require){var k=[],a=["./"];tgmodule={start:function(a){k.push(a)},end:function(a){k[k.length-1]===a&&k.pop()},setpath:function(b){a.push("./"===b?".":b)},unsetpath:function(){a.pop()},list:function(){var a=[],c;for(c in require.cache)a.push(c);return a},d:function(a,c,d){var b={};this.setpath(a);this.start(c);a=k[k.length-1];"function"===typeof d?d(b):b.exports=d;require.cache[a]=b;this.end(c);this.unsetpath()}};require=function(a){var b=require.cache[require.resolve(a)];
if(!b)throw"`"+a+"` does not exist.";return b.exports};require.cache={};require.resolve=function(b){b=b.split(/\//);for(var c=a[a.length-1].split(/\//);".."==b[0];)b.shift(),c.pop();for(;"."==b[0];)b.shift();return c.join("/")+"/"+b.join("/")}}})();tgmodule.d("./","./tg-upon.js",function(k){upon=function(a,b){"function"==typeof a&&a()?b():"string"==typeof a&&window[a]?b():setTimeout(function(){upon(a,b)},50)}});
tgmodule.d("./","./tg-namespace.js",function(k){TG=this.TG||{};TG.API=TG.API||{};TG.Data=TG.Data||{};TG.UI=TG.UI||{}});tgmodule.d("./","./tg-upon.js",function(k){});
tgmodule.d("./","./tg-dom.js",function(k){require("tg-namespace.js");require("tg-upon.js");this.console=this.console||{log_items:[],log:function(){for(var a=0;a<arguments.length;a++)this.log_items.push(arguments[a])}};this.Element=this.Element||function(){return!0};this.Node=this.window.Node||this.Element;this.getTypeId=function(a){var b=a;"function"==typeof a&&(b=Bind.getBindings(a),b=0<b.length?b[0]:a.name||a.toString());return b};this.setType=function(a,b){a.__types=a.__types||{};var c=this.getTypeId(b);
if(c&&null==a.__types[c]){var d=0,e;for(e in a.__types)d=Math.max(d,a.__types[e]);a.__types[c]=d+1}};this.registerType=setType;this.isa=function(a,b){var c=typeof a,d=typeof b;if("string"===c)return b===String;if("number"===c)return b===Number;if(void 0===a||null===a)return d===c;if("boolean"===c)return c==d;if("string"===d||"function"===d)if(a.__types=a.__types||{},b&&a.__types[this.getTypeId(b)])return!0;return b===Element||b===Node||b===NodeList||"function"===d?a instanceof b:a===b};TG.Event=function(a,
b,c){this.target=b;this.action=c;this.subscribers=[];this.interceptors=[];this.fired=0;this.singleFire=a||!1;this.args=[];this.and=this.then=this.register=function(a){this.singleFire&&0<this.fired?a():this.subscribers.push(a);return this};this.fire=function(a,b,c){this.args=arguments;this.fireWithInterception();return this};this.fireOnce=function(a,b,c){this.singleFire=!0;return this.fire.apply(this,arguments)};this.fireWithInterception=function(a){a=a||0;if("function"==typeof this.interceptors[a]){var b=
this;this.interceptors[a]({arguments:b.args,resume:function(){b.fireWithInterception(a+1)}})}else{this.fired+=1;for(var c=[];0<this.subscribers.length;){var d=this.subscribers.pop();d.apply(null,this.args);c.push(d)}this.singleFire||(this.subscribers=c)}};this.intercept=function(a){"function"===typeof a&&this.interceptors.push(a)};setType(this,"TG.Event")};TG.Event.events=[];TG.Event.events.getWaiting=function(){return TG.Event.events.filter(function(a){return 0==a.fired})};TG.Event.registries=[];
TG.Event.registries.getWaiting=function(){return TG.Event.registries.filter(function(a){return a.fired<a.count})};this.on=function(a,b,c,d){var e="__TGEvent_on"+b;d=d||!1;if(isa(a,Array)||isa(a,NodeList)){for(var f=[],g=0;g<a.length;g++)!isa(a[g],Object)||!isa(a[g],Element)&&isa(a[g],Node)||f.push(a[g]);var h={count:f.length,fired:0,fn:c,singleFire:d,fire:function(){this.fired++;this.fired>=this.count&&c()},objects:f,eventName:e};if(0<f.length)for(g=0;g<f.length;g++)on(f[g],b,function(){h.fire()},
d);else h.fire();TG.Event.registries.push(h);return h}if("undefined"===typeof a[e])a[e]=new TG.Event(d,a,e);else if(!isa(a[e],"TG.Event"))throw e+" already exists as a non-TG.Event on the target object.";"function"==typeof c&&a[e].register(c);return a[e]};this.onready=function(a,b){return on(a,"ready",b,!0)};TG.StringSet=function(a){var b={};this.add=function(a){if(a instanceof Array)for(var c=0;c<a.length;c++)this.add(a[c]);else b[a]=!0};this.remove=function(a){delete b[a]};this.toArray=function(){var a=
[],d;for(d in b)a.push(d);return a};a&&this.add(a)};TG.getClassnames=function(a){return(new TG.StringSet(a.className.split(/\s+/))).toArray()};TG.addClassname=function(a,b){var c=new TG.StringSet(a.className.split(/\s+/));c.add(b);a.className=c.toArray().join(" ")};TG.removeClassname=function(a,b){var c=new TG.StringSet(a.className.split(/\s+/));c.remove(b);a.className=c.toArray().join(" ")};this.currentStyle=function(a,b){return a.currentStyle?a.currentStyle[b]:document.defaultView.getComputedStyle(a,
"")[b]};TG.CopyStyle=function(a,b,c){if(c instanceof Array)for(var d=0;d<c.length;d++)b.style[c[d]]=currentStyle(a,c[d]);else for(d in a.style)b.style[d]=c?currentStyle(a,d):a.style[d];a=TG.getClassnames(a);for(d=0;d<a.length;d++)TG.addClassname(b,a[d])};this.Bind||(this.DomClass=function(a,b){b=b||function(){};b.template=a;Bind(b);var c=function(a){return New(b,a)};c.apply=function(a,c){return b.apply(a,c)};c.call=function(){var a=Array.prototype.shift.apply(arguments);return b.call(a,arguments)};
c.__constructor=b;return c},this.Bind=function(a,b,c){if("function"==typeof a)return b=Bind.addBinding(a,b),a.binding=b,b=getNodes(isa(c,Node)?c:document,b),Bind.Apply(a,b),b.length;isa(a,Node)&&Bind.BindExistingConstructors(a)},Bind.BindExistingConstructors=function(a,b){var c=[],d=b&&b.dependencies||Bind.Classes,e;for(e in d)0<Bind(Bind.Classes[e],e,a)&&(c[e]=1);b&&!b.dependencies?b.dependencies=c:null},Bind.Apply=function(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.__AlreadyBound||(Bind.importParameters(d),
Bind.ApplyClone(a,d),Bind.ApplyConstructor(a,d),d.__AlreadyBound=!0)}},Bind.ApplyTemplate=function(a,b){var c=a.template||a.markup||a.templateMarkup;c&&(b.innerHTML=c)},Bind.ApplyClone=function(a,b){for(;b.firstChild;)b.removeChild(b.firstChild);var c=Bind.getClone(a);0==c.childNodes.length&&(c=b.__holdingDiv);for(;c.firstChild;)b.appendChild(c.removeChild(c.firstChild))},Bind.ApplyConstructor=function(a,b){Bind.BindExistingConstructors(b,a);setType(b,a);Bind.attachIdentifiedChildren(b);Bind.applyParameters(b);
a.apply(b)},Bind.applyProperties=function(a,b){var c="object"==typeof b?b:{},d;for(d in c)c.hasOwnProperty(d)&&(a[d]=c[d])},Bind.originalCreateElement=document.createElement,Bind.createNode=function(a,b){b=b||a.binding;var c=Bind.originalCreateElement.call(document,"div");0==b.indexOf(":")&&(b=b.substr(1));if(0==b.indexOf(".")){var d=b.substr(1);b="tg:element"}c.innerHTML="<"+b+"></"+b+">";c=c.firstChild;c.className=d||"";return c},Bind.Classes={},document.createElement=function(a,b){var c=Bind.getConstructor(a);
if(c){var d=Bind.getClone(c);Bind.applyProperties(d,b);Bind.ApplyConstructor(c,d);d.__AlreadyBound=!0}else d=Bind.originalCreateElement.call(this,a),Bind.applyProperties(d,b);return d},Bind.getClone=function(a){a.templateNode||(a.templateNode=Bind.createNode(a),Bind.ApplyTemplate(a,a.templateNode));return a.templateNode.cloneNode(!0)},Bind.addBinding=function(a,b){b||(b=Bind.bindingQueryFromConstructor(a));Bind.Classes[b]=a;return b},Bind.bindingQueryFromConstructor=function(a){var b=document.createElement("div");
b.innerHTML=a.template||a.markup||a.templateMarkup;for(var c=0;c<b.childNodes.length;c++){var d=Bind.bindingQueryFromNode(b.childNodes[c]);a.template=b.childNodes[c].innerHTML;if(d)return d}throw"Could not bind "+a;},Bind.bindingQueryFromNode=function(a){return a.tagName?!a.className||a.tagName.match(/\:/)?a.tagName.toLowerCase():a.className:null},Bind.getConstructor=function(a){return Bind.Classes[a]},Bind.getBindings=function(a){var b=[],c;for(c in Bind.Classes)Bind.Classes[c]!==a&&Bind.Classes[c]!==
a.__constructor||b.push(c);return b},Bind.makeNodeFrom=function(a,b){if(isa(a,Node)||isa(a,Element))return a;if(isa(a,Array)){var c=document.createElement("div");Bind.addArrayAsChildren(c,a);return c}if("object"!=typeof a)return c=document.createElement("div"),c.innerHTML=a,c;c=null;b&&(c=Bind.getConstructor(b));if("object"==typeof a.__types)for(var d=TG.getTypeArray(a),e=0;e<d.length;e++)c=Bind.getConstructor(d[e]);if(c)return New(c,a);c=document.createElement("div");c.innerHTML=a;return c},Bind.addArrayAsChildren=
function(a,b,c){for(;a.firstChild;)a.removeChild(a.firstChild);for(var d=0;d<b.length;d++)b[d]=Bind.makeNodeFrom(b[d],c),b[d].parentNode&&b[d].parentNode.removeChild(b[d]),a.appendChild(b[d])},Bind.childNodeArray=function(a){var b=[];b.events={};var c=a["data-collection"]||a.getAttribute("data-collection");b.render=function(){Bind.addArrayAsChildren(a,b)};b.loadFromDOM=function(){var c=[],c=(c=a["data-collection"]||a.getAttribute("data-collection"))?getNodes(a,c):Array.prototype.slice.call(a.childNodes);
b.length=0;c.forEach(function(a){b.push(a)})};b.push=function(d){d=Bind.makeNodeFrom(d,c);a.appendChild(d);return Array.prototype.push.call(b,d)};b.pop=function(){a.removeChild(n);return Array.prototype.pop.apply(b)};b.shift=function(){a.removeChild(n);return Array.prototype.shift.apply(b)};b.unshift=function(d){d=Bind.makeNodeFrom(d,c);a.insertBefore(d,a.firstChild);return Array.prototype.unshift.call(b,d)};b.splice=function(){for(var c=Array.prototype.slice.call(arguments,0),d=c.shift(),e=c.shift()||
b.length,c=c||[],l=d;l<d+e;l++)a.removeChild(b[l]);var k=b[l];c.forEach(function(b){a.insertBefore(b,k)});return Array.prototype.splice.apply(b,arguments)};for(var d=["reverse","sort"],e=0;e<d.length;e++)(function(){var a=d[e];b[a]=function(){var c=Array.prototype[a].apply(b,arguments);b.render();return c}})();b.loadFromDOM();return b},Bind.defineAccessors=function(a,b,c){var d=Object.getOwnPropertyDescriptor(b,c);if(!(d&&0==d.configurable||a.__accessorDefined)){Object.defineProperty(a,"__accessorDefined",
{get:function(){return!0},enumerable:!1});var e="innerHTML";"string"==typeof a.value&&(e="value");var f=a.getAttribute("data-property"),g=f,h=Bind.childNodeArray(a);b.__dom=b.__dom||{};b.__dom[c]=a;Object.defineProperty(b,"__dom",{enumerable:!1});d=!0;if(a["data-ignore"]||a.getAttribute("data-ignore"))d=!1;Object.defineProperty(b,c,{get:function(){return"children"==f||"children"==g||a["data-collection"]||a.getAttribute("data-collection")?h:f?a[f]:g?a[g]:a},set:function(b){var c=function(b){if(isa(b,
Array))Bind.addArrayAsChildren(a,b),g="children";else if(f)a[f]=b,g=f;else if(isa(b,Node))a.parentNode&&a.parentNode.replaceChild(b,a),a=b,g=null;else if(isa(b,Object)){for(var c in b)a[c]=b[c];g=null}else a[e]=b,g=e};isa(b,"TG.Value")&&on(b,"change",function(){c(b.valueOf())});c(b.valueOf());h.loadFromDOM()},enumerable:d,configurable:!1})}},Bind.attachIdentifiedChildren=function(a,b){for(var c=(b||a).querySelectorAll("[data-id]"),c=Array.prototype.slice.call(c,0),d=0;d<c.length;d++){var e=c[d].getAttribute("data-id"),
f=a[e];Bind.defineAccessors(c[d],a,e);f&&(a[e]=f)}},Bind.importAttributes=function(a,b){b=b||a;if(!a.__attributes_imported&&b.attributes&&b.attributes.length)for(var c=0;c<b.attributes.length;c++){var d=b.attributes[c];a[d.name]||(a[d.name]=d.value)}a.__attributes_imported=!0},Bind.importParameters=function(a,b){b=b||a;if(!a.__parameters_imported&&b.childNodes){a.parameters=[];for(var c=0;c<b.childNodes.length;c++){var d=b.childNodes[c];if(d.nodeType&&3==d.nodeType&&d.data&&d.data.replace(/\s/g,"")){var e=
document.createElement("span");e.innerHTML=d.data;d=e}else Bind.importAttributes(d);a.parameters.push(d)}a.__holdingDiv=document.createElement("div");a.__holdingDiv.style.display="none";document.body.appendChild(a.__holdingDiv);for(c=0;c<a.parameters.length;c++)a.__holdingDiv.appendChild(a.parameters[c]);Bind(a.__holdingDiv)}a.__parameters_imported=!0},Bind.applyParameters=function(a){if(a.parameters&&isa(a.parameters,Array)){for(var b=a.parameters,c=b.length-1;0<=c;c--){var d=b[c]["data-id"];d&&
(a[d]=b[c])}a.__holdingDiv.parentNode.removeChild(a.__holdingDiv);delete a.__holdingDiv}},Bind.getChildren=function(a,b){if(!a.childNodes)return[];for(var c=[],d=getNodes(a,b),e=0;e<d.length;e++)d[e].parentNode===a&&c.push(d[e]);return c},Bind.Box=function(a,b,c,d,e,f,g,h){this.x=a||0;this.y=b||0;this.width=c||0;this.height=d||0;this.marginTop=e||0;this.marginRight=f||0;this.marginBottom=g||0;this.marginLeft=h||0;this.contains=function(a,b){var c=this.y-Math.ceil(this.marginTop/2),d=this.x+this.width-
Math.ceil(this.marginRight/2),e=this.y+this.height-Math.ceil(this.marginBottom/2);return a>=this.x-Math.ceil(this.marginLeft/2)&&a<=d&&b>=c&&b<=e?!0:!1};this.getBottom=function(){return this.y+this.height};this.getRight=function(){return this.x+this.width};this.rangeOverlaps=function(a,b,c,d){return a<=d&&c<=b};this.xOverlaps=function(a){return this.rangeOverlaps(this.x,this.getRight(),a.x,a.getRight())};this.yOverlaps=function(a){return this.rangeOverlaps(this.y,this.getBottom(),a.y,a.getBottom())};
this.overlaps=function(a){return this.xOverlaps(a)&&this.yOverlaps(a)}},Bind.NodeBox=function(a){this.x=a.offsetLeft;this.y=a.offsetTop;for(var b=a;b=b.offsetParent;)this.x+=b.offsetLeft,this.y+=b.offsetTop;this.left=this.x;this.top=this.y;this.width=a.offsetWidth;this.height=a.offsetHeight;this.right=this.x+this.width;this.bottom=this.x+this.height;this.marginLeft=parseInt("".replace(/[^0-9]/g,"")||"0");this.marginRight=parseInt("".replace(/[^0-9]/g,"")||"0");this.marginTop=parseInt("".replace(/[^0-9]/g,
"")||"0");this.marginBottom=parseInt("".replace(/[^0-9]/g,"")||"0")},Bind.NodeBox.prototype=new Bind.Box,TG.MouseCoords=function(a){a=a||window.event;if(a.changedTouches)this.x=a.changedTouches[0].pageX,this.y=a.changedTouches[0].pageY;else if(a.pageX||a.pageY)this.x=a.pageX,this.y=a.pageY;else if(a.clientX||a.clientY)this.x=a.clientX+document.body.scrollLeft,this.y=a.clientY+document.body.scrollTop},window.getNodes=window.getNodes||function(a,b){if("function"==typeof b){var c=[];for(var d=Bind.getBindings(b),
e=0;e<d.length;e++)for(var f=getNodes(a,d[e]),g=0;g<f.length;g++)c.push(f[g]);return c}b=b.replace(/:/g,"\\:");c=a.querySelectorAll(b);for(e=0;e<c.length;e++)Bind.importAttributes(c[e]);return Array.prototype.slice.call(c,0)});this.Build=function(a,b){var c=b||{},d=null,e;for(e in Bind.Classes)if(Bind.Classes[e]===a){d=document.createElement(e,c);break}null===d&&(d=b,a.apply(d));return d};this.New=Build;console.log("Loaded Bind.");upon(function(){return document.body},function(){this._bindq=window._bindq||
{};this._bindq.push=function(a,c){Bind(a,c)};if(this._bindq instanceof Array)for(var a=0;a<this._bindq.length;a+=2)Bind(this._bindq[a],this._bindq[a+1])})});tgmodule.d("./","./tg-namespace.js",function(k){});tgmodule.d("./","./tg-upon.js",function(k){});
tgmodule.d("./","./tg-api.js",function(k){require("tg-namespace.js");require("tg-upon.js");TG.API.longPolls=TG.API.longPolls||[];TG.API.requests=TG.API.requests||{};TG.API.APIs=TG.API.APIs||[];TG.addSlashes=function(a){a=String(a);a=a.replace(/\\/g,"\\\\");a=a.replace(/\"/g,'\\"');return a=a.replace(/\'/g,"\\'")};TG.jsonEscape=function(a){a=String(a);a=a.replace(/\\/g,"\\\\");a=a.replace(/\"/g,'\\"');a=a.replace(/\//g,"\\/");a=a.replace(/[\b]/g,"\\b");a=a.replace(/\f/g,"\\f");a=a.replace(/\n/g,"\\n");
a=a.replace(/\r/g,"\\r");a=a.replace(/\t/g,"\\t");return a=a.replace(/[^\u0020-\u007d]/g,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})};TG.jsonAddSlashes=function(a){return TG.jsonEscape(a)};TG.stringify=function(a,b,c,d){b="number"==typeof b?b:128;if(!(1>b)){var e=c||Math.random();if(a&&a.__stringify_instance&&a.__stringify_instance==e)delete a.__stringify_instance;else{a&&(a.__stringify_instance=e);if("undefined"===typeof a)d=void 0;else if(null===a)d="null";else if(a instanceof
Array){var f=[];for(var g=0;g<a.length;g++)c=TG.stringify(a[g],b-1,e,d),null!==c&&f.push(c);d="["+f.join(",")+"]"}else if("boolean"===typeof a)d=a?"true":"false";else if(d&&c&&isa(a,"TG.DataObject"))d=TG.stringify(new TG.DataObjectReference(a),b-1,e,!1);else if("object"===typeof a){f=[];for(g in a)if(!{__stringify_instance:1,__parameters_imported:1,__attributes_imported:1,__AlreadyBound:1}[g]&&a.hasOwnProperty(g)&&!g.match(/__TG/)){c=TG.stringify(a[g],b-1,e,d);var h=TG.stringify(g,b-1,e,d);h&&"string"==
typeof c&&f.push(h+":"+c)}d="{"+f.join(",")+"}"}else d="number"===typeof a?String(a):"function"===typeof a?void 0:'"'+TG.jsonEscape(a)+'"';a&&a.__stringify_instance&&delete a.__stringify_instance;return d}}};TG.argumentsArray=function(a){for(var b=[],c=0;c<a.length;c++)b.push(a[c]);return b};TG.API.multijsonp=function(a,b,c){TG.API.APIs[a]||(TG.API.APIs[a]={});upon(function(){return TG.API.poll},function(){var d=Math.floor(1E5+1E5*Math.random()),e=(new Date).getTime().toString(36)+d.toString(36);
TG.API.requests[e]=b;TG.API.requests[e].longpoll=c;var d=encodeURIComponent(TG.stringify(b)),d=c?"tg-t="+e+"&tg-w="+d:"tg-t="+e+"&tg-a="+d,f=window.MockXMLHttpRequest||window.XMLHttpRequest||null,g=f?new f:new ActiveXObject("Microsoft.XMLHTTP");g.open("post",a,!0);g.setRequestHeader("Content-type","application/x-www-form-urlencoded");g.onreadystatechange=function(){4==g.readyState&&(200==g.status?eval(g.responseText):console.log("TG.mulijsonp() Error or Abort",g),delete TG.API.requests[e],c&&(delete TG.API.APIs[a].longPoll,
0==g.status||""==g.responseText?TG.API.disconnect(a,e):TG.API.poll(a)))};g.send(d);c&&(TG.API.APIs[a].longPoll=g)})};TG.API.jsonp=function(a,b,c){var d=new TG.API.Callback;c instanceof Array||(c=[c]);c={f:b,p:c,c:d};var e=TG.API.jsonp;e.pending=e.pending||{};var f=e.buffer;f[a]=f[a]||[];f[a].push(c);b.match(/^tg-api/)?TG.API.multijsonp(a,f[a]):"undefined"==typeof e.pending[a]&&(e.pending[a]=setTimeout(function(){TG.API.multijsonp(a,f[a]);f[a]=[];delete e.pending[a]},15));return d};TG.API.jsonp.buffer=
{};TG.API.getPolls=function(a,b,c){for(var d=[],e=0;e<TG.API.longPolls.length;e++){var f=TG.API.longPolls[e];(f.api==a&&null==b||f.f==b&&null==c||f.p==c)&&d.push(f)}return d};TG.API.poll=function(a){var b=TG.API.poll;b.pending=b.pending||{};"undefined"==typeof b.pending[a]&&(b.pending[a]=setTimeout(function(){TG.API.APIs[a]&&TG.API.APIs[a].longPoll&&TG.API.APIs[a].longPoll.abort();var c=TG.API.getPolls(a);0!=c.length&&(TG.API.multijsonp(a,c,!0),delete b.pending[a])},50))};TG.API.restartPolls=function(){var a=
TG.API;if(a.APIs)for(var b=0;b<a.APIs.length;b++){var c=TG.API.APIs[b];a[c]&&void 0===a[c].longPoll?0<TG.API.getPolls(c).length&&(a[c].longPollBroken?(console.log("Connection to "+c+" is broken. Retrying ..."),TG.API.poll(c)):a[c].longPollBroken=!0):a[c]&&(a[c].longPollBroken=!1)}};TG.API.poll.monitor=setInterval(TG.API.restartPolls,5E3);TG.API.start=function(a,b,c){if(!(0<TG.API.getPolls(a,b,c).length)){var d=new TG.API.Callback;b={api:a,f:b,p:c,c:d};d.action=b;TG.API.longPolls.push(b);TG.API.poll(a);
return d}};TG.API.stop=function(a,b,c){"object"==typeof a?c=c||b:a=TG.API.requests[a][b];var d=a.api;c&&console.log(c);c=!1;TG.API.APIs[d]&&TG.API.APIs[d].longPoll&&(TG.API.APIs[d].longPoll.abort(),c=!0);for(b=0;b<TG.API.longPolls.length;b++){var e=TG.API.longPolls[b];e===a&&(delete e.c,TG.API.longPolls.splice(b))}c&&TG.API.poll(d)};TG.API.disconnect=function(a,b){TG.API.jsonp(a,"tg-api-disconnect",b)};TG.API.Callback=function(){var a=function(c){a.value.push(c);b()};setType(a,"TG.API.Callback");
a.returns=[];a.value=[];a.exception=null;a.chainlink=null;a.callback=function(c){a.chainlink=new TG.API.Callback;if("string"===typeof c){var d=c;c=function(a){return a[d]()}}a.returns.push(c);b();return a.chainlink};var b=function(){if(0<a.value.length){var b=a.value.shift(),c=a.returns[0];"function"==typeof c&&(b=c(b),"function"==typeof b&&a.chainlink?b.returnTo(a.chainlink):a.chainlink(b))}};a.stop=function(){return a.action?TG.API.stop(a.action):null};a.fail=function(b){a.failure=b;"function"==
typeof a.failToFn&&a.failToFn(b);a.chainlink&&a.chainlink.fail(b)};a.failTo=function(b){a.failToFn=b;a.failure&&b(a.failure)};a.or=a.failTo;for(var c=["returnTo","and"],d=0;d<c.length;d++)a[c[d]]=a.callback;a.log=function(){a.returnTo(function(a){console.log(a)})};a.logJSON=function(){a.returnTo(function(a){console.log(TG.stringify(a))})};return a};TG.API.cb=function(a,b,c){if(!TG.API.requests[a].longpoll||null!==c&&("undefined"==typeof c.length||0!=c.length)){var d=null===c?null:"object"==typeof c?
new c.constructor:c;TG.copy(c,d);d&&d["tg-api-error"]?(c=console.error||console.log,d.message=d["tg-api-error"],c(d["tg-api-error"]+"\n",d["tg-api-trace"]),TG.API.requests[a][b].c.fail(d)):TG.API.requests[a][b].c(d)}};TG.API.alter=function(a,b,c){TG.API.requests[a][b].p=c};TG.API.requestToken=function(a){var b=document.createElement("iframe");b.src=a+"?tg-tr=1";b.style.display="none";document.body.appendChild(b)};TG.findGlobal=function(a){a=a.split(".");for(var b=window,c=0;c<a.length;c++)if(b=b[a[c]],
!b)return null;return b};TG.getTypeArray=function(a){var b=[],c;for(c in a.__types)b.push(c);b.sort(function(b,c){return a.__types[b]>a.__types[c]});return b};TG.applyTypesFrom=function(a,b){var c=null;if(null!==a&&null!==b&&"object"===typeof b&&"object"===typeof a&&"object"===typeof a.__types)for(var d=TG.getTypeArray(a),e=0;e<d.length;e++){var f=d[e];isa(b,f)||(f=TG.findGlobal(f),"function"==typeof f&&(c=f.call(b))&&(b=c))}return c};TG.copy=function(a,b){if(null!==a&&"object"===typeof a&&null!==
b&&"object"===typeof b){var c=TG.applyTypesFrom(a,b),d=!1;c?d=!0:c=b;for(var e in a)if("__types"!==e&&"function"!==typeof c[e]&&!isa(c[e],"TG.Internal"))if(isa(a[e],Array)){isa(c[e],Array)||(c[e]=a[e]);for(var f=0;f<c[e].length;f++)TG.copy(a[e][f],c[e][f])}else"object"===typeof a[e]?("object"!==typeof c[e]&&(c[e]={}),(f=TG.copy(a[e],c[e]))&&(c[e]=f)):"object"!==typeof c[e]&&(c[e]=a[e]);if(d)return c}};TG.BaseObject=function(a){for(var b in a)this[b]=a[b];setType(this,"TG.BaseObject")};TG.Internal=
function(a){var b=this;"function"==typeof a&&(b=a);TG.BaseObject.apply(b,arguments);setType(b,"TG.Internal");return b};TG.ServerObject=function(){TG.BaseObject.apply(this,arguments);setType(this,"TG.ServerObject")};TG.DataObject=function(){TG.ServerObject.apply(this,arguments);setType(this,"TG.DataObject")};TG.DataObjectReference=function(){TG.ServerObject.apply(this,arguments);setType(this,"TG.DataObjectReference")};TG.FunctionReference=function(){var a=function(){var b=a.isEvent?TG.API.start:TG.API.jsonp,
c=TG.argumentsArray(arguments),d;for(d in this)if(this[d]===a){var e=a.target;break}return b(a.api,e,c)};setType(a,"TG.FunctionReference");return a};TG.Value=function(a){var b=void 0;this.valueOf=function(){return b};this.set=function(a){b=a;on(this,"change").fire()};a&&this.set(a);setType(this,"TG.Value")}});tgmodule.d("./","./tg-namespace.js",function(k){});
tgmodule.d("./","./tg-mainloop.js",function(k){require("tg-namespace.js");TG.MainLoop=function(){var a=new Date,c=TG.MainLoop.objects,d=TG.MainLoop.functions,e=[];for(h in c)0==c[h].dead&&e.push(c[h]);TG.MainLoop.objects=e;for(h in e)e[h].step();for(h in e)e[h].draw();for(h in d)if("function"==typeof d[h])d[h]();if(c=document.getElementById("__stats")){d=TG.MainLoop;var f=d.__endLastRun.getTime();var e=new Date,g=e.getTime();var h=d.__period+g-f;f=a.getTime()-d.__startLastRun.getTime()>1E3/d.__fps?
d.__runtime+(g-f)/2:d.__runtime+(g-a.getTime());1E3<=h&&(c.innerHTML=f+"/"+h+" = "+String(Math.round(f/Math.max(1,h)*100))+"%",h=f=0);d.__period=h;d.__runtime=f;d.__endLastRun=e;d.__startLastRun=a}};TG.MainLoop.__fps=30;TG.MainLoop.__interval=null;TG.MainLoop.__startLastRun=new Date;TG.MainLoop.__endLastRun=new Date;TG.MainLoop.__period=0;TG.MainLoop.__runtime=0;TG.MainLoop.objects=[];TG.MainLoop.functions=[];TG.MainLoop.running=function(){return TG.MainLoop.__interval};TG.MainLoop.addFunction=function(a){if("function"==
typeof a){var b=TG.MainLoop,d=b.functions,e;for(e in d)if(a==d[e])return!0;d.push(a);b.start();return!0}return!1};TG.MainLoop.addObject=function(a){if("object"==typeof a&&a.step&&"function"==typeof a.step&&a.draw&&"function"==typeof a.draw){var b=TG.MainLoop,d=b.objects,e;for(e in d)if(a==d[e])return!0;d.push(a);b.start();return!0}return!1};TG.MainLoop.removeFunction=function(a){for(var b=TG.MainLoop.functions,d=0;d<b.length;d++)if(b[d]==a){b.splice(d,1);break}};TG.MainLoop.removeObject=function(a){for(var b=
TG.MainLoop.objects,d=0;d<b.length;d++)if(b[d]==a){b.splice(d,1);break}};TG.MainLoop.start=function(a){TG.MainLoop.__interval||(TG.MainLoop.__fps=a||TG.MainLoop.__fps,TG.MainLoop.__interval=setInterval(function(){TG.MainLoop()},1E3/TG.MainLoop.__fps))};TG.MainLoop.stop=function(){TG.MainLoop.__interval=clearInterval(TG.MainLoop.__interval)};TG.MainLoop.pause=function(){return TG.MainLoop.stop()};if(this.__tgq){this.__tgq.push=function(a){"function"==typeof a&&a()};for(var a in this.__tgq)if("function"==
typeof this.__tgq[a])this.__tgq[a]()}else this.__tgq={push:function(a){a()}}});tgmodule.setpath(".");require("tg-upon.js");require("tg-dom.js");require("tg-api.js");require("tg-mainloop.js");
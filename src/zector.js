/*!
 * Zector Javascript Micro Library v0.1.0
 *
 * Copyright DekusDenial
 * Released under the MIT license
 * https://github.com/dekusdenial/zector
 */

/**
 * requestAnimationFrame polyfill by Paul Irish
 */

(function() {
  var lastTime, vendors, x;

  lastTime = 0;
  vendors = ["ms", "moz", "webkit", "o"];
  x = 0;
  while (x < vendors.length && !window.requestAnimationFrame) {
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
    window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
    ++x;
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime, id, timeToCall;

      currTime = new Date().getTime();
      timeToCall = Math.max(0, 16 - (currTime - lastTime));
      id = window.setTimeout(function() {
        return callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    return window.cancelAnimationFrame = function(id) {
      return clearTimeout(id);
    };
  }
})();

;(function (window, document, undefined) {
  'use strict';
  
  var ID_TAG_CLASS_REGEXP_BASIC = /^(?:\w*#([\w-]+)|(\w+)|\w*\.([\w-]+))$/;
  var ID_TAG_CLASS_REGEXP_ADVANCED = /^(?:\w*#([\w]+)|(\w+)|\w*\.([\w-]+))?(?:\[(.*)\])?\s*(.*)$/;
  var SPACES_REGEXP = /\s+/;
  var _splice = Array.prototype.splice,
      _slice = Array.prototype.slice,
      _forEach = function(cb){
        if (this === window || this == null) return false;
        if (!typeof cb === 'function') {
          throw TypeError(arguments[0] + ' is not a function');
        }

        var l = this.length, i = -1, _this = arguments[1] || this;

        if (l !== undefined && this.splice) {
          if (!l) return false;
          while(++i < l) {
            if (cb.call(_this, this[i], i, this) === false) return true;
          }
        } else if (typeof this === 'object') {
          for (var i in this) {
            if (cb.call(_this, this[i], i, this) === false) return true;
          }
        }
      },
      _indexOf = Array.prototype.indexOf || function(target) {
        var l = this.length;
        while (--l >= 0) {
          if (this[l] === target) return l;
        }
        return -1;
      },
      _isEmpty = function(o) {
        if (o === null) return true;

        // lazy check for array like object, could be anything with a length property
        if (o.length !== undefined) return o.length === 0;
        for (var i in o) if (o.hasOwnProperty(i)) return false;
        return true;
      },
      _toCamelCase = function(s) {
        s = s.replace(/\-(.)/g, function(match, $1){ return $1.toUpperCase(); });
        return s[0].toLowerCase() + s.slice(1);
      };
  var match, id, tag, className, queryString;
  var count = 0, delegatedLevelCount = 0;
  var DOC_REF = document.documentElement || document.body;
  var prefixer = function(props, fromStyle){
    var propObj = fromStyle ? DOC_REF.style : DOC_REF;
    for (var i = 0, l = props.length; i < l; i++) {
      if (props[i] in propObj) {
        return props[i];
      }
    }
  };

  var matchesSelector = prefixer(['matchesSelector', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector', 'matches']);

  function changeClasses(el, classesToAdd, classesToRemove) {
    var className, _i, _j, _len, _len1, _results;
    if (!el) {
      return false;
    }

    if (typeof classesToAdd === 'string') classesToAdd = [classesToAdd];
    if (typeof classesToRemove === 'string') classesToRemove = [classesToRemove];

    if (classesToRemove && classesToRemove.length) {
      for (_i = 0, _len = classesToRemove.length; _i < _len; _i++) {
        className = classesToRemove[_i];
        el.classList.remove(className);
      }
    }
    if (classesToAdd && classesToAdd.length) {
      _results = [];
      for (_j = 0, _len1 = classesToAdd.length; _j < _len1; _j++) {
        className = classesToAdd[_j];
        _results.push(el.classList.add(className));
      }
      // return _results;
    }
  };

  function addEvent(el, types, handler, usedCapture, selector) {
    types = types.split(SPACES_REGEXP);
    var id = el._Z = el._Z || zector.generateID();
    zector.events[id] = zector.events[id] || {};

    _forEach.call(types, function(type){
      usedCapture = type === 'blur' || type === 'focus' || usedCapture;

      var eventHandler = zector.handlers[id] = zector.handlers[id] || function (e) {
        return dispatch.call(el, new zector.Event(e));
      }

      zector.events[id][type] || (zector.events[id][type] = {});

      if (selector) {
        zector.events[id][type].delegatedHandlers || (zector.events[id][type].delegatedHandlers = {});
        var delegatedHandlerObj = zector.events[id][type].delegatedHandlers[selector] || (zector.events[id][type].delegatedHandlers[selector] = {});
        (delegatedHandlerObj.handlers || (delegatedHandlerObj.handlers = [])).push(handler);
      } else {
        zector.events[id][type].handlers || (zector.events[id][type].handlers = []);
        zector.events[id][type].handlers.push(handler);
      }
      
      // eventHandler.el = el;
      el.addEventListener(type, eventHandler, usedCapture);
    });
  }

  function removeEvent(el, types, handler, selector) {
    var id = el._Z;
    if (!id) return false;

    var eventsObj = zector.events[id];

    if (!eventsObj) return;

    types && (types = types.split(SPACES_REGEXP));

    var proxyHandler = zector.handlers[id];

    var isDelegated = selector && typeof selector === 'string';
    // var handlerProp = isDelegated ? 'delegatedHandlers' : 'handlers';
    var queue = [];

    if (!handler) {
      if (isDelegated) {
        // if removing delegated events based on a selector
        _forEach.call(types || Object.keys(eventsObj), function(type){
          if (eventsObj[type]  && eventsObj[type].delegatedHandlers && eventsObj[type].delegatedHandlers[selector]) {

            delete eventsObj[type].delegatedHandlers[selector];
            _isEmpty(eventsObj[type].delegatedHandlers) && delete eventsObj[type].delegatedHandlers;
            if (!eventsObj[type].handlers || !eventsObj[type].handlers.length) {
              el.removeEventListener(type, proxyHandler);
              delete eventsObj[type];
            }
          }
        });

      } else {
        // loop thru all the binded events
        _forEach.call(types || Object.keys(eventsObj), function(type){
          if (eventsObj[type]) {
            el.removeEventListener(type, proxyHandler);
            delete eventsObj[type];
          }
        });
      }

      _isEmpty(eventsObj) && delete zector.events[id];

    } else {
      if (isDelegated) {
        _forEach.call(types, function(type){
          if (eventsObj[type]  && eventsObj[type].delegatedHandlers && eventsObj[type].delegatedHandlers[selector]) {
            _forEach.call(eventsObj[type].delegatedHandlers[selector].handlers, function(_handler, i){
              if (_handler === handler) {
                queue.unshift(function(){
                  eventsObj[type].delegatedHandlers.splice(i, 1);
                });
              }
            });

            _forEach.call(queue, function(f){ f(); });

            if (!eventsObj[type].delegatedHandlers[selector].handlers.length) {
              delete eventsObj[type].delegatedHandlers[selector];
              _isEmpty(eventsObj[type].delegatedHandlers) && delete eventsObj[type].delegatedHandlers;
              if (!eventsObj[type].handlers || !eventsObj[type].handlers.length) {
                el.removeEventListener(type, proxyHandler);
                delete eventsObj[type];
              }
            }
          }
        });

      } else {
        _forEach.call(types || eventsObj, function(type){
          if (eventsObj[type]) {
            _forEach.call(eventsObj[type].handlers, function(_handler, i){
              if (_handler === handler) {
                // el.removeEventListener(type, handler);
                // remove it from the handlers array
                queue.unshift(function(){
                  eventsObj[type].handlers.splice(i, 1);
                });
              }
            });
            
            _forEach.call(queue, function(f){
              f();
            });

            if (!eventsObj[type].handlers.length) {
              delete eventsObj[type].handlers;
              if (!eventsObj[type].delegatedHandlers || !eventsObj[type].delegatedHandlers.length) {
                el.removeEventListener(type, proxyHandler);
                delete eventsObj[type];
              }
            }
            
          }
        });
      }

      _isEmpty(eventsObj) && delete zector.events[id];

    }
  }

  function dispatch(e) {
    var type = e.type, target = e.target || e.srcElement, id = this._Z;
    if (!id) return false;

    var eventsObj = zector.events[id], elem = this;

    if (eventsObj[type]) {
      var delegatedHandlersQueue = [], delegatedHandlers, handlers, elLevel;
      if (eventsObj[type].delegatedHandlers) {
        // first grep the delegatedHandlers
        delegatedHandlers = eventsObj[type].delegatedHandlers;
        delegatedHandlersQueue = [];
        _forEach.call(delegatedHandlers, function(handlers, selector){
          if ((elLevel = delegate(target, selector, elem))[1] > -1) {
            // we found a match, push to the queue
            // delegatedHandlers[selector].level = elLevel[1];
            delegatedHandlersQueue.push({
              level : elLevel[1],
              el : elLevel[0],
              handlers : delegatedHandlers[selector].handlers
            });
          }
        });

        // sort the queue based on ascending order of level
        delegatedHandlersQueue.sort(function(A,B){
          return A.level > B.level ? 1 : (A.level < B.level ? -1 : 0);
        });
      }

      if (eventsObj[type].handlers) {
        // then grep the handlers that are binded to the context element
        handlers = eventsObj[type].handlers;
      }

      var _level;
      for (var i = 0, l = delegatedHandlersQueue.length; i < l; i++) {
        var delegatedObj = delegatedHandlersQueue[i],
            el = delegatedObj.el,
            currentLevel = delegatedObj.level;

        // _level = _level || currentLevel;

        if (e.isPropagationStopped) {
          if (_level !== currentLevel) {
            return;
          }
        } else {
          _level = currentLevel;
          _forEach.call(delegatedObj.handlers, function(handler){
            if (handler.call(el, e) === false) {
              e.stopPropagation();
              e.preventDefault();
            }
          });
        }
      }

      !e.isPropagationStopped && _forEach.call(handlers, function(handler){ 
        // if (!e.isPropagationStopped) {
          handler.call(elem, e);
        // }
      });
    }
  }

  function delegate(el, selector, boundingElements, cumulatedLevel) {
    cumulatedLevel = cumulatedLevel || 0;
    if (el[matchesSelector](selector)) {
      return [el, cumulatedLevel];
    }

    if (el === boundingElements) {
      return [boundingElements, -1];
    }

    var parent = el.parentNode;
    if (parent) {
      return delegate(parent, selector, boundingElements, ++cumulatedLevel);
    }
  }

  function isScrollableProp(prop) {
    return (/^scroll/g).test(prop);
  }

  function getCurrentProperty(el, prop) {
    if (isScrollableProp(prop)) {
      return parseFloat(el[prop]);
    } else {
      return parseFloat(getComputedStyle(el)[prop]);
    }
  }

  /**********************************
   * Begins zector class implementation
   *********************************/

  function zector(selector, context) {
    return new zector.prototype.init(selector, context);
  }

  zector.mergeArrayToObject = function(obj, arr) {
    var i = 0, l = arr.length, j = obj.length || 0;
    if (!l) return false;
    for (obj.length = j + l; i < l; i++, j++) obj[j] = arr[i];
  };

  zector.generateID = function(){
    return "Z_" + (+(new Date) + count++); 
  }

  zector.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  zector.debounce = function(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  zector.easing = {
    linear : function(t, b, c, d) {
      return c * t / d + b;
    },
    easeInQuad: function(t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    easeOutQuad: function(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    easeInCubic: function(t, b, c, d) {
        return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    },
    easeInQuart: function(t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },
    easeInQuint: function(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },
    easeInSine: function(t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: function(t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, - 10 * t / d) + 1) + b;
    },
    easeInOutExpo: function(t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, - 10 * --t) + 2) + b;
    },
    easeInCirc: function(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function(t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    },
    easeInElastic: function(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, - 10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, - 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    },
    easeInBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    },
    easeInBounce: function(t, b, c, d) {
        return c - zector.easing.easeOutBounce(d - t, 0, c, d) + b;
    },
    easeOutBounce: function(t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    },
    easeInOutBounce: function(t, b, c, d) {
        if (t < d / 2) return zector.easing.easeInBounce(t * 2, 0, c, d) * .5 + b;
        return zector.easing.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
  }

  zector.events = {}; // for caching all the active binded events
  zector.handlers = {}; // for caching the one proxy event handler for each binding elements on the selection, that way, "click" and "touchstart" can have the same event handler and it will proxy the event to the right event handlers cached in zector.events based on the element of the event

  zector.prototype = {
    constructor : zector,
    length : 0,
    splice : _splice,
    init : function(selector, context){
      var results = [], match;
    
      context = context || document;

      if (!selector) {
        return this;
      }

      if (typeof selector !== 'string') {
        if (selector.nodeType === 1 || selector.nodeType === 9 || selector === window) {
          results = [selector];
        }
      } else if (match = selector.match(ID_TAG_CLASS_REGEXP_ADVANCED)) {

        // if the selector has [attribute] selector
        if (match[4] || match[5]) {
          zector.mergeArrayToObject(this, context.querySelectorAll(match[0]));
        } else {

          // get by ID only
          if (id = match[1]) {
            var singleElement = context.getElementById(id);
            if (singleElement && singleElement.parentNode) {
              // this.length = 1;
              // this[0] = singleElement;
              results = [singleElement];
            }
          } 
          // get by tag name
          else if (tag = match[2]) {
            results = _slice.call(context.getElementsByTagName(tag));
            // zector.mergeArrayToObject(results, context.getElementsByTagName(tag));
          }
          // get by class name
          else if (className = match[3]) {
            results = _slice.call(context.getElementsByClassName(className));
            // zector.mergeArrayToObject(results, context.getElementsByClassName(className));
          }
        }
      }

      this.selector = ((match && match[0]) || selector).toString().trim();

      zector.mergeArrayToObject(this, results);

      // zector.cache = zector.cache || {};
      // var id = zector.generateID();
      // zector.cache[id] = this;
      // this.each(function(el){ el._Z = id; });
      return this;
    },

    each : function(cb){
      var isFunction = typeof cb === 'function';
      // !this.length && isFunction && cb();
      isFunction && _forEach.call(this, cb);
      return this;
    },

    on : function(types, selector, handler, usedCapture){
      if (typeof types === 'object' && !selector && !handler) {
        // only passed in an object with event-type/handler pairs
        for (var type in types) this.on(type, types[type]);
      }

      else if (typeof types === 'string') {
        if (typeof selector === 'function' && !usedCapture) {
          usedCapture = handler;
          handler = selector;
          selector = undefined;
          // bind handler to 'this' element(s)
          // this.each(function(el){ 
          //   addEvent.call(this, el, types, handler, false);
          // });
        }

        else if (typeof selector === 'string' && typeof handler === 'function') {
          // event delegation
          // this.each(function(el){ 
          //   addEvent.call(this, el, types, handler, false, selector);
          // });

        }

        this.each(function(el){ 
            addEvent.call(this, el, types, handler, usedCapture, selector);
          });
      }

      return this;
    },

    off : function(types, selector, handler){

      if (!types) {
        if (selector || handler) {
          return this;
        } else {
          // master remove of all binded event handlers
          this.each(function(el){
            removeEvent(el);
          });
        }
      } 

      else if (typeof types === 'string') {
        // if (handler && typeof handler === 'function') {
        //   // if both arguments are passed in

        // } else {
        //   // just remove all handlers for the types passed in
        //   this.each(function(el){
        //     removeEvent(el, types);
        //   });
        // }

        if (!selector && !handler) {

        }
        else if (typeof selector === 'function' && !handler) {
          handler = selector;
          selector = undefined;

          // this.each(function(el){
          //   removeEvent(el, types, handler);
          // });
        } else if (typeof selector === 'string') {
          // this.each(function(el){
          //   removeEvent(el, types, handler, selector);
          // });
        }

        this.each(function(el){
          removeEvent(el, types, handler, selector);
        });
      }

      return this;
    },

    trigger : function(type, data){
      if (!type || SPACES_REGEXP.test(type)) return this;

      var evt;

      if (window.CustomEvent && typeof window.CustomEvent === 'function') {
        evt = new CustomEvent(type, {
          bubbles : true,
          cancelable : true
        });
      } else {
        evt = document.createEvent('Event');
        evt.initEvent(type, true, true);
      }

      if (data) evt._data = data;

      var e = new zector.Event(evt);
      
      this.each(function(el){
        // dispatch.call(el, e);
        el.dispatchEvent(evt);
      });

      return this;
    },

    eq : function(index) {
      var next = zector(this[index]);
      next.previousObj = this;
      return next;
    },

    get : function(index) {
      return this[index] ? this[index] : void 0;
    },

    siblings : function(){
      var empty = zector();
      var found = [];
      this.each(function(el) {
        var matched = [], n = el.parentNode.firstChild;
        for (; n; n = n.nextSibling) {
          if (n.nodeType === 1 && n !== el && _indexOf.call(found, el) < 0) {
            matched.push(n);
          }
        }
        found = found.concat(matched);
      });
      zector.mergeArrayToObject(empty, found);
      empty.previousObj = this;
      return empty;
    },

    find : function(selector) {
      var empty = zector();
      var found = [];
      this.each(function(el){
        found = found.concat(_slice.call(zector(selector, el)));
      });
      zector.mergeArrayToObject(empty, found);
      empty.previousObj = this;
      return empty;
    },

    filter : function(selector) {
      var empty = zector();
      var found = [];
      this.each(function(el){
        if (el[matchesSelector](selector)) {
          found.push(el);
        }
      });
      zector.mergeArrayToObject(empty, found);
      empty.previousObj = this;
      return empty;
    },

    end : function(){
      return !!this.previousObj ? this.previousObj : this;
    },

    show : function(){
      this.each(function(el){
        el.style.display = "block";
      });
      return this;
    },

    hide : function(){
      this.each(function(el){
        el.style.display = "none";
      });
      return this;
    },

    hasClass : function(className) {
      if (!className) return true;
      return !!_forEach.call(this, function(el){
        if (el.classList.contains(className)) {
          return false;
        }
      });
    },

    addClass : function(classNames) {
      this.each(function(el){
        changeClasses(el, classNames, null);
      });
      return this;
    },

    removeClass : function(classNames) {
      this.each(function(el){
        changeClasses(el, null, classNames);
      });
      return this;
    },

    animate : function(prop, value, duration, easing, cb){
      easing = zector.easing[easing || 'linear'];
      prop = _toCamelCase(prop);
      var styleAccess = !isScrollableProp(prop);

      this.each(function(el){
        var val_0 = getCurrentProperty(el, prop), val_f = value, val_delta = val_f - val_0;
        // var propAccess = styleAccess ? el : el.style;
        var t_0 = +new Date, t_f = t_0 + duration;
        var animationTimerID = requestAnimationFrame(function _animate(){
          var t_c = +new Date, t_elapsed = t_c - t_0;
          var propAccess = styleAccess ? el.style : el;
          if (t_elapsed < duration) {
            propAccess[prop] = easing(t_elapsed, val_0, val_delta, duration) + (styleAccess ? 'px' : 0);
            animationTimerID = requestAnimationFrame(_animate);
          } else {
            propAccess[prop] = value + (styleAccess ? 'px' : 0);
            cancelAnimationFrame(animationTimerID);
            typeof cb === 'function' && cb.call(el);
          }
        });

      });

      return this;
    },

    scrollXTo : function(value, duration, easing, cb) {
      return this.animate('scrollLeft', value, duration, easing, cb);
    },

    scrollYTo : function(value, duration, easing, cb) {
      return this.animate('scrollTop', value, duration, easing, cb);
    }
  };

  zector.Event = function(e) {
    this.orgEvent = e;
    this.target = e.target;
    this.type = e.type;
  };

  zector.Event.prototype = {
    constructor : zector.Event,
    isDefaultPrevented: false,
    isPropagationStopped: false,
    preventDefault : function(){
      var e = this.orgEvent;
      this.isDefaultPrevented = true;
      if (e && e.preventDefault) {
        e.preventDefault();
      }
    },
    stopPropagation: function() {
      var e = this.orgEvent;
      this.isPropagationStopped = true;
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    }
  }

  // so that "instanceof" operator will work because it just check the comparing prototype of the operands
  zector.prototype.init.prototype = zector.prototype;

  window['Z'] = window['zector'] = zector;

})( window, document, undefined);
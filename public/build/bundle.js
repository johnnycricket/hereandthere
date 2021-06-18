var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function clockService(offset = 0) {
        let time = new Date(),
            h = time.getUTCHours(),
            m = time.getUTCMinutes(),
            formatted_h = "",
            formatted_m = "",
            nightday = "";

        h = notover24(h, offset);

        nightday = amPm(h);

        h = twelvehourclock(h);

        formatted_h = addzero(h);
        formatted_m = addzero(m);

        return formatted_h + ":" + formatted_m + ' ' + nightday;
    }

    function amPm(hour) {
        return hour < 12 ? "am" : "pm";
    }

    function twelvehourclock(hour) {
        return hour > 12 ? hour - 12 : hour;
    }

    function notover24(hour, offset) {
        if(hour + offset > 24) {
            hour = hour + offset - 24;
        } else if(hour + offset < 0) {
            hour = hour + offset + 24;
        } else {
            hour = hour + offset;
        }
        return hour;
    }

    function addzero(time){
        return time < 10 ? `0${time}`: `${time}`
    }

    /* src/components/the-time.svelte generated by Svelte v3.38.2 */

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-o3hu0x-style";
    	style.textContent = "section.svelte-o3hu0x{display:block;position:relative;margin-bottom:2rem}.place.svelte-o3hu0x{font-size:2rem}.clock.svelte-o3hu0x{font-size:6rem;width:max-content;display:block}";
    	append(document.head, style);
    }

    function create_fragment$1(ctx) {
    	let section;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2;

    	return {
    		c() {
    			section = element("section");
    			span0 = element("span");
    			t0 = text(/*place*/ ctx[0]);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*theClock*/ ctx[1]);
    			attr(span0, "class", "place svelte-o3hu0x");
    			attr(span1, "data-testid", "clock");
    			attr(span1, "class", "clock svelte-o3hu0x");
    			attr(section, "class", "svelte-o3hu0x");
    		},
    		m(target, anchor) {
    			insert(target, section, anchor);
    			append(section, span0);
    			append(span0, t0);
    			append(section, t1);
    			append(section, span1);
    			append(span1, t2);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*place*/ 1) set_data(t0, /*place*/ ctx[0]);
    			if (dirty & /*theClock*/ 2) set_data(t2, /*theClock*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(section);
    		}
    	};
    }

    const tickspeed = 1000;

    function instance($$self, $$props, $$invalidate) {
    	let { offset = 0 } = $$props;
    	let { place = "" } = $$props;
    	let theClock = "";

    	onMount(() => {
    		setInterval(
    			function () {
    				$$invalidate(1, theClock = clockService(offset));
    			},
    			tickspeed
    		);
    	});

    	$$self.$$set = $$props => {
    		if ("offset" in $$props) $$invalidate(2, offset = $$props.offset);
    		if ("place" in $$props) $$invalidate(0, place = $$props.place);
    	};

    	return [place, theClock, offset];
    }

    class The_time extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-o3hu0x-style")) add_css$1();
    		init(this, options, instance, create_fragment$1, safe_not_equal, { offset: 2, place: 0 });
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-6mpfy7-style";
    	style.textContent = "header.svelte-6mpfy7.svelte-6mpfy7,main.svelte-6mpfy7.svelte-6mpfy7{font-family:Arial, Helvetica, sans-serif;width:95%;position:relative;display:block;margin:1rem}header.svelte-6mpfy7 h1.svelte-6mpfy7{font-weight:normal;align-content:center;font-size:3rem}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	let header;
    	let t1;
    	let main;
    	let thetime0;
    	let t2;
    	let thetime1;
    	let current;
    	thetime0 = new The_time({ props: { offset: -5, place: "Iowa" } });
    	thetime1 = new The_time({ props: { offset: 2, place: "Germany" } });

    	return {
    		c() {
    			header = element("header");
    			header.innerHTML = `<h1 class="svelte-6mpfy7">There and Here</h1>`;
    			t1 = space();
    			main = element("main");
    			create_component(thetime0.$$.fragment);
    			t2 = space();
    			create_component(thetime1.$$.fragment);
    			attr(header, "class", "svelte-6mpfy7");
    			attr(main, "class", "svelte-6mpfy7");
    		},
    		m(target, anchor) {
    			insert(target, header, anchor);
    			insert(target, t1, anchor);
    			insert(target, main, anchor);
    			mount_component(thetime0, main, null);
    			append(main, t2);
    			mount_component(thetime1, main, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(thetime0.$$.fragment, local);
    			transition_in(thetime1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(thetime0.$$.fragment, local);
    			transition_out(thetime1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(header);
    			if (detaching) detach(t1);
    			if (detaching) detach(main);
    			destroy_component(thetime0);
    			destroy_component(thetime1);
    		}
    	};
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-6mpfy7-style")) add_css();
    		init(this, options, null, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());

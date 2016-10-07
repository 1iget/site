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
	return {'layout/methods':[function (module,exports,global,require,request){
var
	animation = require('enyo/animation'),
	dom = require('enyo/dom'),
	kind = require('enyo/kind'),
	logger = require('enyo/logger'),
	platform = require('enyo/platform'),
	utils = require('enyo/utils');

/**
* layout/List was too large for the parser so we have to split it up. For now, we're arbitrarily
* splitting the methods into another file. A more appropriate refactoring is required.
* @module layout/List
* @private
*/

module.exports = /** @lends module:layout/List~List.prototype */ {
	/**
	* @method
	* @private
	*/
	importProps: kind.inherit(function (sup) {
		return function (props) {
			// force touch on desktop when we have reorderable items to work around
			// problems with native scroller
			if (props && props.reorderable) {
				this.touch = true;
			}
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function () {
			this.pageSizes = [];
			this.orientV = this.orient == 'v';
			this.vertical = this.orientV ? 'default' : 'hidden';
			sup.apply(this, arguments);
			this.$.generator.orient = this.orient;
			this.getStrategy().translateOptimized = true;
			this.$.port.addRemoveClass('horizontal',!this.orientV);
			this.$.port.addRemoveClass('vertical',this.orientV);
			this.$.page0.addRemoveClass('vertical',this.orientV);
			this.$.page1.addRemoveClass('vertical',this.orientV);
			this.bottomUpChanged();  // Initializes pageBound also
			this.noSelectChanged();
			this.multiSelectChanged();
			this.toggleSelectedChanged();
			// setup generator to default to 'full-list' values
			this.$.generator.setRowOffset(0);
			this.$.generator.setCount(this.count);
		};
	}),

	/**
	* @method
	* @private
	*/
	initComponents: kind.inherit(function (sup) {
		return function () {
			this.createReorderTools();
			sup.apply(this, arguments);
			this.createSwipeableComponents();
		};
	}),

	/**
	* @private
	*/
	createReorderTools: function () {
		this.createComponent({
			name: 'reorderContainer',
			classes: 'enyo-list-reorder-container',
			ondown: 'sendToStrategy',
			ondrag: 'sendToStrategy',
			ondragstart: 'sendToStrategy',
			ondragfinish: 'sendToStrategy',
			onflick: 'sendToStrategy'
		});
	},

	/**
	* Adjusts the parent control so [listTools]{@link module:layout/List~List#listTools} are
	* created inside the strategy. This is necessary for strategies like
	* {@link module:enyo/TouchScrollStrategy~TouchScrollStrategy}, which wrap their contents with
	* additional DOM nodes.
	*
	* @see {@link module:enyo/Scroller~Scroller#createStrategy}
	* @method
	* @private
	*/
	createStrategy: kind.inherit(function (sup) {
		return function () {
			this.controlParentName = 'strategy';
			sup.apply(this, arguments);
			this.createChrome(this.listTools);
			this.controlParentName = 'client';
			this.discoverControlParent();
		};
	}),

	/**
	* @private
	*/
	createSwipeableComponents: function () {
		for (var i=0;i<this.swipeableComponents.length;i++) {
			this.$.swipeableComponents.createComponent(this.swipeableComponents[i], {owner: this.owner});
		}
	},

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.$.generator.node = this.$.port.hasNode();
			this.$.generator.generated = true;
			this.reset();
		};
	}),

	/**
	* @method
	* @private
	*/
	handleResize: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.refresh();
		};
	}),

	/**
	* @private
	*/
	bottomUpChanged: function () {
		this.$.generator.bottomUp = this.bottomUp;
		this.$.page0.applyStyle(this.pageBound, null);
		this.$.page1.applyStyle(this.pageBound, null);

		if (this.orientV) {
			this.pageBound = this.bottomUp ? 'bottom' : 'top';
		} else {
			if (this.rtl) {
				this.pageBound = this.bottomUp ? 'left' : 'right';
			} else {
				this.pageBound = this.bottomUp ? 'right' : 'left';
			}
		}

		if (!this.orientV && this.bottomUp){
			this.$.page0.applyStyle('left', 'auto');
			this.$.page1.applyStyle('left', 'auto');
		}

		if (this.hasNode()) {
			this.reset();
		}
	},

	/**
	* @private
	*/
	noSelectChanged: function () {
		this.$.generator.setNoSelect(this.noSelect);
	},

	/**
	* @private
	*/
	multiSelectChanged: function () {
		this.$.generator.setMultiSelect(this.multiSelect);
	},

	/**
	* @private
	*/
	toggleSelectedChanged: function () {
		this.$.generator.setToggleSelected(this.toggleSelected);
	},

	/**
	* @private
	*/
	countChanged: function () {
		if (this.hasNode()) {
			this.updateMetrics();
		}
	},

	/**
	* Re-dispatches events from the reorder tools to the scroll strategy.
	*
	* @private
	*/
	sendToStrategy: function (sender, event) {
		this.$.strategy.dispatchEvent('on' + event.type, event, sender);
	},

	/**
	* Calculates page metrics (size, number of pages) and resizes the port.
	*
	* @private
	*/
	updateMetrics: function () {
		this.defaultPageSize = this.rowsPerPage * (this.rowSize || 100);
		this.pageCount = Math.ceil(this.count / this.rowsPerPage);
		this.portSize = 0;
		for (var i=0; i < this.pageCount; i++) {
			this.portSize += this.getPageSize(i);
		}
		this.adjustPortSize();
	},

	/**
	* Handles hold pulse events. Used to delay before running hold logic.
	*
	* @private
	*/
	holdpulse: function (sender, event) {
		// don't activate if we're not supporting reordering or if we've already
		// activated the reorder logic
		if (!this.getReorderable() || this.isReordering()) {
			return;
		}
		// first pulse event that exceeds our minimum hold time activates
		if (event.holdTime >= this.reorderHoldTimeMS) {
			// determine if we should handle the hold event
			if (this.shouldStartReordering(sender, event)) {
				this.startReordering(event);
				return false;
			}
		}
	},

	/**
	* Handles DragStart events.
	*
	* @private
	*/
	dragstart: function (sender, event) {
		// stop dragstart from propagating if we're in reorder mode
		if (this.isReordering()) {
			return true;
		}
		if (this.isSwipeable()) {
			return this.swipeDragStart(sender, event);
		}
	},

	/**
	* Determines whether we should handle the drag event.
	*
	* @private
	*/
	drag: function (sender, event) {
		if (this.shouldDoReorderDrag(event)) {
			event.preventDefault();
			this.reorderDrag(event);
			return true;
		} else if (this.isSwipeable()) {
			event.preventDefault();
			this.swipeDrag(sender, event);
			return true;
		}
	},

	/**
	* Handles DragFinish events.
	*
	* @private
	*/
	dragfinish: function (sender, event) {
		if (this.isReordering()) {
			this.finishReordering(sender, event);
		} else if (this.isSwipeable()) {
			this.swipeDragFinish(sender, event);
		}
	},

	/**
	* Handles up events.
	*
	* @private
	*/
	up: function (sender, event) {
		if (this.isReordering()) {
			this.finishReordering(sender, event);
		}
	},

	/**
	* Calculates the record indices for `pageNumber` and generates the markup
	* for that page.
	*
	* @private
	*/
	generatePage: function (pageNumber, target) {
		this.page = pageNumber;
		var r = this.rowsPerPage * this.page;
		this.$.generator.setRowOffset(r);
		var rpp = Math.min(this.count - r, this.rowsPerPage);
		this.$.generator.setCount(rpp);
		var html = this.$.generator.generateChildHtml();
		target.setContent(html);
		// prevent reordering row from being draw twice
		if (this.getReorderable() && this.draggingRowIndex > -1) {
			this.hideReorderingRow();
		}
		var bounds = target.getBounds();
		var pageSize = this.orientV ? bounds.height : bounds.width;
		// if rowSize is not set, use the height or width from the first generated page
		if (!this.rowSize && pageSize > 0) {
			this.rowSize = Math.floor(pageSize / rpp);
			this.updateMetrics();
		}
		// update known page sizes
		if (!this.fixedSize) {
			var s0 = this.getPageSize(pageNumber);
			if (s0 != pageSize && pageSize > 0) {
				this.pageSizes[pageNumber] = pageSize;
				this.portSize += pageSize - s0;
			}
		}
	},

	/**
	* Maps a row index number to the page number where it would be found.
	*
	* @private
	*/
	pageForRow: function (index) {
		return Math.floor(index / this.rowsPerPage);
	},

	/**
	 * Updates the list pages to show the correct rows for the requested `top` position.
	 *
	 * @param  {Number} top - Position in pixels from the top.
	 * @private
	 */
	update: function (top) {
		var updated = false;
		// get page info for position
		var pi = this.positionToPageInfo(top);
		// zone line position
		var pos = pi.pos + this.scrollerSize/2;
		// leap-frog zone position
		var k = Math.floor(pos/Math.max(pi.size, this.scrollerSize) + 1/2) + pi.no;
		// which page number for page0 (even number pages)?
		var p = (k % 2 === 0) ? k : k-1;
		if (this.p0 != p && this.isPageInRange(p)) {
			this.removedInitialPage = this.removedInitialPage || (this.draggingRowPage == this.p0);
			this.generatePage(p, this.$.page0);
			this.positionPage(p, this.$.page0);
			this.p0 = p;
			updated = true;
			this.p0RowBounds = this.getPageRowSizes(this.$.page0);
		}
		// which page number for page1 (odd number pages)?
		p = (k % 2 === 0) ? Math.max(1, k-1) : k;
		// position data page 1
		if (this.p1 != p && this.isPageInRange(p)) {
			this.removedInitialPage = this.removedInitialPage || (this.draggingRowPage == this.p1);
			this.generatePage(p, this.$.page1);
			this.positionPage(p, this.$.page1);
			this.p1 = p;
			updated = true;
			this.p1RowBounds = this.getPageRowSizes(this.$.page1);
		}
		if (updated) {
			// reset generator back to 'full-list' values
			this.$.generator.setRowOffset(0);
			this.$.generator.setCount(this.count);
			if (!this.fixedSize) {
				this.adjustBottomPage();
				this.adjustPortSize();
			}
		}
	},

	/**
	* Calculates the height and width of each row for a page.
	*
	* @param {module:enyo/Control~Control} page - Page control.
	* @private
	*/
	getPageRowSizes: function (page) {
		var rows = {};
		var allDivs = page.hasNode().querySelectorAll('div[data-enyo-index]');
		for (var i=0, index, bounds; i < allDivs.length; i++) {
			index = allDivs[i].getAttribute('data-enyo-index');
			if (index !== null) {
				bounds = dom.getBounds(allDivs[i]);
				rows[parseInt(index, 10)] = {height: bounds.height, width: bounds.width};
			}
		}
		return rows;
	},

	/**
	* Updates row bounds when rows are re-rendered.
	*
	* @private
	*/
	updateRowBounds: function (index) {
		if (this.p0RowBounds[index]) {
			this.updateRowBoundsAtIndex(index, this.p0RowBounds, this.$.page0);
		} else if (this.p1RowBounds[index]) {
			this.updateRowBoundsAtIndex(index, this.p1RowBounds, this.$.page1);
		}
	},

	/**
	* @private
	*/
	updateRowBoundsAtIndex: function (index, rows, page) {
		var rowDiv = page.hasNode().querySelector('div[data-enyo-index="' + index + '"]');
		var bounds = dom.getBounds(rowDiv);
		rows[index].height = bounds.height;
		rows[index].width = bounds.width;
	},

	/**
	* Updates the list for the given `position`.
	*
	* @param {Number} position - Position in pixels.
	* @private
	*/
	updateForPosition: function (position) {
		this.update(this.calcPos(position));
	},

	/**
	* Adjusts the position if the list is [bottomUp]{@link module:layout/List~List#bottomUp}.
	*
	* @param {Number} position - Position in pixels.
	* @private
	*/
	calcPos: function (position) {
		return (this.bottomUp ? (this.portSize - this.scrollerSize - position) : position);
	},

	/**
	* Determines which page is on the bottom and positions it appropriately.
	*
	* @private
	*/
	adjustBottomPage: function () {
		var bp = this.p0 >= this.p1 ? this.$.page0 : this.$.page1;
		this.positionPage(bp.pageNo, bp);
	},

	/**
	* Updates the size of the port to be the greater of the size of the scroller or
	* the `portSize`.
	*
	* @private
	*/
	adjustPortSize: function () {
		this.scrollerSize = this.orientV ? this.getBounds().height : this.getBounds().width;
		var s = Math.max(this.scrollerSize, this.portSize);
		this.$.port.applyStyle((this.orientV ? 'height' : 'width'), s + 'px');
		if (!this.orientV) {
			this.$.port.applyStyle('height', this.getBounds().height + 'px');
		}
	},

	/**
	* @private
	*/
	positionPage: function (pageNumber, target) {
		target.pageNo = pageNumber;
		var p = this.pageToPosition(pageNumber);
		target.applyStyle(this.pageBound, p + 'px');
	},

	/**
	* Calculates the position of `page`.
	*
	* @param {Number} page - Page number.
	* @private
	*/
	pageToPosition: function (page) {
		var p = 0;
		while (page > 0) {
			page--;
			p += this.getPageSize(page);
		}
		return p;
	},

	/**
	 * Retrieves the metrics for a page covering `position`.
	 *
	 * @param  {Number} position - Position in pixels.
	 * @return {module:layout/List~List~PageInfo}
	 * @private
	 */
	positionToPageInfo: function (position) {
		var page = -1;
		var p = this.calcPos(position);
		var s = this.defaultPageSize;
		while (p >= 0) {
			page++;
			s = this.getPageSize(page);
			p -= s;
		}
		page = Math.max(page, 0);
		return {
			no: page,
			size: s,
			pos: p + s,
			startRow: (page * this.rowsPerPage),
			endRow: Math.min((page + 1) * this.rowsPerPage - 1, this.count - 1)
		};
	},

	/**
	* Determines if `page` is a valid page number.
	*
	* @param {Number} page - Page number.
	* @private
	*/
	isPageInRange: function (page) {
		return page == Math.max(0, Math.min(this.pageCount-1, page));
	},

	/**
	* Calculates the size of a page. The size is estimated if the page has not
	* yet been rendered.
	*
	* @private
	*/
	getPageSize: function (pageNumber) {
		var size = this.pageSizes[pageNumber];
		// estimate the size based on how many rows are in this page
		if (!size) {
			var firstRow = this.rowsPerPage * pageNumber;
			var numRows = Math.min(this.count - firstRow, this.rowsPerPage);
			size = this.defaultPageSize * (numRows / this.rowsPerPage);
		}
		// can never return size of 0, as that would lead to infinite loops
		return Math.max(1, size);
	},

	/**
	* Resets pages and removes all rendered rows.
	*
	* @private
	*/
	invalidatePages: function () {
		this.p0 = this.p1 = null;
		this.p0RowBounds = {};
		this.p1RowBounds = {};
		// clear the html in our render targets
		this.$.page0.setContent('');
		this.$.page1.setContent('');
	},

	/**
	* Resets page and row sizes.
	*
	* @private
	*/
	invalidateMetrics: function () {
		this.pageSizes = [];
		this.rowSize = 0;
		this.updateMetrics();
	},

	/**
	* When the list is scrolled, ensures that the correct rows are rendered and
	* that the reordering controls are positioned correctly.
	*
	* @see {@link module:enyo/Scroller~Scroller#scroll}
	* @method
	* @private
	*/
	scroll: kind.inherit(function (sup) {
		return function (sender, event) {
			var r = sup.apply(this, arguments);
			var pos = this.orientV ? this.getScrollTop() : this.getScrollLeft();
			if (this.lastPos === pos) {
				return r;
			}
			this.lastPos = pos;
			this.update(pos);
			if (this.pinnedReorderMode) {
				this.reorderScroll(sender, event);
			}
			return r;
		};
	}),

	/**
	* Updates the list rows when the scroll top is set explicitly.
	*
	* @see {@link module:enyo/Scroller~Scroller#setScrollTop}
	* @method
	* @public
	*/
	setScrollTop: kind.inherit(function (sup) {
		return function (scrollTop) {
			this.update(scrollTop);
			sup.apply(this, arguments);
			this.twiddle();
		};
	}),

	/**
	* @private
	*/
	getScrollPosition: function () {
		return this.calcPos(this[(this.orientV ? 'getScrollTop' : 'getScrollLeft')]());
	},

	/**
	* @private
	*/
	setScrollPosition: function (position) {
		this[(this.orientV ? 'setScrollTop' : 'setScrollLeft')](this.calcPos(position));
	},

	/**
	* Scrolls the list so that the last item is visible.
	*
	* @method
	* @public
	*/
	scrollToBottom: kind.inherit(function (sup) {
		return function () {
			this.update(this.getScrollBounds().maxTop);
			sup.apply(this, arguments);
		};
	}),

	/**
	* Scrolls to the specified row.
	*
	* @param {Number} row - The index of the row to scroll to.
	* @public
	*/
	scrollToRow: function (row) {
		var page = this.pageForRow(row);
		var h = this.pageToPosition(page);
		// update the page
		this.updateForPosition(h);
		// call pageToPosition again and this time should return the right pos since the page info is populated
		h = this.pageToPosition(page);
		this.setScrollPosition(h);
		if (page == this.p0 || page == this.p1) {
			var rowNode = this.$.generator.fetchRowNode(row);
			if (rowNode) {
				// calc row offset
				var offset = (this.orientV ? rowNode.offsetTop : rowNode.offsetLeft);
				if (this.bottomUp) {
					offset = this.getPageSize(page) - (this.orientV ? rowNode.offsetHeight : rowNode.offsetWidth) - offset;
				}
				var p = this.getScrollPosition() + offset;
				this.setScrollPosition(p);
			}
		}
	},

	/**
	* Scrolls to the beginning of the list.
	*
	* @public
	*/
	scrollToStart: function () {
		this[this.bottomUp ? (this.orientV ? 'scrollToBottom' : 'scrollToRight') : 'scrollToTop']();
	},

	/**
	* Scrolls to the end of the list.
	*
	* @public
	*/
	scrollToEnd: function () {
		this[this.bottomUp ? (this.orientV ? 'scrollToTop' : 'scrollToLeft') : (this.orientV ? 'scrollToBottom' : 'scrollToRight')]();
	},

	/**
	* Re-renders the list at the current position.
	*
	* @public
	*/
	refresh: function () {
		this.invalidatePages();
		this.update(this[(this.orientV ? 'getScrollTop' : 'getScrollLeft')]());
		this.stabilize();

		//FIXME: Necessary evil for Android 4.0.4 refresh bug
		if (platform.android === 4) {
			this.twiddle();
		}
	},

	/**
	* Re-renders the list from the beginning.  This is used when changing the
	* data model for the list.  This also clears the selection state.
	*
	* @public
	*/
	reset: function () {
		this.getSelection().clear();
		this.invalidateMetrics();
		this.invalidatePages();
		this.stabilize();
		this.scrollToStart();
	},

	/**
	* Returns the {@link module:enyo/Selection~Selection} component that
	* manages the selection state for this list.
	*
	* @return {module:enyo/Selection~Selection} - The component that manages selection state for this list.
	* @public
	*/
	getSelection: function () {
		return this.$.generator.getSelection();
	},

	/**
	* Sets the selection state for the given row index.
	*
	* Modifying selection will not automatically re-render the row, so call
	* [renderRow()]{@link module:layout/List~List#renderRow} or [refresh()]{@link module:layout/List~List#refresh}
	* to update the view.
	*
	* @param {Number} index - The index of the row whose selection state is to be set.
	* @param {*} [data]     - Data value stored in the selection object.
	* @public
	*/
	select: function (index, data) {
		return this.getSelection().select(index, data);
	},

	/**
	* Clears the selection state for the given row index.
	*
	* Modifying selection will not automatically re-render the row, so call
	* [renderRow()]{@link module:layout/List~List#renderRow} or [refresh()]{@link module:layout/List~List#refresh}
	* to update the view.
	*
	* @param {Number} index - The index of the row whose selection state is to be cleared.
	* @public
	*/
	deselect: function (index) {
		return this.getSelection().deselect(index);
	},

	/**
	* Gets the selection state for the given row index.
	*
	* @param {Number} index - The index of the row whose selection state is
	* to be retrieved.
	* @return {Boolean} `true` if the given row is currently selected; otherwise, `false`.
	* @public
	*/
	isSelected: function (index) {
		return this.$.generator.isSelected(index);
	},

	/**
	* Re-renders the specified row. Call this method after making
	* modifications to a row, to force it to render.
	*
	* @param {Number} index - The index of the row to be re-rendered.
	* @public
    */
    renderRow: function (index) {
		this.$.generator.renderRow(index);
    },

	/**
 	* Handler for `onRenderRow` events. Updates row bounds when rows are re-rendered.
	*
	* @private
	*/
	rowRendered: function (sender, event) {
		this.updateRowBounds(event.rowIndex);
	},

	/**
	* Prepares a row to become interactive.
	*
	* @param {Number} index - The index of the row to be prepared.
	* @public
	*/
	prepareRow: function (index) {
		this.$.generator.prepareRow(index);
	},

	/**
	* Restores the row to being non-interactive.
	*
	* @public
	*/
	lockRow: function () {
		this.$.generator.lockRow();
	},

	/**
	* Performs a set of tasks by running the function `func` on a row (which
	* must be interactive at the time the tasks are performed). Locks the	row
	* when done.
	*
	* @param {Number} index   - The index of the row to be acted upon.
	* @param {function} func  - The function to perform.
	* @param {Object} context - The context to which the function is bound.
	* @public
	*/
	performOnRow: function (index, func, context) {
		this.$.generator.performOnRow(index, func, context);
	},

	/**
	* @private
	*/
	animateFinish: function (sender) {
		this.twiddle();
		return true;
	},
	/**
	* FIXME: Android 4.04 has issues with nested composited elements; for example, a
	* SwipeableItem, can incorrectly generate taps on its content when it has slid off the
	* screen; we address this BUG here by forcing the Scroller to 'twiddle' which corrects the
	* bug by provoking a dom update.
	*
	* @private
	*/
	twiddle: function () {
		var s = this.getStrategy();
		utils.call(s, 'twiddle');
	},

	/**
	* Returns page0 or page1 control depending on pageNumber odd/even status
	*
	* @param {Number} pageNumber  - Index of page.
	* @param {Boolean} checkRange - Whether to force checking `pageNumber` against
	* currently active pages.
	* @return {module:enyo/Control~Control}      - Page control for `pageNumber`.
	* @private
	*/
	pageForPageNumber: function (pageNumber, checkRange) {
		if (pageNumber % 2 === 0) {
			return (!checkRange || (pageNumber === this.p0)) ? this.$.page0 : null;
		}
		else {
			return (!checkRange || (pageNumber === this.p1)) ? this.$.page1 : null;
		}
		return null;
	},
	/**
		---- Reorder functionality ------------
	*/

	/**
	* Determines whether the hold event should be handled as a reorder hold.
	*
	* @private
	*/
	shouldStartReordering: function (sender, event) {
		if (!this.getReorderable() ||
			event.rowIndex == null ||
			event.rowIndex < 0 ||
			this.pinnedReorderMode ||
			event.index == null ||
			event.index < 0) {
			return false;
		}
		return true;
	},

	/**
	* Processes hold event and prepares for reordering.
	*
	* @fires module:layout/List~List#onSetupReorderComponents
	* @private
	*/
	startReordering: function (event) {
		// disable drag to scroll on strategy
		this.$.strategy.listReordering = true;

		this.buildReorderContainer();
		this.doSetupReorderComponents({index: event.index});
		this.styleReorderContainer(event);

		this.draggingRowIndex = this.placeholderRowIndex = event.rowIndex;
		this.draggingRowPage = this.pageForRow(this.draggingRowIndex);
		this.removeDraggingRowNode = event.dispatchTarget.retainNode(event.target);
		this.removedInitialPage = false;
		this.itemMoved = false;
		this.initialPageNumber = this.currentPageNumber = this.pageForRow(event.rowIndex);
		this.prevScrollTop = this.getScrollTop();

		// fill row being reordered with placeholder
		this.replaceNodeWithPlaceholder(event.rowIndex);
	},

	/**
	* Fills reorder container with draggable reorder components defined by the
	* application.
	*
	* @private
	*/
	buildReorderContainer: function () {
		this.$.reorderContainer.destroyClientControls();
		for (var i=0;i<this.reorderComponents.length;i++) {
			this.$.reorderContainer.createComponent(this.reorderComponents[i], {owner:this.owner});
		}
		this.$.reorderContainer.render();
	},

	/**
	* Prepares floating reorder container.
	*
	* @param {Object} e - Event object.
	* @private
	*/
	styleReorderContainer: function (e) {
		this.setItemPosition(this.$.reorderContainer, e.rowIndex);
		this.setItemBounds(this.$.reorderContainer, e.rowIndex);
		this.$.reorderContainer.setShowing(true);
		if (this.centerReorderContainer) {
			this.centerReorderContainerOnPointer(e);
		}
	},

	/**
	* Copies the innerHTML of `node` into a new component inside of
	* `reorderContainer`.
	*
	* @param {Node} node - The source node.
	* @private
	*/
	appendNodeToReorderContainer: function (node) {
		this.$.reorderContainer.createComponent({allowHtml: true, content: node.innerHTML}).render();
	},

	/**
	* Centers the floating reorder container on the user's pointer.
	*
	* @param {Object} e - Event object.
	* @private
	*/
	centerReorderContainerOnPointer: function (e) {
		var containerPosition = dom.calcNodePosition(this.hasNode());
		var bounds = this.$.reorderContainer.getBounds();
		var x = e.pageX - containerPosition.left - parseInt(bounds.width, 10)/2;
		var y = e.pageY - containerPosition.top + this.getScrollTop() - parseInt(bounds.height, 10)/2;
		if (this.getStrategyKind() != 'ScrollStrategy') {
			x -= this.getScrollLeft();
			y -= this.getScrollTop();
		}
		this.positionReorderContainer(x, y);
	},

	/**
	* Moves the reorder container to the specified `x` and `y` coordinates.
	* Animates and kicks off timer to turn off animation.
	*
	* @param {Number} x - The `left` position.
	* @param {Number} y - The `top` position.
	* @private
	*/
	positionReorderContainer: function (x,y) {
		this.$.reorderContainer.addClass('enyo-animatedTopAndLeft');
		this.$.reorderContainer.addStyles('left:'+x+'px;top:'+y+'px;');
		this.setPositionReorderContainerTimeout();
	},

	/**
	* Sets a timeout to remove animation class from reorder container.
	*
	* @private
	*/
	setPositionReorderContainerTimeout: function () {
		this.clearPositionReorderContainerTimeout();
		this.positionReorderContainerTimeout = setTimeout(this.bindSafely(
			function () {
				this.$.reorderContainer.removeClass('enyo-animatedTopAndLeft');
				this.clearPositionReorderContainerTimeout();
			}), 100);
	},

	/**
	* @private
	*/
	clearPositionReorderContainerTimeout: function () {
		if (this.positionReorderContainerTimeout) {
			clearTimeout(this.positionReorderContainerTimeout);
			this.positionReorderContainerTimeout = null;
		}
	},

	/**
	* Determines whether we should handle the drag event.
	*
	* @private
	*/
	shouldDoReorderDrag: function () {
		if (!this.getReorderable() || this.draggingRowIndex < 0 || this.pinnedReorderMode) {
			return false;
		}
		return true;
	},

	/**
	* Handles the drag event as a reorder drag.
	*
	* @private
	*/
	reorderDrag: function (event) {
		// position reorder node under mouse/pointer
		this.positionReorderNode(event);

		// determine if we need to auto-scroll the list
		this.checkForAutoScroll(event);

		// if the current index the user is dragging over has changed, move the placeholder
		this.updatePlaceholderPosition(event.pageY);
	},

	/**
	* Determines the row index at `pageY` (if it exists) and moves the placeholder
	* to that index.
	*
	* @param {Number} pageY - Position from top in pixels.
	* @private
	*/
	updatePlaceholderPosition: function (pageY) {
		var index = this.getRowIndexFromCoordinate(pageY);
		if (index !== -1) {
			// cursor moved over a new row, so determine direction of movement
			if (index >= this.placeholderRowIndex) {
				this.movePlaceholderToIndex(Math.min(this.count, index + 1));
			}
			else {
				this.movePlaceholderToIndex(index);
			}
		}
	},

	/**
	* Positions the reorder node based on the `dx` and `dy` of the drag event.
	*
	* @private
	*/
	positionReorderNode: function (e) {
		var reorderNodeBounds = this.$.reorderContainer.getBounds();
		var left = reorderNodeBounds.left + e.ddx;
		var top = reorderNodeBounds.top + e.ddy;
		top = (this.getStrategyKind() == 'ScrollStrategy') ? top + (this.getScrollTop() - this.prevScrollTop) : top;
		this.$.reorderContainer.addStyles('top: '+top+'px ; left: '+left+'px');
		this.prevScrollTop = this.getScrollTop();
	},

	/**
	* Checks whether the list should scroll when dragging and, if so, starts the
	* scroll timeout timer. Auto-scrolling happens when the user drags an item
	* within the top/bottom boundary percentage defined in
	* [dragToScrollThreshold]{@link module:layout/List~List#dragToScrollThreshold}.
	*
	* @param {Object} event - Drag event.
	* @private
	*/
	checkForAutoScroll: function (event) {
		var position = dom.calcNodePosition(this.hasNode());
		var bounds = this.getBounds();
		var perc;
		this.autoscrollPageY = event.pageY;
		if (event.pageY - position.top < bounds.height * this.dragToScrollThreshold) {
			perc = 100*(1 - ((event.pageY - position.top) / (bounds.height * this.dragToScrollThreshold)));
			this.scrollDistance = -1*perc;
		} else if (event.pageY - position.top > bounds.height * (1 - this.dragToScrollThreshold)) {
			perc = 100*((event.pageY - position.top - bounds.height*(1 - this.dragToScrollThreshold)) / (bounds.height - (bounds.height * (1 - this.dragToScrollThreshold))));
			this.scrollDistance = 1*perc;
		} else {
			this.scrollDistance = 0;
		}
		// stop scrolling if distance is zero (i.e., user isn't scrolling to the edges of
		// the list); otherwise, start it if not already started
		if (this.scrollDistance === 0) {
			this.stopAutoScrolling();
		} else {
			if (!this.autoScrollTimeout) {
				this.startAutoScrolling();
			}
		}
	},

	/**
	* Stops auto-scrolling.
	*
	* @private
	*/
	stopAutoScrolling: function () {
		if (this.autoScrollTimeout) {
			clearTimeout(this.autoScrollTimeout);
			this.autoScrollTimeout = null;
		}
	},

	/**
	* Starts auto-scrolling.
	*
	* @private
	*/
	startAutoScrolling: function () {
		this.autoScrollTimeout = setInterval(this.bindSafely(this.autoScroll), this.autoScrollTimeoutMS);
	},

	/**
	* Scrolls the list by the distance specified in
	* [scrollDistance]{@link module:layout/List~List#scrollDistance}.
	*
	* @private
	*/
	autoScroll: function () {
		if (this.scrollDistance === 0) {
			this.stopAutoScrolling();
		} else {
			if (!this.autoScrollTimeout) {
				this.startAutoScrolling();
			}
		}
		this.setScrollPosition(this.getScrollPosition() + this.scrollDistance);
		this.positionReorderNode({ddx: 0, ddy: 0});

		// if the current index the user is dragging over has changed, move the placeholder
		this.updatePlaceholderPosition(this.autoscrollPageY);
	},

	/**
	* Moves the placeholder (i.e., the gap between rows) to the row currently
	* under the user's pointer. This provides a visual cue, showing the user
	* where the item being dragged will go if it is dropped.
	*
	* @param {Number} index - The row index.
	*/
	movePlaceholderToIndex: function (index) {
		var node, nodeParent;
		if (index < 0) {
			return;
		}
		else if (index >= this.count) {
			node = null;
			nodeParent = this.pageForPageNumber(this.pageForRow(this.count - 1)).hasNode();
		}
		else {
			node = this.$.generator.fetchRowNode(index);
			nodeParent = node.parentNode;
		}
		// figure next page for placeholder
		var nextPageNumber = this.pageForRow(index);

		// don't add pages beyond the original page count
		if (nextPageNumber >= this.pageCount) {
			nextPageNumber = this.currentPageNumber;
		}

		// move the placeholder to just after our 'index' node
		nodeParent.insertBefore(
			this.placeholderNode,
			node);

		if (this.currentPageNumber !== nextPageNumber) {
			// if moving to different page, recalculate page sizes and reposition pages
			this.updatePageSize(this.currentPageNumber);
			this.updatePageSize(nextPageNumber);
			this.updatePagePositions(nextPageNumber);
		}

		// save updated state
		this.placeholderRowIndex = index;
		this.currentPageNumber = nextPageNumber;

		// remember that we moved an item (to prevent pinning at the wrong time)
		this.itemMoved = true;
	},

	/**
	* Turns off reordering. If the user didn't drag the item being reordered
	* outside of its original position, enters pinned reorder mode.
	*
	* @private
	*/
	finishReordering: function (sender, event) {
		if (!this.isReordering() || this.pinnedReorderMode || this.completeReorderTimeout) {
			return;
		}
		this.stopAutoScrolling();
		// enable drag-scrolling on strategy
		this.$.strategy.listReordering = false;
		// animate reorder container to proper position and then complete
		// reordering actions
		this.moveReorderedContainerToDroppedPosition(event);
		this.completeReorderTimeout = setTimeout(
			this.bindSafely(this.completeFinishReordering, event), 100);

		event.preventDefault();
		return true;
	},

	/**
	* @private
	*/
	moveReorderedContainerToDroppedPosition: function () {
		var offset = this.getRelativeOffset(this.placeholderNode, this.hasNode());
		var top = (this.getStrategyKind() == 'ScrollStrategy') ? offset.top : offset.top - this.getScrollTop();
		var left = offset.left - this.getScrollLeft();
		this.positionReorderContainer(left, top);
	},

	/**
	* After the reordered item has been animated to its position, completes
	* the reordering logic.
	*
	* @private
	*/
	completeFinishReordering: function (event) {
		this.completeReorderTimeout = null;
		// adjust placeholderRowIndex to now be the final resting place
		if (this.placeholderRowIndex > this.draggingRowIndex) {
			this.placeholderRowIndex = Math.max(0, this.placeholderRowIndex - 1);
		}
		// if the user dropped the item in the same location where it was picked up, and they
		// didn't move any other items in the process, pin the item and go into pinned reorder mode
		if (this.draggingRowIndex == this.placeholderRowIndex &&
			this.pinnedReorderComponents.length && !this.pinnedReorderMode && !this.itemMoved) {
			this.beginPinnedReorder(event);
			return;
		}
		this.removeDraggingRowNode();
		this.removePlaceholderNode();
		this.emptyAndHideReorderContainer();
		// clear this early to prevent scroller code from using disappeared placeholder
		this.pinnedReorderMode = false;
		this.reorderRows(event);
		this.draggingRowIndex = this.placeholderRowIndex = -1;
		this.refresh();
	},

	/**
	* Enters pinned reorder mode.
	*
	* @fires module:layout/List~List#onSetupPinnedReorderComponents
	* @private
	*/
	beginPinnedReorder: function (event) {
		this.buildPinnedReorderContainer();
		this.doSetupPinnedReorderComponents(utils.mixin(event, {index: this.draggingRowIndex}));
		this.pinnedReorderMode = true;
		this.initialPinPosition = event.pageY;
	},

	/**
	* Clears contents of reorder container, then hides.
	*
	* @private
	*/
	emptyAndHideReorderContainer: function () {
		this.$.reorderContainer.destroyComponents();
		this.$.reorderContainer.setShowing(false);
	},

	/**
	* Fills reorder container with pinned controls.
	*
	* @private
	*/
	buildPinnedReorderContainer: function () {
		this.$.reorderContainer.destroyClientControls();
		for (var i=0;i<this.pinnedReorderComponents.length;i++) {
			this.$.reorderContainer.createComponent(this.pinnedReorderComponents[i], {owner:this.owner});
		}
		this.$.reorderContainer.render();
	},

	/**
	* Swaps the rows that were reordered, and sends up reorder event.
	*
	* @fires module:layout/List~List#onReorder
	* @private
	*/
	reorderRows: function (event) {
		// send reorder event
		this.doReorder(this.makeReorderEvent(event));
		// update display
		this.positionReorderedNode();
		// fix indices for reordered rows
		this.updateListIndices();
	},

	/**
	* Adds `reorderTo` and `reorderFrom` properties to the reorder event.
	*
	* @private
	*/
	makeReorderEvent: function (event) {
		event.reorderFrom = this.draggingRowIndex;
		event.reorderTo = this.placeholderRowIndex;
		return event;
	},

	/**
	* Moves the node being reordered to its new position and shows it.
	*
	* @private
	*/
	positionReorderedNode: function () {
		// only do this if the page with the initial item is still rendered
		if (!this.removedInitialPage) {
			var insertNode = this.$.generator.fetchRowNode(this.placeholderRowIndex);
			if (insertNode) {
				insertNode.parentNode.insertBefore(this.hiddenNode, insertNode);
				this.showNode(this.hiddenNode);
			}
			this.hiddenNode = null;
			if (this.currentPageNumber != this.initialPageNumber) {
				var mover, movee;
				var currentPage = this.pageForPageNumber(this.currentPageNumber);
				var otherPage = this.pageForPageNumber(this.currentPageNumber + 1);
				// if moved down, move current page's firstChild to the end of previous page
				if (this.initialPageNumber < this.currentPageNumber) {
					mover = currentPage.hasNode().firstChild;
					otherPage.hasNode().appendChild(mover);
				// if moved up, move current page's lastChild before previous page's firstChild
				} else {
					mover = currentPage.hasNode().lastChild;
					movee = otherPage.hasNode().firstChild;
					otherPage.hasNode().insertBefore(mover, movee);
				}
				this.correctPageSizes();
				this.updatePagePositions(this.initialPageNumber);
			}
		}
	},

	/**
	* Updates indices of list items as needed to preserve reordering.
	*
	* @private
	*/
	updateListIndices: function () {
		// don't do update if we've moved further than one page, refresh instead
		if (this.shouldDoRefresh()) {
			this.refresh();
			this.correctPageSizes();
			return;
		}

		var from = Math.min(this.draggingRowIndex, this.placeholderRowIndex);
		var to = Math.max(this.draggingRowIndex, this.placeholderRowIndex);
		var direction = (this.draggingRowIndex - this.placeholderRowIndex > 0) ? 1 : -1;
		var node, i, newIndex, currentIndex;

		if (direction === 1) {
			node = this.$.generator.fetchRowNode(this.draggingRowIndex);
			if (node) {
				node.setAttribute('data-enyo-index', 'reordered');
			}
			for (i=(to-1),newIndex=to;i>=from;i--) {
				node = this.$.generator.fetchRowNode(i);
				if (!node) {
					continue;
				}
				currentIndex = parseInt(node.getAttribute('data-enyo-index'), 10);
				newIndex = currentIndex + 1;
				node.setAttribute('data-enyo-index', newIndex);
			}
			node = this.hasNode().querySelector('[data-enyo-index="reordered"]');
			node.setAttribute('data-enyo-index', this.placeholderRowIndex);

		} else {
			node = this.$.generator.fetchRowNode(this.draggingRowIndex);
			if (node) {
				node.setAttribute('data-enyo-index', this.placeholderRowIndex);
			}
			for (i=(from+1), newIndex=from;i<=to;i++) {
				node = this.$.generator.fetchRowNode(i);
				if (!node) {
					continue;
				}
				currentIndex = parseInt(node.getAttribute('data-enyo-index'), 10);
				newIndex = currentIndex - 1;
				node.setAttribute('data-enyo-index', newIndex);
			}
		}
	},

	/**
	* Determines whether an item was reordered far enough that it warrants a refresh.
	*
	* @private
	*/
	shouldDoRefresh: function () {
		return (Math.abs(this.initialPageNumber - this.currentPageNumber) > 1);
	},

	/**
	* Gets node height, width, top, and left values.
	*
	* @private
	*/
	getNodeStyle: function (index) {
		var node = this.$.generator.fetchRowNode(index);
		if (!node) {
			return;
		}
		var offset = this.getRelativeOffset(node, this.hasNode());
		var dimensions = dom.getBounds(node);
		return {h: dimensions.height, w: dimensions.width, left: offset.left, top: offset.top};
	},

	/**
	* Gets offset relative to a positioned ancestor node.
	*
	* @private
	*/
	getRelativeOffset: function (n, p) {
		var ro = {top: 0, left: 0};
		if (n !== p && n.parentNode) {
			do {
				ro.top += n.offsetTop || 0;
				ro.left += n.offsetLeft || 0;
				n = n.offsetParent;
			} while (n && n !== p);
		}
		return ro;
	},

	/**
	* Hides the DOM node for the row at `index` and inserts the placeholder node before it.
	*
	* @param {Number} index - The index of the row whose DOM node will be hidden.
	* @private
	*/
	replaceNodeWithPlaceholder: function (index) {
		var node = this.$.generator.fetchRowNode(index);
		if (!node) {
			logger.log('No node - ' + index);
			return;
		}
		// create and style placeholder node
		this.placeholderNode = this.createPlaceholderNode(node);
		// hide existing node
		this.hiddenNode = this.hideNode(node);
		// insert placeholder node where original node was
		var currentPage = this.pageForPageNumber(this.currentPageNumber);
		currentPage.hasNode().insertBefore(this.placeholderNode, this.hiddenNode);
	},

	/**
	* Creates and returns a placeholder node with dimensions matching those of
	* the passed-in node.
	*
	* @param {Node} node - Node on which to base the placeholder dimensions.
	* @private
	*/
	createPlaceholderNode: function (node) {
		var placeholderNode = this.$.placeholder.hasNode().cloneNode(true);
		var nodeDimensions = dom.getBounds(node);
		placeholderNode.style.height = nodeDimensions.height + 'px';
		placeholderNode.style.width = nodeDimensions.width + 'px';
		return placeholderNode;
	},

	/**
	* Removes the placeholder node from the DOM.
	*
	* @private
	*/
	removePlaceholderNode: function () {
		this.removeNode(this.placeholderNode);
		this.placeholderNode = null;
	},

	/**
	* Removes the passed-in node from the DOM.
	*
	* @private
	*/
	removeNode: function (node) {
		if (!node || !node.parentNode) {
			return;
		}
		node.parentNode.removeChild(node);
	},

	/**
	* Updates `this.pageSizes` to support the placeholder node's jumping
	* from one page to the next.
	*
	* @param {Number} pageNumber
	* @private
	*/
	updatePageSize: function (pageNumber) {
		if (pageNumber < 0) {
			return;
		}
		var pageControl = this.pageForPageNumber(pageNumber, true);
		if (pageControl) {
			var s0 = this.pageSizes[pageNumber];
			// FIXME: use height/width depending on orientation
			var pageSize = Math.max(1, pageControl.getBounds().height);
			this.pageSizes[pageNumber] = pageSize;
			this.portSize += pageSize - s0;
		}
	},

	/**
	* Repositions [currentPageNumber]{@link module:layout/List~List#currentPageNumber} and
	* `nextPageNumber` pages to support the placeholder node's jumping from one
	* page to the next.
	*
	* @param {Number} nextPageNumber [description]
	* @private
	*/
	updatePagePositions: function (nextPageNumber) {
		this.positionPage(this.currentPageNumber, this.pageForPageNumber(this.currentPageNumber));
		this.positionPage(nextPageNumber, this.pageForPageNumber(nextPageNumber));
	},

	/**
	* Corrects page sizes array after reorder is complete.
	*
	* @private
	*/
	correctPageSizes: function () {
		var initPageNumber = this.initialPageNumber%2;
		this.updatePageSize(this.currentPageNumber, this.$['page'+this.currentPage]);
		if (initPageNumber != this.currentPageNumber) {
			this.updatePageSize(this.initialPageNumber, this.$['page'+initPageNumber]);
		}
	},

	/**
	* Hides a DOM node.
	*
	* @private
	*/
	hideNode: function (node) {
		node.style.display = 'none';
		return node;
	},

	/**
	* Shows a DOM node.
	*
	* @private
	*/
	showNode: function (node) {
		node.style.display = 'block';
		return node;
	},

	/**
	* Called by client code to finalize a pinned mode reordering, e.g., when the "Drop"
	* button is pressed on the pinned placeholder row.
	*
	* @todo Seems incorrect to have an event on the signature for a public API
	* @param {Object} event - A mouse/touch event.
	* @public
	*/
	dropPinnedRow: function (event) {
		// animate reorder container to proper position and then complete reording actions
		this.moveReorderedContainerToDroppedPosition(event);
		this.completeReorderTimeout = setTimeout(
			this.bindSafely(this.completeFinishReordering, event), 100);
		return;
	},

	/**
	* Called by client code to cancel a pinned mode reordering.
	*
	* @todo Seems incorrect to have an event on the signature for a public API
	* @param {Object} event - A mouse/touch event.
	* @public
	*/
	cancelPinnedMode: function (event) {
		// make it look like we're dropping in original location
		this.placeholderRowIndex = this.draggingRowIndex;
		this.dropPinnedRow(event);
	},

	/**
	* Returns the row index that is under the given `y`-position on the page.  If the
	* position is off the end of the list, `this.count` is returned. If the position
	* is before the start of the list, `-1` is returned.
	*
	* @param {Number} y - `y` position in pixels in relation to the page.
	* @return {Number}  - The index of the row at the specified position.
	* @private
	*/
	getRowIndexFromCoordinate: function (y) {
		// FIXME: this code only works with vertical lists
		var cursorPosition = this.getScrollTop() + y - dom.calcNodePosition(this.hasNode()).top;
		// happens if we try to drag past top of list
		if (cursorPosition < 0) {
			return -1;
		}
		var pageInfo = this.positionToPageInfo(cursorPosition);
		var rows = (pageInfo.no == this.p0) ? this.p0RowBounds : this.p1RowBounds;
		// might have only rendered one page, so catch that here
		if (!rows) {
			return this.count;
		}
		var posOnPage = pageInfo.pos;
		var placeholderHeight = this.placeholderNode ? dom.getBounds(this.placeholderNode).height : 0;
		var totalHeight = 0;
		for (var i=pageInfo.startRow; i <= pageInfo.endRow; ++i) {
			// do extra check for row that has placeholder as we'll return -1 here for no match
			if (i === this.placeholderRowIndex) {
				// for placeholder
				totalHeight += placeholderHeight;
				if (totalHeight >= posOnPage) {
					return -1;
				}
			}
			// originally dragged row is hidden, so don't count it
			if (i !== this.draggingRowIndex) {
				totalHeight += rows[i].height;
				if (totalHeight >= posOnPage) {
					return i;
				}
			}
		}
		return i;
	},

	/**
	* Gets the position of a node (identified via index) on the page.
	*
	* @return {Object} The position of the row node.
	* @private
	*/
	getIndexPosition: function (index) {
		return dom.calcNodePosition(this.$.generator.fetchRowNode(index));
	},

	/**
	* Sets the specified control's position to match that of the list row at `index`.
	*
	* @param {module:enyo/Control~Control} item - The control to reposition.
	* @param {Number} index      - The index of the row whose position is to be matched.
	* @private
	*/
	setItemPosition: function (item, index) {
		var clonedNodeStyle = this.getNodeStyle(index);
		var top = (this.getStrategyKind() == 'ScrollStrategy') ? clonedNodeStyle.top : clonedNodeStyle.top - this.getScrollTop();
		var styleStr = 'top:'+top+'px; left:'+clonedNodeStyle.left+'px;';
		item.addStyles(styleStr);
	},

	/**
	* Sets the specified control's width and height to match those of the list row at `index`.
	*
	* @param {module:enyo/Control~Control} item - The control to reposition.
	* @param {Number} index      - The index of the row whose width and height are to be matched.
	* @private
	*/
	setItemBounds: function (item, index) {
		var clonedNodeStyle = this.getNodeStyle(index);
		var styleStr = 'width:'+clonedNodeStyle.w+'px; height:'+clonedNodeStyle.h+'px;';
		item.addStyles(styleStr);
	},

	/**
	* When in pinned reorder mode, repositions the pinned placeholder when the
	* user has scrolled far enough.
	*
	* @private
	*/
	reorderScroll: function (sender, e) {
		// if we are using the standard scroll strategy, we have to move the pinned row with the scrolling
		if (this.getStrategyKind() == 'ScrollStrategy') {
			this.$.reorderContainer.addStyles('top:'+(this.initialPinPosition+this.getScrollTop()-this.rowSize)+'px;');
		}
		// y coordinate on screen of the pinned item doesn't change as we scroll things
		this.updatePlaceholderPosition(this.initialPinPosition);
	},

	/**
	* @private
	*/
	hideReorderingRow: function () {
		var hiddenNode = this.hasNode().querySelector('[data-enyo-index="' + this.draggingRowIndex + '"]');
		// hide existing node
		if (hiddenNode) {
			this.hiddenNode = this.hideNode(hiddenNode);
		}
	},

	/**
	* @private
	*/
	isReordering: function () {
		return (this.draggingRowIndex > -1);
	},

	/**
		---- Swipeable functionality ------------
	*/

	/**
	* @private
	*/
	isSwiping: function () {
		// we're swiping when the index is set and we're not in the middle of completing or backing out a swipe
		return (this.swipeIndex != null && !this.swipeComplete && this.swipeDirection != null);
	},

	/**
	* When a drag starts, gets the direction of the drag as well as the index
	* of the item being dragged, and resets any pertinent values. Then kicks
	* off the swipe sequence.
	*
	* @private
	*/
	swipeDragStart: function (sender, event) {
		// if we're not on a row or the swipe is vertical or if we're in the middle of reordering, just say no
		if (event.index == null || event.vertical) {
			return true;
		}

		// if we are waiting to complete a swipe, complete it
		if (this.completeSwipeTimeout) {
			this.completeSwipe(event);
		}

		// reset swipe complete flag
		this.swipeComplete = false;

		if (this.swipeIndex != event.index) {
			this.clearSwipeables();
			this.swipeIndex = event.index;
		}
		this.swipeDirection = event.xDirection;

		// start swipe sequence only if we are not currently showing a persistent item
		if (!this.persistentItemVisible) {
			this.startSwipe(event);
		}

		// reset dragged distance (for dragfinish)
		this.draggedXDistance = 0;
		this.draggedYDistance = 0;

		return true;
	},

	/**
	* When a drag is in progress, updates the position of the swipeable
	* container based on the `ddx` of the event.
	*
	* @private
	*/
	swipeDrag: function (sender, event) {
		// if a persistent swipeableItem is still showing, handle it separately
		if (this.persistentItemVisible) {
			this.dragPersistentItem(event);
			return this.preventDragPropagation;
		}
		// early exit if there's no matching dragStart to set item
		if (!this.isSwiping()) {
			return false;
		}
		// apply new position
		this.dragSwipeableComponents(this.calcNewDragPosition(event.ddx));
		// save dragged distance (for dragfinish)
		this.draggedXDistance = event.dx;
		this.draggedYDistance = event.dy;
		// save last meaningful (non-zero) and new direction (for swipeDragFinish)
		if (event.xDirection != this.lastSwipeDirection && event.xDirection) {
			this.lastSwipeDirection = event.xDirection;
		}
		return true;
	},

	/*
	* When the current drag completes, decides whether to complete the swipe
	* based on how far the user pulled the swipeable container.
	*
	* @private
	*/
	swipeDragFinish: function (sender, event) {
		// if a persistent swipeableItem is still showing, complete drag away or bounce
		if (this.persistentItemVisible) {
			this.dragFinishPersistentItem(event);
		// early exit if there's no matching dragStart to set item
		} else if (!this.isSwiping()) {
			return false;
		// otherwise if user dragged more than 20% of the width, complete the swipe. if not, back out.
		} else {
			var percentageDragged = this.calcPercentageDragged(this.draggedXDistance);
			if ((percentageDragged > this.percentageDraggedThreshold) && (this.lastSwipeDirection === this.swipeDirection)) {
				this.swipe(this.fastSwipeSpeedMS);
			} else {
				this.backOutSwipe(event);
			}
		}

		return this.preventDragPropagation;
	},

	/**
	* Reorder takes precedence over swipes, and not having it turned on or swipeable controls
	* defined also disables this.
	*
	* @private
	*/
	isSwipeable: function () {
		return this.enableSwipe && this.$.swipeableComponents.controls.length !== 0 &&
			!this.isReordering() && !this.pinnedReorderMode;
	},

	/**
	* Positions the swipeable components block at the current row.
	*
	* @param {Number} index      - The row index.
	* @param {Number} xDirection - Value of `xDirection` from drag event (`1` = right,
	* `-1` = left).
	* @private
	*/
	positionSwipeableContainer: function (index, xDirection) {
		var node = this.$.generator.fetchRowNode(index);
		if (!node) {
			return;
		}
		var offset = this.getRelativeOffset(node, this.hasNode());
		var dimensions = dom.getBounds(node);
		var x = (xDirection == 1) ? -1*dimensions.width : dimensions.width;
		this.$.swipeableComponents.addStyles('top: '+offset.top+'px; left: '+x+'px; height: '+dimensions.height+'px; width: '+dimensions.width+'px;');
	},

	/**
	* Calculates new position for the swipeable container based on the user's
	* drag action. Don't allow the container to drag beyond either edge.
	*
	* @param {Number} dx - Amount of change in `x` position.
	* @return {Number}
	* @private
	*/
	calcNewDragPosition: function (dx) {
		var parentBounds = this.$.swipeableComponents.getBounds();
		var xPos = parentBounds.left;
		var dimensions = this.$.swipeableComponents.getBounds();
		var xlimit = (this.swipeDirection == 1) ? 0 : -1*dimensions.width;
		var x = (this.swipeDirection == 1)
			? (xPos + dx > xlimit)
				? xlimit
				: xPos + dx
			: (xPos + dx < xlimit)
				? xlimit
				: xPos + dx;
		return x;
	},

	/**
	* Positions the swipeable components.
	*
	* @param {Number} x - New `left` position.
	* @private
	*/
	dragSwipeableComponents: function (x) {
		this.$.swipeableComponents.applyStyle('left',x+'px');
	},

	/**
	* Begins swiping sequence by positioning the swipeable container and
	* bubbling the `setupSwipeItem` event.
	*
	* @param {Object} e - Event
	* @fires module:layout/List~List#onSetupSwipeItem
	* @private
	*/
	startSwipe: function (e) {
		// modify event index to always have this swipeItem value
		e.index = this.swipeIndex;
		this.positionSwipeableContainer(this.swipeIndex, e.xDirection);
		this.$.swipeableComponents.setShowing(true);
		this.setPersistentItemOrigin(e.xDirection);
		this.doSetupSwipeItem(e);
	},

	/**
	* If a persistent swipeableItem is still showing, drags it away or bounces it.
	*
	* @param {Object} e - Event
	* @private
	*/
	dragPersistentItem: function (e) {
		var xPos = 0;
		var x = (this.persistentItemOrigin == 'right')
			? Math.max(xPos, (xPos + e.dx))
			: Math.min(xPos, (xPos + e.dx));
		this.$.swipeableComponents.applyStyle('left',x+'px');
	},

	/**
	* If a persistent swipeableItem is still showing, completes drag away or bounce.
	*
	* @param {Object} e - Event
	* @private
	*/
	dragFinishPersistentItem: function (e) {
		var completeSwipe = (this.calcPercentageDragged(e.dx) > 0.2);
		var dir = (e.dx > 0) ? 'right' : (e.dx < 0) ? 'left' : null;
		if (this.persistentItemOrigin == dir) {
			if (completeSwipe) {
				this.slideAwayItem();
			} else {
				this.bounceItem(e);
			}
		} else {
			this.bounceItem(e);
		}
	},

	/**
	* @private
	*/
	setPersistentItemOrigin: function (xDirection) {
		this.persistentItemOrigin = xDirection == 1 ? 'left' : 'right';
	},

	/**
	* @private
	*/
	calcPercentageDragged: function (dx) {
		return Math.abs(dx/this.$.swipeableComponents.getBounds().width);
	},

	/**
	* Completes a swipe animation in the specified number of milliseconds.
	*
	* @param {Number} speed - Time in milliseconds.
	* @private
	*/
	swipe: function (speed) {
		this.swipeComplete = true;
		this.animateSwipe(0, speed);
	},

	/**
	* @private
	*/
	backOutSwipe: function () {
		var dimensions = this.$.swipeableComponents.getBounds();
		var x = (this.swipeDirection == 1) ? -1*dimensions.width : dimensions.width;
		this.animateSwipe(x, this.fastSwipeSpeedMS);
		this.swipeDirection = null;
	},

	/**
	* Returns persisted swipeable components to being visible if not dragged back
	* beyond threshold.
	*
	* @private
	*/
	bounceItem: function () {
		var bounds = this.$.swipeableComponents.getBounds();
		if (bounds.left != bounds.width) {
			this.animateSwipe(0, this.normalSwipeSpeedMS);
		}
	},

	/**
	* Animates the swipeable components away starting from their current position.
	*
	* @private
	*/
	slideAwayItem: function () {
		var $item = this.$.swipeableComponents;
		var parentWidth = $item.getBounds().width;
		var xPos = (this.persistentItemOrigin == 'left') ? -1*parentWidth : parentWidth;
		this.animateSwipe(xPos, this.normalSwipeSpeedMS);
		this.persistentItemVisible = false;
		this.setPersistSwipeableItem(false);
	},

	/**
	* Hides the swipeable components.
	*
	* @private
	*/
	clearSwipeables: function () {
		this.$.swipeableComponents.setShowing(false);
		this.persistentItemVisible = false;
		this.setPersistSwipeableItem(false);
	},

	/**
	* Completes swipe and hides active swipeable item.
	*
	* @fires module:layout/List~List#onSwipeComplete
	* @private
	*/
	completeSwipe: function () {
		if (this.completeSwipeTimeout) {
			clearTimeout(this.completeSwipeTimeout);
			this.completeSwipeTimeout = null;
		}
		// if this wasn't a persistent item, hide it upon completion and send swipe complete event
		if (!this.getPersistSwipeableItem()) {
			this.$.swipeableComponents.setShowing(false);
			// if the swipe was completed, update the current row and bubble swipeComplete event
			if (this.swipeComplete) {
				this.doSwipeComplete({index: this.swipeIndex, xDirection: this.swipeDirection});
			}
		} else {
			// persistent item will only be visible if the swipe was completed
			if (this.swipeComplete) {
				this.persistentItemVisible = true;
			}
		}
		this.swipeIndex = null;
		this.swipeDirection = null;
	},

	/**
	* Animates a swipe starting from the current position to the specified new
	* position `(targetX)` over the specified length of time `(totalTimeMS)`.
	*
	* @param {Number} targetX     - The target `left` position.
	* @param {Number} totalTimeMS - Time in milliseconds.
	* @private
	*/
	animateSwipe: function (targetX, totalTimeMS) {
		var t0 = utils.now();
		var $item = this.$.swipeableComponents;
		var origX = parseInt($item.getBounds().left, 10);
		var xDelta = targetX - origX;

		this.stopAnimateSwipe();

		var fn = this.bindSafely(function () {
			var t = utils.now() - t0;
			var percTimeElapsed = t/totalTimeMS;
			var currentX = origX + (xDelta)*Math.min(percTimeElapsed,1);

			// set new left
			$item.applyStyle('left', currentX+'px');

			// schedule next frame
			this.job = animation.requestAnimationFrame(fn);

			// potentially override animation TODO

			// go until we've hit our total time
			if (t/totalTimeMS >= 1) {
				this.stopAnimateSwipe();
				this.completeSwipeTimeout = setTimeout(this.bindSafely(function () {
					this.completeSwipe();
				}), this.completeSwipeDelayMS);
			}
		});

		this.job = animation.requestAnimationFrame(fn);
	},

	/**
	* Cancels the active swipe animation.
	*
	* @private
	*/
	stopAnimateSwipe: function () {
		if (this.job) {
			this.job = animation.cancelAnimationFrame(this.job);
		}
	}
};

}],'layout/Arranger':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/Arranger~Arranger} kind.
* @module layout/Arranger
*/

var
	kind = require('enyo/kind'),
	utils = require('enyo/utils'),
	platform = require('enyo/platform');

var
	Layout = require('enyo/Layout'),
	Dom = require('enyo/dom');

/**
* {@link module:layout/Arranger~Arranger} is an {@link module:enyo/Layout~Layout} that considers one of the
* controls it lays out as active. The other controls are placed relative to
* the active control as makes sense for the layout.
*
* `layout/Arranger` supports dynamic layouts, meaning it's possible to transition
* between an arranger's layouts	via animation. Typically, arrangers should lay out
* controls using CSS transforms, since these are optimized for animation. To
* support this, the controls in an arranger are absolutely positioned, and
* the Arranger kind has an [accelerated]{@link module:layout/Arranger~Arranger#accelerated} property,
* which marks controls for CSS compositing. The default setting of `'auto'` ensures
* that this will occur if enabled by the platform.
*
* For more information, see the documentation on
* [Arrangers]{@linkplain $dev-guide/building-apps/layout/arrangers.html} in the
* Enyo Developer Guide.
*
* @class Arranger
* @extends module:enyo/Layout~Layout
* @public
*/
var Arranger = module.exports = kind(
	/** @lends module:layout/Arranger~Arranger.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Arranger',

	/**
	* @private
	*/
	kind: Layout,

	/**
	* @private
	*/
	layoutClass: 'enyo-arranger',

	/**
	* Flag indicating whether the Arranger should lay out controls using CSS
	* compositing. The default setting `('auto')` will mark controls for compositing
	* if the platform supports it.
	*
	* @type {String|Boolean}
	* @default 'auto'
	* @protected
	*/
	accelerated: 'auto',

	/**
	* A property of the drag event, used to calculate the amount that a drag will
	* move the layout.
	*
	* @type {String}
	* @default 'ddx'
	* @private
	*/
	dragProp: 'ddx',

	/**
	* A property of the drag event, used to calculate the direction of the drag.
	*
	* @type {String}
	* @default 'xDirection'
	* @private
	*/
	dragDirectionProp: 'xDirection',

	/**
	* A property of the drag event, used to calculate whether a drag should occur.
	*
	* @type {String}
	* @default 'horizontal'
	* @private
	*/
	canDragProp: 'horizontal',

	/**
	* If set to `true`, transitions between non-adjacent arrangements will go
	* through the intermediate arrangements. This is useful when direct
	* transitions between arrangements would be visually jarring.
	*
	* @type {Boolean}
	* @default false
	* @protected
	*/
	incrementalPoints: false,

	/**
	* Called when removing an arranger (e.g., when switching a Panels control to a
	* different `arrangerKind`). Subkinds should implement this function to reset
	* whatever properties they've changed on child controls. Note that you **must**
	* call the superkind implementation in your subkind's `destroy()` function.
	*
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			var c$ = this.container.getPanels();
			for (var i=0, c; (c=c$[i]); i++) {
				c._arranger = null;
			}
			sup.apply(this, arguments);
		};
	}),

	/**
	* Arranges the given array of `controls` in the layout specified by `index`. When
	* implementing this method, rather than applying styling directly to controls, call
	* [arrangeControl()]{@link module:layout/Arranger~Arranger#arrangeControl} and pass in an arrangement
	* object with styling settings. The styles will then be applied via
	* [flowControl()]{@link module:layout/Arranger~Arranger#flowControl}.
	*
	* @param {module:enyo/Control~Control[]} controls
	* @param {Number} index
	* @virtual
	* @protected
	*/
	arrange: function (controls, index) {
	},

	/**
	* Sizes the controls in the layout. This method is called only at reflow time.
	* Note that the sizing operation has been separated from the layout done in
	* [arrange()]{@link module:layout/Arranger~Arranger#arrange} because it is expensive and not suitable
	* for dynamic layout.
	*
	* @virtual
	* @protected
	*/
	size: function () {
	},

	/**
	* Called when a layout transition begins. Implement this method to perform
	* tasks that should only occur when a transition starts; for example, some
	* controls might be shown or hidden. In addition, the `transitionPoints`
	* array may be set on the container to dictate the named arrangements
	* between which the transition occurs.
	*
	* @protected
	*/
	start: function () {
		var f = this.container.fromIndex, t = this.container.toIndex;
		var p$ = this.container.transitionPoints = [f];
		// optionally add a transition point for each index between from and to.
		if (this.incrementalPoints) {
			var d = Math.abs(t - f) - 2;
			var i = f;
			while (d >= 0) {
				i = i + (t < f ? -1 : 1);
				p$.push(i);
				d--;
			}
		}
		p$.push(this.container.toIndex);
	},

	/**
	* Called when a layout transition completes. Implement this method to
	* perform tasks that should only occur when a transition ends; for
	* example, some controls might be shown or hidden.
	*
	* @virtual
	* @protected
	*/
	finish: function () {
	},

	/**
	* Called when dragging the layout, this method returns the difference in
	* pixels between the arrangement `a0` for layout setting `i0`	and
	* arrangement `a1` for layout setting `i1`. This data is used to calculate
	* the percentage that a drag should move the layout between two active states.
	*
	* @param {Number} i0 - The initial layout setting.
	* @param {Object} a0 - The initial arrangement.
	* @param {Number} i1 - The target layout setting.
	* @param {Object} a1 - The target arrangement.
	* @virtual
	* @protected
	*/
	calcArrangementDifference: function (i0, a0, i1, a1) {
	},

	/**
	* @private
	*/
	canDragEvent: function (event) {
		return event[this.canDragProp];
	},

	/**
	* @private
	*/
	calcDragDirection: function (event) {
		return event[this.dragDirectionProp];
	},

	/**
	* @private
	*/
	calcDrag: function (event) {
		return event[this.dragProp];
	},

	/**
	* @private
	*/
	drag: function (dp, an, a, bn, b) {
		var f = this.measureArrangementDelta(-dp, an, a, bn, b);
		return f;
	},

	/**
	* @private
	*/
	measureArrangementDelta: function (x, i0, a0, i1, a1) {
		var d = this.calcArrangementDifference(i0, a0, i1, a1);
		var s = d ? x / Math.abs(d) : 0;
		s = s * (this.container.fromIndex > this.container.toIndex ? -1 : 1);
		return s;
	},

	/**
	* Arranges the panels, with the panel at `index` being designated as active.
	*
	* @param  {Number} index - The index of the active panel.
	* @private
	*/
	_arrange: function (index) {
		// guard against being called before we've been rendered
		if (!this.containerBounds) {
			this.reflow();
		}
		var c$ = this.getOrderedControls(index);
		this.arrange(c$, index);
	},

	/**
	* Arranges `control` according to the specified `arrangement`.
	*
	* Note that this method doesn't actually modify `control` but rather sets the
	* arrangement on a private member of the control to be retrieved by
	* {@link module:layout/Panels~Panels}.
	*
	* @param  {module:enyo/Control~Control} control
	* @param  {Object} arrangement
	* @private
	*/
	arrangeControl: function (control, arrangement) {
		control._arranger = utils.mixin(control._arranger || {}, arrangement);
	},

	/**
	* Called before HTML is rendered. Applies CSS to panels to ensure GPU acceleration if
	* [accelerated]{@link module:layout/Arranger~Arranger#accelerated} is `true`.
	*
	* @private
	*/
	flow: function () {
		this.c$ = [].concat(this.container.getPanels());
		this.controlsIndex = 0;
		for (var i=0, c$=this.container.getPanels(), c; (c=c$[i]); i++) {
			Dom.accelerate(c, !c.preventAccelerate && this.accelerated);
			if (platform.safari) {
				// On Safari-desktop, sometimes having the panel's direct child set to accelerate isn't sufficient
				// this is most often the case with Lists contained inside another control, inside a Panels
				var grands=c.children;
				for (var j=0, kid; (kid=grands[j]); j++) {
					Dom.accelerate(kid, this.accelerated);
				}
			}
		}
	},

	/**
	* Called during "rendered" phase to [size]{@link module:layout/Arranger~Arranger#size} the controls.
	*
	* @private
	*/
	reflow: function () {
		var cn = this.container.hasNode();
		this.containerBounds = cn ? {width: cn.clientWidth, height: cn.clientHeight} : {};
		this.size();
	},

	/**
	* If the {@link module:layout/Panels~Panels} has an arrangement, flows each control according to that
	* arrangement.
	*
	* @private
	*/
	flowArrangement: function () {
		var a = this.container.arrangement;
		if (a) {
			for (var i=0, c$=this.container.getPanels(), c; (c=c$[i]) && (a[i]); i++) {
				this.flowControl(c, a[i]);
			}
		}
	},
	/**
	* Lays out the given `control` according to the settings stored in the
	* `arrangement` object. By default, `flowControl()` will apply settings for
	* `left`, `top`, and `opacity`. This method should only be implemented to apply
	* other settings made via [arrangeControl()]{@link module:layout/Arranger~Arranger#arrangeControl}.
	*
	* @param {module:enyo/Control~Control} control - The control to be laid out.
	* @param {Object} arrangement - An object whose members specify the layout settings.
	* @protected
	*/
	flowControl: function (control, arrangement) {
		Arranger.positionControl(control, arrangement);
		var o = arrangement.opacity;
		if (o != null) {
			Arranger.opacifyControl(control, o);
		}
	},

	/**
	* Gets an array of controls arranged in state order.
	* note: optimization, dial around a single array.
	*
	* @param  {Number} index     - The index of the active panel.
	* @return {module:enyo/Control~Control[]}   - Ordered array of controls.
	* @private
	*/
	getOrderedControls: function (index) {
		var whole = Math.floor(index);
		var a = whole - this.controlsIndex;
		var sign = a > 0;
		var c$ = this.c$ || [];
		for (var i=0; i<Math.abs(a); i++) {
			if (sign) {
				c$.push(c$.shift());
			} else {
				c$.unshift(c$.pop());
			}
		}
		this.controlsIndex = whole;
		return c$;
	}
});

/**
* Positions a control via transform--`translateX/translateY` if supported,
* falling back to `left/top` if not.
*
* @lends module:layout/Arranger~Arranger
* @param  {module:enyo/Control~Control} control - The control to position.
* @param  {Object} bounds        - The new bounds for `control`.
* @param  {String} unit          - The unit for `bounds` members.
* @public
*/
Arranger.positionControl = function (control, bounds, unit) {
	unit = unit || 'px';
	if (!this.updating) {
		// IE10 uses setBounds because of control hit caching problems seem in some apps
		if (Dom.canTransform() && !control.preventTransform && platform.ie !== 10) {
			var l = bounds.left, t = bounds.top;
			l = utils.isString(l) ? l : l && (l + unit);
			t = utils.isString(t) ? t : t && (t + unit);
			Dom.transform(control, {translateX: l || null, translateY: t || null});
		} else {
			// If a previously positioned control has subsequently been marked with
			// preventTransform, we need to clear out any old translation values.
			if (Dom.canTransform() && control.preventTransform) {
				Dom.transform(control, {translateX: null, translateY: null});
			}
			control.setBounds(bounds, unit);
		}
	}
};

/**
* Sets the opacity value for a given control.
*
* @lends module:layout/Arranger~Arranger
* @param {module:enyo/Control~Control} inControl - The control whose opacity is to be set.
* @param {Number} inOpacity - The new opacity value for the control.
* @public
*/
Arranger.opacifyControl = function (inControl, inOpacity) {
	// FIXME: very high/low settings of opacity can cause a control to
	// blink so cap this here.
	inControl.applyStyle('opacity', inOpacity > 0.99 ? 1 : (inOpacity < 0.01 ? 0 : inOpacity));
};

}],'layout/CarouselArranger':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/CarouselArranger~CarouselArranger} kind.
* @module layout/CarouselArranger
*/

var
	kind = require('enyo/kind'),
	dom = require('enyo/dom');

var
	Arranger = require('./Arranger');

/**
* {@link module:layout/CarouselArranger~CarouselArranger} is a
* {@link module:layout/Arranger~Arranger} that displays the active control,
* along with some number of inactive controls to fill the available space. The
* active control is positioned on the left side of the container, and the rest
* of the views are laid out to the right.
*
* One of the controls may have `fit: true` set, in which case it will take up
* any remaining space after all of the other controls have been sized.
*
* For best results with CarouselArranger, you should set a minimum width for
* each control via a CSS style, e.g., `min-width: 25%` or `min-width: 250px`.
*
* Transitions between arrangements are handled by sliding the new controls in
* from the right and sliding the old controls off to the left.
*
* For more information, see the documentation on
* [Arrangers]{@linkplain $dev-guide/building-apps/layout/arrangers.html} in the
* Enyo Developer Guide.
*
* @class CarouselArranger
* @extends module:layout/Arranger~Arranger
* @public
*/
module.exports = kind(
	/** @lends module:layout/CarouselArranger~CarouselArranger */ {

	/**
	* @private
	*/
	name: 'enyo.CarouselArranger',

	/**
	* @private
	*/
	kind: Arranger,

	/**
	* Calculates the size of each panel. Considers the padding of the container by calling
	* {@link module:enyo/dom#calcPaddingExtents} and control margin by calling
	* {@link module:enyo/dom#calcMarginExtents}. If the container is larger than the combined sizes of
	* the controls, one control may be set to fill the remaining space by setting its `fit`
	* property to `true`. If multiple controls have `fit: true` set, the last control to be so
	* marked will have precedence.
	*
	* @protected
	*/
	size: function () {
		var c$ = this.container.getPanels();
		var padding = this.containerPadding = this.container.hasNode() ? dom.calcPaddingExtents(this.container.node) : {};
		var pb = this.containerBounds;
		var i, e, s, m, c;
		pb.height -= padding.top + padding.bottom;
		pb.width -= padding.left + padding.right;
		// used space
		var fit;
		for (i=0, s=0; (c=c$[i]); i++) {
			m = dom.calcMarginExtents(c.hasNode());
			c.width = c.getBounds().width;
			c.marginWidth = m.right + m.left;
			s += (c.fit ? 0 : c.width) + c.marginWidth;
			if (c.fit) {
				fit = c;
			}
		}
		if (fit) {
			var w = pb.width - s;
			fit.width = w >= 0 ? w : fit.width;
		}
		for (i=0, e=padding.left; (c=c$[i]); i++) {
			c.setBounds({top: padding.top, bottom: padding.bottom, width: c.fit ? c.width : null});
		}
	},

	/**
	* @see {@link module:layout/Arranger~Arranger#arrange}
	* @protected
	*/
	arrange: function (controls, arrangement) {
		if (this.container.wrap) {
			this.arrangeWrap(controls, arrangement);
		} else {
			this.arrangeNoWrap(controls, arrangement);
		}
	},

	/**
	* A non-wrapping carousel arranges the controls from left to right without regard to the
	* ordered array passed via `controls`. `arrangement` will contain the index of the active
	* panel.
	*
	* @private
	*/
	arrangeNoWrap: function (controls, arrangement) {
		var i, aw, cw, c;
		var c$ = this.container.getPanels();
		var s = this.container.clamp(arrangement);
		var nw = this.containerBounds.width;
		// do we have enough content to fill the width?
		for (i=s, cw=0; (c=c$[i]); i++) {
			cw += c.width + c.marginWidth;
			if (cw > nw) {
				break;
			}
		}
		// if content width is less than needed, adjust starting point index and offset
		var n = nw - cw;
		var o = 0;
		if (n > 0) {
			for (i=s-1, aw=0; (c=c$[i]); i--) {
				aw += c.width + c.marginWidth;
				if (n - aw <= 0) {
					o = (n - aw);
					s = i;
					break;
				}
			}
		}
		// arrange starting from needed index with detected offset so we fill space
		var w, e;
		for (i=0, e=this.containerPadding.left + o; (c=c$[i]); i++) {
			w = c.width + c.marginWidth;
			if (i < s) {
				this.arrangeControl(c, {left: -w});
			} else {
				this.arrangeControl(c, {left: Math.floor(e)});
				e += w;
			}
		}
	},

	/**
	* Arranges `controls` from left to right such that the active panel is always the
	* leftmost, with subsequent panels positioned to its right.
	*
	* @private
	*/
	arrangeWrap: function (controls, arrangement) {
		for (var i=0, e=this.containerPadding.left, c; (c=controls[i]); i++) {
			this.arrangeControl(c, {left: e});
			e += c.width + c.marginWidth;
		}
	},

	/**
	* Calculates the change in `left` position between the two arrangements `a0` and `a1`.
	* @protected
	*/
	calcArrangementDifference: function (i0, a0, i1, a1) {
		var i = Math.abs(i0 % this.c$.length);
		return a0[i].left - a1[i].left;
	},

	/**
	* Resets the size and position of all panels.
	*
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			var c$ = this.container.getPanels();
			for (var i=0, c; (c=c$[i]); i++) {
				Arranger.positionControl(c, {left: null, top: null});
				c.applyStyle('top', null);
				c.applyStyle('bottom', null);
				c.applyStyle('left', null);
				c.applyStyle('width', null);
			}
			sup.apply(this, arguments);
		};
	})
});

},{'./Arranger':'layout/Arranger'}],'layout/CardArranger':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/CardArranger~CardArranger} kind.
* @module layout/CardArranger
*/

var
	kind = require('enyo/kind');

var
	Arranger = require('./Arranger');


/**
* {@link module:layout/CardArranger~CardArranger} is a {@link module:layout/Arranger~Arranger}
* that displays only one active control. The non-active controls are hidden with
* `setShowing(false)`. Transitions between arrangements are handled by fading
* from one control to the next.
*
* For more information, see the documentation on
* [Arrangers]{@linkplain $dev-guide/building-apps/layout/arrangers.html} in the
* Enyo Developer Guide.
*
* @class CardArranger
* @extends module:layout/Arranger~Arranger
* @public
*/
module.exports = kind(
	/** @lends module:layout/CardArranger~CardArranger.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.CardArranger',

	/**
	* @private
	*/
	kind: Arranger,

	/**
	* @private
	*/
	layoutClass: 'enyo-arranger enyo-arranger-fit',

	/**
	* @see {@link module:layout/Arranger~Arranger#calcArrangementDifference}
	* @protected
	*/
	calcArrangementDifference: function (i0, a0, i1, a1) {
		return this.containerBounds.width;
	},

	/**
	* Applies opacity to the activation and deactivation of panels. Expects the passed-in
	* array of controls to be ordered such that the first control in the array is the active
	* panel.
	*
	* @see {@link module:layout/Arranger~Arranger#arrange}
	* @protected
	*/
	arrange: function (controls, arrangement) {
		for (var i=0, c, v; (c=controls[i]); i++) {
			v = (i === 0) ? 1 : 0;
			this.arrangeControl(c, {opacity: v});
		}
	},

	/**
	* Shows the active panel at the start of transition. Also triggers a resize on
	* the active panel if it wasn't previously showing.
	*
	* @see {@link module:layout/Arranger~Arranger#start}
	* @method
	* @protected
	*/
	start: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			var c$ = this.container.getPanels();
			for (var i=0, c; (c=c$[i]); i++) {
				var wasShowing=c.showing;
				c.setShowing(i == this.container.fromIndex || i == (this.container.toIndex));
				if (c.showing && !wasShowing) {
					c.resize();
				}
			}
		};
	}),

	/**
	* Hides all non-active panels when the transition completes.
	*
	* @see {@link module:layout/Arranger~Arranger#finish}
	* @method
	* @protected
	*/
	finish: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			var c$ = this.container.getPanels();
			for (var i=0, c; (c=c$[i]); i++) {
				c.setShowing(i == this.container.toIndex);
			}
		};
	}),

	/**
	* Ensures all panels are showing and visible when the arranger is destroyed.
	*
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			var c$ = this.container.getPanels();
			for (var i=0, c; (c=c$[i]); i++) {
				Arranger.opacifyControl(c, 1);
				if (!c.showing) {
					c.setShowing(true);
				}
			}
			sup.apply(this, arguments);
		};
	})
});

},{'./Arranger':'layout/Arranger'}],'layout/CollapsingArranger':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/CollapsingArranger~CollapsingArranger} kind.
* @module layout/CollapsingArranger
*/

var
	kind = require('enyo/kind');

var
	CarouselArranger = require('./CarouselArranger');

/**
* {@link module:layout/CollapsingArranger~CollapsingArranger} is a
* {@link module:layout/Arranger~Arranger} that displays the active control,
* along with some number of inactive controls to fill the available space. The
* active control is positioned on the left side of the container and the rest of
* the views are laid out to the right. The last control, if visible, will expand
* to fill whatever space is not taken up by the previous controls.
*
* For best results with CollapsingArranger, you should set a minimum width
* for each control via a CSS style, e.g., `min-width: 25%` or
* `min-width: 250px`.
*
* Transitions between arrangements are handled by sliding the new control	in
* from the right and collapsing the old control to the left.
*
* For more information, see the documentation on
* [Arrangers]{@linkplain $dev-guide/building-apps/layout/arrangers.html} in the
* Enyo Developer Guide.
*
* @class CollapsingArranger
* @extends module:enyo/CarouselArranger~CarouselArranger
* @public
*/
module.exports = kind(
	/** @lends module:layout/CollapsingArranger~CollapsingArranger.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.CollapsingArranger',

	/**
	* @private
	*/
	kind: CarouselArranger,

	/**
	* The distance (in pixels) that each panel should be offset from the left
	* when it is selected. This allows controls on the underlying panel to the
	* left of the selected one to be partially revealed.
	*
	* Note that this is imported from the container at construction time.
	*
	* @public
	*/
	peekWidth: 0,

	/**
	* If a panel is added or removed after construction, ensures that any control
	* marked to fill remaining space (via its `_fit` member) is reset.
	*
	* @see {@link module:layout/Arranger~Arranger#size}
	* @method
	* @protected
	*/
	size: kind.inherit(function (sup) {
		return function () {
			this.clearLastSize();
			sup.apply(this, arguments);
		};
	}),

	/**
	* Resets any panel marked to fill remaining space that isn't, in fact, the last panel.
	*
	* @private
	*/
	clearLastSize: function () {
		for (var i=0, c$=this.container.getPanels(), c; (c=c$[i]); i++) {
			if (c._fit && i != c$.length-1) {
				c.applyStyle('width', null);
				c._fit = null;
			}
		}
	},

	/**
	* @method
	* @private
	*/
	constructor: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.peekWidth = this.container.peekWidth != null ? this.container.peekWidth : this.peekWidth;
		};
	}),

	/**
	* Arranges controls from left to right starting with first panel. If
	* [peekWidth]{@link module:layout/CollapsingArranger~CollapsingArranger#peekWidth} is set, any visible control
	* whose index is less than `arrangement` (the active panel's index) will be revealed
	* by `peekWidth` pixels.
	*
	* @see {@link module:layout/Arranger~Arranger#arrange}
	* @protected
	*/
	arrange: function (controls, arrangement) {
		var c$ = this.container.getPanels();
		for (var i=0, e=this.containerPadding.left, c, n=0; (c=c$[i]); i++) {
			if(c.getShowing()){
				this.arrangeControl(c, {left: e + n * this.peekWidth});
				if (i >= arrangement) {
					e += c.width + c.marginWidth - this.peekWidth;
				}
				n++;
			} else {
				this.arrangeControl(c, {left: e});
				if (i >= arrangement) {
					e += c.width + c.marginWidth;
				}
			}
			// FIXME: overdragging-ish
			if (i == c$.length - 1 && arrangement < 0) {
				this.arrangeControl(c, {left: e - arrangement});
			}
		}
	},

	/**
	* Calculates the change in `left` position of the last panel between the two
	* arrangements `a0` and `a1`.
	*
	* @see {@link module:layout/Arranger~Arranger#calcArrangementDifference}
	* @private
	*/
	calcArrangementDifference: function (i0, a0, i1, a1) {
		var i = this.container.getPanels().length-1;
		return Math.abs(a1[i].left - a0[i].left);
	},

	/**
	* If the container's `realtimeFit` property is `true`, resizes the last panel to
	* fill the space. This ensures that when dragging or animating to the last index,
	* there is never blank space to the right of the last panel. If `realtimeFit` is
	* falsy, the last panel is not resized until the
	* [finish()]{@link module:layout/CollapsingArranger~CollapsingArranger#finish} method is called.
	*
	* @see {@link module:layout/Arranger~Arranger#flowControls}
	* @method
	* @private
	*/
	flowControl: kind.inherit(function (sup) {
		return function (inControl, inA) {
			sup.apply(this, arguments);
			if (this.container.realtimeFit) {
				var c$ = this.container.getPanels();
				var l = c$.length-1;
				var last = c$[l];
				if (inControl == last) {
					this.fitControl(inControl, inA.left);
				}
			}

		};
	}),

	/**
	* Ensures that the last panel fills the remaining space when a transition completes.
	*
	* @see {@link module:layout/Arranger~Arranger#finish}
	* @method
	* @private
	*/
	finish: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			if (!this.container.realtimeFit && this.containerBounds) {
				var c$ = this.container.getPanels();
				var a$ = this.container.arrangement;
				var l = c$.length-1;
				var c = c$[l];
				this.fitControl(c, a$[l].left);
			}
		};
	}),

	/**
	* Resizes the given `control` to match the width of the container minus the
	* given `offset`.
	*
	* @param {module:enyo/Control~Control} control - The control that should fit in the remaining space.
	* @param {Number} offset        - The left offset of the control with respect to the
	* container.
	* @private
	*/
	fitControl: function (control, offset) {
		control._fit = true;
		control.applyStyle('width', (this.containerBounds.width - offset) + 'px');
		control.resize();
	}
});

},{'./CarouselArranger':'layout/CarouselArranger'}],'layout/Panels':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/Panels~Panels} kind.
* @module layout/Panels
*/

var
	kind = require('enyo/kind'),
	dispatcher = require('enyo/dispatcher'),
	dom = require('enyo/dom'),
	platform = require('enyo/platform'),
	utils = require('enyo/utils'),
	Animator = require('enyo/Animator');

var
	CardArranger = require('../CardArranger');

/**
* Fires at the start of a panel transition, when [setIndex()]{@link module:layout/Panels~Panels#setIndex}
* is called, and also during dragging.
*
* @event module:layout/Panels~Panels#onTransitionStart
* @type {Object}
* @property {Number} fromIndex - The index of the old panel.
* @property {Number} toIndex   - The index of the new panel.
* @public
*/

/**
* Fires at the end of a panel transition, when [setIndex()]{@link module:layout/Panels~Panels#setIndex}
* is called, and also during dragging.
*
* @event module:layout/Panels~Panels#onTransitionFinish
* @type {Object}
* @property {Number} fromIndex - The index of the old panel.
* @property {Number} toIndex   - The index of the new panel.
* @public
*/

/**
* The {@link module:layout/Panels~Panels} kind is designed to satisfy a variety of common use cases
* for application layout. Using `Panels`, controls may be arranged as (among
* other things) a carousel, a set of collapsing panels, a card stack that fades
* between panels, or a grid.
*
* Any Enyo control may be placed inside a `Panels`, but by convention we
* refer to each of these controls as a "panel". From the set of panels in a
* `Panels`, one is considered to be active. The active panel is set by index
* using the [setIndex()]{@link module:layout/Panels~Panels#setIndex} method. The actual layout of
* the panels typically changes each time the active panel is set, such that the new
* active panel has the most prominent position.
*
* For more information, see the documentation on
* [Panels]{@linkplain $dev-guide/building-apps/layout/panels.html} in the
* Enyo Developer Guide.
*
* @class Panels
* @extends module:enyo/Control~Control
* @ui
* @public
*/
var Panels = module.exports = kind(
	/** @lends module:layout/Panels~Panels.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.Panels',

	/**
	* @private
	*/
	classes: 'enyo-panels',

	/**
	* @lends module:layout/Panels~Panels.prototype
	* @private
	*/
	published: {
		/**
		* The index of the active panel. The layout of panels is controlled by the
		* [layoutKind]{@link module:layout/Panels~Panels#layoutKind}, but as a rule, the active panel
		* is displayed in the most prominent position. For example, in the (default)
		* {@link module:layout/CardArranger~CardArranger} layout, the active panel is shown and the other
		* panels are hidden.
		*
		* @type {Number}
		* @default  0
		* @public
		*/
		index: 0,

		/**
		* Indicates whether the user may drag between panels.
		*
		* @type {Boolean}
		* @default  true
		* @public
		*/
		draggable: true,

		/**
		* Indicates whether the panels animate when transitioning, e.g., when
		* [setIndex()]{@link module:layout/Panels~Panels#setIndex} is called.
		*
		* @type {Boolean}
		* @default  true
		* @public
		*/
		animate: true,

		/**
		* Indicates whether panels "wrap around" when moving past the end.
		* The actual effect depends upon the arranger in use.
		*
		* @type {Boolean}
		* @default  false
		* @public
		*/
		wrap: false,

		/**
		* The arranger kind to be used for dynamic layout.
		*
		* @type {String}
		* @default  'CardArranger'
		* @public
		*/
		arrangerKind: CardArranger,

		/**
		* By default, each panel will be sized to fit the Panels' width when the
		* screen size is sufficiently narrow (less than 800px). Set to `false` to
		* avoid this behavior.
		*
		* @type {Boolean}
		* @default  true
		* @public
		*/
		narrowFit: true
	},

	/**
	* @private
	*/
	events: {
		onTransitionStart: '',
		onTransitionFinish: ''
	},

	/**
	* @private
	*/
	handlers: {
		ondragstart: 'dragstart',
		ondrag: 'drag',
		ondragfinish: 'dragfinish',
		onscroll: 'domScroll'
	},

	/**
	* @private
	*/
	tools: [
		{kind: Animator, onStep: 'step', onEnd: 'animationEnded'}
	],

	/**
	* Tracks completion percentage for a transition between two panels.
	*
	* @private
	*/
	fraction: 0,

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function (sup) {
		return function () {
			this.transitionPoints = [];
			sup.apply(this, arguments);
			this.arrangerKindChanged();
			this.narrowFitChanged();
			this.indexChanged();
		};
	}),

	/**
	* @method
	* @private
	*/
	rendered: kind.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			dispatcher.makeBubble(this, 'scroll');
		};
	}),

	/**
	* @private
	*/
	domScroll: function (sender, event) {
		if (this.hasNode()) {
			if (this.node.scrollLeft > 0) {
				// Reset scrollLeft position
				this.node.scrollLeft = 0;
			}
		}
	},

	/**
	* @method
	* @private
	*/
	initComponents: kind.inherit(function (sup) {
		return function () {
			this.createChrome(this.tools);
			sup.apply(this, arguments);
		};
	}),

	/**
	* @private
	*/
	arrangerKindChanged: function () {
		this.setLayoutKind(this.arrangerKind);
	},

	/**
	* @private
	*/
	narrowFitChanged: function () {
		this.addRemoveClass(Panels.getNarrowClass(), this.narrowFit);
	},

	/**
	* @method
	* @private
	*/
	destroy: kind.inherit(function (sup) {
		return function () {
			// When the entire panels is going away, take note so we don't try and do single-panel
			// remove logic such as changing the index and reflowing when each panel is destroyed
			this.destroying = true;
			sup.apply(this, arguments);
		};
	}),

	/**
	* Adjusts the index if the removed control is the active panel and reflows the layout.
	*
	* @method
	* @private
	*/
	removeControl: kind.inherit(function (sup) {
		return function (control) {
			// Skip extra work during panel destruction.
			if (this.destroying) {
				return sup.apply(this, arguments);
			}
			// adjust index if the current panel is being removed
			// so it's either the previous panel or the first one.
			var newIndex = -1;
			var controlIndex = utils.indexOf(control, this.controls);
			if (controlIndex === this.index) {
				newIndex = Math.max(controlIndex - 1, 0);
			}
			sup.apply(this, arguments);
			if (newIndex !== -1 && this.controls.length > 0) {
				this.setIndex(newIndex);
				this.flow();
				this.reflow();
			}
		};
	}),

	/**
	* Designed to be overridden in kinds derived from Panels that have
	* non-panel client controls.
	*
	* @return {Boolean} [description]
	* @protected
	* @todo  Assume that this should take a control as a parameter.
	*/
	isPanel: function () {
		return true;
	},

	/**
	* @method
	* @private
	*/
	flow: kind.inherit(function (sup) {
		return function () {
			this.arrangements = [];
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	reflow: kind.inherit(function (sup) {
		return function () {
			this.arrangements = [];
			sup.apply(this, arguments);
			this.refresh();
		};
	}),

	/**
	* Returns the array of contained panels. Subclasses may override this if they
	* don't want the arranger to lay out all of their children.
	*
	* @return {module:enyo/Control~Control[]} - The array of contained panels.
	*/
	getPanels: function () {
		var p = this.controlParent || this;
		return p.children;
	},

	/**
	* Returns a reference to the active panel--i.e., the panel at the specified index.
	*
	* @return {module:enyo/Control~Control} - The active panel.
	*/
	getActive: function () {
		var p$ = this.getPanels();
		//Constrain the index within the array of panels, needed if wrapping is enabled
		var index = this.index % p$.length;
		if (index < 0) {
			index += p$.length;
		}
		return p$[index];
	},

	/**
	* Returns a reference to the {@link module:enyo/Animator~Animator} instance used to
	* animate panel transitions. The Panels' animator may be used to set the
	* duration of panel transitions, e.g.:
	*
	* ```
	* this.getAnimator().setDuration(1000);
	* ```
	*
	* @return {module:enyo/Animator~Animator} - The {@link module:enyo/Animator~Animator} instance used to animate
	* panel transitions.
	* @public
	*/
	getAnimator: function () {
		return this.$.animator;
	},

	/**
	* Sets the active panel to the panel specified by the given index.
	* Note that if the [animate]{@link module:layout/Panels~Panels#animate} property is set to
	* `true`, the active panel will animate into view.
	*
	* @param {Number} index - The index of the panel to activate.
	* @public
	*/
	setIndex: function (index) {
		// override setIndex so that indexChanged is called
		// whether this.index has actually changed or not. Also, do
		// index clamping here.
		var prevIndex = this.get('index'),
			newIndex = this.clamp(index);
		this.index = newIndex;
		this.notifyObservers('index', prevIndex, newIndex);
	},

	/**
	* Sets the active panel to the panel specified by the given index.
	* The transition to the next panel will be immediate and will not be animated,
	* regardless of the value of the [animate]{@link module:layout/Panels~Panels#animate} property.
	*
	* @param {Number} index - The index of the panel to activate.
	* @public
	*/
	setIndexDirect: function (index) {
		if (this.animate) {
			this.animate = false;
			this.setIndex(index);
			this.animate = true;
		} else {
			this.setIndex(index);
		}
	},

	/**
	* Selects the named component owned by the Panels and returns its index.
	*
	* @param  {String} name - The name of the panel to activate.
	* @return {Number} The index of the newly activated panel.
	* @public
	*/
	selectPanelByName: function (name) {
		if (!name) {
			return;
		}
		var idx = 0;
		var panels = this.getPanels();
		var len = panels.length;
		for (; idx < len; ++idx) {
			if (name === panels[idx].name) {
				this.setIndex(idx);
				return idx;
			}
		}
	},

	/**
	* Transitions to the previous panel--i.e., the panel whose index value is one
	* less than that of the current active panel.
	*
	* @public
	*/
	previous: function () {
		var prevIndex = this.index - 1;
		if (this.wrap && prevIndex < 0) {
			prevIndex = this.getPanels().length - 1;
		}
		this.setIndex(prevIndex);
	},

	/**
	* Transitions to the next panel--i.e., the panel whose index value is one
	* greater than that of the current active panel.
	*
	* @public
	*/
	next: function () {
		var nextIndex = this.index+1;
		if (this.wrap && nextIndex >= this.getPanels().length) {
			nextIndex = 0;
		}
		this.setIndex(nextIndex);
	},

	/**
	* Ensures that `value` references a valid panel, accounting for
	* [wrapping]{@link module:layout/Panels~Panels#wrap}.
	*
	* @param  {Number} value - The index of a panel.
	* @return {Number}       - The valid index of a panel.
	* @private
	*/
	clamp: function (value) {
		var l = this.getPanels().length;
		if (this.wrap) {
			// FIXME: dragging makes assumptions about direction and from->start indexes.
			//return value < 0 ? l : (value > l ? 0 : value);
			value %= l;
			return (value < 0) ? value + l : value;
		} else {
			return Math.max(0, Math.min(value, l - 1));
		}
	},

	/**
	* @private
	*/
	indexChanged: function (old) {
		this.lastIndex = old;
		if (!this.dragging && this.$.animator && this.hasNode()) {
			if (this.shouldAnimate()) {
				// If we're mid-transition, complete it and indicate we need to transition
				if (this.$.animator.isAnimating()) {
					this.transitionOnComplete = true;
					this.$.animator.complete();
				} else {
					this.animateTransition();
				}
			} else {
				this.directTransition();
			}
		}
	},

	/**
	* Returns `true` if the panels should animate in the transition from `fromIndex` to
	* `toIndex`. This can be overridden in a {@glossary subkind} for greater customization.
	*
	* @protected
	*/
	shouldAnimate: function () {
		return this.animate;
	},

	/**
	* @private
	*/
	step: function (sender) {
		this.fraction = sender.value;
		this.stepTransition();
		return true;
	},

	/**
	* @private
	*/
	animationEnded: function (sender, event) {
		this.completed();
		return true;
	},

	/**
	* @private
	*/
	completed: function () {
		this.finishTransition();

		// Animator.onEnd fires asynchronously so we need an internal flag to indicate we need
		// to start the next transition when the previous completes
		if (this.transitionOnComplete) {
			this.transitionOnComplete = false;
			this.animateTransition();
		}

		return true;
	},

	/**
	* @private
	*/
	dragstart: function (sender, event) {
		if (this.draggable && this.layout && this.layout.canDragEvent(event)) {
			event.preventDefault();
			this.dragstartTransition(event);
			this.dragging = true;
			this.$.animator.stop();
			return true;
		}
	},

	/**
	* @private
	*/
	drag: function (sender, event) {
		if (this.dragging) {
			event.preventDefault();
			this.dragTransition(event);
			return true;
		}
	},

	/**
	* @private
	*/
	dragfinish: function (sender, event) {
		if (this.dragging) {
			this.dragging = false;
			event.preventTap();
			this.dragfinishTransition(event);
			return true;
		}
	},

	/**
	* @private
	*/
	dragstartTransition: function (event) {
		if (!this.$.animator.isAnimating()) {
			var f = this.fromIndex = this.index;
			this.toIndex = f - (this.layout ? this.layout.calcDragDirection(event) : 0);
		} else {
			this.verifyDragTransition(event);
		}
		this.fromIndex = this.clamp(this.fromIndex);
		this.toIndex = this.clamp(this.toIndex);
		//this.log(this.fromIndex, this.toIndex);
		this.fireTransitionStart();
		if (this.layout) {
			this.layout.start();
		}
	},

	/**
	* @private
	*/
	dragTransition: function (event) {
		// note: for simplicity we choose to calculate the distance directly between
		// the first and last transition point.
		var d = this.layout ? this.layout.calcDrag(event) : 0;
		var t$ = this.transitionPoints, s = t$[0], f = t$[t$.length-1];
		var as = this.fetchArrangement(s);
		var af = this.fetchArrangement(f);
		var dx = this.layout ? this.layout.drag(d, s, as, f, af) : 0;
		var dragFail = d && !dx;
		if (dragFail) {
			//this.log(dx, s, as, f, af);
		}
		this.fraction += dx;
		var fr = this.fraction;
		if (fr > 1 || fr < 0 || dragFail) {
			if (fr > 0 || dragFail) {
				this.dragfinishTransition(event);
			}
			this.dragstartTransition(event);
			this.fraction = 0;
			// FIXME: account for lost fraction
			//this.dragTransition(event);
		}
		this.stepTransition();
	},

	/**
	* @private
	*/
	dragfinishTransition: function (event) {
		this.verifyDragTransition(event);
		this.setIndex(this.toIndex);
		// note: if we're still dragging, then we're at a transition boundary
		// and should fire the finish event
		if (this.dragging) {
			this.fireTransitionFinish();
		}
	},

	/**
	* @private
	*/
	verifyDragTransition: function (event) {
		var d = this.layout ? this.layout.calcDragDirection(event) : 0;
		var f = Math.min(this.fromIndex, this.toIndex);
		var t = Math.max(this.fromIndex, this.toIndex);
		if (d > 0) {
			var s = f;
			f = t;
			t = s;
		}
		if (f != this.fromIndex) {
			this.fraction = 1 - this.fraction;
		}
		//this.log('old', this.fromIndex, this.toIndex, 'new', f, t);
		this.fromIndex = f;
		this.toIndex = t;
	},

	/**
	* Resets the panels without sending any events.
	*
	* @private
	*/
	refresh: function () {
		if (this.$.animator && this.$.animator.isAnimating()) {
			this.$.animator.stop();
		}
		this.setupTransition();
		this.fraction = 1;
		this.stepTransition();
		this.transitioning = false;
		this.completeTransition();
		this.dragging = false;
	},

	/**
	* Transitions to the new index without animation
	*
	* @private
	*/
	directTransition: function () {
		this.startTransition();
		this.fraction = 1;
		this.stepTransition();
		this.finishTransition();
	},

	/**
	* Animates the transition to the new index
	*
	* @private
	*/
	animateTransition: function () {
		this.startTransition();
		this.$.animator.play({
			startValue: this.fraction
		});
	},

	/**
	* Starts the transition between two panels. if a transition is already in progress, this is
	* a no-op.
	*
	* @private
	*/
	startTransition: function () {
		if (!this.transitioning) {
			this.transitioning = true;
			this.setupTransition();
			this.fireTransitionStart();
		}
	},

	/**
	* Sets up transition state
	*
	* @private
	*/
	setupTransition: function () {
		this.fromIndex = this.fromIndex != null ? this.fromIndex : this.lastIndex || 0;
		this.toIndex = this.toIndex != null ? this.toIndex : this.index;
		if (this.layout) {
			this.layout.start();
		}
	},

	/**
	* Completes the transition between two panels.
	*
	* @private
	*/
	finishTransition: function () {
		this.transitioning = false;
		this.completeTransition(true);
	},

	/**
	* Completes the transition by performing any tasks to be run when the transition ends,
	* including firing events and clean-up.
	*
	* @param {Boolean} [fire] - If `true`, will fire the {@link module:layout/Panels~Panels#onTransitionFinish}
	*	event if deemed necessary.
	* @private
	*/
	completeTransition: function (fire) {
		if (this.layout) {
			this.layout.finish();
		}

		if (fire) {
			this.fireTransitionFinish(true);
		} else {
			this.clearTransitionData();
		}
	},

	/**
	* Clears transition-related data.
	*
	* @private
	*/
	clearTransitionData: function() {
		this.transitionPoints = [];
		this.fraction = 0;
		this.fromIndex = this.toIndex = null;
	},

	/**
	* @fires module:layout/Panels~Panels#onTransitionStart
	* @private
	*/
	fireTransitionStart: function () {
		var t = this.startTransitionInfo;
		if (this.hasNode() && (!t || (t.fromIndex != this.fromIndex || t.toIndex != this.toIndex))) {
			this.startTransitionInfo = {fromIndex: this.fromIndex, toIndex: this.toIndex};
			this.doTransitionStart(utils.clone(this.startTransitionInfo));
		}
	},

	/**
	* @fires module:layout/Panels~Panels#onTransitionFinish
	* @param {Boolean} [clearData] - If `true`, {@link module:layout/Panels~Panels#clearTransitionData} will be
	*	called after recording the values needed for the callback.
	* @private
	*/
	fireTransitionFinish: function (clearData) {
		var t = this.finishTransitionInfo,
			fromIndex = t ? t.fromIndex : null,
			toIndex = t ? t.toIndex : null;
		if (this.hasNode() && (!t || (fromIndex != this.fromIndex || toIndex != this.toIndex))) {
				if (this.transitionOnComplete) {
				this.finishTransitionInfo = {fromIndex: toIndex, toIndex: this.lastIndex};
				} else {
					this.finishTransitionInfo = {fromIndex: this.lastIndex, toIndex: this.index};
				}
			if (clearData) {
				this.clearTransitionData();
			}
				this.doTransitionFinish(utils.clone(this.finishTransitionInfo));
		} else if (clearData) {
			this.clearTransitionData();
		}
	},

	/**
	* Interpolates between arrangements as needed.
	*
	* @private
	*/
	stepTransition: function () {
		if (this.hasNode()) {
			// select correct transition points and normalize fraction.
			var t$ = this.transitionPoints;
			var r = (this.fraction || 0) * (t$.length-1);
			var i = Math.floor(r);
			r = r - i;
			var s = t$[i], f = t$[i+1];
			// get arrangements and lerp between them
			var s0 = this.fetchArrangement(s);
			var s1 = this.fetchArrangement(f);
			this.arrangement = s0 && s1 ? Panels.lerp(s0, s1, r) : (s0 || s1);
			if (this.arrangement && this.layout) {
				this.layout.flowArrangement();
			}
		}
	},

	/**
	* Fetches the arrangement at a specified index, initializing it if necessary.
	*
	* @param  {Number} index - The index of the desired arrangement from `transitionPoints`.
	* @return {Object} The desired arrangement object.
	* @private
	*/
	fetchArrangement: function (index) {
		if ((index != null) && !this.arrangements[index] && this.layout) {
			this.layout._arrange(index);
			this.arrangements[index] = this.readArrangement(this.getPanels());
		}
		return this.arrangements[index];
	},

	/**
	* Iterates over `panels` and retrieves a copy of each panel's `_arranger`.
	*
	* @param  {module:enyo/Control~Control[]} panels - The array of panels.
	* @return {Object[]}              - The array of arrangement objects.
	*/
	readArrangement: function (panels) {
		var r = [];
		for (var i=0, c$=panels, c; (c=c$[i]); i++) {
			r.push(utils.clone(c._arranger));
		}
		return r;
	},

	/**
	* @lends module:layout/Panels~Panels
	* @private
	*/
	statics: {
		/**
		* Returns `true` for iOS and Android phone form factors, or when window width
		* is 800px or less. Approximates work done using media queries in `Panels.css`.
		*
		* @return {Boolean} `true` for narrow devices or viewports; otherwise, `false`.
		* @public
		*/
		isScreenNarrow: function () {
			if(Panels.isNarrowDevice()) {
				return true;
			} else {
				return dom.getWindowWidth() <= 800;
			}
		},

		/**
		* Returns the class name to apply for narrow fitting. See media queries
		* in `Panels.css`.
		*
		* @return {String} The CSS class name to apply.
		*/
		getNarrowClass: function () {
			if(Panels.isNarrowDevice()) {
				return 'enyo-panels-force-narrow';
			} else {
				return 'enyo-panels-fit-narrow';
			}
		},

		/**
		* Lerps between arrangements.
		*
		* @param  {Object[]} a0     - Array of current arrangement objects.
		* @param  {Object[]} a1     - Array of target arrangement object.
		* @param  {Number} fraction - The fraction (between 0 and 1) with which to lerp.
		* @return {Object[]}        - Array of arrangements that is `fraction` between
		* 	`a0` and `a1`.
		* @private
		*/
		lerp: function (a0, a1, fraction) {
			var r = [];
			for (var i=0, k$=utils.keys(a0), k; (k=k$[i]); i++) {
				r.push(this.lerpObject(a0[k], a1[k], fraction));
			}
			return r;
		},

		/**
		* Lerps between the values of arrangement objects.
		*
		* @param  {Object} a0       - The source arragement.
		* @param  {Object} a1       - The destination arragement.
		* @param  {Number} fraction - The fraction (between 0 and 1) with which to lerp.
		*
		* @return {Object}          - The lerped arrangement.
		* @private
		*/
		lerpObject: function (a0, a1, fraction) {
			var b = utils.clone(a0), n, o;
			// a1 might be undefined when deleting panels
			if (a1) {
				for (var i in a0) {
					n = a0[i];
					o = a1[i];
					if (n != o) {
						b[i] = n - (n - o) * fraction;
					}
				}
			}
			return b;
		},

		/**
		* Tests User Agent strings to identify narrow devices.
		*
		* @return {Boolean} `true` if the current device is a narrow device;
		* otherwise, `false`.
		*/
		isNarrowDevice: function () {
			var ua = navigator.userAgent;
			switch (platform.platformName) {
				case 'ios':
					return (/iP(?:hone|od;(?: U;)? CPU) OS (\d+)/).test(ua);
				case 'android':
					return (/Mobile/).test(ua) && (platform.android > 2);
				case 'androidChrome':
					return (/Mobile/).test(ua);
			}
			return false;
		}
	}
});

},{'../CardArranger':'layout/CardArranger'}],'layout/FittableLayout':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/FittableLayout~FittableLayout}, {@link module:layout/FittableLayout~FittableColumnsLayout}
* and {@link module:layout/FittableLayout~FittableRowsLayout} kinds.
* @module layout/FittableLayout
*/

var
	kind = require('enyo/kind'),
	dom = require('enyo/dom'),
	Control = require('enyo/Control'),
	Layout = require('enyo/Layout');

var detector = document.createElement('div'),
	flexAvailable =
		(detector.style.flexBasis !== undefined) ||
		(detector.style.webkitFlexBasis !== undefined) ||
		(detector.style.mozFlexBasis !== undefined) ||
		(detector.style.msFlexBasis !== undefined);

/**
* {@link module:layout/FittableLayout~FittableLayout} provides the base
* positioning and boundary logic for the fittable layout strategy. The fittable
* layout strategy is based on laying out items in either a set of rows or a set
* of columns, with most of the items having natural size, but one item expanding
* to fill the remaining space. The item that expands is labeled with the
* attribute `fit: true`.
*
* The subkinds {@link module:layout/FittableLayout~FittableColumnsLayout} and
* {@link module:layout/FittableLayout~FittableRowsLayout} (or _their_ subkinds)
* are used for layout rather than `FittableLayout` because they specify
* properties that the framework expects to be available when laying items out.
*
* When available on the platform, you can opt-in to have `FittableLayout` use
* CSS flexible box (flexbox) to implement fitting behavior on the platform for
* better performance; Enyo will fall back to JavaScript-based layout on older
* platforms. Three subtle differences between the flexbox and JavaScript
* implementations should be noted:

* - When using flexbox, vertical margins (i.e., `margin-top`, `margin-bottom`) will
* not collapse; when using JavaScript layout, vertical margins will collapse according
* to static layout rules.
*
* - When using flexbox, non-fitting children of the Fittable must not be sized
* using percentages of the container (even if set to `position: relative`);
* this is explicitly not supported by the flexbox 2013 spec.
*
* - The flexbox-based Fittable implementation will respect multiple children
* with `fit: true` (the fitting space will be divided equally between them).
* This is NOT supported by the JavaScript implementation, and you should not rely
* upon this behavior if you are deploying to platforms without flexbox support.
*
* The flexbox implementation was added to Enyo 2.5.0 as an optional performance
* optimization; to use the optimization, set `useFlex: true` on the Fittable
* container.  This will cause flexbox to be used when possible.
*
* @class FittableLayout
* @extends module:enyo/Layout~Layout
* @public
*/
var FittableLayout = module.exports = kind(/** @lends module:layout/FittableLayout~FittableLayout.prototype */{
	name: 'enyo.FittableLayout',

	/**
	* @private
	*/
	kind: Layout,

	/**
	* @private
	*/
	noDefer: true,

	/**
	* @method
	* @private
	*/
	constructor: function () {
		Layout.prototype._constructor.apply(this, arguments);

		// Add the force-ltr class if we're in RTL mode, but this control is set explicitly to NOT be in RTL mode.
		this.container.addRemoveClass('force-left-to-right', (Control.prototype.rtl && !this.container.get('rtl')) );

		// Flexbox optimization is determined by global flexAvailable and per-instance opt-in useFlex flag
		this.useFlex = flexAvailable && (this.container.useFlex === true);
		if (this.useFlex) {
			this.container.addClass(this.flexLayoutClass);
		} else {
			this.container.addClass(this.fitLayoutClass);
		}
	},

	/**
	* @private
	*/
	calcFitIndex: function () {
		var aChildren = this.container.children,
			oChild,
			n;

		for (n=0; n<aChildren.length; n++) {
			oChild = aChildren[n];
			if (oChild.fit && oChild.showing) {
				return n;
			}
		}
	},

	/**
	* @private
	*/
	getFitControl: function () {
		var aChildren = this.container.children,
			oFitChild = aChildren[this.fitIndex];

		if (!(oFitChild && oFitChild.fit && oFitChild.showing)) {
			this.fitIndex = this.calcFitIndex();
			oFitChild = aChildren[this.fitIndex];
		}
		return oFitChild;
	},

	/**
	* @private
	*/
	shouldReverse: function () {
		return this.container.rtl && this.orient === 'h';
	},
	
	/**
	* @private
	*/
	destroy: function () {
		Layout.prototype.destroy.apply(this, arguments);
		
		if (this.container) {
			this.container.removeClass(this.useFlex ? this.flexLayoutClass : this.fitLayoutClass);
		}
	},

	/**
	* @private
	*/
	getFirstChild: function() {
		var aChildren = this.getShowingChildren();

		if (this.shouldReverse()) {
			return aChildren[aChildren.length - 1];
		} else {
			return aChildren[0];
		}
	},

	/**
	* @private
	*/
	getLastChild: function() {
		var aChildren = this.getShowingChildren();

		if (this.shouldReverse()) {
			return aChildren[0];
		} else {
			return aChildren[aChildren.length - 1];
		}
	},

	/**
	* @private
	*/
	getShowingChildren: function() {
		var a = [],
			n = 0,
			aChildren = this.container.children,
			nLength   = aChildren.length;

		for (;n<nLength; n++) {
			if (aChildren[n].showing) {
				a.push(aChildren[n]);
			}
		}

		return a;
	},

	/**
	* @private
	*/
	_reflow: function(sMeasureName, sClienMeasure, sAttrBefore, sAttrAfter) {
		this.container.addRemoveClass('enyo-stretch', !this.container.noStretch);
		
		var oFitChild       = this.getFitControl(),
			oContainerNode  = this.container.hasNode(),  // Container node
			nTotalSize     = 0,                          // Total container width or height without padding
			nBeforeOffset   = 0,                         // Offset before fit child
			nAfterOffset    = 0,                         // Offset after fit child
			oPadding,                                    // Object containing t,b,r,l paddings
			oBounds,                                     // Bounds object of fit control
			oLastChild,
			oFirstChild,
			nFitSize;

		if (!oFitChild || !oContainerNode) { return true; }

		oPadding   = dom.calcPaddingExtents(oContainerNode);
		oBounds    = oFitChild.getBounds();
		nTotalSize = oContainerNode[sClienMeasure] - (oPadding[sAttrBefore] + oPadding[sAttrAfter]);

		// If total size is zero, there's nothing for us to do (and the Control
		// we're doing layout for is probably hidden). In this case, we
		// short-circuit and return `true` to signify that we want to reflow
		// again the next time the Control is shown.
		if (nTotalSize === 0) {
			return true;
		}

		if (this.shouldReverse()) {
			oFirstChild  = this.getFirstChild();
			nAfterOffset = nTotalSize - (oBounds[sAttrBefore] + oBounds[sMeasureName]);

			var nMarginBeforeFirstChild = dom.getComputedBoxValue(oFirstChild.hasNode(), 'margin', sAttrBefore) || 0;

			if (oFirstChild == oFitChild) {
				nBeforeOffset = nMarginBeforeFirstChild;
			} else {
				var oFirstChildBounds      = oFirstChild.getBounds(),
					nSpaceBeforeFirstChild = oFirstChildBounds[sAttrBefore] - (oPadding[sAttrBefore] || 0);

				nBeforeOffset = oBounds[sAttrBefore] + nMarginBeforeFirstChild - nSpaceBeforeFirstChild;
			}
		} else {
			oLastChild    = this.getLastChild();
			nBeforeOffset = oBounds[sAttrBefore] - (oPadding[sAttrBefore] || 0);

			var nMarginAfterLastChild = dom.getComputedBoxValue(oLastChild.hasNode(), 'margin', sAttrAfter) || 0;

			if (oLastChild == oFitChild) {
				nAfterOffset = nMarginAfterLastChild;
			} else {
				var oLastChildBounds = oLastChild.getBounds(),
					nFitChildEnd     = oBounds[sAttrBefore] + oBounds[sMeasureName],
					nLastChildEnd    = oLastChildBounds[sAttrBefore] + oLastChildBounds[sMeasureName] +  nMarginAfterLastChild;

				nAfterOffset = nLastChildEnd - nFitChildEnd;
			}
		}

		nFitSize = nTotalSize - (nBeforeOffset + nAfterOffset);
		oFitChild.applyStyle(sMeasureName, nFitSize + 'px');
	},

	/**
	* Assigns any static layout properties not dependent on changes to the
	* rendered component or container sizes, etc.
	* 
	* @public
	*/
	flow: function() {
		if (this.useFlex) {
			var i,
				children = this.container.children,
				child;
			this.container.addClass(this.flexLayoutClass);
			this.container.addRemoveClass('nostretch', this.container.noStretch);
			for (i=0; i<children.length; i++) {
				child = children[i];
				child.addClass('enyo-flex-item');
				child.addRemoveClass('flex', child.fit);
			}
		}
	},

	/**
	* Updates the layout to reflect any changes made to the layout container or
	* the contained components.
	*
	* @public
	*/
	reflow: function() {
		if (!this.useFlex) {
			if (this.orient == 'h') {
				return this._reflow('width', 'clientWidth', 'left', 'right');
			} else {
				return this._reflow('height', 'clientHeight', 'top', 'bottom');
			}
		}
	},

	/**
	* @private
	* @lends module:layout/FittableLayout~FittableLayout.prototype
	*/
	statics: {
		/**
		* Indicates whether flexbox optimization can be used.
		*
		* @type {Boolean}
		* @default  false
		* @private
		*/
		flexAvailable: flexAvailable
	}
});

/**
* {@link module:layout/FittableLayout~FittableColumnsLayout} provides a
* container in which items are laid out in a set of vertical columns, with most
* of the items having natural size, but one expanding to fill the remaining
* space. The one that expands is labeled with the attribute `fit: true`.
*
* `FittableColumnsLayout` is meant to be used as a value for the `layoutKind`
* property of other kinds. `layoutKind` provides a way to add layout behavior in
* a pluggable fashion while retaining the ability to use a specific base kind.
*
* For more information, see the documentation on
* [Fittables]{@linkplain $dev-guide/building-apps/layout/fittables.html} in the
* Enyo Developer Guide.
*
* @class FittableColumnsLayout
* @extends module:layout/FittableLayout~FittableLayout
* @public
*/

/**
* The declaration for {@link module:layout/FittableLayout~FittableColumnsLayout}
*/
module.exports.Columns = kind(/** @lends module:layout/FittableLayout~FittableColumnsLayout.prototype */{
	name        : 'enyo.FittableColumnsLayout',
	kind        : FittableLayout,
	orient      : 'h',
	fitLayoutClass : 'enyo-fittable-columns-layout',
	flexLayoutClass: 'enyo-flex-container columns'
});


/**
* {@link module:layout/FittableLayout~FittableRowsLayout} provides a container
* in which items are laid out in a set of horizontal rows, with most of the
* items having natural size, but one expanding to fill the remaining space. The
* one that expands is labeled with the attribute `fit: true`.
*
* `FittableRowsLayout` is meant to be used as a value for the `layoutKind`
* property of other kinds. `layoutKind` provides a way to add layout behavior in
* a pluggable fashion while retaining the ability to use a specific base kind.
*
* For more information, see the documentation on
* [Fittables]{@linkplain $dev-guide/building-apps/layout/fittables.html} in the
* Enyo Developer Guide.
*
* @class FittableRowsLayout
* @extends module:layout/FittableLayout~FittableLayout
* @public
*/

/**
* The declaration for {@link module:layout/FittableLayout~FittableRowsLayout}
*/
module.exports.Rows = kind(
	/** @lends module:layout/FittableLayout~FittableRowsLayout.prototype */ {

	/**
	* @private
	*/
	name        : 'enyo.FittableRowsLayout',

	/**
	* @private
	*/
	kind        : FittableLayout,

	/**
	* Layout CSS class used to fit rows.
	*
	* @type {String}
	* @default 'enyo-fittable-rows-layout'
	* @public
	*/
	fitLayoutClass : 'enyo-fittable-rows-layout',

	/**
	* The orientation of the layout.
	*
	* @type {String}
	* @default 'v'
	* @public
	*/
	orient      : 'v',

	/**
	* @private
	*/
	flexLayoutClass: 'enyo-flex-container rows'
});

}],'layout/FlyweightRepeater':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/FlyweightRepeater~FlyweightRepeater} kind.
* @module layout/FlyweightRepeater
*/

var
	kind = require('enyo/kind'),
	dom = require('enyo/dom'),
	utils = require('enyo/utils'),
	Control = require('enyo/Control'),
	HTMLStringDelegate = require('enyo/HTMLStringDelegate'),
	Selection = require('enyo/Selection');

var FlyweightRepeaterDelegate = Object.create(HTMLStringDelegate);

FlyweightRepeaterDelegate.generateInnerHtml = function (control) {
	var h = '';
	control.index = null;
	// note: can supply a rowOffset
	// and indicate if rows should be rendered top down or bottomUp
	for (var i=0, r=0; i<control.count; i++) {
		r = control.rowOffset + (this.bottomUp ? control.count - i-1 : i);
		control.setupItem(r);
		control.$.client.setAttribute('data-enyo-index', r);
		if (control.orient == 'h') {
			control.$.client.setStyle('display:inline-block;');
		}
		h += HTMLStringDelegate.generateChildHtml(control);
		control.$.client.teardownRender();
	}
	return h;
};

/**
* Fires once per row at render time.
*
* @event module:layout/FlyweightRepeater~FlyweightRepeater#onSetupItem
* @type {Object}
* @property {Number} index     - The index of the row being rendered.
* @property {Boolean} selected - `true` if the row is selected; otherwise, `false`.
* @public
*/

/**
* Fires after an individual row has been rendered.
*
* @event module:layout/FlyweightRepeater~FlyweightRepeater#onRenderRow
* @type {Object}
* @property {Number} rowIndex - The index of the row that was rendered.
* @public
*/

/**
* {@link module:layout/FlyweightRepeater~FlyweightRepeater} is a control that displays a repeating list of
* rows, suitable for displaying medium-sized lists (up to ~100 items). A
* flyweight strategy is employed to render one set of row controls, as needed,
* for as many rows as are contained in the repeater.
*
* The FlyweightRepeater's `components` block contains the controls to be used
* for a single row. This set of controls will be rendered for each row. You
* may customize row rendering by handling the
* [onSetupItem]{@link module:layout/FlyweightRepeater~FlyweightRepeater#onSetupItem} event.
*
* The controls inside a FlyweightRepeater are non-interactive. This means that
* calling methods that would normally cause rendering to occur (e.g.,
* `set('content', <value>)`) will not do so. However, you may force a row to
* render by calling [renderRow()]{@link module:layout/FlyweightRepeater~FlyweightRepeater#renderRow}.
*
* In addition, you may force a row to be temporarily interactive by calling
* [prepareRow()]{@link module:layout/FlyweightRepeater~FlyweightRepeater#prepareRow}. Call
* [lockRow()]{@link module:layout/FlyweightRepeater~FlyweightRepeater#lockRow} when the interaction
* is complete.
*
* For more information, see the documentation on
* [Lists]{@linkplain $dev-guide/building-apps/layout/lists.html} in the
* Enyo Developer Guide.
*
* @class FlyweightRepeater
* @extends module:enyo/Control~Control
* @ui
* @public
*/
var FlyweightRepeater = module.exports = kind(
	/** @lends module:layout/FlyweightRepeater~FlyweightRepeater.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.FlyweightRepeater',

	/**
	* @private
	*/
	kind: Control,

	/**
	* @lends module:layout/FlyweightRepeater~FlyweightRepeater.prototype
	* @private
	*/
	published: {
		/**
		 * The number of rows to render.
		 *
		 * @type {Number}
		 * @default 0
		 * @public
		 */
		count: 0,

		/**
		* If `true`, the selection mechanism is disabled. Tap events are still
		* sent, but items won't be automatically re-rendered when tapped.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		noSelect: false,

		/**
		 * If `true`, multiple selection is allowed.
		 *
		 * @type {Boolean}
		 * @default false
		 * @public
		 */
		multiSelect: false,

		/**
		 * If `true`, the selected item will toggle.
		 *
		 * @type {Boolean}
		 * @default false
		 * @public
		 */
		toggleSelected: false,

		/**
		* Used to specify CSS classes for the repeater's wrapper component (client).
		* Input is identical to that of {@link module:enyo/Control~Control#setClasses}.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		clientClasses: '',

		/**
		* Used to specify custom styling for the repeater's wrapper component
		* (client). Input is identical to that of {@link module:enyo/Control~Control#setStyle}.
		*
		* @type {String}
		* @default ''
		* @public
		*/
		clientStyle: '',

		/**
		* Numerical offset applied to row number during row generation. Allows items
		* to have natural indices instead of `0`-based ones. This value must be
		* positive, as row number `-1` is used to represent undefined rows in the
		* event system.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		rowOffset: 0,

		/**
		* Direction in which items will be laid out. Valid values are `'v'` for
		* vertical or `'h'` for horizontal.
		*
		* @type {String}
		* @default 'h'
		* @public
		*/
		orient: 'v'
	},

	/**
	* @private
	*/
	events: {
		onSetupItem: '',
		onRenderRow: ''
	},

	/**
	* Setting cachePoint: true ensures that events from the repeater's subtree will
	* always bubble up through the repeater, allowing the events to be decorated with repeater-
	* related metadata and references.
	*
	* @type {Boolean}
	* @default true
	* @private
	*/
	cachePoint: true,

	/**
	* Design-time attribute indicating whether row indices run
	* from `0` to [`count`]{@link module:layout/FlyweightRepeater~FlyweightRepeater#count}`-1` `(false)` or
	* from [`count`]{@link module:layout/FlyweightRepeater~FlyweightRepeater#count}`-1` to `0` `(true)`.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	bottomUp: false,

	/**
	* @private
	*/
	renderDelegate: FlyweightRepeaterDelegate,

	/**
	* @private
	*/
	components: [
		{kind: Selection, onSelect: 'selectDeselect', onDeselect: 'selectDeselect'},
		{name: 'client'}
	],

	/**
	* @method
	* @private
	*/
	create: function () {
		Control.prototype.create.apply(this, arguments);
		this.noSelectChanged();
		this.multiSelectChanged();
		this.clientClassesChanged();
		this.clientStyleChanged();
	},

	/**
	* @private
	*/
	noSelectChanged: function () {
		if (this.noSelect) {
			this.$.selection.clear();
		}
	},

	/**
	* @private
	*/
	multiSelectChanged: function () {
		this.$.selection.setMulti(this.multiSelect);
	},

	/**
	* @private
	*/
	clientClassesChanged: function () {
		this.$.client.setClasses(this.clientClasses);
	},

	/**
	* @private
	*/
	clientStyleChanged: function () {
		this.$.client.setStyle(this.clientStyle);
	},

	/**
	* @fires module:layout/FlyweightRepeater~FlyweightRepeater#onSetupItem
	* @private
	*/
	setupItem: function (index) {
		this.doSetupItem({index: index, selected: this.isSelected(index)});
	},

	/**
	* Renders the list.
	*
	* @private
	*/
	generateChildHtml: function () {
		return this.renderDelegate.generateInnerHtml(this);
	},

	/**
	* @todo add link to preview.js
	* @private
	*/
	previewDomEvent: function (event) {
		var i = this.index = this.rowForEvent(event);
		event.rowIndex = event.index = i;
		event.flyweight = this;
	},

	/**
	* @method
	* @private
	*/
	decorateEvent: function (eventName, event, sender) {
		// decorate event with index found via dom iff event does not already contain an index.
		var i = (event && event.index != null) ? event.index : this.index;
		if (event && i != null) {
			event.index = i;
			event.flyweight = this;
		}
		Control.prototype.decorateEvent.apply(this, arguments);
	},

	/**
	* @private
	*/
	tap: function (sender, event) {
		// ignore taps if selecting is disabled or if they don't target a row
		if (this.noSelect || event.index === -1) {
			return;
		}
		if (this.toggleSelected) {
			this.$.selection.toggle(event.index);
		} else {
			this.$.selection.select(event.index);
		}
	},

	/**
	* Handler for selection and deselection.
	*
	* @private
	*/
	selectDeselect: function (sender, event) {
		this.renderRow(event.key);
	},

	/**
	* Returns the repeater's [selection]{@link module:enyo/Selection~Selection} component.
	*
	* @return {module:enyo/Selection~Selection} The repeater's selection component.
	* @public
	*/
	getSelection: function () {
		return this.$.selection;
	},

	/**
	* Gets the selection state for the given row index.
	*
	* @return {Boolean} `true` if the row is currently selected; otherwise, `false`.
	* @public
	*/
	isSelected: function (index) {
		return this.getSelection().isSelected(index);
	},

	/**
	* Renders the row with the specified index.
	*
	* @param {Number} index - The index of the row to render.
	* @fires module:layout/FlyweightRepeater~FlyweightRepeater#onRenderRow
	* @public
	*/
	renderRow: function (index) {
		// do nothing if index is out-of-range
		if (index < this.rowOffset || index >= this.count + this.rowOffset) {
			return;
		}
		//this.index = null;
		// always call the setupItem callback, as we may rely on the post-render state
		this.setupItem(index);
		var node = this.fetchRowNode(index);
		if (node) {
			// hack to keep this working...
			var delegate = HTMLStringDelegate;

			dom.setInnerHtml(node, delegate.generateChildHtml(this.$.client));
			this.$.client.teardownChildren();
			this.doRenderRow({rowIndex: index});
		}
	},

	/**
	* Fetches the DOM node for the given row index.
	*
	* @param {Number} index - The index of the row whose DOM node is to be fetched.
	* @return {Node} The DOM node for the specified row.
	* @public
	*/
	fetchRowNode: function (index) {
		if (this.hasNode()) {
			return this.node.querySelector('[data-enyo-index="' + index + '"]');
		}
	},

	/**
	* Fetches the row number corresponding to the target of a given event.
	*
	* @param {Object} event - Event object.
	* @return {Number} The index of the row corresponding to the event's target.
	* @public
	*/
	rowForEvent: function (event) {
		if (!this.hasNode()) {
			return -1;
		}
		var n = event.target;
		while (n && n !== this.node) {
			var i = n.getAttribute && n.getAttribute('data-enyo-index');
			if (i !== null) {
				return Number(i);
			}
			n = n.parentNode;
		}
		return -1;
	},

	/**
	* Prepares the specified row such that changes made to the controls inside
	* the repeater will be rendered for the row.
	*
	* @param {Number} index - The index of the row to be prepared.
	* @public
	*/
	prepareRow: function (index) {
		// do nothing if index is out-of-range
		if (index < this.rowOffset || index >= this.count + this.rowOffset) {
			return;
		}
		// update row internals to match model
		this.setupItem(index);
		var n = this.fetchRowNode(index);
		FlyweightRepeater.claimNode(this.$.client, n);
	},

	/**
	* Prevents rendering of changes made to controls inside the repeater.
	*
	* @public
	*/
	lockRow: function () {
		this.$.client.teardownChildren();
	},

	/**
	* Prepares the specified row such that changes made to the controls in the
	* repeater will be rendered in the row; then performs the function `func`
	* and, finally, locks the row.
	*
	* @param {Number} index   - The index of the row to be acted upon.
	* @param {Function} func  - The function to perform.
	* @param {Object} context - The context to which `func` is bound.
	* @private
	*/
	performOnRow: function (index, func, context) {
		// do nothing if index is out-of-range
		if (index < this.rowOffset || index >= this.count + this.rowOffset) {
			return;
		}
		if (func) {
			this.prepareRow(index);
			utils.call(context || null, func);
			this.lockRow();
		}
	},

	/**
	* @lends module:layout/FlyweightRepeater~FlyweightRepeater
	* @private
	*/
	statics: {
		/**
		* Associates a flyweight rendered control (`control`) with a
		* rendering context specified by `node`.
		*
		* @param {module:enyo/Control~Control} control - A flyweight-rendered control.
		* @param {Node} node - The DOM node to be associated with `control`.
		* @public
		*/
		claimNode: function (control, node) {
			var n;
			if (node) {
				if (node.id !== control.id) {
					n = node.querySelector('#' + control.id);
				} else {
					// node is already the right node, so just use it
					n = node;
				}
			}
			// FIXME: consider controls generated if we found a node or tag: null, the later so can teardown render
			control.generated = Boolean(n || !control.tag);
			control.node = n;
			if (control.node) {
				control.rendered();
			} else {
				//enyo.log('Failed to find node for',  control.id, control.generated);
			}
			// update control's class cache based on the node contents
			for (var i=0, c$=control.children, c; (c=c$[i]); i++) {
				this.claimNode(c, node);
			}
		}
	}
});

}],'layout/FittableRows':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/FittableRows~FittableRows} kind.
* @module layout/FittableRows
*/

var
	kind = require('enyo/kind')	;

var
	FittableLayout = require('./FittableLayout'),
	FittableRowsLayout = FittableLayout.Rows;

/**
* {@link module:layout/FittableRows~FittableRows} provides a container in which items are laid out in a
* set	of horizontal rows, with most of the items having natural size, but one
* expanding to fill the remaining space. The one that expands is labeled with
* the attribute `fit: true`.
*
* For more information, see the documentation on
* [Fittables]{@linkplain $dev-guide/building-apps/layout/fittables.html} in the
* Enyo Developer Guide.
*
* @class FittableRows
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(/** @lends module:layout/FittableRows~FittableRows.prototype */{

	/**
	* @private
	*/
	name: 'enyo.FittableRows',

	/**
	* A {@glossary kind} used to manage the size and placement of child
	* [components]{@link module:enyo/Component~Component}.
	*
	* @type {String}
	* @default ''
	* @private
	*/
	layoutKind: FittableRowsLayout,

	/**
	* By default, items in columns stretch to fit horizontally; set to `true` to
	* avoid this behavior.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	noStretch: false
});

},{'./FittableLayout':'layout/FittableLayout'}],'layout/FittableColumns':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/FittableColumns~FittableColumns} kind.
* @module layout/FittableColumns
*/

var
	kind = require('enyo/kind');

var
	FittableLayout = require('./FittableLayout'),
	FittableColumnsLayout = FittableLayout.Columns;

/**
* {@link module:layout/FittableColumns~FittableColumns} provides a container in which items are laid out in a
* set of vertical columns, with most items having natural size, but one
* expanding to fill the remaining space. The one that expands is labeled with
* the attribute `fit: true`.
*
* For more information, see the documentation on
* [Fittables]{@linkplain $dev-guide/building-apps/layout/fittables.html} in the
* Enyo Developer Guide.
*
* @class FittableColumns
* @extends module:enyo/Control~Control
* @ui
* @public
*/
module.exports = kind(/** @lends module:layout/FittableColumns~FittableColumns.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.FittableColumns',

	/**
	* A {@glossary kind} used to manage the size and placement of child
	* [components]{@link module:enyo/Component~Component}.
	*
	* @type {String}
	* @default ''
	* @private
	*/
	layoutKind: FittableColumnsLayout,

	/**
	* By default, items in columns stretch to fit vertically; set to `true` to
	* avoid this behavior.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	noStretch: false
});

},{'./FittableLayout':'layout/FittableLayout'}],'layout/List':[function (module,exports,global,require,request){
/**
* Contains the declaration for the {@link module:layout/List~List} kind.
* @module layout/List
*/

var
	kind = require('enyo/kind'),
	utils = require('enyo/utils'),
	Scroller = require('enyo/Scroller');

var
	FlyweightRepeater = require('layout/FlyweightRepeater');

var
	methods = require('./methods');

/**
* A collection of useful metrics about a page.
*
* @typedef {Object} module:layout/List~List~PageInfo
* @property {Number} no       - The page number.
* @property {Number} size     - The page size.
* @property {Number} pos      - The page position.
* @property {Number} startRow - The index of the page's first row.
* @property {Number} endRow   - The index of the page's last row.
*/

/**
* Fires once per row at render time.
*
* @event module:layout/List~List#onSetupItem
* @type {Object}
* @property {Number} index - The current row index.
* @public
*/

/**
* Fires when reordering starts, to setup reordering components. No additional
* data is included with this event.
*
* @event module:layout/List~List#onSetupReorderComponents
* @type {Object}
* @property {Number} index - The current row index.
* @public
*/

/**
* Fires when reordering completes.
*
* @event module:layout/List~List#onReorder
* @type {Object}
* @property {Number} reorderTo   - The index of the destination row.
* @property {Number} reorderFrom - The index of the source row.
* @public
*/

/**
* Fires when pinned reordering starts. No additional data is included with
* this event.
*
* @event module:layout/List~List#onSetupPinnedReorderComponents
* @type {Object}
* @public
*/

/**
* Fires when swiping starts, to set up swipeable components. No additional
* data is included with this event.
*
* @event module:layout/List~List#onSetupSwipeItem
* @type {Object}
* @public
*/

/**
* @todo onSwipeDrag is never fired
* @event module:layout/List~List#onSwipeDrag
* @type {Object}
* @public
*/

/**
* @todo onSwipe is never fired
* @event module:layout/List~List#onSwipe
* @type {Object}
* @public
*/

/**
* Fires when a swipe completes.
*
* @event module:layout/List~List#onSwipeComplete
* @type {Object}
* @property {Number} index      - The index of the row that was swiped.
* @property {Number} xDirection - The direction of the swipe.
* @public
*/

/**
* {@link module:layout/List~List} is a control that displays a scrolling list of rows,
* suitable for displaying very large lists. It is optimized such that only a
* small portion of the list is rendered at a given time. A flyweight pattern
* is employed, in which controls placed inside the list are created once, but
* rendered for each list item. For this reason, it's best to use only simple
* controls in	a List, such as {@link module:enyo/Control~Control} and {@link module:enyo/Image~Image}.
*
* A List's `components` block contains the controls to be used for a single
* row. This set of controls will be rendered for each row. You may customize
* row rendering by handling the [onSetupItem]{@link module:layout/List~List#onSetupItem}
* event.
*
* Events fired from within list rows contain the `index` property, which may
* be used to identify the row from which the event originated.
*
* Beginning with Enyo 2.2, lists have built-in support for swipeable and
* reorderable list items.  Individual list items are swipeable by default; to
* enable reorderability, set the [reorderable]{@link module:layout/List~List#reorderable}
* property to `true`.
*
* For more information, see the documentation on
* [Lists]{@linkplain $dev-guide/building-apps/layout/lists.html} in the
* Enyo Developer Guide.
*
* @class List
* @extends module:enyo/Scroller~Scroller
* @ui
* @public
*/
module.exports = kind(utils.mixin(methods,
	/** @lends module:layout/List~List.prototype */ {

	/**
	* @private
	*/
	name: 'enyo.List',

	/**
	* @private
	*/
	kind: Scroller,

	/**
	* @private
	*/
	classes: 'enyo-list',

	/**
	* @lends module:layout/List~List.prototype
	* @private
	*/
	published: {
		/**
		* The number of rows contained in the list. Note that as the amount of
		* list data changes, `setRows()` may be called to adjust the number of
		* rows. To re-render the list at the current position when the count has
		* changed, call the [refresh()]{@link module:layout/List~List#refresh} method.  If the
		* whole data model of the list has changed and you want to redisplay it
		* from the top, call [reset()]{@link module:layout/List~List#reset}.
		*
		* @type {Number}
		* @default 0
		* @public
		*/
		count: 0,
		/**
		* The number of rows to be shown in a given list page segment. There is
		* generally no need to adjust this value.
		*
		* @type {Number}
		* @default 50
		* @public
		*/
		rowsPerPage: 50,
		/**
		* Direction in which the list will be rendered and in which it will be
		* scrollable. Valid values are `'v'` for vertical or `'h'` for horizontal.
		*
		* @type {String}
		* @default 'v'
		* @public
		*/
		orient: 'v',
		/**
		* If `true`, the list is rendered such that row `0` is at the bottom of
		* the viewport and the beginning position of the list is scrolled to the
		* bottom.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		bottomUp: false,
		/**
		* If `true`, the selection mechanism is disabled. Tap events are still
		* sent, but items won't be automatically re-rendered when tapped.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		noSelect: false,

		/**
		 * If `true`, multiple selection is allowed.
		 *
		 * @type {Boolean}
		 * @default false
		 * @public
		 */
		multiSelect: false,

		/**
		* If `true`, the selected item will toggle.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		toggleSelected: false,

		/**
		* If `true`, the list will assume that all rows have the same size to
		* optimize performance.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		fixedSize: false,

		/**
		* If `true`, the list will allow the user to reorder list items.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		reorderable: false,

		/**
		* If `true` and `reorderable` is true, a reorderable item will be centered
		* on finger when created. If `false`, it will be created over the old item
		* and will then track finger.
		*
		* @type {Boolean}
		* @default true
		* @public
		*/
		centerReorderContainer: true,

		/**
		* An array containing components to be shown as a placeholder when
		* reordering list items.
		*
		* @type {module:enyo/Control~Control[]}
		* @public
		*/
		reorderComponents: [],

		/**
		* An array containing components for the pinned version of a row. If not
		* specified, reordering will not support pinned mode.
		*
		* @type {module:enyo/Control~Control[]}
		* @public
		*/
		pinnedReorderComponents: [],

		/**
		* An array containing any swipeable components that will be used.
		*
		* @type {module:enyo/Control~Control[]}
		* @public
		*/
		swipeableComponents: [],

		/**
		* If `true`, swipe functionality is enabled.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		enableSwipe: false,

		/**
		* If `true`, the list will persist the current swipeable item.
		*
		* @type {Boolean}
		* @default false
		* @public
		*/
		persistSwipeableItem: false
	},

	/**
	* @private
	*/
	events: {
		onSetupItem: '',
		onSetupReorderComponents: '',
		onSetupPinnedReorderComponents: '',
		onReorder: '',
		onSetupSwipeItem: '',
		onSwipeDrag: '',
		onSwipe: '',
		onSwipeComplete: ''
	},

	/**
	* @private
	*/
	handlers: {
		onAnimateFinish: 'animateFinish',
		onRenderRow: 'rowRendered',
		ondragstart: 'dragstart',
		ondrag: 'drag',
		ondragfinish: 'dragfinish',
		onup: 'up',
		onholdpulse: 'holdpulse',
		onflick: 'flick'
	},

	/**
	* Average row size (in pixels), calculated as `(page size / number of rows per page)`.
	*
	* @private
	*/
	rowSize: 0,

	/**
	* @private
	*/
	listTools: [
		{name: 'port', classes: 'enyo-list-port enyo-border-box', components: [
			{name: 'generator', kind: FlyweightRepeater, canGenerate: false, components: [
				{tag: null, name: 'client'}
			]},
			{name: 'holdingarea', allowHtml: true, classes: 'enyo-list-holdingarea'},
			{name: 'page0', allowHtml: true, classes: 'enyo-list-page'},
			{name: 'page1', allowHtml: true, classes: 'enyo-list-page'},
			{name: 'placeholder', classes: 'enyo-list-placeholder'},
			{name: 'swipeableComponents', style: 'position:absolute; display:block; top:-1000px; left:0;'}
		]}
	],

	//* Reorder vars

	/**
	* Length of time, in milliseconds, to wait for to active reordering.
	*
	* @type {Number}
	* @default 600
	* @private
	*/
	reorderHoldTimeMS: 600,

	/**
	* Index of the row that we're moving.
	*
	* @type {Number}
	* @default -1
	* @private
	*/
	draggingRowIndex: -1,

	/**
	* @todo Seems to be cruft ... can't find any references to it in layout.
	* @private
	*/
	initHoldCounter: 3,

	/**
	* @todo Seems to be cruft ... can't find any references to it in layout.
	* @private
	*/
	holdCounter: 3,

	/**
	* @todo Seems to be cruft ... can't find any references to it in layout.
	* @private
	*/
	holding: false,

	/**
	* Index of the row before which the placeholder item will be shown. If the
	* placeholder is at the end of the list, this value will be one larger than
	* the row count.
	*
	* @type {Number}
	* @private
	*/
	placeholderRowIndex: -1,

	/**
	* Determines scroll height at top/bottom of list where dragging will cause scroll.
	*
	* @type {Number}
	* @default 0.1
	* @private
	*/
	dragToScrollThreshold: 0.1,

	/**
	 * Amount to scroll during autoscroll.
	 *
	 * @type {Number}
	 * @default 0
	 * @private
	 */
	scrollDistance: 0,

	/**
	* Used to determine direction of scrolling during reordering.
	*
	* @private
	*/
	prevScrollTop: 0,

	/**
	* Number of milliseconds between scroll events when autoscrolling.
	*
	* @type {Number}
	* @default 20
	* @private
	*/
	autoScrollTimeoutMS: 20,

	/**
	* Holds timeout ID for autoscroll.
	*
	* @private
	*/
	autoScrollTimeout: null,

	/**
	* Keep last event Y coordinate to update placeholder position during autoscroll.
	*
	* @type {Number}
	* @private
	*/
	autoscrollPageY: 0,

	/**
	* Set to `true` to indicate that we're in pinned reordering mode.
	*
	* @type {Boolean}
	* @default false
	* @private
	*/
	pinnedReorderMode: false,

	/**
	* y-coordinate of the original location of the pinned row.
	*
	* @type {Number}
	* @private
	*/
	initialPinPosition: -1,

	/**
	* Set to `true` after drag-and-drop has moved the item to reorder at least
	* one space. Used to activate pin mode if item is dropped immediately.
	*
	* @type {Boolean}
	* @default false
	* @private
	*/
	itemMoved: false,

	/**
	* Tracks the page where the item being dragged is, so we can detect when we
	* switch pages and need to adjust rendering.
	*
	* @type {Number}
	* @private
	*/
	currentPageNumber: -1,

	/**
	* Timeout for completing reorder operation.
	*
	* @private
	*/
	completeReorderTimeout: null,

	//* Swipeable vars

	/**
	* Index of swiped item.
	*
	* @type {Number}
	* @private
	*/
	swipeIndex: null,

	/**
	* Direction of swipe.
	*
	* @type {Number}
	* @private
	*/
	swipeDirection: null,

	/**
	* `true` if a persistent item is currently persisting.
	*
	* @type {Boolean}
	* @default false
	* @private
	*/
	persistentItemVisible: false,

	/**
	* Side from which the persisting item came.
	*
	* @type {String}
	* @private
	*/
	persistentItemOrigin: null,

	/**
	* `true` if swipe was completed.
	*
	* @type {Boolean}
	* @private
	*/
	swipeComplete: false,

	/**
	* Timeout when waiting for swipe action to complete.
	*
	* @private
	*/
	completeSwipeTimeout: null,

	/**
	* Length of time (in milliseconds) to wait before completing swipe action.
	*
	* @type {Number}
	* @default 500
	* @private
	*/
	completeSwipeDelayMS: 500,

	/**
	* Duration (in milliseconds) of normal swipe animation.
	*
	* @type {Number}
	* @default 200
	* @private
	*/
	normalSwipeSpeedMS: 200,

	/**
	* Duration (in milliseconds) of fast swipe animation.
	*
	* @type {Number}
	* @default 100
	* @private
	*/
	fastSwipeSpeedMS: 100,

	/**
	* Percentage of a swipe needed to force completion of the swipe.
	*
	* @type {Number}
	* @default 0.2
	* @private
	*/
	percentageDraggedThreshold: 0.2
}));

},{'./methods':'layout/methods'}]
	};

});
//# sourceMappingURL=layout.js.map
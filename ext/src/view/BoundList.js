/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2015 Sencha Inc

Contact:  http://www.sencha.com/contact

Commercial Usage
Licensees holding valid commercial licenses may use this file in accordance with the Commercial
Software License Agreement provided with the Software or, alternatively, in accordance with the
terms contained in a written agreement between you and Sencha.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2015-11-03 08:25:14 (d0081e0ea79af5ba3ff46d28472deb24d2cb5b6d)
*/
/**
 * An internally used DataView for {@link Ext.form.field.ComboBox ComboBox}.
 */
Ext.define('Ext.view.BoundList', {
    extend: 'Ext.view.View',
    alias: 'widget.boundlist',
    alternateClassName: 'Ext.BoundList',
    requires: ['Ext.layout.component.BoundList', 'Ext.toolbar.Paging'],

    mixins: {
        queryable: 'Ext.Queryable'
    },

    /**
     * @cfg {Number} [pageSize=0]
     * If greater than `0`, a {@link Ext.toolbar.Paging} is displayed at the bottom of the list and store
     * queries will execute with page {@link Ext.data.Operation#start start} and
     * {@link Ext.data.Operation#limit limit} parameters.
     */
    pageSize: 0,

    /**
     * @cfg {String} [displayField=""]
     * The field from the store to show in the view.
     */

    /**
     * @property {Ext.toolbar.Paging} pagingToolbar
     * A reference to the PagingToolbar instance in this view. Only populated if {@link #pageSize} is greater
     * than zero and the BoundList has been rendered.
     */

    // private overrides
    baseCls: Ext.baseCSSPrefix + 'boundlist',
    itemCls: Ext.baseCSSPrefix + 'boundlist-item',
    listItemCls: '',
    shadow: false,
    trackOver: true,
    refreshed: 0,

    preserveScrollOnRefresh: true,

    // This Component is used as a popup, not part of a complex layout. Display data immediately.
    deferInitialRefresh: false,

    componentLayout: 'boundlist',

    childEls: [
        'listEl'
    ],

    renderTpl: [
        '<div id="{id}-listEl" role="presentation" class="{baseCls}-list-ct ', Ext.dom.Element.unselectableCls, '" style="overflow:auto"></div>',
        '{%',
            'var me=values.$comp, pagingToolbar=me.pagingToolbar;',
            'if (pagingToolbar) {',
                'pagingToolbar.ownerLayout = me.componentLayout;',
                'Ext.DomHelper.generateMarkup(pagingToolbar.getRenderTree(), out);',
            '}',
        '%}',
        {
            disableFormats: true
        }
    ],

    /**
     * @cfg {String/Ext.XTemplate} tpl
     * A String or Ext.XTemplate instance to apply to inner template.
     *
     * {@link Ext.view.BoundList} is used for the dropdown list of 
     * {@link Ext.form.field.ComboBox}. To customize the template you can set the tpl on 
     * the combobox config object:
     *
     *     Ext.create('Ext.form.field.ComboBox', {
     *         fieldLabel   : 'State',
     *         queryMode    : 'local',
     *         displayField : 'text',
     *         valueField   : 'abbr',
     *         store        : Ext.create('StateStore', {
     *             fields : ['abbr', 'text'],
     *             data   : [
     *                 {"abbr":"AL", "name":"Alabama"},
     *                 {"abbr":"AK", "name":"Alaska"},
     *                 {"abbr":"AZ", "name":"Arizona"}
     *                 //...
     *             ]
     *         }),
     *         // Template for the dropdown menu.
     *         // Note the use of the "x-list-plain" and "x-boundlist-item" class,
     *         // this is required to make the items selectable.
     *         tpl: Ext.create('Ext.XTemplate',
     *             '<ul class="x-list-plain"><tpl for=".">',
     *                 '<li role="option" class="x-boundlist-item">{abbr} - {name}</li>',
     *             '</tpl></ul>'
     *         ),
     *     });
     *
     * Defaults to:
     *
     *     Ext.create('Ext.XTemplate',
     *         '<ul><tpl for=".">',
     *             '<li role="option" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
     *         '</tpl></ul>'
     *     );
     *
     */

    initComponent: function() {
        var me = this,
            baseCls = me.baseCls,
            itemCls = me.itemCls;

        me.selectedItemCls = baseCls + '-selected';
        if (me.trackOver) {
            me.overItemCls = baseCls + '-item-over';
        }
        me.itemSelector = "." + itemCls;

        if (me.floating) {
            me.addCls(baseCls + '-floating');
        }

        if (!me.tpl) {
            // should be setting aria-posinset based on entire set of data
            // not filtered set
            me.tpl = new Ext.XTemplate(
                '<ul class="' + Ext.plainListCls + '"><tpl for=".">',
                    '<li role="option" unselectable="on" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
                '</tpl></ul>'
            );
        } else if (!me.tpl.isTemplate) {
            me.tpl = new Ext.XTemplate(me.tpl);
        }

        if (me.pageSize) {
            me.pagingToolbar = me.createPagingToolbar();
        }

        me.callParent();
    },

    getRefOwner: function() {
        return this.pickerField || this.callParent();
    },

    getRefItems: function() {
        var me = this,
            result = [];

        if (me.pagingToolbar) {
            result.push(me.pagingToolbar);
        }
        if (me.loadMask) {
            result.push(me.loadMask);
        }
        return result;
    },

    createPagingToolbar: function() {
        return Ext.widget('pagingtoolbar', {
            id: this.id + '-paging-toolbar',
            pageSize: this.pageSize,
            store: this.dataSource,
            border: false,
            ownerCt: this,
            ownerLayout: this.getComponentLayout()
        });
    },

    // Do the job of a container layout at this point even though we are not a Container.
    // TODO: Refactor as a Container.
    finishRenderChildren: function () {
        var toolbar = this.pagingToolbar;

        this.callParent(arguments);

        if (toolbar) {
            toolbar.finishRender();
        }
    },

    refresh: function(){
        var me = this,
            tpl = me.tpl,
            toolbar = me.pagingToolbar,
            rendered = me.rendered;

        // Allow access to the context for XTemplate scriptlets
        tpl.field = me.pickerField;
        tpl.store = me.store;
        me.callParent();
        tpl.field =  tpl.store = null;

        // The view removes the targetEl from the DOM before updating the template
        // Ensure the toolbar goes to the end
        if (rendered && toolbar && toolbar.rendered && !me.preserveScrollOnRefresh) {
            me.el.appendChild(toolbar.el);
        }

        // IE6 strict can sometimes have repaint issues when showing
        // the list from a remote data source
        if (rendered && Ext.isIE6 && Ext.isStrict) {
            me.listEl.repaint();
        }
    },

    bindStore: function(store, initial) {
        var toolbar = this.pagingToolbar;

        this.callParent(arguments);
        if (toolbar) {
            toolbar.bindStore(store, initial);
        }
    },

    getTargetEl: function() {
        return this.listEl || this.el;
    },

    // The UL element.
    getNodeContainer: function() {
        return Ext.get(this.listEl.dom.firstChild);
    },

    /**
     * A method that returns the inner template for displaying items in the list.
     * This method is useful to override when using a more complex display value, for example
     * inserting an icon along with the text.
     *
     * The XTemplate is created with a reference to the owning form field in the `field` property to provide access
     * to context. For example to highlight the currently typed value, the getInnerTpl may be configured into a 
     * ComboBox as part of the {@link Ext.form.field.ComboBox#listConfig listConfig}:
     *
     *    listConfig: {
     *        getInnerTpl: function() {
     *            return '{[values.name.replace(this.field.getRawValue(), "<b>" + this.field.getRawValue() + "</b>")]}';
     *        }
     *    }
     * @param {String} displayField The {@link #displayField} for the BoundList.
     * @return {String} The inner template
     */
    getInnerTpl: function(displayField) {
        return '{' + displayField + '}';
    },

    onDestroy: function() {
        Ext.destroyMembers(this, 'pagingToolbar', 'listEl');
        this.callParent();
    }
});

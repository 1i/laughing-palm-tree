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
 * @private
 */
Ext.define('Ext.tree.ViewDragZone', {
    extend: 'Ext.view.DragZone',

    isPreventDrag: function(e, record) {
        return (record.get('allowDrag') === false) || !!e.getTarget(this.view.expanderSelector);
    },

    getDragText: function() {
        var records = this.dragData.records,
            count = records.length,
            text = records[0].get(this.displayField),
            suffix = 's',
            formatRe = /\{\d+\}/,
            dragText = this.dragText;

        if (formatRe.test(dragText) && count === 1 && text) {
            return text;
        } else if (!text) {
            suffix = '';
        }
        return Ext.String.format(dragText, count, suffix);
    },

    afterRepair: function() {
        var me = this,
            view = me.view,
            selectedRowCls = view.selectedItemCls,
            records = me.dragData.records,
            r,
            rLen    = records.length,
            fly = Ext.fly,
            item;

        if (Ext.enableFx && me.repairHighlight) {
            // Roll through all records and highlight all the ones we attempted to drag.
            for (r = 0; r < rLen; r++) {
                // anonymous fns below, don't hoist up unless below is wrapped in
                // a self-executing function passing in item.
                item = view.getNode(records[r]);

                // We must remove the selected row class before animating, because
                // the selected row class declares !important on its background-color.
                fly(item.firstChild).highlight(me.repairHighlightColor, {
                    listeners: {
                        beforeanimate: function() {
                            if (view.isSelected(item)) {
                                fly(item).removeCls(selectedRowCls);
                            }
                        },
                        afteranimate: function() {
                            if (view.isSelected(item)) {
                                fly(item).addCls(selectedRowCls);
                            }
                        }
                    }
                });
            }

        }
        me.dragging = false;
    }
});
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
 * Component layout for Ext.form.FieldSet components
 * @private
 */
Ext.define('Ext.layout.component.FieldSet', {
    extend: 'Ext.layout.component.Body',
    alias: ['layout.fieldset'],

    type: 'fieldset',
    
    defaultCollapsedWidth: 100,

    beforeLayoutCycle: function (ownerContext) {
        if (ownerContext.target.collapsed) {
            ownerContext.heightModel = this.sizeModels.shrinkWrap;
        }
    },

    beginLayout: function(ownerContext) {
        var legend = this.owner.legend;
        this.callParent([ownerContext]);
        if (legend) {
            ownerContext.legendContext = ownerContext.context.getCmp(legend);
        }
    },

    beginLayoutCycle: function (ownerContext) {
        var target = ownerContext.target,
            lastSize;

        this.callParent(arguments);

        // Each time we begin (2nd+ would be due to invalidate) we need to publish the
        // known contentHeight if we are collapsed:
        //
        if (target.collapsed) {
            ownerContext.setContentHeight(0);
            // if we're collapsed, ignore a minHeight because it's likely going to
            // be greater than the collapsed height
            ownerContext.restoreMinHeight = target.minHeight;
            delete target.minHeight;

            // If we are also shrinkWrap width, we must provide a contentWidth (since the
            // container layout is not going to run).
            //
            if (ownerContext.widthModel.shrinkWrap) {
                lastSize = this.lastComponentSize;
                ownerContext.setContentWidth((lastSize && lastSize.contentWidth) || this.defaultCollapsedWidth);
            }
        }
    },
    
    finishedLayout: function(ownerContext) {
        var owner = this.owner,
            restore = ownerContext.restoreMinHeight;
             
        this.callParent(arguments);
        if (restore) {
            owner.minHeight = restore;
        }
    },

    calculateOwnerWidthFromContentWidth: function(ownerContext, contentWidth) {
        var legendContext = ownerContext.legendContext;
        if (legendContext) {
            contentWidth = Math.max(contentWidth, legendContext.getProp('width'));
        }
        return this.callParent([ownerContext, contentWidth]);
    },

    calculateOwnerHeightFromContentHeight: function (ownerContext, contentHeight) {
        var border = ownerContext.getBorderInfo(),
            legendContext = ownerContext.legendContext;
            
        // Height of fieldset is content height plus top border width (which is either the
        // legend height or top border width) plus bottom border width
        return ownerContext.getProp('contentHeight') +
               ownerContext.getPaddingInfo().height +
               // In IE8m and IEquirks the top padding is on the body el
               ((Ext.isIEQuirks || Ext.isIE8m) ?
                   ownerContext.bodyContext.getPaddingInfo().top : 0) +
               (legendContext ? legendContext.getProp('height') : border.top) +
               border.bottom;
    },

    publishInnerHeight: function (ownerContext, height) {
        // Subtract the legend off here and pass it up to the body
        // We do this because we don't want to set an incorrect body height
        // and then setting it again with the correct value
        var legendContext = ownerContext.legendContext,
            legendHeight = 0;

        if (legendContext) {
            legendHeight = legendContext.getProp('height');
        }
        if (legendHeight === undefined) {
            this.done = false;
        } else {
            this.callParent([ownerContext, height - legendHeight]);
        }
    },

    getLayoutItems : function() {
        var legend = this.owner.legend;
        return legend ? [legend] : [];
    }
});
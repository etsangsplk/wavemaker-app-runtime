/*global WM, document, _ */
/*jslint sub: true*/
/*Directive for popover */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/basic/popover.html',
                '<div class="app-popover popover invisible {{class}} {{popoverplacement}}" data-ng-style="{width : popoverwidth, height : popoverheight}">' +
                    '<div class="arrow" data-ng-show="popoverarrow"></div>' +
                    '<wm-container class="popover-content" content="{{content}}"></wm-container>' +
                '</div>');
    }])
    .directive('wmPopover', ['PropertiesFactory', 'WidgetUtilService', '$sce', 'Utils', 'CONSTANTS', '$rootScope', '$compile', '$templateCache', '$timeout', function (PropertiesFactory, WidgetUtilService, $sce, Utils, CONSTANTS, $rootScope, $compile, $templateCache, $timeout) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.popover', ['wm.base', 'wm.base.editors', 'wm.anchor']),
            notifyFor = {
                'iconclass': true,
                'iconurl': true,
                'caption': true
            },
            popoverProperties = PropertiesFactory.getPropertiesOf('wm.popover');

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'iconposition':
                element.attr('icon-position', newVal);
                break;
            case 'iconclass':
                /*showing icon when iconurl is not set*/
                scope.showicon = scope.iconclass !== '_none_' && newVal !== '' && !scope.iconurl;
                break;
            case 'iconurl':
                /*hiding icon when iconurl is set*/
                /*showing icon when iconurl is not set*/
                var showIcon = newVal === '';
                scope.showicon = showIcon;
                scope.showimage = !showIcon;
                scope.iconsrc = Utils.getImageUrl(newVal);
                break;
            case 'caption':
                if (WM.isObject(newVal)) {
                    element.find('>span.anchor-caption').text(JSON.stringify(newVal));
                } else {
                    element.find('>span.anchor-caption').html(($sce.trustAs($sce.HTML, newVal.toString()).toString()));
                }
                break;
            }
        }

        /* returns element dimensions' absolute value*/
        function getEleDimensions(ele) {
            return {
                'width' : Math.abs(ele.outerWidth()),
                'height' : Math.abs(ele.outerHeight())
            };
        }
        /**
         * Object to listen for an event on an element's parent but not on the element itself.
         *
         * @param parent - element whose events have to be listened.
         * @param child  - element whose events have to be skipped.
         * @constructor
         */
        function ParentEventListener(parent, child) {
            var processEvent = false,
                objectId = 'parenteventlistener' + new Date().getTime();
            function getEventName(event) {
                return event + '.' + objectId;
            }
            /* add callback to invoke when the event occurs */
            this.on = function (event, callBack) {
                var eventName = getEventName(event);
                child.off(eventName).on(eventName, function () {
                    processEvent = false;
                });
                parent.off(eventName).on(eventName, function (event) {
                    if (processEvent) {
                        Utils.triggerFn(callBack, event);
                    } else {
                        processEvent = true;
                    }
                });
            };
            /* turns off event listening */
            this.off = function (event) {
                var eventName = getEventName(event);
                processEvent = false;
                child.off(eventName);
                parent.off(eventName);
            };
        }
        /**
         * Computes popover position based on the available port area and placement preference.
         * @param hook - element, in relative to which the popover has to be placed.
         * @param popoverEle - the popver element for which the position has to be computed.
         * @param placement - [left, right, top, bottom] in reference to hook.
         * @returns {{left: *, top: *}}
         */
        function computePopoverPosition(hook, popoverEle, placement) {
            var popoverDims = getEleDimensions(popoverEle),
                arrow = popoverEle.find('.arrow'),
                arrowDims = {'width' : 0, height : 0},
                documentDims = getEleDimensions(WM.element(document)),
                targetDims = getEleDimensions(hook),
                targetPosition = hook.offset(),
                tipOffset = {
                    'width': -arrowDims.width / 2,
                    'height': -arrowDims.height / 2
                },
                popoverPosition = {
                    'left' : targetPosition.left + tipOffset.width,
                    'top'  : targetPosition.top + tipOffset.height
                };
            if (placement === 'left' || placement === 'right') {
                if (placement === 'left') {
                    popoverPosition.left += (-1 * (popoverDims.width + arrowDims.width));
                } else {
                    popoverPosition.left += targetDims.width + arrowDims.width;
                }
                if (targetPosition.top + popoverDims.height <= documentDims.height) {
                    arrow.addClass('top');
                } else {
                    popoverPosition.top = targetPosition.top + targetDims.height - popoverDims.height;
                    arrow.addClass('bottom');
                }
            } else if (placement === 'top' || placement === 'bottom') {
                if (placement === 'top') {
                    popoverPosition.top += (-1 * popoverDims.height);
                } else {
                    popoverPosition.top += targetDims.height + arrowDims.height;
                }
                if (targetPosition.left + popoverDims.width <= documentDims.width) {
                    arrow.addClass('left');
                } else {
                    popoverPosition.left = targetPosition.left + targetDims.width - popoverDims.width;
                    arrow.addClass('right');
                }
            }
            return popoverPosition;
        }

        /**
         * Constructs popover inheriting from the controller scope
         * @param element - target element to which the popiver has to be attached.
         * @returns a scope to use for popover
         */
        function createPopoverScope(element) {
            var scope = element.isolateScope(),
                popoverScope = element.scope().$new(true);
            _.forEach(_.keys(popoverProperties), function (k) {
                popoverScope[k] = scope[k];
            });
            return popoverScope;
        }
        /**
         * Transfers focus to the first focusable child of the given element.
         * Following are focusable elements.
         * 1) Element with tabIndex
         * 2) input or button or select
         * @param element
         */
        function shiftFocusToChild(element) {
            var selectors = ['[tabindex]:first', 'button:first,input:first,select:first'];
            _.forEach(selectors, function (selector) {
                var e = element.find(selector);
                if (e.length > 0) {
                    e.focus();
                    return false;
                }
            });
        }

        /**
         * Constructs Popover element and adds it to the top-level page.
         *
         * @param element element to which the popover has to be hooked.
         * @param onAutoClose callback to invoke when popover closes automatically.
         * @constructor
         */
        function Popover(element, onAutoClose) {
            var scope = element.isolateScope(),
                popoverScope = createPopoverScope(element),
                page = $rootScope.$activePageEl,
                popoverEle = $compile($templateCache.get('template/widget/basic/popover.html'))(popoverScope),
                pageClickListener;
            page.append(popoverEle);
            popoverEle.show();
            $timeout(function () {
                var includedPageScope = popoverEle.find('[data-ng-controller]:first').scope();
                scope.Widgets = includedPageScope.Widgets;
                scope.Variables = includedPageScope.Variables;
                popoverEle.css(computePopoverPosition(element, popoverEle, popoverScope.popoverplacement));
                popoverEle.removeClass('invisible');
                shiftFocusToChild(popoverEle);
            }, 100);
            if (popoverScope.popoverautoclose) {
                pageClickListener = new ParentEventListener(page, popoverEle);
                pageClickListener.on('click', function (event) {
                    Utils.triggerFn(onAutoClose, event);
                });
            }
            /**
             * Does the clean up.
             */
            this.destroy = function () {
                if (pageClickListener) { pageClickListener.off('click'); }
                popoverScope.$destroy();
                popoverEle.remove();
                popoverScope = popoverEle = undefined;
                delete scope['Widgets'];
                delete scope['Variables'];
            };
        }
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function () {
                var template = WM.element($templateCache.get('template/widget/anchor.html'));
                if (CONSTANTS.isRunMode) {
                    template.attr('data-ng-click', 'togglePopover($event)');
                    template.attr('data-ng-keydown', 'togglePopover($event)');
                }
                template.addClass('app-popover-anchor');
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.showicon = !scope.iconurl;
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        var popover,
                            onClose = function (event) {
                                scope.togglePopover(event);
                            };
                        if (CONSTANTS.isRunMode) {
                            scope.togglePopover = function (event) {
                                if (event.keyCode && event.keyCode !== 13) {
                                    //If it is a key event and Enter key, then process it.
                                    return;
                                }
                                if (popover) {
                                    //destroy the existing popover
                                    popover.destroy();
                                    popover = undefined;
                                    element.removeClass('app-popover-open');
                                    //Set the focus basck to anchor element
                                    element.focus();
                                    Utils.triggerFn(scope.onHide, {'$event': event, '$scope': scope});
                                } else {
                                    popover = new Popover(element, onClose);
                                    element.addClass('app-popover-open');
                                    Utils.triggerFn(scope.onShow, {'$event': event, '$scope' : scope});
                                }
                                return false;
                            };
                        }
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmPopover
 * @restrict E
 *
 * @description
 * The `wmPopover` directive defines the popover widget.
 * It can be dragged and moved in the canvas.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $sce
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the popover.
 * @param {string=} hint
 *                  Title/hint for the anchor. <br>
 *                  This is a bindable property.
 * @param {string=} caption
 *                  Content of the popover. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the popover.
 * @param {string=} content
 *                  This property specifies the content of the popover widget. <br>
 *                  Possible values are `Inline content` and `Page's content`. <br>
 *                  Page's content values are `login`, `footer`, `header`, `lefnav`, `rightnav`, and `topnav`.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the popover on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} popoverplacement
 *                  This property defines the position of the popover <br>
 *                  Possible values are 'top', 'bottom', 'left', and 'right'. <br>
 *                  Default value: `bottom`.
 * @param {boolean=} popoverarrow
 *                  If set true, then a arrow pointer will be shown. <br>
 *                  Default value: `true`.
 * @param {boolean=} popoverautoclose
 *                  If set true, then a click on the document (except popover content) will automatically close the popover. <br>
 *                  Default value: `true`.
 * @param {string=} animation
 *                  This property controls the animation of the popover widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, `etc`.
 * @param {string=} iconclass
 *                  CSS class for the icon. <br>
 *                  This is a bindable property.
 * @param {string=} iconurl
 *                  url of the icon. <br>
 *                  This is a bindable property.
 * @param {string=} iconwidth
 *                  Width of the icon. <br>
 *                  Default value: 16px
 * @param {string=} iconheight
 *                  Height of the icon. <br>
 *                  Default value: 16px
 * @param {string=} iconmargin
 *                  Margin of the icon.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-popover caption="Click here to see the popover"
                    content="dropdownMenu"
                    popoverwidth="500"
                    popoverheight="200"
                    popoverautoclose="true"
                    popoverplacement="bottom"
                    popoverarrow="true"></wm-popover>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
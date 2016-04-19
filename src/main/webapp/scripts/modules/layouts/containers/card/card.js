/*global WM, _*/
/*Directive for Card*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/container/card.html',
            '<div init-widget class="app-card card" ng-show="show" apply-styles="shell" wm-navigatable-element="true" ng-style="{height:height}">' +
                '<div class="app-card-header" ng-show="heading || subheading || iconclass || iconurl">' +
                    '<div class="app-card-avatar" ng-show="iconclass || iconurl">' +
                        '<i class="app-icon {{iconclass}}" ng-if="showIcon"></i>' +
                        '<wm-picture shape="circle" picturesource="{{iconurl}}" ng-if="showImage"></wm-picture>' +
                    '</div>' +
                    '<div class="app-card-header-text">' +
                        '<h4 class="card-heading">{{heading}}</h4>' +
                        '<h5 class="card-subheading text-muted">{{subheading}}</h5>' +
                    '</div>' +
                '</div>' +
                '<div class="app-card-image" ng-if="picturesource" ng-style="{\'height\':imageheight}">' +
                    '<wm-picture class="card-image" ng-style="{width:imagewidth, height:imageheight}" picturesource="{{picturesource}}" class="{{!(heading || subheading || iconclass || iconurl) ? \'border-radius-top\' : \'\'}}"></wm-picture>' +
                    '<h5 class="card-image-headline">{{picturetitle}}</h5>' +
                '</div>' +
                '<div ng-transclude="content"></div>' +
                '<div ng-transclude="actions"></div>' +
                '<div ng-transclude="footer"></div>' +
            '</div>'
            );
        $templateCache.put('template/layout/container/card-content.html', '<div apply-styles="container" init-widget page-container class="app-card-content card-body card-block"><div page-container-target wmtransclude></div></div>');
        $templateCache.put('template/layout/container/card-footer.html', '<div apply-styles="container" init-widget wmtransclude page-container-target class="app-card-footer text-muted card-footer"></div>');
        $templateCache.put('template/layout/container/card-actions.html', '<div apply-styles="container" class="app-card-actions" init-widget wmtransclude page-container></div>');
    }])
    .directive('wmCard', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.card', ['wm.layouts', 'wm.containers', 'wm.base.events.touch']),
            notifyFor = {
                'heading'   : true,
                'subheading': true,
                'iconclass' : true,
                'footer'    : true,
                'action'    : true,
                'content'   : true,
                'iconurl'   : true
            };

        //Apply border classes on change of header, content, actions
        function applyBorderClasses(scope) {
            var borderTop = scope.heading || scope.subheading || scope.iconclass || scope.iconurl || scope.picturesource;
            if (scope.content) {
                scope.content.borderTop    = borderTop ? '' : 'border-radius-top';
                scope.content.borderBottom = scope.footer || scope.action ? '' : 'border-radius-bottom';
            }
            if (scope.footer) {
                scope.footer.borderTop     = borderTop || scope.content || scope.action ? '' : 'border-radius-top';
            }
            if (scope.action) {
                scope.action.borderTop     = borderTop || scope.content ? '' : 'border-radius-top';
                scope.action.borderBottom  = !scope.footer ? 'border-radius-bottom' : '';
            }
        }

        // Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'heading':
            case 'subheading':
            case 'iconclass':
            case 'iconurl':
            case 'footer':
            case 'content':
            case 'action':
                if (key === 'iconurl') {
                    // showing icon when iconurl is not set & hiding icon when iconurl is set
                    var showIcon = newVal === '';
                    scope.showIcon = showIcon;
                    scope.showImage = !showIcon;
                } else if (key === 'iconclass') {
                    // showing icon when iconurl is not set
                    scope.showIcon = scope.iconclass !== '_none_' && newVal !== '' && !scope.iconurl;
                }
                applyBorderClasses(scope);
                break;
            }
        }
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': {
                'content': '?wmCardContent',
                'footer' : '?wmCardFooter',
                'actions': '?wmCardActions'
            },
            'template': function (tElement, tAttrs) {
                var template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/card.html', tElement, tAttrs));
                return template[0].outerHTML;
            },
            'controller': ['$scope', function ($s) {
                this.register = function (name, ele) {
                    $s[name] = ele.isolateScope();
                };
            }],
            'link': {
                'pre': function (iScope) {
                    if (CONSTANTS.isStudioMode) {
                        iScope.widgetProps = Utils.getClonedObject(widgetProps);
                    } else {
                        iScope.widgetProps = widgetProps;
                    }
                },
                'post': function (scope, element, attrs) {
                    // register the property change handler
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }])
    .directive('wmCardContent', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',

        function (PropertiesFactory, $templateCache, WidgetUtilService) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.cardcontent', ['wm.base', 'wm.layouts',  'wm.containers']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-content.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is) {
                        $is.widgetProps = widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('content', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmCardActions', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',

        function (PropertiesFactory, $templateCache, WidgetUtilService) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.cardactions', ['wm.base', 'wm.layouts',  'wm.containers']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-actions.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is) {
                        $is.widgetProps = widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('action', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmCardFooter', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',

        function (PropertiesFactory, $templateCache, WidgetUtilService) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.cardfooter', ['wm.base', 'wm.layouts',  'wm.containers']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-footer.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is) {
                        $is.widgetProps = widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('footer', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmCard
 * @restrict E
 * @element ANY
 * @description
 * The 'wmCard' directive defines a card in the page.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} heading
 *                  Heading of the card widget. This property is a bindable property.
 * @param {string=} subheading
 *                  Sub Heading of the card widget. This property is a bindable property.
 * @param {string=} picturesource
 *                  picturesource of the card widget. This property is a bindable property.
 * @param {string=} picturetitle
 *                  picturetitle on to the picture of card widget. This property is a bindable property.
 * @param {string=} name
 *                  Name of the card widget.
 * @param {string=} width
 *                  Width of the card widget.
 * @param {string=} height
 *                  Height of the card widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the card widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the card widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} iconclass
 *                  To define class of icon applied to the button for the card widget. This property is a bindable property.
 * @param {string=} horizontalalign
 *                  Align the content in the card to left/right/center.<br>
 * @param {string=} mouseover
 *                  Callback function which will be triggered when the mouse moves over the card.
 * @param {string=} mouseout
 *                  Callback function which will be triggered when the mouse away from the card.
 * @param {string=} mouseenter
 *                  Callback function which will be triggered when the mouse enters inside the card.
 * @param {string=} mouseleave
 *                  Callback function which will be triggered when the mouse leaves the card.
 * @example
 <example module="wmCore">
     <file name="index.html">
         <div data-ng-controller="Ctrl" class="wm-app">
             <wm-card width="400" height="500" heading="Daily Sync Up" subheading="Event">
                 <wm-card-content>
                     <wm-layoutgrid>
                         <wm-gridrow>
                             <wm-gridcolumn columnwidth="12">
                                <wm-label caption="Road map for Sprint 2" height="35" width="100%"></wm-label>
                             </wm-gridcolumn>
                         </wm-gridrow>
                     </wm-layoutgrid>
                 </wm-card-content>
                 <wm-card-actions>
                     <wm-layoutgrid>
                         <wm-gridrow>
                             <wm-gridcolumn columnwidth="12" horizontalalign="right">
                                <wm-button class="btn-transparent" caption="" type="button" iconclass="glyphicon glyphicon-trash fa-2x" height="45" width="42" color="red" hint="Delete Event"></wm-button>
                             </wm-gridcolumn>
                         </wm-gridrow>
                     </wm-layoutgrid>
                 </wm-card-actions>
             </wm-card>
         </div>
     </file>
     <file name="script.js">
     function Ctrl($scope) {}
     </file>
 </example>
 */
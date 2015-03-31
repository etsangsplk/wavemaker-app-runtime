/*global WM*/
/* Directive for Container */

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/container/container.html',
            '<div page-container init-widget class="app-container" data-ng-show="show" ' + $rootScope.getWidgetStyles('container') + ' wmtransclude page-container-target></div>'
            );
    }])
    .directive('wmContainer', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.container', ['wm.layouts', 'wm.containers', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    $template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/container.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onEnterkeypress')) {
                        $template.attr('data-ng-keypress', 'onKeypress({$event: $event, $scope: this})');
                    }
                }
                return $template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                    },
                    'post': function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (!scope.widgetid) {
                            scope.onKeypress = function (args) {
                                var action = Utils.getActionFromKey(args.$event);
                                if (action === 'ENTER') {
                                    scope.onEnterkeypress(args);
                                }
                            };
                        }
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmContainer
 * @restrict E
 * @element ANY
 * @description
 * The 'wmContainer' directive defines a container in the page.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the container widget.
 * @param {string=} width
 *                  Width of the container widget.
 * @param {string=} height
 *                  Height of the container widget.
 * @param {string=} content
 *                  Sets content for the container. <br>
 *                  It can be Inline content(incase of html widget) or Page's content(incase of page container widgets) will be included in the widget.<br>
 *                  Default value: `Inline Content`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the container widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the container widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} horizontalalign
 *                  Align the content in the container to left/right/center.<br>
 * @param {string=} click
 *                  Callback function which will be triggered when the container widget is clicked.
 * @param {string=} double-click
 *                  Callback function which will be triggered when the container widget is double clicked.
 * @param {string=} mouse-over
 *                  Callback function which will be triggered when mouse moves over the container widget.
 * @param {string=} mouse-out
 *                  Callback function which will be triggered when mouse moves away from the container widget.
 * @param {string=} mouse-enter
 *                  Callback function which will be triggered when mouse enters inside the container widget.
 * @param {string=} mouse-leave
 *                  Callback function which will be triggered when mouse leaves the container widget.
 * @param {string=} enter-key-press
 *                  Callback function which will be triggered when enter key is pressed.
 * @param {string=} swipeup
 *                  Callback function which will be triggered when the container widget is swiped out.
 * @param {string=} swipedown
 *                  Callback function which will be triggered when the container widget is swiped down.
 * @param {string=} swiperight
 *                  Callback function which will be triggered when the container widget is swiped right.
 * @param {string=} swipeleft
 *                  Callback function which will be triggered when the container widget is swiped left.
 * @param {string=} pinchin
 *                  Callback function which will be triggered when the container widget is pinched in.
 * @param {string=} pinchout
 *                  Callback function which will be triggered when the container widget is pinched out.
 *
 *
 * @example
 <example module="wmCore">
 <file name="index.html">
 <wm-container>
 <wm-composite widget="text">
 <wm-label></wm-label>
 <wm-text></wm-text>
 </wm-composite>
 <wm-composite widget="textarea">
 <wm-label></wm-label>
 <wm-textarea></wm-textarea>
 </wm-composite>
 </wm-container>
 </file>
 </example>
 */

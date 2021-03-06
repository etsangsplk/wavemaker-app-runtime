/*global WM, wmCoreModule, document, window, _*/

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/dialog-template.html",
            '<div tabindex="-1" role="dialog" class="modal default" ng-style="{display: \'block\'}" ng-click="close($event)" uib-modal-transclude></div>'
            );
        $templateCache.put("template/widget/dialog/dialog.html",
            '<div class="modal-dialog app-dialog" init-widget ng-style="{width: dialogWidth}" >' +
                '<div class="modal-content">' +
                    '<div class="app-dialog-header modal-header" title="{{hint}}" ng-if="showheader">' +
                        '<button ng-if="closable" aria-label="Close" class="app-dialog-close close" ng-click="hideDialog()" title="Close">' +
                            '<span aria-hidden="true">&times;</span>' +
                        '</button>' +
                        '<h4 class="app-dialog-title modal-title">' +
                            '<i class="{{iconclass}}" ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}"></i> ' +
                            '<span name="wm-{{dialogid}}-title">{{title}}</span>' +
                            '<span class="dialog-sub-heading" name="wm-{{dialogid}}-sub-heading" ng-if="subheading">{{subheading}}</span>' +
                        '</h4>' +
                        '<div class="wm-dialog-header-action" ng-if="actiontitle || actionlink">' +
                            '<i title="{{actiontitle}}" class="wm-icon24 help"></i>' +
                            '<a ng-href="{{actionlink}}" target="_blank">Help</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="app-dialog-body modal-body {{contentclass}}" wmtransclude apply-styles="scrollable-container" name="wm-{{dialogid}}-content">' +
                    '</div>' +
                    '<div ng-transclude="footer"></div>' +
                '</div>' +
            '</div>'
            );
        $templateCache.put("template/widget/dialog/dialog-header.html",
            '<div data-identifier="dialog-header" class="app-dialog-header modal-header" init-widget title="{{hint}}">' +
                '<button ng-if="closable" aria-label="Close" class="app-dialog-close close" ng-click="hideDialog()" title="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
                '<h4 class="app-dialog-title modal-title">' +
                    '<i class="{{iconclass}}" ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}"></i> ' +
                    '<span name="wm-{{dialogid}}-title">{{caption}}</span>' +
                '</h4>' +
                '<div class="dialog-header-action" wmtransclude></div>' +
            '</div>'
            );
        $templateCache.put("template/widget/dialog/dialog-footer.html",
            '<div class="app-dialog-footer modal-footer" data-identifier="actions" init-widget wmtransclude></div>'
            );

    }]).directive('wmDialog', ['PropertiesFactory', 'WidgetUtilService', "$templateCache", '$compile', 'CONSTANTS', '$window', 'DialogService', 'Utils', function (PropertiesFactory, WidgetUtilService, $templateCache, $compile, CONSTANTS, $window, DialogService, Utils) {
        'use strict';
        var transcludedContent = "",
            id,
            widgetProps = PropertiesFactory.getPropertiesOf("wm.designdialog", ["wm.basicdialog", "wm.base"]),
            notifyFor = {
                'width': true,
                'height': true,
                'iconname': true,
                'iconwidth': true,
                'iconheight': true,
                'iconmargin': true,
                'iconclass': true,
                'closable': true,
                'title': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case "height":
                if (scope.content) {
                    //set the height for the Design Mode
                    if (newVal.indexOf('%') > 0) {
                        scope.content[key] = ($window.innerHeight * (window.parseInt(newVal) / 100) - 132);
                    } else {
                        scope.content[key] = window.parseInt(newVal - 122);
                    }
                }
                break;
            case "width":
                if (CONSTANTS.isStudioMode) {
                    scope.dialogWidth = newVal;
                }
                break;
            case "iconwidth":
            case "iconheight":
            case "iconmargin":
            case "iconclass":
            case "closable":
                scope.header[key] = newVal;
                break;
            case "title":
                element.removeAttr('title');
                scope.header.caption = newVal;
                break;
            }
        }

        return {
            "restrict": "E",
            "transclude": (CONSTANTS.isStudioMode ? {'footer': '?wmDialogactions'} : false),
            "controller": function ($scope) {
                this.dialogtype = $scope.dialogtype;
                this.register   = function (name, ele) {
                  this[name] =  ele.isolateScope();
                };
            },
            "scope": {
                "dialogtype": '@',
                "dialogid": '@'
            },
            "template": function (template, attrs) {
                transcludedContent = template.html();
                /*to have script tag with name as id in run mode and to have div in studio to be able to style the dialog*/
                if (CONSTANTS.isRunMode) {
                    /* replacing wm-dialog with wm-dialog-container in run mode to have a container for header, content and footer.
                     wm-dialog-container has a template similar to wm-dialog, replacing since wm-dialog returns script tag*/
                    var dialog = template[0].outerHTML.replace("<wm-dialog ", "<wm-dialog-container ");
                    dialog = dialog.replace("</wm-dialog>", "</wm-dialog-container>");
                    transcludedContent = dialog;
                    id = attrs.name;
                    return '<script type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/dialog.html");
            },
            "replace": true,
            "compile": function () {
                return {
                    "pre": function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        scope.hideDialog = function () {
                          DialogService.hideDialog(scope.dialogid);
                        };
                    },
                    "post": function (scope, element, attrs) {
                        var modalWindowElScope = element.closest('[uib-modal-window]').isolateScope();
                        if (CONSTANTS.isStudioMode) {
                            element.append($compile(transcludedContent)(scope));
                        }
                        scope         = scope || element.isolateScope();
                        scope.header  = element.find('[data-identifier=dialog-header]').isolateScope() || {};
                        scope.content = element.find('[data-identifier=dialog-content]').isolateScope() || {};
                        if (modalWindowElScope) {
                            element.closest('[uib-modal-window]').css({'z-index': 1050 + modalWindowElScope.index * 10, 'display': 'block'});
                        }

                        /* register the property change handler */
                        if (scope.propertyManager) {
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmDialogContainer', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", '$window', 'Utils', 'DialogService', 'DeviceService', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $window, Utils, DialogService, DeviceService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.designdialog", ["wm.basicdialog", "wm.base"]),
            notifyFor = {
                'width': true,
                'height': true,
                'iconwidth': true,
                'iconheight': true,
                'iconmargin': true,
                'iconclass': true,
                'closable': true,
                'title': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case "height":
                if (scope.content) {
                    //set the height for the Run Mode
                    if (newVal.indexOf('%') > 0) {
                        scope.content[key] = ($window.innerHeight * (window.parseInt(newVal) / 100) - 112);
                    } else {
                        scope.content[key] = window.parseInt(newVal - 112);
                    }
                }
                break;
            case "width":
                if (scope.width && CONSTANTS.isRunMode) {
                    //update the modal element in the UI for getting shadow and width set
                    element.closest('.modal-dialog').css('width', newVal);
                }
                break;
            case "iconwidth":
            case "iconheight":
            case "iconmargin":
            case "iconclass":
            case "closable":
                scope.header[key] = newVal;
                break;
            case "title":
                scope.header.caption = newVal;
                break;
            }
        }

        return {
            "restrict": "E",
            "transclude": {
                'footer': '?wmDialogactions'
            },
            "controller": function ($scope, $element) {
                this.dialogtype = $scope.dialogtype;
                this.register   = function (name, ele) {
                    this[name] =  ele.isolateScope();
                };
                /* handles all types of events for dialog*/
                var handleEvent = function (eventName, hideDialog, callBack, callbackParams) {
                    /* if the name is a function, execute the call back
                     * if name is a dialog hide/show option, call the dialog hide show method accordingly
                     * else invoke the service and finally close the current dialog*/
                    if (eventName && eventName.indexOf("(") !== -1) {
                        Utils.triggerFn(callBack, callbackParams);
                    } else if (callBack) {
                        // Studio Dialogs without individual templates do not have a "(" in the eventName. callBack() will return a reference to the actual callback.
                        if (CONSTANTS.isStudioMode) {
                            if (WM.isFunction(callBack())) {
                                Utils.triggerFn(callBack(), callbackParams);
                            }
                        } else {
                            if (WM.isFunction(callBack)) {
                                Utils.triggerFn(callBack, callbackParams);
                            }
                        }

                    } else if (_.startsWith(eventName, 'Widgets.') || _.startsWith(eventName, 'Variables.')) {
                        Utils.evalExp($scope, eventName);
                    }
                    if (hideDialog) {
                        DialogService.hideDialog($scope.dialogid);
                    }
                };
                this._OkButtonHandler = function (eventName) {
                    var eventParams;
                    /*If "okParams" is a JSON string, then parse it. Else, pass it as is.*/
                    if ($scope.okParams && $scope.okParams.indexOf("{") > -1) {
                        eventParams = Utils.getValidJSON($scope.okParams);
                    } else {
                        eventParams = $scope.okParams;
                    }
                    eventName = eventName || '';
                    /* handles all types of events*/
                    handleEvent(eventName, true, $scope.onOk, eventParams);
                };
                this._CancelButtonHandler = function (eventName) {
                    var eventParams;
                    /*If "cancelParams" is a JSON string, then parse it. Else, pass it as is.*/
                    if ($scope.cancelParams && $scope.cancelParams.indexOf("{") > -1) {
                        eventParams = Utils.getValidJSON($scope.cancelParams);
                    } else {
                        eventParams = $scope.cancelParams;
                    }
                    eventName = eventName || '';
                    /* handles all types of events*/
                    handleEvent(eventName, true, $scope.onCancel, eventParams);
                };
                this._CloseButtonHandler = function (eventName) {
                    eventName = eventName || '';
                    /* handles all types of events*/
                    handleEvent(eventName, true,  $scope.onClose);
                };
                this._OnOpenedHandler = function (eventName) {
                    eventName = eventName || '';
                    /* handles all types of events*/
                    handleEvent(eventName, false, $scope.onOpened);
                };
                this.onDialogOk = $scope.onOk;
                this.onDialogCancel = $scope.onCancel;
                this.onDialogClose = $scope.onClose;
                /*making the onclose function available to transclusion scope of wmDialogContainer so that the header can access it */
                $element.scope().onClose = $scope.onClose;
                $element.scope().onOpened = $scope.onOpened;
            },
            "scope": {
                "dialogid": '@',
                "onOk": '&',
                "onClose": '&',
                "onCancel": '&',
                "onOpened": '&'
            },
            "template": $templateCache.get("template/widget/dialog/dialog.html"),
            "replace": true,
            "compile": function () {
                return {
                    "pre": function (scope, element, attrs, ctrl) {
                        var backButtonListenerDeregister;
                        scope.__readyQueue = [];
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        scope.whenReady = function (fn) {
                            scope.__readyQueue.push(fn);
                        };
                        scope.hideDialog = function () {
                            ctrl._CloseButtonHandler(attrs.onClose);
                        };
                        scope.open  = Utils.openDialog.bind(undefined, scope.dialogid);
                        scope.close = DialogService.close.bind(undefined, scope.dialogid);
                        backButtonListenerDeregister = DeviceService.onBackButtonTap(function () {
                            scope.hideDialog();
                            return false;
                        });
                        scope.$on('$destroy', function () {
                            backButtonListenerDeregister();
                        });
                    },
                    "post": function (scope, element, attrs, ctrl) {
                        var modalWindowElScope = element.closest('[uib-modal-window]').isolateScope();
                        scope = scope || element.isolateScope();
                        scope.header = element.find('[data-identifier=dialog-header]').isolateScope() || {};
                        scope.content = element.find('[data-identifier=dialog-content]').isolateScope() || {};

                        if (attrs.onOpened && ctrl && !scope.widgetid) {
                            if (CONSTANTS.isRunMode && scope.whenReady) {
                                scope.whenReady(ctrl._OnOpenedHandler.bind(undefined, attrs.onOpened));
                            } else {
                                ctrl._OnOpenedHandler(attrs.onOpened);
                            }
                        }

                        if (modalWindowElScope) {
                            element.closest('[uib-modal-window]').css({'z-index': 1050 + modalWindowElScope.index * 10, 'display': 'block'});
                        }
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        while (scope.__readyQueue.length) {
                            Utils.triggerFn(scope.__readyQueue.shift());
                        }
                    }
                };
            }
        };
    }]).directive('wmDialogheader', ["PropertiesFactory", "WidgetUtilService", "$templateCache", "CONSTANTS", 'Utils', function (PropertiesFactory, WidgetUtilService, $templateCache, CONSTANTS, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.dialog.dialogheader", ["wm.base"]),
            notifyFor = {
                'iconclass': true,
                'caption': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            var defaultHeight = "21px";
            switch (key) {
            case "iconclass":
                if (scope.iconurl && newVal !== '' && newVal !== '_none_') {
                    scope.iconurl = '';
                    scope.iconwidth = scope.iconheight = defaultHeight;
                } else if (!scope.iconurl && newVal !== '' && newVal !== '_none_') {
                    scope.iconwidth = scope.iconheight = defaultHeight;
                } else {
                    scope.iconwidth = scope.iconheight = '';
                }
                break;
            }
        }

        return {
            "restrict": 'E',
            "replace": true,
            "transclude": true,
            "controller": 'DialogController',
            "scope": {},
            "template": $templateCache.get("template/widget/dialog/dialog-header.html"),
            "compile": function () {
                return {
                    "pre": function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    "post": function (scope, element, attrs, dialogCtrl) {
                        var parentEl,
                            onCloseEventName,
                            onOpenedEventName,
                            parentElScope;

                        parentEl = element.closest('.app-dialog');
                        parentElScope = parentEl.isolateScope();

                        /* accessing the onClose from parent scope*/
                        scope.onClose = parentElScope.onClose;
                        scope.onOpened = parentElScope.onOpened;
                        scope.dialogid = parentEl.attr('dialogid');

                        element.scope().dialogid = scope.dialogid;
                        /* getting on-close attr from parent*/
                        onCloseEventName = parentEl.attr("on-close");
                        onOpenedEventName = parentEl.attr("on-opened");

                        scope.hideDialog = function () {
                            if (dialogCtrl) {
                                /*handles close button click*/
                                dialogCtrl._CloseButtonHandler(onCloseEventName);
                            }
                        };

                        if (onOpenedEventName && dialogCtrl && !scope.widgetid) {
                            if (CONSTANTS.isRunMode && parentElScope.whenReady) {
                                parentElScope.whenReady(dialogCtrl._OnOpenedHandler.bind(undefined, onOpenedEventName));
                            } else {
                                dialogCtrl._OnOpenedHandler(onOpenedEventName);
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmDialogactions', ["PropertiesFactory", "WidgetUtilService", "$templateCache", "DialogService", 'Utils', function (PropertiesFactory, WidgetUtilService, $templateCache, DialogService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.dialog.dialogactions", ["wm.base"]);

        return {
            "restrict": 'E',
            "replace": true,
            "transclude": true,
            "scope": {},
            "template": $templateCache.get("template/widget/dialog/dialog-footer.html"),
            "compile": function () {
                return {
                    "pre": function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    "post": function (iScope, element, attrs) {
                        var parentEl,
                            scope;

                        parentEl       = element.closest('.app-dialog');
                        scope          = element.scope();
                        scope.dialogid = parentEl.attr('dialogid');
                        scope.closeDialog = function () {
                            DialogService.hideDialog(scope.dialogid);
                        };
                        WidgetUtilService.postWidgetCreate(iScope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialog
 * @restrict E
 *
 * @description
 * The `wmDialog` directive defines design dialog widget. <br>
 * wmDialog should contain `wmDialogheader`, `wmDialogcontent`, `wmDialogactions` inside it <br>
 * A dialog is created in an independent view.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires DialogService
 * @requires $rootScope
 * @requires $templateCache
 * @requires $compile
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the dialog.
 * @param {string=} title
 *                  title of the dialog.
 * @param {string=} height
 *                  Height of the dialog.
 * @param {string=} width
 *                  Width of the dialog.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value:`true`.
 * @param {boolean=} modal
 *                  True value for Modal property shows up a modal dialog. <br>
 *                  Default value:`true`.
 * @param {boolean=} closable
 *                  closable enables close icon on header also enables close of dialog with ESC key
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header
 * @param {string=} on-close
 *                  Callback function which will be triggered when the dialog is collapsed.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-dialog name="sampleDialog" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
                        <wm-form>
                            <wm-composite widget="text">
                                <wm-label caption="Name"></wm-label>
                                <wm-text></wm-text>
                            </wm-composite>
                        </wm-form>
                        <wm-dialogactions show="true">
                            <wm-button on-click="hideDialog()" caption="Hide Dialog" class="btn-danger"></wm-button>
                        </wm-dialogactions>
                    </wm-dialog>
                </wm-view>
                <wm-button on-click="showDialog()" caption="Show Dialog" class="btn-success"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.onCloseCallBack = function () {
                    console.log("inside close callback");
                }
                $scope.hideDialog = function () {
                    DialogService.close('sampleDialog');
                }
                 $scope.showDialog = function () {
                    DialogService.open("sampleDialog");
                }
            }
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogheader
 * @restrict E
 *
 * @description
 * The `wmDialogheader` directive defines dialog header. <br>
 * wmDialogheader can be used only inside wmDialog. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the dialogheader.
 * @param {string=} hint
 *                  Any text or html you enter for this property will be shown as a tooltip if the mouse hovers over this widget.
 * @param {string=} width
 *                  Width of the dialog.
 * @param {string=} height
 *                  Height of the dialog.
 * @param {list=} animation
 *                  This property controls the animation of the anchor. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are "bounce", "flash", "pulse", "rubberBand", "shake", etc.
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header
 * @param {boolean=} closable
 *                  closable enables close icon on header also enables close of dialog with ESC key
 * @param {string=} iconwidth
 *                  Optional, This sets the width of the icon in dialog header.
 * @param {string=} iconheight
 *                  Optional, This sets the height of the icon in dialog header.
 * @param {string=} iconmargin
 *                  Optional, This sets the margin of the icon in dialog header.
 * @param {string=} on-close
 *                  Callback function which will be triggered when the dialog is closed.
 * @param {string=} on-opened
 *                  Callback function which will be triggered after the dialog is opened.
 *
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-dialog name="sampleDialog" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
                        <wm-form>
                            <wm-composite widget="text">
                                <wm-label caption="Name"></wm-label>
                                <wm-text></wm-text>
                            </wm-composite>
                        </wm-form>
                        <wm-dialogactions show="true">
                            <wm-button on-click="hideDialog()" caption="Hide Dialog" class="btn-danger"></wm-button>
                        </wm-dialogactions>
                    </wm-dialog>
                </wm-view>
                <wm-button on-click="sampleDialog.show" caption="Show Dialog" class="btn-success"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.onCloseCallBack = function () {
                    console.log("inside close callback");
                }
                $scope.hideDialog = function () {
                    DialogService.close('sampleDialog');
                }
            }
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogcontent
 * @restrict E
 *
 * @description
 * The `wmDialogcontent` directive defines accordion-header widget. <br>
 * wmDialogcontent can be used only inside wmDialog. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the dialogcontent.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value: `true`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-dialog name="sampleDialog" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
                        <wm-form>
                            <wm-composite widget="text">
                                <wm-label caption="Name"></wm-label>
                                <wm-text></wm-text>
                            </wm-composite>
                        </wm-form>
                        <wm-dialogactions show="true">
                            <wm-button on-click="hideDialog()" caption="Hide Dialog" class="btn-danger"></wm-button>
                        </wm-dialogactions>
                    </wm-dialog>
                </wm-view>
                <wm-button on-click="sampleDialog.show" caption="Show Dialog" class="btn-success"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.onCloseCallBack = function () {
                    console.log("inside close callback");
                }
                $scope.hideDialog = function () {
                    DialogService.close('sampleDialog');
                }
            }
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogactions
 * @restrict E
 *
 * @description
 * The `wmDialogactions` directive defines dialogactions widget. <br>
 * wmDialogactions can be used only inside wmDialog.<br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the dialogaction.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value: `true`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-dialog name="sampleDialog" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
                        <wm-form>
                            <wm-composite widget="text">
                                <wm-label caption="Name"></wm-label>
                                <wm-text></wm-text>
                            </wm-composite>
                        </wm-form>
                        <wm-dialogactions show="true">
                            <wm-button on-click="hideDialog()" caption="Hide Dialog" class="btn-danger"></wm-button>
                        </wm-dialogactions>
                    </wm-dialog>
                </wm-view>
                <wm-button on-click="sampleDialog.show" caption="Show Dialog" class="btn-success"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.onCloseCallBack = function () {
                    console.log("inside close callback");
                }
                $scope.hideDialog = function () {
                    DialogService.close('sampleDialog');
                }
            }
        </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogContainer
 * @restrict E
 *
 * @description
 * The `wmDialogContainer` directive defines design dialog widget in run mode. <br>
 * It is identical to wmDialog. It is used internally to simluate wmDialog in run mode.
 */
/*global wm, _, WM*/
/*jslint sub: true */
/*Directive for pageTransition */

/**
 * @ngdoc service
 * @name wm.common.$NavigationService
 * @requires $rootScope
 * @requires ViewService
 * @requires DialogService
 * @description
 * This is the factory responsible for page navigation. It manages page navigation and also handles the page transitions.
 * Page transitions include Slide, Pop, Fade, Flip. Default value is none.
 */

wm.modules.wmCommon.services.NavigationService = [
    '$rootScope',
    '$window',
    'ViewService',
    'DialogService',
    '$timeout',

    function ($rs, $window, ViewService, DialogService, $timeout) {
        'use strict';

        var nextTransitionToApply,
            parentSelector = 'body:first >#wm-app-content:last',
            pageStackObject;

        pageStackObject = (function () {
            var stack = [], currentPage;
            return {
                'getCurrentPage' : function () {
                    return currentPage;
                },
                'addPage' : function (pageInfo) {
                    if (currentPage) {
                        stack.push(currentPage);
                    }
                    currentPage = pageInfo;
                },
                'goBack' : function () {
                    currentPage = stack.pop();
                },
                'getLastPage' : function () {
                    return stack.length > 0 ? stack[stack.length - 1] : undefined;
                },
                'isLastVisitedPage' : function (pageName) {
                    return stack.length > 0 ? this.getLastPage().name === pageName : false;
                }
            };
        }());

        //checks if the pagecontainer has the pageName.
        function isPartialWithNameExists(name) {
            return WM.element('[page-container][content="' + name + '"]').length;
        }

        /*
         * shows all the parent container view elements for a given view element
         */
        function showAncestors(element) {
            var ancestorSearchQuery = '[wm-navigable-element="true"]';

            element
                .parents(ancestorSearchQuery)
                .toArray()
                .reverse()
                .forEach(function (parent) {
                    //get the isolateScope of the widget
                    var $is = WM.element(parent).isolateScope();
                    switch ($is._widgettype) {
                    case 'wm-view':
                        ViewService.showView($is.name);
                        break;
                    case 'wm-accordionpane':
                        $is.expand();
                        break;
                    case 'wm-tabpane':
                        $is.select();
                        break;
                    case 'wm-segment-content':
                        $is.navigate();
                        break;
                    case 'wm-panel':
                        /* flip the active flag */
                        $is.expanded = true;
                        break;
                    }
                });
        }

        /*
         * searches for a given view element inside the available dialogs in current page
         * if found, the dialog is displayed, the dialog id is returned.
         */
        function showAncestorDialog(viewName) {
            var dialogId;
            WM.element('#wm-app-content [dialogtype]')
                .each(function () {
                    var dialog = WM.element(this);
                    if (WM.element(dialog.html()).find("[name='" + viewName + "']").length) {
                        dialogId = dialog.attr("name");
                        DialogService.closeAllDialogs();
                        DialogService.showDialog(dialogId);
                        return false;
                    }
                });
            return dialogId;
        }


        /*
         * navigates the user to a view element with given name
         * if the element not found in the compiled markup, the same is searched in the available dialogs in the page
         */
        function goToView(viewElement, viewName) {
            var $is = viewElement.isolateScope(),
                parentDialog;

            if (viewElement.length) {
                switch ($is._widgettype) {
                case 'wm-view':
                    showAncestors(viewElement);
                    ViewService.showView(viewName);
                    break;
                case 'wm-accordionpane':
                    showAncestors(viewElement);
                    $is.expand();
                    break;
                case 'wm-tabpane':
                    showAncestors(viewElement);
                    $is.select();
                    break;
                case 'wm-segment-content':
                    showAncestors(viewElement);
                    $is.navigate();
                    break;
                case 'wm-panel':
                    /* flip the active flag */
                    $is.expanded = true;
                    break;
                }
            } else {
                parentDialog = showAncestorDialog(viewName);
                $timeout(function () {
                    if (parentDialog) {
                        goToView(WM.element('[name="' + viewName + '"]'), viewName, false);
                    }
                });
            }
        }

        /*
         * returns the path prefix for the app
         */
        function getPathPrefix(pageName) {
            if ($rs.isSecurityEnabled && pageName === 'Login') {
                return 'login.html';
            }
            if ($window.location.pathname.split('/').pop() === 'index.html') {
                return 'index.html';
            }
            return './';
        }

        //listens for the event only once and destroys the listener.
        function listenOnce(eventName, callBack) {
            var removeListener = $rs.$on(eventName, function () {
                removeListener();
                callBack.call(undefined, arguments);
            });
        }

        $rs.$on('$routeChangeStart', function (evt, $next) {
            var pageName = $next.params.name;
            if (pageName) {
                if (pageStackObject.isLastVisitedPage(pageName)) {
                    nextTransitionToApply = pageStackObject.getCurrentPage().transition + '-exit';
                    pageStackObject.goBack();
                } else {
                    pageStackObject.addPage({
                        'name' : pageName,
                        'transition' : nextTransitionToApply
                    });
                }
                WM.element('#wm-app-content:first').addClass('page-transition-' + nextTransitionToApply);
                nextTransitionToApply = '';
            }
        });

        /**
         * @ngdoc function
         * @name wm.common.$NavigationService#goToPage
         * @methodOf wm.common.$NavigationService
         * @function
         *
         * @description
         * Navigates to the page.
         *
         * @param {string} pageName Name of the page.
         * @param {string} transition Page-transition applied to the page.
         * @param {string} viewName Name of the view within the page.
         */
        this.goToPage = function (pageName, transition, viewName) {
            nextTransitionToApply = transition || '';

            var _location = getPathPrefix(pageName) + '#/' + pageName;
            if (viewName) {
                _location +=  '.' + viewName;
            }

            $window.location = _location;
        };

        /**
         * @ngdoc function
         * @name wm.common.$NavigationService#goToView
         * @methodOf wm.common.$NavigationService
         * @function
         *
         * @description
         * Navigates to the view.
         *
         * @param {string} pageName Name of the page.
         * @param {string} viewName Name of the view within the page.
         * @param {string} transition Page-transition applied to the page.
         */
        this.goToView = function (pageName, viewName, transition) {

            if (!pageName || pageName === $rs.activePageName || isPartialWithNameExists(pageName)) {
                goToView(WM.element(parentSelector).find('[name="' + viewName + '"]'), viewName);
            } else {
                this.goToPage(pageName, transition, viewName);
                listenOnce('page-ready', function () {
                    goToView(WM.element(parentSelector).find('[name="' + viewName + '"]'), viewName);
                });
            }
        };

        /**
         * @ngdoc function
         * @name wm.common.$NavigationService#goToPrevious
         * @methodOf wm.common.$NavigationService
         * @function
         *
         * @description
         * Navigates to last visited page.
         */
        this.goToPrevious = function () {
            var lastPage = pageStackObject.getLastPage();
            if (lastPage) {
                this.goToPage(lastPage.name);
                return true;
            }
            return false;
        };
    }
];
/*global WM, navigator */
/*Directive for camera */

WM.module('wm.widgets.advanced')
    .run([
        '$templateCache',

        function ($tc) {
            'use strict';

            $tc.put('template/widget/advanced/camera.html',
                    '<button class="btn app-camera" data-ng-model="_model_" data-ng-show="show" init-widget has-model apply-styles title="{{hint}}" data-ng-click="openCamera()" >' +
                        '<i class="{{iconclass}}" data-ng-style="{\'font-size\':iconsize}"></i> ' +
                        '<span class="btn-caption">{{caption}}</span>' +
                    '</button>'
                );
        }
    ])
    .directive('wmCamera', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$rootScope',
        '$cordovaCamera',
        '$cordovaCapture',
        function ($tc, PropertiesFactory, WidgetUtilService, CONSTANTS, $rs, $cordovaCamera, $cordovaCapture) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.camera', ['wm.base', 'wm.base.editors']),
                cameraOptions,
                notifyFor = {
                    'capturetype': true
                },
                CAPTURE_TYPE = {
                    'IMAGE': 'IMAGE',
                    'VIDEO': 'VIDEO'
                },
                ENCODING_TYPE = {
                    'JPEG': 'JPEG',
                    'PNG' : 'PNG'
                };

            function propertyChangeHandler($is, key, newVal) {
                var showprops = false,
                    wp = $is.widgetProps;
                switch (key) {
                case 'capturetype':
                    if (newVal === CAPTURE_TYPE.IMAGE) {
                        showprops = true;
                        cameraOptions = {
                            'quality'         : $is.imagequality,
                            'destinationType' : 1, // 0-data url,1- file url
                            'sourceType'      : 1, // only camera
                            'allowEdit'       : $is.allowedit,
                            'encodingType'    : $is.imageencodingtype === ENCODING_TYPE.JPEG ? 0 : 1,
                            'saveToPhotoAlbum': $is.savetogallery,
                            'targetWidth'     : $is.imagetargetwidth,
                            'targetHeight'    : $is.imagetargetheight
                        };
                    } else {
                        cameraOptions = {
                            'limit': 1
                        };
                    }
                    if (CONSTANTS.isStudioMode) {
                        wp.imagequality.show = showprops;
                        wp.imageencodingtype.show = showprops;
                        wp.savetogallery.show = showprops;
                        wp.allowedit.show = showprops;
                    }
                    break;
                }
            }

            function updateModel($is, value) {
                $is.datavalue = $is._model_ = value;
                $is.onSuccess({ $scope: $is});
                $rs.$safeApply($is);
            }

            function captureVideoSuccess($is, mediaFiles) {
                updateModel($is, mediaFiles[0].fullPath);
            }

            function openCamera($is) {
                if (CONSTANTS.hasCordova) {
                    if ($is.capturetype === CAPTURE_TYPE.IMAGE) {
                        // start camera
                        $cordovaCamera.getPicture(cameraOptions).then(updateModel.bind(undefined, $is));
                    } else {
                        // start video capture
                        $cordovaCapture.captureVideo(cameraOptions).then(captureVideoSuccess.bind(undefined, $is));
                    }
                } else {
                    $is.onSuccess({$scope: $is});
                }
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    'onSuccess' : '&'
                },
                'template': $tc.get('template/widget/advanced/camera.html'),
                'compile': function () {
                    return {
                        'pre': function ($is) {
                            $is.widgetProps = widgetProps;
                        },
                        'post': function ($is, $el, attrs) {
                            $is.openCamera = openCamera.bind(undefined, $is);
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is), $is, notifyFor);
                            WidgetUtilService.postWidgetCreate($is, $el, attrs);
                        }
                    };
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCamera
 * @restrict E
 *
 * @description
 * The `wmCamera` directive defines the camera widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $sce
 *
 * @param {string=} hint
 *                  Title/hint for the camera. <br>
 *                  This property is bindable.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the camera widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} iconclass
 *                  CSS class of the icon.
 * @param {string=} iconsize
 *                  size of the icon.
 *                  Default value: 3em
 * @param {string=} capturetype
 *                  This specifies whether the image or video that is to be captured.
 *                  Default value : "IMAGE"
 * @param {string=} sourcetype
 *                  Set the source of the picture. The default is CAMERA
 * @param {string=} imagequality
 *                  Set the image quality of the picture. The default is 80.
 * @param {string=} imageencodingtype
 *                  Encoding the image to JPEG or PNG. The default is JPEG.
 * @param {string=} savetogallery
 *                  The captured image will be saved to gallery if true. The default is false.
 * @param {string=} allowedit
 *                  The captured image will be allowed to edit. The default is false.
 * @param {string=} on-click
 *                  Clicking on the camera button will open the camera for capturing video or image.
 * @param {string=} on-success
 *                  Callback function which will be triggered when the widget saves the captured media successfully.
 */


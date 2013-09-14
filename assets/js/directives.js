angular.module('directives', [])

    .directive('fileUploader', function (fileUpload) {
        return {
            transclude: true,
            scope: {
                'callback': '&'
            },
            template: '<div class="btn btn-primary" style="position: relative; overflow: hidden;"><span ng-transclude></span><input type="file" style="position: absolute; top: 0; right: 0; min-width: 100%; min-height: 100%; font-size: 999px; text-align: right; filter: alpha(opacity=0); opacity: 0; background: red; cursor: inherit; display: block;"></div>',
            link: function ($scope, $element, $attrs) {
                var fileInput = $element.find('input[type="file"]');
                fileInput.bind('change', function (e) {
                    var file = e.target.files[0];

                    // Use callback if specified, else use fileUpload service
                    if ($scope.callback) {
                        $scope.callback({file: file});
                    } else {
                        fileUpload.upload(file);
                    }
                });
            }
        }
    })
    .directive('switch', function () {
        return {
            template: '<div class="make-switch" ng-class="size"><input ng-model="ngModel" type="checkbox"></div>',
            replace: true,
            require: 'ngModel',
            scope: {
                ngModel: '=',
                size: '@'
            },
            link: function (scope, element, attrs) {
                scope.$watch('ngModel', function (newValue) {
                    element.bootstrapSwitch('setState', newValue);
                });

                scope.$watch('size', function (newValue) {
                    element.bootstrapSwitch('setSizeClass', newValue);
                });

                element.on('switch-change', function (event, data) {
                    var value = data.value;
                    scope.ngModel = value;
                    scope.$apply();
                });

            }
        }
    })
    .directive('editable',function () {
        return {
            scope: {
                value: '=',
                callback: '&',
                objId: '='
            },
            template: '<div><span ng-hide="editing" ng-click="edit()" ng-bind="value"></span><input ng-show="editing" ng-model="newValue"></div>',
            link: function ($scope, element, attrs) {
                $scope.editing = false;
                $scope.newValue = $scope.value;

                var inputElement = element.find('input');

                // ng-click handler to activate edit-in-place
                $scope.edit = function () {
                    $scope.editing = true;

                    inputElement[0].focus();
                    inputElement[0].select();
                };

                function cancel() {
                    $scope.editing = false;
                    $scope.newValue = $scope.value;
                    $scope.$apply();
                }

                function save() {
                    $scope.editing = false;
                    $scope.callback({id: $scope.objId, value: $scope.newValue});
                    $scope.$apply();
                }

                // When we leave the input, we're done editing.
                inputElement.blur(save);

                inputElement.keyup(function (e) {
                    if (e.keyCode == 27) {
                        // ESC
                        cancel();
                    } else if (e.keyCode == 13) {
                        // Enter
                        save();
                    }
                })
            }
        };
    }).directive('markdown', function () {
        return {
            restrict: 'E',
            scope: {
                note: '='
            },
            template: '<div class="md" ng-show="note != null"><div class="md-controls"><button class="btn btn-default" ng-click="edit()"><i class="icon-pencil icon-2x"></i></button></div><div ng-hide="editing" ng-dblclick="edit()" ng-bind-html-unsafe="html" class="md-preview"></div><textarea ng-show="editing" ng-model="text" class="md-editor"></textarea></div>',
            replace: true,
            link: function ($scope, element, attr) {
                var converter = new Showdown.converter();

                $scope.editing = false;

                $scope.text = '';
                $scope.html = '';

                var editor = element.find('.md-editor');
                var previewer = element.find('.md-preview');

                editor.on('blur keyup', function (e) {
                    if ($scope.note != null) {
                        if (e.type == 'blur' || (e.type == 'keyup' && e.keyCode == 27)) {
                            e.preventDefault();

                            var content = $(this).val();
                            $scope.editing = false;
                            $scope.text = content;
                            $scope.note.update({content: content});

                            $scope.$apply();
                        }
                    }
                });

                $scope.edit = function () {
                    $scope.editing = !$scope.editing;

                    // Hack for focusing after textarea is shown
                    setTimeout(function () {
                      editor.focus();
                    }, 100)
                };

                $scope.$watch('note', function (note) {
                    if (note != null) {
                        $scope.text = note.get('content');
                    }
                });

                $scope.$watch('text', function (value) {
                    if (value != null || value != '') {
                        $scope.html = converter.makeHtml(value == undefined ? '' : value);
                    }
                })
            }
        }
    });
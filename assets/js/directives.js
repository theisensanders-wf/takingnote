angular.module('directives', [])

    .directive('fileUploader', function (fileUpload) {
        return {
            transclude: true,
            template: '<div class="fileUpload" ng-click="propagate">' +
                '<span ng-transclude></span>' +
                '<input type="file">' +
                '</div>',
            replace: true,
            link: function ($scope, $element, $attrs) {
                var fileInput = $element.find('input[type="file"]');

                $scope.propagate = function () {
                    fileInput.click();
                };

                fileInput.bind('change', function (e) {
                    var file = e.target.files[0];
                    fileUpload.upload(file);
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
            template: '<div class="md" ng-show="note != null">' +
                '<div class="md-title"><input ng-model="title" ng-show="editingTitle"><h2 ng-hide="editingTitle" ng-click="editTitle()" ng-bind="note.get(\'name\')"></h2></div>' +
                '<div class="md-controls">' +
                '<button class="btn btn-default" ng-click="edit()"><i class="icon-pencil icon-2x"></i></button>' +
                '<button class="btn btn-default" ng-click="goFullscreen()"><i class="icon-fullscreen icon-2x"></i></button>' +
                '</div>' +
                '<div ng-hide="editing" ng-dblclick="edit()" ng-bind-html-unsafe="html" class="md-preview"></div>' +
                '<textarea ng-show="editing" ng-model="text" class="md-editor"></textarea>' +
                '</div>',
            replace: true,
            link: function ($scope, element, attr) {
                var converter = new Showdown.converter();

                $scope.editing = false;
                $scope.editingTitle = false;
                $scope.fullscreen = false;

                $scope.title = '';
                $scope.text = '';
                $scope.html = '';

                var editor = element.find('.md-editor');
                var previewer = element.find('.md-preview');
                var titler = element.find('.md-title > input');

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

                titler.on('blur keyup', function (e) {
                    e.stopPropagation();
                    var input = $(this);

                    function accept() {
                        if ($scope.title.length < 1) {
                            reject();
                            return;
                        }
                        $scope.editingTitle = false;
                        $scope.note.update({name: $scope.title});
                        $scope.$apply();
                    }

                    function reject() {
                        $scope.editingTitle = false;
                        $scope.title = $scope.note.get('name');
                        $scope.$apply();
                    }

                    if ($scope.note != null) {
                        if (e.type == 'blur') {
                            accept();
                        } else if (e.type == 'keyup') {
                            if (e.keyCode == 13) {
                                accept();
                            } else if (e.keyCode == 27) {
                                reject();
                            }
                        }
                    }
                });

                $scope.goFullscreen = function () {
                    alert('Not Implemented Yet');
//                    if (fullscreen.requestFullScreen) {
//                        fullscreen.requestFullScreen();
//                    } else if (fullscreen.mozRequestFullScreen) {
//                        fullscreen.mozRequestFullScreen();
//                    } else if (fullscreen.webkitRequestFullScreen) {
//                        fullscreen.webkitRequestFullScreen();
//                    }
                };

                $scope.edit = function () {
                    $scope.editing = true;

                    // Hack for focusing after textarea is shown
                    setTimeout(function () {
                        editor.focus();
                    }, 100)
                };

                $scope.editTitle = function () {
                    $scope.editingTitle = true;

                    // Hack for focusing after input is shown
                    setTimeout(function () {
                        titler.focus();
                        titler.select();
                    }, 100)
                };

                $scope.$watch('note', function (note) {
                    if (note != null) {
                        $scope.text = note.get('content');
                        $scope.title = note.get('name');
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
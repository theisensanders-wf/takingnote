angular.module('directives', [])
    .directive('fileUploader', function ($fileUpload) {
        return {
            template: '<div><input type="file" accept=".png"></div>',
            link: function ($scope, $element, $attrs) {
                var fileInput = $element.find('input[type="file"]');
                fileInput.bind('change', function (e) {
                    $fileUpload.upload(e.target.files[0]);
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
    });
//    .directive("editable", function () {
//        var editorTemplate = '<div>' +
//                '<div ng-hide="editing">' +
//                    '<a ng-click="edit()"></a>' +
//                '</div>' +
//                '<div ng-show="editing">' +
//                    '<input ng-model="inputVal">' +
//                    '<a href="#" ng-click="save()">Save</a>' +
//                '</div>' +
//            '</div>';
//
//        return {
//            restrict: "A",
//            replace: true,
//            template: editorTemplate,
//            scope: {
//                value: "=editable"
//            },
//            controller: function ($scope) {
////                var obj = $scope.value['obj'];
////                var callback = $scope.value['callback'];
////                var attr = $scope.value['attr'];
//
////                $scope.inputVal = $scope.value;
////                $scope.editing = false;
////
////
////                console.log($scope.attr);
////
////                $scope.edit = function() {
////                    $scope.editing = true;
////                };
////
////                $scope.save = function() {
////                    $scope.editing = false;
//////                    $scope.callback({newName: $scope.inputVal});
//////                    $scope.
////                }
//            },
//            link: function($scope) {
////                alert($scope.editing);
//            }
//        };
//    });

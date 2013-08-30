angular.module('directives', [])
    .directive('fileUploader', function ($fileUpload) {
        return {
            restrict: 'E', // Attribute
            template: '<input type="file">',
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
                scope.$watch('ngModel', function(newValue) {
                    element.bootstrapSwitch('setState', newValue);
                });

                scope.$watch('size', function(newValue) {
                    element.bootstrapSwitch('setSizeClass', newValue);
                });

                element.on('switch-change', function(event, data) {
                    var value = data.value;
                    scope.ngModel = value;
                    scope.$apply();
                });

            }
        }
    }

);

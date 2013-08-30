angular.module('directives', [])
    .directive('fileUploader', function ($fileUpload) {
        return {
            restrict: 'E', // Attribute
            template: '<input type="file">',
            link: function ($scope, $element) {
                var fileInput = $element.find('input[type="file"]');
                fileInput.bind('change', function (e) {
                    $fileUpload.upload(e.target.files[0]);
                });
            }
        }
    });

angular.module('services', [])
    .service('$fileUpload', ['$rootScope', function ($rootScope) {
        this.upload = function (file) {
            var image = false;

            if (file !== undefined) {
                var path = file.name;

                if (['image/jpeg', 'image/png'].indexOf(file.type) > 0) {
                    image = true;
                    path = '/img/' + file.name;
                } else if (file.type == 'text/css') {
                    path = '/css/' + file.name;
                } else {
                    // Invalid file type
                    console.log('Failed to upload file of type: ' + file.type);
                    alert('Invalid filetype');
                    return;
                }

                var result = $rootScope.client.writeFile(path, file, function (error, stat) {
                    // Get url
                    $rootScope.client.makeUrl(path, {download: true}, function (error, shareUrl) {

                        if (image) {
                            $rootScope.$broadcast('New Image', String(shareUrl.url));
                        }
                    });
                });
            } else {
                alert('Invalid file');
            }
        }
    }]);

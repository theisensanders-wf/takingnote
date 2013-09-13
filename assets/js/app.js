var app = angular.module('noteit', ['directives', 'filters', 'services', 'dropstore-ng'])

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});

app.run(function ($rootScope, dropstoreClient) {
    var _client = dropstoreClient.create({key: APP_KEY});
    $rootScope.client = _client._client;

    _client.authenticate({interactive: true})
        .then(function (datastoreManager) {
            return datastoreManager.openDefaultDatastore();
        })
        .then(function (datastore) {
            $rootScope.datastore = datastore;
            $rootScope.$broadcast('authenticated')
        });

});

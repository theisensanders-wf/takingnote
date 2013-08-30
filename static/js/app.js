angular.module('note', ['directives', 'filters', 'services', 'dropstore-ng'])
    .run(function ($rootScope, dropstoreClient) {
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

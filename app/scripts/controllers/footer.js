'use strict';

app.controller('FooterCtrl',
  function ($scope, $rootScope) {

    $rootScope.changed = false;

    $rootScope.$on('$routeChangeSuccess', function() {
      $rootScope.changed = true;
    });

    $rootScope.$on('$routeChangeStart', function() {
      //$rootScope.changed = false;
    });

  }
);
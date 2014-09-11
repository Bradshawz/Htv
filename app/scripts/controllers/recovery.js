'use strict';

app.controller('RecoverCtrl',
  function ($scope, Auth) {
    $scope.emailReset = function() {
      Auth.emailReset($scope.email).then(function () {
        $scope.success = 'Email successfully sent.';
      }, function () {
        $scope.error = 'Information you entered was invalid.';
      });
    };
  }
);

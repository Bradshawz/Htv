'use strict';

app.controller('AuthCtrl',
  function ($scope, $location, Auth, User) {
    if (Auth.signedIn()) {
      $location.path('/');
    }

    $scope.$on('$firebaseSimpleLogin:login', function() {
      $location.path('/');
    });

    $scope.login = function () {
      Auth.login($scope.user).then(function() {
        $location.path('/');
      }, function () {
        $scope.error = 'The email and password combination is invalid.';
      });
    };

    $scope.register = function() {
      Auth.register($scope.user).then(function (authUser) {
        Auth.login($scope.user);
        User.create(authUser, $scope.user.username);
        $location.path('/');
      }, function (error) {
        switch(error.code) {
          case 'EMAIL_TAKEN':
            $scope.error = 'A user with this email already exists.';
        }
      });
    };
  }
);

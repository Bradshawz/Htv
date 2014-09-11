'use strict';

app.controller('SettingsCtrl',
  function ($scope, Auth, $rootScope, User) {

    $scope.hideChat = $rootScope.currentUser.hiddenChat;

    $scope.toggleChat = function() {
      User.toggleChat($scope.hideChat);
    };

    $scope.changePassword = function() {
      Auth.newPassword($scope.email, $scope.oldPassword, $scope.newPassword).then(function () {
        $scope.success = 'Password successfully changed.';
      }, function () {
        $scope.error = 'Information you entered was invalid.';
      });
    };
  }
);

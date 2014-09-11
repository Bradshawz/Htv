'use strict';

app.controller('ProfileCtrl',
  function ($scope, $routeParams, $firebase, FIREBASE_URL, manyChannels) {
    $scope.username = $routeParams.username;
    $scope.channels = manyChannels[0];
    $scope.shownChannels = manyChannels[1];
    $scope.shownFavourites = manyChannels[3];
    $scope.favourites = manyChannels[2];
    $scope.favouritePage = 0;
    $scope.channelPage = 0;
    $scope.noChanLeft = true;
    $scope.noFavLeft = true;
    if ($scope.channels.length < 5) {
      $scope.noChanRight = true;
    }
    if ($scope.favourites.length < 5) {
      $scope.noFavRight = true;
    }

    $scope.goLeftChannels = function() {
      $scope.channelPage--;
      $scope.shownChannels = $scope.channels.slice($scope.channelPage*4,$scope.channelPage*4+4);
      if ($scope.channelPage === 0) {
        $scope.noChanLeft = true;
      }
      $scope.noChanRight = false;
    };

    $scope.goRightChannels = function() {
      $scope.channelPage++;
      $scope.shownChannels = $scope.channels.slice($scope.channelPage*4,$scope.channelPage*4+4);
      if ($scope.channelPage*4+4 >= $scope.channels.length) {
        $scope.noChanRight = true;
      }
      $scope.noChanLeft = false;
    };

    $scope.goLeftFavourites = function() {
      $scope.favouritePage--;
      $scope.shownFavourites = $scope.favourites.slice($scope.favouritePage*4,$scope.favouritePage*4+4);
      if ($scope.favouritePage === 0) {
        $scope.noFavLeft = true;
      }
      $scope.noFavRight = false;
    };

    $scope.goRightFavourites = function() {
      $scope.favouritePage++;
      $scope.shownFavourites = $scope.favourites.slice($scope.favouritePage*4,$scope.favouritePage*4+4);
      if ($scope.favouritePage*4+4 >= $scope.favourites.length) {
        $scope.noFavRight = true;
      }
      $scope.noFavLeft = false;
    };
  }
);

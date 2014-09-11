'use strict';

app.controller('FavouritesCtrl', function ($scope, favChannels) {
	$scope.channels = favChannels;
	$scope.maxSize = 5;
	$scope.numItemsPage = 16;
	$scope.showChannels = $scope.channels.slice(0, $scope.numItemsPage);
	$scope.totalItems = $scope.channels.length;
	$scope.pageChanged = function() {
		$scope.showChannels = $scope.channels.slice(($scope.numItemsPage) * ($scope.currentPage - 1), $scope.numItemsPage * $scope.currentPage);
	};
});

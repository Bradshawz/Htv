'use strict';

app.controller('ChannelsCtrl', function ($scope, channels, $routeParams) {
	$scope.category = $routeParams.category;
	$scope.channels = channels.reverse();
	$scope.maxSize = 5;
	$scope.numItemsPage = 12;
	$scope.showChannels = $scope.channels.slice(0, $scope.numItemsPage);
	$scope.totalItems = $scope.channels.length;
	$scope.pageChanged = function() {
		$scope.showChannels = $scope.channels.slice(($scope.numItemsPage) * ($scope.currentPage - 1), $scope.numItemsPage * $scope.currentPage);
	};
});
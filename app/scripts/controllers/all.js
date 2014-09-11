'use strict';

app.controller('AllCtrl', function($scope, allChannels) {
	$scope.allChannels = allChannels.reverse();
	$scope.maxSize = 5;
	$scope.numItemsPage = 16;
	$scope.showChannels = $scope.allChannels.slice(0, $scope.numItemsPage);
	$scope.totalItems = $scope.allChannels.length;
	$scope.pageChanged = function() {
		$scope.showChannels = $scope.allChannels.slice(($scope.numItemsPage) * ($scope.currentPage - 1), $scope.numItemsPage * $scope.currentPage);
	};
});
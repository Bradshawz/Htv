'use strict';

app.controller('WatchCtrl', function ($scope, categories, FIREBASE_URL, $firebase) {
	$scope.hideAll = false;
	$scope.numItemsPage = 16;
	$scope.peopleRef = $firebase(new Firebase(FIREBASE_URL + 'people'));
	$scope.peopleRef.$on('loaded', function() {
		$scope.people = $scope.peopleRef.$value;
	});
	$scope.categories = categories.reverse();
	$scope.categories.unshift({});
	$scope.showCategories = $scope.categories.slice(1, $scope.numItemsPage);
	$scope.maxSize = 5;
	$scope.totalItems = $scope.categories.length;
	$scope.pageChanged = function() {
		$scope.showCategories = $scope.categories.slice(($scope.numItemsPage) * ($scope.currentPage - 1), $scope.numItemsPage * $scope.currentPage);
		if ($scope.currentPage === 1) {
			$scope.showCategories = $scope.categories.slice(1, $scope.numItemsPage);
			$scope.hideAll = false;
		} else {
			$scope.hideAll = true;
		}
	};
});
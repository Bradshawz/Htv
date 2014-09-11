'use strict';

app.controller('CreateCtrl', function($scope, $routeParams, Channel, User, $rootScope, $modal, userStuff) {
	$scope.channel = { name: ''};
	$scope.channels = userStuff;
	$scope.user = {};
	$scope.user.username = $routeParams.username;
	$scope.maxChannels = Object.keys($scope.channels).length === 6 ? true : false;

	$scope.hqImage = function() {
		angular.forEach($scope.channels, function(value) {
			value.img = value.img.replace('default', 'hqdefault');
		});
	};
	$scope.hqImage();

	$scope.open = function() {
		var modalInstance = $modal.open({
			templateUrl: 'views/submitchannel.html',
			controller: 'SubmitCtrl',
			size: 'lg',
			scope: $scope
		});
	};
});
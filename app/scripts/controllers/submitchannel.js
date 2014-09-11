'use strict';

app.controller('SubmitCtrl', function ($scope, $modalInstance, Channel, $location, $routeParams) {

	$scope.submitChannel = function () {
		Channel.create($scope.channel).then(function (channelId) {
			$scope.channels[channelId] = $scope.channel;
			$scope.channel = { name: ''};
			$modalInstance.dismiss();
			$location.path('createchannel/' + $routeParams.username + '/' + channelId);
		});
	};
});

'use strict';

app.controller('DeleteCtrl', function ($scope, $modalInstance, Channel, $location) {

	//Get rid of channel and contents 
	$scope.deleteChannel = function() {
		Channel.delete($scope.channelId, $scope.programCategory).then(function() {
			$location.path('/createchannel/' + $scope.user.username);
			$modalInstance.dismiss();
		});
	};

	$scope.noDelete = function() {
		$modalInstance.dismiss();
	};
});

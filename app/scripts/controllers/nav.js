'use strict';

app.controller('NavCtrl', function ($scope, $location, Auth, User) {

	$scope.logout = function () {
		Auth.logout();
	};
});

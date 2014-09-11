'use strict';

app.factory('Show',
	function($firebase, FIREBASE_URL, User, $routeParams, $q) {

		var categoriesRef = new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories');
		var categories = $firebase(categoriesRef);


		var Show = {

			deleteCategory: function(category) {
				if (User.signedIn()) {
					categories.$remove(category);
				}
			},
			createShow: function(show) {
				if (User.signedIn()) {
					return categories.$child(show.category).$child('shows').$add(show);
				}
			},
			deleteShow: function(showId, show) {
				if (User.signedIn()) {
					return categories.$child(show.category).$child('shows').$remove(showId);
				}
			},
			deleteSet: function(setId, set) {
				if (User.signedIn()) {
					return categories.$child(set.category).$child('sets').$remove(setId);
				}
			},
			updateShow: function(show) {
				if (User.signedIn()) {
					categories.$child(show.category).$child('shows').$remove(show.$id);
					return categories.$child(show.category).$child('shows').$add(show);
				}
			},
			updateSet: function(set) {
				if (User.signedIn()) {
					categories.$child(set.category).$child('sets').$remove(set.$id);
					return categories.$child(set.category).$child('sets').$add(set);
				}
			},

			createSet: function(showSet, shows) {
				if (User.signedIn()) {
					var promises = [];
					var deffered = $q.defer();
					promises.push(deffered.promise);
					var setRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories/' + showSet.category + '/sets'));
					setRef.$on('loaded', function() {
						setRef.$add(showSet).then(function(temp) {
							var setId = temp.name();
							angular.forEach(shows, function(show) {
								var deffered = $q.defer();
								promises.push(deffered.promise);
								setRef.$child(setId).$child('shows').$add(show).then(function(){
									deffered.resolve();
								});
							});
							deffered.resolve();
						});
					});
					return $q.all(promises);
				}
			},
			saveProgram: function(program, channelId) {
				if (User.signedIn()) {
					var deffered = $q.defer();
					var channelRef = $firebase(new Firebase(FIREBASE_URL + 'channels/' + channelId));
					channelRef.$on('loaded', function() {
						channelRef.$child('content').$set(program).then(function()  {
							deffered.resolve();
						});
					});
					return deffered.promise;
				}
			}
		};

		return Show;
	}
);
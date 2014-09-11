'use strict';

app.factory('Presence',
	function($rootScope, FIREBASE_URL, $route, $q) {
		var onlineUsers = 0;

		var getOnlineUserCount = function() {
			return onlineUsers;
		};

		return {
			getOnlineUserCount: getOnlineUserCount,
			deletePresence: function(channelUsers) {
				var deffered = $q.defer();
				var promise = function() {
					deffered.resolve();
				};
				channelUsers.remove(promise);
				return deffered.promise;
			},
			updatePresence: function(channelUsers, username) {
				channelUsers.update({'name': username});
			},
			addPresence: function() {
				var channelPath = FIREBASE_URL + 'channels/' + $route.current.params.channelId + '/presence';
				var channelRef = new Firebase(channelPath);
				var channelUsers = channelRef.push();
				channelUsers.once('value', function() {
					channelUsers.set({'time':Firebase.ServerValue.TIMESTAMP});
					channelUsers.onDisconnect().remove();
					channelRef.on('value', function(snap) {
						onlineUsers  = snap.numChildren();
						$rootScope.$broadcast('onOnlineUser');
					});
				});
				return channelUsers;
			}
		};
	}
);
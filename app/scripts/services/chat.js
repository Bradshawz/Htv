'use strict';

app.factory('Chat',
	function($rootScope, FIREBASE_URL) {
		var messagesRef = '';
		var moderatorRef = '';
		var Chat = {
			initChat: function(channelId) {
				messagesRef = new Firebase(FIREBASE_URL + 'chat/' + channelId + '/chat');
				moderatorRef = new Firebase(FIREBASE_URL + 'channels/' + channelId + '/moderators');
			},
			addComment: function(message) {
				messagesRef.push().setWithPriority({'username':$rootScope.currentUser.username, 'message':message}, Firebase.ServerValue.TIMESTAMP);
			},
			deleteComment: function(messageId, username) {
				messagesRef.child(messageId).update({'message': 'This message has been deleted.', 'editedBy':username});
			},
			makeModerator: function(username) {
				moderatorRef.child(username).set(username);
			},
			removeModerator: function(username) {
				moderatorRef.child(username).remove();
			},
			populateComments: function() {
				messagesRef.limit(10).on('child_added', function(snap) {
					var messageId = snap.name();
					var message = snap.val();
					$rootScope.$broadcast('newMessage', message, messageId);
				});
				//Used for deleting comments
				messagesRef.on('child_changed', function(snap) {
					var messageId = snap.name();
					var newMessage = snap.val();
					$rootScope.$broadcast('messageChanged', newMessage, messageId);
				});
			},
			setTimeOut: function() {

			},
			timeOut: function() {

			},
			ignoreUser: function() {

			}
		};

		return Chat;
	}
);
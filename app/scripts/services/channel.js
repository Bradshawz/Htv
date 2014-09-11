'use strict';

app.factory('Channel',
	function($firebase, FIREBASE_URL, User, $q, $filter, BLANK_PICTURE) {

		var ref = new Firebase(FIREBASE_URL + 'channels');
		var countersRef = new Firebase(FIREBASE_URL + 'counters');
		var chatRef = new Firebase(FIREBASE_URL + 'chat');
		var firebaseCounterRef = new Firebase(FIREBASE_URL + 'totalChannels');
		var chat = $firebase(chatRef);
		var categoryCountersRef = new Firebase(FIREBASE_URL + 'categoryCounters');
		var categoryCounters = $firebase(categoryCountersRef);
		var allCountersRef = new Firebase(FIREBASE_URL + 'allCounters');
		var allCounters =  $firebase(allCountersRef);
		var counters = $firebase(countersRef);
		var channels = $firebase(ref);
		var channelidsRef = new Firebase(FIREBASE_URL + 'channelIds');

		var Channel = {
			all: channels,
			create: function (channel) {
				if (User.signedIn()) {
					var user = User.getCurrent();
					channel.owner = user.username;
					channel.favourites = 0;
					channel.totalViews = 0;
					return channels.$add(channel).then(function (ref) {
						var channelId = ref.name();
						channelidsRef.child(channelId).set(channel.owner);
						countersRef.child(channel.category).child(channelId).setWithPriority({name: channel.name, 'owner':user.username, 'img': BLANK_PICTURE}, 0);
						if (categoryCounters[channel.category] === undefined) {
							categoryCountersRef.child(channel.category).setWithPriority(channel.category, 0);
						}
						firebaseCounterRef.transaction(function(value) {
							if (value === undefined) {
								return 1;
							} else {
								return value + 1;
							}
						});
						allCountersRef.child(channelId).setWithPriority({'name': channel.name, 'owner': user.username, 'category': channel.category, 'viewers': 0, 'img': BLANK_PICTURE}, 0);
						user.$child('channels').$child(channelId).$set({channelId: channelId, 'category': channel.category, 'name': channel.name});
						return channelId;
					});
				}
			},
			find: function (channelId) {
				return allCounters.$child(channelId);
			},
			getInfo: function (channelId) {
				var favourites = channels.$child(channelId).$child('favourites');
				var totalViews = 0;
				totalViews = channels.$child(channelId).$child('totalViews');
				var info = {
					favourites: favourites,
					totalViews: totalViews,
				};
				return info;
			},
			delete: function (channelId, category) {
				if (User.signedIn()) {
					channelidsRef.child(channelId).remove();
					allCounters.$remove(channelId);
					firebaseCounterRef.transaction(function(value) {
						return value - 1;
					});
					chat.$remove(channelId);

					counters.$child(category).$remove(channelId).then(function() {
						if (counters[category] === undefined) {
							categoryCounters.$remove(category);
						}
					});
					var promises = [];
					var deffered = $q.defer();
					promises.push(deffered.promise);
					var channel = channels.$child(channelId);

					channel.$on('loaded', function () {
						var user = User.findByUsername(channel.owner);

						channels.$remove(channelId).then(function () {
							user.$child('channels').$remove(channelId).then(function() {
								deffered.resolve();
							});
						});
					});
					return $q.all(promises);
				}
			},
			changeName: function(name, channelId, category) {
				if (User.signedIn()) {
					var promises = [];
					var deffered = $q.defer();
					promises.push(deffered.promise);
					var user = User.getCurrent();
					allCounters.$child(channelId).$update({name: name, category: category});
					counters.$child(category).$child(channelId).$update({'name': name});
					channels.$child(channelId).$update({'name': name});
					user.$child('channels').$child(channelId).$update({'name': name}).then(function() {
						deffered.resolve();
					});
					return $q.all(promises);
				}
			},
			changeCategory: function(category, channelId, oldCategory) {
				if (User.signedIn()) {
					var counterPriority = 0;
					var promises = [];
					var deffered = $q.defer();
					promises.push(deffered.promise);
					var user = User.getCurrent();
					var name = counters[oldCategory][channelId].name;
					channels.$child(channelId).$update({'category': category});
					allCounters.$child(channelId).$update({name: name, category: category});
					countersRef.child(oldCategory).child(channelId).once('value', function(snap) {
						counterPriority = snap.getPriority();
					});
					counters.$child(oldCategory).$remove(channelId).then(function() {
						if (counters[oldCategory] === undefined) {
							categoryCounters.$remove(oldCategory);
						}
					});
					if (categoryCounters[category] === undefined) {
						categoryCountersRef.child(category).setWithPriority(category, 0);
					}
					counters.$child(category).$child(channelId).$update({name: name, 'owner': user.username, 'img': BLANK_PICTURE});
					countersRef.child(category).child(channelId).setPriority(counterPriority);
					user.$child('channels').$child(channelId).$update({'category': category}).then(function() {
						deffered.resolve();
					});
					return $q.all(promises);
				}
			}
		};

		return Channel;
	}
);
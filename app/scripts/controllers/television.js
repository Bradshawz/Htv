/*global $:false */
'use strict';

app.controller('TelevisionCtrl', function ($scope, $firebase, FIREBASE_URL, $youtube, $routeParams, $filter, $timeout, Presence, Chat, User, $rootScope, username, $location) {
	var channelUsers = username[2];
	Chat.initChat($routeParams.channelId);
	//stuff that shouldnt be here
	$scope.twoTimes = ['9:00 PM', '9:30 PM'];
	$scope.timeModifier = 3600000;
	$scope.hideChat = false;

	//Do things if the user is singed in
	if ($rootScope.currentUser !== undefined) {
		Presence.updatePresence(channelUsers, $rootScope.currentUser.username);
		if ($rootScope.currentUser.hiddenChat !== undefined) {
			$scope.hideChat = $rootScope.currentUser.hiddenChat;
		}
	}
	$scope.showProgramRef = username[0];
	$scope.chat = {};
	$scope.initialTime = new Date(new Date().getTime() + username[4]);
	$scope.initialTime.setMilliseconds(0);
	$scope.message = '';
	$scope.positionIndex = 0;
	$scope.initialViewersRef = new Firebase(FIREBASE_URL + 'allCounters/' + $routeParams.channelId);
	$scope.initialViewersRef.once('value', function(snap) {
		$scope.initialViewers = snap.getPriority();
	});
	$scope.viewers = username[3];
	$scope.viewers = Presence.getOnlineUserCount();

	$scope.makeProgramArray = function() {
		$scope.programArray = [];
		var chosenTime = $scope.dt.getTime();
		var chosenEndTime = chosenTime + $scope.timeModifier;
		//For all the show sections, find the ones within time
		angular.forEach($scope.showProgram, function(showContent, timeSpan) {
			var timeRange = timeSpan.split('-');
			var startTime = parseInt(timeRange[0]);
			var endTime = parseInt(timeRange[1]);
			//Inside the show sections, find individual shows that are within time
			if(((chosenTime >= startTime) && (chosenTime <= endTime)) || ((chosenEndTime >= startTime) && (chosenEndTime <= endTime)) || ((chosenTime <= startTime) && (chosenEndTime >= endTime))) {
				angular.forEach(showContent, function(eachShow, showEnd) {
					//Calculate how much of the first show is inside time range
					var tempShow = $.extend({}, eachShow);
					if ((chosenTime >= showEnd-eachShow.length*1000) && (chosenTime <= showEnd)){
						tempShow.fakeLength = (showEnd - chosenTime)/1000;
						tempShow.end = showEnd;
						tempShow.timeSpan = timeSpan;
						if (tempShow.fakeLength > $scope.timeModifier/1000) {
							tempShow.fakeLength = $scope.timeModifier/1000;
						}
						$scope.programArray.push(tempShow);
					//Calculate how much of the last show is inside time range
					} else if ((chosenEndTime >= showEnd-eachShow.length*1000) && (chosenEndTime <= showEnd)) {
						tempShow.fakeLength = (chosenEndTime - (showEnd-tempShow.length*1000))/1000;
						tempShow.end = showEnd;
						tempShow.timeSpan = timeSpan;
						$scope.programArray.push(tempShow);
					//Get all the middle shows in time range
					} else if ((chosenTime <= showEnd) && (chosenEndTime >= showEnd)) {
						tempShow.fakeLength = tempShow.length;
						tempShow.end = showEnd;
						tempShow.timeSpan = timeSpan;
						$scope.programArray.push(tempShow);
					}
				});
			}
		});
	};

	$scope.amFollowing  = function() {
		if ($rootScope.currentUser !== undefined) {
			$scope.randomPerson = false;
			if ($scope.showProgramRef.favouriteUsers !== undefined) {
				if ($scope.showProgramRef.favouriteUsers[$rootScope.currentUser.username] === undefined) {
					$scope.follower = false;
				} else {
					$scope.follower = true;
				}
			}
		} else {
			$scope.randomPerson = true;
		}
	};

	$scope.goLeft = function() {
		var leftRef = new Firebase(FIREBASE_URL + 'counters/' + $routeParams.category);
		var leftAllRef = new Firebase(FIREBASE_URL + 'allCounters');

		if ($location.path().split('/')[2] !== 'all') {
			var off = leftRef.startAt($scope.initialViewers, $routeParams.channelId).limit(2).on('child_added', function(snap) {
				if (snap.name() !== $routeParams.channelId) {
					leftRef.off('child_added', off);
					$location.path('/watch/' + $routeParams.category + '/' + snap.name());
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
			});
			$timeout(function(){leftRef.off('child_added', off);},400);
		} else {
			var off = leftAllRef.startAt($scope.initialViewers, $routeParams.channelId).limit(2).on('child_added', function(snap) {
				if (snap.name() !== $routeParams.channelId) {
					leftAllRef.off('child_added', off);
					$location.path('/watch/all/' + snap.val().category + '/' + snap.name());
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
			});
			$timeout(function(){leftRef.off('child_added', off);},400);
		}
	};

	$scope.goRight = function() {
		var rightRef = new Firebase(FIREBASE_URL + 'counters/' + $routeParams.category);
		var rightAllRef = new Firebase(FIREBASE_URL + 'allCounters');

		if ($location.path().split('/')[2] !== 'all') {
			var off = rightRef.endAt($scope.initialViewers, $routeParams.channelId).limit(2).on('child_added', function(snap) {
				if (snap.name() !== $routeParams.channelId) {
					rightRef.off('child_added', off);
					$location.path('/watch/' + $routeParams.category + '/' + snap.name());
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
			});
			$timeout(function(){rightRef.off('child_added', off);},400);
		} else {
			var off = rightAllRef.endAt($scope.initialViewers, $routeParams.channelId).limit(2).on('child_added', function(snap) {
				if (snap.name() !== $routeParams.channelId) {
					rightAllRef.off('child_added', off);
					$location.path('/watch/all/' + snap.val().category + '/' + snap.name());
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
			});
			$timeout(function(){rightAllRef.off('child_added', off);},400);
		}
	};

	$scope.unpackSets = function() {
		$scope.repeatedArray = [];
		angular.forEach($scope.packedRepeatedArray, function(content) {
			if (content.shows !== undefined) {
				angular.forEach(content.shows, function(show) {
					$scope.repeatedArray.push(show);
				});
			} else {
				$scope.repeatedArray.push(content);
			}
		});
	};

	$scope.findTime = function() {
		var previousContent = {};
		var returnContent = {};
		var currentTime = $scope.initialTime.getTime();
		var stopLoop = false;
		angular.forEach($scope.showProgram, function(content, timeSpan) {
			if (stopLoop === false) {
				var timeRange = timeSpan.split('-');
				var startTime = parseInt(timeRange[0]);
				var endTime = parseInt(timeRange[1]);
				//live playlist
				if (currentTime >= startTime && currentTime <= endTime) {
					returnContent = content;
					stopLoop = true;
				}
				//nothing on, play last grouping of videos
				if (currentTime <= startTime) {
					returnContent = previousContent;
					stopLoop = true;
				}
				previousContent = content;
			}
		});
		if ($.isEmptyObject(returnContent)) {
			returnContent = previousContent;
		}
		return returnContent;
	};

	$scope.findArray = function() {
		var once = false;
		angular.forEach($scope.repeatedArray, function(content, index) {
			if (once === false) {
				$scope.timeInto = $scope.timeInto - content.length*1000;
				if ($scope.timeInto < 0 && once === false) {
					$scope.timeInto = $scope.timeInto + content.length*1000;
					$scope.positionIndex = index;
					once = true;
					return;
				}
			}
		});
	};

	$scope.initTelevision = function() {

		$scope.showProgram = $scope.showProgramRef.content;
		if ($scope.showProgram !== undefined) {
			$scope.repeatedSection = {};
			$scope.repeatedSection = $scope.findTime();
			if ($scope.repeatedSection.startTime !== undefined) {
				$scope.deletedStart = $scope.repeatedSection.startTime;
				$scope.deletedEnd = $scope.repeatedSection.endTime;
				delete $scope.repeatedSection.endTime;
				delete $scope.repeatedSection.startTime;
			}
			$scope.timeInto = $scope.initialTime.getTime() % $scope.deletedStart;
			$scope.timeInto = $scope.timeInto %  ($scope.deletedEnd - $scope.deletedStart);
			$scope.holdTimeInto = $scope.timeInto;
			$scope.packedRepeatedArray = $filter('orderByPriority')($scope.repeatedSection);
		}

		$scope.unpackSets();

		if ($scope.repeatedArray.length !== 0) {
			$scope.findArray();
			$scope.videoUrl = $scope.repeatedArray[$scope.positionIndex].url;
		}
		$scope.videoTime = $scope.timeInto/1000;
		if ($scope.holdTimeInto !== undefined) {
			$scope.dt = new Date($scope.deletedStart + $scope.holdTimeInto);
		} else {
			$scope.dt = new Date(new Date().getTime() + username[4]);
		}
		$scope.makeProgramArray();
	};
	$scope.amFollowing();

	$scope.totalFavourites = $scope.showProgramRef.favourites;

	$scope.initTelevision();

	//Used in chat to find out if moderator, owner, or just watcher
	$scope.channelOwner = $scope.showProgramRef.owner;

	$scope.amOwner = function() {
		if ($rootScope.currentUser === undefined) {
			return false;
		}
		if ($scope.channelOwner === $rootScope.currentUser.username) {
			return true;
		} else {
			return false;
		}
	};

	$scope.amModerator = function(username) {
		if ($rootScope.currentUser === undefined) {
			return false;
		}
		if ($scope.showProgramRef.moderators === undefined) {
			return false;
		}
		if (($scope.showProgramRef.moderators[$rootScope.currentUser.username] !== undefined) && ($scope.showProgramRef.moderators[username] === undefined) && ($scope.channelOwner !== username)) {
			return true;
		}
	};

	$scope.canMakeMod = function(username) {
		if (username === $scope.channelOwner) {
			return false;
		}
		if ($scope.showProgramRef.moderators !== undefined && $scope.showProgramRef.moderators[username] !== undefined) {
			return false;
		}
		return true;
	};

	$scope.canUnMod = function(username) {
		if (username === $scope.channelOwner) {
			return false;
		}
		if ($scope.showProgramRef.moderators !== undefined && $scope.showProgramRef.moderators[username] !== undefined) {
			return true;
		}
		return false;
	};

	//$scope.$on('youtube.player.ready', function() {
		//$timeout(function(){$youtube.player.seekTo($scope.videoTime, true);},500)
		//$youtube.player.playVideo();
	//});

	//Get next youtube video
	$scope.$on('youtube.player.ended', function() {
		$scope.videoTime = null;
		$scope.positionIndex++;
		$scope.positionIndex = $scope.positionIndex % $scope.repeatedArray.length;
		if ($scope.videoUrl === $scope.repeatedArray[$scope.positionIndex].url) {
			$youtube.player.seekTo(0, true);
		}
		$scope.videoUrl = $scope.repeatedArray[$scope.positionIndex].url;
	});

	var userListenerOff = $scope.$on('onOnlineUser', function() {
		$scope.$apply(function() {
			$scope.viewers = Presence.getOnlineUserCount();
		});
	});

	var chatListenerOff = $scope.$on('newMessage', function(event, message, messageId) {
		var bottom = false;
		var elem = document.getElementById('messages');
		if (elem.scrollHeight - elem.clientHeight <= elem.scrollTop + 30) {
			bottom = true;
		}
		$scope.chat[messageId] = message;
		//wait for DOM to load, then if we were at the bottom stay at the bottom
		$timeout(function(){
			elem = document.getElementById('messages');
			if (bottom === true) {
				elem.scrollTop = elem.scrollHeight - elem.clientHeight;
			}
		}, 0);
	});

	var editMessageOff = $scope.$on('messageChanged', function(event, message, messageId) {
		if ($scope.chat[messageId] !== undefined) {
			$scope.chat[messageId] = message;
		}
	});

	Chat.populateComments();

	$scope.$on('$locationChangeStart', function() {
		$(document).off();
		chatListenerOff();
		editMessageOff();
		userListenerOff();
		Presence.deletePresence(channelUsers);
	});

	$scope.addComment = function() {
		if (User.signedIn()) {
			if ($scope.message !== '') {
				Chat.addComment($scope.message);
				$scope.message = '';
			}
		} else {
			$scope.signUp = 'You must be signed in to chat.';
		}
	};
	$scope.deleteComment = function(messageId) {
		Chat.deleteComment(messageId, $rootScope.currentUser.username);
	};

	$scope.makeModerator = function(username) {
		Chat.makeModerator(username);
	};
	$scope.removeModerator = function(username) {
		Chat.removeModerator(username);
	};

	$scope.nextVideo = function() {
		$scope.videoTime = null;
		$scope.positionIndex++;
		$scope.positionIndex = $scope.positionIndex % $scope.repeatedArray.length;
		if ($scope.videoUrl === $scope.repeatedArray[$scope.positionIndex].url) {
			$youtube.player.seekTo(0, true);
		}
		$scope.videoUrl = $scope.repeatedArray[$scope.positionIndex].url;
	};

	$scope.gotoCurrent = function() {
		var oldUrl = $scope.videoUrl;
		$scope.initialTime = new Date(new Date().getTime() + username[4]);
		$scope.initialTime.setMilliseconds(0);
		$scope.initTelevision();
		if (oldUrl === $scope.videoUrl) {
			$youtube.player.seekTo($scope.videoTime, true);
			$youtube.player.playVideo();
		}
	};

	$scope.totalFavouritesRef = new Firebase(FIREBASE_URL + 'channels/' + $routeParams.channelId + '/favourites');

	$scope.follow = function() {
		$scope.follower = true;
		$scope.favouritesRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $rootScope.currentUser.username + '/favourites'));
		$scope.favouritesRef.$on('loaded', function() {
			var favouriteId = {};
			favouriteId[$routeParams.channelId] = $routeParams.channelId;
			$scope.favouritesRef.$child($routeParams.channelId).$set($routeParams.channelId);
			$scope.showProgramRef.$child('favouriteUsers').$child($rootScope.currentUser.username).$set($rootScope.currentUser.username);
			$scope.totalFavouritesRef.transaction(function(value) {
				$scope.totalFavourites = value + 1;
				return value + 1;
			});
		});
	};

	$scope.unfollow = function() {
		$scope.favouritesRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $rootScope.currentUser.username + '/favourites'));
		$scope.favouritesRef.$on('loaded', function() {
			$scope.favouritesRef.$remove($routeParams.channelId);
			$scope.showProgramRef.$child('favouriteUsers').$remove($rootScope.currentUser.username);
			$scope.totalFavouritesRef.transaction(function(value) {
				$scope.totalFavourites = value - 1;
				return value - 1;
			});
		});
		$scope.follower = false;
	};

	//Total channel views
	$scope.totalViewRef = new Firebase(FIREBASE_URL + 'channels/' + $routeParams.channelId + '/totalViews');
	$scope.totalViewRef.transaction(function(value) {
		if (value === undefined) {
			$scope.totalViews = 1;
			return 1;
		} else {
			$scope.totalViews = value + 1;
			return value + 1;
		}
	});

	$(document).keydown(function(e) {
		if (e.which === 37) {
			$scope.goLeft();
			e.preventDefault();
			return false;
		}

		if (e.which === 39) {
			$scope.goRight();
			e.preventDefault();
			return false;
		}
	});


	//ALL COPY PASTED... REALLY NEEDS TO GO IN DIRECTIVE
	$scope.open = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		$scope.opened = true;
	};

	$scope.today = function() {
		$scope.dt = new Date(new Date().getTime() + username[4]);
		$scope.dt.setMilliseconds(0);
		$scope.dt.setSeconds(0);
	};

	$scope.clear = function () {
		$scope.dt = null;
	};

	$scope.format = 'dd-MMMM-yyyy';


	//TIMEPICKER
	$scope.hours = $scope.dt.getHours();
	$scope.ismeridian = true;

	$scope.toggleMode = function() {
		$scope.ismeridian = ! $scope.ismeridian;
	};

	$scope.changed = function () {
		if ($scope.hours === 23 && $scope.dt.getHours() === 0) {
			$scope.dt.setDate($scope.dt.getDate() + 1);
		}
		if ($scope.hours === 0 && $scope.dt.getHours() === 23) {
			$scope.dt.setDate($scope.dt.getDate() - 1);
		}
		$scope.hours = $scope.dt.getHours();
		$scope.makeProgramArray();
		$scope.setTwoTimes();
	};

	//Create the two times
	$scope.setTwoTimes = function() {
		var tempDate = new Date($scope.dt.getTime() + $scope.timeModifier/2);
		var meridianOne = 'AM';
		var hoursOne = $scope.dt.getHours();
		var minutesOne = $scope.dt.getMinutes();
		var meridianTwo = 'AM';
		var hoursTwo = tempDate.getHours();
		var minutesTwo = tempDate.getMinutes();
		if (hoursOne >= 12) {
			meridianOne = 'PM';
			hoursOne = hoursOne - 12;
		}
		if (hoursOne === 0) {
			hoursOne = 12;
		}
		if (hoursTwo >= 12) {
			meridianTwo = 'PM';
			hoursTwo = hoursTwo - 12;
		}
		if (hoursTwo === 0){
			hoursTwo = 12;
		}

		minutesOne = minutesOne<10?'0'+minutesOne:minutesOne;
		minutesTwo = minutesTwo<10?'0'+minutesTwo:minutesTwo;

		$scope.twoTimes[0] = hoursOne + ':' + minutesOne + ' ' + meridianOne;
		$scope.twoTimes[1] = hoursTwo + ':' + minutesTwo + ' ' + meridianTwo;
	};
	$scope.setTwoTimes();

	$scope.resizeProgram = function(length, index, end) {
		var time = $scope.dt.getTime();
		if (index === 0) {
			$scope.tempTime = time;
		}
		if (end >= time+$scope.timeModifier) {
			end = time+$scope.timeModifier;
		}
		var margin = -($scope.tempTime - (end - length*1000))/1000;
		$scope.tempTime = end;
		return {'width': 100*(length/($scope.timeModifier/1000))+'%', 'margin-left':100*(margin/($scope.timeModifier/1000))+'%'};
	};

	$scope.resizeTimes = function() {
		return {'width': 50+'%'};
	};

	$scope.videoSize = function() {
		if (true) {
			return {'width': 90+'%'};
		}
	};

	$scope.iconMargin = function() {
		if (true) {
			return {'margin-left': 70+'%'};
		}
	};

	$scope.makeFullscreen = function() {
		var i = document.getElementById('fullscreen');
		if (i.requestFullscreen) {
			i.requestFullscreen();
		} else if (i.webkitRequestFullscreen) {
			i.webkitRequestFullscreen();
		} else if (i.mozRequestFullScreen) {
			i.mozRequestFullScreen();
		} else if (i.msRequestFullscreen) {
			i.msRequestFullscreen();
		}
	};

	$scope.notDeleted = function(message) {
		if (message === 'This message has been deleted.') {
			return false;
		} else {
			return true;
		}
	};

	$scope.nameViewers = function() {
		$scope.peopleInChat = [];
		$scope.chatPeople = !$scope.chatPeople;
		angular.forEach($scope.showProgramRef.presence, function(person) {
			if (person.name !== undefined) {
				$scope.peopleInChat.push(person.name);
			}
		});
	};
});
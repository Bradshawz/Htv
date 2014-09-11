/*global $:false */
'use strict';

app.controller('ChannelCtrl', function ($scope, $modal, $routeParams, $location, User, Channel, $rootScope, $timeout, Show, $filter, $firebase, FIREBASE_URL) {

	$scope.unsaved = false;
	$scope.canDelete = false;
	$scope.channelId = $routeParams.channelId;
	$scope.timeModifier = 3600000;
	$scope.timeRange = '1 Hour';
	$scope.selectableTimes = ['1 Hour', '3 Hours', '6 Hours', '12 Hours', '24 Hours'];
	$scope.twoTimes = ['9:00 PM', '9:30 PM'];
	$scope.showSetArray = [];
	$scope.programArray = [];
	$scope.showSetLength = 0;
	$scope.user = User.findByUsername($routeParams.username);
	$scope.user.$on('loaded', function() {
		$scope.programCategory = $scope.user.channels[$scope.channelId].category;
		$scope.programName = $scope.user.channels[$scope.channelId].name;
	});
	$scope.categoryRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories'));
	$scope.categoryRef.$on('loaded', function() {
		$scope.selectedCategory = $scope.categoryRef.$getIndex()[0];
		$scope.user.$on('loaded', function() {
			$scope.makeArray();
			$scope.makeSetArray();
		});
	});

	$scope.deleteCategory = function(category) {
		Show.deleteCategory(category);
	};

	$scope.deleteShow = function(showId, show) {
		Show.deleteShow(showId, show).then(function(){
			$scope.makeArray();
		});
	};

	$scope.deleteSet = function(setId, set) {
		Show.deleteSet(setId, set).then(function() {
			$scope.makeSetArray();
		});
	};

	$scope.submitShow = function() {
		var temp = $filter('hostnameFromUrl');
		$scope.show.source = temp($scope.show.url);
		//USED FOR YOUTUBE URLS
		if ($scope.show.source === 'www.youtube.com') {
			$scope.parseUrl($scope.show.url);
			//GET YOUTUBE VIDEO DATA
			$.getJSON('https://gdata.youtube.com/feeds/api/videos/'+$scope.url+'?v=2&alt=jsonc', function(data) {
				$scope.show.length = data.data.duration;
				$scope.show.title = data.data.title;
				$scope.autoplay = data.data.accessControl.autoplay;
			}).then(function() {
				if ($scope.autoplay === 'denied') {
					return;
				}
				//Set object to proper priority
				$scope.tempShow = $scope.show;
				if ((typeof($scope.user.categories) === 'undefined') || (typeof($scope.user.categories[$scope.show.category]) === 'undefined') || (typeof($scope.user.categories[$scope.show.category].shows) === 'undefined')) {
					$scope.show.$priority = 1;
					Show.createShow($scope.tempShow).then(function() {
						$scope.selectedCategory = $scope.tempShow.category;
						$scope.makeArray();
						$scope.makeSetArray();
					});
				} else {
					$scope.ref = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories/' + $scope.show.category + '/shows'));
					//Give ref time to get $firebase
					$scope.ref.$on('loaded', function() {
						var sortedShows = $filter('orderByPriority')($scope.ref);
						$scope.tempShow.$priority = sortedShows[sortedShows.length-1].$priority + 1;
						Show.createShow($scope.tempShow).then(function() {
							$scope.selectedCategory = $scope.tempShow.category;
							$scope.makeArray();
							$scope.makeSetArray();
						});
					});
				}
				//Reset form
				$scope.showForm.$setPristine();
				$scope.show = {
					description: '',
					length: '',
					source: '',
					title: '',
					category: '',
					url: '',
				};
			});
		}
	};

	//Take youtube url and get id
	$scope.parseUrl = function(url){
		var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match&&match[7].length===11){
			$scope.url = match[7];
		}else{
			alert('Url does not work.');
		}
	};


	//THESE ARE THE TWO DROPDOWN LISTS, ONE FOR CATEGORIES ONE FOR TIME RANGE SELECTED
	$scope.status = {
		isopen: false
	};

	$scope.setCategory = function(category) {
		$scope.selectedCategory = category;
		$scope.makeArray();
		$scope.makeSetArray();
		$scope.status = {
			isopen: false
		};
	};

	$scope.timeStatus = {
		isopen: false
	};

	$scope.setTime = function(time) {
		$scope.timeRange = time;
		$scope.timeModifier = parseInt($scope.timeRange.split(' ')[0])*3600000;
		$scope.makeProgramArray();
		$scope.setTwoTimes();
		$scope.timeStatus = {
			isopen: false
		};
	};

	$scope.makeArray = function() {
		$scope.showRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories/' + $scope.selectedCategory + '/shows'));
		$scope.showRef.$on('loaded', function() {
			$scope.tarray = $filter('orderByPriority')($scope.showRef);
		});
	};

	$scope.makeSetArray = function() {
		$scope.setRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories/' + $scope.selectedCategory + '/sets'));
		$scope.setRef.$on('loaded', function() {
			$scope.sarray = $filter('orderByPriority')($scope.setRef);
		});
	};

	//sortable for shows
	// $scope.showListOptions = {
	// 	cursor: 'move',
	// 	cancel: 'a',
	// 	stop: function(e, ui) {
	// 		$scope.updateShow($(ui.item).index());
	// 	},
	// 	disabled: false
	// };

	//sortable for sets
	// $scope.setListOptions = {
	// 	cursor: 'move',
	// 	cancel: 'a',
	// 	stop: function(e, ui) {
	// 		$scope.updateSet($(ui.item).index());
	// 	},
	// 	disabled: false
	// };

	//sortable for creation of set
	$scope.setCreateOptions = {
		cursor: 'move',
		stop: function() {
		}
	};

	$scope.updateShow = function(index) {
		//Stop spam sorting error
		$scope.showListOptions.disabled = true;
		var lowPriority = 0;
		var highPriority = 0;
		//Get surrounding priorities
		if (typeof $scope.tarray[index-1] === 'undefined') {
			lowPriority = 0;
		} else {
			lowPriority = $scope.tarray[index-1].$priority;
		}

		if (typeof $scope.tarray[index+1] === 'undefined') {
			highPriority = lowPriority + 1;
		} else {
			highPriority = $scope.tarray[index+1].$priority;
		}

		var newPriority = (lowPriority + highPriority) / 2;
		$scope.tarray[index].$priority = newPriority;
		Show.updateShow($scope.tarray[index]).then(function() {
			$scope.makeArray();
			$scope.showListOptions.disabled = false;
		});
	};

	$scope.addSet = function(show) {
		$scope.showSetLength = $scope.showSetLength + show.length;
		$scope.showSetArray.push(show);
	};

	$scope.createSet = function() {
		var counter = 1;
		$scope.showSet.length = $scope.showSetLength;
		angular.forEach($scope.showSetArray, function(show) {
			show.$priority = counter;
			counter++;
		});
		//Set the sets priority
		if ((typeof($scope.user.categories) === 'undefined') || (typeof($scope.user.categories[$scope.showSet.category]) === 'undefined') || (typeof($scope.user.categories[$scope.showSet.category].sets) === 'undefined')) {
			$scope.showSet.$priority = 1;
			Show.createSet($scope.showSet, $scope.showSetArray).then(function() {
				$scope.makeSetArray();
				$scope.makeArray();
			});
			$scope.selectedCategory = $scope.showSet.category;
			$scope.showSetArray = [];
		} else {
			$scope.setRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $routeParams.username + '/categories/' + $scope.showSet.category + '/sets'));
			$scope.tempSet = $scope.showSet;
			//Give ref time to get $firebase
			$scope.setRef.$on('loaded', function() {
				var sortedSets = $filter('orderByPriority')($scope.setRef);
				$scope.tempSet.$priority = sortedSets[sortedSets.length-1].$priority + 1;
				Show.createSet($scope.tempSet, $scope.showSetArray).then(function() {
					$scope.makeSetArray();
					$scope.showSetArray = [];
					$scope.selectedCategory = $scope.tempSet.category;
					$scope.makeSetArray();
					$scope.makeArray();
				});
			});

		}
		$scope.showForm.$setPristine();
		$scope.showSetLength = 0;
		$scope.showSet = {
			shows: '',
			length: '',
			title: '',
			category: '',
		};
	};

	$scope.updateSet = function(index) {
		//Stop spam sorting error
		$scope.setListOptions.disabled = true;
		var lowPriority = 0;
		var highPriority = 0;
		//Get surrounding priorities
		if (typeof $scope.sarray[index-1] === 'undefined') {
			lowPriority = 0;
		} else {
			lowPriority = $scope.sarray[index-1].$priority;
		}

		if (typeof $scope.sarray[index+1] === 'undefined') {
			highPriority = lowPriority + 1;
		} else {
			highPriority = $scope.sarray[index+1].$priority;
		}

		var newPriority = (lowPriority + highPriority) / 2;
		$scope.sarray[index].$priority = newPriority;
		Show.updateSet($scope.sarray[index]).then(function() {
			$scope.makeSetArray();
			$scope.setListOptions.disabled = false;
		});
	};

	$scope.resizeLength = function(length) {
		return {width: 500*(length/$scope.showSetLength)+'px'};
	};

	//THINGS PAST HERE ARE FOR THE CREATION OF CHANNEL

	//DATEPICKER
	$scope.open = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		$scope.opened = true;
	};

	$scope.today = function() {
		$scope.dt = new Date();
		$scope.dt.setMilliseconds(0);
		$scope.dt.setSeconds(0);
	};
	$scope.today();

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

	//SHOW
	$scope.user.$on('loaded', function() {
		$scope.showProgramRef = $firebase(new Firebase(FIREBASE_URL + 'channels/' + $scope.channelId));
		$scope.showProgramRef.$on('loaded', function() {
			if ($scope.showProgramRef.content === undefined) {
				$scope.showProgram = {};
			} else {
				$scope.showProgram = $scope.showProgramRef.content;
			}
			$scope.makeProgramArray();
		});
	});
	// $scope.showProgramRef.$on('loaded', function() {
	// 	$scope.showProgramRef.$bind($scope, 'showProgram').then(function() {
	// 		$scope.makeProgramArray();
	// 	});
	// });


	$scope.addProgram = function(content, insert) {
		$scope.orderedShow = $filter('orderByPriority')($scope.showProgram);
		$scope.orderedShow = $filter('orderBy')($scope.orderedShow, 'startTime');
		var chosenTime = $scope.dt.getTime();
		var appendedProgram = false;
		angular.forEach($scope.orderedShow, function(showContent, index) {
			var startTime = showContent.startTime;
			var endTime = showContent.endTime;
			//no room to create a new program
			if ((chosenTime < startTime) && ((chosenTime + content.length*1000) > startTime)) {
				appendedProgram = true;
				return;
			}
			if((chosenTime >= startTime) && (chosenTime <= endTime)) {
				if (insert === false) {
					$scope.appendProgram(content, index, startTime, endTime);
				}
				if (insert === true) {
					$scope.insertProgram(content, index, startTime, endTime, chosenTime);
				}
				appendedProgram = true;
				return;
			}
		});
		if(!appendedProgram){
			$scope.newProgram(content);
		}
		$scope.makeProgramArray();
	};

	$scope.appendProgram = function(content, index, startTime, endTime) {
		var timeSpan = startTime + '-' + endTime;
		var temp = $.extend({}, $scope.showProgram[timeSpan]);
		var newEndTime = endTime + content.length * 1000;
		var newTimeSpan = startTime + '-' + newEndTime;
		var overlapping = false;
		delete content.$id;
		delete content.$priority;
		delete content.$$hashKey;
		temp[newEndTime] = content;
		if ($scope.orderedShow[index+1] !== undefined) {
			if ($scope.orderedShow[index+1].startTime < newEndTime) {
				overlapping = true;
			}
		}
		if (overlapping === false) {
			$scope.unsaved = true;
			delete $scope.showProgram[timeSpan];
			//temp.$priority = startTime;
			temp.startTime = startTime;
			temp.endTime = newEndTime;
			$scope.showProgram[newTimeSpan] = temp;
		}
	};

	$scope.newProgram = function(content) {
		$scope.unsaved = true;
		var startTime = $scope.dt.getTime();
		var endTime = startTime + content.length * 1000;
		var timeString = startTime + '-' + endTime;
		var temp = {};
		delete content.$id;
		delete content.$priority;
		delete content.$$hashKey;
		temp[endTime] = content;
	//	temp.$priority = startTime;
		temp.startTime = startTime;
		temp.endTime = endTime;
		$scope.showProgram[timeString] = temp;
	};

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

	$scope.deleteProgram = function(content) {
		if ($scope.canDelete === true) {
			$scope.unsaved = true;
			if (content.timeSpan === ((parseInt(content.end)-content.length*1000) + '-' + content.end)) {
				delete $scope.showProgram[content.timeSpan];
				$scope.makeProgramArray();
				return;
			}
			var newContent = {};
			var timeRange = content.timeSpan.split('-');
			var sTime = parseInt(timeRange[0]);
			var eTime = parseInt(timeRange[1]);
			var newLength = sTime + '-' + (eTime-content.length*1000);
			var changeTime = false;
			var skipLoop = false;
			var ignoreContent = false;
			angular.forEach($scope.showProgram[content.timeSpan], function(showContent, endTime) {
				if(typeof(showContent) === 'object') {
					ignoreContent = false;
					if(endTime === content.end) {
						changeTime = true;
						skipLoop = true;
						ignoreContent = true;
					}
					if (skipLoop === false) {
						newContent[endTime] = showContent;
					}
					if (ignoreContent === false) {
						if (skipLoop === true) {
							newContent[endTime-content.length*1000] = showContent;
						}
					}
				}
			});
			delete $scope.showProgram[content.timeSpan];
			$scope.showProgram[newLength] = newContent;
			$scope.showProgram[newLength].endTime = eTime-content.length*1000;
			$scope.showProgram[newLength].startTime = sTime;
			$scope.makeProgramArray();
		}
	};

	$scope.insertProgram = function(content, index, startTime, endTime, chosenTime) {
		var timeSpan = startTime + '-' + endTime;
		var temp =  {};
		var newEndTime = endTime + content.length * 1000;
		var newTimeSpan = startTime + '-' + newEndTime;
		var overlapping = false;
		var inserted = false;
		delete content.$id;
		delete content.$priority;
		delete content.$$hashKey;
		if ($scope.orderedShow[index+1] !== undefined) {
			if ($scope.orderedShow[index+1].startTime < newEndTime) {
				overlapping = true;
			}
		}
		if (overlapping === false) {
			$scope.unsaved = true;
			angular.forEach($scope.orderedShow[index], function(showContent, eTime) {
				if(typeof(showContent) === 'object') {
					if (inserted === false) {
						temp[eTime] = showContent;
					}
					if (inserted === true) {
						temp[parseInt(eTime) + content.length*1000] = showContent;
					}
					if ((inserted === false) && (chosenTime >= (eTime - showContent.length * 1000)) && (chosenTime <= eTime)) {
						temp[parseInt(eTime) + content.length*1000] = content;
						inserted = true;
					}
				}
			});
			delete $scope.showProgram[timeSpan];
			temp.startTime = startTime;
			temp.endTime = newEndTime;
			$scope.showProgram[newTimeSpan] = temp;
		}
	};

	$scope.saveProgram = function() {
		Show.saveProgram($scope.showProgram, $scope.channelId, $scope.user.channels[$scope.channelId].category).then(function() {
			$scope.unsaved = false;
		});
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

	$scope.changeName = function() {
		Channel.changeName($scope.newName, $routeParams.channelId, $scope.programCategory).then(function() {
			$scope.newName = '';
			$scope.programName = $scope.user.channels[$scope.channelId].name;
		});
	};

	$scope.changeCategory = function() {
		Channel.changeCategory($scope.newCategory, $routeParams.channelId, $scope.programCategory).then(function() {
			$scope.newCategory = '';
			$scope.programCategory = $scope.user.channels[$scope.channelId].category;
		});
	};

	$scope.areYouSure = function() {
		var modalInstance = $modal.open({
			templateUrl: 'views/deletechannel.html',
			controller: 'DeleteCtrl',
			size: 'lg',
			scope: $scope
		});
	};

	$scope.deleteFromSet = function(show, index) {
		if ($scope.canDelete === true) {
			$scope.showSetArray.splice(index, 1);
			$scope.showSetLength = $scope.showSetLength - show.length;
		}
	};
});
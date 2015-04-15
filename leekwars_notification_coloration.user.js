// ==UserScript==
// @name			Leek Wars Notifications Coloration
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.4
// @description		Colorize Leekwars notifications
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_notification_coloration.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_notification_coloration.user.js
// @match			http://leekwars.com
// @match			http://leekwars.com/*
// @include        	http://leekwars.com
// @include        	http://leekwars.com/*
// @require 		http://leekwars.com/static/lib/jquery-2.1.1.min.js
// @grant			GM_addStyle
// @grant			GM_getValue
// @grant			GM_setValue
// @grant			GM_deleteValue
// @grant			GM_listValues
// ==/UserScript==
var DATAMODEL_VERSION = "0.1";

GM_addStyle('.win{background-color: #B8FFB3;}\
 .defeat{background-color: #FFB3AE;}\
 .draw{background-color: #DCDCDC;}\
 .gold{background-color:#FFF0C6;}\
 a[href*=farmer] .notif {background-color:#FFF0C6;}\
 a[href*=leek] .notif {background-color:#FFE664;}\
 a .notif:hover {background-color:#FFFFFF;}\
 ');

var GM_STORAGE = "leekwars.notifications.";

var PROCESS_DELAY = 1;

var NOTIFICATION_TYPE_FIGHT = "FIGHT";
var NOTIFICATION_TYPE_FARMER = "FARMER";
var NOTIFICATION_TYPE_LEEK = "LEEK";
var NOTIFICATION_TYPE_TEAM = "TEAM";
var NOTIFICATION_TYPE_TOURNAMENT = "TOURNAMENT";
var NOTIFICATION_TYPE_FORUM = "FORUM";

var NOTIFICATION_RESULT_WIN = "WIN";
var NOTIFICATION_RESULT_DRAW = "DRAW";
var NOTIFICATION_RESULT_DEFEAT = "DEFEAT";

var RESULT_DEAD = "DEAD";
var RESULT_ALIVE = "ALIVE";

var TOURNAMENT_TEXT_16EME = "16ème de finale";
var TOURNAMENT_TEXT_8EME = "8ème de finale";
var TOURNAMENT_TEXT_QUART = "Quart de finale";
var TOURNAMENT_TEXT_DEMI = "Demi finale";
var TOURNAMENT_TEXT_FINALE = "Finale";

var TOURNAMENT_TURN_TEXT = [TOURNAMENT_TEXT_16EME,TOURNAMENT_TEXT_8EME,TOURNAMENT_TEXT_QUART,TOURNAMENT_TEXT_DEMI,TOURNAMENT_TEXT_FINALE];
var TOURNAMENT_TURN_SIZE = [48,58,68,78,88];

var TOURNAMENT_CLASS_MY_PLAYER = "my-player";
var TOURNAMENT_CLASS_LOOSER = "looser";
var REGEX_TOURNAMENT_ID = /([a-z]+)([0-9]+)/i;

var REGEX_LEEK = /.*\/leek\/(.*)/i;
var REGEX_FARMER = /.*\/farmer/i;
var REGEX_TEAM = /.*\/team\/(.*)/i;
var REGEX_FIGHT = /.*\/fight\/(.*)/i;
var REGEX_TOURNAMENT = /.*\/tournament\/(.*)/i;
var REGEX_FORUM = /.*\/forum\/(.*)/i;

var URL_REPORT = "http://leekwars.com/report/";
var URL_FARMER = "http://leekwars.com/farmer";
var URL_LEEK = "http://leekwars.com/leek";
var URL_TOURNAMENT = "http://leekwars.com/tournament/";

function checkCache() {
	
	var cacheVersion = GM_getValue(GM_STORAGE+"version");
	if(DATAMODEL_VERSION!=cacheVersion) {
		var keys = GM_listValues();
		for (var i=0,key=null; key=keys[i]; i++) {
			GM_deleteValue(key);
		}
		GM_setValue(GM_STORAGE+"version",DATAMODEL_VERSION);
	}
}

function getNotification(id) {
	var savedNotif = GM_getValue(GM_STORAGE+id);
	if(savedNotif) {
		return JSON.parse(savedNotif);
	} else {
		return null;
	}
}

function setNotification(notification) {
	GM_setValue(GM_STORAGE+notification.id,JSON.stringify(notification));
}

var ME = null;
var ME_LOADING = false;

function arrayIntersect(a, b) {
    return $.grep(a, function(i){
        return $.inArray(i, b) > -1;
    });
}

function getNotifications() {
	return $("#notifications .notif");
}

function getNotificationsMenu() {
	return $("#notifs-menu .notif");
}

function getLeek(notification) {
	var value = REGEX_LEEK.exec(notification.href);
	return value && value[1] ? value[1] : null;
}

function isFarmer(notification) {
	var value = REGEX_FARMER.exec(notification.href);
	return value && value[0];
}

function getTeam(notification) {
	var value = REGEX_TEAM.exec(notification.href);
	return value && value[1] ? value[1] : null;
}

function getFight(notification) {
	var value = REGEX_FIGHT.exec(notification.href);
	return value && value[1] ? value[1] : null;
}

function getTournament(notification) {
	var value = REGEX_TOURNAMENT.exec(notification.href);
	return value && value[1] ? value[1] : null;
}

function getForum(notification) {
	var value = REGEX_FORUM.exec(notification.href);
	return value && value[1] ? value[1] : null;
}

function getId(notification) {
	return $(notification).children()[0].id;
}

var dataLoader = null;
function getDataLoarder() {
	if(dataLoader === null) {
		dataLoader = $('<div style="display:none;"></div>');
		$("body").append(dataLoader);
	}
	
	return dataLoader;
}

function getMyInfos() {

	if(ME===null && !ME_LOADING) {
		ME_LOADING = true,
		$.post(URL_FARMER,function(data){
			var $data = $(data);
			ME = {};
			ME.id = unsafeWindow.__FARMER_ID;
			ME.name = unsafeWindow.__FARMER_NAME;
			ME.leeks = [];
			ME.leeksIds = [];
			var leekDivs = $data.find("#leeks .leek");
			for(var leekIndex=0;leekIndex<leekDivs.length;leekIndex++) {
				var leekDiv = leekDivs[leekIndex];
				getDataLoarder().html(leekDiv);
				getDataLoarder().find(".talent").remove();
				getDataLoarder().find(".level").remove();
				var id = getDataLoarder().find("div")[0].id;
				var name = getDataLoarder().text().trim();
				ME.leeks.push({"id":id,"name":name});
				ME.leeksIds.push(id);
			}
			ME_LOADING = false;
		});
	}
	
	if(ME_LOADING) {
		return null;
	}
	
	return ME;
}

function getFarmers(data) {
	var farmerDivs = data.find('.report a[href*=farmer]');
	if(farmerDivs.length===0) {
		return null;
	}	
	var result = [];
	for(var i=0;i<farmerDivs.length;i++) {
		var farmerDiv = farmerDivs[i];
		result.push(farmerDiv.href.substring(URL_FARMER.length+1));
	}
	
	return result;
}

function getFarmerResult(data,farmerId) {
	var report = data.find('.report a[href*='+farmerId+']').parent().parent();
	if(report.length===0) {
		return null;
	}
	
	var alive = report.html().indexOf("alive")>-1;
	if(alive) {
		return RESULT_ALIVE;
	}
	
	var dead = report.html().indexOf("dead")>-1;
	if(dead) {
		return RESULT_DEAD;
	}
	
	return null;
}

function getLeeks(data) {
	var leekDivs = data.find('.report a[href*=leek]');
	if(leekDivs.length===0) {
		return null;
	}	
	var result = [];
	for(var i=0;i<leekDivs.length;i++) {
		var leekDiv = leekDivs[i];
		result.push(leekDiv.href.substring(URL_LEEK.length+1));
	}
	
	return result;
}

function getLeekResult(data,leekId) {
	var report = data.find('.report a[href*='+leekId+']').parent().parent();
	if(report.length===0) {
		return null;
	}
	
	var alive = report.html().indexOf("alive")>-1;
	if(alive) {
		return RESULT_ALIVE;
	}
	
	var dead = report.html().indexOf("dead")>-1;
	if(dead) {
		return RESULT_DEAD;
	}
	
	return null;
}

function getTournamentTurn(data) {
	var text = data.text;
	for(var turn=0;turn<TOURNAMENT_TURN_TEXT.length;turn++) {
		if(text.indexOf(TOURNAMENT_TURN_TEXT[turn])>-1) {
			return turn;
		}
	}	
	return null;
}

function getTournamentMatchResult(data,turn) {
	var wantedMatch = data.find("."+TOURNAMENT_CLASS_MY_PLAYER+"[width="+TOURNAMENT_TURN_SIZE[turn]+"]");
	if(wantedMatch.length==0) {
		return null;
	}
	var looser = data.find("."+TOURNAMENT_CLASS_MY_PLAYER+"[width="+TOURNAMENT_TURN_SIZE[turn]+"]."+TOURNAMENT_CLASS_LOOSER).length>0;
	
	if(!looser) {
		return NOTIFICATION_RESULT_WIN;
	}
	
	wantedMatch = $(wantedMatch[0]);
	var ids = REGEX_TOURNAMENT_ID.exec(wantedMatch[0].id);
	var baseId = ids[1];
	var numberId = parseInt(ids[2]);
	
	var enemyId = numberId%2==0 ? numberId-1 : numberId+1;
	
	var enemyLooser = data.find("#"+baseId+enemyId+"."+TOURNAMENT_CLASS_LOOSER).length>0;
	
	return enemyLooser ? NOTIFICATION_RESULT_DRAW : NOTIFICATION_RESULT_DEFEAT;
}

/**
NOTIFICATION_TYPE_FIGHT = "FIGHT";
NOTIFICATION_TYPE_FARMER = "FARMER";
NOTIFICATION_TYPE_LEEK = "LEEK";
NOTIFICATION_TYPE_TEAM = "TEAM";
NOTIFICATION_TYPE_TOURNAMENT = "TOURNAMENT";
NOTIFICATION_TYPE_FORUM = "FORUM";
*/
function applyNotificationColor(notificationData) {
	if(!notificationData) {
		return;
	}

	var notifPage = $("#page #"+notificationData.id);
	var notifMenu = $("#notifs #"+notificationData.id);

	if(notificationData.type==NOTIFICATION_TYPE_FIGHT || notificationData.type==NOTIFICATION_TYPE_TOURNAMENT) {
	
		if(notificationData.result==NOTIFICATION_RESULT_DEFEAT) {
			// Défaite
			notifPage.addClass("defeat");
			notifMenu.addClass("defeat");
		} else if(notificationData.result==NOTIFICATION_RESULT_WIN) {
			// Victoire
			notifPage.addClass("win");
			notifMenu.addClass("win");
		} else if(notificationData.result==NOTIFICATION_RESULT_DRAW) {
			// Nul
			notifPage.addClass("draw");
			notifMenu.addClass("draw");
		}
		
	} else if(notificationData.type==NOTIFICATION_TYPE_FARMER) {

		/*
		notifPage.addClass("gold");
		notifMenu.addClass("gold");
		*/
	}
}

toProcess = [];
processing = false;

function processNext() {
	if(processing) {
		return;
	}
	
	var currentNotificationId  = toProcess.shift();
	if(currentNotificationId) {
		processing = true;
		
		var notificationData = getNotification(currentNotificationId);
		
		if(notificationData) {
			applyNotificationColor(notificationData);
			processing = false;
			setTimeout(processNext,PROCESS_DELAY);
			return;
		}
		
		var notification = $("#"+currentNotificationId).parent()[0];
		
		var fight = getFight(notification);

		if(fight!==null) {
			$.post(URL_REPORT+fight, function(data) {
				var notificationData = {"id":currentNotificationId,"type":NOTIFICATION_TYPE_FIGHT};
				getDataLoarder().html($(data).find("#report-general"));
				
				var farmers = getFarmers(getDataLoarder());
				var leeks = getLeeks(getDataLoarder());
				
				if(farmers) {
					// Bataille d'éleveur
					
					var other = farmers[0]==ME.id ? farmers[1] : farmers[0];
					
					var myResult = getFarmerResult(getDataLoarder(),ME.id);
					var otherResult = getFarmerResult(getDataLoarder(),other);
					
					if(myResult==RESULT_DEAD) {
						// Défaite
						notificationData.result = NOTIFICATION_RESULT_DEFEAT;
					} else if(otherResult==RESULT_DEAD) {
						// Victoire
						notificationData.result = NOTIFICATION_RESULT_WIN;
					} else {
						// Nul
						notificationData.result = NOTIFICATION_RESULT_DRAW;
					}
					
				} else if(leeks) {
					if(leeks.length==2) {
						var myLeek = arrayIntersect(leeks,ME.leeksIds)[0];
						var other = leeks[0]==myLeek ? leeks[1] : leeks[0];
						
						var myResult = getLeekResult(getDataLoarder(),myLeek);
						var otherResult = getLeekResult(getDataLoarder(),other);
						
						if(myResult==RESULT_DEAD) {
							// Défaite
							notificationData.result = NOTIFICATION_RESULT_DEFEAT;
						} else if(otherResult==RESULT_DEAD) {
							// Victoire
							notificationData.result = NOTIFICATION_RESULT_WIN;
						} else {
							// Nul
							notificationData.result = NOTIFICATION_RESULT_DRAW;
						}
					}
				}
				
				setNotification(notificationData);
				applyNotificationColor(notificationData);
				
				processing = false;
				setTimeout(processNext,PROCESS_DELAY);
				
			});
			
			return;
		}
		
		var farmer = isFarmer(notification);
		if(farmer) {
			var notificationData = {"id":currentNotificationId,"type":NOTIFICATION_TYPE_FARMER};
			setNotification(notificationData);
			applyNotificationColor(notificationData);
			
			processing = false;
			setTimeout(processNext,PROCESS_DELAY);
			return;
		}
		
		var tournament = getTournament(notification);
		if(tournament!=null) {
			var turn = getTournamentTurn(notification);
			
			$.post(URL_TOURNAMENT+tournament, function(data) {
				var notificationData = {"id":currentNotificationId,"type":NOTIFICATION_TYPE_TOURNAMENT};
				getDataLoarder().html($(data).find("#tournament"));
				
				var result = getTournamentMatchResult(getDataLoarder(),turn);
				if(result!=null) {
					notificationData.result = result;
					setNotification(notificationData);
					applyNotificationColor(notificationData);
				}
				
				processing = false;
				setTimeout(processNext,PROCESS_DELAY);

			});
			
			return;
		}


		
		processing = false;
		setTimeout(processNext,PROCESS_DELAY);
		
	}
	
	
	
}

function updateNotifications() {
	if(getMyInfos()===null) {
		setTimeout(updateNotifications,1000);
	} else {
		var notifications = getNotifications();
		
		for(var i=0;i<notifications.length;i++) {
			var notification = notifications[i];
			toProcess.push(notification.id);
		}
		
		processNext();
	
	}
	
}

function updateNotificationsMenu() {
	if(toProcess.length==0) {
		var notifications = getNotificationsMenu();
		
		for(var i=0;i<notifications.length;i++) {
			var notification = notifications[i];
			toProcess.push(notification.id);
		}
		
		processNext();
	}
}

checkCache();
$(".notif[type=9]").addClass("gold");
updateNotifications();

setInterval(updateNotificationsMenu,1000);

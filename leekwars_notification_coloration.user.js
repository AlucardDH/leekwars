// ==UserScript==
// @name			Leek Wars Notifications Coloration
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.1
// @description		Help you to visualize your own documention in your code
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_notification_coloration.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_notification_coloration.user.js
// @match			http://leekwars.com*
// @include        	http://leekwars.com*
// @grant			GM_addStyle
// @grant			GM_getValue
// @grant			GM_setValue
// @grant			GM_deleteValue
// @grant			GM_listValues
// @grant			GM_info
// ==/UserScript==
var DATAMODEL_VERSION = "0.1";

GM_addStyle('.win{background-color: #B8FFB3;}\
 .defeat{background-color: #FFB3AE;}\
 .draw{background-color: #FFFFFF;}\
 .gold{background-color:#FFF0C6;}\
 a[href*=farmer] .notif {background-color:#FFF0C6;}\
 a[href*=leek] .notif {background-color:#FFE664;}\
 a .notif:hover {background-color:#FFFFFF;}\
 ');

var GM_STORAGE = "leekwars.notifications.";

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

var REGEX_LEEK = /.*\/leek\/(.*)/i;
var REGEX_FARMER = /.*\/farmer/i;
var REGEX_TEAM = /.*\/team\/(.*)/i;
var REGEX_FIGHT = /.*\/fight\/(.*)/i;
var REGEX_TOURNAMENT = /.*\/tournament\/(.*)/i;
var REGEX_FORUM = /.*\/forum\/(.*)/i;

var URL_REPORT = "http://leekwars.com/report/";
var URL_FARMER = "http://leekwars.com/farmer";
var URL_LEEK = "http://leekwars.com/leek";

ME = null;
var ME_LOADING = false;

function arrayIntersect(a, b) {
    return $.grep(a, function(i){
        return $.inArray(i, b) > -1;
    });
}

function getNotifications() {
	return $(".notif");
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
			ME.id = __FARMER_ID;
			ME.name = __FARMER_NAME;
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

	if(notificationData.type==NOTIFICATION_TYPE_FIGHT) {
	
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
			setTimeout(processNext,10);
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
				setTimeout(processNext,10);
				
			});
			
			return;
		}
		
		var farmer = isFarmer(notification);
		if(farmer) {
			var notificationData = {"id":currentNotificationId,"type":NOTIFICATION_TYPE_FARMER};
			setNotification(notificationData);
			applyNotificationColor(notificationData);
			
			processing = false;
			setTimeout(processNext,10);
			return;
		}
		
		


		
		processing = false;
		setTimeout(processNext,10);
		
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

checkCache();
updateNotifications();

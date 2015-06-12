// ==UserScript==
// @name			Leek Wars V2 - Notifications Coloration
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.5
// @description		Colorize Leekwars notifications
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_v2_notification_coloration.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_v2_notification_coloration.user.js
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

/*
Etapes :
1) récupération des notifs sur la page
2) pour chaque notif :
	* si déjà traité, on laisse
	* si non traité mais déjà en cache, on applique
	* si pas en cache, on traite puis on applique


*/


/////////// CACHE /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var DATAMODEL_VERSION = "0.3";
var GM_STORAGE = "leekwars.notifications.";

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

/////////// FIN CACHE /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////// STYLES /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var NOTIFICATION_TYPE_FIGHT = "FIGHT";
var NOTIFICATION_TYPE_FARMER = "FARMER";
var NOTIFICATION_TYPE_LEEK = "LEEK";
var NOTIFICATION_TYPE_TEAM = "TEAM";
var NOTIFICATION_TYPE_TOURNAMENT = "TOURNAMENT";
var NOTIFICATION_TYPE_FORUM = "FORUM";

var DEFAULT_STYLES = {};
var DEFAULT_STYLES_NAMES = {};

function isIconOnly() {
	var result = GM_getValue(GM_STORAGE+"param.iconOnly");
	
	if(result!==null) {
		result = result=="true" ? true : false;
	} else {
		result = false;
	}
	
	return result;
}

function setIconOnly(value) {
	GM_setValue(GM_STORAGE+"param.iconOnly",""+value);
}

function getStyle(styleType) {
	var styleId = GM_STORAGE+"style."+styleType;
	var style = GM_getValue(styleId);
	if(style) {
		return JSON.parse(style);
	} else {
		return DEFAULT_STYLES[styleType];
	}
}

function setStyle(styleType,style) {
	var styleId = GM_STORAGE+"style."+styleType;
	if(style) {
		GM_setValue(styleId,JSON.stringify(style));
	} else {
		GM_deleteValue(styleId);
	}
}
 
function styleToString(style) {
	var result = style.selector;
	if(isIconOnly()) {
		result += " img";
	}
	result += "{";
	for(var property in style) {
		if(property.indexOf("elector")<0) {	
			result += property+":"+style[property]+";";
		}
		
	}
	result += "}";
	//console.log(result);

	return result;
}

function initStyles() {

// STYLES TOURNOIS 
/*
	  width: 16px;
  height: 16px;
  background: greenyellow;
  padding: 4px;
  border-color: #555;
  border-width: 9px 2px;
  border-style: solid;
*/
	GM_addStyle(styleToString({selector:".tournament .fight",width:"16px",height:"16px",padding:"4px","border-color":"#555","border-width":"9px 2px","border-style":"solid"}));
	GM_addStyle(styleToString({selector:".tournament .no-fight",display:"inline-block",width:"16px",height:"16px",padding:"4px",background:"#555","border-color":"#555","border-width":"9px 2px","border-style":"solid"}));
	GM_addStyle(styleToString({selector:".tournament *","vertical-align":"top"}));	

// STYLES NOTIFICATIONS
	DEFAULT_STYLES_NAMES.STYLE_TYPE_WIN = "Match gagn&eacute;";
	DEFAULT_STYLES.STYLE_TYPE_WIN = {selector:".notification.win,.fight.win",background:"#B8FFB3"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_DRAW = "Match nul";
	DEFAULT_STYLES.STYLE_TYPE_DRAW = {selector:".notification.draw,.fight.draw",background:"#DCDCDC"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_DEFEAT = "Match perdu";
	DEFAULT_STYLES.STYLE_TYPE_DEFEAT = {selector:".notification.defeat,.fight.defeat",background:"#FFB3AE"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_TOURNAMENT_WIN = "Tournoi gagn&eacute;";
	DEFAULT_STYLES.STYLE_TYPE_TOURNAMENT_WIN = {selector:".tournamentWin",jquerySelector:".notification[type=9]",background:"#FFF0C6"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_TOURNAMENT_TEAM_WIN = "Tournoi éleveur gagn&eacute;";
	DEFAULT_STYLES.STYLE_TYPE_TOURNAMENT_TEAM_WIN = {selector:".tournamentWin",jquerySelector:".notification[type=17]",background:"#FFF0C6"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_ACHIEVEMENT = "Succès d&eacute;bloqu&eacute;";
	DEFAULT_STYLES.STYLE_TYPE_ACHIEVEMENT = {selector:"a[href*=farmer] .notification",background:"#FFF0C6"};
	
	DEFAULT_STYLES_NAMES.STYLE_TYPE_LEVEL_UP = "Mont&eacute;e de niveau";
	DEFAULT_STYLES.STYLE_TYPE_LEVEL_UP = {selector:"a[href*=leek] .notification",background:"#FFE664"};
	
	for(var styleType in DEFAULT_STYLES) {
		var style = getStyle(styleType);
		GM_addStyle(styleToString(style));
		if(style.jquerySelector) {
			$(style.jquerySelector).addClass(style.selector.substring(1));
		}
	}
	
	if(isIconOnly()) {
		GM_addStyle('.notification img{margin-right:6px;}');
	}
	
	GM_addStyle('a .notification:hover {background-color:#FFFFFF;}');
}

function updateStyleJQuery() {
	for(var styleType in DEFAULT_STYLES) {
		var style = getStyle(styleType);
		if(style.jquerySelector) {
			$(style.jquerySelector).addClass(style.selector.substring(1));
		}
	}
}

function applyNotificationColor(notification,notificationData) {
	if(!notificationData) {
		return;
	}

	if(notificationData.type==NOTIFICATION_TYPE_FIGHT || notificationData.type==NOTIFICATION_TYPE_TOURNAMENT) {
		if(notificationData.result==LW_API.DEFEAT) {
			// D&eacute;faite
			notification.children().addClass("defeat");
		} else if(notificationData.result==LW_API.WIN) {
			// Victoire
			notification.children().addClass("win");
		} else if(notificationData.result==LW_API.DRAW) {
			// Nul
			notification.children().addClass("draw");
		}
		
	}
}


////////// FIN STYLES /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



////////// NOTIFICATIONS A TRAITER /////////////////////////////////////////////////////////////////////////////////////////////////////////

function getNotifications() {
	return $.map($(".notification"),function(e){return $(e).parent();}).filter(function(e){return !e.attr("colored");});
}

////////// FIN NOTIFICATIONS A TRAITER //////////////////////////////////////////////////////////////////////////////////////////////////////

///////// PARSING ///////////////////////////////////////

var TOURNAMENT_TEXT_16EME = "16ème de finale";
var TOURNAMENT_TEXT_8EME = "8ème de finale";
var TOURNAMENT_TEXT_QUART = "Quart de finale";
var TOURNAMENT_TEXT_DEMI = "Demi finale";
var TOURNAMENT_TEXT_FINALE = "Finale";

var TOURNAMENT_ROUND_TEXT = [TOURNAMENT_TEXT_16EME,TOURNAMENT_TEXT_8EME,TOURNAMENT_TEXT_QUART,TOURNAMENT_TEXT_DEMI,TOURNAMENT_TEXT_FINALE];
var TOURNAMENT_ROUND_KEY = ["sixteenths","eighths","quarters","semifinals","finals"];

var REGEX_TOURNAMENT_ID = /([a-z]+)([0-9]+)/i;

var REGEX_LEEK = /.*\/leek\/(.*)/i;
var REGEX_FARMER = /.*\/farmer/i;
var REGEX_TEAM = /.*\/team\/(.*)/i;
var REGEX_FIGHT = /.*\/fight\/(.*)/i;
var REGEX_TOURNAMENT = /.*\/tournament\/(.*)/i;
var REGEX_FORUM = /.*\/forum\/(.*)/i;

function getLeekId(notificationId) {
	var value = REGEX_LEEK.exec(notificationId);
	return value && value[1] ? value[1] : null;
}

function isFarmer(notificationId) {
	var value = REGEX_FARMER.exec(notificationId);
	return value && value[0];
}

function getTeamId(notificationId) {
	var value = REGEX_TEAM.exec(notificationId);
	return value && value[1] ? value[1] : null;
}

function getFightId(notificationId) {
	var value = REGEX_FIGHT.exec(notificationId);
	return value && value[1] ? value[1] : null;
}

function getTournamentId(notificationId) {
	var value = REGEX_TOURNAMENT.exec(notificationId);
	return value && value[1] ? value[1] : null;
}

function getForumId(notificationId) {
	var value = REGEX_FORUM.exec(notificationId);
	return value && value[1] ? value[1] : null;
}

function getTournamentRound(data) {
	//console.log(data);
	var text = $(data).text().trim();
	for(var round=0;round<TOURNAMENT_ROUND_TEXT.length;round++) {
		if(text.indexOf(TOURNAMENT_ROUND_TEXT[round])>-1) {
			return TOURNAMENT_ROUND_KEY[round];
		}
	}	
	return null;
}

function getTournamentLeekId(data) {
	var text = $(data).text().trim();
	//console.log(text);
	if(text.indexOf("Votre match")!=-1) {
		// Match éleveur
		return null;
	}
	
	var name = text.substring(0,text.indexOf(" "));
	var result = null;
	$.each(LW_API.getMyFarmer().leeks,function(index,leek) {
		if(leek.name==name) {
			result = leek.id;
		}
	});
	
	return result;
}


///////// FIN PARSING ////////////////////////////////////

///////// TRAITEMENT ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var PROCESS_DELAY = 1;

toProcess = [];
processing = false;

function processNext() {
	if(toProcess===null || toProcess.length===0) {
		return;
	}
	
	processing = true;
	var notification = toProcess.shift();	
	notification.attr("colored","true");
	var notificationId = notification.attr("href");
	
	var tournamentId = getTournamentId(notificationId);
	if(tournamentId!==null) {
		var round = getTournamentRound(notification);
		var leekId = getTournamentLeekId(notification);
		notificationId += "/"+round+"/"+leekId;
	}
	
//	console.log(notificationId);
	var notificationData = getNotification(notificationId);
	
	if(notificationData!=null) {
		applyNotificationColor(notification,notificationData);
		if(toProcess.length===0) {
			processing = false;
		} else {
			setTimeout(processNext,PROCESS_DELAY);
		}
		return;
	} else {
		notificationData = {"id":notificationId};
	}
	
	var fightId = getFightId(notificationId);
//	console.log("fightId : "+fightId);

	if(fightId!==null) {
		notificationData.type = NOTIFICATION_TYPE_FIGHT;
		LW_API.getFight(fightId,function(fight) {
			if(fight!==null) {
				var result = LW_API.getMyFightResult(fight);
				if(result!=null) {
					notificationData.result = result;
					setNotification(notificationData);
					applyNotificationColor(notification,notificationData);
					if(toProcess.length===0) {
						processing = false;
					} else {
						setTimeout(processNext,PROCESS_DELAY);
					}
				} else {
					notification.removeAttr("colored");
				}
			}
		});
		
		return;
	}
	
	var farmer = isFarmer(notificationId);
//	console.log("farmer : "+farmer);
	
	if(farmer!==null) {
		notificationData.type = NOTIFICATION_TYPE_FARMER;
		setNotification(notificationData);
	//	applyNotificationColor(notificationData);
		
		if(toProcess.length===0) {
			processing = false;
		} else {
			setTimeout(processNext,PROCESS_DELAY);
		}
		return;
	}
	
	if(tournamentId!==null) {
		var round = getTournamentRound(notification);
		if(round==null) {
			if(toProcess.length===0) {
				processing = false;
			} else {
				setTimeout(processNext,PROCESS_DELAY);
			}
			return;
		}
		var leekId = getTournamentLeekId(notification);
		notificationData.type = NOTIFICATION_TYPE_TOURNAMENT;
		LW_API.getTournament(tournamentId,function(tournamentData) {
			var entityId;
			if(tournamentData.tournament.type=="solo") {
				entityId = leekId;
			} else if(tournamentData.tournament.type=="team") {
				entityId = LW_API.getMyFarmer().team.id;
			} else if(tournamentData.tournament.type=="farmer") {
				entityId = LW_API.getMyFarmer().id;
			} 
		//	console.log(tournamentData);
		//	console.log("round : "+round+" entityId : "+entityId);
			var tournamentFight = LW_API.getTournamentFight(tournamentData,round,entityId,null);
		//	console.log(tournamentFight);
			if(tournamentFight==null) {
				return;
			}
			var result = LW_API.getFightResult(tournamentFight,entityId,null);
		//	console.log(result);
			if(result!=null) {
				notificationData.result = result;
				setNotification(notificationData);
				applyNotificationColor(notification,notificationData);
			} else {
				notification.removeAttr("colored");
			}
			
			if(toProcess.length===0) {
				processing = false;
			} else {
				setTimeout(processNext,PROCESS_DELAY);
			}
		});
		
		return;
	}

	if(toProcess.length===0) {
		processing = false;
	} else {
		setTimeout(processNext,PROCESS_DELAY);
	}
	return;
}

///////// FIN TRAITEMENT ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////// INIT /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
checkCache();
initStyles();

setInterval(function() {
//	console.log("checkNotif (processing:"+processing+")");
	if(!processing) {
		processing = true;		
		toProcess = getNotifications();
		if(toProcess===null || toProcess.length===0) {
			processing = false;
			return;
		}
		updateStyleJQuery();
		processNext();
	}

},2000);


setInterval(function() {
	var tournaments = $.map($(".tournament"),function(e){return $(e).parent();}).filter(function(e){return !e.attr("colored");});
	$.each(tournaments,function(index,tournament) {
		tournament.attr("colored","true");
		var link = tournament.attr("href");
		var tournamentId = getTournamentId(link);
		var entityId = location.href.substring(location.href.lastIndexOf("/")+1);
		var dateElement = tournament.find(".date");
		var date = dateElement.text();
		var baseText = tournament.text();
		baseText = baseText.substring(0,baseText.indexOf(date)).trim();
		LW_API.getTournament(tournamentId,function(tournamentData) {
			$.each(TOURNAMENT_ROUND_KEY,function(index,round) {
				// getTournamentFight:function(tournamentData,round,entityId,entityName)
				var fight = LW_API.getTournamentFight(tournamentData,round,entityId,null);
				if(fight!=null) {
					var result = LW_API.getMyFightResult(fight);
					if(result!=null) {
						var element = $('<img src="../static/image/icon/garden.png" class="fight"/>');
						element.click(function(event){
							event.preventDefault();
							event.stopPropagation();
							LW.page(fight.fight);
						});
						if(result==LW_API.WIN) {
							element.addClass("win");
						} else if(result==LW_API.DEFEAT) {
							element.addClass("defeat");
						} else if(result==LW_API.DRAW) {
							element.addClass("draw");
						}
						dateElement.before(element);
					}
				} else {
					var element = $('<span class="no-fight"/>');
					dateElement.before(element);
				}
				//console.log(fight);
			});
		});
		
	});
},2000);




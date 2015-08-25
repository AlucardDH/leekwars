// ==UserScript==
// @name			Leek Wars V2 - API Helper
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.5
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_api_helper.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_api_helper.user.js
// @require 		http://leekwars.com/static/lib/jquery-2.1.1.min.js
// @match			http://leekwars.com
// @match			http://leekwars.com/*
// @include        	http://leekwars.com
// @include        	http://leekwars.com/*
// @grant			unsafeWindow
// ==/UserScript==

var TEAM_COMPO_REGEX = /^(.+) - (.+) \(([0-9]+)\)$/i;

unsafeWindow.LW_API = {

	WIN:"WIN",
	DEFEAT:"DEFEAT",
	DRAW:"DRAW",

    isReady:function() {
		return unsafeWindow.LW!=null;
	},
	
// Infos

	getMyFarmer:function(handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		if(handler!=null) {
			handler(unsafeWindow.LW.farmer);
		} else {
			return unsafeWindow.LW.farmer;
		}
	},
	
	getFarmer:function(farmerId,handler) {	
		if(!this.isReady()) {
			return;
		}
		
		if(farmerId==unsafeWindow.LW.farmer.id) {
			if(handler!=null) {
				handler(unsafeWindow.LW.farmer);
			}
		} else {
			var url = unsafeWindow.LW.api+"farmer/get/"+farmerId;
			$.getJSON(url,handler);
		}
		
	},
	
    getLeek:function(leekId,handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		var url = unsafeWindow.LW.api+"leek/get/"+leekId;
		$.getJSON(url,handler);
	},
	
	getTeam:function(teamId,handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		var url = unsafeWindow.LW.api+"team/get/"+teamId;
		$.getJSON(url,handler);
	},
	
	getCompos:function(teamId,handler) {
		this.getTeam(teamId,function(teamData) {
			var compos = {};
			var tournamentsToTest = [];
			$.each(teamData.team.tournaments,function(index,tournamentMiniData) {
				tournamentsToTest.push(tournamentMiniData.id);
			});
			var next = function() {
				if(tournamentsToTest.length==0) {
					var resultCompos = [];
					$.each(compos,function(compoName,compo) {
						resultCompos.push(compo);
					});
					handler(resultCompos);
				} else {
					var tournamentId = tournamentsToTest.pop();
					unsafeWindow.LW_API.getTournament(tournamentId,function(tournamentData) {
						$.each(tournamentData.tournament.rounds.sixteenths,function(index,roundData) {
							var constestant1 = roundData.contestants[0] && roundData.contestants[0].link.endsWith(teamId) ? roundData.contestants[0] : null;
							var team1Infos = constestant1 ? constestant1.name.match(TEAM_COMPO_REGEX) : null;
							var compo1 = constestant1 ? {"teamId":teamId,"teamName":team1Infos[1],"compoName":team1Infos[2],compoLevel:team1Infos[3]}: null;
							if(compo1) {
								if(compos[compo1.compoName]) {
									compo1 = null;
								} else {
									compos[compo1.compoName] = compo1;
								}
							}
							
							var constestant2 = roundData.contestants[1] && roundData.contestants[1].link.endsWith(teamId) ? roundData.contestants[1] : null;
							var team2Infos = constestant2 ? constestant2.name.match(TEAM_COMPO_REGEX) : null;
							var compo2 = constestant2 ? {"teamId":teamId,"teamName":team2Infos[1],"compoName":team2Infos[2],compoLevel:team2Infos[3]}: null;
							if(compo2) {
								if(compos[compo2.compoName]) {
									compo2 = null;
								} else {
									compos[compo2.compoName] = compo2;
								}
							}
							
							if(compo1 || compo2) {
								var fightId = roundData.fight.substring(roundData.fight.lastIndexOf("/")+1);
								
								unsafeWindow.LW_API.getFight(fightId,function(fightData) {
									if(compo1) {
										compo1.leeks = fightData.fight.leeks1;
										compos[compo1.compoName] = compo1;
									}
									if(compo2) {
										compo2.leeks = fightData.fight.leeks1;
										compos[compo2.compoName] = compo2;
									}
								});
							}
							
						});
						next();
					});
				}
			};
			next();
		});
	},
	
// Fights
    getFight:function(fightId,handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		var url = unsafeWindow.LW.api+"fight/get/"+fightId;
		$.getJSON(url,handler);
	},
	
	getTournament:function(tournamentId,handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		var url = unsafeWindow.LW.api+"tournament/get/"+tournamentId+"/$";
		$.getJSON(url,handler);
	},
	
	tournamentConstestantTest:function(contestant,entityId,entityName) {
		if(contestant==null) {
			return false;
		}
		if(entityId!=null && !contestant.link.endsWith(entityId)) {
			return false;
		}
		if(entityName!=null && contestant.name.indexOf(entityName)==-1) {
			return false;
		}
		if(entityId==null && entityName==null && !contestant.me) {
			return false;
		}
		return true;
	},
	
	getTournamentContestants:function(tournamentData,round) {
		if(
			tournamentData==null 
			|| tournamentData.tournament==null 
			|| tournamentData.tournament.rounds==null 
			|| tournamentData.tournament.rounds[round]==null
		) {
			return null;
		}

		var result = [];
		$.each(tournamentData.tournament.rounds[round],function(index,fight) {
			$.each(fight.contestants,function(index,contestant) {
				result.push(contestant);
			});
		});
		
		return result;
	},
	
	getTournamentFight:function(tournamentData,round,entityId,entityName) {
	//	console.log(round+","+entityId+","+entityName);
		if(
			tournamentData==null 
			|| tournamentData.tournament==null 
			|| tournamentData.tournament.rounds==null 
			|| tournamentData.tournament.rounds[round]==null
		) {
			return null;
		}

		var result = null;
		$.each(tournamentData.tournament.rounds[round],function(index,fight) {
		//	console.log(fight);
			$.each(fight.contestants,function(index,contestant) {
				if(unsafeWindow.LW_API.tournamentConstestantTest(contestant,entityId,entityName)) {
					result = fight;
				}
			});
		});
		
		return result;
	},
	
	getFightResult:function(fight,entityId,entityName) {
	//	console.log(fight);
	//	console.log("entityId :"+entityId+" ,entityName : "+entityName);
		if(fight==null) {
			return null;
		}
		
		var result = null;
		if(fight.contestants!=null) {
			// tournament fight data
			if(fight.fight==null) {
				return null;
			}
			$.each(fight.contestants,function(index,contestant) {
				if(contestant==null || contestant.win===null) {
				} else if(unsafeWindow.LW_API.tournamentConstestantTest(contestant,entityId,entityName) && contestant.win) {
					result = unsafeWindow.LW_API.WIN;
				} else if(!unsafeWindow.LW_API.tournamentConstestantTest(contestant,entityId,entityName) && contestant.win) {
					result = unsafeWindow.LW_API.DEFEAT;
				} else if(result==null) {
					result = unsafeWindow.LW_API.DRAW;
				}
			});
			
		} else {
			// complete fight data
			var winnerId = fight.fight.winner;
			if(winnerId==0) {
				return this.DRAW;
			}
			var winnerData;
			if(fight.fight.type=="solo" || fight.fight.type==0) {
				winnerData = fight.fight["leeks"+winnerId].length==0 ? {"id":0} : fight.fight["leeks"+winnerId][0];
				return winnerData.id==entityId ? this.WIN : this.DEFEAT;
			} else if(fight.fight.type=="farmer" || fight.fight.type==1) {
				winnerData = fight.fight["farmer"+winnerId];
				return winnerData==entityId ? this.WIN : this.DEFEAT;
			} else if(fight.fight.type=="team" || fight.fight.type==2) {
				winnerData = fight.fight["team"+winnerId];
				return winnerData==entityId ? this.WIN : this.DEFEAT;
			}
		}
		
		return result;
	},
	
	getMyFightResult:function(fight) {
	//	console.log(fight);
		if(fight==null) {
			return null;
		}
		var result = null;
		if(fight.contestants!=null) {
			// tournament fight data
			if(fight.fight==null) {
				return null;
			}
			$.each(fight.contestants,function(index,contestant) {
				if(contestant==null || contestant.win===null) {
				} else if(unsafeWindow.LW_API.tournamentConstestantTest(contestant) && contestant.win) {
					result = unsafeWindow.LW_API.WIN;
				} else if(!unsafeWindow.LW_API.tournamentConstestantTest(contestant) && contestant.win) {
					result = unsafeWindow.LW_API.DEFEAT;
				} else if(result==null) {
					result = unsafeWindow.LW_API.DRAW;
				}
			});
		} else {
			// complete fight data
			var winnerId = fight.fight.winner;
			if(winnerId==0) {
				return this.DRAW;
			}
			var winnerData;
			if(fight.fight.type=="solo" || fight.fight.type==0) {
				winnerData = fight.fight["leeks"+winnerId].length==0 ? {"id":0} : fight.fight["leeks"+winnerId][0];
				return this.getMyFarmer().leeks[winnerData.id]!=null ? this.WIN : this.DEFEAT;
			} else if(fight.fight.type=="farmer" || fight.fight.type==1) {
				winnerData = fight.fight["farmer"+winnerId];
				return winnerData==this.getMyFarmer().id ? this.WIN : this.DEFEAT;
			} else if(fight.fight.type=="team" || fight.fight.type==2) {
				winnerData = fight.fight["team"+winnerId];
				return winnerData==this.getMyFarmer().team.id ? this.WIN : this.DEFEAT;
			}
		}
		
		return result;
	},
	
// IAs

    getAIs:function(handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		//
		//var url = unsafeWindow.LW.api+"ai/get-farmer-ais/$";
		//$.getJSON(url,handler);
		handler(unsafeWindow.LW.farmer.ais);
	},

    getAI:function(aiId,handler) {	
		if(!this.isReady()) {
			console.error("LW_API not ready");
			return;
		}
		
		var url = unsafeWindow.LW.api+"ai/get/"+aiId+"/$";
		$.getJSON(url,handler);
	}
	
};
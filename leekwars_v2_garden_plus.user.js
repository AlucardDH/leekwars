// ==UserScript==
// @name          [Leek Wars] Fast Garden Plus
// @namespace		https://github.com/AlucardDH/leekwars
// @version       0.12
// @description   Permet de lancer plus rapidement ses combats
// @author        jojo123 & AlucardDH
// @namespace		https://github.com/AlucardDH/leekwars
// @namespace		https://github.com/AlucardDH/leekwars/raw/master/leekwars_v2_garden_plus.user.js
// @namespace		https://github.com/AlucardDH/leekwars/raw/master/leekwars_v2_garden_plus.user.js
// @match         http://leekwars.com/*
// @require 	  http://leekwars.com/static/lib/jquery-2.1.1.min.js
// @grant		  GM_addStyle
// @grant		  GM_getValue
// @grant		  GM_setValue
// @grant		  GM_deleteValue
// @grant		  GM_listValues
// ==/UserScript==

var GM_STORAGE = "leekwars.fights";
function getFights() {
	var saved = GM_getValue(GM_STORAGE);
	if(saved) {
		return JSON.parse(savedNotif);
	} else {
		return {};
	}
}

var FIGHTS;

function getWaitingFight(source,target,fightId,fightIndex) {
	_.get('fight/get/'+fightId, function(data){
		if (!loading && data.success && data.fight.status == 1) {
			switch (data.fight.winner) {
				case 1:
					scores.win++;
					break;
				case 2:
					scores.defeat++;
					break;
				default:
					scores.draw++;
			}
			FIGHTS[source][target].waiting = FIGHTS[source][target].waiting.splice(fightIndex,1);
			saveFights();
		} else {
			setTimeout(function(){
				getWaitingFight(source,target,fightId,fightIndex);
			},5000);
		}
	});
}

function getWaitingFights() {
	$.each(FIGHTS,function(source,targets) {
		$.each(targets,function(target,scores) {
			var newWaiting = [];
			$.each(scores.waiting,function(index,waiting) {
				getWaitingFight(source,target,waiting,index);
			});
		});
	});
}
	
function saveFights() {
	GM_setValue(GM_STORAGE,JSON.stringify(FIGHTS));
}

function addFight(type,params,fightId) {
	var source = type=="solo" ? type+"_"+params.leek_id : type;
	var target = params.target_id;
	
	var sourceFights = FIGHTS[source];
	if(!sourceFights) {
		FIGHTS[source] = [];
	}
	var targetResults = sourceFights[target];
	if(!targetResults) {
		FIGHTS[source][target] = {win:0,defeat:0,draw:0,waiting:[]};
	}
	FIGHTS[source][target].waiting.push(fightId);
	saveFights();
	getWaitingFight(source,target,fightId,FIGHTS[source][target].waiting.length-1);
}


(function()
{

	FIGHTS = getFights();
	getWaitingFights();

	var loading = false;

	var request_counter = 0;

	var scrollTop_value = $(window).scrollTop();

	// Click d'un adversaire
	$('body').on('mouseup', '#garden-solo .leek.enemy', function()
	{
		$(this).unbind("click");
	});
	$('body').on('click', '#garden-solo .leek.enemy', function(e)
	{
		e.stopPropagation();
		submitFight("solo", {
			leek_id: _myLeek,
			target_id: $(this).attr('leek')
		});
	});
	
	// Click d'un farmer
	$('body').on('mouseup', '#garden-farmer .farmer.enemy', function()
	{
		$(this).unbind("click");
	});
	$('body').on('click', '#garden-farmer .farmer.enemy', function(e)
	{
		e.stopPropagation();
		submitFight("farmer", {
			target_id: $(this).attr('id')
		});
	});

	// Click d'une compo adverse
	$('body').on('mouseup', '#garden-team .enemyCompo', function()
	{
		$(this).unbind("click");
	});
	$('body').on('click', '#garden-team .enemyCompo', function(e)
	{
		e.stopPropagation();
		submitFight("team", {
			composition_id: _myCompo,
			target_id: $(this).attr('id')
		});
	});

	// Changement de poireau
	$('body').on('click', '#garden-solo .myleek', function()
	{
		var myleek_id = $(this).attr('leek');
		$('#garden-solo .fight-history').hide();
		$('#garden-solo .fight-history[element_id='+myleek_id+']').show();
	});

	// Changement de compo
	$('body').on('click', '#garden-team .myCompo', function()
	{
		var myCompo_id = $(this).attr('id');
		$('#garden-team .fight-history').hide();
		$('#garden-team .fight-history[element_id='+myCompo_id+']').show();
	});

	// Lancement du combat
	function submitFight(type, params)
	{
		if (!loading)
		{
			loading = true;

			_.post('garden/start-'+type+'-fight', params, function(data)
			{
				if (data.success)
				{
					var fight_id = data.fight;
					addHistory(type, params, fight_id);
				}
				refreshInterface();
			});
		}
	}

	// Affichage de l'historique des combats
	function addHistory(type, params, fight_id)
	{

		if (type == "solo")
		{
			var myleek_id = $('#garden-solo .myleek.selected').attr('leek');
			var myleek_name = $('#garden-solo .myleek.selected').attr('name');

			var enemy_name = $('#garden-solo .leek[leek='+params.target_id+']').html().split('<br>')[0].split('</svg></div>')[1].replace(/\s/g,"");

			if (!$('#garden-solo .fight-history[element_id='+myleek_id+']').length)
				$('#garden-solo').append('<div class="fight-history" type="solo" element_id="'+myleek_id+'"></div>');
			$('#garden-solo .fight-history[element_id='+myleek_id+']').append('<div class="fight-wrapper" fight="'+fight_id+'"><div class="fight generating"><div class="fighters"><a href="/leek/'+myleek_id+'"><div class="fighter">'+myleek_name+'</div></a><div class="center"><a href="/fight/'+fight_id+'"><img src="http://leekwars.com/static/image/icon/garden.png"></a></div><a href="/leek/'+params.target_id+'"><div class="fighter">'+enemy_name+'</div></a></div></div></div>');
		}

		if (type == "farmer")
		{
			var enemy_name = $('#garden-farmer .farmer[id='+params.target_id+']').html().split('<br>')[1].replace(/\s/g,"");

			if (!$('#garden-farmer .fight-history').length)
				$('#garden-farmer').append('<div class="fight-history" type="farmer" element_id="0"></div>');
			$('#garden-farmer .fight-history').append('<div class="fight-wrapper" fight="'+fight_id+'"><div class="fight generating"><div class="fighters"><a href="/farmer/'+LW.farmer.id+'"><div class="fighter">'+LW.farmer.name+'</div></a><div class="center"><a href="/fight/'+fight_id+'"><img src="http://leekwars.com/static/image/icon/garden.png"></a></div><a href="/farmer/'+params.target_id+'"><div class="fighter">'+enemy_name+'</div></a></div></div></div>');
		}

		if (type == "team")
		{
			var myCompo_id = $('#garden-team .myCompo.selected').attr('id');
			var myCompo_name = $('#garden-team .myCompo.selected').attr('name');

			var enemy_name = $('#garden-team .enemyCompo[id='+params.target_id+']').html().split('<br>')[1].replace(/\s/g,"");

			if (!$('#garden-team .fight-history[element_id='+myCompo_id+']').length)
				$('#garden-team').append('<div class="fight-history" type="team" element_id="'+myCompo_id+'"></div>');
			$('#garden-team .fight-history[element_id='+myCompo_id+']').append('<div class="fight-wrapper" fight="'+fight_id+'"><div class="fight generating"><div class="fighters"><div class="fighter">'+myCompo_name+'</div><div class="center"><a href="/fight/'+fight_id+'"><img src="http://leekwars.com/static/image/icon/garden.png"></a></div><div class="fighter">'+enemy_name+'</div></div></div></div>');
		}

	}

	// Récupération du résultat des combats
	function refreshResults()
	{
		if (!loading)
		{
			var waitlist = [];

			$('#garden-page .fight-wrapper').each(function()
			{
				if ($(this).children('.generating').length)
					waitlist.push($(this).attr('fight'));
			});

			for (var i = 0; i < waitlist.length; i++)
			{
				if (request_counter < 10)
				{
					request_counter++;
					_.get('fight/get/' + waitlist[i], function(data)
					{
						request_counter--;
						if (!loading && data.success && data.fight.status == 1)
						{
							var fight = $('#garden-page .fight-wrapper[fight='+data.fight.id+'] .fight');
							fight.removeClass('generating');
							switch (data.fight.winner)
							{
								case 1:
									fight.addClass('win');
									break;
								case 2:
									fight.addClass('defeat');
									break;
								default:
									fight.addClass('draw');
							}
						}
					});
				}
			}
		}
	}

	setInterval(refreshResults, 2500);

	var fight_history = [];

	function refreshInterface()
	{
		scrollTop_value = $(window).scrollTop();

		localStorage["garden/leek"] = $('#garden-solo .myleek.selected').attr('leek');
		localStorage["garden/compo"] = $('#garden-team .myCompo.selected').attr('id');

		fight_history = [];
		$('#garden-page .fight-history').each(function()
		{
			fight_history.push({
				type : $(this).attr('type'),
				id : $(this).attr('element_id'),
				content : $(this).html()
			});
		});

		LW.loadPage('garden');

	}

	LW.on('pageload', function()
	{
		if (LW.currentPage == "garden")
		{
			for (var i = 0; i < fight_history.length; i++)
			{
				var history = fight_history[i];
				$('#garden-'+history.type).append('<div class="fight-history" type="'+history.type+'" element_id="'+history.id+'"></div>');
				if (!(history.type == "solo" && history.id == localStorage["garden/leek"]) && !(history.type == "farmer") && !(history.type == "team" && history.id == localStorage["garden/compo"]))
					$('#garden-'+history.type+' .fight-history[element_id='+history.id+']').hide();
				$('#garden-'+history.type+' .fight-history[element_id='+history.id+']').html(history.content);
			}

			var intervalRefresh = setInterval(function()
			{
				$(window).scrollTop(scrollTop_value);
				if ($(window).scrollTop() == scrollTop_value)
					clearInterval(intervalRefresh);
			}, 1);

			setTimeout(function()
			{
				clearInterval(intervalRefresh);
			}, 100);

			loading = false;
		}
	});

})();

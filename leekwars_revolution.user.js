// ==UserScript==
// @name			Leek Wars Revolution
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.1
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_revolution.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_revolution.user.js
// @match			http://leekwars.com
// @match			http://leekwars.com/*
// @include        	http://leekwars.com
// @include        	http://leekwars.com/*
// @require 		http://leekwars.com/static/lib/jquery-2.1.1.min.js
// @grant			GM_addStyle
// ==/UserScript==

GM_addStyle('.revolution,.revolution:visited {color:red;font-size:41px;font-weight:bold;}');
GM_addStyle('.revolution div{background:url("http://leekwars.com/static/image/logo.png");width:378px;height:50px;display:inline-block;text-align:center;}');

function revolution() {
	console.log("REVOLUTION !!!");
	var header = $($('a[href="/"]')[0]);
	header.addClass("revolution");
	header.html('<div>---- REVOLUTION ----</div>');
}

revolution();
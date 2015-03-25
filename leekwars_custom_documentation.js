// ==UserScript==
// @name          Leek Wars Editor Custom Documentation
// @namespace     https://github.com/AlucardDH/leekwars
// @version       0.1
// @description   Help you to visualize your own documention in your code
// @author        AlucardDH
// @match         http://leekwars.com/editor
// @require       https://code.jquery.com/jquery-2.1.1.min.js
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_log
// ==/UserScript==

var GM_LEEKWARS_STRORAGE_BASE = "leekwars.doc.";

var LEEKWARS_DOC_START = "/**";
var LEEKWARS_DOC_END = "*/";

var LEEKWARS_KEYWORD_VAR = "var";
var LEEKWARS_KEYWORD_GLOBAL = "global";
var LEEKWARS_KEYWORD_FUNCTION = "function";

var LEEKWARS_FONCTION_CLASS = "cm-function";
var LEEKWARS_VARIABLE_CLASS = "cm-variable";
var LEEKWARS_DECLARATION_CLASS = "-declaration";

var LEEKWARS_AI_NAME = "#ai-name";

var LEEKWARS_DOC_PARAM = "@param";
var LEEKWARS_DOC_RETURN = "@return";
var LEEKWARS_DOC_LEVEL = "@level";

function docToString(doc){
		
// Titre
	var result = "<h3>";
	if(doc.type==LEEKWARS_KEYWORD_FUNCTION) {
		result += "Fonction <b>"+doc.name+"</b>(";
		for(var paramIndex=0;paramIndex<doc.params.length;paramIndex++) {
			if(paramIndex>0) {
				result += ",";
			}
			result += doc.params[paramIndex].name;
		}
		result += ")";
		if(doc.result) {
			result += ":"+doc.result.name;
		}
	} else if(doc.type==LEEKWARS_KEYWORD_VAR) {
		result += "Variable locale <b>"+doc.name+"</b>";
	} else if(doc.type==LEEKWARS_KEYWORD_GLOBAL) {
		result += "Variable globale <b>"+doc.name+"</b>";
	}
	result += "</h3>";
	
// Niveau
	if(doc.level) {
		result += "Niveau "+doc.level;
	}

// Description
	if(doc.description) {
		result += "<br/>"+doc.description+"<br/>";
	}

// Paramètres
	if(doc.params.length>0) {
		result += "<br/><b>Paramètres</b><ul>";
		for(var paramIndex=0;paramIndex<doc.params.length;paramIndex++) {
			var param = doc.params[paramIndex];
			result += "<li>"+param.name;
			if(param.description) {
				result += " : "+param.description;
			}
			result += "</li>";
		}
		result += "</ul>";
	}
	
// Résultat
	if(doc.result) {
		result += "<br/><b>Retour</b><ul>";
		result += "<li>"+doc.result.name;
		if(doc.result.description) {
			result += " : "+doc.result.description;
		}
		result += "</li></ul>";
	}
	
// Source
	result += "<br/>Défini dans l'IA <b>"+doc.ai+"</b> ligne "+doc.line;
	
	return result;
};

function isFunctionDeclaration(line) {
	return line.find("."+LEEKWARS_FONCTION_CLASS+LEEKWARS_DECLARATION_CLASS).length>0;
}

function getFunctionDeclarationName(line) {
	var result = $(line.find("."+LEEKWARS_FONCTION_CLASS)[0]).text();
	if(!result) {
		result = $(line.find("."+LEEKWARS_VARIABLE_CLASS)[0]).text();
	}
	return result;
}

function getFunctionDeclarationParams(line) {
	var paramsElements = $(line.find("."+LEEKWARS_VARIABLE_CLASS+"-2"));
	if(!paramsElements || paramsElements.length==0) {
		return [];
	}
	
	var result = [];
	for(var i=0;i<paramsElements.length;i++) {
		result.push({name:$(paramsElements[i]).text()});
	}
	return result;
}

function isVariableDeclaration(line) {
	return line.find("."+LEEKWARS_VARIABLE_CLASS+LEEKWARS_DECLARATION_CLASS).length>0;
}

function getVariableDeclarationName(line) {
	return line.find("."+LEEKWARS_VARIABLE_CLASS+LEEKWARS_DECLARATION_CLASS).next().text();
}

// Récupération de la doc
function leekWarsUpdateDoc() {
	//GM_log("leekWarsUpdateDoc()");
	var aiName = $(LEEKWARS_AI_NAME).text();
//	GM_log("Updating doc for "+aiName);
	var linesOfCode = $('div.editor').filter(function(){return $(this).css("display")=="block";}).find('.CodeMirror-lines div div div pre');

	var currentDoc = null;
	var endOfDocLine = null;
	
	for(var lineNumber=0;lineNumber<linesOfCode.length;lineNumber++) {
		var displayedLineNumber = lineNumber+1;
		var line = $(linesOfCode[lineNumber]);
		
		var text = line.text();
		console.log(text);
		
		if(text==LEEKWARS_DOC_START) {
			//GM_log("LEEKWARS_DOC_START at line "+displayedLineNumber);
			
			currentDoc = {};
			currentDoc.params = [];
			currentDoc.ai = aiName;
			
		} else if(text==LEEKWARS_DOC_END) {
			endOfDocLine = lineNumber;
			//GM_log("LEEKWARS_DOC_END at line "+displayedLineNumber);			
			
		} else if(isFunctionDeclaration(line)) {
			//console.log("isFunctionDeclaration : "+getFunctionDeclarationName(line));
			// Décalaration d'une fonction
			if(!currentDoc || endOfDocLine!=lineNumber-1) {
				currentDoc = {};
				currentDoc.params = getFunctionDeclarationParams(line);
				currentDoc.ai = aiName;
			}
			
			if(currentDoc.params.length==0) {
				currentDoc.params = getFunctionDeclarationParams(line);
			}
			
			currentDoc.type = LEEKWARS_KEYWORD_FUNCTION;
			currentDoc.name = getFunctionDeclarationName(line);
			currentDoc.line = displayedLineNumber;
			
			GM_setValue(GM_LEEKWARS_STRORAGE_BASE+currentDoc.name,docToString(currentDoc));
			currentDoc = null;
		
		} else if(isVariableDeclaration(line)) {
			//console.log("isVariableDeclaration : "+getVariableDeclarationName(line));
			// Décalaration d'une variable
			if(!currentDoc || endOfDocLine!=lineNumber-1) {
				currentDoc = {};
				currentDoc.params = [];
				currentDoc.ai = aiName;
			}
			
			currentDoc.type = line.find("."+LEEKWARS_VARIABLE_CLASS+LEEKWARS_DECLARATION_CLASS).text();
			currentDoc.name = getVariableDeclarationName(line);
			currentDoc.line = displayedLineNumber;
			
			GM_setValue(GM_LEEKWARS_STRORAGE_BASE+currentDoc.name,docToString(currentDoc));
			currentDoc = null;
		
		} else if(currentDoc) {
			
			var levelIndex = text.indexOf(LEEKWARS_DOC_LEVEL);
			var paramIndex = text.indexOf(LEEKWARS_DOC_PARAM);
			var returnIndex = text.indexOf(LEEKWARS_DOC_RETURN);
			
			if(levelIndex>-1) {
				currentDoc.level = text.substring(levelIndex+LEEKWARS_DOC_LEVEL.length).trim();
				
			} else if(paramIndex>-1) {
				var subText = text.substring(paramIndex+LEEKWARS_DOC_PARAM.length).trim();
				var paramNameEndIndex = subText.indexOf(" ");
				var param = {};
				if(paramNameEndIndex>-1) {
					param.name = subText.substring(0,paramNameEndIndex);
					param.description = subText.substring(paramNameEndIndex).trim();
				} else {
					param.name = subText;
				}
				currentDoc.params.push(param);
				
			} else if(returnIndex>-1) {
				var subText = text.substring(returnIndex+LEEKWARS_DOC_RETURN.length).trim();
				var paramNameEndIndex = subText.indexOf(" ");
				var param = {};
				if(paramNameEndIndex>-1) {
					param.name = subText.substring(0,paramNameEndIndex);
					param.description = subText.substring(paramNameEndIndex).trim();
				} else {
					param.name = subText;
				}
				currentDoc.result = param;
				
			} else {
				if(!currentDoc.description) {
					currentDoc.description = "";
				}
				currentDoc.description += "<br/>"+text.trim();
			}		
			
		}
	}
}

function leekwarsUpdateHintDetails() {
	//GM_log("leekwarsUpdateHintDetails()");
	var dialog = $(".hint-dialog").filter(function(){return $(this).css("display")=="block";});
	if(dialog.length>0) {
		//GM_log("dialog !");
	
		var hints = dialog.children(".hints");
		var details = dialog.children(".details");

		var currentHint = hints.children(".active").text();
		//GM_log("currentHint : "+currentHint);
		var currentDetail = details.children().filter(function(){return $(this).css("display")=="block";});

		var newDetails = GM_getValue(GM_LEEKWARS_STRORAGE_BASE+currentHint);
		if(newDetails) {
			//GM_log("new details : "+newDetails);
			currentDetail.html(newDetails);
		}
	}
}

$(document).ready(function() {
	leekWarsUpdateDoc();
	setInterval(leekWarsUpdateDoc,5000);
	setInterval(leekwarsUpdateHintDetails,200);
});

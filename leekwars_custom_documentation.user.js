// ==UserScript==
// @name			Leek Wars Editor Custom Documentation
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.4
// @description		Help you to visualize your own documention in your code
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.user.js
// @match			http://leekwars.com/editor
// @match			http://leekwars.com/editor/*
// @include        	http://leekwars.com/editor
// @include        	http://leekwars.com/editor/*
// @grant			GM_getValue
// @grant			GM_setValue
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
var LEEKWARS_DOC_OPS = "@ops";

var LEEKWARS_VALUE_REGEX = /.*=(.*);/i;

unsafeWindow.IA_FUNCTIONS = [];
unsafeWindow.DOCUMENTATION = null;

function getDocumentation(name) {
	if(!unsafeWindow.DOCUMENTATION) {
		unsafeWindow.DOCUMENTATION = {};
	}
	if(!unsafeWindow.DOCUMENTATION[name]) {
		var jsonDoc = GM_getValue(GM_LEEKWARS_STRORAGE_BASE+name);
		if(jsonDoc!==null) {
            try {
                unsafeWindow.DOCUMENTATION[name] = JSON.parse(jsonDoc);
            } catch(e) {
                GM_setValue(GM_LEEKWARS_STRORAGE_BASE+name,null);
				unsafeWindow.DOCUMENTATION[name] = null;
            }
			
		}
	}
	return unsafeWindow.DOCUMENTATION[name];
}

function setDocumentation(doc) {
	if(!unsafeWindow.DOCUMENTATION) {
		unsafeWindow.DOCUMENTATION = {};
	}
	unsafeWindow.DOCUMENTATION[doc.name] = doc;
	GM_setValue(GM_LEEKWARS_STRORAGE_BASE+doc.name,JSON.stringify(doc));
}

function docToCompletionName(doc) {
	var result = doc.name;
	if(doc.type==LEEKWARS_KEYWORD_FUNCTION) {
		result += "(";
		for(var paramIndex=0;paramIndex<doc.params.length;paramIndex++) {
			if(paramIndex>0) {
				result += ", ";
			}
			result += doc.params[paramIndex].name;
		}
		result += ")";
		if(doc.result) {
			result += " : "+doc.result.name;
		}
	}
	return result;
}

function docToString(doc){
		
// Titre
	var result = "<h3>";
	if(doc.type==LEEKWARS_KEYWORD_FUNCTION) {
		result += "Fonction <b>"+doc.name+"</b>(";
		for(var paramIndex=0;paramIndex<doc.params.length;paramIndex++) {
			if(paramIndex>0) {
				result += ", ";
			}
			result += doc.params[paramIndex].name;
		}
		result += ")";
		if(doc.result) {
			result += " : "+doc.result.name;
		}
	} else if(doc.type==LEEKWARS_KEYWORD_VAR) {
		result += "Variable locale <b>"+doc.name+"</b>";
	} else if(doc.type==LEEKWARS_KEYWORD_GLOBAL) {
		result += "Variable globale <b>"+doc.name+"</b>";
	}
	result += "</h3>";
	
// Niveau
	if(doc.level) {
		result += "Niveau "+doc.level+"<br/>";
	}
	
// Opérations
	if(doc.ops) {
		var intValue = parseInt(doc.ops);
		if(!isNaN(intValue)) {
			result += "<b>"+intValue+"</b> opérations<br/>";
		} else {
			result += "Opérations <b>"+doc.ops+"</b><br/>";
		}
		
	}
	
// Description
	if(doc.description) {
		result += doc.description+"<br/>";
	}
	
// Valeur initiale
	if(doc.value) {
		result += "<br/><b>Valeur initiale</b><ul><li>"+doc.value+"</li></ul>";
	}

// Paramètres
	if(doc.params.length>0) {
		result += "<br/><b>Param&egrave;tres</b><ul>";
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
	result += "<br/>D&eacute;fini dans l'IA <b>"+doc.ai+"</b> ligne "+doc.line;
	
	return result;
}

function getHintHtml(hint) {
	return '<div class="hint" style="color: red;">'+hint+'</div>';
}

function getDetailHtml(content) {
	return '<div class="detail" style="display: none;"><span style="color:red">Attention, cette fonction est d&eacute;finie plus loin dans le code</span><br/>'+content+'</div>';
}

function docToCompletion(doc) {
	return {name:docToCompletionName(doc),text:doc.name,type:doc.type,detail:docToString(doc),custom:true};
}

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
	if(!paramsElements || paramsElements.length===0) {
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
	var aiName = $(LEEKWARS_AI_NAME).text();
	unsafeWindow.IA_FUNCTIONS = [];
	
	var linesOfCode = $('div.editor').filter(function(){return $(this).css("display")=="block";}).find('.CodeMirror-lines div div div pre');

	var currentDoc = null;
	var endOfDocLine = null;
	
	for(var lineNumber=0;lineNumber<linesOfCode.length;lineNumber++) {
		var displayedLineNumber = lineNumber+1;
		var line = $(linesOfCode[lineNumber]);
		
		var text = line.text();
		
		if(text==LEEKWARS_DOC_START) {
			
			currentDoc = {};
			currentDoc.params = [];
			currentDoc.ai = aiName;
			
		} else if(text==LEEKWARS_DOC_END) {
			endOfDocLine = lineNumber;			
			
		} else if(isFunctionDeclaration(line)) {
			// Décalaration d'une fonction
			if(!currentDoc || endOfDocLine!=lineNumber-1) {
				currentDoc = {};
				currentDoc.params = getFunctionDeclarationParams(line);
				currentDoc.ai = aiName;
			}
			
			if(currentDoc.params.length===0) {
				currentDoc.params = getFunctionDeclarationParams(line);
			}
			
			currentDoc.type = LEEKWARS_KEYWORD_FUNCTION;
			currentDoc.name = getFunctionDeclarationName(line);
			currentDoc.line = displayedLineNumber;
			
			setDocumentation(currentDoc);
			unsafeWindow.IA_FUNCTIONS.push(currentDoc.name);
			currentDoc = null;
		
		} else if(isVariableDeclaration(line)) {
			// Décalaration d'une variable
			if(!currentDoc || endOfDocLine!=lineNumber-1) {
				currentDoc = {};
				currentDoc.params = [];
				currentDoc.ai = aiName;
			}
			
			currentDoc.type = line.find("."+LEEKWARS_VARIABLE_CLASS+LEEKWARS_DECLARATION_CLASS).text();
			if(currentDoc.type==LEEKWARS_KEYWORD_GLOBAL) {
				var testValue = LEEKWARS_VALUE_REGEX.exec(line.text());
				if(testValue[1]) {
					currentDoc.value = testValue[1].trim();
				}
			}
			currentDoc.name = getVariableDeclarationName(line);
			currentDoc.line = displayedLineNumber;
			
			setDocumentation(currentDoc);
			currentDoc = null;
		
		} else if(currentDoc) {
			
			var opsIndex = text.indexOf(LEEKWARS_DOC_OPS);
			var levelIndex = text.indexOf(LEEKWARS_DOC_LEVEL);
			var paramIndex = text.indexOf(LEEKWARS_DOC_PARAM);
			var returnIndex = text.indexOf(LEEKWARS_DOC_RETURN);
			
			if(opsIndex>-1) {
				currentDoc.ops = text.substring(opsIndex+LEEKWARS_DOC_OPS.length).trim();
				
			} else if(levelIndex>-1) {
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

function getCurrentToken() {
	return editors[current].editor.getTokenAt(editors[current].editor.getCursor()).string.trim().toLowerCase();
}

function leekwarsUpdateHintDetails() {

	var dialog = editors[current].hintDialog;
	if(dialog.css("display")=="block") {	
		var start = getCurrentToken();
		
		var alreadyPresentHints = [];
		
		var completions = editors[current].completions;
		
		$.each(completions,function(index,completion) {
			
			alreadyPresentHints.push(completion.text);
			
			if(!completion.custom) {
				var doc = getDocumentation(completion.text);
				if(doc) {

					completions[index] = docToCompletion(doc);

					
					$(editors[current].hintDialog.children(".hints").children()[index]).html(completions[index].name);
					$(editors[current].hintDialog.children(".details").children()[index]).html(completions[index].detail);					
				}
			}
			
		});


		$.each(IA_FUNCTIONS,function(index,hint) {
			if($.inArray(hint,alreadyPresentHints)<0 && hint.toLowerCase().indexOf(start)==0) {
				var doc = getDocumentation(hint);

				var completion = docToCompletion(doc);

				completions.push(completion);
				$(editors[current].hintDialog.children(".hints")).append(getHintHtml(completion.name));
				$(editors[current].hintDialog.children(".details")).append(getDetailHtml(completion.detail));
			}
		});
	}
}

$(document).ready(function() {
	setInterval(leekWarsUpdateDoc,2000);
	setInterval(leekwarsUpdateHintDetails,200);
});

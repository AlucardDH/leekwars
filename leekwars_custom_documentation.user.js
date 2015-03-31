// ==UserScript==
// @name			Leek Wars Editor Custom Documentation
// @namespace		https://github.com/AlucardDH/leekwars
// @version			0.9.3
// @description		Help you to visualize your own documention in your code
// @author			AlucardDH
// @projectPage		https://github.com/AlucardDH/leekwars
// @downloadURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.user.js
// @updateURL		https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.user.js
// @match			http://leekwars.com/editor
// @match			http://leekwars.com/editor/*
// @include        	http://leekwars.com/editor
// @include        	http://leekwars.com/editor/*
// @grant			none
// ==/UserScript==

var LEEKWARS_STRORAGE_BASE = "leekwars.";
var LEEKWARS_STRORAGE_DOC = LEEKWARS_STRORAGE_BASE+"doc.";
var LEEKWARS_STRORAGE_AUTOLOAD = LEEKWARS_STRORAGE_BASE+"autoload";

var LEEKWARS_DOC_START = "/**";
var LEEKWARS_DOC_END = "*/";

var LEEKWARS_KEYWORD_VAR = "var";
var LEEKWARS_KEYWORD_GLOBAL = "global";
var LEEKWARS_KEYWORD_FUNCTION = "function";

var LEEKWARS_FONCTION_CLASS = "cm-function";
var LEEKWARS_COMMENT_CLASS = "cm-comment";
var LEEKWARS_VARIABLE_CLASS = "cm-variable";
var LEEKWARS_DECLARATION_CLASS = "-declaration";

var LEEKWARS_DOC_PARAM = "@param";
var LEEKWARS_DOC_RETURN = "@return";
var LEEKWARS_DOC_LEVEL = "@level";
var LEEKWARS_DOC_OPS = "@ops";

var LEEKWARS_VALUE_REGEX = /.*=(.*);/i;

IA_FUNCTIONS = [];
IA_LOADED = [];
DOCUMENTATION = null;

// Persistance __________________________________________________________________________

function getDocumentation(name) {
	if(!DOCUMENTATION) {
		DOCUMENTATION = {};
	}
	if(!DOCUMENTATION[name]) {
		var jsonDoc = localStorage.getItem(LEEKWARS_STRORAGE_DOC+name);
		if(jsonDoc!==null) {
            try {
                DOCUMENTATION[name] = JSON.parse(jsonDoc);
            } catch(e) {
                localStorage.setItem(LEEKWARS_STRORAGE_DOC+name,null);
				DOCUMENTATION[name] = null;
            }
			
		}
	}
	return DOCUMENTATION[name];
}

function setDocumentation(doc) {
	if(!DOCUMENTATION) {
		DOCUMENTATION = {};
	}
	DOCUMENTATION[doc.name] = doc;
	localStorage.setItem(LEEKWARS_STRORAGE_DOC+doc.name,JSON.stringify(doc));
}

function isAutoloadIncludesEnabled() {
	var value = localStorage.getItem(LEEKWARS_STRORAGE_AUTOLOAD);
	if(value!=null) {
		return eval(value);
	} else {
		return true;
	}
}

function setAutoloadIncludes(enabled) {
	localStorage.setItem(LEEKWARS_STRORAGE_AUTOLOAD,enabled);
}

// Settings

function createSetting() {
	var settings = $("#editor-settings-popup .content");
	settings.append("<br/><br/>");
	var checkbox = $('<input type="checkbox" id="setting-autoload">');
	console.log("Autoload : "+isAutoloadIncludesEnabled());
	if(isAutoloadIncludesEnabled()) {
		checkbox.attr("checked","checked");
	} else {
		checkbox.removeAttr("checked");
	}
	checkbox.change(function() {
		setAutoloadIncludes(this.checked);
	});
	settings.append(checkbox);
	settings.append('<label for="setting-autoload">Chargement automatique des includes (pour l\'autocomplétion et la documentation)</label>');
}

// Formattage _________________________________________________________________________

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
		if(!isNaN(intValue) && intValue+""==doc.ops) {
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

function getHintHtml(hint,warning) {
	return '<div class="hint"'+(warning ? ' style="color: red;"' : '')+'>'+hint+'</div>';
}

function getDetailHtml(content,warning) {
	return '<div class="detail" style="display: none;">'+(warning ? '<span style="color:red">Attention, cette fonction est d&eacute;finie plus loin dans le code</span><br/>' : '')+content+'</div>';
}

function docToCompletion(doc) {
	return {name:docToCompletionName(doc),text:doc.name,type:doc.type,detail:docToString(doc),custom:true};
}

// Parsing ____________________________________________________________________________________________

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

function getEditor(iaId) {
	return editors[iaId ? iaId : current];
}

function getEditorDiv(iaId) {
	return getEditor(iaId).editorDiv;
}

function getIAName(iaId) {
	return getEditor(iaId).name;
}

function getCurrentToken() {
	return getEditor().editor.getTokenAt(getCurrentCursor());
}

function getCurrentCursor() {
	return getEditor().editor.getCursor();
}

function getNextLine() {
	return $(getLines()[getCurrentCursor().line+1]);
}

function getLines(iaId) {
	return getEditorDiv(iaId).find('.CodeMirror-lines div div div pre');
}

function getLine(number) {
	return getLines()[number];
}

function getCompleteIncludeList() {
	var checkedIAs = [];
	var toCheckIAs = [];
	var result = [];
	
	toCheckIAs.push(current);
	
	while(toCheckIAs.length!==0) {
		var iaCheck = toCheckIAs.pop();
		checkedIAs.push(iaCheck);
		var includes = getEditor().includes;
		if(includes) {
			for(var index=0;index<includes.length;index++) {
				var include = includes[index];
				if(result.indexOf(include)<0) {
					result.push(include);
				}
				if(checkedIAs.indexOf(include)<0) {
					toCheckIAs.push(include);
				}
			}
		}
	}

	return result;
}

UPDATING_DOC = false;

// Récupération de la doc
function leekWarsUpdateDoc() {
	if(UPDATING_DOC) {
		return;
	}
	
	UPDATING_DOC = true;
	
	if(isAutoloadIncludesEnabled()) {
		var includes = getCompleteIncludeList();
		reloadMissing(includes);
	}
	
	leekWarsUpdateDocIa(current);
	
	UPDATING_DOC = false;
}

// _______________________________________________________________________________________Récupération de la doc

function getIAList() {
	var result = $("#ai-list").children().map(function(index,e){return parseInt($(e).attr("id"));});
	return result;
}


reloadSource = null;

function reloadMissing(ids) {
	if(!reloadSource) {
		reloadSource = current;
	}

	var somethingMissing = false;
	if(!ids) {
		ids = getIAList();
	}
	for(var index=0;index<ids.length;index++) {
		var id = ids[index];
		var editor = editors[id];
		
		if(!IA_LOADED[id]) {
			current = id;
			editor.load(true);
			if(!editor.loaded || !leekWarsUpdateDocIa(id)) {
				somethingMissing = true;
			} else {
				IA_LOADED[id] = true;
			}
		}
	}
	
	if(somethingMissing) {
		setTimeout(reloadMissing,1000);
	} else {
		current = reloadSource;
		reloadSource = null;
	}
	
}

function checkCurrentIsShown() {
	var div = getEditorDiv();
	if(div.css("display")=="none") {
		getEditor().show();
	}
}

function leekWarsUpdateDocIa(iaId) {
	
	IA_FUNCTIONS[iaId] = [];
	
	var linesOfCode = getLines(iaId);
	if(!linesOfCode || linesOfCode.length===0) {
		return false;
	}

	var aiName = getIAName(iaId);

	var currentDoc = null;
	var endOfDocLine = null;
	
	var isInDoc = false;
	
	for(var lineNumber=0;lineNumber<linesOfCode.length;lineNumber++) {
		try {
			var displayedLineNumber = lineNumber+1;
			var line = $(linesOfCode[lineNumber]);
			
			if(isInDoc) {
				line.find("."+LEEKWARS_COMMENT_CLASS).css("color","#0086BC");
			}
				
			var text = line.text();
			
			if(text==LEEKWARS_DOC_START) {
				isInDoc = true;
				line.find("."+LEEKWARS_COMMENT_CLASS).css("color","#0086BC");
				
				currentDoc = {};
				currentDoc.params = [];
				currentDoc.ai = aiName;
				currentDoc.aiId = iaId;
				
			} else if(text==LEEKWARS_DOC_END) {
				isInDoc = false;
				endOfDocLine = lineNumber;			
				
			} else if(isFunctionDeclaration(line)) {
				// Décalaration d'une fonction
				if(!currentDoc || endOfDocLine!=lineNumber-1) {
					currentDoc = {};
					currentDoc.params = getFunctionDeclarationParams(line);
					currentDoc.ai = aiName;
					currentDoc.aiId = iaId;
				}
				
				if(currentDoc.params.length===0) {
					currentDoc.params = getFunctionDeclarationParams(line);
				}
				
				currentDoc.type = LEEKWARS_KEYWORD_FUNCTION;
				currentDoc.name = getFunctionDeclarationName(line);
				currentDoc.line = displayedLineNumber;
				
				setDocumentation(currentDoc);
				IA_FUNCTIONS[iaId].push(currentDoc.name);
				currentDoc = null;
			
			} else if(isVariableDeclaration(line)) {
				// Décalaration d'une variable
				if(!currentDoc || endOfDocLine!=lineNumber-1) {
					currentDoc = {};
					currentDoc.params = [];
					currentDoc.ai = aiName;
					currentDoc.aiId = iaId;
				}
				
				currentDoc.type = line.find("."+LEEKWARS_VARIABLE_CLASS+LEEKWARS_DECLARATION_CLASS).text();
				if(currentDoc.type==LEEKWARS_KEYWORD_GLOBAL) {
					var testValue = LEEKWARS_VALUE_REGEX.exec(line.text());
					if(testValue && testValue[1]) {
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
		} catch(e) {
			console.error('LeekWars Custom Doc : error while parsing "'+aiName+'" line '+lineNumber);
		}
	}
	
	return true;
}

function leekwarsUpdateHintDetails() {
	
	var dialog = getEditor().hintDialog;
	if(dialog.css("display")=="block") {	
		
		var start = getCurrentToken().string.trim().toLowerCase();
		
		var alreadyPresentHints = [];
		
		var completions = getEditor().completions;

		// Fonctions déjà proposées
		for(var index=0;index<completions.length;index++) {
			var completion = completions[index];

			alreadyPresentHints.push(completion.text);
			if(!completion.custom) {
				var doc = getDocumentation(completion.text);
				if(doc) {
					completions[index] = docToCompletion(doc);
					$(getEditor().hintDialog.children(".hints").children()[index]).html(completions[index].name);
					$(getEditor().hintDialog.children(".details").children()[index]).html(completions[index].detail);					
				}
			}
			
		}

		// Fonctions de cette ia manquante
		if(IA_LOADED[current]) {
			for(var index=0;index<IA_FUNCTIONS[current].length;index++) {
				var hint = IA_FUNCTIONS[current][index];
				if(alreadyPresentHints.indexOf(hint)<0 && hint.toLowerCase().indexOf(start)==0) {
					var doc = getDocumentation(hint);

					var completion = docToCompletion(doc);

					completions.push(completion);
					$(getEditor().hintDialog.children(".hints")).append(getHintHtml(completion.name,true));
					$(getEditor().hintDialog.children(".details")).append(getDetailHtml(completion.detail,true));
				}
			}
		}
	}
	
	leekWarsUpdateToolTips();
}

function showDetailDialog() {
	var elementFunction = $(this);
	var functionName = elementFunction.text();
	var doc = getDocumentation(functionName);
	if(doc!=null) {
		var completion = docToCompletion(doc);
		getEditor().detailDialog.html(completion.detail);
		setTimeout(function(){
			getEditor().detailDialog.css("display","block");
			
			getEditor().detailDialog.css("left",elementFunction.offset().left);
			if(elementFunction.offset().top+16-$(window).scrollTop()+getEditor().detailDialog.outerHeight()>$(window).height()) {
				getEditor().detailDialog.css("top",elementFunction.offset().top-getEditor().detailDialog.outerHeight()-16);
			} else {
				getEditor().detailDialog.css("top",elementFunction.offset().top+16);
			}
		},200);
		
	}
}

function hideDetailDialog() {
	getEditor().detailDialog.css("display","none");
}

function hideHintDialog() {
	getEditor().hintDialog.css("display","none");
}

function leekWarsUpdateToolTips() {
	var els = getEditorDiv().find("."+LEEKWARS_FONCTION_CLASS);
	for(var index=0;index<els.length;index++) {
		var el = $(els[index]);
		var custom = el.attr("custom")=="yes";
		var doc = getDocumentation(el.text());
		if(!custom && doc) {
			el.attr("custom","yes");
			el.on('mouseenter.customDoc',showDetailDialog);
			el.on('mouseleave.customDoc',hideDetailDialog);	
			/*
			el.on('click.customDoc',function(e){
				console.log(e);
				if (e.ctrlKey) {
					console.log("ctrl+click on "+$(e.target).text());
				}
			});	
*/			
		} else if(custom && !doc) {
			el.attr("custom","no");
			el.off('mouseenter.customDoc');
			el.off('mouseleave.customDoc');
			//el.off('click.customDoc');	
		}
	}
	
	els = getEditorDiv().find("."+LEEKWARS_VARIABLE_CLASS);
	for(var index=0;index<els.length;index++) {
		var el = $(els[index]);
		var custom = el.attr("custom")=="yes";
		var doc = getDocumentation(el.text());
		if(!custom && doc) {
			el.attr("custom","yes");
			el.on('mouseenter.customDoc',showDetailDialog);
			el.on('mouseleave.customDoc',hideDetailDialog);		
		} else if(custom && !doc) {
			el.attr("custom","no");
			el.off('mouseenter.customDoc');
			el.off('mouseleave.customDoc');
		}	
	}
}

function moveTooltip() {
	if(getEditor().detailDialog.css("display")=="block") {
		var top = getEditor().detailDialog.offset().top;
		var windowScroll = $(window).scrollTop();
		var height = getEditor().detailDialog.outerHeight();
		if(top-windowScroll+height>$(window).height()) {
			getEditor().detailDialog.css("top",top-height-32);
		}
	}
	if(getEditor().hintDialog.css("display")=="block") {
		var top = getEditor().hintDialog.offset().top;
		var windowScroll = $(window).scrollTop();
		var height = getEditor().hintDialog.outerHeight();
		if(top-windowScroll+height>$(window).height()) {
			getEditor().hintDialog.css("top",top-height-32);
		}
	}
}

function autoDoc() {
	var nextLine = getNextLine();
	
	if(isFunctionDeclaration(nextLine)) {
		var name = getFunctionDeclarationName(nextLine);
		
		var doc = getDocumentation(name);
		
		if(doc) {
			var autoDoc = ["/**","/**\n","","<h3>Documentation</h3><br/>/**<br/>...<br/>*/"];
			autoDoc[2] += "\n@level ";
			autoDoc[2] += "\n@ops variables";
			for(var index in doc.params) {
				autoDoc[2] += "\n@param "+doc.params[index].name+" ";
			}
			autoDoc[2] += "\n@return ";
			autoDoc[2] += "\n*/";
			AUTO_SHORTCUTS[AUTODOC_INDEX] = autoDoc;	
			return;
		}
	
	}
	
	AUTO_SHORTCUTS[AUTODOC_INDEX] = DEFAULT_AUTODOC;
	
	
}

AUTODOC_INDEX = AUTO_SHORTCUTS.length;
DEFAULT_AUTODOC = ["/**","/**\n","\n*/","<h3>Documentation</h3><br/>/**<br/>...<br/>*/"];
AUTO_SHORTCUTS[AUTODOC_INDEX] = DEFAULT_AUTODOC;

$(document).keydown(function(e) {
	if (current == null) {
		return;
	}

	// Ctrl-Shift-G : go to definition
	if (e.shiftKey && e.ctrlKey && e.keyCode == 71) {
		var token = getCurrentToken();
		if(token==null) {
			return;
		}
		var doc = getDocumentation(token.string.trim());
		if(doc==null) {
			return;
		}
		
		hideDetailDialog();
		hideHintDialog();
		
		if(doc.aiId!=current) {
			getEditor(doc.aiId).show();
			current = doc.aiId;
		}
		
		setTimeout(function() {
			var line = getLine(doc.line-1);
			var topLine = getLine(Math.max(0,doc.line-15));
			getEditor().editor.setCursor({"line":doc.line-1,"ch":0});
			var topValue = $(line).offset().top;
			window.scrollTo(0,$(topLine).offset().top);
			window.scrollTo(0,topValue);
			$("#page").scrollTop(topValue);
		},500);
		
	
		e.preventDefault();
	}
});

createSetting();

setInterval(leekWarsUpdateDoc,500);
setInterval(leekwarsUpdateHintDetails,200);
setInterval(moveTooltip,200);
setInterval(autoDoc,100);
setInterval(checkCurrentIsShown,100);

// Add your requirements
var restify = require('restify');
var builder = require('botbuilder');
var Client = require('node-rest-client').Client;

var APP_ID = "7df8fc3b" // "b2a46cbc"
var APP_KEY = "984f6248377fc62d6594737d7dd5f449" //"523be4ddcc20678559583725c947b66c" 

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'fcd9f593-42e9-4e25-a8e0-39da623b7b05',
    appPassword: '1UDd4e7ktNsketpCRtT11Ud'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Initialise client
var client = new Client();

//=========================================================
// Bots Dialogs
//=========================================================

var bot = new builder.UniversalBot(connector);
var I = 1;

bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/getUserDataName');
        }
        else if (!session.userData.sex) {
        	session.beginDialog('/getUserDataSex');
        }
        else if (!session.userData.age) {
        	session.beginDialog('/getUserDataAge');
        }
        else if (!session.userData.status) {
            session.beginDialog('/getSymptoms');
        }
        else {
        	session.userData.status = null;
        	session.send('Thank You!');
        }
    }
]);

bot.dialog('/getUserDataName', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
        console.log("get name");
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset') {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
    	} else {
    		session.userData.name = results.response;
        	console.log("store name");
    	}
        session.beginDialog('/');
    }
]);

bot.dialog('/getUserDataSex', [
    function (session) {
    	var namePrompt = "".concat("Hey ", session.userData.name, "!", " What is your gender?");
        builder.Prompts.text(session, namePrompt);
        console.log("get sex");
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset') {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
    	} else {
    		if(results.response.toLowerCase() == 'm' || results.response.toLowerCase() == 'male') {
    			session.userData.sex = "male";
    			console.log("store sex");
    		}
    		else if(results.response.toLowerCase() == 'f' || results.response.toLowerCase() == 'female') {
        		session.userData.sex = "female";
        		console.log("store sex");
        	} else {
        		session.userData.sex = null;
        		session.beginDialog('/getUserDataSex');
        	}
    	}
        session.beginDialog('/');
    }
]);

bot.dialog('/getUserDataAge', [
    function (session) {
        builder.Prompts.text(session, 'What is your age?');
        console.log("get age");
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset') {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
    	} else {
    		if(isNaN(results.response)) {
    			session.userData.age = null;
        		session.beginDialog('/getUserDataAge');
    		} else {
    			session.userData.age = results.response;	
    		}
        	console.log("store age");
    	}
        session.beginDialog('/');
    }
]);

bot.dialog('/getSymptoms', [
    function (session) {
        builder.Prompts.text(session, 'what symptoms do you have?');
        console.log("get symptoms");
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset' || (!results.response.toLowerCase().includes('nose') && results.response.toLowerCase().includes('no'))) {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
        	session.beginDialog('/');
    	}
        var args = {
    		data: { "text" : results.response },
    		headers: { "Content-Type": "application/json", "App-Id" : APP_ID, "App-Key" : APP_KEY }
		};
		client.post("https://api.infermedica.com/v2/parse", args, function (data, response) {
			console.log(data);
    		if(data.mentions.length < 1) {
    				session.send("Sorry I don't have knowledge about that");
    				session.beginDialog('/getSymptoms');
    		} else {
    			session.userData.evidence = [];
    			for(var i=0; i<data.mentions.length; i++) {
	    			session.userData.evidence.push({ 
	    				"id": data.mentions[i].id,
	    				"choice_id" : data.mentions[i].choice_id
	    			});
    			}
    			console.log("going to further symptoms");
    			session.beginDialog('/getFurtherSymptoms');
    		}
		});
		console.log("symptoms over");
    }
]);

bot.dialog('/getFurtherSymptoms', [
    function (session) {
        builder.Prompts.text(session, 'Do you have any more symptoms?');
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset') {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
        	session.beginDialog('/');
    	}
    	if(!results.response.toLowerCase().includes('nose') && results.response.toLowerCase().includes('no')) {
    		console.log("no in further symptoms");
    		var args = { 
    			data: { "sex": session.userData.sex,
    					"age": session.userData.age,
    					"evidence": session.userData.evidence
    			},
    			headers: { "Content-Type": "application/json", "App-Id" : APP_ID, "App-Key" : APP_KEY }
			};
			console.log(args);
    		client.post("https://api.infermedica.com/v2/diagnosis", args, function (data, response) {
				
				console.log(data);
				console.log(data.question.items);
				console.log(data.question.items[0].choices);
				
				session.userData.questions = data;
				session.beginDialog('/interactLoop');
			});
    	} else {
	        var args = {
	    		data: { "text" : results.response },
	    		headers: { "Content-Type": "application/json", "App-Id" : APP_ID, "App-Key" : APP_KEY }
			};
			client.post("https://api.infermedica.com/v2/parse", args, function (data, response) {
				console.log(data);
	    		if(data.mentions.length < 1) {
	    				session.send("Sorry I don't have knowledge about that");
	    		} else {
	    				for(var i=0; i<data.mentions.length; i++) {
			    			session.userData.evidence.push({ 
			    				"id": data.mentions[i].id,
			    				"choice_id" : data.mentions[i].choice_id
			    			});
    					}
	    		}
	    		session.beginDialog('/getFurtherSymptoms');
			});
		}
    }
]);

bot.dialog('/interactLoop', [
    function (session) {
    	console.log("InteractLoop");
    	var chatprint = "".concat(session.userData.questions.question.text, "\n\r");

    	if(session.userData.questions.question.type == 'single') {
    		chatprint = chatprint.concat("-> Yes\n\r-> No");
		} else if(session.userData.questions.question.type == 'group_single') {
			for(var i=0; i<session.userData.questions.question.items.length; i++) {
				chatprint = chatprint.concat("(", i+1,")-> " ,session.userData.questions.question.items[i].name, "\n\r");
			}
			chatprint = chatprint.concat("(choose only one number)");
		} else {
			for(var i=0; i<session.userData.questions.question.items.length; i++) {
				chatprint = chatprint.concat("(", i+1,")-> " ,session.userData.questions.question.items[i].name, "\n\r");
			}
			chatprint = chatprint.concat("(multiple options with spaces)");
		}
		builder.Prompts.text(session, chatprint);
    },
    function (session, results) {
    	if(results.response.toLowerCase() == '/reset') {
    		session.userData.name = null;
    		session.userData.sex = null;
        	session.userData.age = null;
        	session.userData.status = null;
        	session.beginDialog('/');
    	}
    	var questionResponses = results.response;

    	if(session.userData.questions.question.type == 'single') {
    		if(questionResponses.toLowerCase() == 'yes' || questionResponses.toLowerCase() == '1') {
    			session.userData.evidence.push({'id' : session.userData.questions.question.items[0].id, 'choice_id' : 'present'});
    		} else {
    			session.userData.evidence.push({'id' : session.userData.questions.question.items[0].id, 'choice_id' : 'absent'});
    		}
    	} else if(session.userData.questions.question.type == 'group_single') {
    		for(var i=0; i<session.userData.questions.question.items.length; i++) {
    			if(questionResponses == i+1) {
    				session.userData.evidence.push({'id' : session.userData.questions.question.items[i].id, 'choice_id' : 'present'});
    			} else {
    				session.userData.evidence.push({'id' : session.userData.questions.question.items[i].id, 'choice_id' : 'absent'});
    			}
    		}
    	} else {
    		questionResponses = questionResponses.split(' ');
    		console.log(questionResponses);
    		for(var i=0; i<session.userData.questions.question.items.length; i++) {
    			if(questionResponses.includes("".concat(i+1))) {
    				session.userData.evidence.push({'id' : session.userData.questions.question.items[i].id, 'choice_id' : 'present'});
    			} else {
    				session.userData.evidence.push({'id' : session.userData.questions.question.items[i].id, 'choice_id' : 'absent'});
    			}
    		}
    		console.log(session.userData.evidence);
    	}

    	var args = {
    		data: { "sex": session.userData.sex,
    				"age": session.userData.age,
    				"evidence": session.userData.evidence
    		},
    		headers: { "Content-Type": "application/json", "App-Id" : APP_ID, "App-Key" : APP_KEY }
    	};
    	console.log("######################################");
    	console.log(args);
    	console.log(args.data.evidence);
        client.post("https://api.infermedica.com/v2/diagnosis", args, function (data, response) {
        	console.log(data);
        	console.log(data.question.items);
        	console.log("######################################");
        	console.log(data.extras);
        	console.log("######################################");
        	session.userData.questions = data;
        	if(parseFloat(data.conditions[0].probability) > 0.9 || I>10 ) {
        		data.conditions[0].name.split(' ').join('+')
        		var link = "https://en.wikipedia.org/wiki/Special:Search?search=".concat(data.conditions[0].name.split(' ').join('+'));
        		var chatprint = "Probable Diseases are\n\r".concat(data.conditions[0].name, ' : ', (parseFloat(data.conditions[0].probability)*100).toFixed(2), "%\n\r", link, "\n\r");
        		for(var i=1; i<data.conditions.length && parseFloat(data.conditions[i].probability) > 0.7; i++) {
        				link = "https://en.wikipedia.org/wiki/Special:Search?search=".concat(data.conditions[i].name.split(' ').join('+'));
        				chatprint = chatprint.concat(data.conditions[i].name, ' : ', (parseFloat(data.conditions[i].probability)*100).toFixed(2), "%\n\r", link, "\n\r");
        		}
        		session.send(chatprint);
        		I = 0; 
        		session.userData.status = "done";
        		session.beginDialog('/');
        	} else {
        		I++;
        		session.beginDialog('/interactLoop');
        	}
        });
    }
]);
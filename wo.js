//-------------------------------API lib-------------------------------------------
var WO = function(base, client_id)
{
	var woHost = "https://" + base,
	resourceHost = "https://" + base + "/api/wo/",
	endUserAuthorizationEndpoint = woHost + "/oauth/authorise",
	datastreams = {},
	authURL = endUserAuthorizationEndpoint +
	"?response_type=token" +
	"&client_id=" + client_id +
	"&redirect_uri=" + window.location;
	
	
	
	this.login = function ()
	{
		//var form = document.createElement('form');
		//form.setAttribute('method', 'post');
		//form.setAttribute('action', authURL);
		//form.style.display = 'hidden';
		//document.body.appendChild(form)
		//form.submit();
		location.href=authURL;
	};

	//helper function to extract the Access Token
	var extractToken = function(hash)
	{
		var match = hash.match(/access_token=((%|\w)+)/);
		return !!match && decodeURIComponent(match[1]);
	};

	//public functions

	//query a dataset identified by dataset id
	this.query = function(id, options, callback)
	{
		var token = extractToken(document.location.hash);
		console.log(token);
		var opts;
		if (typeof options == 'string')
                {
                        opts = {query:options};
                }
		else if(typeof options == 'object')
		{
			console.log(options);
			
			// check compulsory fields, e.g. 'query' must exist and be a string
			if (options.query && typeof options.query == 'string')
			{
				opts = options;
			}
		}
		else
		{
			callback("Options error");
		}

		if (token)
		{
			$.ajax(
			{
				type: 'get',
				url: woHost +'/api/wo/'+ id + '/endpoint',
				data: opts,
				headers:
				{
					Authorization: 'Bearer ' + token
				}
			}).done(callback);
			
			//console.log(token);
			//console.log(id);
			//console.log(options);
			//console.log(woHost +'/api/wo/'+ id + '/endpoint');
			
		}
		else
		{
			//TODO return an error code via callback
			//console.log("need to login before making query");
			callback("Not logged in");
			location.href=authURL;
		}
	};
	
	this.listStream = function(id)
	{
		var rtn = [];
		if (id){
			
			if(typeof datastreams[id] != "undefined")
			{
				for (var i=0; i< datastreams[id].length; i++)
				{
					//console.log(datastreams[id][i].nsp);
					rtn.push(datastreams[id][i].nsp);
				}
			}
		}
		else
		{
			for (var key in datastreams)
			{
				if (datastreams.hasOwnProperty(key))
				{
					for (var i=0; i< datastreams[key].length; i++)
					{
						//console.log(datastreams[key][i].nsp);
						rtn.push(datastreams[key][i].nsp);
					}
				}
			}
			
		}
		return rtn;
	}
	
	this.closeStream = function(id,callback)
	{
		if (id)
		{
			dids = Object.keys(datastreams); //dataset ids
			if (dids.indexOf(id) > -1)
			{
				//matches a dataset id. close this dataset.
				for (var i=0; i< datastreams[id].length; i++)
				{
					//close the connection for all streams within this dataset:
					datastreams[id][i].emit('stop');
				}
				delete datastreams[id];
			}
			else
			{
				//try close it as a stream.
				for (var key in datastreams)
				{
					for (var i=0; i< datastreams[key].length; i++)
					{
						//console.log(datastreams[key][i].nsp);
						if (datastreams[key][i].nsp == id)
						{
							//close the connection for this stream
							datastreams[key][i].emit('stop');
							datastreams[key].splice(i,1);
						}
					}
					
				}
				
			}
		}
		else{
			callback("No stream id or dataset id provided, or provided id do not match");
		}
		
		
		
	}
	
	//id: dataset id;
	//options: AMQP exchange name
	//callback(err,data,stream)
	this.openStream = function(id, options, callback)
	{
		var token = extractToken(document.location.hash);
		var opts;
		if (typeof options == 'string')
                {
                        opts = {query:options};
                }
		else if(typeof options == 'object')
		{
			//console.log(options);
			// check compulsory fields, e.g. 'query' must exist and be a string
			if (options.query && typeof options.query == 'string')
			{
				opts = options;
			}
		}
		else
		{
			callback("Options error");
		}

		if (token)
		{
			$.ajax(
			{
				type: 'get',
				url: woHost +'/api/wo/'+ id + '/endpoint',
				data: opts,
				headers:
				{
					Authorization: 'Bearer ' + token
				}
			}).done(function(sid)
				{
					//console.log(callback);
					if (sid){
						//try to get the stream data use socket.io
						var socket = io.connect('https://webobservatory.soton.ac.uk/' + sid);
						//console.log(socket);
						
						socket.on('chunk', function (data) {
						//console.log(data);
						
						//return the data and the stream object
						callback(null,data,socket);
						
						});
						
						//add this stream to datastreams variable
						
						if (typeof datastreams[id] == "undefined")
						{
							
							datastreams[id] = [socket];
							
						}
						else
						{
							
							datastreams[id].push(socket);
						}
						
						
						
					}
				}
				);

			
			//console.log(id);
			//console.log(options);
			//console.log(woHost +'/api/wo/'+ id + '/endpoint');
			
		}
		else
		{
			//TODO return an error code via callback
			//console.log("need to login before making query");
			callback("Not logged in");
			location.href=authURL;
		}
	};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
};

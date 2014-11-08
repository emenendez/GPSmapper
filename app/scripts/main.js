var client = new Dropbox.Client({ key: '9a666eiuctz1yh4' });

var cursorTag = null;

client.authenticate({interactive: false}, function(error, client) {
  if (error) {
    return showError(error);
  }

  if (client.isAuthenticated()) {
  	run(client);
  }
  else {
  	client.authenticate(function(error, client) {
  		if (error) {
  			return showError(error);
  		}
  		run(client);
  	});
  }

});

function pullChanges() {
  client.pullChanges(function(error, changes) {
    if (error) {
      return showError(error);
    }

    cursorTag = changes.cursorTag;

    processChanges(changes.changes);
  });
}


function processChanges(changes) {
  changes.forEach(function(change) {
    if (change.wasRemoved) {
      console.log('Removed: ' + change.path);
    }
    else {
      console.log(change.path);
    }
  });

  if (changes.shouldBackOff) {
    interval = 5000;
  }
  else {
    interval = 0;
  }

  setTimeout(poll, interval);
}

function poll() {
  console.log('Polling for changes...');
  client.pollForChanges(cursorTag, function(error, result) {
    if (error) {
      return showError(error);
    }

    if (result.hasChanges) {
      console.log('Changes detected.');
      pullChanges();
    }
    else {
      console.log('No changes detected.');
      setTimeout(poll, result.retryAfter * 1000);
    }
  });
}

function run(client) {
	console.log('running');

  pullChanges();
}

function showError(error) {
	console.log(error);
}
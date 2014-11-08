var client = new Dropbox.Client({ key: '9a666eiuctz1yh4' });

var cursorTag = null;
var layers = Array();

// Init map
$('#map').height($(window).height());

var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Init Dropbox
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
  client.pullChanges(cursorTag, function(error, changes) {
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
      layers.forEach(function(layer) {
        if (layer.path == change.path) {
          map.removeLayer(layer.layer);
        }
      })
    }
    else {
      console.log(change.path);
      if (change.path.substr(-4) == '.gpx') {
        client.readFile(change.path, function(error, data) {
          if(error) {
            return showError(error);
          }

          layer = omnivore.gpx.parse(data);
          layer.addTo(map);
          map.fitBounds(layer.getBounds());
          layers.push({'layer': layer, 'path': change.path});
        });
      }
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
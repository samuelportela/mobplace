var ListView = function(el) {
	this.el = $(el);
};

ListView.prototype.refreshList = function(items) {
	this.el.html('');
	this.el.hide();
	this.addItems(items);
	this.el.fadeIn('slow');
};

ListView.prototype.addItems = function(items) {
	$.each(items, $.proxy(function(i, item) {
		this.addItem(item);
	}, this));
};

ListView.prototype.addItem = function(item) {
	this.el.append($('<div/>').html('<img src="' + app.getProductDetailByReference(app.getProductDetails(), item.referencia)[0].localPath + '" style="max-width: 200px; max-height: 200px;" />'
		+ '<br />'
		+ item.referencia
		+ '<br />'
		+ item.descricao
		+ '<br />'
		+ 'R$ '
		+ app.formatToCurrency(app.getPriceByReference(app.getPrices(), item.referencia))
	));
}

var app = {
	localDatabase: {},
    DATADIR: null,
    knownFiles: [],
    // Application Constructor
    initialize: function() {
		app.loadLocalDatabase();
        this.bindEvents();
		descriptionsListView = new ListView('.main #descriptions');
		app.populateDescriptionsList(app.getDescriptions());
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
		$('a#sync').on('click', app.sync);
		$('a#clear').on('click', app.clear);
		$('#loginFormSubmitBtn').on('click', app.authenticateUser);
		$('#loginForm').find('#domain').val(JSON.parse(localStorage.getItem('mob_cfg')) ? JSON.parse(localStorage.getItem('mob_cfg')).domain : '');
		$('#loginForm').find('#email').val(JSON.parse(localStorage.getItem('mob_cfg')) ? JSON.parse(localStorage.getItem('mob_cfg')).email : '');
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        // Note: The file system has been prefixed as of Google Chrome 12:
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, app.onFSSuccess, null);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
    },
    //Loaded my file system, now let's get a directory entry for where I'll store my crap
    onFSSuccess: function(fileSystem) {
        fileSystem.root.getDirectory('br.com.mobplace', {create:true}, app.gotDir, app.onError);
    },
    //The directory entry callback
    gotDir: function(d) {
        app.DATADIR = d;
        var reader = app.DATADIR.createReader();
        reader.readEntries(function(d) {
            app.gotFiles(d);
        }, app.onError);
    },
    //Result of reading my directory
    gotFiles: function(entries) {
        for (var i = 0; i < entries.length; i++) {
            app.knownFiles.push(entries[i].name);
        }
    },
    onError: function(e) {
        console.log('An error occurred: ' + JSON.stringify(e));
    },
    populateDescriptionsList: function(descriptions) {
        descriptionsListView.refreshList(descriptions);
    },
    storeDataInLocalStorage: function(data) {
		localStorage.setItem('mob_db', JSON.stringify(data));
		app.loadLocalDatabase();
    },
    resetLocalStorage: function() {
        localStorage.setItem('mob_db', JSON.stringify({}));
		app.knownFiles = [];
		app.loadLocalDatabase();
    },
    loadLocalDatabase: function() {
		app.localDatabase = app.getDataFromLocalStorage();
    },
    getDataFromLocalStorage: function() {
        return JSON.parse(localStorage.getItem('mob_db')) || {};
    },
    getDescriptions: function() {
        return app.localDatabase.descriptions || [];
    },
    getPrices: function() {
        return app.localDatabase.prices || [];
    },
    getPriceByReference: function(prices, reference) {
		return $.grep(prices, function(item) {
		    return item.descr == reference;
		})[0].preco;
    },
    getProductDetails: function() {
        return app.localDatabase.product_details || [];
    },
    getProductDetailByReference: function(productDetails, reference) {
		return $.grep(productDetails, function(item) {
		    return item.referencia == reference;
		});
    },
	formatToCurrency: function(floatOrString) {
		floatOrString = parseFloat(floatOrString);
		floatOrString = floatOrString.toFixed(2);
	    floatOrString += '';
	    x = floatOrString.split('.');
	    x1 = x[0];
	    x2 = x.length > 1 ? ',' + x[1] : '';
	    var rgx = /(\d+)(\d{3})/;
		
	    while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + '.' + '$2');
	    }
		
	    return x1 + x2;
	},
	sync: function() {
		app.closeMenu();
		setTimeout(function(){$('#popupLogin').popup('open', {transition: 'pop'});}, 1000);
	},
	clear: function() {
		app.closeMenu();
		app.resetLocalStorage();
		app.populateDescriptionsList(app.getDescriptions());
		app.deleteFiles();
	},
	closeMenu: function() {
		$('#popupMenu').popup('close');
	},
	deleteFiles: function() {
        var reader = app.DATADIR.createReader();
        reader.readEntries(function(files) {
            app.removeFiles(files);
        }, app.onError);
	},
	removeFiles: function(entries) {
        for (var i = 0; i < entries.length; i++) {
			//Check if is the last file to be removed
			if (i == entries.length - 1) {
				app.DATADIR.getFile(entries[i].name, {create: false, exclusive: false}, app.removeLastFile, app.onError);
			} else {
				app.DATADIR.getFile(entries[i].name, {create: false, exclusive: false}, app.removeFile, app.onError);
			}
        }
	},
	removeLastFile: function(fileEntry) {
		fileEntry.remove(app.clearSuccess, app.onError);
	},
	removeFile: function(fileEntry) {
		fileEntry.remove();
	},
	clearSuccess: function() {
		setTimeout(function(){$('#popupClearSuccess').popup('open', {transition: 'pop'});}, 1000);
	},
	authenticateUser: function(event) {
		var domain = $('#loginForm').find('#domain').val();
		var email = $('#loginForm').find('#email').val();
		var password = $('#loginForm').find('#password').val();
		localStorage.setItem('mob_cfg', JSON.stringify({domain: domain, email: email}));
		$('#loginForm').find('#password').val('');
		$('#popupLogin').popup('close');
		var httpDomain = 'http://' + domain;
		var url = httpDomain  + '/remote_api/list_products.json';
		$.post(url, {'user[email]':email, 'user[password]':password}).done(function(data) {
			app.storeDataInLocalStorage(data);
			
			//Creating another array with the same references of ProductDetails
			var productDetailsClone = app.getProductDetails().slice(0);
			
			app.downloadImages(productDetailsClone, httpDomain);
		}).fail(app.showPopupError);
	},
	downloadImages: function(productDetailsClone, httpDomain) {
		if (productDetailsClone.length > 0) {
			var pdClone = productDetailsClone.shift();
			pdClone.url = encodeURI(httpDomain + pdClone.url);
			pdClone['localPath'] = app.DATADIR.toURL() + '/' + pdClone.photo_file_name;
			if (app.knownFiles.indexOf(pdClone.photo_file_name) == -1) {
				app.knownFiles.push(pdClone.photo_file_name);
				var ft = new FileTransfer();
				ft.download(pdClone.url, app.DATADIR.toURL() + '/' + pdClone.photo_file_name, function(e) {
					app.downloadImages(productDetailsClone, httpDomain);
				}, app.onError);
			} else {
				app.downloadImages(productDetailsClone, httpDomain);
			}
		} else {
			app.storeDataInLocalStorage(app.localDatabase);
			app.populateDescriptionsList(app.getDescriptions());
		}
	},
	showPopupError: function() {
		setTimeout(function(){$('#popupError').popup('open', {transition: 'pop'});}, 1000);
	}
};

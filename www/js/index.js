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
	var imgSrc = app.getProductDetailByReference(app.getProductDetails(), item.referencia)[0].localPath;
	
	this.el.append($('<div/>').html('<a href="#popupImage' + item.referencia + '" data-rel="popup" data-position-to="window" data-transition="fade"><img src="' + imgSrc + '" style="max-width: 250px; max-height: 250px;" /></a><div data-role="popup" id="popupImage' + item.referencia + '" class="photopopup" data-overlay-theme="a" data-corners="false" data-tolerance="30,15"><a href="#" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right">Fechar</a><img src="' + imgSrc + '"></div>'
		+ '<br />'
		+ '<div class="caption"><p>'
		+ '<span class="description">' + item.descricao + '</span><br />'
		+ '<span class="reference">Referência: '+ item.referencia + '</span><br />'
		+ '<span class="price">R$ ' + app.formatToCurrency(app.getPriceByReference(app.getPrices(), item.referencia)) + '</span>'
		+ '</p></div>'
	));
	
	$('#popupImage' + item.referencia).popup();
	$('#popupImage' + item.referencia).on({
		popupbeforeposition: function() {
			var maxHeight = $(window).height() - 60 + 'px';
			$('.photopopup img').css('max-height', maxHeight );
		}
	});
}

var app = {
	localDatabase: {},
    DATADIR: null,
    knownFiles: [],
	isLoading: false,
	isRemoving: false,
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
		$('a#exit').on('click', app.exit);
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
		if (descriptions.length > 0) {
			descriptionsListView.refreshList(descriptions);
		} else {
			$('#descriptions').html('<strong>Seja bem vindo ao MobPlace!</strong><br />Para baixar do site os últimos produtos disponíveis, acesso a opção "Baixar novos produtos" do Menu.');
		}
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
		navigator.notification.confirm(
			'Deseja excluir todos os produtos do dispositivo?',
			function(button) {
				if (button == 2) {
					app.closeMenu();
					if (app.isRemoving == false) {
						$('[data-role="page"]').addClass('ui-disabled');
						$.mobile.loading('show', {
							text: 'Excluindo',
							textVisible: true,
							theme: 'b',
							textonly: false,
							html: ''
						});
						app.isRemoving = true;
					}
					app.resetLocalStorage();
					app.populateDescriptionsList(app.getDescriptions());
					app.deleteFiles();
				} else {
					app.closeMenu();
				}
			},
			'Sair',
			'Não,Sim'
		);
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
		if (entries.length == 0) {
			$.mobile.loading('hide');
			$('[data-role="page"]').removeClass('ui-disabled');
			app.isRemoving = false;
		} else {
	        for (var i = 0; i < entries.length; i++) {
				//Check if is the last file to be removed
				if (i == entries.length - 1) {
					app.DATADIR.getFile(entries[i].name, {create: false, exclusive: false}, app.removeLastFile, app.onError);
				} else {
					app.DATADIR.getFile(entries[i].name, {create: false, exclusive: false}, app.removeFile, app.onError);
				}
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
		$.mobile.loading('hide');
		$('[data-role="page"]').removeClass('ui-disabled');
		app.isRemoving = false;
	},
	exit: function() {
		navigator.notification.confirm(
			'Deseja sair do aplicativo?',
			function(button) {
				if (button == 2) {
					navigator.app.exitApp();
				} else {
					app.closeMenu();
				}
			},
			'Sair',
			'Não,Sim'
		);
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
			if (app.isLoading == false) {
				$('[data-role="page"]').addClass('ui-disabled');
				$.mobile.loading('show', {
					text: 'Carregando',
					textVisible: true,
					theme: 'b',
					textonly: false,
					html: ''
				});
				app.isLoading = true;
			}
			
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
			pdClone['localPath'] = app.DATADIR.toURL() + '/' + pdClone.id + '_' + pdClone.photo_file_name;
			if (app.knownFiles.indexOf(pdClone.id + '_' + pdClone.photo_file_name) == -1) {
				var totalImages = app.getProductDetails().length;
				var totalImagesToDownload = totalImages - app.knownFiles.length;
				app.updateLoadingText(totalImagesToDownload);
				app.knownFiles.push(pdClone.id + '_' + pdClone.photo_file_name);
				var ft = new FileTransfer();
				ft.download(pdClone.url, app.DATADIR.toURL() + '/' + pdClone.id + '_' + pdClone.photo_file_name, function(e) {
					app.downloadImages(productDetailsClone, httpDomain);
				}, app.onError);
			} else {
				app.downloadImages(productDetailsClone, httpDomain);
			}
		} else {
			app.storeDataInLocalStorage(app.localDatabase);
			app.populateDescriptionsList(app.getDescriptions());
			$.mobile.loading('hide');
			$('[data-role="page"]').removeClass('ui-disabled');
			app.isLoading = false;
		}
	},
	updateLoadingText: function(totalImagesToDownload) {
		$.mobile.loading('show', {
			text: 'Restando ' + totalImagesToDownload + ' fotos.',
			textVisible: true,
			theme: 'b',
			textonly: false,
			html: ''
		});
	},
	showPopupError: function() {
		setTimeout(function(){$('#popupError').popup('open', {transition: 'pop'});}, 1000);
	}
};

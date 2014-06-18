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
	this.el.append($('<div/>').html(item.referencia
		+ '<br />'
		+ item.descricao
		+ '<br />'
		+ 'R$ '
		+ app.formatToCurrency(app.getPriceByReference(app.getPrices(), item.referencia))
	));
}

var app = {
    // Application Constructor
    initialize: function() {
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
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
    },
    populateDescriptionsList: function(descriptions) {
		descriptionsListView.refreshList(descriptions);
    },
    getDataFromLocalStorage: function() {
        return JSON.parse(localStorage.getItem('mob_db')) || {};
    },
    getDescriptions: function() {
        return app.getDataFromLocalStorage().descriptions || [];
    },
    getPrices: function() {
        return app.getDataFromLocalStorage().prices || [];
    },
    getPriceByReference: function(prices, reference) {
		return $.grep(prices, function(item) {
		    return item.descr == reference;
		})[0].preco;
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
		setTimeout(function(){$('#popupLogin').popup('open', {transition: 'pop'});}, 500);
    },
    storeDataInLocalStorage: function(data) {
		localStorage.setItem('mob_db', JSON.stringify(data));
    },
    clear: function() {
		app.closeMenu();
		app.resetLocalStorage();
		app.populateDescriptionsList(app.getDescriptions());
    },
    resetLocalStorage: function() {
        localStorage.setItem('mob_db', JSON.stringify({}));
    },
    closeMenu: function() {
        $('#popupMenu').popup('close');
    },
    authenticateUser: function(event) {
		var domain = $('#loginForm').find('#domain').val();
		var email = $('#loginForm').find('#email').val();
		var password = $('#loginForm').find('#password').val();
		localStorage.setItem('mob_cfg', JSON.stringify({domain: domain, email: email}));
		$('#loginForm').find('#password').val('');
		$('#popupLogin').popup('close');
		var url = 'http://' + domain  + '/remote_api/list_products.json';
		$.post(url, {'user[email]':email, 'user[password]':password}).done(function(data) {
			app.storeDataInLocalStorage(data);
			app.populateDescriptionsList(app.getDescriptions());
		}).fail(function() {setTimeout(function(){$('#popupError').popup('open', {transition: 'pop'});}, 500);});
    }
};

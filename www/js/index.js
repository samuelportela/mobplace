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
	this.el.append($('<li/>').html(item.title));
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
		descriptionsListView = new ListView('.main ul');
		app.populateDescriptionsList(app.getDescriptionsFromLocalStorage());
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
    getDescriptionsFromLocalStorage: function() {
        return JSON.parse(localStorage.getItem('mob_db')) || {};
    },
    sync: function() {
		app.closeMenu();
		setTimeout(function(){$('#popupLogin').popup('open', {transition: 'pop'});}, 500);
    },
    storeDescriptionsInLocalStorage: function(descriptions) {
		localStorage.setItem('mob_db', JSON.stringify(descriptions));
    },
    clear: function() {
		app.closeMenu();
		app.resetLocalStorage();
		app.populateDescriptionsList(app.getDescriptionsFromLocalStorage());
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
		$.post(url, {'user[email]':email, 'user[password]':password}).done(function(descriptions) {
			app.storeDescriptionsInLocalStorage(descriptions);
			app.populateDescriptionsList(descriptions);
		}).fail(function() {setTimeout(function(){$('#popupError').popup('open', {transition: 'pop'});}, 500);});
    }
};

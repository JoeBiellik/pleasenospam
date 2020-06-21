/* eslint-env browser */
/* global $ Handlebars moment ClipboardJS Favico */

$(function() {
	window.isSecureContext && Notification.requestPermission();

	var emails = new Controller({
		elements: {
			table: $('table.table'),
			empty: $('div.jumbotron'),
			spinner: $('div.spinner'),
			error: $('div.alert.alert-danger'),
			address: $('input#address'),
			domain: $('button#domain')
		}
	});

	$('.dropdown-menu a').on('click', function(e) {
		e.preventDefault();

		var item = $(this);
		var items = item.parent().find('a');
		var button = $('button#domain');

		items.removeClass('disabled');
		item.addClass('disabled');
		button.text(item.text());
	});

	$('input#address').on('keypress', function(e) {
		if (e.which == 13) {
			e.preventDefault();

			$('form').find(':submit').click();

			$(this).focus();
		}
	});

	$('form').on('submit', emails.onSubmit.bind(emails));
	$('button#test').on('click', emails.onTestClick.bind(emails));
	$(window).on('hashchange', emails.onHashChange.bind(emails));

	$(window).trigger('hashchange');

	$('table tbody').on('click', 'tr.header', function(e) {
		if ($(e.target).prop('tagName') != 'TD') return;

		var header = $(this);
		var id = header.data('id');
		var body = header.next('tr.body');
		var container = body.find('td');
		var iframe = container.find('iframe');

		if (body.hasClass('hidden') && !iframe.attr('src')) {
			iframe.off('load').on('load', function() {
				$(this).height($(this).contents().find('html').outerHeight(true));
			});

			iframe.attr('src', '/' + id + '.html');
		}

		header.removeClass('table-info');
		header.toggleClass('table-active');
		body.toggleClass('hidden');
	});

	$('#delete-modal').on('show.bs.modal', function(e) {
		var id = $(e.relatedTarget).data('id');
		$(this).find('button.btn-danger').data('id', id);
	});

	$('#delete-modal button.btn-danger').on('click', function(e) {
		var id = $(e.target).data('id');
		emails.delete(id);
	});
});

function Controller(opts) {
	this.opts = opts || {elements: {}};

	this.elements = this.opts.elements;

	this.sse = null;

	Handlebars.registerHelper('mailto', function(email) {
		var address = Handlebars.escapeExpression(email.address);
		var name = Handlebars.escapeExpression(email.name) || null;

		return new Handlebars.SafeString('<a href="mailto:' + address + '" target="_blank">' + (name ? name + ' <small>&lt;' + address + '&gt;</small>' : address) + '</a>');
	});

	Handlebars.registerHelper('mailtolink', function(email, subject = '') {
		var address = Handlebars.escapeExpression(email.address);
		var name = Handlebars.escapeExpression(email.name) || null;
		subject = Handlebars.escapeExpression(subject);

		return new Handlebars.SafeString('mailto:' + (name ? name + ' &lt;' + address + '&gt;' : address) + '?subject=' + subject);
	});

	Handlebars.registerHelper('timestamp', function(timestamp) {
		timestamp = Handlebars.escapeExpression(timestamp);
		var date = moment(timestamp).format('Do MMMM YYYY, h:mm:ssa');

		return new Handlebars.SafeString('<time datetime="' + timestamp + '" data-livestamp="' + timestamp + '" title="' + date + '"></time>');
	});

	Handlebars.registerHelper('default', function(a, b) { return a ? a : b; });

	this.template = Handlebars.compile($('script#email-template').html());

	this.loading = false;
	this.currentAddress = null;

	this.favicon = new Favico({
		animation: 'none'
	});

	$('[data-toggle="tooltip"]').tooltip();

	var self = this;

	this.clipboard = new ClipboardJS('#clipboard', {
		text: function() {
			return self.elements.address.val() + '@' + self.elements.domain.text();
		}
	});

	this.clipboard.on('success', function(e) {
		var target = $(e.trigger);

		target.tooltip('show');

		setTimeout(function() {
			target.tooltip('hide');
		}, 3000);
	});

	// Home page
	if (this.getHash() == '') {
		// Use default email address
		window.location.hash = $('main').data('default');
	}
}

Controller.prototype = {
	load: function(emailAddress) {
		this.clear();
		this.unsubscribe();

		this.elements.table.addClass('hidden');
		this.elements.empty.addClass('hidden');
		this.elements.spinner.removeClass('hidden');

		this.currentAddress = emailAddress;

		var self = this;

		$.get('/' + emailAddress + '.json', function(data) {
			self.subscribe(emailAddress);

			if (data.length) {
				self.favicon.badge(data.length);

				data.forEach(function(email) {
					self.update(email);
				});
			} else {
				self.clear();
			}
		}).fail(function() {
			self.elements.error.removeClass('hidden');
			self.elements.table.addClass('hidden');
			self.elements.empty.addClass('hidden');
			self.elements.spinner.addClass('hidden');
		});
	},
	update: function(email) {
		var element = $(this.template(email));

		$('tbody', this.elements.table).prepend(element);

		this.favicon.badge($('tbody tr.body', this.elements.table).length);

		$('td header', element).on('click', ' a.view-toggle', function(e) {
			e.preventDefault();

			$('iframe', element).attr('src', $(this).attr('href'));

			$('td header a.view-toggle', element).removeClass('hidden');
			$(this).addClass('hidden');

			$('td header a#download', element).attr('href', $(this).attr('href') + '?download');
		});

		this.elements.table.removeClass('hidden');
		this.elements.empty.addClass('hidden');
		this.elements.spinner.addClass('hidden');
	},
	delete: function(id) {
		$.ajax({
			url: '/' + id,
			type: 'DELETE'
		});

		$('tbody tr[data-id="' + id + '"]', this.elements.table).remove();
		this.favicon.badge($('tbody tr.body', this.elements.table).length);

		if (!$('tbody tr', this.elements.table).length) {
			this.clear();
		}
	},
	clear: function() {
		$('tbody', this.elements.table).empty();

		this.favicon.reset();

		this.elements.table.addClass('hidden');
		this.elements.empty.removeClass('hidden');
		this.elements.spinner.addClass('hidden');
	},
	subscribe: function(emailAddress) {
		this.sse = new EventSource('/' + emailAddress + '.feed');

		var self = this;

		this.sse.addEventListener('message', function(e) {
			var message = JSON.parse(e.data);

			self.notification(message.from[0].name || message.from[0].address || 'Unknown', message.subject);
			self.update(message);
		}, false);
	},
	unsubscribe: function() {
		if (this.sse) {
			this.sse.close();
			this.sse = null;
		}
	},
	getHash: function() {
		return window.location.hash.substring(1);
	},
	notification: function(from, subject) {
		new Notification('New Email from ' + from, {
			body: subject,
			icon: '/icon.png'
		});
	},
	onSubmit: function(e) {
		e.preventDefault();

		this.loading = true;

		this.elements.error.addClass('hidden');

		var address = this.elements.address.val();
		var domain = this.elements.domain.text();
		var email = address + '@' + domain;

		if (this.getHash() != email) {
			window.location.hash = email;
		} else {
			this.load(email);
		}

		this.loading = false;
	},
	onTestClick: function(e) {
		e.preventDefault();

		var address = this.elements.address.val();
		var domain = this.elements.domain.text();
		var email = address + '@' + domain;

		$.post('/' + email);
	},
	onHashChange: function() {
		var hash = this.getHash();

		if (!hash.length) return;
		if (this.loading) return;

		this.clear();
		this.unsubscribe();

		this.elements.empty.addClass('hidden');
		this.elements.spinner.removeClass('hidden');

		if (hash != this.currentAddress) {
			var parts = hash.split('@');

			var domains = $('.dropdown-menu a').map(function() {
				return $(this).text();
			});

			if (parts.length == 1) {
				window.location.hash = hash + '@' + domains[0];
				return;
			}

			if (parts.length != 2) {
				this.elements.spinner.addClass('hidden');
				this.elements.error.removeClass('hidden');
				return;
			}

			var address = parts[0];
			var domain = parts[1];

			if ($.inArray(domain, domains) === -1) {
				window.location.hash = address + '@' + domains[0];
				return;
			}

			this.elements.address.val(address);
			this.elements.domain.text(domain);

			$('.dropdown-menu a:contains(' + domain + ')').trigger('click');

			$('form').trigger('submit');
		}
	}
};

/* eslint-env browser */
/* global $ Handlebars */

$(function() {
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

	$('form').on('submit', emails.onSubmit.bind(emails));
	$('button.btn-outline-primary').on('click', emails.onTestClick.bind(emails));
	$(window).on('hashchange', emails.onHashChange.bind(emails));

	$(window).trigger('hashchange');

	$('.dropdown-menu a').click(function(e) {
		e.preventDefault();

		var item = $(this);
		var items = item.parent().find('a');
		var button = $('button#domain');

		items.removeClass('disabled');
		item.addClass('disabled');
		button.text(item.text());
	});

	$('input#address').keypress(function(e) {
		if (e.which == 13) {
			e.preventDefault();

			$('form').find(':submit').click();

			$(this).focus();
		}
	});

	$('table tbody').on('click', 'tr.header', function(e) {
		if ($(e.target).prop('tagName') != 'TD') return;

		var header = $(this);
		var id = header.data('id');
		var body = header.next('tr.body');
		var container = body.find('td');
		var iframe = container.find('iframe');

		if (body.hasClass('hidden') && !iframe.attr('src')) {
			iframe.off('load').on('load', function() {
				$(this).height(0); // Needed or the iframe won't shrink

				$(this).height($(this).contents().outerHeight());

				// Allow for scrollbar if visible
				if ((window.innerWidth - $(window).width()) > 0) {
					$(this).height($(this).height() + (window.innerWidth - $(window).width()));
				}
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

	$('#delete-modal button.btn-danger').click(function(e) {
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

		return new Handlebars.SafeString('<a href="mailto:' + address + '" target="_blank">' + (name ? name + ' &lt;' + address + '&gt;' : address) + '</a>');
	});

	Handlebars.registerHelper('mailtolink', function(email, subject = '') {
		var address = Handlebars.escapeExpression(email.address);
		var name = Handlebars.escapeExpression(email.name) || null;
		var subject = Handlebars.escapeExpression(subject);

		return new Handlebars.SafeString('mailto:' + (name ? name + ' &lt;' + address + '&gt;' : address) + '?subject=' + subject);
	});

	Handlebars.registerHelper('timestamp', function(timestamp) {
		timestamp = Handlebars.escapeExpression(timestamp);
		var date = new Date(timestamp).toLocaleString(); // TODO: Moment.js format

		return new Handlebars.SafeString('<time datetime="' + timestamp + '" data-livestamp="' + timestamp + '" title="' + date + '"></time>');
	});

	Handlebars.registerHelper('default', function (a, b) { return a ? a : b; });

	this.template = Handlebars.compile($('script#email-template').html());

	this.loading = false;
	this.currentAddress = null;

	if (this.getHash() == '') {
		this.elements.spinner.addClass('hidden');

		// Home page
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

		$('td header', element).on('click', ' a.view-toggle', function(e) {
			e.preventDefault();

			$('iframe', element).attr('src', $(this).attr('href'));

			$('td header a.view-toggle', element).removeClass('hidden');
			$(this).addClass('hidden');
		})
		
		this.elements.table.removeClass('hidden');
		this.elements.empty.addClass('hidden');
		this.elements.spinner.addClass('hidden');
	},
	delete: function(id) {
		$('tr[data-id="' + id + '"]', this.elements.table).remove();

		$.ajax({
			url: '/' + id,
			type: 'DELETE'
		});
	},
	clear: function() {
		this.currentAddress = null;

		$('tbody', this.elements.table).empty();

		this.elements.table.addClass('hidden');
		this.elements.empty.removeClass('hidden');
		this.elements.spinner.addClass('hidden');
	},
	subscribe: function(emailAddress) {
		this.sse = new EventSource('/' + emailAddress + '/updates');

		var self = this;

		this.sse.addEventListener('message', function(e) {
			self.update(JSON.parse(e.data));
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

		$.get('/' + email + '/test');
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

			$('form').trigger('submit');
		}
	}
};

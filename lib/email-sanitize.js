const htmlToText = require('html-to-text');
const inlineCss = require('inline-css');
const overwrite = require('overwrite').default;

// Really hacky way of exposing Caja HTML rules
// Line 1098 as of sanitizer@0.1.3
const sanitizer = overwrite('sanitizer', {
	'sanitizer.js': contents => {
		let lines = contents.split('\n');
		lines.splice(1098, 0, 'Sanitizer.html4 = html4;')
		return lines.join('\n');
	}
});

// Allow inline style attributes
sanitizer.html4.ATTRIBS['*::style'] = 0;

function sanitize(rawText, rawHtml, subject, callback, log = false) {
	let text = rawText || '';

	// Generate plain text message if needed
	if (!rawText && rawHtml) {
		text = htmlToText.fromString(rawHtml, {
			wordwrap: 120
		});
	}

	if (rawHtml) {
		rawHtml = text.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}

	// Inline CSS <style> tags
	inlineCss(rawHtml, {url: 'file://'}).then((inlineHtml) => {
		// Sanitize the HTML message with Caja
		let html = sanitizer.sanitize(inlineHtml, url => {
			if (/^https?/.test(url.getScheme())) return url.toString();
			if (/^mailto?/.test(url.getScheme())) return url.toString();
			if (url.getScheme() == 'data' && /^image/.test(url.getPath())) return url.toString();
		}, tokens => tokens, log ? msg => console.log(msg) : null).trim();

		// Construct valid HTML document
		html = `
		<!doctype html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width">
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<title>${subject}</title>
				<base target="_blank">
				<style>
					body { margin: 0; padding: 0; }
				</style>
			</head>
			<body>
				${html}
			</body>
		</html>`;

		callback(text.trim(), html.trim());
	});
}

module.exports = sanitize;

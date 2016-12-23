
// Register partial to be used with this template.
Template7.registerPartial(
    'comments', 
    '<ul>' + 
        '{{#each comments}}' +
            '<li>' +
            '<h2>{{author}}</h2>' +
            '<p>{{text}}</p>' +
            '{{#if comments}}{{> "comments"}}{{/if}}' +
            '</li>' +
        '{{/each}}' +
    '</ul>'
);
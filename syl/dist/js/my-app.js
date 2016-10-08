// Initialize your app
var myApp = new Framework7();

Parse.initialize('RXtuddMFmzKl4Z1VL98OxKUKmRyWxczNEO1XXg3Z', 'ne1XrN3l6x13UQ4itiZ3TQ9snZJcOV2zmW2EuoVp'); 
Parse.serverURL = 'https://parseapi.back4app.com/';

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// Callbacks to run specific code for specific pages, for example for About page:
myApp.onPageInit('about', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});

// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
	return;
}

$$('#signInButton').on('click', function () {
        myApp.showPreloader();
        Parse.User.logIn(document.querySelector('#username').value, document.querySelector('#password').value, {
            success: function(user) {
                document.querySelector('#username').value = '';
                document.querySelector('#password').value = '';
                myApp.closeModal();
            }.bind(this),
            error: function(user, error) {
                alert('fail whale');
            }
        });
});

$$('#signUpButton').on('click', function () {
        myApp.showPreloader();
        Parse.User.signUp(document.querySelector('#username').value, document.querySelector('#password').value,  { ACL: new Parse.ACL() }, {
            success: function(user) {
                document.querySelector('#username').value = '';
                document.querySelector('#password').value = '';
                myApp.closeModal();
            }.bind(this),
            error: function(user, error) {
                alert('fail whale');
            }.bind(this)
        });

});

$$('#logoutButton').on('click', function() {
    myApp.showPreloader();
    Parse.User.logOut().then(function(){
        myApp.closeModal();
        myApp.loginScreen();
        myApp.closePanel();
    }.bind(this));
});

if (Parse.User.current()) {
    // get some stuff for user
} else {
    myApp.loginScreen();
}
/*
 *    Copyright 2012 Sebastien Maccagnoni-Munch
 *
 *    This file is part of OSPFM-web.
 *
 *    OSPFM-web is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as published
 *    by the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    OSPFM-web is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with OSPFM-web.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * authenticates the user
 *
 * @param Function function to execute when the user is authenticated
 * @param Array arguments to the function to execute
 */

Authentication = new Class({
    prebind: ['auth_response'],
    initialize:function() {
        this.errormessage = new Element('div', {'class': 'error'});
        this.authdialog = new Element('div', {'id': 'authentication'}).insert([
            new Element('h1', {'html': _('Login')}),
            this.errormessage,
            new Element('form', {
                'method': 'post',
                'id': 'authentication',
                'action': api_url+'login'
            }).insert(
                new Element('table').insert([
                    new Element('tr').insert([
                        new Element('td').insert(
                            new Element('label', {
                                'for': 'authusername',
                                'html': _('Username')
                            })
                        ),
                        new Element('td').insert(
                            new Element('input', {
                                'id': 'authusername',
                                'name': 'username'
                            })
                        )
                    ]),
                    new Element('tr').insert([
                        new Element('td').insert(
                            new Element('label', {
                                'for': 'authpassword',
                                'html': _('Password')
                            })
                        ),
                        new Element('td').insert(
                            new Element('input', {
                                'id': 'authpassword',
                                'name': 'password',
                                'type': 'password'
                            })
                        )
                    ]),
                    new Element('tr').insert(
                        new Element('td', {
                            'class': 'submit', 'colspan': '2'
                        }).insert(
                            new Button('green', 'apply', _('Login'), 'submit')
                        )
                    )
                ])
            ).remotize({'onComplete': this.auth_response})
        ]);
    },
    showdialog: function(errormessage) {
        errormessage = errormessage || "";
        this.errormessage.clean();
        this.errormessage.insert(errormessage);
        dialog(this.authdialog);
    },
    authenticate: function(func, args) {
        // XXX Maybe allow storing multiple functions, I don't know yet if multiple requests can occur before authorization, especially when username and password are known.
        this.func = func;
        this.args = args;
        if (this.username && this.password) {
            // We already know the user's username and password,
            // automatically check they are correct
            Xhr.load(api_url+'login', {
                'method': 'post',
                'params': {
                    'username': this.username,
                    'password': this.password
                }
            }).onComplete(this.auth_response);
        } else {
            this.showdialog();
        };
    },
    auth_response: function(response) {
        var resp = response.responseJSON;
        if (resp.status == 401) {
            this.showdialog(_('Invalid username or password...'));
        } else {
            if ($('dialog').visible() && this.authdialog.visible()) {
                this.username = $('authusername').value();
                this.password = $('authpassword').value();
                dialog(new Element('span').insert([
                    new Element('img', {'width':'16', 'height':'16', 'src':static_url+'image/loading.gif'}),
                    new Element('span', {'html': ' '+_('Loading...')})
                ]));
            };
            this.key = resp.response.key;
            this.func.apply(this, this.args);
        };
    },
    logout: function() {
        // No need to delete these information because they will be lost when reloading the page
        //delete this.key;
        //delete this.username;
        //delete this.password;
        window.location.reload();
    },
});

init.on('browserlocaleloaded', function() {
    authentication = new Authentication();
    init.fire('authready');
});

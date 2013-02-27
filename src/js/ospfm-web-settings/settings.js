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
"use strict";

/****************************** Settings screen ******************************/

// TODO Improve the settings screen to make it more user-friendly

var SettingsScreen = new Class(Screen, {
    prebind: ['resize'],
    url:'/settings',
    element:function() {
        var personal_information_form,
            widgets_move_button,
            widgets_apply_button,
            widgets_screen_buttons,
            widgets_screen,
            firstnameinput         = new Input({
                                            'name': 'firstname',
                                            'id': 'firstnamesetting',
                                            'value': user_me.first_name()
                                        }),
            lastnameinput          = new Input({
                                            'name': 'lastname',
                                            'id': 'lastnamesetting',
                                            'value': user_me.last_name()
                                        }),
            preferredcurrencyinput = global_currencies.htmlselect(
                                            user_me.preferred_currency(),
                                            'currency'
                                        ).set('id','preferredcurrencysetting'),
            localesinput           = new Element('select', {
                                            'id': 'languagesetting',
                                            'name': 'language'
                                        }),
            emails_form            = new Form(),
            unused_widgets         = new Element('ul', {'id':'unusedwidgets'});
        this.title = new Element('h1', {'html': _('Settings')});
        this.tabs = new Tabs();
        this.container = new Element('div')
                             .setStyle('overflow', 'auto')
                             .insert(this.tabs);
        this.buttons = new Element('div', {
                                'class': 'bottombuttons'
                            }).insert(
                                new Button('blue', 'close', _('Close'))
                                    .onClick(screens.back)
                            );

        ///// Personal information

        // Global information
        Xhr.load('/locales', {
            onSuccess: function(response) {
                response.responseJSON.locales.forEach(function(loc) {
                    var option = new Element('option', {
                                    'value': loc
                                }).insert(
                                    l10n_locales[loc]
                                );
                    if (loc == preferences.get('ospfm-web-locale')) {
                        option._.defaultSelected = true;
                    };
                    localesinput.insert(option);
                });
            }
        });
        user_me.on('changed name', function() {
            firstnameinput.setValue(user_me.first_name());
            lastnameinput.setValue(user_me.last_name());
        });
        personal_information_form = new Form().insert(
            new Element('table', {'class': 'personalinfo'}).insert([
                new Element('tr').insert([
                    new Element('td').insert(
                        new Element('label',{'html':_('Interface language')})
                            .set('for', 'languagesetting')
                    ),
                    new Element('td').insert(
                        localesinput
                    )
                ]),
                new Element('tr').insert([
                    new Element('td').insert(
                        new Element('label',{'html':_('First name')})
                            .set('for', 'firstnamesetting')
                    ),
                    new Element('td').insert(
                        firstnameinput
                    )
                ]),
                new Element('tr').insert([
                    new Element('td').insert(
                        new Element('label',{'html':_('Last name')})
                            .set('for', 'lastnamesetting')
                    ),
                    new Element('td').insert(
                        lastnameinput
                    )
                ]),
                new Element('tr').insert([
                    new Element('td').insert(
                        new Element('label',{'html':_('Preferred currency')})
                            .set('for', 'preferredcurrencysetting')
                    ),
                    new Element('td').insert(
                        preferredcurrencyinput
                    )
                ]),
                new Element('tr').insert(
                    new Element('td', {
                        'class': 'submit', 'colspan': '2'
                    }).insert(
                        new Button('green', 'apply', _('Apply'), 'submit')
                    )
                )
            ])
        ).onSubmit(function(event) {
            var values   = event.currentTarget.values(),
                language = values.language;
            event.preventDefault();
            user_me.update({
                'first_name': values.firstname,
                'last_name': values.lastname,
                'preferred_currency': values.currency
            });
            if (language != locale.full || init.first_run) {
                preferences.set('ospfm-web-locale', language);
            }
        });

        // Email addresses
        function emails_table() {
            var email,
                confirmcell,
                addresscell,
                emailinput,
                buttonscell,
                addrow,
                formrow,
                table  = new Element('div', {'class': 'editobjects'}),
                emails = user_me.data.emails;
            emails_form.add = [];
            emails_form.del = [];
            emails_form.notif = [];
            emails_form.stopnotif = [];
            function enable_notifications(event) {
                var btn       = event.currentTarget,
                    address   = btn.parent().parent()
                                .first('span.emailaddress').text(),
                    notif     = emails_form.notif,
                    stopnotif = emails_form.stopnotif,
                    position  = stopnotif.indexOf(address);
                if (position == -1) {
                    notif.push(address)
                } else {
                    stopnotif.splice(position, 1);
                };
                btn.replace(
                    new Button('green', 'mail')
                        .tooltip(_('Disable notifications to this address'))
                        .onClick(disable_notifications)
                );
            };
            function disable_notifications(event) {
                var btn       = event.currentTarget,
                    address   = btn.parent().parent()
                                .first('span.emailaddress').text(),
                    notif     = emails_form.notif,
                    stopnotif = emails_form.stopnotif,
                    position  = notif.indexOf(address);
                if (position == -1) {
                    stopnotif.push(address)
                } else {
                    notif.splice(position, 1);
                };
                btn.replace(
                    new Button('red', 'mail')
                        .tooltip(_('Enable notifications to this address'))
                        .onClick(enable_notifications)
                );
            };
            emails.forEach(function(email) {
                confirmcell = new Element('span', {'class': 'editcell'});
                addresscell = new Element('span', {
                    'class': 'editcell emailaddress'
                }).insert(
                    email['address']
                );
                buttonscell = new Element('span', {
                    'class':'buttonscell'
                }).insert(
                    new Button('red', 'del')
                    .tooltip(_('Delete'))
                    .onClick(function(event) {
                        // When deleting an address...
                        var position,
                            btn        = event.currentTarget,
                            address    = btn.parent().parent()
                                         .first('span.emailaddress'),
                            notif      = emails_form.notif,
                            stopnotif  = emails_form.stopnotif,
                            theaddress = address.text();
                        btn.disable().siblings('button')
                                     .each('disable');
                        address.setStyle(
                            'text-decoration',
                            'line-through'
                        );
                        emails_form.del.push(theaddress);
                        position = notif.indexOf(theaddress);
                        if (position != -1) {
                            notif.splice(position, 1);
                        };
                        position = stopnotif.indexOf(theaddress);
                        if (position != -1) {
                            stopnotif.splice(position, 1);
                        };
                    })
                );
                if (email.confirmed) {
                    confirmcell.insert(
                        new Icon('valid')
                           .addClass('valid')
                           .tooltip(_('This email address has been confirmed'))
                    )
                } else {
                    confirmcell.insert(
                        new Icon('invalid')
                            .addClass('error')
                            .tooltip(_('You should confirm this email address by<br/>answering to the email that has been sent to you'))
                    );
                };
                if (email.confirmed) {
                    if (email.notification) {
                        buttonscell.insert(
                            new Button('green', 'mail')
                               .tooltip(_('Disable notifications to this address'))
                               .onClick(disable_notifications),
                            'top'
                        );
                    } else {
                        buttonscell.insert(
                            new Button('red', 'mail')
                                .tooltip(_('Enable notifications to this address'))
                                .onClick(enable_notifications),
                            'top'
                        );
                    };
                } else {
                    buttonscell.insert(
                        new Button('green', 'mail').disable()
                            .tooltip(_('Notifications cannot be enabled<br>on an unconfirmed address')),
                        'top'
                    );
                };
                table.insert(
                    new Element('div', {'class':'editrow'}).insert([
                        confirmcell,
                        addresscell,
                        buttonscell
                    ])
                )
            });
            emailinput = new Input().set(
                'placeholder', _('New email address')
            ),
            addrow = new Element('div', {'class': 'addrow'}).insert([
                new Element('span', {'class': 'editcell emailaddress'}).insert(
                    emailinput
                ),
                new Element('span', {'class': 'buttonscell'}).insert(
                    new Button('blue', 'add', _('Add')).onClick(function() {
    // Indentation is not respected because of the deepness of this stuff...
    var address = emailinput.getValue();
    if (address) {
        if (address.indexOf('@') == -1) {
            dialog(_('Invalid email address'));
        } else {
            addrow.insert(
                new Element('div', {'class':'editrow'}).insert([
                    new Element('span', {'class': 'editcell'}).insert(
                        new Icon('invalid')
                            .addClass('blue')
                            .tooltip(_('A confirmation email will be sent<br/>after applying modifications'))
                    ),
                    new Element('span', {'class': 'editcell emailaddress'})
                        .insert(emailinput.getValue()),
                    new Element('span', {'class': 'buttonscell'}).insert([
                        new Button('green', 'mail').disable()
                            .tooltip(_('Notifications cannot be enabled<br>on an unconfirmed address')),
                        new Button('red', 'del')
                            .tooltip(_('Delete'))
                            .onClick(function(event) {
                                var line    = event.currentTarget
                                                .parent().parent(),
                                    adds    = emails_form.add;
                                    adds.splice(
                                        adds.indexOf(
                                            line.first('span.emailaddress')
                                                .text()
                                        ),
                                    1);
                                line.remove();
                            })
                    ])
                ]),
                'before'
            );
            emails_form.add.push(address);
        };
    };
    emailinput.setValue('');
                    })
                )
            ]);
            formrow = new Element('div', {'class': 'addrow'}).insert([
                new Button('green', 'apply', _('Apply'), 'submit'),
                new Button('blue', 'cancel', _('Cancel'), 'reset'),
            ]);
            return table.insert([addrow, formrow]);
        };

        emails_form.insert(emails_table())
            .onSubmit(function(event) {
                var requestdata          = {},
                    add                  = emails_form.add,
                    del                  = emails_form.del,
                    enablenotifications  = emails_form.notif,
                    disablenotifications = emails_form.stopnotif;
                event.preventDefault();
                if (add.length) {
                    requestdata.add = add;
                };
                if (del.length) {
                    requestdata.remove = del;
                };
                if (enablenotifications.length) {
                    requestdata.enablenotifications = enablenotifications;
                };
                if (disablenotifications.length) {
                    requestdata.disablenotifications = disablenotifications;
                };
                user_me.update({
                    'emails': JSON.stringify(requestdata)
                });
            })
            .onReset(function(event) {
                event.preventDefault();
                emails_form.update(emails_table());
            });
        user_me.on('changed emails', function() {
            emails_form.update(emails_table());
        });

        // Widgets
        (function () {
            // Slight delay when displaying unused widgets so the "init" part
            // in widgets.js has enough time to remove used widgets from
            // widgets.unused, when loading this page first
            widgets.unused.forEach(function(widget) {
                unused_widgets.insert(widgets.get(widget));
            });
        }).delay(10);
        widgets_move_button = new Button('blue', 'move', _('Move widgets'))
        .onClick(function() {
            widgets_screen_buttons.update(
                widgets_apply_button
            )
            start_move_widgets()
        });
        widgets_apply_button = new Button('green', 'apply', _('Apply'))
        .onClick(function() {
            widgets_screen_buttons.update(
                widgets_move_button
            )
            end_move_widgets()
        });
        widgets_screen_buttons = new Element('div').insert(
            widgets_move_button
        );
        widgets_screen = new Element('div').insert([
            new Element('p', {'html':
                _('Click on "Move widgets" to configure the widgets you want to be displayed, on the left or on top of the screen.')
            }),
            widgets_screen_buttons,
            unused_widgets
        ]);
        // Personal information subtabs
        this.tabs.addTab(
            _('Personal information'),
            'personal',
            new Element('div').insert(
                new Tabs().addTab(
                    _('General information'),
                    'general',
                    personal_information_form,
                    true
                ).addTab(
                    _('Email addresses'),
                    'email',
                    new Element('div').insert([
                        new Element('p', {
                            'html': _('Email addresses allow your friends and acquaintances to find you in order to create debts between you. They are also used to send notifications.')
                        }),
                        emails_form
                    ])
                ).addTab(
                    _('Contacts'),
                    'contacts',
                    contacts.htmledit(['fullname', 'comment'])
                ).addTab(
                    _('Widgets'),
                    'widgets',
                    widgets_screen
                )
            ),
            true
        )

        ///// Accounts
        this.tabs.addTab(
            _('Accounts'),
            'accounts',
            accounts.htmledit(['name', 'currency', 'start_balance'])
        );

        ///// Categories
        this.tabs.addTab(
            _('Categories'),
            'categories',
            new Element('div').insert(
                categories.htmledit(['name', 'currency'])
            )
        );

        ///// Currencies
        this.tabs.addTab(
            _('Currencies'),
            'currencies',
            new Element('div').insert([
                new Element('p', {
                    'html': _('Personal currencies allow you to manage other payment means: vouchers, etc.')
                }),
                own_currencies.htmledit(['name', 'symbol', 'rate'])
            ])
        );

        // Take all the available space when resizing window
        $(window).onResize(this.resize);

        return [
                this.title,
                new Element('div', {
                    'class':'onlysmall',
                    'html':_('Please use a larger screen to change settings')
                }),
                this.container.addClass('notsmall'),
                this.buttons
        ]
    },
    load:function(url, hash) {
        if (hash) {
            this.tabs.loadfromhash(hash);
        };
        this.resize()
    },
    resize:function() {
        this.container.setHeight(
            $('maincontent').size().y - this.title.size().y -
            this.tabs.tabs.size().y - this.buttons.size().y - 32
        );
    }
});

function start_move_widgets() {
    var side_widgets   = $('sidewidgets'),
        top_widgets    = $('topwidgets'),
        unused_widgets = $('unusedwidgets'),
        side_movable   = new Sortable({'handleCss':'span.widgethandle'})
                            .set('id', 'sidewidgets'),
        top_movable    = new Sortable({'handleCss':'span.widgethandle'})
                            .set('id', 'topwidgets'),
        unused_movable = new Sortable({'handleCss':'span.widgethandle'})
                            .set('id', 'unusedwidgets');
    // Add handle
    $$('span.widgeticon').each(function(element) {
        element.parent().insert(
            new Icon('move').addClass('widgethandle'),
            'before'
        )
    });
    // Make side widgets movable
    side_widgets.children().each(function(element) {
        side_movable.insert(element);
    });
    side_movable.insert(new Element('li', {'class': 'placeholderwidget'}));
    side_widgets.replace(side_movable);
    // Make top widgets movable
    top_widgets.children().each(function(element) {
        top_movable.insert(element);
    });
    top_movable.insert(new Element('li', {'class': 'placeholderwidget'}));
    top_widgets.replace(top_movable);
    // Make unused widgets movable
    unused_widgets.children().each(function(element) {
        unused_movable.insert(element);
    });
    unused_movable.insert(new Element('li', {'class': 'placeholderwidget'}));
    unused_widgets.replace(unused_movable);
    // Make widgets movable between lists
    side_movable.setOptions({'accept':[top_movable, unused_movable]});
    top_movable.setOptions({'accept':[side_movable, unused_movable]});
    unused_movable.setOptions({'accept':[side_movable, top_movable]});
};

function end_move_widgets() {
    var side_movable   = $('sidewidgets'),
        top_movable    = $('topwidgets'),
        unused_movable = $('unusedwidgets'),
        side_result    = [],
        top_result     = [],
        side_widgets   = new Element('ul').set('id', 'sidewidgets'),
        top_widgets    = new Element('ul').set('id', 'topwidgets'),
        unused_widgets = new Element('ul').set('id', 'unusedwidgets');
    // Save the new positions for side widgets
    side_movable.children().each(function(element) {
        var id = element.get('id');
        if (id && id.indexOf('widget-') == 0) {
            side_result.push(id.split('-')[1]);
        }
    });
    preferences.set('ospfm-web-sidewidgets', side_result);
    // Save the new positions for top widgets
    top_movable.children().each(function(element) {
        var id = element.get('id');
        if (id && id.indexOf('widget-') == 0) {
            top_result.push(id.split('-')[1]);
        }
    });
    preferences.set('ospfm-web-topwidgets', top_result);
    // Remove handle
    $$('span.widgethandle').each('remove');
    // Side widgets not movable anymore
    side_movable.children('.widget').each(function(element) {
        side_widgets.insert(element);
    });
    side_movable.replace(side_widgets);
    // Top widgets not movable anymore
    top_movable.children('.widget').each(function(element) {
        top_widgets.insert(element);
    });
    top_movable.replace(top_widgets);
    // Unused widgets not movable anymore
    unused_movable.children('.widget').each(function(element) {
        unused_widgets.insert(element);
    });
    unused_movable.replace(unused_widgets);
};

// Put this screen in the list
screens.add(
    new SettingsScreen()
);